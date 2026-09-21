// DOES THE SWITCH AGREE WITH THE BEHAVIOUR AT PAGE LOAD?
//
// The user: "if the persistence is turned on when you first load the page it
// seems not to work until you turn it off and back on again."
//
// Persistence was a SLIDER until yesterday, so a therapist who has been using
// these apps has a FRACTIONAL value in localStorage - 0.3, say. The switch that
// replaced the slider draws itself from `SETTINGS[key]`, which is truthiness, so
// 0.3 shows ON. PERSIST() read `>= 0.5`, which is 0. The switch says on, the
// picture is not kept, and toggling it off and on writes a real `true`.
//
// This measures the two numbers directly rather than counting pixels: what the
// switch shows, and what the drawing code actually gets. No drags, no images -
// the earlier pixel probe reported these in agreement and was wrong.
const { chromium } = require('playwright-core');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const DIR = 'file:///C:/Local Docs/Coding/musicapps/';
const APPS = ['midi_chords.html','midi_creatures.html','midi_loop.html','midi_mirror.html','midi_light.html'];
const STORED = [0.2, 0.3, 0.45, 0.5, 0.8, true, false, 0];

(async () => {
  const browser = await chromium.launch({ executablePath: EDGE, headless: true,
    args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'] });
  const page = await browser.newPage({ viewport: { width: 900, height: 600 } });
  console.log('stored value    app                switch shows   drawing code gets');
  let bad = 0;
  for (const app of APPS) {
    for (const v of STORED) {
      await page.goto(DIR + app);            // load once to own the origin
      await page.evaluate(([f, val]) => {
        localStorage.setItem('settings:' + f, JSON.stringify({ persist: val }));
      }, [app, v]);
      await page.goto(DIR + app + '?lock=0');
      await page.waitForTimeout(700);
      const r = await page.evaluate(() => {
        // open the pane the toggle lives on, so the switch actually exists
        const on = () => {
          const rows = [...document.querySelectorAll('.toggle')];
          const row = rows.find(t => /Persistence/i.test(t.textContent));
          return row ? row.querySelector('.switch').classList.contains('on') : null;
        };
        let sw = on();
        if (sw === null) {                    // pane not built yet - build every one
          for (const b of document.querySelectorAll('#rail .rbtn, #rail button')) b.click();
          sw = on();
        }
        const p = (typeof MIDIIN !== 'undefined' && MIDIIN.PERSIST) ? MIDIIN.PERSIST()
                : (typeof Anim !== 'undefined' && Anim._persist) ? Anim._persist() : null;
        return { sw, p };
      });
      const agree = (r.sw === null || r.p === null) ? '?' : ((!!r.sw) === (r.p > 0) ? '' : '   <-- DISAGREE');
      if (agree) bad++;
      console.log(String(v).padEnd(15) + app.padEnd(20)
        + String(r.sw === null ? 'no switch' : r.sw ? 'ON' : 'off').padEnd(15)
        + String(r.p === null ? 'no hook' : r.p) + agree);
    }
    console.log('');
  }
  console.log(bad ? bad + ' combinations where the switch lies about what the app does' : 'switch and behaviour agree everywhere');
  await browser.close();
})();
