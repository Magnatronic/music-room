// IS THE CONTEXT MENU REFUSED WHERE IT SHOULD BE, AND ALLOWED WHERE IT SHOULD BE?
//
// What this CAN measure: whether a `contextmenu` event on a given element is
// prevented. What it CANNOT measure: that a held FINGER is what raises that event
// on the projector - headless Chromium does not run the touch gesture recogniser
// that synthesises it. So this gates the half of the chain the code owns, and the
// projector test is the user's. See PHASE-16-LONG-PRESS-MENU.md §7.
const { chromium } = require('playwright-core');
const fs = require('fs');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const DIR = 'C:/Local Docs/Coding/musicapps';

(async () => {
  const pages = fs.readdirSync(DIR).filter(f => f.endsWith('.html')).sort();
  const b = await chromium.launch({ executablePath: EDGE, headless: true,
    args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'] });
  let bad = 0, checked = 0;

  console.log('=== every room page: the menu is refused on what a finger lands on ===');
  for (const f of pages) {
    const page = await b.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto('file:///' + DIR + '/' + f);
    await page.waitForTimeout(600);
    const r = await page.evaluate(() => {
      const fire = el => el && !el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
      const out = {};
      // What a therapist's finger actually rests on, per the report.
      out.canvas = fire(document.querySelector('canvas'));
      out.home   = fire(document.getElementById('homeBtn'));
      out.tab    = fire(document.querySelector('#rail .tab'));
      out.tile   = fire(document.querySelector('a[href$=".html"]'));   // the launcher
      out.body   = fire(document.body);
      return out;
    });
    await page.close();
    const parts = [];
    for (const k of ['canvas', 'home', 'tab', 'tile', 'body']) {
      if (r[k] === null || r[k] === undefined) continue;
      checked++;
      if (r[k] !== true) { bad++; parts.push(k + ' NOT PREVENTED'); }
    }
    if (parts.length) console.log('  FAIL  ' + f + ': ' + parts.join(', '));
  }
  console.log(bad ? '  ' + bad + ' of ' + checked + ' targets still open a menu'
                  : '  ' + checked + ' targets across ' + pages.length + ' pages, every one refused');

  console.log('\n=== and ALLOWED in the two places you type into or copy out of ===');
  const page = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto('file:///' + DIR + '/big_switch.html');
  await page.waitForTimeout(600);
  const r2 = await page.evaluate(() => {
    const fire = el => el && !el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    const out = {};
    // Open every pane so the fields exist, then find them by type.
    for (const t of document.querySelectorAll('#rail .tab')) t.click();
    const texts = [...document.querySelectorAll('input')].filter(i => i.type === 'text');
    const rng   = [...document.querySelectorAll('input')].filter(i => i.type === 'range');
    const ta    = document.querySelector('textarea');
    out.textInput = texts.length ? fire(texts[0]) : null;
    out.slider    = rng.length   ? fire(rng[0])   : null;
    out.textarea  = ta ? fire(ta) : null;
    out.found     = { text: texts.length, range: rng.length, ta: !!ta };
    return out;
  });
  await page.close();
  await b.close();
  const say = (name, got, want) => {
    if (got === null) return console.log('  --    ' + name.padEnd(22) + 'not on this page');
    const ok = got === want;
    if (!ok) bad++;
    console.log('  ' + (ok ? 'ok  ' : 'FAIL') + '  ' + name.padEnd(22)
      + (got ? 'menu refused' : 'menu allowed') + '   (wanted ' + (want ? 'refused' : 'allowed') + ')');
  };
  say('preset name (text)', r2.textInput, false);
  say('a slider (range)',   r2.slider,    true);
  say('launch link (textarea)', r2.textarea, false);
  console.log('  found: ' + JSON.stringify(r2.found));
  console.log(bad ? '\n  ' + bad + ' WRONG' : '\n  every target answers the way the doc says it should');
})();
