// A full-screen LED grid is ~1,100 dots redrawn every frame. Frame rate is the
// thing that quietly goes, so it is measured rather than assumed — at the
// default size and at the smallest LEDs the slider allows, which is the real
// worst case (`verify` skill: "a worst case must come from the real slider
// range").
const { EDGE, APP, WAV, chromium } = require('./drive');

async function fps(style, size, secs) {
  for (let a = 0; a < 5; a++) {
    const b = await chromium.launch({ executablePath: EDGE, headless: true, args: [
      '--autoplay-policy=no-user-gesture-required', '--mute-audio',
      '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream',
      '--use-file-for-fake-audio-capture=' + WAV('hum-8') + '%noloop' ]});
    const c = await b.newContext({ permissions: ['microphone'] });
    const p = await c.newPage({ viewport: { width: 1920, height: 1080 } });
    await p.goto(APP + '?s=visMode:' + style + '&lock=1');
    await p.waitForTimeout(400);
    if (size !== null) await p.evaluate(v => {
      SETTINGS.tw = SETTINGS.tw || {}; SETTINGS.tw.leds = SETTINGS.tw.leds || {};
      SETTINGS.tw.leds.size = v; }, size);
    await p.click('#vvGate button');
    const t0 = Date.now(); let ok = false;
    while (Date.now() - t0 < 6500) {
      await p.waitForTimeout(250);
      if (await p.evaluate(() => Anim._dbg().mic === 'on')) ok = true;
      if (!ok && Date.now() - t0 > 6000) break;
    }
    if (!ok) { await b.close(); continue; }
    const f0 = await p.evaluate(() => Anim._dbg().frameN);
    const w0 = Date.now();
    await p.waitForTimeout(secs * 1000);
    const f1 = await p.evaluate(() => Anim._dbg().frameN);
    const dt = (Date.now() - w0) / 1000;
    await b.close();
    return (f1 - f0) / dt;
  }
  return null;
}

(async () => {
  console.log('1920x1080, a sustained hum. Frames per second.');
  console.log('');
  for (const [label, style, size] of [
    ['LED wall, default size', 'leds', null],
    ['LED wall, SMALLEST LEDs (slider min)', 'leds', 0.6],
    ['LED wall, largest LEDs (slider max)', 'leds', 2],
    ['Starfield, for comparison', 'stars', null],
    ['Mandala, for comparison', 'mandala', null],
  ]) {
    const r = await fps(style, size, 4);
    console.log(label.padEnd(38), r === null ? 'MIC NEVER OPENED' : r.toFixed(1).padStart(6) + ' fps');
  }
})();
