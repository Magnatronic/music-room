// The onset fix, proved without a microphone.
//
// The browser probe for this needs a working fake-audio device, and on this
// machine that device stopped opening reliably part-way through UAT round 1
// (measured: three consecutive launches gave 4.2 s, never, never). But the fault
// and the fix are both pure arithmetic on the level envelope, so they can be
// driven directly - and this replicates analyse() and onset() line for line,
// old and new, over the same input.
//
// This does NOT replace driving the page. It proves the mechanism; the page
// proves the wiring.

const OLD = { K: 10, hold: 0.30 };          // commit 3ff2f36
const NEW = { K: 100, hold: 0.12 };         // this branch

// analyse() + onset(), old: the transient is read off the DISPLAY envelope,
// which releases over 350 ms.
function runOld(targets, fps) {
  const dt = 1 / fps;
  let level = 0, t = 0, last = -9, hits = [];
  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];
    const tau = target > level ? 0.05 : 0.35;
    const rate = (target - level) / tau;
    level += (target - level) * (1 - Math.exp(-dt / tau));
    t += dt;
    if (rate > OLD.K && target > 0.16 && t - last > OLD.hold) { last = t; hits.push(t); }
  }
  return hits;
}
// ...new: a second envelope, 5 ms attack / 80 ms release, for transients only.
function runNew(targets, fps) {
  const dt = 1 / fps;
  let level = 0, fast = 0, t = 0, last = -9, hits = [];
  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];
    const tau = target > level ? 0.05 : 0.35;
    level += (target - level) * (1 - Math.exp(-dt / tau));
    const ftau = target > fast ? 0.005 : 0.08;
    const rate = (target - fast) / ftau;
    fast += (target - fast) * (1 - Math.exp(-dt / ftau));
    t += dt;
    if (rate > NEW.K && target > 0.16 && t - last > NEW.hold) { last = t; hits.push(t); }
  }
  return hits;
}

// n claps, `gap` seconds apart, each a 60 ms burst at `amp`
function claps(n, gap, amp, fps, tail) {
  const dt = 1 / fps, out = [];
  for (let i = 0; i < n; i++)
    for (let s = 0; s < gap; s += dt) out.push(s < 0.06 ? amp : 0);
  for (let s = 0; s < (tail || 1); s += dt) out.push(0);
  return out;
}

const fail = [];
const say = (ok, msg) => { console.log((ok ? '  PASS  ' : '  FAIL  ') + msg); if (!ok) fail.push(msg); };

console.log('=== six claps at 0.25 s, level 0.9, at 60 fps ===');
{ const seq = claps(6, 0.25, 0.9, 60);
  const o = runOld(seq, 60), n = runNew(seq, 60);
  console.log(`         old fired ${o.length}: [${o.map(x => x.toFixed(2)).join(' ')}]`);
  console.log(`         new fired ${n.length}: [${n.map(x => x.toFixed(2)).join(' ')}]`);
  say(o.length < 6, `the old code misses them — ${o.length} of 6 (this is the user's report)`);
  say(n.length === 6, `the new code catches all six — ${n.length} of 6`); }

console.log('\n=== two claps, swept from 0.15 s to 1.0 s apart ===');
{ let oldWorst = null, newWorst = null;
  for (const gap of [0.15, 0.2, 0.25, 0.3, 0.4, 0.5, 0.7, 1.0]) {
    const seq = claps(2, gap, 0.9, 60);
    const o = runOld(seq, 60).length, n = runNew(seq, 60).length;
    if (o < 2 && oldWorst === null) oldWorst = gap;
    if (n < 2) newWorst = gap;
    console.log(`         ${gap.toFixed(2)} s apart: old ${o}/2, new ${n}/2`);
  }
  say(oldWorst !== null, `the old code loses the second clap from ${oldWorst} s down`);
  say(newWorst === null, `the new code keeps both at every gap tested`); }

console.log('\n=== and a single clap must still need the same loudness ===');
{ // the calibration that must not move: level 0.50 at every frame rate
  for (const fps of [24, 30, 60, 120, 165]) {
    let lo = null;
    for (let a = 0.02; a <= 1.001; a += 0.01) {
      if (runNew(claps(1, 0.5, a, fps), fps).length) { lo = a; break; }
    }
    say(lo !== null && Math.abs(lo - 0.50) < 0.03,
      `${String(fps).padStart(3)} fps: quietest single clap that fires = ${lo === null ? 'never' : lo.toFixed(2)}`);
  } }

console.log('\n=== a held sound is not a transient ===');
{ const dt = 1 / 60, seq = [];
  for (let s = 0; s < 4; s += dt) seq.push(0.9);
  const n = runNew(seq, 60);
  say(n.length === 1, `four seconds of steady 0.9 gives ${n.length} onset`); }

console.log(fail.length ? `\n${fail.length} FAILED` : '\nall passed');
process.exit(fail.length ? 1 : 0);
