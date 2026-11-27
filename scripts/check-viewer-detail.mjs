import assert from 'node:assert/strict';

export async function checkViewerDetail(page, origin) {
  const projects = ['project-hyaloria', 'project-hyaloria-playground', 'project-jmsai', 'project-worldcup'];
  const entry = page.locator('#project-jmsai [data-open-project-viewer]');
  const viewer = page.locator('#project-viewer');
  const titleLink = viewer.locator('#project-viewer-case');
  const choice = viewer.getByRole('combobox', { name:'选择作品实屏' });
  const thumbs = viewer.locator('#project-viewer-thumbs');
  await page.goto(new URL('/?view=all#project-jmsai', origin).href);
  await entry.press('Enter');
  assert.equal(await titleLink.count(), 1, 'The screenshot title must open its project case');
  await viewer.locator('#project-viewer-zoom:enabled').waitFor();
  const image = viewer.locator('#project-viewer-frame img');
  assert.equal(await image.evaluate(img => getComputedStyle(img).animationName), 'none');
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.waitForFunction(() => document.documentElement.classList.contains('motion'));
  assert.equal(await image.evaluate(img => getComputedStyle(img).animationName), 'viewer-image-in');
  await page.emulateMedia({reducedMotion:'reduce'});
  const compact = await thumbs.isHidden();
  if (compact) {
    assert.equal(await choice.locator('option').count(), projects.length);
    assert.ok(await choice.evaluate(el => {
      const r = el.getBoundingClientRect();
      return r.height >= 44 && el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));
    }), 'Show a reachable direct selector when the thumbnail strip collapses');
  }
  for (const [index, id] of projects.entries()) {
    if (compact) await choice.selectOption(String(index));
    else await thumbs.locator('button').nth(index).click();
    assert.equal(await titleLink.getAttribute('href'), '#' + id);
    assert.equal(await titleLink.textContent(), await page.locator('#' + id + ' h3').first().textContent());
    assert.equal(await thumbs.locator('[aria-pressed=true]').getAttribute('data-viewer-index'), String(index));
  }
  await viewer.locator('#project-viewer-prev').click();
  if (compact) assert.equal(await choice.inputValue(), '2');
  await viewer.locator('#project-viewer-next').click();
  const [separate] = await Promise.all([
    page.context().waitForEvent('page'),
    titleLink.click({ modifiers:['ControlOrMeta'] })
  ]);
  try {
    await separate.waitForURL(url => url.hash === '#project-worldcup');
    assert.equal(new URL(separate.url()).searchParams.get('view'), 'all');
    assert.ok(await separate.locator('#project-worldcup').isVisible());
    assert.ok(await viewer.isVisible(), 'Opening a separate tab preserves the gallery');
  } finally { await separate.close(); }
  await titleLink.press('Enter');
  await viewer.waitFor({state:'hidden'});
  assert.equal(new URL(page.url()).hash, '#project-worldcup');
  await page.locator('#project-worldcup h3:focus').waitFor();
  await page.goBack();
  await page.locator('#project-jmsai [data-open-project-viewer]:focus').waitFor();
  assert.equal(new URL(page.url()).hash, '#project-jmsai');
  await page.goForward();
  await page.locator('#project-worldcup h3:focus').waitFor();
}
