'use strict';
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const contactEmail = 'zjh_fxh@163.com';
const contactPhone = '17621988864';
const contactWechat = 'ErickX1024';
const siteUrl = 'https://erick-huazi.github.io/';
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.body.classList.contains('motion-paused');
const menu = $('.menu');
const nav = $('#nav-links');
function closeMenu(returnFocus = false) { menu.setAttribute('aria-expanded', 'false'); nav.classList.remove('open'); if (returnFocus) menu.focus(); }
menu.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded', String(open)); nav.classList.toggle('open', open); });
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu()));
document.addEventListener('keydown', event => { if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') closeMenu(true); });
document.addEventListener('click', event => { if (!event.target.closest('.nav')) closeMenu(); });
matchMedia('(min-width: 761px)').addEventListener('change', event => { if (event.matches) closeMenu(); });
document.documentElement.classList.add('js');
let toastTimer;
function notify(message) { const toast = $('#toast'); toast.textContent = message; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 3600); }
let copyOrigin;
const copyFeedback = new WeakMap();
function markCopied(origin) {
  if (!(origin instanceof HTMLElement) || !origin.matches('[data-copy-email],[data-copy-phone],[data-copy-wechat]')) return;
  clearTimeout(copyFeedback.get(origin));
  origin.dataset.copied = 'true';
  copyFeedback.set(origin, setTimeout(() => { delete origin.dataset.copied; copyFeedback.delete(origin); }, 2200));
}
async function copyText(text, origin = document.activeElement) {
  try { await navigator.clipboard.writeText(text); markCopied(origin); notify('已复制，可以粘贴使用。'); return true; }
  catch {
    const dialog = $('#copy-dialog'), value = $('#copy-value');
    copyOrigin = origin;
    value.value = text;
    const short = text.length <= 120 && !text.includes('\n');
    dialog.dataset.copySize = short ? 'short' : 'long';
    value.rows = short ? 3 : 9;
    dialog.showModal();
    value.focus(); value.select();
    return false;
  }
}
$('#close-copy').addEventListener('click', () => $('#copy-dialog').close());
$('#copy-dialog').addEventListener('close', () => copyOrigin?.focus());
$$('[data-copy-email]').forEach(button => { button.addEventListener('click', () => copyText(contactEmail, button)); button.hidden = false; });
$$('[data-copy-phone]').forEach(button => { button.addEventListener('click', () => copyText(contactPhone, button)); button.hidden = false; });
$$('[data-copy-wechat]').forEach(button => {
  button.addEventListener('click', async () => { const copied = await copyText(contactWechat, button); if (copied && button.closest('#wechat-dialog')) $('#wechat-copy-status').textContent = '微信号已复制，可切换到微信添加好友。'; });
  button.hidden = false;
});
const wechatDialog = $('#wechat-dialog');
let wechatOrigin;
$$('[data-open-wechat]').forEach(button => button.addEventListener('click', event => {
  if (typeof wechatDialog.showModal !== 'function' || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  wechatOrigin = button.closest('#nav-links') && matchMedia('(max-width:760px)').matches ? menu : button;
  closeMenu(); $('#wechat-copy-status').textContent = '复制微信号，在微信中搜索添加。';
  const qr = wechatDialog.querySelector('[data-qr-src]');
  if (!qr.hasAttribute('src')) qr.src = qr.dataset.qrSrc;
  wechatDialog.showModal();
  wechatDialog.scrollTop = 0;
}));
$('#close-wechat').addEventListener('click', () => wechatDialog.close());
wechatDialog.addEventListener('close', () => wechatOrigin?.focus());
wechatDialog.addEventListener('click', event => { if (event.target === wechatDialog) { const r = wechatDialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) wechatDialog.close(); } });
// The original image link remains usable without dialog support or with modified clicks.
const projectViewer = $('#project-viewer');
if (projectViewer && typeof projectViewer.showModal === 'function') {
  const viewerImage = projectViewer.querySelector('[data-viewer-src]');
  const viewerFrame = $('#project-viewer-frame');
  const viewerZoom = $('#project-viewer-zoom');
  let viewerOrigin;
  function resetProjectView() {
    projectViewer.classList.remove('is-zoomed');
    viewerZoom.setAttribute('aria-pressed', 'false');
    viewerZoom.textContent = '放大细节';
    $('#project-viewer-hint').textContent = '可放大查看界面细节';
    viewerFrame.scrollTop = 0;
    viewerFrame.scrollLeft = 0;
  }
  $$('[data-open-project-viewer]').forEach(link => {
    link.setAttribute('aria-haspopup', 'dialog');
    link.setAttribute('aria-controls', 'project-viewer');
    link.setAttribute('aria-label', '查看实屏大图：世界杯项目');
    link.addEventListener('click', event => {
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      if (projectViewer.open) return;
      resetProjectView();
      if (!viewerImage.hasAttribute('src')) viewerImage.src = viewerImage.dataset.viewerSrc;
      try { projectViewer.showModal(); } catch { return; }
      event.preventDefault();
      viewerOrigin = link;
    });
  });
  $('#close-project-viewer').addEventListener('click', () => projectViewer.close());
  viewerZoom.addEventListener('click', () => {
    const zoomed = projectViewer.classList.toggle('is-zoomed');
    viewerZoom.setAttribute('aria-pressed', String(zoomed));
    viewerZoom.textContent = zoomed ? '适应窗口' : '放大细节';
    $('#project-viewer-hint').textContent = zoomed ? '滑动或使用方向键查看，点击“适应窗口”还原' : '可放大查看界面细节';
    viewerFrame.scrollTop = 0;
    viewerFrame.scrollLeft = 0;
    if (zoomed) viewerFrame.focus({ preventScroll: true });
  });
  projectViewer.addEventListener('close', () => {
    resetProjectView();
    if (viewerOrigin?.isConnected) viewerOrigin.focus({ preventScroll: true });
  });
  projectViewer.addEventListener('click', event => {
    if (event.target !== projectViewer) return;
    const bounds = projectViewer.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) projectViewer.close();
  });
}
$('#share-page').addEventListener('click', () => copyText(siteUrl));
$('#share-page').hidden = false;
const form = $('#inquiry-form');
const inquiryDetails = $('#inquiry-details');
const output = $('#summary-output');
const outputPlaceholder = $('#summary-placeholder');
const nameField = $('#visitor-name');
const needField = $('#visitor-need');
let generatedBody = '';
let generatedFilename = '咨询需求.txt';
let lastSuggestedNeed = '';
const serviceTemplates = new Map($$('.offer [data-service][data-need]').map(link => [link.dataset.service, link.dataset.need]));
function syncServiceTemplate(service, suggestion = serviceTemplates.get(service) || '') {
  const canReplace = !needField.value.trim() || needField.value === lastSuggestedNeed;
  if (canReplace) {
    needField.value = suggestion;
    lastSuggestedNeed = needField.value;
  }
  return canReplace;
}
function showServiceSelection(service, replaced) {
  const message = !replaced ? '已保留你填写的需求，可继续修改。'
    : needField.value ? '已填入场景示例，请按实际需求修改并补充称呼。'
      : '请补充称呼和具体需求。';
  $('#form-status').textContent = `已选择：${service}。${message}内容尚未发送。`;
}
function restoreInquiryHash() {
  if (location.hash === '#inquiry-details') inquiryDetails.open = true;
}
restoreInquiryHash();
window.addEventListener('hashchange', restoreInquiryHash);
window.addEventListener('popstate', restoreInquiryHash);
function invalidateSummary() {
  if (generatedBody) { generatedBody = ''; output.hidden = true; outputPlaceholder.hidden = false; $('#summary-text').value = ''; $('#email-draft').href = `mailto:${contactEmail}`; $('#form-status').textContent = '内容已修改，请重新整理需求后发送。'; }
  $('#need-count').textContent = `${needField.value.length} / 1500`;
  nameField.setCustomValidity(''); needField.setCustomValidity('');
}
form.addEventListener('input', invalidateSummary);
form.addEventListener('change', invalidateSummary);
$('#service-select').addEventListener('change', () => {
  const service = $('#service-select').value;
  const replaced = syncServiceTemplate(service);
  invalidateSummary();
  showServiceSelection(service, replaced);
});
$$('[data-service]').forEach(link => link.addEventListener('click', event => {
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
  inquiryDetails.open = true;
  $('#service-select').value = link.dataset.service;
  const replaced = syncServiceTemplate(link.dataset.service, link.dataset.need ?? serviceTemplates.get(link.dataset.service) ?? '');
  invalidateSummary();
  showServiceSelection(link.dataset.service, replaced);
}));
form.addEventListener('submit', event => {
  event.preventDefault();
  nameField.setCustomValidity(nameField.value.trim() ? '' : '请填写你的称呼。');
  needField.setCustomValidity(needField.value.trim() ? '' : '请简单描述希望解决的问题。');
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const name = nameField.value.trim(), service = String(data.get('service'));
  generatedBody = `张建华你好，\n\n我是 ${name}，想咨询「${service}」。\n\n我的需求：\n${needField.value.trim()}\n\n希望的沟通方式：${data.get('mode')}\n期望时间：${String(data.get('timing')).trim() || '双方协商'}\n\n请告知合适的沟通时间、合作范围及费用。谢谢！`;
  generatedFilename = `咨询需求-${service}.txt`;
  $('#summary-text').value = generatedBody;
  const subject = encodeURIComponent(`合作咨询｜${service}｜${name}`);
  const fullLink = `mailto:${contactEmail}?subject=${subject}&body=${encodeURIComponent(generatedBody)}`;
  const long = fullLink.length > 1800;
  $('#email-draft').href = long ? `mailto:${contactEmail}?subject=${subject}` : fullLink;
  $('#email-draft').textContent = long ? '打开空白邮件 ↗' : '打开邮件 ↗';
  $('#email-help').textContent = long ? '需求较长：先复制全文，再打开邮件粘贴发送，避免邮件软件截断。也可下载文本作为附件。' : '可以直接打开邮件软件发送；也可复制全文，通过微信发送给我。';
  outputPlaceholder.hidden = true;
  output.hidden = false;
  $('#form-status').textContent = '需求已整理，尚未发送。';
  $('#summary-title').focus({ preventScroll: true });
  $('#summary-title').scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
});
$('#edit-inquiry').addEventListener('click', () => {
  needField.focus({ preventScroll: true });
  needField.closest('label').scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
});
$('#copy-inquiry').addEventListener('click', () => { if (generatedBody) copyText(generatedBody); });
$('#download-inquiry').addEventListener('click', () => {
  if (!generatedBody) return;
  const url = URL.createObjectURL(new Blob(['\uFEFF' + generatedBody], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = generatedFilename; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1500);
  notify('已生成需求文本，尚未发送。');
});
$('#generate-inquiry').disabled = false;
$('#inquiry-unavailable').hidden = true;
// Project index: native buttons remain keyboard accessible; all content exists without JS.
const projectFilters = $$('[data-project-filter]');
const archivedProjects = $('#project-archive');
const liveProjectList = $('.case-list');
const projectDirectory = $('.project-directory');
function setProjectFilter(value, writeHistory = false) {
  if (!['live', 'archive', 'all'].includes(value)) value = 'live';
  projectFilters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.projectFilter === value)));
  $$('.case-row').forEach(project => { project.hidden = value === 'archive'; });
  liveProjectList.hidden = value === 'archive';
  projectDirectory.hidden = value === 'archive';
  archivedProjects.hidden = value === 'live';
  if (value !== 'live') archivedProjects.open = true;
  $('#project-count').textContent = value === 'live' ? '2 个独立上线产品' : value === 'archive' ? '3 个过往项目实践' : '共 5 个项目';
  if (writeHistory) {
    const url = new URL(location.href);
    if (value === 'live') url.searchParams.delete('view'); else url.searchParams.set('view', value);
    const hashTarget = document.getElementById(url.hash.slice(1));
    if (hashTarget?.closest('[hidden]')) url.hash = 'work';
    if (url.href !== location.href) history.pushState(null, '', url);
  }
}
projectFilters.forEach(button => button.addEventListener('click', () => setProjectFilter(button.dataset.projectFilter, true)));
$('.project-filter').hidden = false;
setProjectFilter(new URLSearchParams(location.search).get('view') || 'live');
function revealProject(id) {
  const target = document.getElementById(id);
  if (!target) return null;
  if (target === archivedProjects || target.matches('.archive-item')) { if (archivedProjects.hidden) setProjectFilter('archive'); archivedProjects.open = true; }
  else if (target.matches('.case-row') && target.hidden) setProjectFilter('live');
  return target;
}
function navigateToSection(id, moveFocus = false) {
  const target = revealProject(id);
  if (!target) return;
  const url = new URL(location.href);
  const filter = projectFilters.find(button => button.getAttribute('aria-pressed') === 'true')?.dataset.projectFilter || 'live';
  if (filter === 'live') url.searchParams.delete('view'); else url.searchParams.set('view', filter);
  url.hash = id;
  if (url.href !== location.href) history.pushState(null, '', url);
  target.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
  if (moveFocus) {
    const heading = target.querySelector('h2,h3') || target;
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
  }
}
$$('a[href^="#project-"]').forEach(link => link.addEventListener('click', event => {
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
  event.preventDefault();
  navigateToSection(link.hash.slice(1), true);
}));
function restoreProjectHash() {
  if (!location.hash.startsWith('#project-')) return;
  const target = revealProject(location.hash.slice(1));
  if (target) requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
}
restoreProjectHash();
window.addEventListener('hashchange', restoreProjectHash);
window.addEventListener('popstate', () => {
  setProjectFilter(new URLSearchParams(location.search).get('view') || 'live');
  restoreProjectHash();
});

