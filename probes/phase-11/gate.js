// The two gates CLAUDE.md names.
//  1. all 27 pages load clean from file:// — 0 pageerror, 0 console.error, 0 failed requests
//  2. every one of Voice Visuals' nine style chips clicked AND PLAYED INTO.
//     A page that loads clean is not an app that works: a fault inside a style's
//     own draw code cannot throw until a note is played AND that look is selected.
//     With a fake microphone that gate is finally reachable for this app.
const { chromium } = require('playwright-core');
const fs = require('fs'), path = require('path');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const DIR = 'C:/Local Docs/Coding/musicapps';
const WAV = p => path.resolve('wav', p + '.wav').split(path.sep).join('/');

(async () => {
  // The room set lives at the top level and the pages that are NOT in the room
  // live a folder down - archive/ (delisted apps) and bench/ (template and the
  // two test harnesses). The gate still covers all 27: a page nobody launches
  // can still be the page that proves a shared file broke.
  const dirs = ['', 'archive/', 'bench/'];
  const pages = dirs.flatMap(d =>
    fs.readdirSync(path.join(DIR, d)).filter(f => f.endsWith('.html')).sort().map(f => d + f));
  console.log(`=== gate 1: ${pages.length} pages load clean from file:// ===`);
  const browser = await chromium.launch({ executablePath: EDGE, headless: true,
    args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'] });
  let bad = 0;
  for (const f of pages) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errs = [];
    page.on('pageerror', e => errs.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    page.on('requestfailed', r => errs.push('failed: ' + r.url().split('/').pop()));
    await page.goto('file:///' + DIR + '/' + f);
    await page.waitForTimeout(700);
    await page.close();
    if (errs.length) { bad++; console.log(`  FAIL  ${f}: ${errs[0]}`); }
    else console.log(`  ok    ${f}`);
  }
  await browser.close();
  console.log(bad ? `  ${bad} of ${pages.length} FAILED` : `  ${pages.length}/${pages.length} clean`);

  const styles = ['mandala','lava','waves','pixels','leds','ripples','fountain','stars'];
  console.log('\n=== gate 2: ' + styles.length + ' styles, each played into with a real signal ===');
  const b2 = await chromium.launch({ executablePath: EDGE, headless: true, args: [
    '--autoplay-policy=no-user-gesture-required', '--mute-audio',
    '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream',
    '--use-file-for-fake-audio-capture=' + WAV('tone-220') + '%noloop' ]});
  const ctx = await b2.newContext({ permissions: ['microphone'] });
  let styleBad = 0;
  for (const s of styles) {
    const page = await ctx.newPage({ viewport: { width: 1280, height: 800 } });
    const errs = [];
    page.on('pageerror', e => errs.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    await page.goto('file:///' + DIR + '/voice_visuals.html?s=visMode:' + s);
    await page.waitForTimeout(400);
    await page.click('#vvGate button');
    await page.waitForTimeout(3500);            // seed, then ~2.5 s of 220 Hz into the style
    const d = await page.evaluate(() => Anim._dbg());
    // and a touch, since splat() branches per style and is its own draw path
    await page.mouse.move(500, 400); await page.mouse.down();
    for (let i = 0; i < 12; i++) { await page.mouse.move(500 + i * 20, 400 + i * 8); await page.waitForTimeout(14); }
    await page.mouse.up();
    await page.waitForTimeout(500);
    const d2 = await page.evaluate(() => Anim._dbg());
    await page.close();
    const heard = d.level > 0.05;
    if (errs.length || !heard) { styleBad++;
      console.log(`  FAIL  ${s}: ${errs[0] || 'level only ' + d.level + ' — did not hear the tone'}`); }
    else console.log(`  ok    ${s.padEnd(9)} level ${d.level.toFixed(2)}  pitch ${d.pitch.toFixed(2)}  f0 ${d.f0.toFixed(0)} Hz  (touch clean, mode ${d2.mode})`);
  }
  await b2.close();
  console.log(styleBad ? `  ${styleBad} of ${styles.length} FAILED`
                       : `  ${styles.length}/${styles.length} clean`);
  process.exit(bad + styleBad ? 1 : 0);
})();
