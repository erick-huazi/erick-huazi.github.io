import assert from 'node:assert/strict';
export async function checkViewerRecovery(page, origin, auditRegion) {
  await page.goto(new URL('/#project-jmsai', origin).href);
  const trigger = page.locator('#project-jmsai [data-open-project-viewer]');
  const originalURL = await trigger.evaluate(link => link.href);
  const dialog = page.locator('#project-viewer');
  const retry = dialog.getByRole('button', {name:'重新加载图片'});
  const frame = dialog.locator('#project-viewer-frame');
  let attempts = 0;
  // Hold selected requests until the interaction being exercised has happened.
  const failFirst = Promise.withResolvers();
  const firstSettled = Promise.withResolvers();
  const finishRetry = Promise.withResolvers();
  await page.route(originalURL, async route => {
    attempts++;
    if (attempts === 1) {
      await failFirst.promise;
      // Switching images can already have canceled the request.
      try { await route.abort(); } finally { firstSettled.resolve(); }
      return;
    }
    if (attempts === 2) return route.fulfill({ status:404, contentType:'text/plain', body:'Image unavailable' });
    if (attempts === 3) return route.abort();
    await finishRetry.promise;
    await route.continue();
  });
  try {
    await Promise.all([page.waitForRequest(originalURL), trigger.press('Enter')]);
    assert.equal(await dialog.locator('#project-viewer-retry').count(), 1, 'Offer an in-place retry on a failed image');
    const next = dialog.locator('#project-viewer-next');
    const image = frame.locator('img');
    await next.click();
    await dialog.locator('#project-viewer-zoom:enabled').waitFor();
    const nextPhoto = await image.evaluate(img => img.currentSrc);
    assert.notEqual(nextPhoto, originalURL);
    failFirst.resolve();
    await firstSettled.promise;
    await page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));
    assert.equal(await image.evaluate(img => img.currentSrc), nextPhoto);
    assert.equal(await dialog.getAttribute('data-viewer-state'), 'ready');
    assert.ok(await retry.isHidden());
    await dialog.locator('#project-viewer-prev').click();
    await retry.waitFor();
    assert.ok(await dialog.locator('#project-viewer-zoom').isDisabled());
    assert.equal(await dialog.locator('#project-viewer-original').getAttribute('href'), originalURL);
    await auditRegion(page, '#project-viewer');
    await retry.press('Enter');
    await retry.waitFor();
    assert.equal(attempts, 3, 'Retry the same asset after a second failure');
    assert.ok(await frame.evaluate(el => el === document.activeElement));
    const retryStarted = page.waitForRequest(originalURL);
    await retry.press('Enter');
    await dialog.locator('#project-viewer-frame[aria-busy=true]').waitFor();
    await retryStarted;
    await dialog.locator('#project-viewer-next').focus();
    finishRetry.resolve();
    await dialog.locator('#project-viewer-zoom:enabled').waitFor();
    assert.equal(attempts, 4);
    assert.ok(await retry.isHidden());
    assert.ok(await dialog.locator('#project-viewer-next').evaluate(el => el === document.activeElement), 'Do not steal focus when a delayed retry succeeds');
    assert.equal(await image.evaluate(el => el.currentSrc), originalURL);
    const {width,height} = await image.boundingBox();
    const viewport = page.viewportSize();
    if (viewport.width <= 390) assert.ok(width >= viewport.width * .9, 'Use the available width for a portrait capture');
    if (viewport.width >= 900) assert.ok(height >= viewport.height * .85, 'Use the available height for a portrait capture');
    const hit = await next.evaluate(button => {
      const {x,y,width,height} = button.getBoundingClientRect();
      return { width, height, active:button.contains(document.elementFromPoint(x + width/2, y + height/2)) };
    });
    assert.ok(hit.active, 'Reach the next screenshot without scrolling');
    if (viewport.width < 900) assert.ok(hit.width >= 44 && hit.height >= 44, 'Touch target for next screenshot');
    await page.keyboard.press('Escape');
    assert.ok(await trigger.evaluate(el => el === document.activeElement));
  } finally {
    failFirst.resolve();
    finishRetry.resolve();
  }
}
