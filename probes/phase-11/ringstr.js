// Phase 11b, measurement 8: IS THE FIRST RING SLOWER THAN THE REST?
//
// The user: "sometimes the rings come out at different [speeds]. The first ring
// comes out at a slower rate than others."
//
// rippleRing() takes its strength from `level`:
//
//     rippleRing(cx, cy, Math.min(1, level*1.6), col)
//     v: (0.22 + 0.55*str) * H * tw('speed')
//
// but `level` is the DISPLAY envelope - 50 ms attack, 350 ms release - while the
// onset that fires the ring is detected off the instantaneous level. At 60 fps a
// 50 ms attack has caught only 28% of its target in the first frame, so the ring
// is sized from a number that has not arrived yet. And on a second clap `level`
// starts from the previous clap's 350 ms tail rather than from zero, so it is
// already part-way up. Prediction: first ring weak, the rest stronger.
const { drive, retryCount } = require('./drive');

(async () => {
  console.log('ring strengths in order, 24 claps 0.6 s apart (1.00 = full)\n');
  for (const wav of ['realclap-0p6', 'realclap-0p8', 'clapgap-1p2']) {
    const gap = wav.endsWith('0p6') ? 0.6 : wav.endsWith('0p8') ? 0.8 : 1.2;
    const { rows, errs } = await drive(wav, Math.min(38, 2.5 + 24 * gap),
      '?s=visMode:ripples', 100);
    const live = rows.filter(r => r.mic === 'on' && !r.seeding);
    if (!live.length) { console.log(wav, 'NO DATA', errs[0] || ''); continue; }
    const strs = live[live.length - 1].ringStr || [];
    if (!strs.length) { console.log(wav, 'no rings'); continue; }
    const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
    const str = strs.map(r => r[0]), lev = strs.map(r => r[1]), tgt = strs.map(r => r[2]);
    console.log(wav + '  (' + gap + ' s apart)');
    console.log('  strength : first ' + str[0].toFixed(2) + '   rest mean ' +
                mean(str.slice(1)).toFixed(2));
    console.log('  `level`  : first ' + lev[0].toFixed(2) + '   rest mean ' +
                mean(lev.slice(1)).toFixed(2) + '   <- what the ring is sized from');
    console.log('  lvlTarget: first ' + tgt[0].toFixed(2) + '   rest mean ' +
                mean(tgt.slice(1)).toFixed(2) + '   min ' +
                Math.min(...tgt).toFixed(2) + ' max ' + Math.max(...tgt).toFixed(2) +
                '   <- the instantaneous level onset() actually tests');
  }
  console.log('\nretries: ' + retryCount());
})();
