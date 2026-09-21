// THE ROOM COPY IS THE THING BEING SHIPPED, so gate the copy, not the repo.
// Copy the top level of the repository (minus CLAUDE.md) into an empty folder and
// load all 21 pages from there. Anything the build reaches for outside itself -
// a doc, an archived app, a probe - shows up here as a failed request, and
// nowhere else: in the repo those files are still sitting next to it.
const { chromium } = require('playwright-core');
const fs = require('fs');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const DIR = process.argv[2];
(async () => {
  const pages = fs.readdirSync(DIR).filter(f => f.endsWith('.html')).sort();
  const b = await chromium.launch({ executablePath: EDGE, headless: true,
    args: ['--autoplay-policy=no-user-gesture-required','--mute-audio'] });
  let bad = 0;
  for (const f of pages) {
    const page = await b.newPage({ viewport: { width: 1280, height: 800 } });
    const errs = [];
    page.on('pageerror', e => errs.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    page.on('requestfailed', r => errs.push('failed: ' + r.url().split('/').pop()));
    await page.goto('file:///' + DIR + '/' + f);
    await page.waitForTimeout(700);
    // ...and the launcher's own links must all land on a file that is here.
    if (f === 'index.html') {
      const miss = await page.evaluate(() => [...document.querySelectorAll('a[href$=".html"]')]
        .map(a => a.getAttribute('href')));
      for (const h of miss) if (!fs.existsSync(DIR + '/' + h)) errs.push('launcher links to missing ' + h);
    }
    await page.close();
    if (errs.length) { bad++; console.log('  FAIL  ' + f + ': ' + errs[0]); }
  }
  console.log(bad ? '  ' + bad + ' of ' + pages.length + ' FAILED' : '  ' + pages.length + '/' + pages.length + ' clean in a folder with nothing else in it');
  await b.close();
})();
