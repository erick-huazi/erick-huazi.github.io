/* v70 "Signal" motion layer.
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

  /* ---- Shanghai clock: plain information, runs regardless of the motion switch ---- */
  const clocks = $$('[data-clock]');
  if (clocks.length && typeof Intl === 'object') {
    try {
      const format = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
      const tick = () => {
        if (document.hidden) return;
        const now = format.format(new Date());
        clocks.forEach(clock => { const time = clock.querySelector('time'); if (time) time.textContent = now; clock.hidden = false; });
      };
      tick();
      window.setInterval(tick, 1000);
    } catch { /* keep the clock hidden */ }
  }

  /* ---- fit display type to its container ---- */
  const hero = $('.hero');
  const wordmark = $('[data-vf]');
  let letters = [];
  let letterRow = null;
  if (wordmark) {
    const text = wordmark.textContent.trim();
    const label = document.createElement('span');
    label.className = 'sr-only';
    label.textContent = text;
    letterRow = document.createElement('span');
    letterRow.className = 'vf-row';
    letterRow.setAttribute('aria-hidden', 'true');
    for (const character of text) {
      const span = document.createElement('span');
      if (character === ' ') span.className = 'sp';
      else { span.textContent = character; letters.push(span); }
      letterRow.append(span);
    }
    wordmark.replaceChildren(label, letterRow);
  }
  const levels = letters.map(() => 0);
  function paintLetter(span, level) {
    span.style.setProperty('--a', level.toFixed(3));
    span.style.setProperty('--wg', String(Math.round(560 + 340 * level)));
    span.style.setProperty('--wd', (90 + 35 * level).toFixed(1));
  }
  function fitText() {
    for (const element of $$('[data-fit]')) {
      const row = element === wordmark ? letterRow : element.firstElementChild;
      const style = window.getComputedStyle(element);
      const box = element.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      if (!row || !(box > 0)) continue;
      if (element === wordmark) letters.forEach(span => paintLetter(span, 0));
      element.style.fontSize = '100px';
      const width = row.getBoundingClientRect().width;
      if (!width) { element.style.removeProperty('font-size'); continue; }
      const ratio = Number(element.dataset.fit) || 1;
      const limit = Number(element.dataset.fitVh) ? window.innerHeight * Number(element.dataset.fitVh) / 100 : Infinity;
      element.style.fontSize = `${Math.min(100 * box * ratio / width, limit).toFixed(1)}px`;
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
  const scrambleTargets = new WeakSet($$('.section-number,.reference-teaser-label,.eyebrow'));
  const glyphs = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789/#+';
  function scramble(element) {
    const final = element.textContent;
    const characters = [...final];
    let frame = 0;
    const total = 16;
    const timer = window.setInterval(() => {
      frame += 1;
      if (!active || frame >= total) { window.clearInterval(timer); element.textContent = final; return; }
      const settled = frame / total * characters.length;
      element.textContent = characters.map((character, index) =>
        index < settled || !/[A-Za-z0-9]/.test(character) ? character : glyphs[Math.floor(Math.random() * glyphs.length)]).join('');
    }, 38);
  }
  const revealTargets = $$('[data-reveal],.rv,.case-product-preview,.section-number,.reference-teaser-label,.eyebrow');
  let revealObserver = null;
  if ('IntersectionObserver' in window) {
    revealObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('in');
        if (active && scrambleTargets.has(entry.target)) scramble(entry.target);
        revealObserver.unobserve(entry.target);
      }
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.06 });
    revealTargets.forEach(element => revealObserver.observe(element));
  } else revealTargets.forEach(element => element.classList.add('in'));

  /* ---- scroll-linked values: one passive listener, one frame ---- */
  const progressBar = document.createElement('div');
  progressBar.className = 'progress';
  progressBar.setAttribute('aria-hidden', 'true');
  body.append(progressBar);
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
  const caseHeadings = $$('.case-heading');
  const marqueeTrack = $('.marquee-track');
  let marqueeAnimation = null;
  let marqueeRate = 1;
  let lastScroll = window.scrollY;
  let scrollFrame = 0;
  function lightWords(count) {
    if (count === litCount) return;
    words.forEach((word, index) => word.classList.toggle('lit', index < count));
    litCount = count;
  }
  function updateScroll() {
    scrollFrame = 0;
    const viewport = Math.max(window.innerHeight, 1);
    const scrollable = Math.max(root.scrollHeight - viewport, 1);
    progressBar.style.setProperty('--scroll', clamp(window.scrollY / scrollable).toFixed(4));
    if (!active) return;
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
    for (const heading of caseHeadings) {
      const rect = heading.getBoundingClientRect();
      if (rect.bottom < -200 || rect.top > viewport + 200) continue;
      heading.style.setProperty('--drift', ((rect.top + rect.height / 2 - viewport / 2) / viewport * -34).toFixed(1));
    }
    const delta = window.scrollY - lastScroll;
    lastScroll = window.scrollY;
    if (marqueeTrack && Math.abs(delta) > 1) {
      marqueeAnimation ||= marqueeTrack.getAnimations?.()[0] || null;
      marqueeRate = Math.min(1 + Math.abs(delta) / 6, 9);
    }
  }
  function requestScrollUpdate() { if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateScroll); }
  window.addEventListener('scroll', requestScrollUpdate, { passive: true });

  /* ---- hero wordmark: variable-font proximity, idle wave without a pointer ---- */
  let pointerX = -1e5, pointerY = -1e5, pointerSeen = 0;
  let heroVisible = true;
  let loopFrame = 0;
  let idle = 1;
  function loop(now) {
    loopFrame = 0;
    if (!active) return;
    if (marqueeAnimation) {
      marqueeRate += (1 - marqueeRate) * 0.06;
      marqueeAnimation.playbackRate = marqueeRate;
    }
    if (heroVisible && letters.length && !document.hidden) {
      const centres = letters.map(span => { const rect = span.getBoundingClientRect(); return [rect.left + rect.width / 2, rect.top + rect.height / 2]; });
      const radius = Math.max(window.innerWidth * 0.26, 220);
      const pointerActive = now - pointerSeen < 2400;
      idle += ((pointerActive ? 0 : 1) - idle) * 0.04;
      letters.forEach((span, index) => {
        const distance = Math.hypot(centres[index][0] - pointerX, centres[index][1] - pointerY);
        const near = clamp(1 - distance / radius);
        const wave = (0.5 + 0.5 * Math.sin(now * 0.0011 - index * 0.62)) ** 3;
        const target = Math.max(near * near * (3 - 2 * near) * (1 - idle * 0.5), wave * idle);
        levels[index] += (target - levels[index]) * 0.11;
        paintLetter(span, levels[index]);
      });
    }
    schedule();
  }
  function schedule() {
    if (!loopFrame && active && !document.hidden && (heroVisible || marqueeRate > 1.02)) loopFrame = window.requestAnimationFrame(loop);
  }
  window.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch') return;
    pointerX = event.clientX; pointerY = event.clientY; pointerSeen = performance.now();
    moveCursor();
  }, { passive: true });
  if (hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(entries => { heroVisible = entries[0].isIntersecting; schedule(); }).observe(hero);
  }
  window.addEventListener('scroll', schedule, { passive: true });
  document.addEventListener('visibilitychange', schedule);

  /* ---- cursor companion (fine pointers only) ---- */
  let cursor = null;
  let cursorX = 0, cursorY = 0, cursorFrame = 0, cursorPlaced = false;
  function drawCursor() {
    cursorFrame = 0;
    if (!cursor) return;
    cursorX += (pointerX - cursorX) * 0.24;
    cursorY += (pointerY - cursorY) * 0.24;
    cursor.style.transform = `translate3d(${cursorX.toFixed(1)}px,${cursorY.toFixed(1)}px,0)`;
    if (Math.abs(pointerX - cursorX) + Math.abs(pointerY - cursorY) > 0.4) cursorFrame = window.requestAnimationFrame(drawCursor);
  }
  function moveCursor() {
    if (!cursor) return;
    if (!cursorPlaced) { cursorX = pointerX; cursorY = pointerY; cursorPlaced = true; }
    cursor.classList.add('on');
    if (!cursorFrame) cursorFrame = window.requestAnimationFrame(drawCursor);
  }
  function describeCursor(target) {
    if (!cursor) return;
    const element = target instanceof Element ? target : null;
    const preview = element?.closest('.case-product-preview,.wechat-preview');
    const link = !preview && element?.closest('a,button,summary,select,[role="option"]');
    cursor.dataset.label = preview ? (preview.matches('.wechat-preview') ? '放大' : '访问 ↗') : '';
    cursor.classList.toggle('is-label', Boolean(preview));
    cursor.classList.toggle('is-link', Boolean(link));
  }
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
  document.addEventListener('pointerover', event => describeCursor(event.target), { passive: true });
  document.addEventListener('pointerleave', () => cursor?.classList.remove('on'));
  root.addEventListener('mouseleave', () => cursor?.classList.remove('on'));

  /* ---- switch ---- */
  function apply() {
    active = preference === 'on' && !reduced.matches;
    root.classList.toggle('motion', active);
    body.classList.toggle('motion-paused', !active);
    letterRow?.classList.toggle('live', active);
    if (!active) {
      letters.forEach(span => ['--a', '--wg', '--wd'].forEach(name => span.style.removeProperty(name)));
      lightWords(words.length);
      litCount = -1;
      processList?.style.removeProperty('--process');
      processSteps.forEach(step => step.classList.add('on'));
      caseHeadings.forEach(heading => heading.style.removeProperty('--drift'));
      if (marqueeAnimation) marqueeAnimation.playbackRate = 1;
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
    schedule();
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
  window.addEventListener('pagehide', () => { window.cancelAnimationFrame(loopFrame); loopFrame = 0; });
  window.addEventListener('pageshow', schedule);
  apply();
})();
