// Round two. The first run measured lit AREA from one tap at 20% and 80% height
// and reported midi_chords at 0.58x - the top tap SMALLER, the opposite of the
// report. That was the metric, not the app: a mark near the top of the screen has
// less screen left to grow into, so the edge clips it, and one screenshot 450 ms
// in catches a moving thing at an arbitrary moment.
//
// So: both taps well INSIDE the screen (35% and 65%), brightness INTEGRATED over
// the whole life of the mark rather than sampled once, and three taps averaged
// because half these styles place sparks at random.
const { chromium } = require('playwright-core');
const { readPNG } = require('./png');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const DIR = 'file:///C:/Local Docs/Coding/musicapps/';
const APPS = ['midi_chords.html','midi_creatures.html','midi_loop.html','midi_mirror.html','midi_light.html'];

function bright(img) {
  const { w, h, ch, data } = img;
  let sum = 0;
  for (let i = 0; i < w * h; i++) {
    const o = i * ch, v = Math.max(data[o], data[o+1], data[o+2]);
    if (v >= 24) sum += v;
  }
  return sum / (w * h);
}

(async () => {
  const b = await chromium.launch({ executablePath: EDGE, headless: true,
    args: ['--autoplay-policy=no-user-gesture-required','--mute-audio'] });
  const W = 1000, H = 700, REPS = 3;
  console.log('one tap at 35% and at 65% of the height, both clear of the edges.');
  console.log('Brightness integrated over 1.6 s of the mark, ' + REPS + ' taps averaged.');
  console.log('');
  console.log('app                  lower tap   upper tap    upper/lower');
  for (const app of APPS) {
    const acc = { lower: 0, upper: 0 };
    for (let r = 0; r < REPS; r++) {
      for (const [name, y] of [['lower', H*0.65], ['upper', H*0.35]]) {
        const page = await b.newPage({ viewport: { width: W, height: H } });
        await page.goto(DIR + app + '?lock=1');
        await page.waitForTimeout(900);
        await page.mouse.move(W*0.5, y);
        await page.mouse.down(); await page.waitForTimeout(120); await page.mouse.up();
        let total = 0;
        for (let k = 0; k < 8; k++) {          // integrate, do not sample
          await page.waitForTimeout(200);
          total += bright(readPNG(await page.screenshot({ type: 'png' })));
        }
        acc[name] += total / REPS;
        await page.close();
      }
    }
    const ratio = acc.lower ? acc.upper / acc.lower : 0;
    console.log(app.padEnd(20)
      + acc.lower.toFixed(2).padStart(10)
      + acc.upper.toFixed(2).padStart(12)
      + ratio.toFixed(2).padStart(14) + 'x'
      + (Math.abs(ratio - 1) > 0.15 ? '   <-- height changes it' : ''));
  }
  console.log('');
  console.log('1.00x means a tap does the same thing wherever it lands.');
  await b.close();
})();
