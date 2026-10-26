/* Progressive motion: everything is readable before, after, or without JavaScript. */
(() => {
  'use strict';

  function initMotion() {
    const body = document.body;
    if (!body?.matches('.portfolio-v10,.portfolio-v21') || body.dataset.motionReady === 'true') return;
    body.dataset.motionReady = 'true';

    const toggle = document.getElementById('motion-toggle');
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
      if (toggle) {
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
            : [{ opacity: 0, transform: `translate3d(0, 16px, 0)${transform}` }, { opacity: 1, transform: baseline }];
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
      if (!element.matches('.sheet-image,.mineral-art,.real-preview .case-artwork')) { enter(element); return; }
      const image = element.querySelector('img');
      if (!image) return;
      // Lazy images reveal only after loading. An offscreen or failed load stays static.
      if (!image.complete) image.addEventListener('load', () => enter(element, 0, 'image'), { once: true });
      else if (image.naturalWidth) enter(element, 0, 'image');
    }

    toggle?.addEventListener('click', () => {
      if (reduced.matches) return;
      preference = preference === 'on' ? 'off' : 'on';
      try { window.localStorage.setItem('erick-motion', preference); } catch { /* Keep session preference. */ }
      updateState();
    });

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
      for (const animation of [...animations]) {
        const target = animation.effect?.target;
        if (target?.contains(event.target) || target?.closest(controls) === event.target) animation.cancel();
      }
      for (const item of visibleMedia) if (item.element.contains(event.target)) resetMedia(item);
    });
    document.addEventListener('focusout', requestMediaUpdate);

    updateState();
    const title = document.querySelector('.editorial-hero-title');
    const titleParts = title ? [...title.querySelectorAll(':scope > span')] : [];
    const introduction = [
      ...(titleParts.length ? titleParts : title ? [title] : []),
      ...document.querySelectorAll('.editorial-hero .hero-entrance:not(.editorial-hero-title),.kinetic-hero .hero-entrance')
    ];
    [...new Set(introduction)].forEach((element, index) => {
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
      document.querySelectorAll('[data-reveal],.portfolio-v25 .sheet-image,.portfolio-v33 .mineral-art,.portfolio-v25 .real-preview .case-artwork').forEach(element => {
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
        document.querySelectorAll('.case-media').forEach(element => {
          const artwork = element.querySelector('.case-artwork');
          if (!artwork) return;
          artwork.dataset.editorialParallax = '';
          const item = { element, artwork };
          mediaItems.push(item);
          mediaObserver.observe(element);
        });
      }
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initMotion, { once: true });
  else initMotion();
})();
