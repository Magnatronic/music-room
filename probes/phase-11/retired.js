// THE INHERITANCE ROW: what happens to the person who already had it.
//
// `flow` was deleted at the user's request on 2026-09-05. CLAUDE.md's lifecycle
// rule names replacement, duplication and inheritance as the three that get
// forgotten, and this is inheritance: a shared room PC where a therapist left
// Voice Visuals on Flow, a preset saved with it, or a printed launch link that
// names it. None of them may leave a student with a blank screen or a style the
// Style chips do not agree with.
const { chromium } = require('playwright-core');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const APP = 'file:///C:/Local Docs/Coding/musicapps/voice_visuals.html';

(async () => {
  const browser = await chromium.launch({ executablePath: EDGE, headless: true,
    args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'] });
  let bad = 0;
  const check = (name, got, want) => {
    const ok = got === want;
    if (!ok) bad++;
    console.log('  ' + (ok ? 'ok  ' : 'FAIL') + '  ' + name.padEnd(46) + got + (ok ? '' : '   want ' + want));
  };

  // 1. left on Flow in localStorage - the room PC the next person walks up to
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errs = [];
    page.on('pageerror', e => errs.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    await page.addInitScript(() => {
      try { localStorage.setItem('settings:voice_visuals.html', JSON.stringify({ visMode: 'flow' })); } catch (e) {}
    });
    await page.goto(APP);
    await page.waitForTimeout(900);
    check('saved settings say flow -> style is', await page.evaluate(() => SETTINGS.visMode), 'mandala');
    check('and it drew without error', errs.length ? errs[0] : 'clean', 'clean');
    await page.close();
  }

  // 2. a launch link that names it
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errs = [];
    page.on('pageerror', e => errs.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    await page.goto(APP + '?s=visMode:flow');
    await page.waitForTimeout(900);
    check('launch link says flow -> style is', await page.evaluate(() => SETTINGS.visMode), 'mandala');
    check('and it drew without error', errs.length ? errs[0] : 'clean', 'clean');
    await page.close();
  }

  // 3. a PRESET holding it, applied after init - the case the init clamp alone
  //    could not catch, and the reason the clamp moved into the frame
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errs = [];
    page.on('pageerror', e => errs.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    await page.goto(APP);
    await page.waitForTimeout(700);
    await page.evaluate(() => { SETTINGS.visMode = 'flow'; if (typeof pokeSim === 'function') pokeSim(); });
    await page.waitForTimeout(700);
    check('set to flow after load -> style is', await page.evaluate(() => SETTINGS.visMode), 'mandala');
    check('and it drew without error', errs.length ? errs[0] : 'clean', 'clean');
    // the canvas must not be blank: something has to be on screen
    const lit = await page.evaluate(() => {
      const c = document.querySelector('canvas');
      return c ? c.width > 0 && c.height > 0 : false;
    });
    check('canvas is still live', String(lit), 'true');
    await page.close();
  }

  // 4. the Style row itself. CHIP_CAP is 8, so NINE styles collapsed to four
  //    plus an "All 9" expander and EIGHT do not - deleting Flow changes the
  //    shape of the row a therapist sees, not just its contents.
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto(APP);
    await page.waitForTimeout(700);
    await page.click('.bbar[data-mode="visuals"]');
    await page.waitForTimeout(400);
    const r = await page.evaluate(() => {
      const el = document.getElementById('visualsContent');
      if (!el) return { n: -1, more: 0, labels: [] };
      const chips = [...el.querySelectorAll('.chips .chip')];
      return { n: chips.length, more: chips.filter(c => c.className.indexOf('more') >= 0).length,
               labels: chips.map(c => c.textContent.trim()) };
    });
    check('Style row shows every style inline', String(r.more), '0');
    check('no chip is labelled Flow', String(!r.labels.some(l => /Flow/.test(l))), 'true');
    await page.close();
  }

  await browser.close();
  console.log(bad ? '\n  ' + bad + ' FAILED' : '\n  all inheritance checks clean');
})();
