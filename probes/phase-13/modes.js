// EVERY CHIP ON THE APP'S OWN PANE, CLICKED AND PLAYED INTO.
//
// CLAUDE.md: "A page that loads clean is not an app that works. A fault inside a
// style's own draw code cannot throw until a note is played AND that look is
// selected." Echo Bird has three modes now and the third one is a new path
// through the turn logic, so each is selected THROUGH THE PANEL — not by a
// launch parameter — then driven: start, play, go quiet, let the bird answer,
// play again.
const { chromium } = require('playwright-core');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const APP = 'file:///C:/Local Docs/Coding/musicapps/echo_bird.html';
const MODES = [['free', 'Any reply is great'], ['copy', 'Copy the call'], ['mirror', 'The bird copies me']];

(async () => {
  const browser = await chromium.launch({
    executablePath: EDGE, headless: true,
    args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'],
  });
  console.log('mode    chip clicked   sliders shown                       errors');
  let bad = 0;
  for (const [key, label] of MODES) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errs = [];
    page.on('pageerror', e => errs.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    await page.goto(APP + '?s=replyWait:1&lock=0');
    await page.waitForTimeout(700);
    // open the app's own tab and click the chip by its label
    const clicked = await page.evaluate(l => {
      const tab = document.querySelector('.bbar[data-mode="app"]');
      if (tab) tab.click();
      const chip = [...document.querySelectorAll('#appContent .chip')]
        .find(c => (c.textContent || '').indexOf(l) >= 0);
      if (chip) { chip.click(); return true; }
      return false;
    }, label);
    await page.waitForTimeout(400);
    const sliders = await page.evaluate(() =>
      [...document.querySelectorAll('#appContent .row')].map(r => {
        const t = (r.textContent || '').trim().split('\n')[0].trim();
        return t.slice(0, 22);
      }).filter(Boolean).join(', '));
    // now actually use it
    await page.evaluate(() => {
      const b = (Anim.railButtons || []).find(x => x.id === 'ebplay');
      if (b) b.onClick();
    });
    await page.waitForTimeout(2500);
    for (const c of [0, 1, 2]) {
      await page.evaluate(n => Anim.onCell(n, 0), c);
      await page.waitForTimeout(300);
    }
    await page.waitForTimeout(3000);          // let the bird answer
    for (const c of [2, 0]) {                 // and take another turn
      await page.evaluate(n => Anim.onCell(n, 0), c);
      await page.waitForTimeout(300);
    }
    await page.waitForTimeout(2500);
    await page.close();
    if (errs.length || !clicked) bad++;
    console.log(key.padEnd(8), (clicked ? 'yes' : 'NO').padEnd(14),
      sliders.padEnd(35), errs.length ? 'FAIL ' + errs[0] : 'none');
  }
  await browser.close();
  console.log(bad ? '\n  ' + bad + ' FAILED' : '\n  3/3 modes clean');
})();
