// Opening the fake microphone is UNRELIABLE on this machine, and it is not the
// app: getUserMedia resolves, or it sits pending for ever, run to run, with no
// pattern. Measured 2026-09-04 — three consecutive launches gave 4.2 s, never,
// never; the run that DID open returned f0 220.0 Hz exactly. The project has
// this on record already as an environmental audio-device stall that once
// cleared with a PC restart and no code change.
//
// So every probe here retries the launch when the microphone never comes up,
// and REPORTS how many attempts it took. A silent retry would hide a real
// regression behind the flakiness; a probe that does not retry measures the
// machine instead of the change.
const { chromium } = require('playwright-core');
const path = require('path');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const APP = 'file:///C:/Local Docs/Coding/musicapps/voice_visuals.html';
const WAV = p => path.resolve('wav', p + '.wav').split(path.sep).join('/');

let retries = 0;
const retryCount = () => retries;

// Drives one run. `sample` is called with the page each tick; returns its rows.
async function drive(wav, secs, params, stepMs, onOpen) {
  const step = stepMs || 100, n = Math.round(secs * 1000 / step);
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
    await page.goto(APP + (params || ''));
    await page.waitForTimeout(500);
    if (onOpen) await onOpen(page);
    const t0 = Date.now();
    await page.click('#vvGate button');
    const rows = [];
    let opened = false, tSeed = null, tOn = null;
    for (let i = 0; i < n; i++) {
      await page.waitForTimeout(step);
      const d = await page.evaluate(() => Anim._dbg());
      if (d.mic === 'seeding' && tSeed === null) tSeed = Date.now() - t0;
      if (d.mic === 'on') { opened = true; if (tOn === null) tOn = Date.now() - t0; }
      rows.push(d);
      // ABANDON EARLY. Waiting out the full run before deciding to retry meant
      // five attempts cost five times the run length - 70 s for a 14 s probe -
      // when the answer was known within a few seconds. If the device has not
      // opened in 6 s it is not going to.
      if (!opened && Date.now() - t0 > 6000) break;
    }
    await browser.close();
    if (opened) return { rows, errs, page: null, tSeed, tOn, attempts: attempt + 1 };
    retries++;
    // the device never opened at all. Not a result — try again.
  }
  return { rows: [], errs: ['microphone never opened in 5 attempts'], tSeed: null, tOn: null, attempts: 5 };
}
module.exports = { drive, retryCount, APP, EDGE, WAV, chromium };
