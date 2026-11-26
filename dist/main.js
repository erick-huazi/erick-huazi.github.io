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
let pendingCopy;
document.addEventListener('focusin', event => {
  // Moving into or out of a dialog abandons clipboard prompts from the previous view.
  if (pendingCopy && event.target.closest('dialog') !== pendingCopy.dialog) pendingCopy = null;
});
const copyFeedback = new WeakMap();
function markCopied(origin) {
  if (!(origin instanceof HTMLElement) || !origin.matches('[data-copy-email],[data-copy-phone],[data-copy-wechat]')) return;
  clearTimeout(copyFeedback.get(origin));
  origin.dataset.copied = 'true';
  copyFeedback.set(origin, setTimeout(() => { delete origin.dataset.copied; copyFeedback.delete(origin); }, 2200));
}
async function copyText(text, origin = document.activeElement, isCurrent = () => true) {
  const request = { dialog: origin?.closest('dialog') ?? null };
  pendingCopy = request;
  const acceptsResult = () => pendingCopy === request && isCurrent();
  try {
    await navigator.clipboard.writeText(text);
    if (!acceptsResult()) return 'superseded';
    markCopied(origin); notify('已复制，可以粘贴使用。'); return 'copied';
  } catch {
    if (!acceptsResult()) return 'superseded';
    const dialog = $('#copy-dialog'), value = $('#copy-value');
    copyOrigin = origin;
    value.value = text;
    const short = text.length <= 120 && !text.includes('\n');
    dialog.dataset.copySize = short ? 'short' : 'long';
    value.rows = short ? 3 : 9;
    dialog.showModal();
    value.focus(); value.select();
    return 'manual';
  } finally {
    if (pendingCopy === request) pendingCopy = null;
  }
}
$('#close-copy').addEventListener('click', () => $('#copy-dialog').close());
$('#copy-dialog').addEventListener('close', () => copyOrigin?.focus());
$$('[data-copy-email]').forEach(button => { button.addEventListener('click', () => copyText(contactEmail, button)); button.hidden = false; });
$$('[data-copy-phone]').forEach(button => { button.addEventListener('click', () => copyText(contactPhone, button)); button.hidden = false; });
const wechatDialog = $('#wechat-dialog');
let wechatOrigin;
let wechatSession = 0;
$$('[data-copy-wechat]').forEach(button => {
  button.addEventListener('click', async () => {
    const fromDialog = button.closest('#wechat-dialog');
    const session = wechatSession;
    // Clipboard permissions may resolve after the dialog has been closed or reopened.
    const isCurrent = () => !fromDialog || (wechatDialog.open && session === wechatSession);
    const result = await copyText(contactWechat, button, isCurrent);
    if (result === 'copied' && fromDialog && isCurrent()) $('#wechat-copy-status').textContent = '微信号已复制，可切换到微信添加好友。';
  });
  button.hidden = false;
});
if (typeof wechatDialog.showModal === 'function') {
  $$('[data-open-wechat]').forEach(button => {
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-controls', wechatDialog.id);
    button.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      wechatSession += 1;
      wechatOrigin = button.closest('#nav-links') && matchMedia('(max-width:760px)').matches ? menu : button;
      closeMenu();
      $('#wechat-copy-status').textContent = '复制微信号，在微信中搜索添加。';
      const qr = wechatDialog.querySelector('[data-qr-src]');
      if (!qr.hasAttribute('src')) qr.src = qr.dataset.qrSrc;
      wechatDialog.showModal();
      wechatDialog.scrollTop = 0;
    });
  });
}
$('#close-wechat').addEventListener('click', () => wechatDialog.close());
wechatDialog.addEventListener('close', () => {
  if (wechatDialog.open) return;
  wechatSession += 1;
  wechatOrigin?.focus();
});
wechatDialog.addEventListener('click', event => { if (event.target === wechatDialog) { const r = wechatDialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) wechatDialog.close(); } });
// The original image links remain usable without dialog support or with modified clicks.
(() => {
  const projectViewer = $('#project-viewer');
  if (!projectViewer || typeof projectViewer.showModal !== 'function') return;
  let viewerImage = projectViewer.querySelector('img[data-viewer-src]');
  const viewerFrame = $('#project-viewer-frame');
  const viewerZoom = $('#project-viewer-zoom');
  const viewerTitle = $('#project-viewer-title');
  const viewerCategory = $('#project-viewer-category');
  const viewerPosition = $('#project-viewer-position');
  const viewerOriginal = $('#project-viewer-original');
  const viewerVisit = $('#project-viewer-visit');
  const viewerDate = $('#project-viewer-date');
  const viewerAccess = $('#project-viewer-access');
  const viewerStatus = $('#project-viewer-status');
  const viewerThumbs = $('#project-viewer-thumbs');
  const viewerPrevious = $('#project-viewer-prev');
  const viewerNext = $('#project-viewer-next');
  const viewerClose = $('#close-project-viewer');
  const viewerHint = $('#project-viewer-hint');
  if (![viewerImage, viewerFrame, viewerZoom, viewerTitle, viewerCategory, viewerPosition,
    viewerOriginal, viewerVisit, viewerDate, viewerAccess, viewerStatus, viewerThumbs,
    viewerPrevious, viewerNext, viewerClose].every(Boolean)) return;

  const items = $$('[data-open-project-viewer]').map(link => {
    const card = link.closest('.case-row');
    const image = card?.querySelector('.case-artwork img');
    const title = card?.querySelector('h3')?.textContent.trim();
    const date = card?.querySelector('.case-image-label time');
    const visit = card?.querySelector('.case-footer .btn')?.href;
    const width = Number(image?.getAttribute('width'));
    const height = Number(image?.getAttribute('height'));
    if (!image || !title || !visit || !Number.isFinite(width) || !Number.isFinite(height)
      || width <= 0 || height <= 0) return null;
    const smallSource = image.closest('picture')?.querySelector('source[type="image/webp"]')
      ?.getAttribute('srcset')?.split(',')[0]?.trim().split(/\s+/)[0];
    return {
      link, src: link.href, title, width, height, alt: image.alt,
      thumbnail: image.currentSrc || (smallSource ? new URL(smallSource, document.baseURI).href : image.src),
      category: card.querySelector('.case-eyebrow>span:first-child')?.textContent.trim() || 'PRODUCT SCREEN',
      dateTime: date?.dateTime || '', dateLabel: date?.textContent.trim() || '', visit,
      access: [card.querySelector('.case-access-note'), card.querySelector('.case-snapshot-note')].filter(Boolean).map(note => note.textContent.trim()).join(' ')
    };
  }).filter(Boolean);
  if (!items.length) return;

  let viewerOrigin;
  let activeIndex = -1;
  let loadRequest = 0;
  let settledRequest = 0;
  let thumbnailsBuilt = false;

  function resetProjectView() {
    projectViewer.classList.remove('is-zoomed');
    viewerZoom.setAttribute('aria-pressed', 'false');
    viewerZoom.textContent = '原尺寸';
    if (viewerHint) viewerHint.textContent = '左右滑动或聚焦图片后按方向键切换；可切换到原尺寸查看细节';
    viewerFrame.scrollTop = 0;
    viewerFrame.scrollLeft = 0;
  }

  function buildThumbnails() {
    if (thumbnailsBuilt) return;
    const fragment = document.createDocumentFragment();
    items.forEach((item, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'viewer-thumb';
      button.dataset.viewerIndex = String(index);
      button.setAttribute('aria-label', `查看实屏：${item.title}`);
      button.setAttribute('aria-pressed', 'false');
      const image = document.createElement('img');
      image.src = item.thumbnail;
      image.alt = '';
      image.width = 72;
      image.height = 48;
      image.loading = 'lazy';
      image.decoding = 'async';
      const title = document.createElement('span');
      title.textContent = item.title;
      button.append(image, title);
      fragment.append(button);
    });
    viewerThumbs.replaceChildren(fragment);
    thumbnailsBuilt = true;
  }

  function finishImage(request, failed = false) {
    if (request !== loadRequest || settledRequest === request || !projectViewer.open) return;
    settledRequest = request;
    viewerFrame.setAttribute('aria-busy', 'false');
    if (failed || !viewerImage.naturalWidth) {
      viewerImage.hidden = true;
      viewerZoom.disabled = true;
      projectViewer.dataset.viewerState = 'error';
      viewerStatus.textContent = '实屏暂未加载成功。可使用“打开原图”重试，或通过“访问项目”查看。';
      return;
    }
    viewerImage.width = viewerImage.naturalWidth;
    viewerImage.height = viewerImage.naturalHeight;
    projectViewer.style.setProperty('--viewer-image-width', `${viewerImage.naturalWidth}px`);
    viewerImage.hidden = false;
    viewerZoom.disabled = false;
    projectViewer.dataset.viewerState = 'ready';
    viewerStatus.textContent = `已显示 ${items[activeIndex].title}，第 ${activeIndex + 1} 张，共 ${items.length} 张。`;
  }

  function keepSelectedThumbVisible() {
    const button = viewerThumbs.querySelector('[aria-pressed="true"]');
    if (!button || viewerThumbs.scrollWidth <= viewerThumbs.clientWidth) return;
    const itemRect = button.getBoundingClientRect();
    const stripRect = viewerThumbs.getBoundingClientRect();
    if (itemRect.left < stripRect.left) viewerThumbs.scrollLeft += itemRect.left - stripRect.left;
    else if (itemRect.right > stripRect.right) viewerThumbs.scrollLeft += itemRect.right - stripRect.right;
  }

  function showItem(index) {
    activeIndex = (index + items.length) % items.length;
    const item = items[activeIndex];
    const request = ++loadRequest;
    resetProjectView();
    viewerTitle.textContent = item.title;
    viewerCategory.textContent = item.category;
    viewerPosition.textContent = `${String(activeIndex + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}`;
    viewerOriginal.href = item.src;
    viewerVisit.href = item.visit;
    viewerDate.textContent = item.dateLabel;
    if (item.dateTime) viewerDate.dateTime = item.dateTime;
    else viewerDate.removeAttribute('datetime');
    viewerAccess.textContent = item.access;
    viewerAccess.hidden = !item.access;
    viewerFrame.setAttribute('aria-label', `${item.title} 实屏，聚焦后可用左右方向键切换图片`);
    viewerFrame.setAttribute('aria-busy', 'true');
    // Each request owns a new image node, so a queued event from an old source
    // cannot run a newer source's callback after a rapid switch.
    const nextImage = document.createElement('img');
    nextImage.dataset.viewerSrc = item.src;
    nextImage.decoding = 'async';
    viewerImage.onload = viewerImage.onerror = null;
    viewerImage.removeAttribute('src');
    viewerImage.replaceWith(nextImage);
    viewerImage = nextImage;
    viewerImage.hidden = true;
    viewerImage.width = item.width;
    viewerImage.height = item.height;
    viewerImage.alt = item.alt;
    viewerZoom.disabled = true;
    projectViewer.style.setProperty('--viewer-image-width', `${item.width}px`);
    projectViewer.dataset.viewerState = 'loading';
    viewerStatus.textContent = `正在加载 ${item.title} 实屏…`;
    viewerThumbs.querySelectorAll('[data-viewer-index]').forEach(button => {
      const selected = Number(button.dataset.viewerIndex) === activeIndex;
      button.setAttribute('aria-pressed', String(selected));

    });
    keepSelectedThumbVisible();
    viewerPrevious.disabled = viewerNext.disabled = items.length < 2;
    viewerImage.onload = () => finishImage(request);
    viewerImage.onerror = () => finishImage(request, true);
    viewerImage.src = item.src;
    if (viewerImage.complete) finishImage(request, !viewerImage.naturalWidth);
  }

  items.forEach((item, index) => {
    item.link.setAttribute('aria-haspopup', 'dialog');
    item.link.setAttribute('aria-controls', 'project-viewer');
    item.link.setAttribute('aria-label', `查看实屏大图：${item.title}`);
    item.link.addEventListener('click', event => {
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey
        || event.shiftKey || event.altKey || projectViewer.open) return;
      buildThumbnails();
      showItem(index);
      try { projectViewer.showModal(); } catch { return; }
      keepSelectedThumbVisible();
      event.preventDefault();
      viewerOrigin = item.link;
      document.body.classList.add('project-viewer-open');
      projectViewer.scrollTop = 0;
      if (viewerImage.complete) finishImage(loadRequest, !viewerImage.naturalWidth);
    });
  });
  viewerClose.addEventListener('click', () => projectViewer.close());
  viewerPrevious.addEventListener('click', () => showItem(activeIndex - 1));
  viewerNext.addEventListener('click', () => showItem(activeIndex + 1));
  viewerThumbs.addEventListener('click', event => {
    const button = event.target instanceof Element ? event.target.closest('[data-viewer-index]') : null;
    if (!button || !viewerThumbs.contains(button)) return;
    const index = Number(button.dataset.viewerIndex);
    if (Number.isInteger(index) && index >= 0 && index < items.length) showItem(index);
  });
  projectViewer.addEventListener('keydown', event => {
    if (event.key === 'Tab' && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const controls = [...projectViewer.querySelectorAll('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])')]
        .filter(element => element.getClientRects().length && !element.closest('[hidden]'));
      const first = controls[0], last = controls[controls.length - 1];
      if ((event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last)) {
        event.preventDefault();
        (event.shiftKey ? last : first)?.focus();
      }
      return;
    }
    // Arrow shortcuts belong to the image region, not every button/link in the dialog.
    if (event.target !== viewerFrame && event.target !== projectViewer) return;
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey
      || projectViewer.classList.contains('is-zoomed') || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    showItem(activeIndex + (event.key === 'ArrowLeft' ? -1 : 1));
  });
  // Touch navigation is only active at fit size; original-size images keep native panning.
  let touchStart = null;
  viewerFrame.addEventListener('touchstart', event => {
    if (projectViewer.classList.contains('is-zoomed') || event.touches.length !== 1) { touchStart = null; return; }
    const touch = event.touches[0];
    touchStart = { x: touch.clientX, y: touch.clientY, id: touch.identifier, time: Date.now() };
  }, { passive: true });
  viewerFrame.addEventListener('touchcancel', () => { touchStart = null; }, { passive: true });
  viewerFrame.addEventListener('touchend', event => {
    const start = touchStart;
    touchStart = null;
    if (!start || event.touches.length || projectViewer.classList.contains('is-zoomed') || !projectViewer.open) return;
    const touch = [...event.changedTouches].find(point => point.identifier === start.id);
    if (!touch || Date.now() - start.time > 900) return;
    const dx = touch.clientX - start.x, dy = touch.clientY - start.y;
    if (Math.abs(dx) < 64 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    showItem(activeIndex + (dx < 0 ? 1 : -1));
  }, { passive: true });
  viewerZoom.addEventListener('click', () => {
    if (projectViewer.dataset.viewerState !== 'ready') return;
    const zoomed = projectViewer.classList.toggle('is-zoomed');
    viewerZoom.setAttribute('aria-pressed', String(zoomed));
    viewerZoom.textContent = zoomed ? '适应窗口' : '原尺寸';
    if (viewerHint) viewerHint.textContent = zoomed
      ? '原尺寸显示，可滑动或使用方向键查看超出部分'
      : '左右滑动或聚焦图片后按方向键切换；可切换到原尺寸查看细节';
    viewerFrame.setAttribute('aria-label', zoomed
      ? `${items[activeIndex].title} 实屏，可用方向键滚动查看原尺寸图片`
      : `${items[activeIndex].title} 实屏，聚焦后可用左右方向键切换图片`);
    viewerFrame.scrollTop = 0;
    viewerFrame.scrollLeft = 0;
    if (zoomed) viewerFrame.focus({ preventScroll: true });
  });
  projectViewer.addEventListener('close', () => {
    loadRequest += 1;
    viewerImage.onload = viewerImage.onerror = null;
    viewerImage.hidden = true;
    viewerImage.removeAttribute('src');
    viewerFrame.setAttribute('aria-busy', 'false');
    projectViewer.dataset.viewerState = 'idle';
    viewerStatus.textContent = '';
    document.body.classList.remove('project-viewer-open');
    resetProjectView();
    if (viewerOrigin?.isConnected) viewerOrigin.focus({ preventScroll: true });
  });
  projectViewer.addEventListener('click', event => {
    if (event.target !== projectViewer) return;
    const bounds = projectViewer.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right
      || event.clientY < bounds.top || event.clientY > bounds.bottom) projectViewer.close();
  });
})();
$('#share-page').addEventListener('click', event => copyText(siteUrl, event.currentTarget));
$('#share-page').hidden = false;
const form = $('#inquiry-form');
const inquiryDetails = $('#inquiry-details');
const output = $('#summary-output');
const outputPlaceholder = $('#summary-placeholder');
const nameField = $('#visitor-name');
const needField = $('#visitor-need');
const inquiryCopyButton = $('#copy-inquiry');
const inquiryCopyStatus = $('#inquiry-copy-status');
let inquiryCopyAttempt = 0;
let generatedBody = '';
let generatedFilename = '咨询需求.txt';
const serviceField = $('#service-select');
const referenceField = $('#inquiry-reference');
const defaultNeedPrompt = needField.placeholder;
const servicePrompts = new Map($$('.offer [data-service][data-prompt]').map(link => [link.dataset.service, link.dataset.prompt]));
const projectPrompts = new Map();
for (const link of $$('.case-inquiry')) {
  const project = link.closest('.case-showcase');
  const title = project.querySelector('.case-heading h3').textContent.trim();
  referenceField.add(new Option(title, project.id));
  projectPrompts.set(project.id, link.dataset.prompt);
}
$('#reference-field').hidden = false;
function updateInquiryContext() {
  needField.placeholder = projectPrompts.get(referenceField.value) || servicePrompts.get(serviceField.value) || defaultNeedPrompt;
  const reference = referenceField.value ? `，参考作品为「${referenceField.selectedOptions[0].text}」` : '';
  $('#form-status').textContent = `已选择「${serviceField.value}」${reference}。`;
}
function restoreInquiryHash() {
  if (location.hash === '#inquiry-details') inquiryDetails.open = true;
}
restoreInquiryHash();
window.addEventListener('hashchange', restoreInquiryHash);
window.addEventListener('popstate', restoreInquiryHash);
// A same-hash click does not emit hashchange; open the existing tool before
// native anchor navigation without changing or submitting the visitor's text.
document.addEventListener('click', event => {
  if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  const link = event.target instanceof Element ? event.target.closest('a[href="#inquiry-details"]') : null;
  if (link) inquiryDetails.open = true;
});
const requiredInquiryFields = new Map([
  [nameField, '请填写你的称呼。'],
  [needField, '请简单描述希望解决的问题。']
]);
function validateInquiryField(field) {
  const error = document.getElementById(field.id + '-error');
  field.setCustomValidity(field.value.trim() ? '' : requiredInquiryFields.get(field));
  error.textContent = field.validationMessage;
  error.hidden = field.validity.valid;
  if (error.hidden) field.removeAttribute('aria-invalid');
  else field.setAttribute('aria-invalid', 'true');
}
function invalidateSummary(event) {
  resetInquiryCopy();
  if (generatedBody) { generatedBody = ''; output.hidden = true; outputPlaceholder.hidden = false; $('#summary-text').value = ''; $('#email-draft').href = `mailto:${contactEmail}`; $('#form-status').textContent = '内容已修改，请重新整理需求后发送。'; }
  $('#need-count').textContent = `${needField.value.length} / 1500`;
  if (event?.target.getAttribute('aria-invalid') === 'true') validateInquiryField(event.target);
}
inquiryDetails.addEventListener('toggle', () => { if (!inquiryDetails.open) resetInquiryCopy(); });
form.addEventListener('input', invalidateSummary);
form.addEventListener('change', invalidateSummary);
serviceField.addEventListener('change', updateInquiryContext);
referenceField.addEventListener('change', updateInquiryContext);
$$('[data-service]').forEach(link => link.addEventListener('click', event => {
  if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
  inquiryDetails.open = true;
  serviceField.value = link.dataset.service;
  referenceField.value = link.closest('.case-showcase')?.id || '';
  invalidateSummary();
  updateInquiryContext();
}));
form.addEventListener('submit', event => {
  event.preventDefault();
  for (const field of requiredInquiryFields.keys()) validateInquiryField(field);
  const firstInvalid = form.querySelector(':invalid');
  if (firstInvalid) {
    firstInvalid.focus();
    return;
  }
  const data = new FormData(form);
  const name = nameField.value.trim(), service = String(data.get('service'));
  const referenceLine = referenceField.value ? `参考作品：${referenceField.selectedOptions[0].text}\n\n` : '';
  const mode = data.get('mode');
  const timing = String(data.get('timing')).trim();
  const preferences = [mode && `希望的沟通方式：${mode}`, timing && `期望时间：${timing}`].filter(Boolean).join('\n');
  generatedBody = [
    '张建华你好，', `我是 ${name}，想咨询「${service}」。`,
    `${referenceLine}我的需求：\n${needField.value.trim()}`, preferences,
    '请告知合适的沟通时间、合作范围及费用。谢谢！'
  ].filter(Boolean).join('\n\n');
  generatedFilename = `咨询需求-${service}.txt`;
  resetInquiryCopy();
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
function resetInquiryCopy() {
  inquiryCopyAttempt += 1;
  inquiryCopyButton.textContent = '复制全文';
  delete inquiryCopyButton.dataset.copied;
  inquiryCopyStatus.textContent = '';
}
inquiryCopyButton.addEventListener('click', async () => {
  if (!generatedBody) return;
  const bodyToCopy = generatedBody;
  resetInquiryCopy();
  const attempt = inquiryCopyAttempt;
  const result = await copyText(bodyToCopy, inquiryCopyButton, () => inquiryDetails.open && bodyToCopy === generatedBody && attempt === inquiryCopyAttempt);
  if (bodyToCopy !== generatedBody || attempt !== inquiryCopyAttempt) return;
  if (result === 'copied') {
    inquiryCopyButton.textContent = '已复制全文';
    inquiryCopyButton.dataset.copied = 'true';
    inquiryCopyStatus.textContent = '全文已复制。可粘贴到微信或邮件中发送。';
  } else if (result === 'manual') inquiryCopyStatus.textContent = '自动复制未完成，可在弹窗中手动复制全文。';
});
$('#download-inquiry').addEventListener('click', () => {
  if (!generatedBody) return;
  const url = URL.createObjectURL(new Blob(['\uFEFF' + generatedBody], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = generatedFilename; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1500);
  notify('已生成需求文本，尚未发送。');
});
form.noValidate = true;
$('#generate-inquiry').disabled = false;
$('#inquiry-unavailable').hidden = true;
// Project index: native buttons remain keyboard accessible; all content exists without JS.
const projectFilters = $$('[data-project-filter]');
const archivedProjects = $('#project-archive');
const liveProjectList = $('.case-list');
const projectDirectory = $('.project-directory');
const liveProjects = [...liveProjectList.querySelectorAll('.case-row')];
const projectCounts = { live: liveProjects.length, archive: archivedProjects.querySelectorAll('.archive-item').length };
projectCounts.all = projectCounts.live + projectCounts.archive;
projectFilters.forEach(button => {
  const count = button.querySelector('span');
  if (count) count.textContent = String(projectCounts[button.dataset.projectFilter] || 0).padStart(2, '0');
});
// This reading index observes the existing cards; passive scrolling never changes
// the URL or focus. One queued frame reads all card positions together.
const workReadingIndex = (() => {
  const layout = $('#work-layout');
  const index = $('#work-index');
  const scroller = index?.querySelector('.work-index-links');
  const position = index?.querySelector('[data-work-position]');
  const fixedNav = $('.nav');
  const records = [...(index?.querySelectorAll('a[data-work-link]') || [])].map(link => {
    const card = document.getElementById(link.hash.slice(1));
    return card ? { link, card, archive: archivedProjects.contains(card) } : null;
  }).filter(Boolean);
  if (!layout || !index || !scroller || !records.length) {
    return { syncFilter() {}, prepareNavigation() {}, refresh() {} };
  }

  const compactLayout = matchMedia('(max-width: 1279px)');
  const number = value => String(value).padStart(2, '0');
  let listed = records;
  let activeLink = null;
  let frame = 0;
  let nearby = false;
  let watchingScroll = false;
  let revealSelected = false;
  const setVariable = (name, value) => {
    if (layout.style.getPropertyValue(name) !== value) layout.style.setProperty(name, value);
  };

  function readOffsets() {
    const navHeight = Math.ceil(fixedNav?.getBoundingClientRect().height || 0);
    const indexHeight = index.hidden ? 0 : Math.ceil(index.getBoundingClientRect().height);
    return {
      top: navHeight + 14,
      anchor: navHeight + (compactLayout.matches ? indexHeight : 0) + 24,
      padding: Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0
    };
  }

  function writeOffsets(offsets) {
    setVariable('--work-index-top', `${offsets.top}px`);
    setVariable('--work-anchor-offset', `${offsets.anchor}px`);
    setVariable('--work-scroll-padding', `${offsets.padding}px`);
  }

  function clearPosition() {
    records.forEach(record => record.link.removeAttribute('aria-current'));
    activeLink = null;
    if (position) position.textContent = `— / ${number(listed.length)}`;
    setVariable('--work-progress', '0');
  }

  function revealCurrentLink(link) {
    if (!compactLayout.matches) {
      if (scroller.scrollHeight > scroller.clientHeight) {
        const visible = scroller.getBoundingClientRect();
        const current = link.getBoundingClientRect();
        if (current.top < visible.top) scroller.scrollTop += current.top - visible.top;
        else if (current.bottom > visible.bottom) scroller.scrollTop += current.bottom - visible.bottom;
      }
      return;
    }
    if (scroller.scrollWidth <= scroller.clientWidth) return;
    const visible = scroller.getBoundingClientRect();
    const current = link.getBoundingClientRect();
    if (current.left < visible.left + 4) scroller.scrollLeft += current.left - visible.left - 4;
    else if (current.right > visible.right - 4) scroller.scrollLeft += current.right - visible.right + 4;
  }

  function measure() {
    frame = 0;
    if (document.hidden) return;
    const ensureVisible = revealSelected;
    revealSelected = false;
    const offsets = readOffsets();
    const measured = listed.flatMap((record, recordIndex) => {
      if (record.archive && !archivedProjects.open) return [];
      const rect = record.card.getBoundingClientRect();
      return rect.height && rect.width ? [{ record, recordIndex, rect }] : [];
    });
    writeOffsets(offsets);
    if (!measured.length) { clearPosition(); return; }
    let current = measured[0];
    for (const item of measured) {
      if (item.rect.top <= offsets.anchor + 1) current = item;
    }
    const following = measured.find(item => item.rect.top > offsets.anchor + 1);
    if (following && current.rect.bottom < offsets.anchor
      && following.rect.top - offsets.anchor < offsets.anchor - current.rect.bottom) current = following;
    const changed = activeLink !== current.record.link;
    if (changed) {
      activeLink?.removeAttribute('aria-current');
      activeLink = current.record.link;
      activeLink.setAttribute('aria-current', 'location');
      if (position) position.textContent = `${number(current.recordIndex + 1)} / ${number(listed.length)}`;
    }
    const start = measured[0].rect.top;
    const span = measured[measured.length - 1].rect.bottom - start;
    const progress = span > 0 ? Math.max(0, Math.min(1, (offsets.anchor - start) / span)) : 0;
    setVariable('--work-progress', progress.toFixed(4));
    if (changed || ensureVisible) revealCurrentLink(current.record.link);
  }

  function refresh(force = true) {
    if (document.hidden || (!force && !nearby)) return;
    revealSelected ||= force;
    if (!frame) frame = requestAnimationFrame(measure);
  }

  const onScroll = () => refresh(false);
  function setNearby(value) {
    nearby = value;
    if (nearby && !watchingScroll) {
      window.addEventListener('scroll', onScroll, { passive: true });
      watchingScroll = true;
    } else if (!nearby && watchingScroll) {
      window.removeEventListener('scroll', onScroll);
      watchingScroll = false;
    }
    if (nearby) refresh();
  }
  if ('IntersectionObserver' in window) {
    const proximity = new IntersectionObserver(entries => {
      setNearby(entries.some(entry => entry.isIntersecting));
    }, { rootMargin: '300px 0px', threshold: 0 });
    proximity.observe(layout);
  } else setNearby(true);
  if ('ResizeObserver' in window) {
    const sizes = new ResizeObserver(() => refresh());
    [fixedNav, index, liveProjectList, archivedProjects].filter(Boolean).forEach(element => sizes.observe(element));
  }
  window.addEventListener('resize', () => refresh(), { passive: true });
  window.addEventListener('hashchange', () => refresh());
  window.addEventListener('pageshow', () => refresh());
  layout.addEventListener('toggle', () => refresh(), true);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
    else refresh();
  });

  return {
    syncFilter(value) {
      listed = records.filter(record => value === 'all' || record.archive === (value === 'archive'));
      records.forEach(record => { record.link.hidden = !listed.includes(record); });
      index.querySelector('[data-work-index-title]').textContent = {
        live: '应用目录', archive: '过往实践目录', all: '全部作品目录'
      }[value];
      clearPosition();
      refresh();
    },
    prepareNavigation() { writeOffsets(readOffsets()); },
    refresh
  };
})();
function pushProjectLocation(url, departureY) {
  if (url.href === location.href) return;
  // A fragment entry created with pushState can restore its anchor instead of
  // the reading position. Record it only when leaving via a portfolio control.
  history.replaceState({ ...history.state, workReturn: { y: departureY, width: innerWidth } }, '');
  history.pushState(null, '', url);
}
function setProjectFilter(value, writeHistory = false) {
  const departureY = window.scrollY;
  if (!['live', 'archive', 'all'].includes(value)) value = 'live';
  projectFilters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.projectFilter === value)));
  liveProjects.forEach(project => { project.hidden = value === 'archive'; });
  liveProjectList.hidden = value === 'archive';
  projectDirectory.hidden = value === 'archive';
  archivedProjects.hidden = value === 'live';
  if (value !== 'live') archivedProjects.open = true;
  workReadingIndex.syncFilter(value);
  $('#project-count').textContent = value === 'live' ? `${projectCounts.live} 个作品条目` : value === 'archive' ? `${projectCounts.archive} 个过往项目实践` : `共 ${projectCounts.all} 个作品条目`;
  if (writeHistory) {
    const url = new URL(location.href);
    if (value === 'live') url.searchParams.delete('view'); else url.searchParams.set('view', value);
    url.hash = 'work';
    pushProjectLocation(url, departureY);
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
  const departureY = window.scrollY;
  const target = revealProject(id);
  if (!target) return;
  workReadingIndex.prepareNavigation();
  const url = new URL(location.href);
  const filter = projectFilters.find(button => button.getAttribute('aria-pressed') === 'true')?.dataset.projectFilter || 'live';
  if (filter === 'live') url.searchParams.delete('view'); else url.searchParams.set('view', filter);
  url.hash = id;
  pushProjectLocation(url, departureY);
  target.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
  workReadingIndex.refresh();
  if (moveFocus) {
    const heading = target.querySelector('h2,h3') || target;
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
  }
}
$$('a[href^="#project-"]').forEach(link => link.addEventListener('click', event => {
  if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
  event.preventDefault();
  navigateToSection(link.hash.slice(1), event.detail === 0 || !link.closest('#work-index'));
}));
function restoreProjectHash(initial = false) {
  if (!location.hash.startsWith('#project-')) return;
  const target = document.getElementById(location.hash.slice(1));
  if (!target) return;
  const wasHidden = target.closest('[hidden]') || (target.matches('.archive-item') && !archivedProjects.open);
  revealProject(target.id);
  if (wasHidden) {
    const url = new URL(location.href);
    const filter = projectFilters.find(button => button.getAttribute('aria-pressed') === 'true').dataset.projectFilter;
    if (filter === 'live') url.searchParams.delete('view'); else url.searchParams.set('view', filter);
    if (url.href !== location.href) history.replaceState(history.state, '', url);
  }
  workReadingIndex.prepareNavigation();
  // On traversal the browser restores the reader's exact position in the case.
  // Only align a fresh deep link or a fragment the browser could not see.
  if (initial) requestAnimationFrame(() => {
    if (location.hash === '#' + target.id) target.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  else if (wasHidden) target.scrollIntoView({ behavior: 'instant', block: 'start' });
  workReadingIndex.refresh();
}
restoreProjectHash(true);
window.addEventListener('hashchange', () => restoreProjectHash());
window.addEventListener('popstate', event => {
  setProjectFilter(new URLSearchParams(location.search).get('view') || 'live');
  restoreProjectHash();
  const saved = event.state?.workReturn;
  if (saved?.width === innerWidth && Number.isFinite(saved.y)) {
    const href = location.href;
    requestAnimationFrame(() => {
      if (location.href === href && Math.abs(window.scrollY - saved.y) > 1) {
        window.scrollTo({ top: saved.y, behavior: 'instant' });
      }
    });
  }
});

// Native combobox keeps typing focus while the active result follows keyboard selection.
const quickDialog = $('#quick-dialog');
const quickInput = $('#quick-query');
const quickItems = $$('.quick-item');
const quickRecords = quickItems.map((item, index) => {
  item.id = `quick-option-${index}`;
  item.setAttribute('role', 'option'); item.setAttribute('aria-selected', 'false'); item.tabIndex = -1;
  const title = item.querySelector('span').firstChild.textContent.trim();
  const compactTitle = title.normalize('NFKC').replace(/[\s·:—–-]+/gu, '');
  return { id: item.id, title, description: item.querySelector('small').textContent, aliases: [item.dataset.searchAlias || '', compactTitle].join(' ') };
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
  // Visitors commonly type product names and Chinese keywords without spaces.
  const query = quickInput.value.normalize('NFKC').toLowerCase()
    .replace(/([a-z0-9])(\p{Script=Han})/gu, '$1 $2')
    .replace(/(\p{Script=Han})([a-z0-9])/gu, '$1 $2').trim();
  const terms = query.split(/\s+/).filter(Boolean);
  const matches = searchRanker ? searchRanker(query) : quickRecords.filter(record => {
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
  quickComposing = false;
  quickInput.setAttribute('aria-expanded', 'false'); quickInput.removeAttribute('aria-activedescendant');
  if (restoreQuickFocus) (quickOrigin?.getClientRects().length ? quickOrigin : $('.quick-trigger')).focus();
});
function isQuickImeKey(event) {
  // Some IMEs end composition before the keydown that confirms the candidate.
  return event.isComposing || quickComposing || event.keyCode === 229;
}
quickDialog.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || isQuickImeKey(event)) return;
  event.preventDefault(); event.stopPropagation();
  quickDialog.close();
});
quickDialog.addEventListener('cancel', event => { if (quickComposing) event.preventDefault(); });
quickInput.addEventListener('compositionstart', () => { quickComposing = true; });
quickInput.addEventListener('compositionend', () => { quickComposing = false; filterQuickItems(); });
quickInput.addEventListener('input', event => { if (!event.isComposing && !quickComposing) filterQuickItems(); });
$('#quick-clear').addEventListener('click', () => { quickInput.value = ''; filterQuickItems(); quickInput.focus(); });
$$('[data-quick-query]').forEach(button => button.addEventListener('click', () => { quickInput.value = button.dataset.quickQuery; filterQuickItems(); quickInput.focus(); }));
quickInput.addEventListener('keydown', event => {
  if (isQuickImeKey(event) || !quickVisible.length) return;
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
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k' && !isQuickImeKey(event)) { event.preventDefault(); if (quickDialog.open) quickDialog.close(); else openQuick(); }
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
  ['#spatial-intro','.hero','#work','#services','#about','#contact'].forEach(selector => { const section = $(selector); if (section) sectionObserver.observe(section); });
  const mobileBar = $('.mobile-contact');
  const heroRegions = [$('#spatial-intro'), $('.hero')].filter(Boolean);
  const heroVisibility = new Map(heroRegions.map(region => [region, true]));
  let heroVisible = true, contactVisible = false;
  const updateBar = () => { mobileBar.hidden = heroVisible || contactVisible; };
  const barObserver = new IntersectionObserver(entries => { for (const entry of entries) { if (heroVisibility.has(entry.target)) heroVisibility.set(entry.target, entry.isIntersecting); else contactVisible = entry.isIntersecting; } heroVisible = [...heroVisibility.values()].some(Boolean); updateBar(); }, { threshold: 0 });
  heroRegions.forEach(region => barObserver.observe(region)); barObserver.observe($('#contact'));
}
