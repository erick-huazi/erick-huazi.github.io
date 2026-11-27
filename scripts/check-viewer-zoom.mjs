import assert from 'node:assert/strict';

const clamp = (value, max) => Math.max(0, Math.min(value, max));

async function frameGeometry(frame) {
  return frame.evaluate(element => {
    const image = element.querySelector('img').getBoundingClientRect();
    return {
      width: element.clientWidth, height: element.clientHeight,
      imageWidth: image.width, imageHeight: image.height,
      left: element.scrollLeft, top: element.scrollTop,
      maxX: element.scrollWidth - element.clientWidth, maxY: element.scrollHeight - element.clientHeight
    };
  });
}

function assertPointCentered(frame, x, y) {
  const left = clamp(x * frame.imageWidth - frame.width / 2, frame.maxX);
  const top = clamp(y * frame.imageHeight - frame.height / 2, frame.maxY);
  assert.ok(Math.abs(frame.left - left) < 2 && Math.abs(frame.top - top) < 2,
    'Expected the screenshot detail at scroll ' + [left, top] + ', observed ' + [frame.left, frame.top]);
}

async function touchGesture(client, page, start, delta) {
  const send = (type, points) => client.send('Input.dispatchTouchEvent', { type, touchPoints: points });
  await send('touchStart', [start]);
  if (delta) {
    for (let step = 1; step <= 8; step++) {
      await send('touchMove', [{ x: start.x + delta.x * step / 8, y: start.y + delta.y * step / 8 }]);
      await page.evaluate(() => new Promise(requestAnimationFrame));
    }
    // Finish with a short hold so a subsequent tap acts on the image, not an inertial scroll.
    await page.waitForTimeout(120);
  }
  await send('touchEnd', []);
}

export async function checkViewerZoom(page, origin) {
  const client = page.viewportSize().width === 390 ? await page.context().newCDPSession(page) : null;
  try {
    if (client) await client.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 2 });
    const tap = point => client ? touchGesture(client, page, point) : page.mouse.click(point.x, point.y);
    await page.goto(new URL('/#project-jmsai', origin).href);
    await page.locator('#project-jmsai [data-open-project-viewer]').press('Enter');
    const dialog = page.locator('#project-viewer');
    const frame = dialog.locator('#project-viewer-frame');
    const zoom = dialog.locator('#project-viewer-zoom');
    await dialog.locator('#project-viewer-zoom:enabled').waitFor();
    await zoom.click();
    assertPointCentered(await frameGeometry(frame), 0.5, 0.5);
    await zoom.click();
    const fit = await frame.locator('img').boundingBox();
    const point = { x: Math.round(fit.x + fit.width * 0.66), y: Math.round(fit.y + fit.height * 0.68) };
    await tap(point);
    assert.equal(await zoom.getAttribute('aria-pressed'), 'true', 'Activate the actual screenshot detail');
    const full = await frameGeometry(frame);
    assertPointCentered(full, (point.x - fit.x) / fit.width, (point.y - fit.y) / fit.height);
    assert.ok(await frame.evaluate(element => document.activeElement === element), 'Arrow keys must reach the scrollable image');
    const box = await frame.boundingBox();
    const center = { x: box.x + full.width / 2, y: box.y + full.height / 2 };

    if (client) {
      await touchGesture(client, page, center, { x: -42, y: -42 });
      await page.waitForFunction(top => document.querySelector('#project-viewer-frame').scrollTop > top + 8, full.top);
    } else {
      await page.mouse.move(center.x, center.y);
      await page.mouse.down();
      await page.mouse.move(center.x + 20, center.y + 24, { steps: 5 });
      await page.mouse.up();
      const panned = await frameGeometry(frame);
      assert.ok(Math.abs(panned.left - clamp(full.left - 20, full.maxX)) < 2);
      assert.ok(Math.abs(panned.top - clamp(full.top - 24, full.maxY)) < 2);
      await frame.press('ArrowDown');
      await page.waitForFunction(top => document.querySelector('#project-viewer-frame').scrollTop > top, panned.top);
    }
    assert.equal(await zoom.getAttribute('aria-pressed'), 'true', 'A drag must not collapse the image');
    assert.match(await dialog.locator('h2').textContent(), /JMSAI/, 'Panning must not switch the project');
    await tap(center);
    assert.equal(await zoom.getAttribute('aria-pressed'), 'false');
    const restored = await frame.locator('img').boundingBox();
    assert.ok(Math.abs(fit.height - restored.height) < 1 && Math.abs(fit.width - restored.width) < 1);

    const edge = { x: Math.ceil(restored.x + 3), y: Math.ceil(restored.y + 3) };
    await tap(edge);
    assert.equal(await zoom.getAttribute('aria-pressed'), 'true');
    // An unfinished native arrow-key scroll can carry into the new zoom on the next paint.
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const atEdge = await frameGeometry(frame);
    assert.ok(Math.abs(atEdge.left) <= 1 && Math.abs(atEdge.top) <= 1,
      'Enlarging the top-left corner should stop at (0,0), observed ' + [atEdge.left, atEdge.top]);
    await zoom.click();

    if (client) {
      await touchGesture(client, page, { x: center.x + 48, y: center.y }, { x: -96, y: 0 });
      await dialog.getByRole('heading', { name: 'World Cup AI Forecast' }).waitFor();
      assert.equal(await zoom.getAttribute('aria-pressed'), 'false', 'Swiping in fit mode must switch without zooming');
    }
  } finally {
    if (client) await client.detach();
  }
}
