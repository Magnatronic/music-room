// DOES A PARTIAL PERSISTENCE EVER CLEAR, OR DOES IT LEAVE A GHOST?
//
// The kept layer is faded with `destination-out` at a half-life of 2+70p^2
// seconds. That reduces ALPHA multiplicatively, and on an 8-bit canvas a
// multiplicative decay stalls: once alpha is low, a*(1-k) rounds back to a. This
// project has the same arithmetic on record for the frame fade
// (`canvas-fade-never-arrives`), where no value under 0.5 ever reached zero.
//
// So: paint, stop, wait, and count the pixels that are dim but not gone.
const { chromium } = require('playwright-core');
const { readPNG } = require('./png');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const APP = 'file:///C:/Local Docs/Coding/musicapps/midi_light.html';

function dim(img) {          // anything lit at all
  const { w, h, ch, data } = img;
  let n = 0;
  for (let i = 0; i < w * h; i++) {
    const o = i * ch, v = Math.max(data[o], data[o + 1], data[o + 2]);
    if (v >= 12) n++;
  }
  return n / (w * h);
}

(async () => {
  const browser = await chromium.launch({
    executablePath: EDGE, headless: true,
    args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'],
  });
  console.log('Painted for 6 s, then left alone. Faint-but-not-black pixels:');
  console.log('');
  console.log('Keep the picture   lit after 5 s   lit after 25 s   what it should be');
  for (const p of [0, 1]) {
    const page = await browser.newPage({ viewport: { width: 900, height: 600 } });
    await page.goto(APP + '?s=palette:candy,persist:' + p + ',style:aurora&lock=1');
    await page.waitForTimeout(900);
    // DRIVE THE POINTER, not an internal function. The first version of this
    // called MIDIIN.pluck and Anim.onCell and measured 0.000% everywhere -
    // nothing had been painted at all, and the run proved nothing. A drag is
    // what a person does and it goes through the framework's own input path.
    await page.mouse.move(120, 300);
    await page.mouse.down();
    for (let i = 0; i < 45; i++) {
      await page.mouse.move(120 + i * 16, 300 + Math.sin(i / 3) * 120);
      await page.waitForTimeout(30);
    }
    await page.mouse.up();
    await page.waitForTimeout(5000);
    const a = dim(readPNG(await page.screenshot({ type: 'png' })));
    await page.waitForTimeout(20000);
    const b = dim(readPNG(await page.screenshot({ type: 'png' })));
    await page.close();
    const want = p ? 'kept' : 'gone';
    const got  = (b > 0.002) ? 'kept' : 'gone';
    console.log((p ? 'ON ' : 'OFF').padEnd(18), (a*100).toFixed(3)+'%',
      (b*100).toFixed(3).padStart(13)+'%', '     ' + want + '  -> ' + (got===want?'ok':'WRONG'));
  }
  await browser.close();
})();
