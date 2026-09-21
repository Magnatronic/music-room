// Phase 11b, measurement 7: THE RING, NOT THE ONSET.
//
// The user: "on Ripples it always seems to miss out the ring every second clap,
// but the centre pulses." That last clause is the measurement I failed to take.
// `onsetlive.js` counted transients DETECTED and reported 40 of 40, and I read
// that as the app being fine - but drawRipples gates the ring a SECOND time:
//
//     if(onset() && rippleTimer<=0){ rippleRing(...); rippleTimer=0.2/tw('rate'); }
//
// so a detected transient can be thrown away without a ring ever being drawn.
// The centre glow is drawn straight off `level` and passes NEITHER gate, which
// is exactly why it pulses on every clap while the ring does not. Counting
// onsets could never have seen this; counting rings can.
//
// Two candidates, and this measures both:
//
//   A. the clap itself. `clapReverb` in mkwav.js gives 12 ms of full-amplitude
//      noise before its decay - a plateau, not a clap. rawDbfs() takes the RMS
//      of the most recent 2048 samples (43 ms at 48 kHz), so a 12 ms plateau is
//      caught cleanly by any frame while a real 1.5 ms crack may not be.
//   B. the `Wave rate` slider. rippleTimer = 0.2 / tw('rate') and the slider
//      runs 0.15 to 3, so its slow end is 1.33 s between rings. A student
//      clapping every 0.6 s would then get a ring every OTHER clap - the report,
//      exactly. That value lives in SETTINGS.tw, persists in localStorage and
//      rides in presets, so it can be left behind from an earlier session; round
//      2 widened this slider's slow end deliberately and said so in the checklist.
const { drive, retryCount } = require('./drive');
const step = 100;

function counts(rows, gap, cap) {
  const live = rows.filter(r => r.mic === 'on' && !r.seeding);
  if (!live.length) return null;
  const a = live[0], b = live[live.length - 1];
  const dur = (live.length - 1) * step / 1000;
  return {
    claps: Math.min(cap, Math.floor(dur / gap)),
    onsets: b.onsetN - a.onsetN,
    rings: b.ringN - a.ringN,
    fps: (b.frameN - a.frameN) / dur,
  };
}

async function sweep(prefix, gaps, label) {
  console.log('\n' + label);
  console.log('  gap    claps   onsets   RINGS   rings/clap   fps');
  for (const gap of gaps) {
    const wav = prefix + String(gap).replace('.', 'p');
    const { rows, errs } = await drive(wav, Math.min(40, 2.5 + 24 * gap),
      '?s=visMode:ripples', step);
    const c = counts(rows, gap, 24);
    if (!c) { console.log(' ', gap, 'NO DATA', errs[0] || ''); continue; }
    console.log(' ', String(gap).padEnd(6), String(c.claps).padStart(5),
      String(c.onsets).padStart(8), String(c.rings).padStart(7),
      (c.rings / Math.max(1, c.claps)).toFixed(2).padStart(12),
      c.fps.toFixed(0).padStart(6), errs.length ? '  ERR ' + errs[0] : '');
  }
}

(async () => {
  console.log('rings/clap near 1.00 = a ring for every clap. Near 0.50 = the report.');
  console.log('onsets far above RINGS = the ring gate is eating them.');
  console.log('onsets near RINGS and both low = the detector is missing claps.');

  await sweep('clapgap-', [0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.2],
    'A. the 12 ms plateau "clap", default Wave rate  (already measured 1.00 throughout)');

  await sweep('realclap-', [0.4, 0.5, 0.55, 0.6, 0.66, 0.7, 0.8],
    'B. a REAL 1.5 ms clap, default Wave rate. Spacings deliberately not\n   commensurate with a 60 Hz frame clock, so clap-to-frame phase walks.');

  console.log('\nC. the Wave rate slider, at 0.6 s - a spacing a person actually claps at');
  console.log('  rate   gate(s)  claps   onsets   RINGS   rings/clap');
  for (const rate of [1, 0.6, 0.4, 0.3, 0.2, 0.15]) {
    // the tweak sliders are NOT launch-link keys - they live in SETTINGS.tw and
    // persist in localStorage. Set it the way the slider does, before the mic.
    const { rows, errs } = await drive('realclap-0p6', 17, '?s=visMode:ripples', step,
      async page => {
        await page.evaluate(r => {
          if (!SETTINGS.tw) SETTINGS.tw = {};
          if (!SETTINGS.tw.ripples) SETTINGS.tw.ripples = {};
          SETTINGS.tw.ripples.rate = r;
          saveSettings();
        }, rate);
      });
    const c = counts(rows, 0.6, 24);
    if (!c) { console.log(' ', rate, 'NO DATA', errs[0] || ''); continue; }
    console.log(' ', String(rate).padEnd(6), (0.2 / rate).toFixed(2).padStart(7),
      String(c.claps).padStart(6), String(c.onsets).padStart(8),
      String(c.rings).padStart(7),
      (c.rings / Math.max(1, c.claps)).toFixed(2).padStart(12));
  }

  console.log('\nretries: ' + retryCount());
})();
