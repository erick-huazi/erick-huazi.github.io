/* "校样 / Proof" motion layer (v72).
   Progressive: all content is readable before, after, or without this file.
   html.motion gates every pre-reveal style; the switch and prefers-reduced-motion remove it. */
(() => {
  'use strict';
  const root = document.documentElement;
  const body = document.body;
  if (!body || body.dataset.motionReady === 'true') return;
  body.dataset.motionReady = 'true';

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const media = query => typeof window.matchMedia === 'function'
    ? window.matchMedia(query) : { matches: false, addEventListener() {} };
  const reduced = media('(prefers-reduced-motion: reduce)');
  const finePointer = media('(hover: hover) and (pointer: fine)');
  const smallScreen = media('(max-width: 760px)');
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const toggles = $$('#motion-toggle,[data-motion-control]');
  let preference = 'on';
  let active = false;
  try { if (window.localStorage.getItem('erick-motion') === 'off') preference = 'off'; } catch { /* storage is optional */ }

  /* ---- Shanghai clock in the footer: plain information ---- */
  const clocks = $$('[data-clock]');
  if (clocks.length && typeof Intl === 'object') {
    try {
      const format = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit', hour12: false });
      const tick = () => {
        if (document.hidden) return;
        const now = format.format(new Date());
        clocks.forEach(clock => { const time = clock.querySelector('time'); if (time) time.textContent = now; clock.hidden = false; });
      };
      tick();
      window.setInterval(tick, 20000);
    } catch { /* keep the clock hidden */ }
  }

  /* ---- fit the footer wordmark to its container ---- */
  function fitText() {
    for (const element of $$('[data-fit]')) {
      const row = element.firstElementChild;
      const style = window.getComputedStyle(element);
      const box = element.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      if (!row || !(box > 0)) continue;
      element.style.fontSize = '100px';
      const width = row.getBoundingClientRect().width;
      if (!width) { element.style.removeProperty('font-size'); continue; }
      element.style.fontSize = `${(100 * box * (Number(element.dataset.fit) || 1) / width).toFixed(1)}px`;
    }
  }

  /* ---- scroll reveals ---- */
  const staggered = [
    ['.case-brief', ':scope > *'], ['.case-side', ':scope > *'], ['.offer-grid', ':scope > .offer'], ['.reference-shelf', ':scope > li'],
    ['.contact-channels', ':scope > .contact-channel'], ['.delivery-strip ol', ':scope > li'],
    ['.about-facts', ':scope > div'], ['.background', ':scope > *'], ['.archive-grid', ':scope > .archive-item'], ['.contact-faq', ':scope > details']
  ];
  for (const [parent, child] of staggered) {
    for (const group of $$(parent)) {
      $$(child, group).forEach((element, index) => {
        element.classList.add('rv');
        element.style.setProperty('--d', `${Math.min(index, 6) * 70}ms`);
      });
    }
  }
  for (const element of $$('[data-reveal]')) {
    const inner = document.createElement('span');
    inner.className = 'rv-in';
    inner.append(...element.childNodes);
    element.append(inner);
  }

  /* ---- hand-drawn notes: rough-notation, loaded only when motion is on ---- */
  const noteTargets = $$('[data-note]');
  const notes = new Map();
  const pendingNotes = new Map();
  let annotate = null;
  let notesLoading = null;
  const noteStyles = {
    highlight: { type: 'highlight', color: '#ffe14a', iterations: 1, multiline: true, animationDuration: 700 },
    underline: { type: 'underline', color: '#141414', strokeWidth: 3, padding: 2, iterations: 2, animationDuration: 700 },
    circle: { type: 'circle', color: '#141414', strokeWidth: 2.5, padding: [6, 12], iterations: 2, animationDuration: 900 },
    box: { type: 'box', color: '#141414', strokeWidth: 2.5, padding: 6, iterations: 2, animationDuration: 800 }
  };
  function loadNotes() {
    if (!noteTargets.length) return Promise.resolve(false);
    notesLoading ||= import('./assets/vendor/rough-notation.esm.js')
      .then(module => { annotate = module.annotate; return true; })
      .catch(() => false);
    return notesLoading;
  }
  function showNote(element, delay) {
    if (!active || document.hidden || notes.has(element) || pendingNotes.has(element)) return;
    const timer = window.setTimeout(async () => {
      // Measure only after the entrance and display font are ready. A scroll
      // or preference change may have cancelled this particular visit meanwhile.
      const displayFace = document.fonts?.load?.('1em "Smiley Sans"', element.textContent || '字').catch(() => null);
      const [ready] = await Promise.all([loadNotes(), displayFace]);
      if (pendingNotes.get(element) !== timer) return;
      pendingNotes.delete(element);
      if (!ready || !active || document.hidden) return;
      const proof = element.classList.contains('proof-mark');
      // The drawing is laid out against the nearest positioned ancestor. Keep that ancestor
      // right around the text, so the note travels with it when something above opens or closes.
      const anchor = element.parentElement;
      if (anchor && window.getComputedStyle(anchor).position === 'static') anchor.style.position = 'relative';
      const note = annotate(element, {
        ...(noteStyles[element.dataset.note] || noteStyles.underline),
        ...(element.dataset.noteColor === 'hl' ? { color: '#ffe14a' } : null),
        ...(proof ? { padding: 3, strokeWidth: 3 } : null)
      });
      notes.set(element, note);
      element.closest('[data-reveal]')?.classList.add('noted');
      note.show();
      element.classList.add('note-applied');
      noteObserver?.unobserve(element);
    }, delay);
    pendingNotes.set(element, timer);
  }
  function cancelNote(element) {
    window.clearTimeout(pendingNotes.get(element));
    pendingNotes.delete(element);
  }
  function observeNotes() {
    if (!noteObserver) return;
    noteObserver.disconnect();
    for (const element of noteTargets) {
      if (!notes.has(element)) noteObserver.observe(element);
    }
  }
  function clearNotes() {
    pendingNotes.forEach((_timer, element) => cancelNote(element));
    notes.forEach((note, element) => {
      note.remove();
      element.classList.remove('note-applied');
    });
    notes.clear();
    $$('[data-reveal].noted').forEach(element => element.classList.remove('noted'));
  }

  const revealTargets = $$('[data-reveal],.rv,.case-product-preview,.section-number,.reference-teaser-label,.eyebrow');
  let revealObserver = null;
  let noteObserver = null;
  if ('IntersectionObserver' in window) {
    revealObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('in');
        revealObserver.unobserve(entry.target);
      }
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.06 });
    noteObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        // Headline wrappers finish sliding before the pen comes down.
        const target = entry.target;
        if (entry.isIntersecting) showNote(target, target.classList.contains('proof-mark') ? 1350 : target.closest('.hero') ? 1250 : 1150);
        else cancelNote(target);
      }
    }, { rootMargin: '0px 0px -14% 0px', threshold: 0.5 });
  } else revealTargets.forEach(element => element.classList.add('in'));

  /* ---- scroll-linked values: one passive listener, one frame ---- */
  const stack = $('.hero-stack');
  const statement = $('.about-statement');
  let words = [];
  let litCount = -1;
  if (statement && !statement.children.length) {
    const text = statement.textContent;
    const label = document.createElement('span');
    label.className = 'sr-only';
    label.textContent = text;
    const visual = document.createElement('span');
    visual.setAttribute('aria-hidden', 'true');
    for (const character of text) {
      const span = document.createElement('span');
      span.className = 'w';
      span.textContent = character;
      visual.append(span);
      words.push(span);
    }
    statement.replaceChildren(label, visual);
  }
  const processList = $('.delivery-strip ol');
  const processSteps = processList ? $$(':scope > li', processList) : [];
  const scrollEffects = [statement, processList].filter(Boolean);
  const nearbyEffects = new Set(scrollEffects);
  let effectObserver = null;
  if ('IntersectionObserver' in window) {
    effectObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) nearbyEffects.add(entry.target);
        else nearbyEffects.delete(entry.target);
      }
      requestScrollUpdate();
    }, { rootMargin: '96px 0px' });
  }
  let scrollFrame = 0;
  function lightWords(count) {
    if (count === litCount) return;
    words.forEach((word, index) => word.classList.toggle('lit', index < count));
    litCount = count;
  }
  root.classList.add('js-scroll');
  function updateScroll() {
    scrollFrame = 0;
    const scrolled = window.scrollY || 0;
    root.classList.toggle('scrolled', scrolled > 8);
    if (!active) return;
    const viewport = Math.max(window.innerHeight, 1);
    if (stack && !smallScreen.matches && scrolled < viewport * 1.4) stack.style.setProperty('--sy', clamp(scrolled / (viewport * 0.9)).toFixed(3));
    if (words.length && nearbyEffects.has(statement)) {
      const rect = statement.getBoundingClientRect();
      lightWords(Math.round(clamp((viewport * 0.86 - rect.top) / (viewport * 0.46 + rect.height * 0.5)) * words.length));
    }
    if (nearbyEffects.has(processList)) {
      const rect = processList.getBoundingClientRect();
      const progress = clamp((viewport * 0.84 - rect.top) / (viewport * 0.42));
      processList.style.setProperty('--process', progress.toFixed(3));
      processSteps.forEach((step, index) => step.classList.toggle('on', progress > (index + 0.35) / processSteps.length));
    }
  }
  function requestScrollUpdate() { if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateScroll); }
  window.addEventListener('scroll', requestScrollUpdate, { passive: true });

  /* ---- hero prints drift with the pointer; preview label follows it ---- */
  let cursor = null;
  let pointerX = 0, pointerY = 0, cursorX = 0, cursorY = 0, cursorFrame = 0, cursorPlaced = false;
  function hideCursor() {
    if (cursorFrame) window.cancelAnimationFrame(cursorFrame);
    cursorFrame = 0;
    cursorPlaced = false;
    cursor?.classList.remove('on', 'is-label');
  }
  function drawCursor() {
    cursorFrame = 0;
    if (!cursor) return;
    cursorX += (pointerX - cursorX) * 0.24;
    cursorY += (pointerY - cursorY) * 0.24;
    cursor.style.transform = `translate3d(${cursorX.toFixed(1)}px,${cursorY.toFixed(1)}px,0)`;
    if (Math.abs(pointerX - cursorX) + Math.abs(pointerY - cursorY) > 0.4) cursorFrame = window.requestAnimationFrame(drawCursor);
  }
  window.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch' || !active) return;
    pointerX = event.clientX; pointerY = event.clientY;
    if (stack && !smallScreen.matches && window.scrollY < window.innerHeight) {
      stack.style.setProperty('--px', ((pointerX / window.innerWidth - 0.5) * -14).toFixed(2));
      stack.style.setProperty('--py', ((pointerY / window.innerHeight - 0.5) * -10).toFixed(2));
    }
    if (cursor?.classList.contains('on')) {
      if (!cursorPlaced) { cursorX = pointerX; cursorY = pointerY; cursorPlaced = true; }
      if (!cursorFrame) cursorFrame = window.requestAnimationFrame(drawCursor);
    }
  }, { passive: true });
  document.addEventListener('pointerover', event => {
    if (!cursor) return;
    const element = event.target instanceof Element ? event.target : null;
    const preview = element?.closest('a.case-product-preview,.wechat-preview,.hero-shot');
    if (!preview || event.pointerType === 'touch') { hideCursor(); return; }
    cursor.dataset.label = preview.matches('.wechat-preview') ? '放大' : preview.matches('.hero-shot') ? '看作品' : '访问 ↗';
    cursor.classList.add('is-label', 'on');
    if (!cursorPlaced) {
      cursorX = pointerX = event.clientX;
      cursorY = pointerY = event.clientY;
      cursorPlaced = true;
      drawCursor();
    }
  }, { passive: true });
  document.addEventListener('pointerout', event => { if (!event.relatedTarget) hideCursor(); });
  /* ---- a print can be picked up and moved (mouse or pen); a plain click still opens the work ---- */
  let drag = null;
  function cancelDrag() {
    if (drag?.moved) {
      drag.shot.classList.remove('is-dragging');
      drag.shot.style.setProperty('--dx', drag.dx + 'px');
      drag.shot.style.setProperty('--dy', drag.dy + 'px');
    }
    drag = null;
  }
  if (stack) {
    let swallowClick = false;
    let topLayer = 5;
    stack.addEventListener('pointerdown', event => {
      if (!active || smallScreen.matches || event.pointerType === 'touch' || event.button !== 0) return;
      const shot = event.target instanceof Element ? event.target.closest('.hero-shot') : null;
      if (!shot) return;
      swallowClick = false;
      drag = { shot, id: event.pointerId, x: event.clientX, y: event.clientY, dx: Number(shot.dataset.dx) || 0, dy: Number(shot.dataset.dy) || 0, moved: false };
    });
    window.addEventListener('pointermove', event => {
      if (!drag || event.pointerId !== drag.id) return;
      const moveX = event.clientX - drag.x;
      const moveY = event.clientY - drag.y;
      if (!drag.moved) {
        if (Math.hypot(moveX, moveY) < 6) return;
        drag.moved = true;
        drag.shot.classList.add('is-dragging');
        drag.shot.style.zIndex = String(++topLayer);
        if (cursor) cursor.dataset.label = '松手放下';
      }
      drag.shot.style.setProperty('--dx', `${(drag.dx + moveX).toFixed(1)}px`);
      drag.shot.style.setProperty('--dy', `${(drag.dy + moveY).toFixed(1)}px`);
    }, { passive: true });
    const drop = event => {
      if (!drag || event.pointerId !== drag.id) return;
      if (drag.moved) {
        drag.shot.dataset.dx = String(drag.dx + event.clientX - drag.x);
        drag.shot.dataset.dy = String(drag.dy + event.clientY - drag.y);
        drag.shot.classList.remove('is-dragging');
        if (cursor) cursor.dataset.label = '看作品';
        // The click that ends a drag must not open the work.
        swallowClick = true;
        window.setTimeout(() => { swallowClick = false; }, 80);
      }
      drag = null;
    };
    window.addEventListener('pointerup', drop);
    window.addEventListener('pointercancel', event => { if (drag?.id === event.pointerId) cancelDrag(); });
    stack.addEventListener('click', event => {
      if (!swallowClick) return;
      swallowClick = false;
      event.preventDefault();
      event.stopPropagation();
    }, true);
    stack.addEventListener('dragstart', event => event.preventDefault());
  }

  function setCursor(enabled) {
    if (enabled && !cursor) {
      cursor = document.createElement('div');
      cursor.className = 'cursor';
      cursor.setAttribute('aria-hidden', 'true');
      body.append(cursor);
      root.classList.add('has-cursor');
    } else if (!enabled && cursor) {
      hideCursor();
      cursor.remove(); cursor = null;
      root.classList.remove('has-cursor');
    }
  }

  /* ---- switch ---- */
  function syncCursor() {
    setCursor(active && finePointer.matches && !smallScreen.matches);
  }
  function apply() {
    active = preference === 'on' && !reduced.matches;
    root.classList.toggle('motion', active);
    body.classList.toggle('motion-paused', !active);
    if (!active) {
      cancelDrag();
      revealObserver?.disconnect();
      noteObserver?.disconnect();
      effectObserver?.disconnect();
      clearNotes();
      lightWords(words.length);
      litCount = -1;
      processList?.style.removeProperty('--process');
      processSteps.forEach(step => step.classList.add('on'));
      stack?.style.removeProperty('--px');
      stack?.style.removeProperty('--py');
      stack?.style.removeProperty('--sy');
      $$('.hero-shot').forEach(shot => {
        shot.style.removeProperty('--dx'); shot.style.removeProperty('--dy'); shot.style.removeProperty('z-index');
        delete shot.dataset.dx; delete shot.dataset.dy;
      });
    } else {
      for (const element of revealTargets) {
        if (!element.classList.contains('in')) revealObserver?.observe(element);
      }
      observeNotes();
      if (effectObserver) {
        nearbyEffects.clear();
        for (const element of scrollEffects) effectObserver.observe(element);
      }
    }
    syncCursor();
    toggles.forEach(toggle => {
      toggle.hidden = false;
      toggle.disabled = reduced.matches;
      toggle.setAttribute('aria-pressed', String(active));
      toggle.title = reduced.matches ? '系统已开启“减少动态效果”' : '';
    });
    fitText();
    requestScrollUpdate();
  }
  toggles.forEach(toggle => toggle.addEventListener('click', () => {
    preference = active ? 'off' : 'on';
    try { window.localStorage.setItem('erick-motion', preference); } catch { /* optional */ }
    apply();
  }));
  reduced.addEventListener?.('change', apply);
  finePointer.addEventListener?.('change', syncCursor);
  smallScreen.addEventListener?.('change', () => { cancelDrag(); syncCursor(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      hideCursor();
      cancelDrag();
      noteObserver?.disconnect();
      pendingNotes.forEach((_timer, element) => cancelNote(element));
    } else {
      if (active) observeNotes();
      requestScrollUpdate();
    }
  });
  window.addEventListener('storage', event => {
    if (event.key !== 'erick-motion' && event.key !== null) return;
    try {
      if (event.storageArea !== window.localStorage) return;
      const next = window.localStorage.getItem('erick-motion') === 'off' ? 'off' : 'on';
      if (next === preference) return;
      preference = next;
      apply();
    } catch { /* storage is optional */ }
  });
  window.addEventListener('resize', () => { fitText(); requestScrollUpdate(); }, { passive: true });
  document.fonts?.ready.then(fitText);
  apply();
})();
