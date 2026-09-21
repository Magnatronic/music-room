// Choosing the rise: exponential vs LINEAR (slew-limited), off the raw rows.
//
// The user: "I like how it fades back, but it is still jerky when detecting
// sound, maybe it should grow linearly." The 200 ms-excursion metric in
// lava-ab.js cannot answer that at all — it scores a smooth ramp and a jump
// followed by a flat identically, because it only measures how FAR the radius
// moved, never how it got there. Two metrics here do:
//
//   step   the largest SINGLE-FRAME change, % of radius. A jerk is one frame.
//   front  the share of a rise completed in its first 100 ms. A one-pole
//          front-loads (it covers the most ground on frame one and then
//          creeps); a constant rate cannot exceed 100ms/duration.
//
// This is a simulation over raw/old-*.json — legitimate for CHOOSING a rate,
// because the radius is a pure function of the bands and level those rows hold,
// and confirmed afterwards on the radius as drawn.
const fs = require('fs');
const REL = 0.8, SKIP = 2.0;
const sat = (x, G) => G === 1 ? x : x * G / (1 + (G - 1) * x);
const pct = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };

function run(rows, mode, par) {
  const dts = rows.map(x => Math.min(0.1, x[0])), lv = rows.map(x => x[1]);
  const nb = rows[0][2].length, out = [];
  const rise = (y, x, dt) => mode === 'exp'
    ? y + (x - y) * (1 - Math.exp(-dt / par))          // one-pole, par = tau
    : mode === 'lin'
    ? Math.min(x, y + par * dt)                         // slew, par = units/s
    // BOTH: whichever moves less this frame. The slew caps a big rise (a clap),
    // the one-pole eases a small one (a syllable) — neither shape wins on both.
    : Math.min(x, y + Math.min(par[0] * dt, (x - y) * (1 - Math.exp(-dt / par[1]))));
  const fall = (y, x, dt) => y + (x - y) * (1 - Math.exp(-dt / REL));
  let wl = 0; const wb = new Array(nb).fill(0);
  for (let j = 0; j < rows.length; j++) {
    const dt = dts[j];
    wl = lv[j] > wl ? rise(wl, lv[j], dt) : fall(wl, lv[j], dt);
    const f = [];
    for (let i = 0; i < nb; i++) {
      const v = Math.min(1, rows[j][2][i]), g = i < nb * 0.4 ? 0.6 : 1.0;
      wb[i] = v > wb[i] ? rise(wb[i], v, dt) : fall(wb[i], v, dt);
      f.push(1 + g * (mode === 'exp' ? sat(wb[i], 2.5) : wb[i]) + 0.4 * wl);
    }
    out.push(f);
  }
  return { f: out, dts, lv, nb };
}
function score(r) {
  const step = [], front = [], exc = [];
  const ts = []; { let t = 0; for (const d of r.dts) { ts.push(t); t += d; } }
  for (let i = 0; i < r.nb; i++) {
    const f = r.f.map(x => x[i]);
    for (let j = 1; j < f.length; j++) step.push(Math.abs(f[j] - f[j - 1]) / f[j - 1] * 100);
    // every rise: from a local minimum to the local maximum that follows it
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
    for (let j2 = 0; j2 < f.length; j2++) { let lo = f[j2], hi = f[j2], t = 0;
      for (let k = j2 + 1; k < f.length && t < 0.2; k++) { t += r.dts[k]; lo = Math.min(lo, f[k]); hi = Math.max(hi, f[k]); }
      exc.push((hi - lo) / lo * 100); }
  }
  return { step: pct(step, 0.999), front: front.length ? pct(front, 0.5) : NaN, exc: pct(exc, 0.95) };
}
function swell(r) {
  const ts = []; { let t = 0; for (const d of r.dts) { ts.push(t); t += d; } }
  const hits = [];
  for (let i = 1; i < r.lv.length; i++)
    if (r.lv[i] > 0.3 && r.lv[i - 1] <= 0.3 && (!hits.length || ts[i] - hits[hits.length - 1] > 0.6)) hits.push(ts[i]);
  const sw = [], lag = [];
  for (let i = 0; i < r.nb; i++) for (const h of hits) {
    let base = null, pk = -1, pkt = 0;
    for (let j = 0; j < ts.length; j++) {
      if (ts[j] <= h && ts[j] > h - 0.05) base = r.f[j][i];
      if (ts[j] > h && ts[j] < h + 1.5 && r.f[j][i] > pk) { pk = r.f[j][i]; pkt = ts[j] - h; }
    }
    if (base && pk > 0) { sw.push((pk / base - 1) * 100); lag.push(pkt); }
  }
  const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
  return { swell: mean(sw), lag: mean(lag) * 1000 };
}
const load = w => { const s = JSON.parse(fs.readFileSync('raw/old-' + w + '.json'));
  let t = 0, k = 0; while (k < s.length && t < SKIP) { t += s[k][0]; k++; } return s.slice(k); };

