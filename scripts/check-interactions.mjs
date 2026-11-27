import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { before, after, test } from 'node:test';
import { chromium } from 'playwright-core';
import { checkInquiry } from './check-inquiry.mjs';
import { checkWechatCard, checkContactCopy } from './check-contact.mjs';
import { checkCatalogNavigation, checkCaseSharing } from './check-catalog.mjs';
import { checkDiscovery, checkSharedComparison } from './check-reference-discovery.mjs';

const origin = new URL(process.argv[2] || 'http://127.0.0.1:8000/');
const axePath = createRequire(import.meta.url).resolve('axe-core/axe.min.js');
let browser;
before(async () => {
  browser = await chromium.launch({ channel: process.env.PORTFOLIO_BROWSER_CHANNEL || 'chrome' });
});
after(async () => { await browser?.close(); });

async function auditRegion(page, selector) {
  if (!await page.evaluate(() => Boolean(window.axe))) await page.addScriptTag({ path: axePath });
  const violations = await page.evaluate(async region => {
    const result = await window.axe.run(region, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
      resultTypes: ['violations']
    });
    return result.violations.map(rule => ({ rule: rule.id, elements: rule.nodes.map(node => node.target) }));
  }, selector);
  assert.deepEqual(violations, [], 'Accessibility findings in ' + selector + ': ' + JSON.stringify(violations));
}

async function checkGallery(page) {
  await page.goto(new URL('/#project-jmsai', origin).href);
  const trigger = page.locator('#project-jmsai [data-open-project-viewer]');
  await trigger.press('Enter');
  const viewer = page.locator('#project-viewer');
  const image = viewer.locator('#project-viewer-frame img');
  await viewer.locator('#project-viewer-zoom:enabled').waitFor();
  const fit = await image.evaluate(img => {
    const frame = img.closest('[role="region"]');
    const rect = img.getBoundingClientRect();
    return { width: rect.width, height: rect.height, viewportWidth: frame.clientWidth, viewportHeight: frame.clientHeight };
  });
  assert.ok(fit.width > 0 && fit.height > 0 && fit.height <= fit.viewportHeight + 1 && fit.width <= fit.viewportWidth + 1,
    'Fit mode must show the entire screenshot inside the image frame: ' + JSON.stringify(fit));
  const next = viewer.getByRole('button', { name: '下一张项目实屏' });
  assert.ok(await next.evaluate(button => {
    const rect = button.getBoundingClientRect();
    return button.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2));
  }), 'Next image must be reachable without scrolling the dialog');
  await viewer.locator('#project-viewer-zoom').click();
  assert.ok(await image.evaluate((img, height) => img.getBoundingClientRect().height > height + 1, fit.height),
    'Original size should reveal more detail on the portrait JMSAI capture');
  await next.click();
  await viewer.getByRole('heading', { name: 'World Cup AI Forecast' }).waitFor();
  assert.equal(await viewer.locator('#project-viewer-zoom').getAttribute('aria-pressed'), 'false');
  await page.keyboard.press('Escape');
  await viewer.waitFor({ state: 'hidden' });
  assert.ok(await trigger.evaluate(a => a === document.activeElement), 'Return focus to the original case');
}

