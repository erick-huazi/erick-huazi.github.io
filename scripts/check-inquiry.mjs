import assert from 'node:assert/strict';

export async function checkInquiry(page, auditRegion, origin) {
  await page.goto(new URL('/#inquiry-details', origin).href);
  const form = page.locator('#inquiry-form');
  const name = form.locator('#visitor-name');
  const need = form.locator('#visitor-need');
  const generate = form.locator('button[type="submit"]');
  const summary = page.locator('#summary-text');
  const output = page.locator('#summary-output');
  const email = page.locator('#email-draft');
  if (page.viewportSize().width <= 390) {
    await page.evaluate(() => document.fonts.ready);
    assert.ok(await need.evaluate(input => input.getBoundingClientRect().bottom <= innerHeight),
      'Show both required fields on a small phone opening the form directly');
  }

  await generate.click();
  assert.equal(await name.evaluate(field => field === document.activeElement), true);
  for (const field of [name, need]) {
    const errorId = (await field.getAttribute('id')) + '-error';
    assert.equal(await field.getAttribute('aria-invalid'), 'true');
    assert.ok((await field.getAttribute('aria-describedby')).split(/\s+/).includes(errorId));
    const error = page.locator('#' + errorId);
    assert.ok(await error.isVisible());
    assert.ok((await error.innerText()).trim());
  }
  await auditRegion(page, '#inquiry-details');
  await name.fill('   ');
  assert.equal(await name.getAttribute('aria-invalid'), 'true');
  await name.fill('示例访客');
  assert.equal(await name.getAttribute('aria-invalid'), null);
  assert.equal(await need.getAttribute('aria-invalid'), 'true');
  await need.fill('希望让同事自行整理周报。');
  await generate.click();
  for (const action of [page.locator('#copy-inquiry'), email]) {
    assert.ok(await action.evaluate(button => {
      const rect = button.getBoundingClientRect();
      const center = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
      return rect.height >= 44 && rect.bottom <= innerHeight && button.contains(center);
    }), 'Keep both primary draft actions immediately reachable after preview');
  }
  const firstBody = await summary.inputValue();
  assert.ok(firstBody.includes('希望让同事自行整理周报。'));
  assert.doesNotMatch(firstBody, /希望的沟通方式|期望时间/);
  assert.equal(new URL(await email.getAttribute('href')).searchParams.get('body'), firstBody);

  await page.locator('#edit-inquiry').click();
  assert.ok(await need.evaluate(field => field === document.activeElement));
  await form.locator('.inquiry-preferences > summary').click();
  await form.locator('#contact-mode').selectOption({ label: '上海线下' });
  await form.locator('#contact-time').fill('周三下午');
  assert.ok(await output.isHidden());
  assert.equal(await summary.inputValue(), '');
  assert.equal(new URL(await email.getAttribute('href')).search, '');

  await generate.click();
  const updatedBody = await summary.inputValue();
  assert.ok(updatedBody.includes('希望的沟通方式：上海线下'));
  assert.ok(updatedBody.includes('期望时间：周三下午'));
  assert.equal(new URL(await email.getAttribute('href')).searchParams.get('body'), updatedBody);
  await auditRegion(page, '#inquiry-details');
}