console.log('rise shape: biggest single frame, and how front-loaded a rise is\n');
console.log('rise                 babble          clapping                 a clap');
console.log('                   step  front     step  front  200ms      swell   lag');
const cases = [['exp 0.35 +gain', 'exp', 0.35], ['linear 0.8/s', 'lin', 0.8],
               ['linear 1.0/s', 'lin', 1.0], ['linear 1.2/s', 'lin', 1.2],
               ['linear 1.6/s', 'lin', 1.6], ['linear 2.2/s', 'lin', 2.2],
               ['min(1.0/s, 0.35s)', 'both', [1.0, 0.35]],
               ['min(1.0/s, 0.5s)', 'both', [1.0, 0.5]],
               ['min(1.2/s, 0.35s)', 'both', [1.2, 0.35]]];
for (const [name, mode, par] of cases) {
  const b = score(run(load('babble'), mode, par));
  const c = run(load('claps'), mode, par), cs = score(c), sw = swell(c);
  console.log(name.padEnd(17),
    (b.step.toFixed(2) + '%').padStart(6), (b.front.toFixed(0) + '%').padStart(6), '  ',
    (cs.step.toFixed(2) + '%').padStart(6), (cs.front.toFixed(0) + '%').padStart(6),
    (cs.exc.toFixed(1) + '%').padStart(7), '  ',
    ('+' + sw.swell.toFixed(1) + '%').padStart(7), (sw.lag.toFixed(0) + 'ms').padStart(6));
}

// ── the second report: "the balls jump around instantly into different
// locations when detecting sound". That is not the strike (touch only) — it is
//   b.x += b.vx*dt*(1+level*1.5)
// multiplying every blob's drift speed by up to 2.5x off the INSTANT level,
// which has a 50 ms attack. Same rows, no new instrumentation needed: the speed
// multiplier is a pure function of the loudness signal it is given.
console.log('');
console.log('drift speed multiplier 1+1.5*L — how much it changes in ONE FRAME');
console.log('                      biggest jump   p99.9   reaches 2.5x in');
for (const wav of ['babble', 'claps']) {
  for (const [name, sig] of [['level (now)', 'lv'], ['waxLvl, linear 1.0/s', 'wax']]) {
    const rows = load(wav);
    const dts = rows.map(x => Math.min(0.1, x[0])), lv = rows.map(x => x[1]);
    let y = 0; const L = [];
    for (let j = 0; j < rows.length; j++) {
      if (sig === 'lv') L.push(lv[j]);
      else { y = lv[j] > y ? Math.min(lv[j], y + 1.0 * dts[j]) : y + (lv[j] - y) * (1 - Math.exp(-dts[j] / REL)); L.push(y); }
    }
    const m = L.map(x => 1 + 1.5 * x), st = [];
    for (let j = 1; j < m.length; j++) st.push(Math.abs(m[j] - m[j - 1]) / m[j - 1] * 100);
    // time from the first frame above 0.05 to the first at 90% of the peak
    const pk = Math.max(...L); let t0 = null, t1 = null, t = 0;
    for (let j = 0; j < L.length; j++) { t += dts[j];
      if (t0 === null && L[j] > 0.05) t0 = t;
      if (t0 !== null && t1 === null && L[j] > 0.9 * pk) t1 = t; }
    console.log((wav + ' ' + name).padEnd(30),
      (Math.max(...st).toFixed(2) + '%').padStart(7), (pct(st, 0.999).toFixed(2) + '%').padStart(8),
      ((t1 - t0) * 1000).toFixed(0).padStart(9) + ' ms');
  }
}
