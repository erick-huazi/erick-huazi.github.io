import * as THREE from './vendor/three-0.186.1/three.module.js';

// Original mineral-colour ribbons, orbital sculptures and a camera journey.
// All geometry is procedural; no external model, texture or character is used.
export async function createSpatialIntro({ root, mount, isEligible, onPhase, onFailure }) {
  const assertEligible = () => {
    if (typeof isEligible !== 'function' || !isEligible()) {
      throw new DOMException('Spatial intro is no longer eligible.', 'AbortError');
    }
  };
  assertEligible();
  const { gsap } = await import('./vendor/gsap-3.15.0/gsap-core.js');
  assertEligible();
  const { CSSPlugin } = await import('./vendor/gsap-3.15.0/CSSPlugin.js');
  assertEligible();
  const { ScrollTrigger } = await import('./vendor/gsap-3.15.0/ScrollTrigger.js');
  assertEligible();

  if (!gsap || !ScrollTrigger) throw new Error('Spatial animation dependencies are unavailable.');
  if (!root || !mount || !root.contains(mount)) throw new TypeError('A connected spatial mount is required.');
  gsap.registerPlugin(CSSPlugin, ScrollTrigger);

  const geometries = new Set();
  const materials = new Set();
  const geometry = value => { geometries.add(value); return value; };
  const material = value => { materials.add(value); return value; };
  const pose = { x: 0, y: 0.75, z: 20, lookX: 0, lookY: 0 };
  const pointer = { x: 0, y: 0 };
  const finePointer = matchMedia('(min-width: 960px) and (hover: hover) and (pointer: fine)');
  let renderer;
  let scene;
  let camera;
  let timeline;
  let ambientTimeline;
  let trigger;
  let resizeObserver;
  let resizeFrame = 0;
  let ambientScrollFrame = 0;
  let pointerTween;
  let active = false;
  let destroyed = false;
  let failed = false;
  let bound = false;
  let frames = 0;
  let progress = 0;
  let lastWidth = 0;
  let lastHeight = 0;
  let lastDpr = 0;

  const navHeight = () => document.querySelector('.nav')?.getBoundingClientRect().height || 0;
  const visible = () => {
    if (!root.isConnected || !mount.isConnected || document.hidden) return false;
    const bounds = root.getBoundingClientRect();
    return bounds.width > 0 && bounds.height > 0 && bounds.bottom > navHeight()
      && bounds.top < window.innerHeight;
  };

  function stopPointer() {
    pointerTween?.kill();
    pointerTween = undefined;
    pointer.x = 0;
    pointer.y = 0;
  }

  function detach() {
    if (resizeFrame) cancelAnimationFrame(resizeFrame);
    resizeFrame = 0;
    if (ambientScrollFrame) cancelAnimationFrame(ambientScrollFrame);
    ambientScrollFrame = 0;
    resizeObserver?.disconnect();
    window.removeEventListener('resize', queueResize);
    window.removeEventListener('scroll', queueAmbientSync);
    root.removeEventListener('pointermove', onPointerMove);
    root.removeEventListener('pointerleave', onPointerLeave);
    bound = false;
  }

  function fail(error) {
    if (destroyed || failed) return;
    failed = true;
    active = false;
    detach();
    stopPointer();
    trigger?.disable(false);
    timeline?.pause();
    ambientTimeline?.pause();
    if (typeof onFailure === 'function') onFailure(error);
  }

  function render() {
    if (!active || destroyed || failed || !isEligible() || !visible()) return;
    try {
      camera.position.set(pose.x + pointer.x, pose.y + pointer.y, pose.z);
      camera.lookAt(pose.lookX + pointer.x * 0.2, pose.lookY + pointer.y * 0.2, pose.z - 20);
      renderer.render(scene, camera);
      root.dataset.spatialFrames = String(++frames);
    } catch (error) { fail(error); }
  }

  // Scroll choreography and ambient rotation use distinct object properties.
  // Do not run the ambient ticker while covered, paused or outside the viewport.
  function syncAmbient() {
    if (!ambientTimeline) return;
    if (active && !destroyed && !failed && isEligible() && visible()) ambientTimeline.play();
    else ambientTimeline.pause();
  }

  // The section can become partly visible again while ScrollTrigger stays at
  // progress 1. Coalesce native scroll events to recheck the visible area.
  function queueAmbientSync() {
    if (!active || destroyed || failed || ambientScrollFrame) return;
    ambientScrollFrame = requestAnimationFrame(() => {
      ambientScrollFrame = 0;
      syncAmbient();
    });
  }

  function applyProgress(value) {
    if (!active || destroyed || failed) return;
    progress = Math.max(0, Math.min(1, Number(value) || 0));
    timeline.progress(progress, true);
    syncAmbient();
    if (typeof onPhase === 'function') onPhase(Math.min(2, Math.floor(progress * 3)), progress);
    render();
  }

  function measureSize() {
    const bounds = mount.getBoundingClientRect();
    const width = Math.round(bounds.width);
    const height = Math.round(bounds.height);
    if (width < 2 || height < 2) throw new Error('Spatial stage has no usable size.');
    const dpr = Math.min(1.5, Math.max(0.75, window.devicePixelRatio || 1));
    if (width === lastWidth && height === lastHeight && dpr === lastDpr) return;
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.fov = camera.aspect < 0.8 ? 61 : 50;
    camera.updateProjectionMatrix();
    lastWidth = width;
    lastHeight = height;
    lastDpr = dpr;
  }

  function refresh() {
    if (!active || destroyed || failed || !isEligible()) return;
    try {
      measureSize();
      trigger?.refresh();
      applyProgress(trigger?.progress ?? progress);
    } catch (error) { fail(error); }
  }

  function queueResize() {
    if (!active || destroyed || failed || resizeFrame) return;
    resizeFrame = requestAnimationFrame(() => { resizeFrame = 0; refresh(); });
  }

  function movePointer(x, y) {
    if (!active || destroyed || failed || !isEligible() || !visible()) return;
    pointerTween?.kill();
    pointerTween = gsap.to(pointer, {
      x, y, duration: 0.5, ease: 'power2.out', overwrite: true,
      onUpdate: render,
      onComplete: () => { pointerTween = undefined; }
    });
  }

  function onPointerMove(event) {
    if (!finePointer.matches || event.pointerType === 'touch') return;
    if (event.target instanceof Element && event.target.closest('a,button,input,select,textarea,summary,[role="button"]')) {
      movePointer(0, 0);
      return;
    }
    const bounds = mount.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) return;
    const x = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1));
    const y = Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1));
    movePointer(x * 0.65, -y * 0.35);
  }

  function onPointerLeave() { movePointer(0, 0); }

  function onContextLost(event) {
    event.preventDefault();
    fail(new Error('Spatial rendering context was lost.'));
  }

  function setActive(value) {
    if (destroyed) return;
    if (!value) {
      active = false;
      detach();
      stopPointer();
      trigger?.disable(false);
      timeline?.pause();
      ambientTimeline?.pause();
      return;
    }
    if (failed || !isEligible()) return;
    if (active) { refresh(); return; }
    active = true;
    try {
      measureSize();
      if (!trigger) {
        trigger = ScrollTrigger.create({
          trigger: root,
          start: () => `top top+=${navHeight()}`,
          end: 'bottom bottom',
          animation: timeline,
          scrub: true,
          // The timeline's world coordinates are fixed. Only the scroll range
          // is refreshed; invalidating it would resample already-moved poses.
          invalidateOnRefresh: false,
          onUpdate: self => applyProgress(self.progress),
          onRefresh: self => applyProgress(self.progress)
        });
      } else {
        trigger.enable(false, false);
        trigger.refresh();
      }
      if (!bound) {
        if ('ResizeObserver' in window) {
          resizeObserver ||= new ResizeObserver(queueResize);
          resizeObserver.observe(mount);
        }
        window.addEventListener('resize', queueResize, { passive: true });
        window.addEventListener('scroll', queueAmbientSync, { passive: true });
        root.addEventListener('pointermove', onPointerMove, { passive: true });
        root.addEventListener('pointerleave', onPointerLeave, { passive: true });
        bound = true;
      }
      applyProgress(trigger.progress);
    } catch (error) { fail(error); }
  }

  function destroy() {
    if (destroyed) return;
    // Mark inactive before disposing anything: old plugin callbacks become no-ops.
    active = false;
    destroyed = true;
    detach();
    stopPointer();
    trigger?.kill(false);
    trigger = undefined;
    timeline?.kill();
    timeline = undefined;
    ambientTimeline?.kill();
    ambientTimeline = undefined;
    renderer?.domElement.removeEventListener('webglcontextlost', onContextLost);
    scene?.clear();
    geometries.forEach(value => value.dispose());
    materials.forEach(value => value.dispose());
    geometries.clear();
    materials.clear();
    if (renderer) {
      renderer.dispose();
      // Remove our loss listener first so deliberate disposal cannot activate
      // the parent's static fallback a second time.
      renderer.forceContextLoss();
      renderer.domElement.remove();
      renderer = undefined;
    }
  }

  try {
    assertEligible();
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    renderer.domElement.setAttribute('role', 'presentation');
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xf4ebdd, 0.021);
    camera = new THREE.PerspectiveCamera(50, 1, 0.1, 110);
    scene.add(new THREE.HemisphereLight(0xfff4df, 0x2f5148, 2.5));
    const key = new THREE.DirectionalLight(0xfff6e5, 2.2);
    key.position.set(8, 9, 16);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xd7eadf, 1.15);
    fill.position.set(-9, 3, -14);
    scene.add(fill);

    const box = geometry(new THREE.BoxGeometry(1, 1, 1));
    const gold = material(new THREE.MeshStandardMaterial({ color: '#B58A45', roughness: 0.4, metalness: 0.58 }));
    const edge = material(new THREE.LineBasicMaterial({ color: '#B58A45', transparent: true, opacity: 0.78 }));
    const addBox = (parent, size, position, surface) => {
      const mesh = new THREE.Mesh(box, surface);
      mesh.scale.set(...size);
      mesh.position.set(...position);
      parent.add(mesh);
      return mesh;
    };
    const addFrame = (z, width, height, tilt = 0) => {
      const frame = new THREE.Group();
      frame.position.z = z;
      frame.rotation.z = tilt;
      const line = 0.065;
      addBox(frame, [line, height, line], [-width / 2, 0, 0], gold);
      addBox(frame, [line, height, line], [width / 2, 0, 0], gold);
      addBox(frame, [width, line, line], [0, height / 2, 0], gold);
      addBox(frame, [width, line, line], [0, -height / 2, 0], gold);
      scene.add(frame);
      return frame;
    };
    addFrame(7, 12.9, 11.1);
    addFrame(-11, 12, 10.8, -0.065);
    addFrame(-27, 11, 10, 0.065);

    // Orbital sculptures make the opening immediately legible as 3D: an
    // asymmetric mineral core, tilted metal rings and a tracery of star points.
    // Every object is owned by this scene and disposed through the sets above.
    const jade = material(new THREE.MeshStandardMaterial({
      color: '#146256', roughness: 0.3, metalness: 0.38,
      emissive: '#07392f', emissiveIntensity: 0.35
    }));
    const jadeLight = material(new THREE.MeshStandardMaterial({
      color: '#67a18a', roughness: 0.44, metalness: 0.24
    }));
    const cinnabar = material(new THREE.MeshStandardMaterial({
      color: '#a83e2b', roughness: 0.42, metalness: 0.2
    }));
    const pearl = material(new THREE.MeshStandardMaterial({
      color: '#f3dfb7', roughness: 0.44, metalness: 0.17,
      emissive: '#bb7437', emissiveIntensity: 0.18
    }));
    const wireGold = material(new THREE.MeshBasicMaterial({
      color: '#e1bc76', wireframe: true, transparent: true, opacity: 0.35,
      depthWrite: false
    }));
    const sphere = geometry(new THREE.IcosahedronGeometry(1.38, 3));
    const wireSphere = geometry(new THREE.IcosahedronGeometry(1.405, 1));
    const dot = geometry(new THREE.IcosahedronGeometry(0.14, 1));
    const ringThin = geometry(new THREE.TorusGeometry(3.05, 0.035, 8, 128));
    const ringWide = geometry(new THREE.TorusGeometry(2.48, 0.065, 10, 128));
    const ringFine = geometry(new THREE.TorusGeometry(3.62, 0.018, 6, 128));
    const dialLines = geometry(new THREE.BufferGeometry());
    const dialSegments = [];
    for (let i = 0; i < 72; i += 1) {
      const angle = i / 72 * Math.PI * 2;
      const inner = i % 6 === 0 ? 3.18 : 3.28;
      const outer = 3.43;
      dialSegments.push(Math.cos(angle) * inner, Math.sin(angle) * inner, 0,
        Math.cos(angle) * outer, Math.sin(angle) * outer, 0);
    }
    dialLines.setAttribute('position', new THREE.Float32BufferAttribute(dialSegments, 3));
    const dialInk = material(new THREE.LineBasicMaterial({
      color: '#b68a47', transparent: true, opacity: 0.65
    }));
    function createOrbit(x, y, z, scale) {
      const group = new THREE.Group();
      group.position.set(x, y, z);
      group.scale.setScalar(scale);
      const core = new THREE.Mesh(sphere, jade);
      group.add(core);
      group.add(new THREE.Mesh(wireSphere, wireGold));
      const centralBand = new THREE.Mesh(ringWide, gold);
      centralBand.rotation.set(0.95, 0.25, -0.45);
      group.add(centralBand);
      const outerBand = new THREE.Mesh(ringThin, gold);
      outerBand.rotation.set(0.32, 0.95, 0.23);
      group.add(outerBand);
      const haloRotor = new THREE.Group();
      haloRotor.rotation.set(-0.16, 0.15, -0.16);
      haloRotor.add(new THREE.Mesh(ringFine, gold));
      haloRotor.add(new THREE.LineSegments(dialLines, dialInk));
      group.add(haloRotor);
      const orbitalNodes = new THREE.Group();
      for (let i = 0; i < 7; i += 1) {
        const angle = i / 7 * Math.PI * 2 + 0.2;
        const node = new THREE.Mesh(dot, i % 3 === 0 ? cinnabar : i % 3 === 1 ? pearl : jadeLight);
        node.position.set(Math.cos(angle) * 2.95, Math.sin(angle) * 1.85, Math.sin(angle) * 1.85);
        node.scale.setScalar(i === 0 ? 2.0 : 1 + (i % 2) * 0.35);
        orbitalNodes.add(node);
      }
      group.add(orbitalNodes);
      scene.add(group);
      return { group, core, centralBand, outerBand, orbitalNodes, haloRotor };
    }
    const orbitFront = createOrbit(3.25, 0.2, 4, 1);
    const orbitFar = createOrbit(-2.7, 0.6, -21, 0.74);
    orbitFar.group.rotation.z = 0.45;

    // A seeded, single-draw-call dust field gives depth without a timer or
    // continuous animation loop. Scroll changes the camera and constellation.
    const dustValues = [];
    let seed = 72193;
    const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    for (let i = 0; i < 360; i += 1) {
      dustValues.push((random() - 0.5) * 25, (random() - 0.5) * 15, 9 - random() * 52);
    }
    const dustGeometry = geometry(new THREE.BufferGeometry());
    dustGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dustValues, 3));
    const dustMaterial = material(new THREE.PointsMaterial({
      color: '#b88742', size: 0.07, transparent: true, opacity: 0.67,
      depthWrite: false, sizeAttenuation: true
    }));
    const dust = new THREE.Points(dustGeometry, dustMaterial);
    scene.add(dust);

    const ribbons = new THREE.Group();
    scene.add(ribbons);
    function addRibbon({ color, phase, width, y = 0, x = 0, turns = 1.08 }) {
      const count = 160;
      const positions = [];
      const triangles = [];
      const edges = [[], []];
      for (let i = 0; i <= count; i += 1) {
        const t = i / count;
        const angle = t * Math.PI * 2 * turns + phase;
        const centre = new THREE.Vector3(
          Math.sin(angle) * 4.7 + Math.sin(t * Math.PI * 3 + phase) * 0.8 + x,
          Math.cos(angle * 0.9) * 2.35 + Math.sin(t * Math.PI * 4 + phase) * 0.4 + y,
          4 - t * 39
        );
        const span = width * (0.82 + Math.sin(t * Math.PI) * 0.18);
        const direction = new THREE.Vector3(Math.cos(angle + 0.6), Math.sin(angle + 0.6), Math.sin(angle * 2) * 0.15);
        direction.normalize();
        [-1, 1].forEach((side, sideIndex) => {
          const point = centre.clone().addScaledVector(direction, side * span / 2);
          positions.push(point.x, point.y, point.z);
          edges[sideIndex].push(centre.clone().addScaledVector(direction, side * (span / 2 + 0.018)));
        });
        if (i < count) {
          const a = i * 2;
          triangles.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
        }
      }
      const surface = geometry(new THREE.BufferGeometry());
      surface.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      surface.setIndex(triangles);
      surface.computeVertexNormals();
      const ink = material(new THREE.MeshStandardMaterial({
        color, roughness: color === '#B58A45' ? 0.45 : 0.67,
        metalness: color === '#B58A45' ? 0.5 : 0.12, side: THREE.DoubleSide
      }));
      ribbons.add(new THREE.Mesh(surface, ink));
      edges.forEach(points => ribbons.add(new THREE.Line(geometry(new THREE.BufferGeometry().setFromPoints(points)), edge)));
    }
    addRibbon({ color: '#A83E2B', phase: 0.15, width: 2.65, y: 0.25 });
    addRibbon({ color: '#155E52', phase: 2.22, width: 2.8, y: -0.35, x: 0.4 });
    addRibbon({ color: '#B58A45', phase: 4.1, width: 1.28, y: 0.15, turns: 1.02 });

    timeline = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
    timeline.to(pose, { z: 9.5, x: 0.7, y: 0.4, lookX: -0.4, lookY: 0.2, duration: 0.34 }, 0);
    timeline.to(pose, { z: -3.5, x: -0.8, y: -0.5, lookX: 0.6, lookY: -0.3, duration: 0.36 }, 0.34);
    timeline.to(pose, { z: -15, x: 0.15, y: 0.45, lookX: 0, lookY: 0.4, duration: 0.3 }, 0.7);
    timeline.to(orbitFront.group.rotation, { y: 0.8, z: 0.7, duration: 1 }, 0);
    timeline.to(orbitFront.centralBand.rotation, { x: 2.3, z: 0.65, duration: 1 }, 0);
    timeline.to(orbitFront.outerBand.rotation, { y: 2.6, z: -0.55, duration: 1 }, 0);
    timeline.to(orbitFront.orbitalNodes.rotation, { x: 0.7, z: 2.4, duration: 1 }, 0);
    timeline.to(orbitFar.group.rotation, { x: 0.6, y: -0.8, z: -0.9, duration: 1 }, 0);
    timeline.to(orbitFar.orbitalNodes.rotation, { y: 0.9, z: -1.8, duration: 1 }, 0);
    timeline.to(dust.rotation, { z: 0.12, duration: 1 }, 0);
    timeline.to(ribbons.rotation, { z: 0.14, x: 0.02, duration: 1 }, 0);
    timeline.to(ribbons.position, { x: 0.4, y: -0.2, duration: 1 }, 0);
    timeline.pause(0, true);

    // A separate, paused-at-creation loop lets the sculpture breathe without
    // moving the camera or fighting scroll-controlled parent/ring rotations.
    // Both timelines pause on dialog, document visibility, motion preference,
    // offscreen state, WebGL failure and teardown through setActive/fail/destroy.
    ambientTimeline = gsap.timeline({
      paused: true, repeat: -1,
      onUpdate: () => {
        if (!active || destroyed || failed || !isEligible() || !visible()) {
          ambientTimeline?.pause();
          return;
        }
        render();
      }
    });
    ambientTimeline.to(orbitFront.core.rotation, { y: Math.PI * 2, duration: 21.6, ease: 'none' }, 0);
    ambientTimeline.to(orbitFar.core.rotation, { y: -Math.PI * 2, duration: 21.6, ease: 'none' }, 0);
    ambientTimeline.to(orbitFront.haloRotor.rotation, { z: Math.PI * 2 - 0.16, duration: 21.6, ease: 'none' }, 0);
    ambientTimeline.to(orbitFar.haloRotor.rotation, { z: -Math.PI * 2 - 0.16, duration: 21.6, ease: 'none' }, 0);
    ambientTimeline.to(orbitFront.core.scale, {
      x: 1.055, y: 1.055, z: 1.055, duration: 3.6, repeat: 5, yoyo: true, ease: 'sine.inOut'
    }, 0);
    ambientTimeline.to(orbitFar.core.scale, {
      x: 1.045, y: 1.045, z: 1.045, duration: 3.6, repeat: 5, yoyo: true, ease: 'sine.inOut'
    }, 0);

    assertEligible();
    root.dataset.spatialFrames = '0';
    mount.append(renderer.domElement);
    // Activation, initial sizing and ScrollTrigger creation belong to the caller
    // after its enhanced layout has become ready.
    return { setActive, refresh, destroy };
  } catch (error) {
    destroy();
    throw error;
  }
}
