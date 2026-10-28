import * as THREE from './vendor/three-0.186.1/three.module.js';

// Original paper doors, mineral-colour ribbons and a camera journey. No external
// model, texture or borrowed character is used; the document supplies all copy.
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
  let trigger;
  let resizeObserver;
  let resizeFrame = 0;
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
    resizeObserver?.disconnect();
    window.removeEventListener('resize', queueResize);
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

  function applyProgress(value) {
    if (!active || destroyed || failed) return;
    progress = Math.max(0, Math.min(1, Number(value) || 0));
    timeline.progress(progress, true);
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
    const paper = material(new THREE.MeshStandardMaterial({ color: '#E6D9BF', roughness: 0.94, metalness: 0.02 }));
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

    const leftDoor = new THREE.Group();
    const rightDoor = new THREE.Group();
    leftDoor.position.set(-6.4, 0, 7.08);
    rightDoor.position.set(6.4, 0, 7.08);
    leftDoor.rotation.y = 0.55;
    rightDoor.rotation.y = -0.55;
    [leftDoor, rightDoor].forEach((door, index) => {
      const sign = index === 0 ? 1 : -1;
      addBox(door, [6.4, 10.9, 0.085], [sign * 3.2, 0, 0], paper);
      addBox(door, [0.025, 10.35, 0.02], [sign * 6.08, 0, 0.055], gold);
      addBox(door, [5.75, 0.025, 0.02], [sign * 3.2, 5.13, 0.055], gold);
      addBox(door, [5.75, 0.025, 0.02], [sign * 3.2, -5.13, 0.055], gold);
      scene.add(door);
    });

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
    timeline.to(leftDoor.rotation, { y: 1.55, duration: 0.34 }, 0);
    timeline.to(rightDoor.rotation, { y: -1.55, duration: 0.34 }, 0);
    timeline.to(ribbons.rotation, { z: 0.14, x: 0.02, duration: 1 }, 0);
    timeline.to(ribbons.position, { x: 0.4, y: -0.2, duration: 1 }, 0);
    timeline.pause(0, true);

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
