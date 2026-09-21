// Does the Starfield actually move THROUGH space, and does the still sky come
// back when the slider is at 0?
//
// "Moving" is a claim about the picture changing, so it is measured on the
// picture: two screenshots 0.35 s apart, and the share of pixels that differ by
// more than a twinkle. Read off screenshots rather than getImageData for the
// reason `canvas-fade-never-arrives` is on record here.
//
// Ink share is measured at two canvas sizes as well, because the Flow look threw
// up a real fault in this style: with a fixed star count and a fixed star size,
// Starfield's lit share FELL from 51.1% to 35.7% when the canvas grew 4x - the
// sky got emptier on a bigger screen. Depth scaling should hold it.
const { chromium } = require('playwright-core');
const { readPNG, stats } = require('./png');
const path = require('path');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const ARG = k => (process.argv.find(a => a.startsWith('--' + k + '=')) || '').split('=')[1];
const FILE = ARG('app') || 'voice_visuals.html';
const APP = 'file:///C:/Local Docs/Coding/musicapps/' + FILE;
const WAV = p => path.resolve('wav', p + '.wav').split(path.sep).join('/');

// `lit%` counts every non-black pixel, and in this style most of those are the
// nebula haze rather than stars. To ask whether the SKY gets emptier, count only
// pixels bright enough to be a star.
function bright(img, thresh) {
  const { w, h, ch, data } = img;
  let n = 0;
  for (let i = 0; i < w * h; i++) {
    const o = i * ch;
    if (Math.max(data[o], data[o + 1] || 0, data[o + 2] || 0) > thresh) n++;
  }
  return n / (w * h);
}
// DOES THE SKY COVER THE SCREEN? The user's photograph showed a tight knot of
// stars in the middle of an empty frame, which no ink-share number would have
// caught - a clump and an even field can light the same TOTAL number of pixels.
// The screen is cut into a 16x9 grid and the answer is how many cells hold a
// star, plus how far the lit cells spread horizontally.
function coverage(img, thresh) {
  const { w, h, ch, data } = img, GX = 16, GY = 9;
  const cell = new Array(GX * GY).fill(0);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const o = (y * w + x) * ch;
    if (Math.max(data[o], data[o + 1] || 0, data[o + 2] || 0) > thresh)
      cell[Math.min(GY - 1, (y * GY / h) | 0) * GX + Math.min(GX - 1, (x * GX / w) | 0)]++;
  }
  let filled = 0, minC = GX, maxC = -1;
  for (let gy = 0; gy < GY; gy++) for (let gx = 0; gx < GX; gx++)
    if (cell[gy * GX + gx] > 0) { filled++; if (gx < minC) minC = gx; if (gx > maxC) maxC = gx; }
  return { cells: filled / (GX * GY), width: maxC < 0 ? 0 : (maxC - minC + 1) / GX };
}
function changed(a, b, thresh) {
  const n = Math.min(a.w * a.h, b.w * b.h);
  let d = 0;
  for (let i = 0; i < n; i++) {
    const o = i * a.ch, p = i * b.ch;
    const va = Math.max(a.data[o], a.data[o + 1] || 0, a.data[o + 2] || 0);
    const vb = Math.max(b.data[p], b.data[p + 1] || 0, b.data[p + 2] || 0);
    if (Math.abs(va - vb) > thresh) d++;
  }
  return d / n;
}

async function run(w, h, wav, travel, secs) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const browser = await chromium.launch({ executablePath: EDGE, headless: true, args: [
      '--autoplay-policy=no-user-gesture-required', '--mute-audio',
      '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream',
      '--use-file-for-fake-audio-capture=' + WAV(wav) + '%noloop' ]});
    const ctx = await browser.newContext({ permissions: ['microphone'] });
    const page = await ctx.newPage({ viewport: { width: w, height: h } });
    const errs = [];
    page.on('pageerror', e => errs.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    await page.goto(APP + '?s=visMode:stars&lock=1');
    await page.waitForTimeout(400);
    // `tw` is nested and the ?s= parser cannot reach into it - set it directly,
    // then read it back so the run reports the value it HAD.
    if (travel !== null) await page.evaluate(v => {
      SETTINGS.tw = SETTINGS.tw || {}; SETTINGS.tw.stars = SETTINGS.tw.stars || {};
      SETTINGS.tw.stars.travel = v;
    }, travel);
    await page.click('#vvGate button');
    const t0 = Date.now(); let opened = false;
    while (Date.now() - t0 < secs * 1000) {
      await page.waitForTimeout(250);
      if (await page.evaluate(() => Anim._dbg().mic === 'on')) opened = true;
      if (!opened && Date.now() - t0 > 6000) break;
    }
    if (!opened) { await browser.close(); continue; }
    const lvl = await page.evaluate(() => Anim._dbg().level);
    const r0 = await page.evaluate(() => Anim._dbg().starResp);
    const had = await page.evaluate(() => (SETTINGS.tw && SETTINGS.tw.stars && SETTINGS.tw.stars.travel));
    const a = readPNG(await page.screenshot({ type: 'png' }));
    await page.waitForTimeout(350);
    const b = readPNG(await page.screenshot({ type: 'png' }));
    const r1 = await page.evaluate(() => Anim._dbg().starResp);
    await browser.close();
    return { ink: stats(a).litFrac, star: bright(a, 40), cov: coverage(a, 40), moved: changed(a, b, 12), rate: (r1 - r0) / 0.35, lvl, had, errs, attempts: attempt + 1 };
  }
  return null;
}

(async () => {
  console.log('build: ' + FILE);
  console.log('moved% = pixels that differ between two shots 0.35 s apart.');
  console.log('');
  console.log('canvas       travel  sound        loudness  stars%  cells lit  width used  stars past/s');
  const cases = [
    [1280, 800, 'hum-8', null, 'a sustained hum'],
    [1280, 800, 'silence', null, 'silence'],
    [1280, 800, 'hum-8', 0, 'a hum, travel OFF'],
    [1280, 800, 'hum-8', 2, 'a hum, travel MAX'],
    [2560, 1600, 'hum-8', null, 'a sustained hum'],
  ];
  for (const [w, h, wav, tv, label] of cases) {
    const r = await run(w, h, wav, tv, 11);
    if (!r) { console.log((w + 'x' + h).padEnd(12), label, 'MIC NEVER OPENED'); continue; }
    console.log((w + 'x' + h).padEnd(12),
      String(r.had === undefined ? 1 : r.had).padEnd(7),
      label.padEnd(13), r.lvl.toFixed(2).padStart(6), '  ',
      (r.star * 100).toFixed(2).padStart(6) + '%',
      (r.cov.cells * 100).toFixed(0).padStart(8) + '%',
      (r.cov.width * 100).toFixed(0).padStart(10) + '%',
      (r.rate === undefined || isNaN(r.rate) ? '   n/a' : r.rate.toFixed(1).padStart(8)),
      r.errs.length ? '  ERRORS ' + r.errs.join('|') : '');
  }
})();
