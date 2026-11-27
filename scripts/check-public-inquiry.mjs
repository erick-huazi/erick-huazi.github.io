import assert from 'node:assert/strict';

export async function checkPublicInquiry(page, origin, auditRegion) {
  const ids = ['cox', 'southwest'];
  const context = page.context();
  await context.addInitScript(() => Object.defineProperty(navigator, 'clipboard', {
    configurable: true, value: { writeText: async text => { window.copiedLetter = text; } }
  }));
  await page.goto(new URL('/references.html?utm_source=qa&compare=' + ids.join(',') + '#cases', origin).href);
  const dialog = page.locator('#ref-compare-dialog');
  await dialog.waitFor();
  const sources = await Promise.all(ids.map(id => page.locator('#' + id).evaluate(card => ({
    title: card.querySelector('h3').textContent.trim(),
    provider: card.querySelector('.ref-card-top span').textContent.trim(),
    url: card.querySelector('.ref-links a').href
  }))));
  const open = dialog.locator('#ref-compare-inquiry');
  assert.equal(await open.count(), 1, 'The comparison must have a consultation entry');
  const [formPage] = await Promise.all([context.waitForEvent('page'), open.click()]);
  formPage.setDefaultTimeout(7000);
  try {
    await formPage.waitForLoadState('domcontentloaded');
    const location = new URL(formPage.url());
    assert.equal(location.origin, origin.origin);
    assert.equal(location.hash, '#inquiry-details');
    assert.deepEqual([...location.searchParams], [['cases', ids.join(',')]]);
    const references = formPage.locator('#inquiry-public-context');
    await references.waitFor();
    const rendered = await references.locator('li').evaluateAll(items => items.map(item => ({
      title: item.querySelector('a').textContent, provider: item.querySelector('small').textContent,
      url: item.querySelector('a').href
    })));
    assert.deepEqual(rendered, sources);
    assert.deepEqual(await dialog.locator('#ref-compare-overview h4').allTextContents(), sources.map(source => source.title));
    const name = formPage.locator('#visitor-name');
    const need = formPage.locator('#visitor-need');
    assert.equal(await name.inputValue(), '');
    assert.equal(await need.inputValue(), '');
    await name.fill('访客');
    await need.fill('想试试自动整理周报。\n请保留人工确认。');
    const generate = formPage.locator('#generate-inquiry');
    const summary = formPage.locator('#summary-text');
    const email = formPage.locator('#email-draft');
    const optIn = references.getByRole('checkbox');
    assert.ok(await optIn.isChecked());
    await generate.click();
    const firstBody = await summary.inputValue();
    assert.ok(firstBody.includes(await need.inputValue()));
    assert.ok(firstBody.includes('想讨论的外部公开案例：\n' + sources.map(s => s.provider + ' · ' + s.title + '\n' + s.url).join('\n')));
    assert.ok(!firstBody.includes('参考作品：'), 'External examples must remain distinct from portfolio work');
    assert.equal(new URL(await email.getAttribute('href')).searchParams.get('body'), firstBody);
    assert.equal(formPage.url(), location.href);
    await auditRegion(formPage, '#inquiry-public-context');

    await formPage.locator('#inquiry-reference').selectOption('project-hyaloria');
    await need.fill('计划整理客服会话，并由人工审核。\n'.repeat(45).trim());
    await generate.click();
    const longBody = await summary.inputValue();
    assert.ok(longBody.includes('作品链接：https://erick-huazi.github.io/#project-hyaloria'));
    for (const {url} of sources) assert.ok(longBody.includes(url));
    assert.equal(new URL(await email.getAttribute('href')).searchParams.has('body'), false);
    await formPage.locator('#copy-inquiry').click();
    assert.equal(await formPage.evaluate(() => window.copiedLetter), longBody);
    const [download] = await Promise.all([formPage.waitForEvent('download'), formPage.locator('#download-inquiry').click()]);
    const stream = await download.createReadStream();
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    assert.equal(Buffer.concat(chunks).toString('utf8').replace(/^\uFEFF/, ''), longBody);

    await optIn.uncheck();
    assert.ok(await formPage.locator('#summary-output').isHidden());
    await generate.click();
    const revised = await summary.inputValue();
    for (const source of sources) assert.ok(!revised.includes(source.url));
    assert.ok(revised.includes(await need.inputValue()));
    assert.ok(revised.includes('作品链接：https://erick-huazi.github.io/#project-hyaloria'));
    for (const invalid of ['cox,cox', 'unknown,southwest', 'southwest', 'cox,southwest&cases=cox,southwest']) {
      await formPage.goto(new URL('/?cases=' + invalid + '#inquiry-details', origin).href);
      assert.ok(await references.isHidden(), invalid);
      assert.equal(await references.locator('a').count(), 0);
    }
  } finally { await formPage.close(); }
}
