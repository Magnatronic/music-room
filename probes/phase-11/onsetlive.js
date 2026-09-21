// Phase 11b, measurement 5: WHY ARE CLAPS DROPPED?
//
// 40 claps 0.5 s apart give 27 rings in a normal room and 40 in a hot one - same
// timing, same visual load, different loudness. The suspicion is that onset() is
// not frame-rate independent in the way PHASE-11 §2.4 claims. The RATE
// arithmetic has no dt in it, but the OBSERVATION does: with dt (16 ms at 60 fps)
// far larger than the 5 ms attack constant, fastLvl snaps to lvlTarget in a
// single frame. So a clap first sampled part-way up its envelope, then at its
// peak, is seen as TWO small jumps instead of one big one - and neither clears
// the bar. Whether it fires depends on where the frames happen to land.
//
// This counts frames as well as onsets. If the drops track the frame rate rather
// than the audio, the fix is to stop sampling the microphone from the render loop.
const { drive, retryCount } = require('./drive');
const step = 100;

(async () => {
  console.log('wav               style     frames  fps   onsets  of claps   gate%');
  for (const [w, secs, claps] of [['claps-keep', 25, 40], ['claps-keep-hot', 25, 40],
                                  ['claps', 14, 7], ['claps-fast', 9, 6]]) {
    // the same audio into a cheap style and an expensive one. Ripples fills the
    // screen with expanding rings and gets slower as it goes; LEDs draws the
    // same number of dots every frame whatever happens.
    for (const style of ['ripples', 'leds']) {
      const { rows, errs } = await drive(w, secs, '?s=visMode:' + style, step);
      const live = rows.filter(r => r.mic === 'on' && !r.seeding);
      if (!live.length) { console.log(w, style, 'NO DATA', errs[0] || ''); continue; }
      const first = live[0], last = live[live.length - 1];
      const dur = (live.length - 1) * step / 1000;
      const frames = last.frameN - first.frameN;
      const onsets = last.onsetN - first.onsetN;
      console.log(w.padEnd(17), style.padEnd(9),
        String(frames).padStart(6), (frames / dur).toFixed(1).padStart(6),
        String(onsets).padStart(7), String(claps).padStart(9),
        (live.filter(r => r.gate).length / live.length * 100).toFixed(0).padStart(7));
    }
  }
  console.log('\nretries: ' + retryCount());
})();
