import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { chromium } from 'playwright-core';

const origin = new URL(process.argv[2] || 'http://127.0.0.1:8000/');
let browser;
before(async () => {
  browser = await chromium.launch({ channel: process.env.PORTFOLIO_BROWSER_CHANNEL || 'chrome' });
});
after(async () => { await browser?.close(); });

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
  for (const [name, check] of [['gallery', checkGallery], ['comparison', checkComparison]]) {
    test(name + ' at ' + width + 'x' + height, async () => {
      const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
      page.setDefaultTimeout(7000);
      try { await check(page); }
      finally { await page.close(); }
    });
  }
}
