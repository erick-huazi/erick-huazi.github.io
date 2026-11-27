import assert from 'node:assert/strict';

const liveIds = ['project-hyaloria', 'project-hyaloria-playground', 'project-jmsai', 'project-worldcup', 'project-astrrot'];
const archiveIds = ['project-couponmega', 'project-aimegapro', 'project-searateguide'];

async function expectFocus(locator) {
  await locator.page().waitForFunction(el => document.activeElement === el, await locator.elementHandle(), { timeout: 2500 });
}

export async function checkCatalogNavigation(page, origin, auditRegion) {
  await page.goto(new URL('/?view=all#work', origin).href);
  const nav = page.locator('#work-index');
  const toggle = nav.locator('#work-index-toggle');
  const compact = page.viewportSize().width < 1280;
  async function openDirectory() {
    if (compact) {
      assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
      await toggle.press('Enter');
      assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
    }
  }
  await openDirectory();
  const links = nav.locator('[data-work-link]:visible');
  assert.deepEqual(await links.evaluateAll(nodes => nodes.map(a => a.hash.slice(1))), [...liveIds, ...archiveIds]);
  if (compact) {
    const list = nav.locator('#work-index-links');
    assert.ok(await list.evaluate(el => el.scrollWidth <= el.clientWidth + 1), 'Read project names without horizontal scrolling');
    await auditRegion(page, '#work-index');
    await links.first().press('Escape');
    await expectFocus(toggle);
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
  }
  const archive = page.locator('[data-project-filter="archive"]');
  await archive.press('Enter');
  await openDirectory();
  assert.deepEqual(await links.evaluateAll(nodes => nodes.map(a => a.hash.slice(1))), archiveIds);
  const source = nav.locator('[href="#project-aimegapro"]');
  const heading = page.locator('#project-aimegapro h3');
  await source.press('Enter');
  await expectFocus(heading);
  assert.equal(new URL(page.url()).hash, '#project-aimegapro');
  if (compact) assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
  await page.goBack();
  await expectFocus(source);
  assert.equal(new URL(page.url()).hash, '#work');
  if (compact) assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
  await page.goForward();
  await expectFocus(heading);
  assert.equal(await archive.getAttribute('aria-pressed'), 'true');

  await page.goto(new URL('/?view=all#work', origin).href);
  const details = page.locator('#project-archive');
  await details.locator(':scope > summary').press('Enter');
  assert.equal(await details.evaluate(el => el.open), false);
  const directoryLink = page.locator('.project-directory [href="#project-aimegapro"]');
  await directoryLink.press('Enter');
  await expectFocus(heading);
  assert.equal(await details.evaluate(el => el.open), true);
  await page.goBack();
  await expectFocus(directoryLink);
  assert.equal(await details.evaluate(el => el.open), false, 'Restore the collapsed archive as the reader left it');
}

export async function checkCaseSharing(page, origin) {
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: async text => {
      if (window.denyCopy) throw new Error('permission denied');
      window.sharedCase = text;
    } }
  }));
  await page.goto(new URL('/?utm_source=example#work', origin).href);
  assert.equal(await page.locator('article .project-share').count(), liveIds.length + archiveIds.length);
  const receiver = await page.context().browser().newPage({ viewport: page.viewportSize(), reducedMotion: 'reduce' });
  try {
    for (const [view, id] of [['live', liveIds[1]], ['archive', archiveIds[2]], ['all', liveIds[2]]]) {
      await page.locator('[data-project-filter="' + view + '"]').press('Enter');
      const card = page.locator('#' + id);
      if (archiveIds.includes(id)) await card.locator('.project-details > summary').press('Enter');
      const share = card.locator('.project-share');
      const before = page.url();
      await share.press('Enter');
      const path = (view === 'live' ? '/' : '/?view=' + view) + '#' + id;
      assert.equal(await page.evaluate(() => window.sharedCase), 'https://erick-huazi.github.io' + path);
      assert.equal(page.url(), before, 'Copying should preserve the sender’s reading position and history entry');
      await receiver.goto(new URL(path, origin).href);
      if (view === 'archive') await receiver.reload();
      await receiver.waitForFunction(target => {
        const rect = document.querySelector('#' + target + ' h3').getBoundingClientRect();
        return rect.top >= 0 && rect.top < innerHeight && rect.bottom > 0;
      }, id, { timeout: 4000 });
      assert.equal(await receiver.locator('[data-project-filter="' + view + '"]').getAttribute('aria-pressed'), 'true');
      if (view === 'all') {
        await page.evaluate(() => { window.denyCopy = true; });
        await share.press('Enter');
        const field = page.locator('#copy-value');
        await field.waitFor();
        assert.equal(await field.inputValue(), 'https://erick-huazi.github.io' + path);
        await page.keyboard.press('Escape');
        await expectFocus(share);
      }
    }
  } finally { await receiver.close(); }
}
