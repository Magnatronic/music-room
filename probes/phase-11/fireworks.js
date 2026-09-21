// How far does a firework actually REACH?
//
// "Bigger explosions and a particle-size slider" is a request about a distance,
// so it is measured as one: `_dbg().fw` reports how far the burst particles have
// travelled from their own origin, as a fraction of min(W,H) so the window size
// does not enter into it. Reported at the moment a burst is at its widest,
// which is not the moment it is born.
const { EDGE, APP, WAV, chromium } = require('./drive');
const ARG = k => (process.argv.find(a => a.startsWith('--' + k + '=')) || '').split('=')[1];
const APP_URL = ARG('app') ? APP.replace('voice_visuals.html', ARG('app')) : APP;

async function run(wav, secs, tweaks) {
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
    await page.goto(APP_URL + '?s=visMode:fountain');
    await page.waitForTimeout(400);
    // `tw` is nested and the ?s= parser does not reach into it — set it here, and
    // read it back below so the run prints what it HAD, not what it asked for.
    if (tweaks) await page.evaluate(o => {
      SETTINGS.tw = SETTINGS.tw || {}; SETTINGS.tw.fountain = Object.assign(SETTINGS.tw.fountain || {}, o);
    }, tweaks);
    await page.evaluate(() => {
      window.__f = []; let last = performance.now();
      const f = () => { const now = performance.now(), d = Anim._dbg();
        if (d.mic === 'on' && d.fw) window.__f.push([(now - last) / 1000, d.level, d.fw.age,
          d.fw.trail, d.fw.p50, d.fw.p90, d.fw.max, d.fw.off, d.fw.n]);
        last = now; requestAnimationFrame(f); };
      requestAnimationFrame(f);
    });
    await page.click('#vvGate button');
    const t0 = Date.now(); let opened = false;
    while (Date.now() - t0 < secs * 1000) {
      await page.waitForTimeout(250);
      if (await page.evaluate(() => Anim._dbg().mic === 'on')) opened = true;
      if (!opened && Date.now() - t0 > 6000) break;
    }
    const had = await page.evaluate(() => (SETTINGS.tw && SETTINGS.tw.fountain) || {});
    const rows = await page.evaluate(() => window.__f);
    await browser.close();
    if (opened && rows.length > 60) return { rows, errs, had, attempts: attempt + 1 };
  }
  return null;
}

// A burst grows, then drag stops it. The number that matters is how wide it got.
function widest(rows) {
  const bursts = [];
  let cur = null;
  for (const r of rows) {
    if (r[2] < 0.05) { if (cur) bursts.push(cur); cur = { p50: 0, p90: 0, max: 0, off: 0, n: 0 }; }
    if (cur && r[3] > 0) {
      cur.p50 = Math.max(cur.p50, r[4]); cur.p90 = Math.max(cur.p90, r[5]);
      cur.max = Math.max(cur.max, r[6]); cur.off = Math.max(cur.off, r[7]);
      cur.n = Math.max(cur.n, r[3]);
    }
  }
  if (cur) bursts.push(cur);
  const good = bursts.filter(b => b.n > 5);
  const mean = k => good.reduce((a, b) => a + b[k], 0) / (good.length || 1);
  return { bursts: good.length, p50: mean('p50'), p90: mean('p90'), max: mean('max'),
           off: mean('off'), n: mean('n') };
}

// A max taken over each percentile INDEPENDENTLY mixes moments: it can report a
// p50 from one frame and a p90 from another, which is how the first run of this
// produced p50 0.092 beside p90 0.509 — a shape no burst ever had. Read the
// distribution at a FIXED AGE instead.
function atAge(rows, age) {
  // Split into bursts on the TRANSITION into age<0.05, not on every frame that
  // is under it. A burst spends about three frames there, and the first version
  // of this closed and reopened the burst on each of them - so every row it
  // pushed was one real sample plus two age-0.02 samples, and the mean of
  // [0.80, 0.02, 0.03] is 0.28. That is exactly the age this printed while
  // claiming 0.8 s, and it diluted every reach figure in the table with two
  // newborn bursts. The raw per-frame timeline is what caught it.
  const bursts = [];
  let cur = null, prev = 9;
  for (const r of rows) {
    if (r[2] < 0.05 && prev >= 0.05) { if (cur) bursts.push(cur); cur = []; }
    if (cur) cur.push(r);
    prev = r[2];
  }
  if (cur) bursts.push(cur);
  const out = [];
  for (const b of bursts) {
    let best = null, bd = 9;
    for (const r of b) if (r[3] > 5 && Math.abs(r[2] - age) < bd) { bd = Math.abs(r[2] - age); best = r; }
    if (best && bd < 0.15) out.push(best);   // no row near that age: report nothing
  }
  const mean = k => out.reduce((a, b) => a + b[k], 0) / (out.length || 1);
  return { bursts: out.length, n: mean(3), p50: mean(4), p90: mean(5), max: mean(6),
           off: mean(7), got: mean(2) };
}

(async () => {
  const cases = [['default', null], ['Burst size at max', { burst: 2 }], ['Burst size at min', { burst: 0.4 }]];
  console.log('reach of a burst, as a fraction of min(W,H) from its own origin');
  console.log('(0.5 = the particle reached the edge of a square screen)\n');
  console.log('setting              burst   REAL age particles   p50     p90     max   off-screen');
  for (const [label, tw] of cases) {
    const r = await run('claps', 13, tw);
    if (!r) { console.log(label.padEnd(20), 'MIC NEVER OPENED'); continue; }
    for (const age of [0.2, 0.5, 0.9]) {
      const w = atAge(r.rows, age);
      console.log((age === 0.2 ? label : '').padEnd(20),
        (age === 0.2 ? String(r.had.burst === undefined ? 1 : r.had.burst) : '').padEnd(6),
        ('+' + w.got.toFixed(2) + 's').padStart(7), w.n.toFixed(0).padStart(7), '  ',
        w.p50.toFixed(3), '  ', w.p90.toFixed(3), '  ', w.max.toFixed(3), '  ',
        w.off.toFixed(1).padStart(5), r.errs.length && age === 0.2 ? '  ERRORS ' + r.errs.join('|') : '');
    }
  }
})();
