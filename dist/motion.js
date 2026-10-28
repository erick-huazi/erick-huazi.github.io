/* Progressive motion: everything is readable before, after, or without JavaScript. */
(() => {
  'use strict';

  function initMotion() {
    const body = document.body;
    if (!body?.matches('.portfolio-v10,.portfolio-v21') || body.dataset.motionReady === 'true') return;
    body.dataset.motionReady = 'true';

    const toggle = document.getElementById('motion-toggle');
    const toggles = [...new Set([toggle, ...document.querySelectorAll('[data-motion-control]')])].filter(Boolean);
    const media = query => typeof window.matchMedia === 'function'
      ? window.matchMedia(query) : { matches: false };
    const reduced = media('(prefers-reduced-motion: reduce)');
    const desktop = media('(hover: hover) and (pointer: fine) and (min-width: 761px)');
    const controls = 'a[href],button,input,select,textarea,summary,[contenteditable="true"],[tabindex]:not([tabindex="-1"])';
    const animations = new Set();
    const revealed = new WeakSet();
    const visibleMedia = new Set();
    const mediaItems = [];
    let preference = 'on';
    let active = false;
    let scrollFrame = null;

    try {
      if (window.localStorage.getItem('erick-motion') === 'off') preference = 'off';
    } catch { /* The control still works when storage is unavailable. */ }

    function resetMedia(item) {
      item.artwork.style.removeProperty('--media-shift');
      ['--v41-rx','--v41-ry','--v41-rz','--v41-depth'].forEach(name => item.artwork.style.removeProperty(name));
    }

    function stopMotion() {
      for (const animation of [...animations]) animation.cancel();
      animations.clear();
      if (scrollFrame !== null) window.cancelAnimationFrame(scrollFrame);
      scrollFrame = null;
      mediaItems.forEach(resetMedia);
    }

    function updateMedia() {
      scrollFrame = null;
      if (!active || !desktop.matches) return;
      if (body.classList.contains('portfolio-v41') && document.querySelector('dialog[open]')) {
        mediaItems.forEach(resetMedia);
        return;
      }
      const viewport = Math.max(window.innerHeight, 1);
      for (const item of visibleMedia) {
        const rect = item.element.getBoundingClientRect();
        if (!rect.height || item.element.closest('[hidden]') || item.element.contains(document.activeElement)) {
          resetMedia(item);
          continue;
        }
        // A small offset through the viewport, never a continuous animation loop.
        const progress = Math.max(-1, Math.min(1, (viewport / 2 - rect.top - rect.height / 2) / viewport));
        item.artwork.style.setProperty('--media-shift', `${(progress * 14).toFixed(2)}px`);
        if (body.classList.contains('portfolio-v41')) {
          // Adapted from Codrops RotatingOnScrollAnimations/js/index.js (MIT,
          // Copyright 2009–2026 Codrops): opposite rotations over the scroll
          // range, with z = sin(progress * PI) * -50. Only the picture layer
          // moves; the card, text, focus targets and native scroll stay put.
          // https://github.com/codrops/RotatingOnScrollAnimations/blob/6c6ea42d3f4f3d122240ec931871afcac80b388e/js/index.js
          const travel = Math.max(0, Math.min(1, (viewport * 1.2 - rect.top) / (viewport * 1.4 + rect.height)));
          const angle = 1 - travel * 2;
          const direction = item.index % 2 ? -1 : 1;
          item.artwork.style.setProperty('--v41-rx', `${(angle * 13).toFixed(2)}deg`);
          item.artwork.style.setProperty('--v41-ry', `${(angle * direction * 15).toFixed(2)}deg`);
          item.artwork.style.setProperty('--v41-rz', `${(angle * direction * 3).toFixed(2)}deg`);
          item.artwork.style.setProperty('--v41-depth', `${(Math.sin(travel * Math.PI) * -50).toFixed(2)}px`);
        }
      }
    }

    function requestMediaUpdate() {
      if (!active || !desktop.matches || !visibleMedia.size || scrollFrame !== null) return;
      scrollFrame = window.requestAnimationFrame(updateMedia);
    }

    function updateState() {
      const enabled = preference === 'on' && !reduced.matches;
      active = enabled && !document.hidden;
      body.classList.toggle('motion-paused', !active);
      for (const toggle of toggles) {
        toggle.hidden = false;
        toggle.textContent = '动态效果';
        toggle.setAttribute('aria-pressed', String(enabled));
        toggle.setAttribute('aria-disabled', String(reduced.matches));
        toggle.dataset.motionState = reduced.matches ? 'system-off' : enabled ? 'on' : 'off';
        toggle.title = reduced.matches ? '系统已开启减少动态效果' : enabled ? '关闭动态效果' : '开启动态效果';
        toggle.setAttribute('aria-label', reduced.matches
          ? '动态效果：已关闭，遵循系统减少动态效果设置'
          : `动态效果：${enabled ? '已开启' : '已关闭'}`);
      }
      if (!active) stopMotion();
      else requestMediaUpdate();
      document.dispatchEvent(new CustomEvent('portfolio:motionchange', { detail: { enabled, active, reduced: reduced.matches } }));
    }

    function enter(element, delay = 0, kind = 'text') {
      if (!active || !element.isConnected || typeof element.animate !== 'function'
        || element.closest('[hidden]') || !element.getClientRects().length
        || element.contains(document.activeElement)
        || element.closest(controls) === document.activeElement) return;
      if (kind !== 'surface' && (element.matches(controls) || element.querySelector(controls))) return;
      const bounds = element.getBoundingClientRect();
      if (bounds.bottom <= 0 || bounds.top >= window.innerHeight) return;
      try {
        const computed = window.getComputedStyle(element);
        const baseline = computed.transform;
        const transform = baseline === 'none' ? '' : ` ${baseline}`;
        const frames = kind === 'image'
          // Only the image surface is cropped; the enclosing link and its text stay visible.
          ? [{ clipPath: 'inset(0 0 10% 0)', transform: `translate3d(0, 8px, 0)${transform}` },
            { clipPath: computed.clipPath === 'none' ? 'inset(0 0 0 0)' : computed.clipPath, transform: baseline }]
          : kind === 'surface'
            ? [{ transform: `translate3d(0, 12px, 0)${transform}` }, { transform: baseline }]
            : [{ opacity: body.classList.contains('portfolio-v39') ? 1 : 0, transform: `translate3d(0, 16px, 0)${transform}` }, { opacity: 1, transform: baseline }];
        // No persistent hidden styles: canceling or failing restores the readable CSS baseline.
        const animation = element.animate(frames, {
          duration: kind === 'image' ? 620 : kind === 'surface' ? 800 : 760, delay,
          easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'backwards'
        });
        animations.add(animation);
        const cleanup = () => animations.delete(animation);
        animation.addEventListener('cancel', cleanup, { once: true });
        animation.addEventListener('finish', () => { cleanup(); animation.cancel(); }, { once: true });
      } catch { /* Animation API support must never affect content or navigation. */ }
    }

    function reveal(element) {
      // V41 uses scrubbed 3D on these same images, so do not start a second
      // transform animation that would override it or restore a stale matrix.
      if (body.classList.contains('portfolio-v41') && desktop.matches && element.matches('.real-preview .case-artwork')) return;
      if (!element.matches('.sheet-image,.mineral-art,.real-preview .case-artwork')) { enter(element); return; }
      const image = element.querySelector('img');
      if (!image) return;
      // Lazy images reveal only after loading. An offscreen or failed load stays static.
      if (!image.complete) image.addEventListener('load', () => enter(element, 0, 'image'), { once: true });
      else if (image.naturalWidth) enter(element, 0, 'image');
    }

    toggles.forEach(toggle => toggle.addEventListener('click', () => {
      if (reduced.matches) return;
      preference = preference === 'on' ? 'off' : 'on';
      try { window.localStorage.setItem('erick-motion', preference); } catch { /* Keep session preference. */ }
      updateState();
    }));

    const listenMedia = (query, callback) => {
      if (typeof query.addEventListener === 'function') query.addEventListener('change', callback);
      else if (typeof query.addListener === 'function') query.addListener(callback);
    };
    listenMedia(reduced, updateState);
    listenMedia(desktop, () => { mediaItems.forEach(resetMedia); requestMediaUpdate(); });
    document.addEventListener('visibilitychange', updateState);
    window.addEventListener('pagehide', () => { active = false; body.classList.add('motion-paused'); stopMotion(); });
    window.addEventListener('pageshow', updateState);
    window.addEventListener('scroll', requestMediaUpdate, { passive: true });
    window.addEventListener('resize', requestMediaUpdate, { passive: true });
    document.addEventListener('focusin', event => {
      if (body.classList.contains('portfolio-v41') && document.querySelector('dialog[open]')) mediaItems.forEach(resetMedia);
      for (const animation of [...animations]) {
        const target = animation.effect?.target;
        if (target?.contains(event.target) || target?.closest(controls) === event.target) animation.cancel();
      }
      for (const item of visibleMedia) if (item.element.contains(event.target)) resetMedia(item);
    });
    document.addEventListener('focusout', requestMediaUpdate);
    document.addEventListener('close', requestMediaUpdate, true);

    updateState();
    const title = document.querySelector('.editorial-hero-title');
    const titleParts = title ? [...title.querySelectorAll(':scope > span')] : [];
    const introduction = [
      ...(titleParts.length ? titleParts : title ? [title] : []),
      ...document.querySelectorAll('.editorial-hero .hero-entrance:not(.editorial-hero-title),.kinetic-hero .hero-entrance')
    ];
    [...new Set(introduction)].forEach((element, index) => {
      const bounds = element.getBoundingClientRect();
      if (bounds.bottom <= 0 || bounds.top >= window.innerHeight) return;
      revealed.add(element);
      enter(element, Math.min(index, 5) * 85);
    });
    document.querySelectorAll('.hero-project-sheet').forEach(element => enter(element, 100, 'surface'));

    if (typeof window.IntersectionObserver === 'function') {
      const observer = new window.IntersectionObserver(entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting || entry.target.closest('[hidden]')) continue;
          if (!revealed.has(entry.target)) { revealed.add(entry.target); reveal(entry.target); }
          observer.unobserve(entry.target);
        }
      }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });
      document.querySelectorAll('[data-reveal],.portfolio-v39 .hero-entrance,.portfolio-v25 .sheet-image,.portfolio-v33 .mineral-art,.portfolio-v25 .real-preview .case-artwork').forEach(element => {
        if (!revealed.has(element)) observer.observe(element);
      });

      if (body.classList.contains('portfolio-v21')) {
        const mediaObserver = new window.IntersectionObserver(entries => {
          for (const entry of entries) {
            const item = mediaItems.find(record => record.element === entry.target);
            if (!item) continue;
            if (entry.isIntersecting) visibleMedia.add(item);
            else { visibleMedia.delete(item); resetMedia(item); }
          }
          requestMediaUpdate();
        }, { rootMargin: '40px 0px' });
        document.querySelectorAll('.case-media').forEach((element, index) => {
          const artwork = element.querySelector('.case-artwork');
          if (!artwork) return;
          artwork.dataset.editorialParallax = '';
          const item = { element, artwork, index };
          mediaItems.push(item);
          mediaObserver.observe(element);
        });
      }
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initMotion, { once: true });
  else initMotion();
})();

