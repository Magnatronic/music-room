// Phase 11b, measurement 9: DOES THE RING GATE EARN ITS SLIDER?
//
// The user asks whether "Rings no closer together than" has any benefit, or
// whether it should just be pinned as low as it goes permanently.
//
// The case FOR it, from round 2: "a student whose sounds run into one another".
// The case AGAINST: onset() already has its own 0.12 s refractory and requires a
// TRANSIENT, and Fireworks - which has no second gate at all - was measured
// giving ONE explosion for a steady four-second tone. If onset() alone already
// keeps a continuous sound calm, the second gate is only capable of throwing
// away sounds a student deliberately made, which is what it just did.
//
// So: drive the sounds that would actually stress it - a raspberry chopped at
// 14 Hz, a babble with a syllable every 250 ms, and a sustained hum - with the
// gate at its default and effectively OFF, and count the rings.
const { drive, retryCount } = require('./drive');

const setRate = r => async page => {
  await page.evaluate(v => {
    if (!SETTINGS.tw) SETTINGS.tw = {};
    if (!SETTINGS.tw.ripples) SETTINGS.tw.ripples = {};
    SETTINGS.tw.ripples.rate = v; saveSettings();
  }, r);
};

(async () => {
  console.log('rings per second of sound, at three gate settings\n');
  console.log('signal    what it is                     gate 1.33s  gate 0.20s  gate 0.07s');
  const cases = [
    ['rattly', 'raspberry, a burst every 71 ms', 18],
    ['babble', 'a syllable every 250 ms', 14],
    ['hum-8', 'one sustained 200 Hz note', 16],
    ['realclap-0p6', 'deliberate claps, 0.6 s apart', 16],
  ];
  for (const [wav, what, secs] of cases) {
    const out = [];
    for (const rate of [0.15, 1, 3]) {
      const { rows, errs } = await drive(wav, secs, '?s=visMode:ripples', 100, setRate(rate));
      const live = rows.filter(r => r.mic === 'on' && !r.seeding);
      if (!live.length) { out.push('  NO DATA'); continue; }
      const a = live[0], b = live[live.length - 1];
      const dur = (live.length - 1) * 100 / 1000;
      out.push(((b.ringN - a.ringN) / dur).toFixed(2).padStart(11));
    }
    console.log(wav.padEnd(9), what.padEnd(31), out.join(''));
  }
  console.log('\nA sustained hum near 0.00 means onset() alone already keeps it calm,');
  console.log('and the second gate has nothing left to protect against.');
  console.log('retries: ' + retryCount());
})();
