import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import jsQR from 'jsqr';

async function readCode(image) {
  const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return jsQR(new Uint8ClampedArray(data), info.width, info.height, { inversionAttempts: 'dontInvert' })?.data;
}

const qrPath = 'assets/wechat-qr.jpg';
const original = fileURLToPath(new URL('../dist/' + qrPath, import.meta.url));
const expectedCode = readCode(sharp(original).resize({ width: 440 }));

function isFocused(locator) {
  return locator.evaluate(el => el === document.activeElement);
}

export async function checkWechatCard(page, auditRegion, origin) {
  await page.goto(new URL('/#contact', origin).href);
  const opener = page.locator('#contact .wechat-preview');
  await opener.press('Enter');
  const dialog = page.locator('#wechat-dialog');
  await dialog.locator('.qr-figure img').evaluate(img => img.decode());
  const close = dialog.locator('#close-wechat');
  const copy = dialog.locator('[data-copy-wechat]');
  const save = dialog.locator('a[download]');
  assert.ok(await isFocused(close), 'Opening the QR card focuses its close button');
  for (const control of [close, copy, save]) {
    const reachable = await control.evaluate(el => {
      const r = el.getBoundingClientRect();
      return { width: r.width, height: r.height, visible: el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)) };
    });
    assert.ok(reachable.visible && reachable.height >= 44 && reachable.width >= 44,
      'The first view must offer a reachable 44px target for ' + (await control.innerText()) + ': ' + JSON.stringify(reachable));
  }
  const card = await dialog.boundingBox();
  const viewport = page.viewportSize();
  const left = Math.max(0, Math.ceil(card.x));
  const top = Math.max(0, Math.ceil(card.y));
  const width = Math.min(viewport.width, Math.floor(card.x + card.width)) - left;
  const height = Math.min(viewport.height, Math.floor(card.y + card.height)) - top;
  const figure = await dialog.locator('.qr-figure').boundingBox();
  assert.ok(figure.x >= left - 1 && figure.y >= top - 1 && figure.x + figure.width <= left + width + 1
    && figure.y + figure.height <= top + height + 1, 'The entire QR figure must be visible on opening');
  const pixels = await page.screenshot({ scale: 'css' });
  const visibleCode = await readCode(sharp(pixels).extract({ left, top, width, height }));
  const expected = await expectedCode;
  assert.ok(expected, 'Reference QR must decode');
  assert.ok(visibleCode === expected, 'The QR in the visible dialog must decode to the same contact as the original file');
  assert.equal(new URL(await save.getAttribute('href'), origin).href, new URL(qrPath, origin).href);
  await auditRegion(page, '#wechat-dialog');
  await page.keyboard.press('Tab');
  assert.ok(await isFocused(copy));
  await page.keyboard.press('Tab');
  assert.ok(await isFocused(save));
  await page.keyboard.press('Shift+Tab');
  assert.ok(await isFocused(copy));
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'hidden' });
  assert.ok(await isFocused(opener));
}

export async function checkContactCopy(page, auditRegion, origin) {
  // Resolve browser permission requests in a controlled order without touching the OS clipboard.
  await page.addInitScript(() => {
    window.copyRequests = [];
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: text => new Promise((resolve, reject) => window.copyRequests.push({ text, resolve, reject })) }
    });
  });
  await page.goto(new URL('/#contact', origin).href);
  const email = page.locator('#contact [data-copy-email]');
  const phone = page.locator('#contact [data-copy-phone]');
  const opener = page.locator('#contact .wechat-preview');
  const wechat = page.locator('#wechat-dialog');
  const copy = wechat.locator('[data-copy-wechat]');
  const manual = page.locator('#copy-dialog');
  const field = manual.locator('#copy-value');
  await email.press('Enter');
  await phone.press('Enter');
  await page.evaluate(() => window.copyRequests[1].reject(new Error('permission denied')));
  await manual.waitFor();
  await page.evaluate(() => window.copyRequests[0].reject(new Error('late denial')));
  const phoneNumber = (await page.locator('#contact .channel-phone a').innerText()).replace(/\s/g, '');
  assert.equal(await field.inputValue(), phoneNumber, 'An older request must not overwrite the requested phone number');
  await page.keyboard.press('Escape');
  await manual.waitFor({ state: 'hidden' });
  assert.ok(await isFocused(phone));
  await email.press('Enter');
  await opener.press('Enter');
  await wechat.waitFor();
  await page.evaluate(() => window.copyRequests[2].reject(new Error('dialog changed')));
  assert.ok(await manual.isHidden(), 'A background copy denial must not cover the QR card');

  const account = (await wechat.locator('.qr-account strong').innerText()).trim();
  await copy.press('Enter');
  await page.evaluate(() => window.copyRequests[3].reject(new Error('permission denied')));
  await manual.waitFor();
  assert.equal(await field.inputValue(), account);
  assert.ok(await field.evaluate(el => el === document.activeElement && el.selectionStart === 0 && el.selectionEnd === el.value.length));
  await auditRegion(page, '#copy-dialog');
  await page.keyboard.press('Escape');
  await manual.waitFor({ state: 'hidden' });
  assert.ok(await isFocused(copy), 'Dismiss manual copy to return to the QR card');
  await copy.press('Enter');
  const copied = await page.evaluate(() => { const request = window.copyRequests[4]; request.resolve(); return request.text; });
  assert.equal(copied, account);
  await wechat.locator('[data-copied="true"]').waitFor();
  assert.match(await wechat.locator('[role="status"]').innerText(), /已复制/);
  await page.keyboard.press('Escape');
  await wechat.waitFor({ state: 'hidden' });
  assert.ok(await isFocused(opener));

  await page.locator('#inquiry-details > summary').press('Enter');
  const form = page.locator('#inquiry-form');
  await form.locator('#visitor-name').fill('测试访客');
  await form.locator('#visitor-need').fill('希望把每周进展整理成一份简报。');
  await form.getByRole('button', { name: '整理成一封来信' }).click();
  await page.locator('#copy-inquiry').press('Enter');
  await opener.press('Enter');
  await wechat.waitFor();
  await page.evaluate(() => window.copyRequests[5].reject(new Error('moved away from draft')));
  assert.ok(await manual.isHidden());
  assert.equal((await page.locator('#inquiry-copy-status').textContent()).trim(), '',
    'Leaving the draft must not report a manual-copy dialog that never opened');
}
