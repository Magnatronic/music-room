// EVERY PATTERN SELECTED AND PLAYED INTO.
//
// CLAUDE.md: "A page that loads clean is not an app that works. A fault inside a
// style's own draw code cannot throw until a note is played AND that look is
// selected — `rise is not defined` sat in Big Chords' Sparks through a clean
// 27/27 load gate." Six new LED patterns is six new draw paths, so each one is
// selected, played into, and photographed.
//
// It also checks they are actually DIFFERENT. Six names over one picture would
// pass every error check ever written.
const { chromium } = require('playwright-core');
const { readPNG, stats } = require('./png');
const path = require('path');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const APP = 'file:///C:/Local Docs/Coding/musicapps/voice_visuals.html';
const WAV = p => path.resolve('wav', p + '.wav').split(path.sep).join('/');
const NAMES = ['Strip + EQ', 'Meteors', 'Sparkle', 'Fire', 'Rainbow run', 'Breathe'];

function diff(a, b) {
  const n = Math.min(a.w * a.h, b.w * b.h);
  let d = 0;
  for (let i = 0; i < n; i++) {
    const o = i * a.ch, p = i * b.ch;
    const va = Math.max(a.data[o], a.data[o + 1] || 0, a.data[o + 2] || 0);
    const vb = Math.max(b.data[p], b.data[p + 1] || 0, b.data[p + 2] || 0);
    if (Math.abs(va - vb) > 24) d++;
  }
  return d / n;
}

async function shot(pat, wav, secs) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const browser = await chromium.launch({ executablePath: EDGE, headless: true, args: [
      '--autoplay-policy=no-user-gesture-required', '--mute-audio',
      '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream',
      '--use-file-for-fake-audio-capture=' + WAV(wav) + '%noloop' ]});
    const ctx = await browser.newContext({ permissions: ['microphone'] });
    const page = await ctx.newPage({ viewport: { width: 1280, height: 800 } });
    const errs = [];
    page.on('pageerror', e => errs.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    await page.goto(APP + '?s=visMode:leds&lock=1');
    await page.waitForTimeout(400);
    await page.evaluate(v => {
      SETTINGS.tw = SETTINGS.tw || {}; SETTINGS.tw.leds = SETTINGS.tw.leds || {};
      SETTINGS.tw.leds.pattern = v;
    }, pat);
    await page.click('#vvGate button');
    const t0 = Date.now(); let opened = false;
    while (Date.now() - t0 < secs * 1000) {
      await page.waitForTimeout(250);
      if (await page.evaluate(() => Anim._dbg().mic === 'on')) opened = true;
      if (!opened && Date.now() - t0 > 6000) break;
    }
    if (!opened) { await browser.close(); continue; }
    // drag across it too: touch is a draw path of its own
    await page.mouse.move(300, 400); await page.mouse.down();
    for (let i = 0; i < 8; i++) { await page.mouse.move(300 + i * 60, 400 + i * 20); await page.waitForTimeout(14); }
    await page.mouse.up();
    await page.waitForTimeout(250);
    const had = await page.evaluate(() => SETTINGS.tw.leds.pattern);
    const lvl = await page.evaluate(() => Anim._dbg().level);
    const png = await page.screenshot({ type: 'png' });
    await browser.close();
    return { img: readPNG(png), st: stats(readPNG(png)), had, lvl, errs, attempts: attempt + 1 };
  }
  return null;
}

(async () => {
  console.log('Every LED pattern, selected, played into and dragged across.');
  console.log('');
  console.log('# pattern        set  loudness   lit%    brightest  errors');
  const imgs = [];
  for (let i = 1; i <= 6; i++) {
    const r = await shot(i, 'claps', 11);
    if (!r) { console.log(i, NAMES[i - 1], 'MIC NEVER OPENED'); imgs.push(null); continue; }
    imgs.push(r.img);
    console.log(String(i) + ' ' + NAMES[i - 1].padEnd(14), String(r.had).padEnd(4),
      r.lvl.toFixed(2).padStart(6), '  ', (r.st.litFrac * 100).toFixed(2).padStart(6) + '%',
      String(r.st.max).padStart(9), '  ', r.errs.length ? 'FAIL ' + r.errs.join('|') : 'none');
  }
  console.log('');
  console.log('Are they different pictures? (share of pixels differing)');
  let same = 0;
  for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) {
    if (!imgs[i] || !imgs[j]) continue;
    const d = diff(imgs[i], imgs[j]);
    if (d < 0.002) { console.log('  SAME: ' + NAMES[i] + ' vs ' + NAMES[j] + '  ' + (d * 100).toFixed(3) + '%'); same++; }
  }
  console.log(same ? '  ' + same + ' PAIR(S) INDISTINGUISHABLE' : '  all 15 pairs differ');
})();
