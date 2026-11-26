import assert from 'node:assert/strict';

export async function checkInquiry(page, auditRegion, origin) {
  await page.goto(new URL('/#inquiry-details', origin).href);
  const form = page.locator('#inquiry-form');
  const name = form.locator('#visitor-name');
  const need = form.locator('#visitor-need');
  const generate = form.getByRole('button', { name: '整理成一封来信' });
  const summary = page.locator('#summary-text');
  const output = page.locator('#summary-output');
  const email = page.locator('#email-draft');

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
