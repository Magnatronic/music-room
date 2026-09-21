// STOPPING THE BIRD ACTUALLY STOPS IT.
//
// `success()` queues the bird's whole response on timers and `stopConvo()` only
// set a flag, so changing the bird game - or pressing pause - left the previous
// response playing into whatever came next. Measured before the fix: 4 notes
// still played after switching the game mid-response. This is the same fault
// the user reported in Big Switch ("it tries to continue and it gets
// confused"), found by checking whether it generalised rather than by a report.
const { chromium } = require('playwright-core');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const APP = 'file:///C:/Local Docs/Coding/musicapps/echo_bird.html';

async function open(browser, q) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await page.goto(APP + '?s=' + q + '&lock=0');
  await page.waitForTimeout(700);
  await page.evaluate(() => {
    window.__n = [];
    const o = window.pluckNote;
    window.pluckNote = function () { window.__n.push(1); return o.apply(this, arguments); };
    const t = document.querySelector('.bbar[data-mode="app"]'); if (t) t.click();
  });
  await page.waitForTimeout(300);
  return { page, errs };
}
// get the bird into the middle of responding: start it, wait for its call, reply
async function intoResponse(page) {
  await page.evaluate(() => {
    const b = (Anim.railButtons || []).find(x => x.id === 'ebplay'); if (b) b.onClick();
  });
  await page.waitForTimeout(3500);
  for (let i = 0; i < 4; i++) { await page.evaluate(n => Anim.onCell(n % 3, 0), i); await page.waitForTimeout(200); }
  await page.waitForTimeout(1400);        // the silence ends the turn, the bird replies
}

(async () => {
  const browser = await chromium.launch({
    executablePath: EDGE, headless: true,
    args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'],
  });
  let bad = 0;
  const q = 'birdMode:free,callFrom:random,phraseLen:4,replyWait:1';

  for (const [label, act] of [
    ['change the bird game mid-response', async page => {
      await page.evaluate(() => {
        const c = [...document.querySelectorAll('#appContent .chip')]
          .find(x => /Copy the call/.test(x.textContent || '')); if (c) c.click();
      });
    }],
    ['press pause mid-response', async page => {
      await page.evaluate(() => {
        const b = (Anim.railButtons || []).find(x => x.id === 'ebplay'); if (b) b.onClick();
      });
    }],
    ['change where calls come from', async page => {
      await page.evaluate(() => {
        const c = [...document.querySelectorAll('#appContent .chip')]
          .find(x => /A song/.test(x.textContent || '')); if (c) c.click();
      });
    }],
  ]) {
    const { page, errs } = await open(browser, q);
    await intoResponse(page);
    await act(page);
    await page.evaluate(() => { window.__n = []; });
    await page.waitForTimeout(3500);
    const after = await page.evaluate(() => window.__n.length);
    await page.close();
    const ok = after === 0;
    if (!ok || errs.length) bad++;
    console.log(label.padEnd(36) + String(after).padStart(3) + ' notes still played   ' +
      (ok ? 'ok' : 'IT CARRIED ON') + (errs.length ? '  ERR ' + errs[0] : ''));
  }

  // and it must still work afterwards
  {
    const { page, errs } = await open(browser, q);
    await intoResponse(page);
    await page.evaluate(() => {
      const b = (Anim.railButtons || []).find(x => x.id === 'ebplay'); if (b) b.onClick();  // pause
    });
    await page.waitForTimeout(600);
    await page.evaluate(() => {
      const b = (Anim.railButtons || []).find(x => x.id === 'ebplay'); if (b) b.onClick();  // start again
      window.__n = [];
    });
    await page.waitForTimeout(4000);
    const after = await page.evaluate(() => window.__n.length);
    await page.close();
    const ok = after > 0;
    if (!ok || errs.length) bad++;
    console.log('start again after pausing'.padEnd(36) + String(after).padStart(3) +
      ' notes played   ' + (ok ? 'ok - not left dead' : 'THE BIRD IS DEAD') +
      (errs.length ? '  ERR ' + errs[0] : ''));
  }

  await browser.close();
  console.log(bad ? '\n  ' + bad + ' FAILED' : '\n  all clean');
})();
