// UAT round 1 fixes. Each assertion here must fail on commit 3ff2f36.
// The launch is retried when the fake microphone never opens - see drive.js.
const { drive, retryCount } = require('./drive.js');
const run = (wav, secs, params, stepMs) => drive(wav, secs, params, stepMs);
const max = (rows, k) => rows.length ? rows.reduce((a, r) => Math.max(a, r[k]||0), 0) : -1;

(async () => {
  const fail = [];
  const say = (ok, msg) => { console.log((ok ? '  PASS  ' : '  FAIL  ') + msg); if (!ok) fail.push(msg); };

  // "the listening to the room hangs for quite a while before picking up sounds"
  //
  // Measure the SEED, not the whole start. getUserMedia in this harness resolved
  // once at 4.2 s and twice not at all inside six seconds, and that latency is
  // the device opening, which the app does not control — timing the two together
  // measures the machine, not the change. What the app owns is the seed, which
  // used to throw away a whole second and retry up to five times.
  console.log('=== the seed itself must not stall ===');
  { const r = await run('tone-220', 12, null, 50);
    const tSeed=r.tSeed, tOn=r.tOn;
    if (r.tSeed === null) say(false, "getUserMedia never resolved — the harness, not the app");
    else {
      say(tOn !== null && tOn - tSeed < 1800,
        `the seed took ${tOn - tSeed} ms once audio arrived (device open took ${tSeed} ms and is not ours)`);
      say(max(r.rows, 'level') > 0.5, `and it heard the tone after that (peak level ${max(r.rows, 'level')})`);
    } }

  // "2 claps pretty close together, the second is not picked up"
  // "repeated loud sounds dont trigger firework explosions"
  // Both are the same fault: the transient was measured off the 350 ms release
  // envelope, so a sound arriving during it had only a small gap left to jump.
  console.log('\n=== two claps close together must both register ===');
  { // sample fast — a burst is over in well under 100 ms
    const r = await run('claps-fast', 14, '?s=visMode:ripples', 40);
    let fired = 0, prev = 0;
    for (const d of r.rows) { if (d.rings > prev) fired += d.rings - prev; prev = d.rings; }
    say(!r.errs.length, `no errors${r.errs.length ? ': ' + r.errs[0] : ''}`);
    say(fired >= 6, `rings from six claps at 0.25 s spacing: ${fired}`); }

  console.log('\n=== ...and the same claps must burst in Fireworks ===');
  { const r = await run('claps-fast', 14, '?s=visMode:fountain', 40);
    // a burst adds >= 24 particles at once; count the jumps
    let bursts = 0, prev = 0;
    for (const d of r.rows) { if (d.parts - prev >= 20) bursts++; prev = d.parts; }
    say(bursts >= 4, `explosions from six rapid claps: ${bursts}`); }

  console.log('\n=== Starfield must move while a sound is held ===');
  { const r = await run('tone-220', 13, '?s=visMode:stars');
    say(max(r.rows, 'sparks') > 20, `rising sparks under a held note: peak ${max(r.rows, 'sparks')}`);
    const rr = await run('claps-fast', 14, '?s=visMode:stars', 40);
    say(max(rr.rows, 'memStars') >= 3, `stars left behind by the bursts: ${max(rr.rows, 'memStars')}`);
    say(max(rr.rows, 'shoots') > 3, `shooting stars at once: ${max(rr.rows, 'shoots')} (the cap was 3)`); }

  console.log('\n=== a held sound must NOT machine-gun bursts ===');
  { const r = await run('tone-220', 13, '?s=visMode:fountain', 100);
    let bursts = 0, prev = 0;
    for (const d of r.rows) { if (d.parts - prev >= 20) bursts++; prev = d.parts; }
    say(bursts <= 2, `a steady 4 s tone gives ${bursts} explosion(s) — it is a transient, not a level`); }

  console.log(fail.length ? `\n${fail.length} FAILED` : '\nall passed');
  process.exit(fail.length ? 1 : 0);
})();
