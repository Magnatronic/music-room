// Does `tint` still render exactly as it did, and does `bold` deliver?
//
// The old build is a copy of song_grid.html pointing at main's framework.js, so
// both are driven by the same probe in the same browser. The keyboard strip is
// compared pixel for pixel - "looks the same" is not the criterion, identical is.
const { chromium } = require('playwright-core');
const { execSync } = require('child_process');
const fs = require('fs');
const REPO = 'C:/Local Docs/Coding/musicapps';
// The probe BUILDS its own comparison copy from git and removes it again, so it
// leaves nothing behind and cannot be broken by someone tidying the repo. Both
// names are gitignored as well, in case a run is interrupted.
function makeOld() {
  fs.writeFileSync(REPO + '/framework_old.js',
    execSync('git show main:framework.js', { cwd: REPO, maxBuffer: 1 << 26 }));
  fs.writeFileSync(REPO + '/echo_bird_OLD.html',
    fs.readFileSync(REPO + '/echo_bird.html', 'utf8').replace('src="framework.js"', 'src="framework_old.js"'));
}
function dropOld() {
  for (const f of ['/framework_old.js', '/echo_bird_OLD.html'])
    try { fs.unlinkSync(REPO + f); } catch (e) {}
}
const { readPNG } = require('./png');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const lin = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
const L = c => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
const ratio = (a, b) => { const l1 = Math.max(L(a), L(b)), l2 = Math.min(L(a), L(b)); return (l1 + 0.05) / (l2 + 0.05); };
const dalt = c => { const [r, g, b] = c; return [0.625 * r + 0.375 * g, 0.7 * r + 0.3 * g, 0.3 * g + 0.7 * b]; };

async function keyStrip(browser, file, look) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await page.goto('file:///C:/Local Docs/Coding/musicapps/' + file +
    (look ? '?s=zoneLook:' + look + '&lock=1' : '?lock=1'));
  await page.waitForTimeout(1100);
  const boxes = await page.evaluate(() => [...document.querySelectorAll('#bands .band')].map(b => {
    const r = b.getBoundingClientRect();
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
  }));
  const img = readPNG(await page.screenshot({ type: 'png' }));
  await page.close();
  const px = boxes.map(b => {
    const o = (b.y * img.w + b.x) * img.ch;
    return [img.data[o], img.data[o + 1], img.data[o + 2]];
  });
  return { px, img, boxes, errs };
}

(async () => {
  makeOld();
  const browser = await chromium.launch({
    executablePath: EDGE, headless: true,
    args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'],
  });

  console.log('1. Is `Coloured` (the default) still exactly what it was?');
  // Compared on ECHO BIRD. Song Grid animates a highlight on the next note to
  // play, and comparing there reported the default as "CHANGED" over a single
  // unit in one channel of that one key - a transition caught mid-flight, not a
  // change. The same confound had already been found for the numbers below.
  const oldB = await keyStrip(browser, 'echo_bird_OLD.html', null);
  const newB = await keyStrip(browser, 'echo_bird.html', null);
  const same = JSON.stringify(oldB.px) === JSON.stringify(newB.px);
  console.log('   old build keys: ' + JSON.stringify(oldB.px));
  console.log('   new build keys: ' + JSON.stringify(newB.px));
  console.log('   ' + (same ? 'IDENTICAL - ok' : 'CHANGED - the default moved'));

  console.log('');
  console.log('2. What each look measures, off the rendered pixels.');
  console.log('   Measured on ECHO BIRD, not Song Grid: Song Grid paints its own');
  console.log('   highlight on the next note to play, and the first run of this');
  console.log('   probe measured that highlight instead of the key look.');
  console.log('   look       worst key vs bg   worst neighbour   neighbour, deuteranopia');
  for (const look of ['soft', 'tint', 'bold']) {
    const r = await keyStrip(browser, 'echo_bird.html', look);
    const bg = [0, 0, 0];
    let wk = 99, wn = 99, wd = 99;
    r.px.forEach(c => wk = Math.min(wk, ratio(c, bg)));
    for (let i = 0; i < r.px.length - 1; i++) {
      wn = Math.min(wn, ratio(r.px[i], r.px[i + 1]));
      wd = Math.min(wd, ratio(dalt(r.px[i]), dalt(r.px[i + 1])));
    }
    const name = look === 'tint' ? 'Coloured' : look === 'bold' ? 'Bold' : 'Soft';
    console.log('   ' + name.padEnd(10) + wk.toFixed(2).padStart(9) + ':1' +
      wn.toFixed(2).padStart(17) + ':1' + wd.toFixed(2).padStart(21) + ':1' +
      (r.errs.length ? '  ERR ' + r.errs[0] : ''));
  }
  await browser.close();
  dropOld();
})();

