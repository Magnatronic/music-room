// EVERY TUNE, EVERY GRANULARITY: does the picture read left to right?
//
// The user photographed a whole-phrase press piling every note of the phrase
// into a vertical line against the right-hand edge, and said: "It should always
// go from left to right when drawing. I think you need to check all of these."
// So this checks ALL of them — five patterns and three songs, times three
// granularities — rather than the one combination that was reported.
//
// `Anim._marks()` returns the marks as drawn, so this measures the picture
// rather than the intention behind it.
const { chromium } = require('playwright-core');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const APP = 'file:///C:/Local Docs/Coding/musicapps/big_switch.html';
const TUNES = ['climb', 'fall', 'chimes', 'wander', 'bounce', 'twinkle', 'mary', 'row'];
const GRANS = ['note', 'phrase', 'whole'];

(async () => {
  const browser = await chromium.launch({
    executablePath: EDGE, headless: true,
    args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'],
  });
  let bad = 0;
  console.log('tune      granularity   marks   x from -> to      left-to-right?');
  for (const tune of TUNES) {
    for (const gran of GRANS) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
      const errs = [];
      page.on('pageerror', e => errs.push('pageerror: ' + e.message));
      page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
      await page.goto(APP + '?s=song:' + tune + ',granularity:' + gran + ',loopSong:0&lock=1');
      await page.waitForTimeout(600);
      // READ AFTER EVERY PRESS AND KEEP THE FULLEST SHEET. The first version of
      // this pressed six times and read once at the end, with a comment claiming
      // six presses was short of the end of every tune here. It was not: a
      // pattern splits into TWO phrases, so two presses finish it, the flourish
      // runs and the sheet is cleared - and the probe reported "NOTHING DRAWN"
      // for five patterns that were drawing perfectly well.
      const presses = gran === 'whole' ? 1 : 6;
      let marks = [];
      for (let i = 0; i < presses; i++) {
        await page.evaluate(() => Anim.onCell(0, 0));
        await page.waitForTimeout(gran === 'note' ? 230 : 2600);
        const m = await page.evaluate(() => Anim._marks());
        if (m.length > marks.length) marks = m;
      }
      if (gran === 'whole') {
        for (let k = 0; k < 12; k++) {
          await page.waitForTimeout(900);
          const m = await page.evaluate(() => Anim._marks());
          if (m.length > marks.length) marks = m;
        }
      }
      await page.close();
      let ok = 'ok';
      if (!marks.length) ok = 'NOTHING DRAWN';
      else {
        for (let i = 1; i < marks.length; i++)
          if (marks[i].u < marks[i - 1].u - 1e-6) { ok = 'GOES BACKWARDS at ' + i; break; }
        if (ok === 'ok') {
          const span = marks[marks.length - 1].u - marks[0].u;
          if (marks.length > 3 && span < 1e-6) ok = 'ALL AT ONE X (a vertical stack)';
        }
      }
      if (ok !== 'ok' || errs.length) bad++;
      const from = marks.length ? marks[0].u.toFixed(3) : '-';
      const to = marks.length ? marks[marks.length - 1].u.toFixed(3) : '-';
      console.log(tune.padEnd(9), gran.padEnd(13), String(marks.length).padStart(4), '  ',
        (from + ' -> ' + to).padEnd(17), ok, errs.length ? 'ERR ' + errs[0] : '');
    }
  }
  await browser.close();
  console.log(bad ? '\n  ' + bad + ' COMBINATION(S) FAILED' : '\n  all 24 combinations draw left to right');
})();
