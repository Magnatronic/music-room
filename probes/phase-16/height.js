// DOES A TAP AT THE TOP GIVE MORE THAN THE SAME TAP AT THE BOTTOM?
//
// The user, on the projector: "on midi chords clicking on the screen at the top
// gives a bigger effect at the top than the bottom. I thought we had fixed this
// or is this how it is intended... or maybe it was midi light?"
//
// Measure the PIXELS, not the force: one tap at 80% height and one at 20%, same
// x, same page, fresh page each time so nothing is left over from the other tap.
// Lit area and total brightness, because a mark can grow without brightening.
const { chromium } = require('playwright-core');
const { readPNG } = require('./png');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const DIR = 'file:///C:/Local Docs/Coding/musicapps/';
const APPS = ['midi_chords.html','midi_creatures.html','midi_loop.html','midi_mirror.html','midi_light.html'];

function stats(img) {
  const { w, h, ch, data } = img;
  let lit = 0, sum = 0;
  for (let i = 0; i < w * h; i++) {
    const o = i * ch, v = Math.max(data[o], data[o+1], data[o+2]);
    if (v >= 24) { lit++; sum += v; }
  }
  return { lit: lit / (w*h), bright: sum / (w*h) };
}

(async () => {
  const b = await chromium.launch({ executablePath: EDGE, headless: true,
    args: ['--autoplay-policy=no-user-gesture-required','--mute-audio'] });
  const W = 1000, H = 700;
  console.log('one tap, same x, at 20% and 80% of the screen height');
  console.log('');
  console.log('app                 lit low    lit high   top/bottom   brightness ratio');
  for (const app of APPS) {
    const out = {};
    for (const [name, y] of [['low', H*0.8], ['high', H*0.2]]) {
      const page = await b.newPage({ viewport: { width: W, height: H } });
      await page.goto(DIR + app + '?lock=1');
      await page.waitForTimeout(900);
      await page.mouse.move(W*0.5, y);
      await page.mouse.down();
      await page.waitForTimeout(120);
      await page.mouse.up();
      await page.waitForTimeout(450);            // read it at its peak, not after
      out[name] = stats(readPNG(await page.screenshot({ type: 'png' })));
      await page.close();
    }
    const rl = out.low.lit ? out.high.lit / out.low.lit : 0;
    const rb = out.low.bright ? out.high.bright / out.low.bright : 0;
    console.log(app.padEnd(20)
      + (out.low.lit*100).toFixed(3).padStart(7) + '%'
      + (out.high.lit*100).toFixed(3).padStart(11) + '%'
      + rl.toFixed(2).padStart(11) + 'x'
      + rb.toFixed(2).padStart(15) + 'x');
  }
  console.log('');
  console.log('1.00x means a tap does the same thing wherever it lands.');
  await b.close();
})();
