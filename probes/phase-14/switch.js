// BIG SWITCH: every pattern chosen through the panel and pressed into, the
// picture measured on the screen, and the patterns checked against what their
// names claim.
//
// The pitch of each note is recovered by wrapping the framework's `pluckNote`,
// which the app calls as pluckNote((col+0.5)/span, ...) — so col comes back out
// of u exactly. That is measuring what was PLAYED rather than what the generator
// intended, which is the distinction this project keeps having to relearn.
const { chromium } = require('playwright-core');
const { readPNG } = require('./png');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const APP = 'file:///C:/Local Docs/Coding/musicapps/big_switch.html';
const SPAN = 8;   // PAT_SPAN in the app

const PATTERNS = [
  ['↗ Climbing', 'climb'], ['↘ Falling', 'fall'], ['🔔 Chimes', 'chimes'],
  ['〰️ Wandering', 'wander'], ['🎪 Bouncing', 'bounce'],
];

function ink(img, thresh) {
  const { w, h, ch, data } = img;
  let n = 0;
  for (let i = 0; i < w * h; i++) {
    const o = i * ch;
    if (Math.max(data[o], data[o + 1] || 0, data[o + 2] || 0) > thresh) n++;
  }
  return n / (w * h);
}

async function open(browser, gran, extra) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await page.goto(APP + '?s=granularity:' + gran + (extra || '') + '&lock=1');
  await page.waitForTimeout(700);
  await page.evaluate(() => {
    window.__notes = [];
    const orig = window.pluckNote;
    window.pluckNote = function (u) { window.__notes.push(u); return orig.apply(this, arguments); };
  });
  return { page, errs };
}
// `advance()` debounces at 180 ms so a bouncy switch or a two-finger tap cannot
// skip notes. Pressing faster than that here does not test the app, it tests the
// debounce - the first run of this probe pressed every 130 ms and reported 8
// notes from 16 presses, which was the app behaving correctly.
const pressN = async (page, n, gap) => {
  for (let i = 0; i < n; i++) { await page.evaluate(() => Anim.onCell(0, 0)); await page.waitForTimeout(gap); }
};
const cols = page => page.evaluate(s => window.__notes.map(u => Math.round(u * s - 0.5)), SPAN);

