// Is the Mandala as strong as it can be when the sound is as loud as it gets?
//
// The main spectrum layer draws each spoke at `v^1.5 * Rmax` where v is a BAND
// value - a raw FFT magnitude over 255 - and `level`, the loudness the whole app
// calibrates against the measured room floor and ceiling, never enters into it.
// So the question is whether a student at level 1.0 actually fills the picture.
// `_dbg().mand.use` is the share of the available reach the longest spoke is
// taking; 1.0 means the mandala is drawing as big as it is allowed to.
const { EDGE, APP, WAV, chromium } = require('./drive');
const ARG = k => (process.argv.find(a => a.startsWith('--' + k + '=')) || '').split('=')[1];
const APP_URL = ARG('app') ? APP.replace('voice_visuals.html', ARG('app')) : APP;

async function run(wav, secs) {
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
    await page.goto(APP_URL + '?s=visMode:mandala');
    await page.waitForTimeout(400);
    await page.evaluate(() => {
      window.__m = [];
      const f = () => { const d = Anim._dbg();
        if (d.mic === 'on' && d.mand) window.__m.push([+d.level.toFixed(3), d.mand.len, d.mand.rmax, d.mand.use, d.mand.bmax]);
        requestAnimationFrame(f); };
      requestAnimationFrame(f);
    });
    await page.click('#vvGate button');
    const t0 = Date.now(); let opened = false;
    while (Date.now() - t0 < secs * 1000) {
      await page.waitForTimeout(250);
      if (await page.evaluate(() => Anim._dbg().mic === 'on')) opened = true;
      if (!opened && Date.now() - t0 > 6000) break;
    }
    const rows = await page.evaluate(() => window.__m);
    await browser.close();
    if (opened && rows.length > 60) return { rows, errs, attempts: attempt + 1 };
  }
  return null;
}

(async () => {
  console.log('How much of its available reach does the Mandala use?');
  console.log('len/rmax = 1.00 means the longest spoke is drawn as big as allowed.\n');
  console.log('signal        loudness  longest spoke  ceiling   share used  loudest band');
  for (const [wav, secs] of [['ramp', 14], ['tone-220', 12], ['tone-350', 12], ['shhh', 12], ['babble', 12], ['claps', 12]]) {
    const r = await run(wav, secs);
    if (!r) { console.log(wav.padEnd(13), 'MIC NEVER OPENED'); continue; }
    // read the rows where the sound is at its loudest - that is the question
    const loud = r.rows.filter(x => x[0] > 0.9);
    const pick = loud.length > 5 ? loud : r.rows.slice().sort((a, b) => b[0] - a[0]).slice(0, 30);
    const mean = k => pick.reduce((a, b) => a + b[k], 0) / pick.length;
    const max = k => Math.max(...pick.map(x => x[k]));
    console.log(wav.padEnd(13), mean(0).toFixed(2).padStart(6), '  ',
      max(1).toFixed(3).padStart(10), '  ', mean(2).toFixed(3).padStart(6), '  ',
      max(3).toFixed(3).padStart(8), '  ', max(4).toFixed(3).padStart(8),
      r.errs.length ? '  ERRORS ' + r.errs.join('|') : '');
  }
})();

// Does a QUIET sound still look quiet? A gain that lifts the top can flatten the
// dynamics, and the size of the picture is how a student sees their own
// loudness. The ramp runs -55 to -10 dBFS in one take, so it holds the whole
// range; this buckets it by the app's own `level`.
(async () => {
  await new Promise(r => setTimeout(r, 500));
  const r = await run('ramp', 14);
  if (!r) { console.log(''); return console.log('ramp: MIC NEVER OPENED'); }
  console.log('');
  console.log('dynamics, off the same ramp: share of reach used at each loudness');
  console.log('  loudness   share used   spokes as % of the loudest');
  const buckets = [[0.1, 0.2], [0.3, 0.4], [0.5, 0.6], [0.7, 0.8], [0.9, 1.01]];
  const rows = buckets.map(([lo, hi]) => {
    const pick = r.rows.filter(x => x[0] >= lo && x[0] < hi);
    if (!pick.length) return null;
    return [lo, Math.max(...pick.map(x => x[3])), Math.max(...pick.map(x => x[1]))];
  }).filter(Boolean);
  const top = rows.length ? rows[rows.length - 1][2] : 1;
  for (const [lo, use, len] of rows)
    console.log('   ' + lo.toFixed(1) + '-' + (lo + 0.1).toFixed(1) + '   ' +
      use.toFixed(3).padStart(9) + '   ' + (len / top * 100).toFixed(0).padStart(8) + '%');
})();
