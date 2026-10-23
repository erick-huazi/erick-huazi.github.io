/* Optional motion layer. Content remains visible without this script or animation APIs. */
(() => {
  'use strict';

  function initMotion() {
    const body = document.body;
    if (!body?.classList.contains('portfolio-v10') || body.dataset.motionReady === 'true') return;
    body.dataset.motionReady = 'true';

    const toggle = document.getElementById('motion-toggle');
    const media = query => typeof window.matchMedia === 'function'
      ? window.matchMedia(query)
      : { matches: false };
    const reduced = media('(prefers-reduced-motion: reduce)');
    const finePointer = media('(hover: hover) and (pointer: fine) and (min-width: 761px)');
    const controls = 'a[href],button,input,select,textarea,summary,[contenteditable="true"],[tabindex]:not([tabindex="-1"])';
    const animations = new Set();
    const revealed = new WeakSet();
    const stages = [];
    let preference = 'on';
    let active = false;

    try {
      if (window.localStorage.getItem('erick-motion') === 'off') preference = 'off';
    } catch { /* Storage can be unavailable in private or embedded contexts. */ }

    function resetStage(stage) {
      if (stage.frame !== null) window.cancelAnimationFrame(stage.frame);
      stage.frame = null;
      stage.image.style.setProperty('--pointer-x', '0deg');
      stage.image.style.setProperty('--pointer-y', '0deg');
    }

    function stopAnimations() {
      for (const animation of [...animations]) animation.cancel();
      animations.clear();
      stages.forEach(resetStage);
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
        toggle.title = reduced.matches
          ? '系统已开启减少动态效果'
          : enabled ? '关闭动态效果' : '开启动态效果';
        toggle.setAttribute('aria-label', reduced.matches
          ? '动态效果：已关闭，遵循系统减少动态效果设置'
          : `动态效果：${enabled ? '已开启' : '已关闭'}`);
      }
      if (!active) stopAnimations();
    }

    function canAnimate(element) {
      return active && element.isConnected && typeof element.animate === 'function'
        && !element.closest('[hidden]') && element.getClientRects().length > 0
        && !element.matches(controls) && !element.querySelector(controls)
        && !element.contains(document.activeElement);
    }

    function enter(element, delay = 0) {
      if (!canAnimate(element)) return;
      // No persistent opacity/transform styles: cancel, finish, or failure restores the CSS baseline.
      try {
        const animation = element.animate([
          { opacity: 0, transform: 'translate3d(0, 14px, 0)' },
          { opacity: 1, transform: 'translate3d(0, 0, 0)' }
        ], { duration: 620, delay, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'backwards' });
        animations.add(animation);
        const cleanup = () => animations.delete(animation);
        animation.addEventListener('cancel', cleanup, { once: true });
        animation.addEventListener('finish', () => {
          cleanup();
          animation.cancel();
        }, { once: true });
      } catch { /* Unsupported animation APIs must never block page content. */ }
    }

    document.querySelectorAll('[data-art-stage]').forEach(element => {
      const image = element.querySelector('.sculpture-motion');
      if (!image) return;
      const stage = { element, image, frame: null, x: 0, y: 0 };
      stages.push(stage);
      resetStage(stage);
      element.addEventListener('pointermove', event => {
        if (!active || !finePointer.matches || event.pointerType !== 'mouse') return;
        const rect = element.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const clamp = value => Math.max(-1, Math.min(1, value));
        stage.x = -clamp((event.clientY - rect.top) / rect.height * 2 - 1) * 6;
        stage.y = clamp((event.clientX - rect.left) / rect.width * 2 - 1) * 6;
        if (stage.frame !== null) return;
        stage.frame = window.requestAnimationFrame(() => {
          stage.frame = null;
          if (!active || !finePointer.matches || document.hidden) { resetStage(stage); return; }
          image.style.setProperty('--pointer-x', `${stage.x.toFixed(2)}deg`);
          image.style.setProperty('--pointer-y', `${stage.y.toFixed(2)}deg`);
        });
      }, { passive: true });
      element.addEventListener('pointerleave', () => resetStage(stage));
      element.addEventListener('pointercancel', () => resetStage(stage));
    });

    toggle?.addEventListener('click', () => {
      if (reduced.matches) return;
      preference = preference === 'on' ? 'off' : 'on';
      try { window.localStorage.setItem('erick-motion', preference); } catch { /* Session toggle still works. */ }
      updateState();
    });

    function listenMedia(query, callback) {
      if (typeof query.addEventListener === 'function') query.addEventListener('change', callback);
      else if (typeof query.addListener === 'function') query.addListener(callback);
    }
    listenMedia(reduced, updateState);
    listenMedia(finePointer, () => stages.forEach(resetStage));
    document.addEventListener('visibilitychange', updateState);
    window.addEventListener('pagehide', () => {
      active = false;
      body.classList.add('motion-paused');
      stopAnimations();
    });
    window.addEventListener('pageshow', updateState);
    document.addEventListener('focusin', event => {
      for (const animation of [...animations]) {
        if (animation.effect?.target?.contains(event.target)) animation.cancel();
      }
    });

    updateState();
    // A once-only entrance. Re-enabling motion never replays the introduction.
    document.querySelectorAll('.kinetic-hero .hero-entrance').forEach((element, index) => {
      revealed.add(element);
      enter(element, Math.min(index, 5) * 70);
    });

    if (typeof window.IntersectionObserver === 'function') {
      // Continuous decorative animation only runs while its surface is visible.
      const viewportMotion = new window.IntersectionObserver(entries => {
        for (const entry of entries) entry.target.classList.toggle('motion-offscreen', !entry.isIntersecting);
      }, { rootMargin: '100px 0px' });
      document.querySelectorAll('.art-stage,.discipline-strip').forEach(element => viewportMotion.observe(element));
      const observer = new window.IntersectionObserver(entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting || entry.target.closest('[hidden]')) continue;
          if (!revealed.has(entry.target)) {
            revealed.add(entry.target);
            enter(entry.target);
          }
          observer.unobserve(entry.target);
        }
      }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });
      document.querySelectorAll('[data-reveal]').forEach(element => {
        if (!revealed.has(element)) observer.observe(element);
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initMotion, { once: true });
  else initMotion();
})();