// Native combobox keeps typing focus while the active result follows keyboard selection.
const quickDialog = $('#quick-dialog');
const quickInput = $('#quick-query');
const quickItems = $$('.quick-item');
const quickRecords = quickItems.map((item, index) => {
  item.id = `quick-option-${index}`;
  item.setAttribute('role', 'option'); item.setAttribute('aria-selected', 'false'); item.tabIndex = -1;
  return { id: item.id, title: item.querySelector('span').firstChild.textContent.trim(), description: item.querySelector('small').textContent, aliases: item.dataset.searchAlias || '' };
});
let quickOrigin, restoreQuickFocus = true, quickComposing = false;
let quickVisible = [], quickActive = -1, searchRanker, searchLoading;
function setQuickActive(index, scroll = false) {
  quickActive = quickVisible.length ? Math.max(0, Math.min(index, quickVisible.length - 1)) : -1;
  quickItems.forEach(item => item.setAttribute('aria-selected', String(item === quickVisible[quickActive])));
  const selected = quickVisible[quickActive];
  if (selected) {
    quickInput.setAttribute('aria-activedescendant', selected.id);
    if (scroll && quickDialog.open) {
      const list = $('#quick-results');
      const itemRect = selected.getBoundingClientRect(), listRect = list.getBoundingClientRect();
      if (itemRect.top < listRect.top) list.scrollTop += itemRect.top - listRect.top;
      else if (itemRect.bottom > listRect.bottom) list.scrollTop += itemRect.bottom - listRect.bottom;
    }
  } else quickInput.removeAttribute('aria-activedescendant');
}
function filterQuickItems(keepActive = false) {
  const previousId = keepActive ? quickVisible[quickActive]?.id : null;
  const terms = quickInput.value.normalize('NFKC').trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const matches = searchRanker ? searchRanker(quickInput.value) : quickRecords.filter(record => {
    const searchable = [record.title, record.description, record.aliases].join(' ').toLocaleLowerCase();
    return terms.every(term => /^[a-z]{1,2}$/.test(term) ? new RegExp(`\\b${term}`).test(searchable) : searchable.includes(term));
  }).map(record => ({ id: record.id, approximate: false }));
  quickItems.forEach(item => { item.hidden = true; });
  quickVisible = matches.map(match => {
    const item = document.getElementById(match.id);
    item.hidden = false;
    item.dataset.approximate = String(match.approximate);
    $('#quick-results').appendChild(item);
    return item;
  });
  $('#quick-results').hidden = quickVisible.length === 0;
  quickInput.setAttribute('aria-expanded', String(quickDialog.open && quickVisible.length > 0));
  $('#quick-empty').hidden = quickVisible.length > 0;
  $('#quick-clear').hidden = !quickInput.value;
  $('#quick-count').textContent = `${quickVisible.length} 个结果${matches.some(item => item.approximate) ? '，含拼写近似结果' : ''}`;
  const previousIndex = quickVisible.findIndex(item => item.id === previousId);
  setQuickActive(previousIndex < 0 ? 0 : previousIndex, true);
}
function loadQuickSearch() {
  if (!searchLoading) searchLoading = Promise.all([import('./assets/vendor/fuse.basic.min.mjs'), import('./assets/quick-search.mjs')])
    .then(([fuse, search]) => {
      searchRanker = search.createQuickSearch(quickRecords, fuse.default);
      if (quickDialog.open && !quickComposing) filterQuickItems(true);
    }).catch(() => { /* Exact matching remains available without the optional module. */ searchLoading = null; });
}
function openQuick() {
  if ($$('dialog[open]').length) return;
  quickOrigin = nav.contains(document.activeElement) && matchMedia('(max-width:760px)').matches ? menu : document.activeElement;
  closeMenu();
  restoreQuickFocus = true;
  quickComposing = false;
  quickInput.value = '';
  filterQuickItems();
  quickDialog.showModal();
  $('#quick-results').scrollTop = 0;
  quickInput.setAttribute('aria-expanded', String(quickVisible.length > 0));
  quickInput.focus();
  loadQuickSearch();
}
$$('[data-open-quick]').forEach(button => { button.hidden = false; button.addEventListener('click', openQuick); });
$('#close-quick').addEventListener('click', () => quickDialog.close());
quickDialog.addEventListener('close', () => {
  quickInput.setAttribute('aria-expanded', 'false'); quickInput.removeAttribute('aria-activedescendant');
  if (restoreQuickFocus) (quickOrigin?.getClientRects().length ? quickOrigin : $('.quick-trigger')).focus();
});
quickDialog.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  event.preventDefault(); event.stopPropagation();
  if (!event.isComposing && !quickComposing) quickDialog.close();
});
quickDialog.addEventListener('cancel', event => { if (quickComposing) event.preventDefault(); });
quickInput.addEventListener('compositionstart', () => { quickComposing = true; });
quickInput.addEventListener('compositionend', () => { quickComposing = false; filterQuickItems(); });
quickInput.addEventListener('input', event => { if (!event.isComposing && !quickComposing) filterQuickItems(); });
$('#quick-clear').addEventListener('click', () => { quickInput.value = ''; filterQuickItems(); quickInput.focus(); });
$$('[data-quick-query]').forEach(button => button.addEventListener('click', () => { quickInput.value = button.dataset.quickQuery; filterQuickItems(); quickInput.focus(); }));
quickInput.addEventListener('keydown', event => {
  if (event.isComposing || quickComposing || !quickVisible.length) return;
  if (event.key === 'ArrowDown') { event.preventDefault(); setQuickActive((quickActive + 1) % quickVisible.length, true); }
  if (event.key === 'ArrowUp') { event.preventDefault(); setQuickActive((quickActive - 1 + quickVisible.length) % quickVisible.length, true); }
  if (event.key === 'Enter') { event.preventDefault(); quickVisible[quickActive]?.click(); }
});
quickItems.forEach(item => item.addEventListener('pointermove', () => { const index = quickVisible.indexOf(item); if (index >= 0) setQuickActive(index); }));
quickItems.forEach(item => item.addEventListener('click', () => {
  const href = item.dataset.quickHref;
  const id = item.dataset.quickTarget;
  restoreQuickFocus = false;
  quickDialog.close();
  if (href) location.assign(href);
  else {
    if (id === 'inquiry-details') inquiryDetails.open = true;
    navigateToSection(id, true);
  }
}));
document.addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k' && !event.isComposing) { event.preventDefault(); if (quickDialog.open) quickDialog.close(); else openQuick(); }
});
const shortcutLabel = $('.quick-trigger kbd');
shortcutLabel.textContent = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘ K' : 'Ctrl K';
$('.quick-trigger').setAttribute('aria-label', `快速前往 ${shortcutLabel.textContent}`);
// Treat all native overlays consistently; returning focus stays with the original control.
[quickDialog, $('#copy-dialog')].forEach(dialog => dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const r = dialog.getBoundingClientRect();
  if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
}));
document.addEventListener('focusin', event => { if (menu.getAttribute('aria-expanded') === 'true' && !event.target.closest('.nav')) closeMenu(); });
if ('IntersectionObserver' in window) {
  const navLinks = $$('#nav-links a');
  const activeSections = new Set();
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) activeSections.add(entry.target); else activeSections.delete(entry.target); });
    const current = [...activeSections].sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)[0];
    navLinks.forEach(link => { if (current?.id && link.hash === '#' + current.id) link.setAttribute('aria-current','location'); else link.removeAttribute('aria-current'); });
  }, { rootMargin: '-20% 0px -60% 0px' });
  ['.hero','#work','#services','#about','#contact'].forEach(selector => sectionObserver.observe($(selector)));
  const mobileBar = $('.mobile-contact');
  let heroVisible = true, contactVisible = false;
  const updateBar = () => { mobileBar.hidden = heroVisible || contactVisible; };
  const barObserver = new IntersectionObserver(entries => { for (const entry of entries) { if (entry.target.classList.contains('hero')) heroVisible = entry.isIntersecting; else contactVisible = entry.isIntersecting; } updateBar(); }, { threshold: 0 });
  barObserver.observe($('.hero')); barObserver.observe($('#contact'));
}
