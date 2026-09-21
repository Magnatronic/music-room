// Does Home go anywhere real from a page that moved a folder down?
// framework.js writes a RELATIVE <a href="index.html">, which from archive/ or
// bench/ resolves to a launcher that does not exist. The five moved pages that
// load the framework repoint it themselves.
const { chromium } = require('playwright-core');
const fs = require('fs');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const DIR = 'C:/Local Docs/Coding/musicapps';
const PAGES = ['archive/beat_builder.html','archive/conductor.html','archive/fluid_paint.html',
               'bench/template.html','bench/sound-test.html','index.html','big_switch.html'];
(async () => {
  const b = await chromium.launch({ executablePath: EDGE, headless: true,
    args: ['--autoplay-policy=no-user-gesture-required','--mute-audio'] });
  let bad = 0;
  for (const f of PAGES) {
    const page = await b.newPage({ viewport: { width: 1000, height: 700 } });
    await page.goto('file:///' + DIR + '/' + f);
    await page.waitForTimeout(500);
    const href = await page.evaluate(() => {
      const h = document.getElementById('homeBtn'); return h ? h.href : null;
    });
    await page.close();
    if (href === null) { console.log('  --    ' + f.padEnd(28) + 'no rail (by design)'); continue; }
    const target = decodeURIComponent(href.replace('file:///',''));
    const ok = fs.existsSync(target);
    if (!ok) bad++;
    console.log('  ' + (ok ? 'ok  ' : 'FAIL') + '  ' + f.padEnd(28) + target.split('/').slice(-2).join('/'));
  }
  console.log(bad ? '  ' + bad + ' Home links point at nothing' : '  every Home link resolves to a real launcher');
  await b.close();
})();
