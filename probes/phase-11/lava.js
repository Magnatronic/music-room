// Phase 12 / F1 — Lava's jitter, measured rather than argued.
//
// PHASE-11-LISTENING.md 12.6 claims the blob RADIUS follows the band follower's
// 30 ms attack, and wax does not move in 30 ms. This measures the radius factor
// per FRAME — a 30 ms attack is invisible at drive.js's 100 ms poll — and says
// how fast it actually moves.
//
//   R = m*b.r*tw('size') * (0.85+0.15*sin(t*0.5+ph)) * (1 + (big?0.6:1)*v + 0.4*level)
//
// The middle term is a deliberate ~12 s breathe and is excluded. What is measured
// is f = 1 + g*v + 0.4*level, which is where every fast movement comes from.
//
// It also resimulates f with an EXTRA slow follower over the same sampled bands —
// the proposed fix — so the fix has numbers before any app code is written.
const { EDGE, APP, WAV, chromium } = require('./drive');
// --app=<file.html> drives a different build (the pre-fix copy, instrumented
// with the same two _dbg lines and nothing else) so old and new are measured by
// the SAME probe. --tag names the raw files it writes.
const ARG = k => (process.argv.find(a => a.startsWith('--' + k + '=')) || '').split('=')[1];
const APP_URL = ARG('app') ? APP.replace('voice_visuals.html', ARG('app')) : APP;
const TAG = ARG('tag') || 'lava';

const ATK = 0.35, REL = 0.8;    // proposed wax follower, seconds

function follow(xs, dts, atk, rel) {          // asymmetric one-pole, as updateBands
  const out = new Array(xs.length); let y = xs[0];
  for (let i = 0; i < xs.length; i++) {
    const tau = xs[i] > y ? atk : rel;
    y += (xs[i] - y) * (1 - Math.exp(-dts[i] / tau));
    out[i] = y;
  }
  return out;
}
function stats(f, dts) {
  let sum = 0, rev = 0, prev = 0, n = 0, T = 0;
  for (let i = 1; i < f.length; i++) {
    const d = f[i] - f[i - 1];
    sum += Math.abs(d) / f[i - 1] * 100; n++; T += dts[i];
    if (d * prev < 0) rev++;
    if (d !== 0) prev = d;
  }
  let worst = 0;                              // biggest excursion inside 200 ms
  for (let i = 0; i < f.length; i++) {
    let lo = f[i], hi = f[i], t = 0;
    for (let j = i + 1; j < f.length && t < 0.2; j++) { t += dts[j]; lo = Math.min(lo, f[j]); hi = Math.max(hi, f[j]); }
    worst = Math.max(worst, (hi - lo) / lo * 100);
  }
  return { perFrame: sum / n, revPerSec: rev / T, worst200: worst };
}

async function sample(wav, secs) {
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
    await page.goto(APP_URL + '?s=visMode:lava');
    await page.waitForTimeout(400);
    await page.evaluate(() => {
      window.__s = []; let last = performance.now();
      const f = () => { const now = performance.now(), d = Anim._dbg();
        if (d.mic === 'on' && d.bands) window.__s.push([(now - last) / 1000, d.level, d.bands, d.lava.rad, d.lava.lum, d.lava.pos, d.defn, d.conf]);
        last = now; requestAnimationFrame(f); };
      requestAnimationFrame(f);
    });
    await page.click('#vvGate button');
    const t0 = Date.now();
    let opened = false;
    while (Date.now() - t0 < secs * 1000) {
      await page.waitForTimeout(250);
      const on = await page.evaluate(() => Anim._dbg().mic === 'on');
      if (on) opened = true;
      if (!opened && Date.now() - t0 > 6000) break;
    }
    const out = await page.evaluate(() => ({
      s: window.__s, n: Anim._dbg().lava.n, mode: Anim._dbg().mode }));
    await browser.close();
    if (opened && out.s.length > 60) {
      require('fs').mkdirSync('raw', { recursive: true });
      require('fs').writeFileSync('raw/' + TAG + '-' + wav + '.json', JSON.stringify(out.s));
      return { ...out, errs, attempts: attempt + 1 };
    }
  }
  return null;
}

(async () => {
  console.log('Lava radius, per FRAME. build: ' + (ARG('app') || 'voice_visuals.html'));
  console.log('proposed wax follower: attack ' + ATK + ' s, release ' + REL + ' s\n');
  for (const [wav, secs] of [['babble', 12], ['rattly', 12], ['claps', 12], ['hum-8', 12], ['tone-noisy', 9], ['shhh', 9]]) {
    const r = await sample(wav, secs);
    if (!r) { console.log(wav.padEnd(11), 'MIC NEVER OPENED in 5 attempts'); continue; }
    const dts = r.s.map(x => Math.min(0.1, x[0])), lv = r.s.map(x => x[1]);
    const nb = r.s[0][2].length;
    const fps = (r.s.length - 1) / dts.slice(1).reduce((a, b) => a + b, 0);
    // one background blob (g=0.6, i in the first 40%) and one foreground (g=1)
    const rows = [];
    for (const [name, i] of [['big  #1', 1], ['small #' + (nb - 2), nb - 2]]) {
      const g = i < nb * 0.4 ? 0.6 : 1.0;
      const v = r.s.map(x => x[2][i]);
      const now = v.map((x, k) => 1 + g * x + 0.4 * lv[k]);
      const wax = follow(v, dts, ATK, REL).map((x, k) => 1 + g * x + 0.4 * lv[k]);
      rows.push([name, stats(now, dts), stats(wax, dts)]);
    }
    console.log(wav.padEnd(11), r.s.length + ' frames  ' + fps.toFixed(1) + ' fps  ' +
      nb + ' blobs  attempt ' + r.attempts + (r.errs.length ? '  ERRORS: ' + r.errs.join('|') : ''));
    console.log('            blob      | per-frame Δr   reversals/s   worst 200 ms');
    for (const [name, a, b] of rows) {
      console.log('            ' + name.padEnd(9) + ' | now  ' +
        a.perFrame.toFixed(2).padStart(5) + '%     ' + a.revPerSec.toFixed(1).padStart(5) +
        '       ' + a.worst200.toFixed(1).padStart(5) + '%');
      console.log('            ' + ' '.repeat(9) + ' | wax  ' +
        b.perFrame.toFixed(2).padStart(5) + '%     ' + b.revPerSec.toFixed(1).padStart(5) +
        '       ' + b.worst200.toFixed(1).padStart(5) + '%');
    }
    console.log();
  }
})();