async function checkQuickSearch(page) {
  const exactOnly = page.viewportSize().width === 320;
  let blockedFuse = false;
  if (exactOnly) {
    await page.route('**/assets/vendor/fuse.basic.min.mjs', route => {
      blockedFuse = true;
      return route.abort();
    });
  }
  await page.goto(origin.href);
  await page.keyboard.press('Control+k');
  const dialog = page.locator('#quick-dialog');
  const input = page.locator('#quick-query');
  await dialog.waitFor();
  assert.ok(await dialog.evaluate(el => {
    const box = el.getBoundingClientRect();
    const help = el.querySelector('.quick-help').getBoundingClientRect();
    return box.top >= 0 && box.left >= 0 && box.bottom <= innerHeight + 1 && box.right <= innerWidth + 1
      && help.height > 0 && help.top >= box.top && help.bottom <= box.bottom + 1;
  }), 'Keep the quick dialog and its keyboard hints inside the viewport');
  await auditRegion(page, '#quick-dialog');
  if (!exactOnly) {
    await input.fill('worlcup');
    await dialog.locator('[data-quick-target="project-worldcup"][data-approximate="true"]:visible').waitFor();
  }
  const selected = dialog.locator('[role="option"][aria-selected="true"]');
  for (const [query, destination] of [
    ['HYALORIA工作台', 'project-hyaloria-playground'], ['多模型API', 'project-hyaloria'], ['JMSAI选股', 'project-jmsai']
  ]) {
    await input.fill(query);
    assert.equal(await dialog.getByRole('option').count(), 1, query);
    assert.equal(await selected.getAttribute('data-quick-target'), destination);
  }
  if (exactOnly) assert.ok(blockedFuse, 'Exercise exact matching when Fuse cannot load');

  await input.fill('HYALORIA');
  await input.press('ArrowDown');
  assert.equal(await selected.getAttribute('data-quick-target'), 'project-hyaloria-playground');
  assert.equal(await input.getAttribute('aria-activedescendant'), await selected.getAttribute('id'));
  assert.ok(await input.evaluate(el => el === document.activeElement), 'Arrow navigation keeps typing focus in the field');

  await input.fill('no-matching-portfolio-example');
  await dialog.locator('#quick-empty').waitFor();
  assert.equal(await input.getAttribute('aria-activedescendant'), null);
  await input.press('Enter');
  assert.ok(await dialog.isVisible(), 'An empty list must not navigate');

  await input.fill('世界杯');
  const originalUrl = page.url();
  await input.evaluate(el => {
    // Recreate the key sequence where the IME finishes composition before its final Enter keydown.
    el.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    el.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 229, bubbles: true, cancelable: true }));
  });
  assert.ok(await dialog.isVisible(), 'Confirming an IME candidate must not activate an option');
  assert.equal(page.url(), originalUrl);
  await input.press('Enter');
  await dialog.waitFor({ state: 'hidden' });
  assert.equal(new URL(page.url()).hash, '#project-worldcup');
}

async function checkComparison(page) {
  await page.goto(new URL('/references.html#cases', origin).href);
  const choices = page.locator('[data-compare-id]');
  await choices.nth(0).press('Enter');
  await choices.nth(1).press('Space');
  const open = page.locator('#ref-compare-open');
  assert.ok(await open.evaluate(b => b === document.activeElement), 'Continue directly from the second keyboard selection');
  await page.keyboard.press('Enter');
  const dialog = page.locator('#ref-compare-dialog');
  await dialog.waitFor();
  const method = dialog.getByRole('link', { name: '做法', exact: true });
  await method.press('Enter');
  const gap = await dialog.evaluate(el => {
    const section = el.querySelector('#ref-compare-method');
    return section.getBoundingClientRect().top - el.querySelector('header').getBoundingClientRect().bottom;
  });
  assert.ok(gap >= -2 && gap <= 32, 'Chapter heading should sit below the sticky header, gap: ' + gap);
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'hidden' });
  assert.ok(await open.evaluate(b => b === document.activeElement));
  const chips = page.locator('#ref-selected-items button');
  await chips.first().press('Enter');
  assert.ok(await chips.first().evaluate(b => b === document.activeElement), 'Keep focus on the remaining selected case');
  const search = page.locator('#ref-search');
  await search.fill('no-matching-portfolio-example');
  await page.locator('#ref-empty').waitFor();
  await chips.first().press('Enter');
  assert.ok(await search.evaluate(input => input === document.activeElement), 'Hidden cases should return focus to search');
  await page.locator('#ref-empty-reset').click();
  await choices.first().waitFor();
  assert.equal(await search.inputValue(), '');
}

for (const [width, height] of [[320, 568], [390, 844], [844, 390], [1280, 800]]) {
  const workflows = [
    ['gallery', checkGallery], ['quick search', checkQuickSearch], ['comparison', checkComparison],
    ['inquiry', page => checkInquiry(page, auditRegion, origin)],
    ['WeChat contact card', page => checkWechatCard(page, auditRegion, origin)],
    ['clipboard recovery', page => checkContactCopy(page, auditRegion, origin)],
    ['catalog navigation', page => checkCatalogNavigation(page, origin, auditRegion)],
    ['case sharing', page => checkCaseSharing(page, origin)],
    ['reference discovery', page => checkDiscovery(page, origin, auditRegion)],
    ['shared comparison', page => checkSharedComparison(page, origin)]
  ];
  for (const [name, check] of workflows) {
    test(name + ' at ' + width + 'x' + height, async () => {
      const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
      page.setDefaultTimeout(7000);
      try { await check(page); }
      finally { await page.close(); }
    });
  }
}
