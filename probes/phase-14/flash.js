// IS THE SCREEN FLASH A PHOTOSENSITIVITY RISK?
//
// The user: "the screen flashing when the note is played could be triggering as
// well." This project has been here before — PHASE-9D capped MIDI Weather's
// lightning at one strike per 1.1 s, recorded as "a safety property, not a
// look".
//
// The test that matters is the general flash threshold: a flash is a change of
// at least 10% in RELATIVE LUMINANCE over a large area of the screen, and more
// than THREE of them per second is a risk. So two numbers are needed — how big
// the luminance change is, and how many per second the app can produce.
const { chromium } = require('playwright-core');
const { readPNG } = require('./png');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const APP = 'file:///C:/Local Docs/Coding/musicapps/big_switch.html';

// WCAG relative luminance, averaged over the whole frame
function lum(img) {
  const { w, h, ch, data } = img;
  let sum = 0;
  const lin = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  for (let i = 0; i < w * h; i++) {
    const o = i * ch;
    sum += 0.2126 * lin(data[o]) + 0.7152 * lin(data[o + 1]) + 0.0722 * lin(data[o + 2]);
  }
  return sum / (w * h);
}

(async () => {
  const browser = await chromium.launch({
    executablePath: EDGE, headless: true,
    args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'],
  });

  console.log('1. How big is one flash? (relative luminance of the whole frame)');
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto(APP + '?s=song:climb,granularity:note&lock=1');
    await page.waitForTimeout(700);
    const rest = lum(readPNG(await page.screenshot({ type: 'png' })));
    await page.evaluate(() => Anim.onCell(0, 0));
    const peak = lum(readPNG(await page.screenshot({ type: 'png' })));
    await page.close();
    const delta = peak - rest;
    console.log('   at rest ' + rest.toFixed(4) + '   at the flash ' + peak.toFixed(4) +
      '   change ' + (delta * 100).toFixed(2) + ' points of luminance');
    console.log('   ' + (delta >= 0.10 ? 'THIS COUNTS AS A FLASH (>= 0.10)' : 'below the flash threshold'));
  }

  console.log('');
  console.log('2. How many per second can the app produce?');
  for (const [label, setup, drive] of [
    ['pressing as fast as it allows', ',granularity:note', 'press'],
    ['one press, a whole phrase', ',granularity:phrase', 'once'],
    ['one press, the whole tune', ',granularity:whole', 'once'],
    ['the finishing flourish', ',granularity:note', 'finish'],
  ]) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto(APP + '?s=song:climb' + setup + '&lock=1');
    await page.waitForTimeout(600);
    // Count WASHES, not notes. The fix deliberately decouples them: every note
    // still sounds, only the screen-sized flash is rate-limited, so counting
    // pluckNote would now measure the wrong thing entirely.
    await page.evaluate(() => {
      window.__f = []; window.__n = [];
      const orig = window.pluckNote;
      window.pluckNote = function () { window.__n.push(performance.now()); return orig.apply(this, arguments); };
      let seen = 0;
      setInterval(() => {
        const a = (typeof Anim._washA === 'function') ? Anim._washA() : null;
        if (a === null) return;
        if (a > seen + 0.2) window.__f.push(performance.now());
        seen = a;
      }, 16);
    });
    if (drive === 'press') {
      for (let i = 0; i < 14; i++) { await page.evaluate(() => Anim.onCell(0, 0)); await page.waitForTimeout(185); }
    } else if (drive === 'once') {
      await page.evaluate(() => Anim.onCell(0, 0));
      await page.waitForTimeout(12000);
    } else {
      for (let i = 0; i < 16; i++) { await page.evaluate(() => Anim.onCell(0, 0)); await page.waitForTimeout(200); }
      await page.evaluate(() => { window.__f = []; });      // the flourish only
      await page.waitForTimeout(4000);
    }
    const t = await page.evaluate(() => window.__f);
    const notes = await page.evaluate(() => window.__n.length);
    await page.close();
    let worst = 0;
    for (let i = 0; i < t.length; i++) {            // most notes inside any 1 s window
      let n = 0;
      for (let j = i; j < t.length && t[j] - t[i] < 1000; j++) n++;
      worst = Math.max(worst, n);
    }
    console.log('   ' + label.padEnd(30) + String(worst).padStart(3) + ' flashes/s  ' +
      (worst > 3 ? 'OVER THE LIMIT' : 'ok') + '   (' + notes + ' notes still played)');
  }
  await browser.close();
})();
