// A/B over the RADIUS THAT WAS DRAWN, not a reconstruction of it.
//
// lava-an.js rebuilt the radius factor from the bands, which is exactly the
// mistake §12.2 records: it measures the input to the thing, not the thing.
// `_dbg().lava.rad` is now the R that drawLava actually passed to lavaBlob, in
// both builds — the old copy carries the same two instrumentation lines and no
// other change. Blob seeding is random per run (the README's 30% ink spread), so
// every number here is a PERCENTAGE OF THAT BLOB'S OWN RADIUS, which normalises
// the seed out.
const fs = require('fs');
const SKIP = 2.0;
const pct = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
function load(tag, wav) {
  const f = 'raw/' + tag + '-' + wav + '.json';
  if (!fs.existsSync(f)) return null;
  const s = JSON.parse(fs.readFileSync(f));
  let t = 0, k = 0; while (k < s.length && t < SKIP) { t += s[k][0]; k++; }
  const rows = s.slice(k);
  return { dts: rows.map(x => Math.min(0.1, x[0])), lv: rows.map(x => x[1]),
           rad: rows.map(x => x[3]), n: rows[0][3].length,
           defn: rows[0].length > 6 ? rows.map(x => x[6]) : null };
}
function jitter(d) {                         // % of its own radius inside 200 ms
  const p95 = [], med = [], rv = [], T = d.dts.reduce((a, b) => a + b, 0);
  for (let i = 0; i < d.n; i++) {
    const f = d.rad.map(r => r[i]), e = [];
    for (let j = 0; j < f.length; j++) { let lo = f[j], hi = f[j], t = 0;
      for (let k = j + 1; k < f.length && t < 0.2; k++) { t += d.dts[k]; lo = Math.min(lo, f[k]); hi = Math.max(hi, f[k]); }
      e.push((hi - lo) / lo * 100); }
    med.push(pct(e, 0.5)); p95.push(pct(e, 0.95));
    let rev = 0, prev = 0;
    for (let j = 1; j < f.length; j++) { const dd = f[j] - f[j - 1]; if (dd * prev < 0) rev++; if (dd !== 0) prev = dd; }
    rv.push(rev / T);
  }
  return { med: pct(med, 0.5), p95: Math.max(...p95), rev: Math.max(...rv) };
}
// The 200 ms excursion above cannot see the SHAPE of a rise — it scores a smooth
// ramp and a jump-then-flat identically, which is why it passed a build the user
// still called jerky. These two can.
function shape(d) {
  const step = [], front = [];
  const ts = []; { let t = 0; for (const x of d.dts) { ts.push(t); t += x; } }
  for (let i = 0; i < d.n; i++) {
    const f = d.rad.map(r => r[i]);
    for (let j = 1; j < f.length; j++) step.push(Math.abs(f[j] - f[j - 1]) / f[j - 1] * 100);
    let j = 1;
    while (j < f.length - 1) {
      if (f[j] > f[j - 1]) {
        const s = j - 1; let e = j;
        while (e < f.length - 1 && f[e + 1] >= f[e]) e++;
        const span = f[e] - f[s], dur = ts[e] - ts[s];
        if (span / f[s] > 0.05 && dur > 0.05) {
          let k = s; while (k < e && ts[k] - ts[s] < 0.1) k++;
          front.push((f[k] - f[s]) / span * 100);
        }
        j = e + 1;
      } else j++;
    }
  }
  return { step: pct(step, 0.999), front: front.length ? pct(front, 0.5) : NaN };
}
function swell(d) {                          // per clap: peak growth and its lag
  const ts = []; { let t = 0; for (const x of d.dts) { ts.push(t); t += x; } }
  const hits = [];
  for (let i = 1; i < d.lv.length; i++)
    if (d.lv[i] > 0.3 && d.lv[i - 1] <= 0.3 && (!hits.length || ts[i] - hits[hits.length - 1] > 0.6)) hits.push(ts[i]);
  const sw = [], lag = [];
  for (let i = 0; i < d.n; i++) for (const h of hits) {
    let base = null, pk = -1, pkt = 0;
    for (let j = 0; j < ts.length; j++) {
      if (ts[j] <= h && ts[j] > h - 0.05) base = d.rad[j][i];
      if (ts[j] > h && ts[j] < h + 1.5 && d.rad[j][i] > pk) { pk = d.rad[j][i]; pkt = ts[j] - h; }
    }
    if (base && pk > 0) { sw.push((pk / base - 1) * 100); lag.push(pkt); }
  }
  const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
  return { n: hits.length, swell: mean(sw), lag: mean(lag) * 1000 };
}
console.log('Radius as DRAWN. jump = % of that blob\'s own radius inside 200 ms.\n');
console.log('signal      build   typical jump   worst blob p95   reversals/s');
for (const wav of ['babble', 'rattly', 'claps', 'hum-8', 'tone-noisy', 'shhh']) {
  for (const tag of ['old', 'r1', 'lin', 'new']) {
    const d = load(tag, wav); if (!d) continue;
    const j = jitter(d);
    console.log(wav.padEnd(11), tag.padEnd(6),
      (j.med.toFixed(1) + '%').padStart(10), '    ', (j.p95.toFixed(1) + '%').padStart(9), '    ', j.rev.toFixed(1).padStart(6));
  }
  console.log();
}
// THE RADIUS THE EYE READS, which is not R.
//
// Everything above measures `rad` — the R that drawLava passed to lavaBlob. The
// near-opaque core of the blob is drawn at 0.6*e*R where e = 0.55+0.45*defn, and
// `defn` had no inertia at all: measured on a babbling child it swung the full
// 0 -> 1 BETWEEN TWO FRAMES, taking the visible edge with it by 82% while R
// moved 0.64%. Every metric in this file said the build was smooth. The user
// said it was jerky "especially when Voice texture is high", and they were
// reading the picture while the probes read the arithmetic behind it.
//
// Only runs recorded after `defn` was added to the sample tuple can be scored.
function core(d) {
  if (!d.defn) return null;
  const step = [];
  for (let i = 0; i < d.n; i++) {
    const f = d.rad.map((r, j) => 0.6 * (0.55 + 0.45 * d.defn[j]) * r[i]);
    for (let j = 1; j < f.length; j++) step.push(Math.abs(f[j] - f[j - 1]) / f[j - 1] * 100);
  }
  let dm = 0;
  for (let j = 1; j < d.defn.length; j++) dm = Math.max(dm, Math.abs(d.defn[j] - d.defn[j - 1]));
  return { step: pct(step, 0.999), defn: dm };
}
console.log('the radius the EYE reads, 0.6*(0.55+0.45*defn)*R\n');
console.log('signal      build   biggest frame   defn, worst frame');
for (const wav of ['babble', 'rattly', 'claps']) {
  for (const tag of ['trace', 'new']) {
    const d = load(tag, wav); if (!d) continue;
    const c = core(d); if (!c) continue;
    console.log(wav.padEnd(11), (tag === 'trace' ? 'before' : 'after').padEnd(6),
      (c.step.toFixed(2) + '%').padStart(10), '       ', c.defn.toFixed(3).padStart(6));
  }
  console.log('');
}
console.log('the SHAPE of a rise - biggest single frame, and the share of a rise');
console.log('done in its first 100 ms. A one-pole front-loads; a slew limit cannot.');
console.log('');
console.log('signal      build   biggest frame   front-loaded');
for (const wav of ['babble', 'claps']) {
  for (const tag of ['old', 'r1', 'lin', 'new']) {
    const d = load(tag, wav); if (!d) continue;
    const h = shape(d);
    console.log(wav.padEnd(11), tag.padEnd(6), (h.step.toFixed(2) + '%').padStart(10), '    ', (h.front.toFixed(0) + '%').padStart(8));
  }
  console.log('');
}
console.log('a clap\'s swell, averaged over every blob and every clap:');
for (const tag of ['old', 'r1', 'lin', 'new']) {
  const d = load(tag, 'claps'); if (!d) continue;
  const s = swell(d);
  console.log(' ', tag.padEnd(5), s.n + ' claps  peak +' + s.swell.toFixed(1) + '%  at ' + s.lag.toFixed(0) + ' ms');
}
