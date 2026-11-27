import assert from 'node:assert/strict';

const afterPaint = page => page.evaluate(() => new Promise(resolve => {
  requestAnimationFrame(() => requestAnimationFrame(resolve));
}));

// Desktop with a fine pointer. Count work on the affected elements, so a slow
// machine or a different display refresh rate does not alter the expectation.
export async function checkMotionWork(page, origin) {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto(new URL('/#project-hyaloria', origin).href);
  await page.bringToFront();
  await page.evaluate(() => document.fonts.ready);
  await page.locator('#project-hyaloria').evaluate(el => el.scrollIntoView({ behavior: 'instant' }));
  await page.mouse.move(2, 210);
  await afterPaint(page);
  const cursor = page.locator('.cursor');
  assert.equal(await cursor.count(), 1, 'The desktop preview cursor must exist');
  assert.equal(await cursor.evaluate(el => el.classList.contains('on')), false);
  await page.evaluate(() => {
    const counts = { about: 0, process: 0, cursor: 0 };
    window.motionWorkCounts = counts;
    for (const [key, selector] of [['about', '.about-statement'], ['process', '.delivery-strip ol']]) {
      const element = document.querySelector(selector);
      const bounds = element.getBoundingClientRect.bind(element);
      if (bounds().top < innerHeight + 150) throw new Error('Expected offscreen section: ' + selector);
      element.getBoundingClientRect = () => { counts[key]++; return bounds(); };
    }
    const changes = new MutationObserver(records => { counts.cursor += records.length; });
    changes.observe(document.querySelector('.cursor'), { attributes: true, attributeFilter: ['style'] });
  });
  for (let step = 1; step <= 8; step++) {
    await page.mouse.move(2, 210 + step * 8);
    await page.evaluate(() => scrollBy({ top: 8, behavior: 'instant' }));
    await afterPaint(page);
  }
  assert.deepEqual(await page.evaluate(() => window.motionWorkCounts), { about: 0, process: 0, cursor: 0 },
    'Scrolling ordinary text must not measure offscreen sections or animate an invisible cursor');

  await page.locator('#project-hyaloria .case-product-preview').hover();
  await afterPaint(page);
  assert.ok(await cursor.evaluate(el => el.classList.contains('on') && window.motionWorkCounts.cursor > 0),
    'Hovering a product preview still positions and displays the cursor');
  await page.locator('.delivery-strip ol').evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.waitForFunction(() => window.motionWorkCounts.process > 0
    && document.querySelector('.delivery-strip ol').style.getPropertyValue('--process') !== '');
}
