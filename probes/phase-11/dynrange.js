// Phase 11b, measurement 10: DOES LOUDNESS MOVE THE RING?
//
// The old ring strength came from `level` and never left 0.46..0.73 whatever was
// played - so a gentle tap and a shout drew nearly the same ring, which is the
// deeper half of "the rings come out at different rates". It is the
// instantaneous level now. Five claps a second apart, each 6 dB louder.
const { drive, retryCount } = require('./drive');
(async () => {
  const { rows, errs } = await drive('clap-ramp', 12, '?s=visMode:ripples', 100);
  const live = rows.filter(r => r.mic === 'on' && !r.seeding);
  if (!live.length) return console.log('NO DATA', errs[0] || '');
  const strs = (live[live.length - 1].ringStr || []).map(r => r[0]);
  console.log('claps at -46, -40, -34, -28, -22 dBFS, one second apart\n');
  console.log('  ring strengths : ' + JSON.stringify(strs));
  console.log('  spread         : ' + (strs.length
    ? (Math.max(...strs) - Math.min(...strs)).toFixed(2) : 'n/a') +
    '   (the old code could not exceed 0.27, and in practice gave 0.05)');
  console.log('  ring speeds    : ' + strs.map(v => (0.10 + 0.52 * v).toFixed(2)).join('  ') +
              '  x screen-heights/sec at Wave speed 1.00');
  console.log('\nretries: ' + retryCount());
})();
