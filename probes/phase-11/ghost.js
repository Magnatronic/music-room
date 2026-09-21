// Phase 11b, measurement 2: THE GHOSTING, MEASURED OFF A SCREENSHOT.
//
// The user photographed Fireworks leaving permanent grey streaks and said other
// styles do it too. The mechanism is the frame fade: every style paints
// `rgba(background, fade)` over the whole canvas each frame, which on an 8-bit
// canvas is dst = round(dst * (1 - fade)). A pixel stops moving as soon as
// dst * fade <= 0.5 - so the arithmetic predicts a permanent residue of
// floor(0.5 / fade), and NO value of fade below 0.5 can ever reach zero.
//
//   fountain 0.10  -> predicted residue 5/255
//   flow     0.045 -> predicted residue 11/255
//   stars    0.45, leds 0.40, mandala/waves/ripples 0.30 -> 1/255
//   lava, pixels 1 -> hard clear, 0
//
// It is measured from a Playwright SCREENSHOT rather than getImageData, because
// this project has on record (`canvas-fade-never-arrives`) that reading pixels
// back de-accelerates the canvas and hides exactly this bug. A screenshot is
// the composited output, which is what the user's photograph is.
const { chromium } = require('playwright-core');
const { readPNG, stats, modeDim } = require('./png');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const APP = 'file:///C:/Local Docs/Coding/musicapps/voice_visuals.html';
// `flow` was deleted from the app on 2026-09-05; its row below is kept as
// part of the Phase 11b record but the style can no longer be driven.
const STYLES = ['mandala','lava','waves','pixels','leds','ripples','fountain','stars'];
// The fades this file was written to measure. Phase 11b set every one of them
// to 1 (a hard clear), so these are kept ONLY as the before-column: a run that
// still reports a rising dim% would mean the clear had been undone somewhere.
const FADE = {mandala:0.30,lava:1,waves:0.30,flow:0.045,pixels:1,leds:0.4,
              ripples:0.30,fountain:0.10,stars:0.45};

(async () => {
  const browser = await chromium.launch({ executablePath: EDGE, headless: true,
    args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'] });
  console.log('The residue is the DIM population - pixels stalled at a few 255ths');
  console.log('that the fade can no longer move, measured against the same style');
  console.log('at rest, because Mandala draws a bright ring in silence.');
  console.log('');
  console.log('style    old fade  pred  dim%@rest  dim%@+10s  dim%@+25s   commonest residue');
  for (const s of STYLES) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    await page.goto(APP + '?s=visMode:' + s);
    await page.waitForTimeout(1200);
    const rest = stats(readPNG(await page.screenshot()));
    // six real mouse clicks across the surface, spaced past every act() gate
    for (let i = 0; i < 6; i++) {
      const x = 220 + i * 160, y = 260 + (i % 3) * 130;
      await page.mouse.move(x, y);
      await page.mouse.down(); await page.waitForTimeout(40); await page.mouse.up();
      await page.waitForTimeout(300);
    }
    // Ten seconds: every style's own particles are long dead and the sim is
    // still animating (it runs 20 s past the last activity), so the fade has had
    // 600 frames to finish. Then twenty-five, which is past the sim going to
    // sleep - what is on screen then is what the student is left looking at.
    await page.waitForTimeout(10000);
    const a10 = readPNG(await page.screenshot());
    const s10 = stats(a10);
    await page.waitForTimeout(15000);
    const a25 = readPNG(await page.screenshot());
    const s25 = stats(a25), m25 = modeDim(a25);
    const pred = FADE[s] >= 0.5 ? 0 : Math.floor(0.5 / FADE[s]);
    const pc = v => (v * 100).toFixed(2) + '%';
    console.log(s.padEnd(10), String(FADE[s]).padStart(5), String(pred).padStart(5),
      pc(rest.dimFrac).padStart(10), pc(s10.dimFrac).padStart(11), pc(s25.dimFrac).padStart(11),
      ('  ' + m25.value + '/255 on ' + (m25.count / s25.n * 100).toFixed(1) + '% of pixels'),
      errs.length ? '  ERR ' + errs[0] : '');
    await page.close();
  }
  await browser.close();
})();
