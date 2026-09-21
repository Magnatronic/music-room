// No microphone at all. The draw code still runs - every style keeps a calm
// baseline in silence, and touch drives splat() - so this exercises the two
// rewritten styles' code paths and the whole 27-page load gate without needing
// a device that has stopped opening on this machine.
const { chromium } = require('playwright-core');
const fs = require('fs');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const DIR = 'C:/Local Docs/Coding/musicapps';
// One list, so deleting a style cannot leave a probe claiming a count it is no
// longer testing - `flow` was removed on 2026-09-05 and the header still said
// "nine styles" over eight results.
const STYLES = ['mandala','lava','waves','pixels','leds','ripples','fountain','stars'];

(async () => {
  const browser = await chromium.launch({ executablePath: EDGE, headless: true,
    args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'] });
  let bad = 0;
  const pages = fs.readdirSync(DIR).filter(f => f.endsWith('.html')).sort();
  for (const f of pages) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errs = [];
    page.on('pageerror', e => errs.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    page.on('requestfailed', r => errs.push('failed: ' + r.url().split('/').pop()));
    await page.goto('file:///' + DIR + '/' + f);
    await page.waitForTimeout(600);
    await page.close();
    if (errs.length) { bad++; console.log(`  FAIL  ${f}: ${errs[0]}`); }
  }
  console.log(bad ? `  ${bad} of ${pages.length} pages FAILED` : `  ${pages.length}/${pages.length} pages load clean`);

  console.log('\n  ' + STYLES.length + ' styles, drawn and dragged with no microphone:');
  let sBad = 0;
  for (const s of STYLES) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errs = [];
    page.on('pageerror', e => errs.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    await page.goto('file:///' + DIR + '/voice_visuals.html?s=visMode:' + s);
    await page.waitForTimeout(700);
    // drag, which is the other way into every style's draw path
    await page.mouse.move(420, 360); await page.mouse.down();
    for (let i = 0; i < 20; i++) { await page.mouse.move(420 + i * 22, 360 + Math.sin(i / 3) * 90); await page.waitForTimeout(14); }
    await page.mouse.up();
    await page.waitForTimeout(900);
    // and the tweak sliders for the two rewritten styles
    const tweaks = await page.evaluate(() => {
      const out = [];
      document.querySelector('.bbar[data-mode="visuals"]').click();
      for (const r of document.querySelectorAll('#visualsContent .row')) {
        const l = r.querySelector('label'), i = r.querySelector('input');
        if (!l || !i) continue;
        out.push(l.textContent);
        i.value = i.min; i.dispatchEvent(new Event('input', { bubbles: true }));
        i.value = i.max; i.dispatchEvent(new Event('input', { bubbles: true }));
      }
      return out;
    });
    await page.waitForTimeout(500);
    await page.close();
    if (errs.length) { sBad++; console.log(`  FAIL  ${s}: ${errs[0]}`); }
    else console.log(`  ok    ${s.padEnd(9)} sliders swept: ${tweaks.join(', ')}`);
  }
  await browser.close();
  console.log(sBad ? `  ${sBad} of ${STYLES.length} FAILED`
                   : `  ${STYLES.length}/${STYLES.length} clean`);
  process.exit(bad + sBad ? 1 : 0);
})();
