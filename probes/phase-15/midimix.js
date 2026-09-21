// ALL FIVE MIDI APPS: does a ramp palette now draw a picture with variety?
//
// midi.js is shared by FOUR apps and CLAUDE.md treats a change there the way it
// treats framework.js - so all four are driven, not one. MIDI Light is the
// fifth: it predates midi.js and carries its own copy of this code, which is why
// it needed the same change separately.
const { chromium } = require('playwright-core');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const APPS = ['midi_light', 'midi_chords', 'midi_creatures', 'midi_loop', 'midi_mirror'];

(async () => {
  const browser = await chromium.launch({
    executablePath: EDGE, headless: true,
    args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'],
  });
  console.log('40 hits of the same eight notes, palette = Candy.');
  console.log('');
  console.log('app              distinct colours   one note = one colour?   errors');
  let bad = 0;
  for (const app of APPS) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errs = [];
    page.on('pageerror', e => errs.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    await page.goto('file:///C:/Local Docs/Coding/musicapps/' + app + '.html?s=palette:candy&lock=1');
    await page.waitForTimeout(900);
    const out = await page.evaluate(() => {
      // midi_light keeps its own copy; the other four share MIDIIN from midi.js
      const f = (typeof MIDIIN !== 'undefined' && MIDIIN.colourOf)
        ? MIDIIN.colourOf
        : (Anim._colour ? Anim._colour : null);
      if (!f) return null;
      const seen = [], notes = [60, 62, 64, 65, 67, 69, 71, 72];
      for (let r = 0; r < 5; r++) for (const n of notes) seen.push(f(n, 0, Math.random()).join(','));
      return seen;
    });
    await page.close();
    if (!out) { console.log(app.padEnd(16), 'no colour function reachable'); bad++; continue; }
    const distinct = new Set(out).size;
    const byNote = {};
    out.forEach((c, i) => { const n = i % 8; (byNote[n] = byNote[n] || new Set()).add(c); });
    const stable = Object.values(byNote).every(s => s.size === 1);
    const ok = distinct > 20 && !stable;
    if (!ok || errs.length) bad++;
    console.log(app.padEnd(16), String(distinct).padStart(16), '   ' + (stable ? 'yes - still samey' : 'no - mixed').padEnd(24),
      errs.length ? 'ERR ' + errs[0] : 'none');
  }
  await browser.close();
  console.log(bad ? '\n  ' + bad + ' NOT MIXING' : '\n  all five mix');
})();