/* V39: the optional WebGL chapter never owns document scrolling or content. */
(() => {
  'use strict';
  const root = document.getElementById('spatial-intro');
  const mount = root?.querySelector('[data-spatial-mount]');
  const stage = root?.querySelector('.spatial-sticky');
  if (!root || !mount || !stage || !window.IntersectionObserver) return;
  const desktop = matchMedia('(min-width:1001px) and (min-height:600px) and (hover:hover) and (pointer:fine)');
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  let controller = null, loading = false, failed = false, destroyed = false, near = false;
  let token = 0, requests = 0, skipped = false, seenAway = false, entryFrame = 0;
  let observedHash = location.hash;
  let deepGate = Boolean(observedHash && observedHash !== '#spatial-intro');
  function observeNavigation() {
    if (location.hash === observedHash) return;
    observedHash = location.hash;
    if (observedHash && observedHash !== '#spatial-intro') {
      deepGate = true; seenAway = false;
    } else { deepGate = false; skipped = false; }
  }
  root.dataset.spatialRequests = '0';
  function updateNavHeight() {
    const value = `${Math.ceil(document.querySelector('.nav')?.getBoundingClientRect().height || 82)}px`;
    if (root.style.getPropertyValue('--spatial-nav-height') !== value) root.style.setProperty('--spatial-nav-height', value);
  }
  function canRun() {
    return !destroyed && !failed && !deepGate && !skipped && near && desktop.matches && !reduced.matches
      && !document.hidden && !document.body.classList.contains('motion-paused')
      && !navigator.connection?.saveData && !document.querySelector('dialog[open]');
  }
  function atEntry() {
    const rect = root.getBoundingClientRect();
    return rect.top >= -Math.min(stage.clientHeight * .2, 130) && rect.top < innerHeight && rect.bottom > 0;
  }
  function invalidatePending() {
    if (loading) { token += 1; loading = false; }
  }
  function setPhase(index, progress) {
    const phase = Math.max(0, Math.min(2, index));
    root.style.setProperty('--spatial-progress', String(Math.max(0, Math.min(1, progress))));
    if (root.dataset.spatialPhase === String(phase)) return;
    root.dataset.spatialPhase = String(phase);
    root.querySelectorAll('[data-scene-step]').forEach(item => {
      if (Number(item.dataset.sceneStep) === phase) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    });
  }
  function fallBack(error) {
    const wasEnhanced = root.classList.contains('spatial-enhanced');
    const bounds = root.getBoundingClientRect();
    const navBottom = document.querySelector('.nav')?.getBoundingClientRect().bottom || 82;
    const inIntro = bounds.bottom > navBottom && bounds.top < innerHeight;
    const anchor = [...document.querySelectorAll('main > section')]
      .find(section => section !== root && section.getBoundingClientRect().bottom > navBottom);
    const anchorTop = anchor?.getBoundingClientRect().top;
    root.dataset.spatialFailure = String(error?.message || 'Scene unavailable').slice(0, 180);
    failed = true; invalidatePending(); token += 1;
    const previous = controller; controller = null;
    previous?.destroy();
    root.classList.remove('spatial-enhanced');
    root.dataset.spatialState = 'fallback';
    if (wasEnhanced && inIntro) root.scrollIntoView({ block: 'start', behavior: 'instant' });
    else if (wasEnhanced && anchor && Number.isFinite(anchorTop)) {
      const shift = anchor.getBoundingClientRect().top - anchorTop;
      if (Math.abs(shift) > 1) window.scrollBy({ top: shift, behavior: 'instant' });
    }
  }
  async function load() {
    if (loading || controller || !canRun() || !atEntry()) return;
    const request = ++token;
    const entryHash = location.hash;
    loading = true; root.dataset.spatialState = 'loading';
    root.dataset.spatialRequests = String(++requests);
    const valid = () => request === token && canRun()
      && (Boolean(controller) || (atEntry() && location.hash === entryHash));
    try {
      const module = await import('./assets/spatial-intro.mjs?v=40.2');
      if (!valid()) return;
      const fresh = await module.createSpatialIntro({ root, mount, isEligible: valid,
        onPhase: (index, progress) => { if (request === token) setPhase(index, progress); },
        onFailure: error => { if (request === token) fallBack(error); }
      });
      if (!valid()) { fresh?.destroy(); return; }
      controller = fresh;
      root.classList.add('spatial-enhanced');
      root.dataset.spatialState = 'ready';
      updateNavHeight();
      controller.setActive(true);
    } catch (error) {
      if (request === token && error?.name !== 'AbortError') fallBack(error);
    } finally {
      if (request === token) {
        loading = false;
        if (!controller && !failed) root.dataset.spatialState = 'static';
      }
    }
  }
  function sync() {
    if (destroyed) return;
    observeNavigation();
    updateNavHeight();
    if (!canRun()) {
      invalidatePending();
      controller?.setActive(false);
      root.dataset.spatialState = failed ? 'fallback' : document.body.classList.contains('motion-paused') ? 'paused' : 'static';
      return;
    }
    if (controller) { root.dataset.spatialState = 'ready'; controller.setActive(true); }
    else load();
  }
  // Re-entering from below first intersects the section's trailing edge, where
  // expanding it would move the reader. Recheck only the uninitialized entry
  // on native scroll, so reaching the safe top later can activate it.
  function requestEntryCheck() {
    if (controller || loading || failed || destroyed || entryFrame || !near) return;
    entryFrame = requestAnimationFrame(() => {
      entryFrame = 0;
      if (canRun() && atEntry()) sync();
    });
  }
  window.addEventListener('scroll', requestEntryCheck, { passive: true });
  const observer = new IntersectionObserver(entries => {
    observeNavigation();
    for (const entry of entries) {
      near = entry.isIntersecting;
      if (!near) seenAway = true;
      else if (seenAway) { deepGate = false; skipped = false; }
    }
    sync();
  }, { threshold: 0 });
  observer.observe(root);
  root.querySelector('[data-spatial-skip]')?.addEventListener('click', event => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    skipped = true; seenAway = false; sync();
  });
  document.addEventListener('portfolio:motionchange', sync);
  document.addEventListener('visibilitychange', sync);
  document.addEventListener('focusin', sync);
  document.addEventListener('close', sync, true);
  window.addEventListener('hashchange', () => {
    if (!location.hash || location.hash === '#spatial-intro') { deepGate = false; skipped = false; }
    sync();
  });
  desktop.addEventListener('change', sync); reduced.addEventListener('change', sync);
  window.addEventListener('resize', () => { sync(); controller?.refresh(); }, { passive: true });
  const sizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(() => { updateNavHeight(); controller?.refresh(); }) : null;
  [stage, document.querySelector('.nav')].filter(Boolean).forEach(element => sizeObserver?.observe(element));
  window.addEventListener('pagehide', event => {
    if (entryFrame) cancelAnimationFrame(entryFrame);
    entryFrame = 0;
    invalidatePending(); controller?.setActive(false);
    if (!event.persisted) { destroyed = true; token += 1; controller?.destroy(); controller = null; observer.disconnect(); sizeObserver?.disconnect(); }
  });
  window.addEventListener('pageshow', sync);
  sync();
})();
