// Re-analysis of raw/lava-*.json written by lava.js. No browser.
//
// The first pass reported a worst-200 ms of 40-50% and it was measuring THE
// SOUND STARTING - a max over a window that contained the gate opening. It also
// read two hand-picked blobs, and blob 1's band (118-154 Hz) is empty for most
// of these signals, so it returned 0.0% and said nothing. This one drops the
// first 2 s, sweeps EVERY blob, and separates the band's contribution from the
// level's.
const fs = require('fs');
const ATK = +process.argv[2] || 0.35, REL = +process.argv[3] || 0.8,
      GAIN = +process.argv[4] || 1, SKIP = 2.0;
function follow(xs, dts, atk, rel) { const o = []; let y = xs[0];
  for (let i = 0; i < xs.length; i++) { const tau = xs[i] > y ? atk : rel;
    y += (xs[i] - y) * (1 - Math.exp(-dts[i] / tau)); o.push(y); } return o; }
const sat = (x, G) => G === 1 ? x : x * G / (1 + (G - 1) * x);
const pct = (a, p) => { const s = [...a].sort((x, y) => x - y);
  return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
function exc(f, dts) {            // % excursion inside every 200 ms window
  const out = [];
  for (let i = 0; i < f.length; i++) { let lo = f[i], hi = f[i], t = 0;
    for (let j = i + 1; j < f.length && t < 0.2; j++) { t += dts[j]; lo = Math.min(lo, f[j]); hi = Math.max(hi, f[j]); }
    out.push((hi - lo) / lo * 100); }
  return out; }
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;

console.log('Lava radius, sustained sound only. "jump" = % the radius changes inside 200 ms.');
console.log('wax fix under test: an extra follower, attack ' + ATK + ' s / release ' + REL + ' s\n');
console.log('signal      n  source        typical jump   worst blob p95   worst blob max  rev/s');
for (const wav of ['babble', 'rattly', 'claps', 'hum-8', 'tone-noisy', 'shhh']) {
  const f = 'raw/lava-' + wav + '.json';
  if (!fs.existsSync(f)) continue;
  const s = JSON.parse(fs.readFileSync(f));
  let t = 0, k = 0; while (k < s.length && t < SKIP) { t += s[k][0]; k++; }
  const rows = s.slice(k), dts = rows.map(x => Math.min(0.1, x[0])), lv = rows.map(x => x[1]);
  const nb = rows[0][2].length, T = dts.reduce((a, b) => a + b, 0);
  const lvw = follow(lv, dts, ATK, REL);
  for (const [label, fix] of [['now', false], ['wax fix', true]]) {
    const med = [], p95 = [], mx = [], rv = [];
    for (let i = 0; i < nb; i++) {
      const g = i < nb * 0.4 ? 0.6 : 1.0;
      let v = rows.map(x => x[2][i]); let L = lv;
      if (fix) { v = follow(v, dts, ATK, REL); L = lvw; }
      const fr = v.map((x, j) => 1 + g * (fix ? sat(x, GAIN) : x) + 0.4 * L[j]);
      const e = exc(fr, dts);
      med.push(pct(e, 0.5)); p95.push(pct(e, 0.95)); mx.push(Math.max(...e));
      let rev = 0, prev = 0;
      for (let j = 1; j < fr.length; j++) { const d = fr[j] - fr[j - 1];
        if (d * prev < 0) rev++; if (d !== 0) prev = d; }
      rv.push(rev / T);
    }
    console.log(wav.padEnd(11), String(nb).padStart(2), ' ' + label.padEnd(12),
      (pct(med, 0.5).toFixed(1) + '%').padStart(9), '     ',
      (Math.max(...p95).toFixed(1) + '%').padStart(9), '      ',
      (Math.max(...mx).toFixed(1) + '%').padStart(9), ' ',
      Math.max(...rv).toFixed(1).padStart(5));
  }
  console.log();
}
