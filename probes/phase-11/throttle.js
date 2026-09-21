// Phase 11b, measurement 6: DOES A SLOWER MACHINE DROP CLAPS?
//
// At 62 fps every clap fires an onset - 40 of 40. But the room PC is not this
// machine, and onset() reads its transient rate ONCE PER FRAME off an envelope
// whose attack constant is 5 ms. When dt is far larger than 5 ms, fastLvl snaps
// to lvlTarget in a single frame, so a clap sampled part-way up and then at its
// peak is seen as two small jumps rather than one big one. That predicts drops
// that appear only when the frame rate falls.
//
// CDP's CPU throttle is the honest way to ask. 1x is this machine; 6x is roughly
// a low-end room PC driving a projector.
const { chromium } = require('playwright-core');
const path = require('path');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const APP = 'file:///C:/Local Docs/Coding/musicapps/voice_visuals.html';
const WAV = p => path.resolve('wav', p + '.wav').split(path.sep).join('/');

async function run(wav, secs, rate, style) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const browser = await chromium.launch({ executablePath: EDGE, headless: true, args: [
      '--autoplay-policy=no-user-gesture-required', '--mute-audio',
      '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream',
      '--use-file-for-fake-audio-capture=' + WAV(wav) + '%noloop' ]});
    const ctx = await browser.newContext({ permissions: ['microphone'] });
    const page = await ctx.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto(APP + '?s=visMode:' + style);
    await page.waitForTimeout(500);
    const cdp = await ctx.newCDPSession(page);
    if (rate > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate });
    await page.click('#vvGate button');
    const t0 = Date.now();
    let first = null, last = null, opened = false;
    for (let i = 0; i < secs * 5; i++) {
      await page.waitForTimeout(200);
      const d = await page.evaluate(() => Anim._dbg());
      if (d.mic === 'on' && !d.seeding) { opened = true; if (!first) first = d; last = d; }
      if (!opened && Date.now() - t0 > 8000) break;
    }
    await browser.close();
    if (opened && first && last) {
      const dur = (last.frameN - first.frameN) ? secs : secs;
      return { frames: last.frameN - first.frameN, onsets: last.onsetN - first.onsetN };
    }
  }
  return { frames: 0, onsets: -1 };
}

(async () => {
  console.log('40 claps 0.5 s apart into Ripples, at four CPU speeds\n');
  console.log('throttle   frames    fps   onsets  of 40 claps');
  for (const rate of [1, 3, 6, 10]) {
    const r = await run('claps-keep', 24, rate, 'ripples');
    console.log((rate + 'x').padEnd(10), String(r.frames).padStart(6),
      (r.frames / 20).toFixed(1).padStart(7), String(r.onsets).padStart(8),
      r.onsets < 0 ? '   microphone never opened' : '');
  }
})();
