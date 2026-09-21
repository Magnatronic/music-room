// Phase 11b, measurement 3: THE STRAIGHT LINE ACROSS WAVES.
//
// The user's screenshot shows the trace flattened along a horizontal line about
// a fifth of the way down the screen. drawWaves() ends every sample with
//
//     Math.max(-1, Math.min(1, buf[i] * mul)) * amp
//
// which is a HARD CLAMP, so the line pins at cy +/- amp - and amp is H*0.30, i.e.
// exactly 0.20H from the top. That much is certain from reading. The question
// this answers is WHEN it starts: the clamp would be harmless if it only bit at
// the very top of the range.
//
//     mul = min(200, 1 / max(0.005, 10^(ceilDb/20)))
//
// `ceilDb` is an RMS ceiling in dBFS, but `buf[i]` is an instantaneous sample.
// A waveform's peak is its RMS times its crest factor, and for anything voice-
// shaped that is 3-5x. So the trace clips at a level far below the one that
// pins `level`, which is the opposite of what the comment above it claims:
// "the trace fills its height at the same loudness that pins `level`".
const CEIL_MAX = -6;
const crest = { 'sine': Math.SQRT2, 'voice (20 harmonics)': 3.4, 'clap/plosive': 6.0 };

function mulFor(floorDb, rangeDb) {
  const ceilDb = Math.min(floorDb + rangeDb, CEIL_MAX);
  return { ceilDb, mul: Math.min(200, 1 / Math.max(0.005, Math.pow(10, ceilDb / 20))) };
}
console.log('At what fraction of full loudness does the trace go flat?\n');
console.log('room floor   range   ceil    mul     level at which the line clips');
console.log('                                     sine    voice   clap');
for (const floorDb of [-53, -45, -37, -29, -23]) {
  for (const rangeDb of [28]) {
    const { ceilDb, mul } = mulFor(floorDb, rangeDb);
    const out = [];
    for (const k in crest) {
      // the sample reaches 1/mul when RMS amplitude = 1/(mul*crest);
      // convert that RMS back to dB and place it in the floor..ceil range
      const rmsAtClip = 1 / (mul * crest[k]);
      const dbAtClip = 20 * Math.log10(rmsAtClip);
      const u = (dbAtClip - floorDb) / (ceilDb - floorDb);
      // levelFromDb applies u^0.6
      const lvl = u <= 0 ? 0 : Math.pow(Math.min(1, u), 0.6);
      out.push((u > 1 ? 'never' : lvl.toFixed(2)).padStart(7));
    }
    console.log(String(floorDb).padStart(9), String(rangeDb).padStart(7),
      String(ceilDb).padStart(6), mul.toFixed(1).padStart(7), out.join(''));
  }
}
console.log('\nA value under 1.00 means the line is already flat-topped before the');
console.log('student is anywhere near filling the screen. The flat line in the');
console.log('screenshot sits at 0.20H from the top, which is cy - H*0.30 exactly.');
