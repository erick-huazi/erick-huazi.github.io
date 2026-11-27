import assert from 'node:assert/strict';

export async function checkHeroEntry(page, origin) {
  await page.emulateMedia({reducedMotion: 'no-preference'});
  let blocked = false;
  await page.route('**/motion.js*', route => { blocked = true; return route.abort(); });
  await page.goto(origin.href);
  assert.ok(blocked, 'Exercise the page with its decorative script unavailable');
  assert.equal(await page.locator('html').evaluate(el => el.classList.contains('motion')), false,
    'Blocked motion must leave the document immediately readable');
  const actions = page.locator('.hero-actions');
  const position = await actions.evaluate(el => {
    const box = el.getBoundingClientRect();
    return { top: box.top, bottom: box.bottom, opacity: getComputedStyle(el).opacity };
  });
  assert.equal(position.opacity, '1');
  assert.ok(position.top >= 0 && position.bottom <= page.viewportSize().height, 'Both primary actions fit in the first viewport');
  if (page.viewportSize().width < 1000) {
    const expected = page.viewportSize().width === 320 ? 2 : 4;
    for (const card of (await page.locator('.hero-shot').all()).slice(0, expected)) {
      assert.ok(await card.evaluate(el => {
        const r = el.getBoundingClientRect();
        return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
      }), 'The featured screenshots can be reached directly from the hero');
    }
  }
  const preview = page.locator('.hero-shot[href="#project-jmsai"] img');
  await preview.evaluate(img => img.decode());
  assert.match(await preview.evaluate(img => img.currentSrc), /jmsai-hero-448\.webp/);
  const original = page.locator('#project-jmsai [data-open-project-viewer]');
  assert.match(await original.getAttribute('href'), /jmsai-screen-1400\.webp/);
  await actions.locator('[href="#work"]').press('Enter');
  assert.equal(new URL(page.url()).hash, '#work');
}

async function expectMotion(page, on) {
  await page.waitForFunction(enabled => {
    const button = document.querySelector('#motion-toggle');
    return button && !button.hidden && button.getAttribute('aria-pressed') === String(enabled)
      && document.documentElement.classList.contains('motion') === enabled;
  }, on, {timeout: 3000});
  assert.equal(await page.locator('html').evaluate(el => getComputedStyle(el).scrollBehavior), on ? 'smooth' : 'auto');
}

export async function checkMotionSettings(page, origin) {
  const other = await page.context().newPage();
  for (const tab of [page, other]) {
    await tab.emulateMedia({reducedMotion:'no-preference'});
    await tab.goto(origin.href);
    await expectMotion(tab, true);
  }
  const toggle = page.locator('#motion-toggle');
  const poster = other.locator('.hero-shot').first();
  const animation = await poster.evaluate(el => {
    const style = getComputedStyle(el);
    return {name:style.animationName, duration:parseFloat(style.animationDuration)};
  });
  assert.ok(animation.name !== 'none' && animation.duration > 0, 'Real project cards animate when motion is enabled');
  await toggle.press('Enter');
  await expectMotion(page, false);
  await expectMotion(other, false);
  assert.equal(await poster.evaluate(el => getComputedStyle(el).animationName), 'none');
  await other.reload();
  await expectMotion(other, false);
  await other.emulateMedia({reducedMotion:'reduce'});
  await toggle.press('Enter');
  await expectMotion(page, true);
  await expectMotion(other, false);
  assert.ok(await other.locator('#motion-toggle').isDisabled());
  await other.emulateMedia({reducedMotion:'no-preference'});
  await expectMotion(other, true);
  await toggle.press('Enter');
  await expectMotion(other, false);
  await page.evaluate(() => localStorage.removeItem('erick-motion'));
  await expectMotion(other, true);
}
