import assert from 'node:assert/strict';

const resource = '/references.html';
const publicOrigin = 'https://erick-huazi.github.io';
const cases = '[data-case-topics]:visible';
const visibleIds = page => page.locator(cases).evaluateAll(cards => cards.map(card => card.id));

export async function checkDiscovery(page, origin, auditRegion) {
  await page.goto(new URL(resource + '?utm_source=qa#cases', origin).href);
  const search = page.locator('#ref-search');
  await page.evaluate(() => document.fonts.ready);
  const title = page.locator(cases).first().locator('h3');
  await page.waitForFunction(el => {
    const box = el.getBoundingClientRect();
    return box.top >= 0 && box.bottom <= innerHeight;
  }, await title.elementHandle(), { timeout: 3500 });
  for (const button of await page.locator('[data-ref-topic]').all()) {
    assert.ok(await button.evaluate(el => {
      const box = el.getBoundingClientRect();
      return box.height >= 44 && box.width >= 44 && el.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
    }), 'Each visible filter should be directly reachable on arrival');
  }
  await auditRegion(page, '#cases');
  const startHistory = await page.evaluate(() => history.length);
  await search.pressSequentially('AWS');
  assert.deepEqual(await visibleIds(page), ['southwest', 'cox', 'nfl']);
  assert.equal(await page.evaluate(() => history.length), startHistory + 1, 'Typing one search creates a single return point');
  await page.goBack();
  assert.equal(await search.inputValue(), '');
  assert.equal(await page.locator(cases).count(), 9);
  await page.goForward();
  assert.equal(await search.inputValue(), 'AWS');

  await page.locator('[data-ref-topic="operations"]').click();
  assert.deepEqual(await visibleIds(page), ['southwest', 'cox']);
  const share = new URL(await page.locator('#ref-results-link').evaluate(link => link.href));
  assert.equal(share.origin + share.pathname, publicOrigin + resource);
  assert.deepEqual(Object.fromEntries(share.searchParams), { topic: 'operations', q: 'AWS' });
  assert.equal(share.hash, '#cases');
  const receiver = await page.context().browser().newPage({ viewport: page.viewportSize() });
  try {
    await receiver.goto(new URL(share.pathname + share.search + share.hash, origin).href);
    assert.deepEqual(await visibleIds(receiver), ['southwest', 'cox']);
    assert.equal(await receiver.locator('[aria-pressed="true"][data-ref-topic]').getAttribute('data-ref-topic'), 'operations');
  } finally { await receiver.close(); }

  await page.locator('#ref-reset').click();
  const before = { url: page.url(), length: await page.evaluate(() => history.length) };
  await search.evaluate(el => {
    el.focus();
    el.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    el.value = 'ＡＷＳ维';
    el.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
  });
  assert.equal(page.url(), before.url);
  assert.equal(await page.locator(cases).count(), 9);
  await search.evaluate(el => {
    el.value = 'ＡＷＳ维修';
    el.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    el.dispatchEvent(new InputEvent('input', { bubbles: true }));
  });
  assert.deepEqual(await visibleIds(page), ['cox']);
  assert.equal(await page.evaluate(() => history.length), before.length + 1);
  assert.equal(Number(await page.locator('[data-ref-topic="operations"] span').innerText()), 1);
  assert.equal(Number(await page.locator('[data-ref-topic="data"] span').innerText()), 0);
  await page.locator('[data-ref-topic="data"]').click();
  assert.equal(await page.locator(cases).count(), 0);
  const broaden = page.locator('#ref-empty-topic');
  await broaden.click();
  assert.equal(await search.inputValue(), 'ＡＷＳ维修');
  assert.deepEqual(await visibleIds(page), ['cox']);
  await page.goBack();
  await broaden.waitFor();
}

export async function checkSharedComparison(page, origin) {
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: async text => {
      if (window.denyShare) throw new Error('permission denied');
      window.copiedComparison = text;
    } }
  }));
  await page.goto(new URL(resource + '?utm_campaign=qa#cases', origin).href);
  const ids = ['cox', 'southwest'];
  const titles = [];
  for (const id of ids) {
    titles.push(await page.locator('#' + id + ' h3').innerText());
    await page.locator('[data-compare-id="' + id + '"]').press('Enter');
  }
  await page.locator('#ref-compare-open').press('Enter');
  const shareButton = page.getByRole('button', { name: '复制对照链接' });
  const before = page.url();
  await shareButton.click();
  const shared = new URL(await page.evaluate(() => window.copiedComparison));
  assert.equal(page.url(), before);
  assert.equal(shared.origin + shared.pathname, publicOrigin + resource);
  assert.deepEqual([...shared.searchParams], [['compare', ids.join(',')]]);
  assert.equal(shared.hash, '#cases');

  await page.evaluate(() => { window.denyShare = true; });
  await shareButton.click();
  const field = page.locator('#ref-share-url');
  assert.equal(await field.inputValue(), shared.href);
  assert.ok(await field.evaluate(el => document.activeElement === el && el.selectionStart === 0 && el.selectionEnd === el.value.length));
  const downloading = page.waitForEvent('download');
  await page.locator('#ref-compare-download').click();
  const stream = await (await downloading).createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  assert.ok(Buffer.concat(chunks).toString('utf8').includes(shared.href), 'Downloaded notes must reopen the same pair');

  const recipient = await page.context().browser().newPage({ viewport: page.viewportSize() });
  try {
    await recipient.goto(new URL(shared.pathname + shared.search + shared.hash, origin).href);
    const dialog = recipient.locator('#ref-compare-dialog');
    await dialog.waitFor();
    assert.deepEqual(await dialog.locator('#ref-compare-overview h4').allTextContents(), titles);
    await recipient.reload();
    await dialog.waitFor();
    await recipient.keyboard.press('Escape');
    await dialog.waitFor({state:'hidden'});
    assert.equal(new URL(recipient.url()).searchParams.has('compare'), false);
    await recipient.reload();
    assert.equal(await dialog.isVisible(), false);
    for (const invalid of ['cox,cox', 'unknown,cox', 'cox,southwest,nfl', 'cox&compare=nfl']) {
      await recipient.goto(new URL(resource + '?topic=data&compare=' + invalid + '#cases', origin).href);
      assert.equal(await dialog.isVisible(), false);
      assert.deepEqual(await visibleIds(recipient), ['nfl', 'airbus']);
      assert.equal(new URL(recipient.url()).searchParams.has('compare'), false);
    }
  } finally { await recipient.close(); }
}
