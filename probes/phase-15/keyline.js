// CAN A STUDENT SEE WHERE ONE KEY ENDS AND THE NEXT BEGINS?
//
// Not "what is the contrast between the two colours" - that was measured and it
// is 1.01:1 to 1.13:1, which no opacity fixes. This asks the question the way the
// eye does: scan a horizontal line of pixels across the keyboard and count how
// many EDGES are detectable. A keyboard of six keys has five internal edges. If
// the scan finds five, the keys are separated; if it finds none, the student is
// looking at one dark rectangle.
//
// Measured off a screenshot, because the divider is a composited 1px line and
// `canvas-fade-never-arrives` is on record here as a bug that reading pixels back
// hides.
const { chromium } = require('playwright-core');
const { readPNG } = require('./png');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const APPS = [
  ['song_grid', 6], ['echo_bird', 5], ['fluid_sensory', 5],
];

function scanRow(img, y) {
  const { w, ch, data } = img, out = [];
  for (let x = 0; x < w; x++) {
    const o = (y * w + x) * ch;
    out.push(Math.max(data[o], data[o + 1] || 0, data[o + 2] || 0));
  }
  return out;
}
// an edge is a run of pixels brighter than both sides of it by a clear margin
function edges(row, lo, hi, minJump) {
  let n = 0, i = lo;
  while (i < hi) {
    if (row[i] - row[i - 3] >= minJump && row[i] >= row[i + 1]) {
      n++;
      while (i < hi && row[i] > row[i - 3] - minJump) i++;   // skip past this edge
    }
    i++;
  }
  return n;
}

(async () => {
  const browser = await chromium.launch({
    executablePath: EDGE, headless: true,
    args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'],
  });
  console.log('Scanning a line across the resting keyboard and counting visible edges.');
  console.log('');
  console.log('app             keys   edges wanted   edges found   brightest divider');
  let bad = 0;
  for (const [app, keys] of APPS) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const look = process.argv[2] || '';
    await page.goto('file:///C:/Local Docs/Coding/musicapps/' + app + '.html' +
      (look ? '?s=zoneLook:' + look + '&lock=1' : '?lock=1'));
    await page.waitForTimeout(1100);
    // find the vertical middle of the keyboard strip
    const box = await page.evaluate(() => {
      const b = document.querySelector('#bands .band');
      if (!b) return null;
      const r = b.getBoundingClientRect();
      return { y: Math.round(r.top + r.height / 2), x0: Math.round(r.left), x1: Math.round(r.right) };
    });
    const img = readPNG(await page.screenshot({ type: 'png' }));
    await page.close();
    if (!box) { console.log(app.padEnd(15), 'no keyboard'); continue; }
    const row = scanRow(img, Math.min(img.h - 1, box.y));
    // look across the whole keyboard, a little inside the outer edges
    const lo = 8, hi = img.w - 8;
    // a dark separator is a DIP, a light one is a peak - count both
    const found = Math.max(edges(row, lo, hi, 6), edges(row.map(v => 255 - v), lo, hi, 30));
    const peak = Math.max(...row.slice(lo, hi));
    const want = keys - 1;
    const ok = found >= want;
    if (!ok) bad++;
    console.log(app.padEnd(15), String(keys).padStart(4), String(want).padStart(14),
      String(found).padStart(13), String(peak).padStart(19), ok ? '  ok' : '  NOT SEPARATED');
  }
  await browser.close();
  console.log('');
  console.log(bad ? '  ' + bad + ' keyboard(s) with invisible divisions' : '  every keyboard shows its divisions');
})();
