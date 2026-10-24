/* Native anchors remain the navigation; this only tracks the reading position. */
(() => {
  'use strict';
  const page = document.body;
  try { page.classList.toggle('motion-paused', localStorage.getItem('erick-motion') === 'off'); } catch { /* Use system motion preference when storage is unavailable. */ }
  const nav = document.querySelector('.ref-reading-nav');
  const header = document.querySelector('.ref-header');
  if (!nav || !header) return;
  const links = [...nav.querySelectorAll('a[href^="#"]')].filter(link => !link.classList.contains('ref-reading-top'));
  const sections = links.map(link => ({link, section: document.getElementById(link.hash.slice(1))})).filter(item => item.section);
  let frame = 0;
  let headerHeight = -1;
  let navHeight = -1;
  let current = null;
  function update() {
    frame = 0;
    const headerSticky = getComputedStyle(header).position === 'sticky';
    const nextHeader = headerSticky ? Math.ceil(header.getBoundingClientRect().height) : 0;
    const nextNav = Math.ceil(nav.getBoundingClientRect().height);
    if (nextHeader !== headerHeight) { headerHeight = nextHeader; page.style.setProperty('--ref-header-offset', `${headerHeight}px`); }
    if (nextNav !== navHeight) { navHeight = nextNav; page.style.setProperty('--ref-reading-height', `${navHeight}px`); }
    const threshold = headerHeight + navHeight + 25;
    let active = null;
    sections.forEach(item => { if (item.section.getBoundingClientRect().top <= threshold) active = item.link; });
    // A short final section cannot always reach the top reading line.
    if (window.scrollY > 0 && document.documentElement.scrollHeight - window.innerHeight - window.scrollY <= 2) {
      const lastVisible = sections.filter(item => item.section.getBoundingClientRect().top < window.innerHeight).at(-1);
      if (lastVisible) active = lastVisible.link;
    }
    if (active !== current) {
      links.forEach(link => { if (link === active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
      current = active;
    }
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(update); }
  window.addEventListener('scroll', schedule, {passive: true});
  window.addEventListener('resize', schedule, {passive: true});
  window.addEventListener('hashchange', schedule);
  window.addEventListener('pageshow', schedule);
  document.addEventListener('toggle', schedule, true);
  // Section sizes change when cases are filtered or their details expand.
  if (typeof ResizeObserver === 'function') {
    const observer = new ResizeObserver(schedule);
    [header, nav, ...sections.map(item => item.section)].forEach(element => observer.observe(element));
  } else {
    document.addEventListener('input', schedule);
    document.addEventListener('click', schedule);
  }
  window.addEventListener('storage', event => {
    if (event.key === 'erick-motion' || event.key === null) {
      try { page.classList.toggle('motion-paused', localStorage.getItem('erick-motion') === 'off'); } catch { /* Keep current preference. */ }
    }
  });
  update();
})();
