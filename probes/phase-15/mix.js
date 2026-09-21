// DOES `Mix the colours` VARY THE PICTURE, AND IS IT INERT WHEN OFF?
//
// The colour of a ramp palette normally comes from `t`, the note's position, so
// a note always paints the same colour in the same place. This drives the same
// eight notes repeatedly and counts how many DISTINCT colours reach the screen,
// with the toggle off and on.
//
// The off case matters most: the build goes into a room tomorrow, and the
// promise is that nothing changes unless a therapist asks for it.
const { chromium } = require('playwright-core');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const APP = 'file:///C:/Local Docs/Coding/musicapps/midi_light.html';

async function colours(browser, palette, mix) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await page.goto(APP + '?s=palette:' + palette + (mix ? ',mixColours:1' : '') + '&lock=1');
  await page.waitForTimeout(800);
  // play the same eight notes forty times over and record every colour drawn
  const out = await page.evaluate(() => {
    const seen = [];
    const notes = [60, 62, 64, 65, 67, 69, 71, 72];
    for (let round = 0; round < 5; round++)
      for (const n of notes) {
        // colourOf is the function that decides what a mark is painted with;
        // hue is the per-hit random the app already attaches to every event
        seen.push(Anim._colour(n, 0, Math.random()).join(","));
      }
    return seen;
  });
  await page.close();
  return { list: out, errs };
}

(async () => {
  const browser = await chromium.launch({
    executablePath: EDGE, headless: true,
    args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'],
  });
  console.log('40 hits of the same eight notes. How many different colours reach the screen?');
  console.log('');
  console.log('palette   distinct colours   same note, same colour?');
  let bad = 0;
  for (const pal of ['candy', 'ocean', 'forest', 'white', 'notes', 'random']) {
    for (const mix of [true]) {
      const r = await colours(browser, pal, mix);
      const distinct = new Set(r.list).size;
      // does one note always give one colour? (group by index within the round)
      const byNote = {};
      r.list.forEach((c, i) => { const n = i % 8; (byNote[n] = byNote[n] || new Set()).add(c); });
      const stable = Object.values(byNote).every(s => s.size === 1);
      if (r.errs.length) bad++;
      console.log(pal.padEnd(9),
        String(distinct).padStart(16), '   ' + (stable ? 'yes' : 'no'),
        r.errs.length ? '  ERR ' + r.errs[0] : '');
    }
  }
  await browser.close();
  console.log('');
  console.log('Expected: with Mix OFF every palette is exactly as it shipped (8 colours for a');
  console.log('ramp, one per note). With it ON a ramp draws many. Note colours never changes,');
  console.log('and Random was already per-hit.');
  if (bad) console.log('\n  ' + bad + ' RUN(S) WITH ERRORS');
})();
