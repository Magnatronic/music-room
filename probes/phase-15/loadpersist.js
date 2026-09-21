// PERSISTENCE THAT IS ALREADY ON WHEN THE PAGE OPENS.
//
// "If persistence is turned on when you first load the page it seems not to work
// until you turn it off and back on again." Reproduced by writing the setting
// into localStorage BEFORE the page loads - which is what a therapist's saved
// settings are - then drawing, and comparing against the same app after the
// toggle has been flipped off and on.
const { chromium } = require('playwright-core');
const { readPNG } = require('./png');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const APPS = ['midi_light', 'midi_chords', 'midi_creatures', 'midi_loop', 'midi_mirror'];
const lit = img => { const { w, h, ch, data } = img; let n = 0;
  for (let i = 0; i < w * h; i++) { const o = i * ch;
    if (Math.max(data[o], data[o + 1], data[o + 2]) >= 12) n++; } return n / (w * h); };
const drag = async p => {
  await p.mouse.move(120, 300); await p.mouse.down();
  for (let i = 0; i < 40; i++) { await p.mouse.move(120 + i * 16, 300 + Math.sin(i / 3) * 110); await p.waitForTimeout(26); }
  await p.mouse.up();
};

// A FRESH PAGE PER CONDITION. The first version drew twice on the SAME page:
// the second drag painted on top of the first, or onto a sheet the toggle had
// just cleared, so the two numbers were never comparable. It reported one app
// broken and one app improving, both of which were the measurement.
async function run(browser, app, toggleFirst) {
  const ctx = await browser.newContext({ viewport: { width: 900, height: 600 } });
  await ctx.addInitScript(a => {
    try { localStorage.setItem('settings:' + a + '.html', JSON.stringify({ persist: true, palette: 'candy' })); } catch (e) {}
  }, app);
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.goto('file:///C:/Local Docs/Coding/musicapps/' + app + '.html?lock=1');
  await page.waitForTimeout(900);
  if (toggleFirst) {
    await page.evaluate(() => { SETTINGS.persist = false; saveSettings(); });
    await page.waitForTimeout(300);
    await page.evaluate(() => { SETTINGS.persist = true; saveSettings(); });
    await page.waitForTimeout(300);
  }
  await drag(page);
  await page.waitForTimeout(3200);
  const v = lit(readPNG(await page.screenshot({ type: 'png' })));
  await ctx.close();
  return { v, errs };
}

(async () => {
  const browser = await chromium.launch({
    executablePath: EDGE, headless: true,
    args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'],
  });
  console.log('app              on at load   after toggling off/on   verdict');
  let bad = 0;
  for (const app of APPS) {
    const asLoaded = await run(browser, app, false);
    const afterToggle = await run(browser, app, true);
    const broken = asLoaded.v < afterToggle.v * 0.6;
    if (broken || asLoaded.errs.length) bad++;
    console.log(app.padEnd(16), ((asLoaded.v * 100).toFixed(3) + '%').padStart(9),
      ((afterToggle.v * 100).toFixed(3) + '%').padStart(18), '     ',
      broken ? 'BROKEN until toggled' : 'works from load',
      asLoaded.errs.length ? ' ERR ' + asLoaded.errs[0] : '');
  }
  await browser.close();
  console.log(bad ? '\n  ' + bad + ' app(s) affected' : '\n  every app persists from load');
})();
