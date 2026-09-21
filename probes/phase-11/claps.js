// Phase 11b, measurement 4: DOES RIPPLES STOP WHEN A PERSON KEEPS CLAPPING?
//
// 25 claps at 1.5 s gave 25 rings, so the user's "works for a few claps but
// then seems to not recognise" is not THAT pattern. These are the patterns a
// person actually falls into - keeping it up at 2 a second, and speeding up -
// in a normal room and in a room hot enough to clamp the floor.
const { drive, retryCount } = require('./drive');
const step = 100;

(async () => {
  for (const [w, secs] of [['claps-keep', 25], ['claps-keep-hot', 25], ['claps-accel', 28]]) {
    const { rows, errs } = await drive(w, secs, '?s=visMode:ripples', step);
    const live = rows.filter(r => r.mic === 'on' && !r.seeding);
    if (!live.length) { console.log(w, 'NO DATA', errs[0] || ''); continue; }
    let prev = 0; const at = [];
    live.forEach((r, i) => { if (r.rings > prev) at.push(+(i * step / 1000).toFixed(1)); prev = r.rings; });
    const f = live.map(r => r.floorDb);
    console.log('\n' + w + ':');
    console.log('  floor ' + f[0] + ' -> ' + f[f.length - 1] +
                ' dB   range ' + live[0].rangeDb + ' -> ' + live[live.length - 1].rangeDb);
    console.log('  rings: ' + at.length + '  at ' + JSON.stringify(at));
    // the reported shape of the fault: early rings, then none
    const span = at.length ? at[at.length - 1] : 0;
    const half = live.length * step / 2000;
    console.log('  first half of the run: ' + at.filter(v => v < half).length +
                ' rings   second half: ' + at.filter(v => v >= half).length + ' rings');
    console.log('  last ring at ' + span + ' s of a ' + (live.length * step / 1000).toFixed(1) + ' s run');
    // what the level and the fast envelope were doing while it did or did not fire
    const mean = a => +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(2);
    const firstQ = live.slice(0, live.length >> 2), lastQ = live.slice(-(live.length >> 2));
    console.log('  level  first quarter ' + mean(firstQ.map(r => r.level)) +
                '  last quarter ' + mean(lastQ.map(r => r.level)));
    console.log('  fastLvl first quarter ' + mean(firstQ.map(r => r.fast)) +
                '  last quarter ' + mean(lastQ.map(r => r.fast)));
    console.log('  gate open ' + (live.filter(r => r.gate).length / live.length * 100).toFixed(0) + '% of the run');
  }
  console.log('\nretries: ' + retryCount());
})();
