// CHANGING THE SETTINGS MID-TUNE STARTS AGAIN CLEANLY.
//
// The user: "if I click on a song or 'each press plays…' it should auto reset.
// Currently it tries to continue and it gets confused."
//
// The mechanism was that a phrase, a whole tune and the flourish all queue their
// notes on timers. Resetting the counters left those timers to fire, so the
// PREVIOUS tune played on into the new one — moving the progress and dropping
// marks as it went. This drives exactly that: start something long, change the
// setting through the panel, and count what still happens afterwards.
const { chromium } = require('playwright-core');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const APP = 'file:///C:/Local Docs/Coding/musicapps/big_switch.html';

async function open(browser, q) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await page.goto(APP + '?s=' + q + '&lock=0');
  await page.waitForTimeout(700);
  await page.evaluate(() => {
    window.__n = [];
    const orig = window.pluckNote;
    window.pluckNote = function () { window.__n.push(performance.now()); return orig.apply(this, arguments); };
    const t = document.querySelector('.bbar[data-mode="app"]'); if (t) t.click();
  });
  await page.waitForTimeout(300);
  return { page, errs };
}
const clickChip = (page, label) => page.evaluate(l => {
  const c = [...document.querySelectorAll('#appContent .chip')]
    .find(x => (x.textContent || '').indexOf(l) >= 0);
  if (c) { c.click(); return true; } return false;
}, label);

(async () => {
  const browser = await chromium.launch({
    executablePath: EDGE, headless: true,
    args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'],
  });
  let bad = 0;

  console.log('1. Change the SONG while a whole tune is playing.');
  {
    const { page, errs } = await open(browser, 'song:twinkle,granularity:whole');
    await page.evaluate(() => Anim.onCell(0, 0));   // 42 notes queued
    await page.waitForTimeout(2500);
    const before = await page.evaluate(() => window.__n.length);
    const picked = await clickChip(page, 'Climbing');
    await page.evaluate(() => { window.__n = []; });
    await page.waitForTimeout(3500);                // nothing should play now
    const after = await page.evaluate(() => window.__n.length);
    const marks = (await page.evaluate(() => Anim._marks())).length;
    await page.close();
    const ok = picked && after === 0 && marks === 0;
    if (!ok || errs.length) bad++;
    console.log('   ' + before + ' notes played, then switched to Climbing: ' + after +
      ' notes still played, ' + marks + ' marks left   ' +
      (ok ? 'ok' : 'THE OLD TUNE CARRIED ON') + (errs.length ? '  ERR ' + errs[0] : ''));
  }

  console.log('');
  console.log('2. Change EACH PRESS PLAYS mid-tune.');
  {
    const { page, errs } = await open(browser, 'song:twinkle,granularity:note');
    for (let i = 0; i < 6; i++) { await page.evaluate(() => Anim.onCell(0, 0)); await page.waitForTimeout(230); }
    const before = (await page.evaluate(() => Anim._marks())).length;
    const picked = await clickChip(page, 'A whole phrase');
    await page.waitForTimeout(400);
    const marks = (await page.evaluate(() => Anim._marks())).length;
    const prog = await page.evaluate(() => {
      const e = document.getElementById('bsProgress'); return e ? e.style.width : '?'; });
    await page.close();
    const ok = picked && marks === 0 && (prog === '0%' || prog === '');
    if (!ok || errs.length) bad++;
    console.log('   ' + before + ' marks drawn, then switched to phrase: ' + marks +
      ' marks left, progress ' + JSON.stringify(prog) + '   ' +
      (ok ? 'ok' : 'IT CARRIED ON') + (errs.length ? '  ERR ' + errs[0] : ''));
  }

  console.log('');
  console.log('3. Restart (the ⏮ button) while a whole tune is playing.');
  {
    const { page, errs } = await open(browser, 'song:twinkle,granularity:whole');
    await page.evaluate(() => Anim.onCell(0, 0));
    await page.waitForTimeout(2500);
    await page.evaluate(() => {
      const b = (Anim.railButtons || []).find(x => x.id === 'bsrestart');
      if (b) b.onClick();
      window.__n = [];
    });
    await page.waitForTimeout(3000);
    const after = await page.evaluate(() => window.__n.length);
    const marks = (await page.evaluate(() => Anim._marks())).length;
    await page.close();
    const ok = after === 0 && marks === 0;
    if (!ok || errs.length) bad++;
    console.log('   after Restart: ' + after + ' notes still played, ' + marks + ' marks left   ' +
      (ok ? 'ok' : 'THE TUNE CARRIED ON') + (errs.length ? '  ERR ' + errs[0] : ''));
  }

  console.log('');
  console.log('4. And it still works afterwards — a reset must not leave it dead.');
  {
    const { page, errs } = await open(browser, 'song:twinkle,granularity:note');
    await page.evaluate(() => Anim.onCell(0, 0));
    await page.waitForTimeout(300);
    await clickChip(page, 'Climbing');
    await page.waitForTimeout(400);
    await page.evaluate(() => { window.__n = []; });
    for (let i = 0; i < 4; i++) { await page.evaluate(() => Anim.onCell(0, 0)); await page.waitForTimeout(230); }
    const notes = await page.evaluate(() => window.__n.length);
    const marks = (await page.evaluate(() => Anim._marks())).length;
    await page.close();
    const ok = notes === 4 && marks === 4;
    if (!ok || errs.length) bad++;
    console.log('   4 presses after the change: ' + notes + ' notes, ' + marks + ' marks   ' +
      (ok ? 'ok' : 'BROKEN AFTER RESET') + (errs.length ? '  ERR ' + errs[0] : ''));
  }

  await browser.close();
  console.log(bad ? '\n  ' + bad + ' FAILED' : '\n  all clean');
})();
