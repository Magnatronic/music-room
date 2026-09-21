// Phase 11b, measurement 1: DOES THE ROOM FLOOR DRIFT?
//
// Two reports from UAT round 3, and the hypothesis that they are one fault:
//   "listening to the room says the room is noisy but it isn't"
//   "ripples works well for a few claps but then seems to not recognise"
//
// trackFloor() lets micFloorDb climb 1 dB/s toward the minimum of the last three
// seconds, whenever the gate has been shut for a second. If a live room never
// leaves a whole second at its true floor, that minimum sits above the floor and
// the floor climbs after it - raising the gate, shrinking `level`, and shrinking
// availDb() until the noisy-room warning appears.
//
// This measures the floor, the range and the ring count over 40 s, in five
// static rooms and two clap trains. It asserts NOTHING about the fix; it is
// here to say whether the hypothesis is true before any code changes.
const { drive, retryCount } = require('./drive');

const secs = 42, step = 200;

// summarise one run: where the floor started, where it ended, how far it moved
function summarise(rows) {
  const live = rows.filter(r => r.mic === 'on' && !r.seeding);
  if (!live.length) return null;
  const f = live.map(r => r.floorDb), rg = live.map(r => r.rangeDb);
  const first = f.slice(0, 5), last = f.slice(-5);
  const avg = a => a.reduce((x, y) => x + y, 0) / a.length;
  return {
    n: live.length,
    f0: +avg(first).toFixed(1), f1: +avg(last).toFixed(1),
    drift: +(avg(last) - avg(first)).toFixed(1),
    fmin: +Math.min(...f).toFixed(1), fmax: +Math.max(...f).toFixed(1),
    rg0: +avg(rg.slice(0, 5)).toFixed(1), rg1: +avg(rg.slice(-5)).toFixed(1),
    noisyFrac: +(rg.filter(v => v < 15).length / rg.length).toFixed(2),
    lvlMax: +Math.max(...live.map(r => r.level)).toFixed(2),
    lvlMean: +(live.reduce((a,r)=>a+r.level,0)/live.length).toFixed(2),
    gateFrac: +(live.filter(r=>r.gate).length/live.length).toFixed(2),
  };
}

// ring arrivals: `rings` is the live array length, so a rise means a new ring
function ringArrivals(rows) {
  let prev = 0, out = [];
  rows.forEach((r, i) => {
    if (r.rings > prev) out.push(+(i * step / 1000).toFixed(1));
    prev = r.rings;
  });
  return out;
}

(async () => {
  console.log('=== A. static rooms: does a room that never changes drift? ===');
  console.log('wav        floor@start  floor@end  drift  range@start  range@end  %noisy  %gate  lvlAvg');
  for (const w of ['quiet-45', 'room-50', 'room-42', 'room-34', 'room-28', 'room-24', 'room-20', 'room-16']) {
    const { rows, errs } = await drive(w, secs, '?s=visMode:ripples', step);
    const s = summarise(rows);
    if (!s) { console.log(w.padEnd(11), 'NO DATA', errs[0] || ''); continue; }
    console.log(w.padEnd(11),
      String(s.f0).padStart(8), String(s.f1).padStart(10), String(s.drift).padStart(7),
      String(s.rg0).padStart(11), String(s.rg1).padStart(10), String(s.noisyFrac).padStart(8),
      String(s.gateFrac).padStart(7), String(s.lvlMean).padStart(7));
  }

  console.log('\n=== B. clap trains: 25 claps 1.5 s apart, 40 s of run ===');
  for (const w of ['claps-norm', 'claps-hot']) {
    const { rows, errs } = await drive(w, secs, '?s=visMode:ripples', step);
    const s = summarise(rows);
    if (!s) { console.log(w, 'NO DATA', errs[0] || ''); continue; }
    const arr = ringArrivals(rows);
    console.log('\n' + w + ':');
    console.log('  floor ' + s.f0 + ' -> ' + s.f1 + ' dB (drift ' + s.drift +
                ', min ' + s.fmin + ', max ' + s.fmax + ')');
    console.log('  range ' + s.rg0 + ' -> ' + s.rg1 + ' dB, noisy for ' +
                (s.noisyFrac * 100).toFixed(0) + '% of the run');
    console.log('  peak level ' + s.lvlMax);
    console.log('  rings: ' + arr.length + ' -> ' + JSON.stringify(arr));
    // the report is "works for a few claps then stops": is the LAST third empty?
    const late = arr.filter(v => v > 28).length, early = arr.filter(v => v <= 14).length;
    console.log('  first 14 s: ' + early + ' rings   last 14 s: ' + late + ' rings');
    // the floor over time, every 4 s, so a climb is visible rather than inferred
    const live = rows.filter(r => r.mic === 'on' && !r.seeding);
    const track = [];
    for (let i = 0; i < live.length; i += Math.round(4000 / step))
      track.push(live[i].floorDb);
    console.log('  floor every 4 s: ' + track.join('  '));
  }

  console.log('\nretries needed to open the fake microphone: ' + retryCount());
})();
