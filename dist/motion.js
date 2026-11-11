/* v71 "校样 / Proof" motion layer.
   Progressive: all content is readable before, after, or without this file.
   html.motion gates every pre-reveal style; the switch and prefers-reduced-motion remove it. */
(() => {
  'use strict';
  const root = document.documentElement;
  const body = document.body;
  if (!body || body.dataset.motionReady === 'true') return;
  body.dataset.motionReady = 'true';
  window.__motionReady = true;

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const media = query => typeof window.matchMedia === 'function'
    ? window.matchMedia(query) : { matches: false, addEventListener() {} };
  const reduced = media('(prefers-reduced-motion: reduce)');
  const finePointer = media('(hover: hover) and (pointer: fine)');
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
    ['.case-copy', ':scope > *'], ['.offer-grid', ':scope > .offer'], ['.reference-shelf', ':scope > li'],
    ['.contact-channels', ':scope > .contact-channel'], ['.delivery-strip ol', ':scope > li'],
    ['.about-facts', ':scope > div'], ['.archive-grid', ':scope > .archive-item'], ['.contact-faq', ':scope > details']
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
      .then(module => { annotate = module.annotate; root.classList.add('notes-ready'); return true; })
      .catch(() => false);
    return notesLoading;
  }
  function showNote(element, delay) {
    if (!active || notes.has(element)) return;
    // Measure only after the display face has replaced the fallback.
    const displayFace = document.fonts?.load ? document.fonts.load('1em "Smiley Sans"', element.textContent || '字').catch(() => null) : null;
    Promise.all([loadNotes(), displayFace]).then(([ready]) => {
      if (!ready || !active || notes.has(element)) return;
      const note = annotate(element, noteStyles[element.dataset.note] || noteStyles.underline);
      notes.set(element, note);
      window.setTimeout(() => {
        if (!active || notes.get(element) !== note) return;
        element.closest('[data-reveal]')?.classList.add('noted');
        note.show();
      }, delay);
    });
  }
  function clearNotes() {
    notes.forEach(note => note.remove());
    notes.clear();
    root.classList.remove('notes-ready');
    $$('[data-reveal].noted').forEach(element => element.classList.remove('noted'));
  }

  const revealTargets = $$('[data-reveal],.rv,.case-product-preview');
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
    revealTargets.forEach(element => revealObserver.observe(element));
    noteObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        // Headline wrappers finish sliding before the pen comes down.
        showNote(entry.target, entry.target.closest('.hero') ? 1100 : 1000);
      }
    }, { rootMargin: '0px 0px -14% 0px', threshold: 0.5 });
    noteTargets.forEach(element => noteObserver.observe(element));
  } else revealTargets.forEach(element => element.classList.add('in'));

  /* ---- scroll-linked values: one passive listener, one frame ---- */
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
  let scrollFrame = 0;
  function lightWords(count) {
    if (count === litCount) return;
    words.forEach((word, index) => word.classList.toggle('lit', index < count));
    litCount = count;
  }
  function updateScroll() {
    scrollFrame = 0;
    if (!active) return;
    const viewport = Math.max(window.innerHeight, 1);
    if (words.length) {
      const rect = statement.getBoundingClientRect();
      lightWords(Math.round(clamp((viewport * 0.86 - rect.top) / (viewport * 0.46 + rect.height * 0.5)) * words.length));
    }
    if (processList) {
      const rect = processList.getBoundingClientRect();
      const progress = clamp((viewport * 0.84 - rect.top) / (viewport * 0.42));
      processList.style.setProperty('--process', progress.toFixed(3));
      processSteps.forEach((step, index) => step.classList.toggle('on', progress > (index + 0.35) / processSteps.length));
    }
  }
  function requestScrollUpdate() { if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateScroll); }
  window.addEventListener('scroll', requestScrollUpdate, { passive: true });

  /* ---- hero prints drift with the pointer; preview label follows it ---- */
  const stack = $('.hero-stack');
  let cursor = null;
  let pointerX = 0, pointerY = 0, cursorX = 0, cursorY = 0, cursorFrame = 0, cursorPlaced = false;
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
    if (stack && window.scrollY < window.innerHeight) {
      stack.style.setProperty('--px', ((pointerX / window.innerWidth - 0.5) * -14).toFixed(2));
      stack.style.setProperty('--py', ((pointerY / window.innerHeight - 0.5) * -10).toFixed(2));
    }
    if (cursor) {
      if (!cursorPlaced) { cursorX = pointerX; cursorY = pointerY; cursorPlaced = true; }
      if (!cursorFrame) cursorFrame = window.requestAnimationFrame(drawCursor);
    }
  }, { passive: true });
  document.addEventListener('pointerover', event => {
    if (!cursor) return;
    const element = event.target instanceof Element ? event.target : null;
    const preview = element?.closest('.case-product-preview,.wechat-preview,.hero-shot');
    cursor.dataset.label = preview ? (preview.matches('.wechat-preview') ? '放大' : preview.matches('.hero-shot') ? '看作品' : '访问 ↗') : '';
    cursor.classList.toggle('is-label', Boolean(preview));
    cursor.classList.toggle('on', Boolean(preview));
  }, { passive: true });
  function setCursor(enabled) {
    if (enabled && !cursor) {
      cursor = document.createElement('div');
      cursor.className = 'cursor';
      cursor.setAttribute('aria-hidden', 'true');
      body.append(cursor);
      root.classList.add('has-cursor');
    } else if (!enabled && cursor) {
      cursor.remove(); cursor = null; cursorPlaced = false;
      root.classList.remove('has-cursor');
    }
  }

  /* ---- switch ---- */
  function apply() {
    active = preference === 'on' && !reduced.matches;
    root.classList.toggle('motion', active);
    body.classList.toggle('motion-paused', !active);
    if (!active) {
      clearNotes();
      lightWords(words.length);
      litCount = -1;
      processList?.style.removeProperty('--process');
      processSteps.forEach(step => step.classList.add('on'));
      stack?.style.removeProperty('--px');
      stack?.style.removeProperty('--py');
    } else {
      // Re-arm notes for headings already on screen.
      noteTargets.forEach(element => { noteObserver?.unobserve(element); noteObserver?.observe(element); });
    }
    setCursor(active && finePointer.matches);
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
  finePointer.addEventListener?.('change', apply);
  window.addEventListener('resize', () => { fitText(); requestScrollUpdate(); }, { passive: true });
  document.fonts?.ready.then(fitText);
  apply();
})();