(async () => {
  const browser = await chromium.launch({
    executablePath: EDGE, headless: true,
    args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'],
  });
  let bad = 0;

  console.log('1. Every pattern: chosen through the panel, pressed 16 times.');
  console.log('   pattern        notes played (pitch order)                    check');
  for (const [label, key] of PATTERNS) {
    const { page, errs } = await open(browser, 'note');
    const picked = await page.evaluate(l => {
      const t = document.querySelector('.bbar[data-mode="app"]'); if (t) t.click();
      const c = [...document.querySelectorAll('#appContent .chip')]
        .find(x => (x.textContent || '').indexOf(l) >= 0);
      if (c) { c.click(); return true; } return false;
    }, label);
    await page.waitForTimeout(300);
    await page.evaluate(() => { window.__notes = []; });
    await pressN(page, 16, 220);
    const got = await cols(page);
    await page.close();
    let ok = 'ok', set = [...new Set(got)].sort((a, b) => a - b);
    if (!picked) ok = 'CHIP NOT FOUND';
    else if (!got.length) ok = 'NOTHING PLAYED';
    else if (key === 'climb' && !got.every((c, i) => i === 0 || c === (got[i - 1] + 1) % SPAN)) ok = 'NOT ASCENDING';
    else if (key === 'fall' && !got.every((c, i) => i === 0 || c === (got[i - 1] - 1 + SPAN) % SPAN)) ok = 'NOT DESCENDING';
    else if (key === 'chimes' && set.some(c => [0, 2, 4, 7].indexOf(c) < 0)) ok = 'NOT CHORD TONES';
    else if (key === 'wander' && set.some(c => [0, 1, 2, 4, 5, 7].indexOf(c) < 0)) ok = 'NOT PENTATONIC';
    // MEMBERSHIP IS NOT MOVEMENT. The check above only asked whether the notes
    // were in the right scale, and a pattern that plays the SAME pentatonic note
    // sixteen times passes it - which is exactly what Wandering did when its
    // random walk clamped at the bottom of the scale instead of reflecting. The
    // user photographed a flat line of seven identical notes while this said ok.
    else if (set.length < 3) ok = 'ONLY ' + set.length + ' DIFFERENT PITCHES';
    else {
      let run = 1, worst = 1;
      for (let i = 1; i < got.length; i++) {
        if (got[i] === got[i - 1]) { run++; worst = Math.max(worst, run); } else run = 1;
      }
      if (worst > 4) ok = 'STUCK: ' + worst + ' IDENTICAL IN A ROW';
    }
    if (ok !== 'ok' || errs.length) bad++;
    console.log('   ' + label.padEnd(14), JSON.stringify(got).padEnd(46), ok, errs.length ? 'ERR ' + errs[0] : '');
  }

  console.log('');
  console.log('2. The tune draws itself. Ink on screen after the wash has faded.');
  {
    const { page } = await open(browser, 'note');
    await page.waitForTimeout(300);
    const before = ink(readPNG(await page.screenshot({ type: 'png' })), 60);
    await pressN(page, 12, 230);
    await page.waitForTimeout(1600);                       // let the wash go
    const after = ink(readPNG(await page.screenshot({ type: 'png' })), 60);
    await page.close();
    const ok = after > before * 3 && after > 0.004;
    if (!ok) bad++;
    console.log('   before any press ' + (before * 100).toFixed(3) + '%   after 12 presses ' +
      (after * 100).toFixed(3) + '%   ' + (ok ? 'ok' : 'THE PICTURE IS NOT THERE'));
  }

  console.log('');
  console.log('3. At rest, something invites a press.');
  {
    const { page } = await open(browser, 'note');
    await page.waitForTimeout(400);
    const early = ink(readPNG(await page.screenshot({ type: 'png' })), 30);
    await page.waitForTimeout(3000);
    const late = ink(readPNG(await page.screenshot({ type: 'png' })), 30);
    await page.close();
    const ok = late > early + 0.0008;
    if (!ok) bad++;
    console.log('   at 0.4 s ' + (early * 100).toFixed(3) + '%   at 3.4 s ' + (late * 100).toFixed(3) +
      '%   ' + (ok ? 'ok — the breath appears' : 'NOTHING APPEARS'));
  }

  console.log('');
  console.log('4. One press, three granularities: how many notes does it play?');
  // The whole-tune row uses a PATTERN, not Twinkle: Twinkle is 42 notes at 0.6 s
  // each and would need half a minute to finish. The first run of this probe
  // asked for more than 20 notes in 9 s and called the app wrong when it played
  // 14 of them perfectly well.
  for (const g of ['note', 'phrase', 'whole']) {
    const { page, errs } = await open(browser, g, g === 'whole' ? ',song:climb' : '');
    await page.waitForTimeout(300);
    await page.evaluate(() => { window.__notes = []; });
    await page.evaluate(() => Anim.onCell(0, 0));
    await page.waitForTimeout(g === 'whole' ? 13000 : 3000);
    const n = (await cols(page)).length;
    await page.close();
    const ok = g === 'note' ? n === 1 : g === 'phrase' ? n > 1 && n < 20 : n >= 16;
    if (!ok || errs.length) bad++;
    console.log('   ' + g.padEnd(7) + String(n).padStart(4) + ' notes   ' + (ok ? 'ok' : 'UNEXPECTED') +
      (errs.length ? '  ERR ' + errs[0] : ''));
  }

  console.log('');
  console.log('5. The finishing flourish replays the student\'s own tune.');
  {
    const { page, errs } = await open(browser, 'note', ',song:climb');
    await page.waitForTimeout(300);
    await page.evaluate(() => { window.__notes = []; });
    await pressN(page, 16, 220);          // climb is 16 notes: this finishes it
    const played = (await cols(page)).slice(0, 16);
    await page.waitForTimeout(4500);      // let the flourish run
    const all = await cols(page);
    const flourish = all.slice(16, 32);
    await page.close();
    const same = JSON.stringify(flourish) === JSON.stringify(played);
    if (!same || errs.length) bad++;
    console.log('   the student played  ' + JSON.stringify(played));
    console.log('   the flourish played ' + JSON.stringify(flourish));
    console.log('   ' + (same ? 'ok - it is their tune, not a scale run' : 'NOT THE SAME TUNE') +
      (errs.length ? '  ERR ' + errs[0] : ''));
  }

  console.log('');
  console.log('6. The giant note letter is off unless asked for.');
  {
    const { page } = await open(browser, 'note');
    await page.waitForTimeout(300);
    const on = await page.evaluate(() => !!SETTINGS.showLetter);
    await page.evaluate(() => Anim.onCell(0, 0));
    await page.waitForTimeout(500);
    const txt = await page.evaluate(() => {
      const e = document.getElementById('bsLetter'); return e ? (e.textContent || '') : '?'; });
    await page.close();
    const ok = !on && txt === '';
    if (!ok) bad++;
    console.log('   default showLetter=' + on + ', letter on screen after a press: ' +
      JSON.stringify(txt) + '   ' + (ok ? 'ok' : 'STILL ON'));
  }

  await browser.close();
  console.log(bad ? '\n  ' + bad + ' CHECK(S) FAILED' : '\n  all checks clean');
})();
