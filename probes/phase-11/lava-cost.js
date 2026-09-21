// What the wax follower COSTS: peak swell and the lag to it, per clap.
// A slower radius is only worth having if a clap still visibly grows, and if the
// growth still reads as caused by the clap. Anything past ~0.4 s stops feeling
// like a response to what the student just did.
const fs = require('fs');
function follow(xs, dts, atk, rel) { const o = []; let y = xs[0];
  for (let i = 0; i < xs.length; i++) { const tau = xs[i] > y ? atk : rel;
    y += (xs[i] - y) * (1 - Math.exp(-dts[i] / tau)); o.push(y); } return o; }
// The gain that buys the transient back must SATURATE to unity, or a sustained
// shout ends up 1+1.8+0.4 = 3.2x the rest radius instead of 2.4 and the blobs
// fill the screen. sat() is x*G/(1+(G-1)x): unity slope G at the bottom where
// the follower loses amplitude, exactly 1.0 at the top where it does not.
const sat = (x, G) => G === 1 ? x : x * G / (1 + (G - 1) * x);
const s = JSON.parse(fs.readFileSync('raw/lava-claps.json'));
const dts = s.map(x => Math.min(0.1, x[0])), lv = s.map(x => x[1]);
const nb = s[0][2].length;
const ts = []; { let t = 0; for (const d of dts) { ts.push(t); t += d; } }
// clap times: level crossing 0.3 upward
const hits = []; for (let i = 1; i < lv.length; i++)
  if (lv[i] > 0.3 && lv[i - 1] <= 0.3 && (!hits.length || ts[i] - hits[hits.length - 1] > 0.6)) hits.push(ts[i]);
console.log(hits.length + ' claps detected at', hits.map(x => x.toFixed(1)).join(' ') + ' s\n');
console.log('follower        peak radius vs rest    lag to peak');
for (const [name, atk, rel, gain] of [['now (none)', 0, 0, 1], ['0.25 / 0.8', 0.25, 0.8, 1],
                                ['0.35 / 0.8', 0.35, 0.8, 1], ['0.5 / 1.2', 0.5, 1.2, 1],
                                ['0.35 sat x1.8', 0.35, 0.8, 1.8],
                                ['0.35 sat x2.5', 0.35, 0.8, 2.5],
                                ['0.35 sat x3.5', 0.35, 0.8, 3.5]]) {
  let swell = [], lag = [];
  for (let i = 0; i < nb; i++) {
    const g = i < nb * 0.4 ? 0.6 : 1.0;
    let v = s.map(x => x[2][i]), L = lv;
    if (atk) { v = follow(v, dts, atk, rel); L = follow(lv, dts, atk, rel); }
    const f = v.map((x, j) => 1 + g * (atk ? sat(x, gain) : x) + 0.4 * L[j]);
    for (const h of hits) {
      let base = null, pk = -1, pkt = 0;
      for (let j = 0; j < f.length; j++) {
        if (ts[j] <= h && ts[j] > h - 0.05) base = f[j];
        if (ts[j] > h && ts[j] < h + 1.5 && f[j] > pk) { pk = f[j]; pkt = ts[j] - h; }
      }
      if (base && pk > 0) { swell.push((pk / base - 1) * 100); lag.push(pkt); }
    }
  }
  const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
  console.log(name.padEnd(15), (mean(swell).toFixed(1) + '%').padStart(10), '           ',
    (mean(lag) * 1000).toFixed(0).padStart(4) + ' ms');
}
