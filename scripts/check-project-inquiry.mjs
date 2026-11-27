import assert from 'node:assert/strict';
import { text } from 'node:stream/consumers';

const ai = 'AI 应用与智能体';
const sources = new Map([
  ['project-hyaloria', ai], ['project-hyaloria-playground', ai], ['project-jmsai', ai],
  ['project-worldcup', ai], ['project-astrrot', ai], ['service-consultation', '一对一咨询'],
  ['service-ai', ai], ['service-workflow', '工作流自动化'], ['service-content', '内容、数据与运营']
]);

export async function checkProjectInquiry(page, origin) {
  await page.goto(new URL('/#project-jmsai', origin).href);
  const link = id => page.locator(`a[data-inquiry-source="${id}"]`);
  assert.equal(await page.locator('a[data-inquiry-source]').count(), sources.size);

  // Open the real link in a separate tab, then exercise each remaining native href.
  const [recipient] = await Promise.all([
    page.context().waitForEvent('page'),
    link('project-jmsai').click({ modifiers: ['ControlOrMeta'] })
  ]);
  try {
    await recipient.waitForURL(url => url.searchParams.get('inquiry') === 'project-jmsai');
    await recipient.locator('#reference-field:not([hidden])').waitFor();
    assert.equal(await recipient.locator('#inquiry-reference').inputValue(), 'project-jmsai');
    for (const [id, expectedService] of sources) {
      const url = new URL(await link(id).getAttribute('href'), origin);
      assert.equal(url.origin, new URL(origin).origin);
      assert.equal(url.hash, '#inquiry-details');
      assert.deepEqual([...url.searchParams], [['inquiry', id]]);
      await recipient.goto(url.href, { waitUntil: 'domcontentloaded' });
      await recipient.locator('#reference-field:not([hidden])').waitFor();
      assert.ok(await recipient.locator('#inquiry-details').evaluate(el => el.open));
      assert.equal(await recipient.locator('#service-select').inputValue(), expectedService, id);
      const project = id.startsWith('project-') ? id : '';
      assert.equal(await recipient.locator('#inquiry-reference').inputValue(), project, id);
      const status = await recipient.locator('#form-status').textContent();
      assert.ok(status.includes(expectedService), id);
      if (project) assert.ok(status.includes((await page.locator('#' + id + ' h3').first().textContent()).trim()), id);
    }
  } finally {
    await recipient.close();
  }
  await page.bringToFront();
  assert.equal(new URL(page.url()).hash, '#project-jmsai');

  const form = page.locator('#inquiry-form');
  const service = form.locator('#service-select');
  const reference = form.locator('#inquiry-reference');
  const name = form.locator('#visitor-name');
  const need = form.locator('#visitor-need');
  const timing = form.locator('#contact-time');
  const mode = form.locator('#contact-mode');
  const generate = form.locator('[type="submit"]');
  const summary = page.locator('#summary-text');
  const output = page.locator('#summary-output');
  const email = page.locator('#email-draft');

  await link('project-jmsai').press('Enter');
  assert.equal(await reference.inputValue(), 'project-jmsai');
  await page.goBack();
  assert.equal(new URL(page.url()).hash, '#project-jmsai');
  await page.locator('a[data-inquiry-source="project-jmsai"]:focus').waitFor();
  await page.goForward();
  assert.equal(new URL(page.url()).searchParams.get('inquiry'), 'project-jmsai');
  await name.fill('陈先生');
  await need.fill('团队想筛选数据。');
  await form.locator('.inquiry-preferences > summary').click();
  await mode.selectOption('先邮件沟通');
  await timing.fill('周四');
  await generate.click();
  const body = await summary.inputValue();
  assert.match(body, /参考作品：JMSAI · 选股策略\n作品链接：https:\/\/erick-huazi\.github\.io\/#project-jmsai/);
  assert.equal(new URL(await email.getAttribute('href')).searchParams.get('body'), body);
  const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#download-inquiry').click()]);
  const fileContents = await text(await download.createReadStream());
  assert.equal(fileContents.replace(/^\uFEFF/, ''), body);
  await link('project-jmsai').press('Enter');
  assert.ok(await output.isVisible());
  assert.equal(await summary.inputValue(), body);

  await link('service-consultation').click();
  assert.equal(await service.inputValue(), '一对一咨询');
  assert.equal(await reference.inputValue(), '');
  assert.ok(await output.isHidden());
  assert.equal(await summary.inputValue(), '');
  assert.equal(new URL(await email.getAttribute('href')).search, '');
  await service.selectOption('工作流自动化');
  await link('project-hyaloria').click();
  assert.equal(await reference.inputValue(), 'project-hyaloria');
  assert.equal(await service.inputValue(), '工作流自动化');
  await reference.selectOption('project-astrrot');
  await link('project-worldcup').click();
  assert.equal(await reference.inputValue(), 'project-astrrot');
  assert.equal(await service.inputValue(), '工作流自动化');
  assert.equal(await name.inputValue(), '陈先生');
  assert.equal(await need.inputValue(), '团队想筛选数据。');
  assert.equal(await mode.inputValue(), '先邮件沟通');
  assert.equal(await timing.inputValue(), '周四');
  assert.deepEqual([...new URL(page.url()).searchParams], []);
  await generate.click();
  assert.match(await summary.inputValue(), /#project-astrrot/);
  assert.doesNotMatch(await summary.inputValue(), /#project-worldcup/);
  await reference.selectOption('');
  await link('project-astrrot').click();
  assert.equal(await reference.inputValue(), '', 'Honor a visitor explicitly removing the portfolio reference');
  await generate.click();
  assert.doesNotMatch(await summary.inputValue(), /作品链接/);

  for (const query of ['inquiry=unknown', 'inquiry=project-astrrot&inquiry=project-hyaloria']) {
    await page.goto(new URL('/?' + query + '#inquiry-details', origin).href);
    await form.locator('#reference-field:not([hidden])').waitFor();
    assert.equal(await reference.inputValue(), '');
    assert.equal(await service.inputValue(), ai);
    assert.equal(await need.inputValue(), '', 'A new visit does not restore private draft contents');
    assert.equal(new URL(page.url()).searchParams.has('inquiry'), false);
  }
}
