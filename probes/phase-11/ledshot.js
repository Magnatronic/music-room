// Six patterns, photographed at a real loudness and composed into one sheet.
// The montage is drawn IN THE BROWSER — six data URLs onto a canvas — because
// png.js only reads PNGs and there is no image library in this project.
const { chromium } = require('playwright-core');
const path = require('path');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const APP = 'file:///C:/Local Docs/Coding/musicapps/voice_visuals.html';
const WAV = p => path.resolve('wav', p + '.wav').split(path.sep).join('/');
const OUT = process.argv[2];
const NAMES = ['1 Strip + EQ', '2 Meteors', '3 Sparkle', '4 Fire', '5 Rainbow run', '6 Breathe'];

async function shot(pat) {
  for (let a = 0; a < 5; a++) {
    const b = await chromium.launch({ executablePath: EDGE, headless: true, args: [
      '--autoplay-policy=no-user-gesture-required', '--mute-audio',
      '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream',
      '--use-file-for-fake-audio-capture=' + WAV('hum-8') + '%noloop' ]});
    const c = await b.newContext({ permissions: ['microphone'] });
    const p = await c.newPage({ viewport: { width: 640, height: 400 } });
    await p.goto(APP + '?s=visMode:leds&lock=1');
    await p.waitForTimeout(400);
    await p.evaluate(v => { SETTINGS.tw = SETTINGS.tw || {}; SETTINGS.tw.leds = SETTINGS.tw.leds || {};
      SETTINGS.tw.leds.pattern = v; }, pat);
    await p.click('#vvGate button');
    const t0 = Date.now(); let ok = false;
    while (Date.now() - t0 < 9000) {
      await p.waitForTimeout(250);
      if (await p.evaluate(() => Anim._dbg().mic === 'on')) ok = true;
      if (!ok && Date.now() - t0 > 6000) break;
    }
    if (!ok) { await b.close(); continue; }
    const lvl = await p.evaluate(() => Anim._dbg().level);
    const buf = await p.screenshot({ type: 'png' });
    await b.close();
    return { url: 'data:image/png;base64,' + buf.toString('base64'), lvl };
  }
  return null;
}

(async () => {
  const shots = [];
  for (let i = 1; i <= 6; i++) {
    const r = await shot(i);
    console.log(NAMES[i - 1] + (r ? '  loudness ' + r.lvl.toFixed(2) : '  MIC NEVER OPENED'));
    shots.push(r);
  }
  const b = await chromium.launch({ executablePath: EDGE, headless: true });
  const p = await b.newPage({ viewport: { width: 1300, height: 1260 } });
  await p.setContent('<body style="margin:0;background:#111"><canvas id=c width=1300 height=1260></canvas></body>');
  await p.evaluate(async ({ shots, names }) => {
    const ctx = document.getElementById('c').getContext('2d');
    ctx.fillStyle = '#111'; ctx.fillRect(0, 0, 1300, 1260);
    for (let i = 0; i < shots.length; i++) {
      if (!shots[i]) continue;
      const img = new Image();
      await new Promise(r => { img.onload = r; img.src = shots[i].url; });
      const x = 10 + (i % 2) * 650, y = 10 + ((i / 2) | 0) * 420;
      ctx.drawImage(img, x, y, 640, 400);
      ctx.fillStyle = '#fff'; ctx.font = '20px system-ui';
      ctx.fillText(names[i], x + 12, y + 30);
    }
  }, { shots, names: NAMES });
  await p.screenshot({ path: OUT });
  await b.close();
  console.log('saved ' + OUT);
})();
