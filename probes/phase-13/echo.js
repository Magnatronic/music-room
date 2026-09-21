// THE BIRD HANDS THE PHRASE BACK — in the student's own rhythm?
//
// Two claims to settle:
//   1. after the student stops, the bird answers within `Wait for me` seconds;
//   2. in mirror mode it plays back THEIR notes with THEIR gaps, not quantised
//      to the bird's tempo. A quantised echo would be a correction, and a
//      correction is a fail state wearing a friendly hat.
//
// The bird's notes are captured by wrapping the framework's own `flashCell`,
// which `birdNote` calls. The student's notes do NOT go through it here: the
// framework calls `flashCell` from its pointer handler, and this probe drives
// `Anim.onCell` directly, so what the wrapper records is the bird alone. That is
// luck rather than design, so the probe ASSERTS it by checking nothing is
// recorded while the student is playing.
const { chromium } = require('playwright-core');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const APP = 'file:///C:/Local Docs/Coding/musicapps/echo_bird.html';

const state = page => page.evaluate(() => {
  const b = document.getElementById('ebBird');
  return b ? b.dataset.s : 'none';
});

async function run(mode, wait, cols, gaps) {
  const browser = await chromium.launch({
    executablePath: EDGE, headless: true,
    args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await page.goto(APP + '?s=birdMode:' + mode + ',replyWait:' + wait + ',callFrom:random&lock=1');
  await page.waitForTimeout(600);
  await page.evaluate(() => {
    window.__heard = [];
    const orig = window.flashCell;
    window.flashCell = function (c, r) { window.__heard.push([c, performance.now()]); return orig.apply(this, arguments); };
    const b = (Anim.railButtons || []).find(x => x.id === 'ebplay');
    if (b) b.onClick();
  });
  // wait for the bird to be listening
  let w = 0;
  while (w < 12000 && await state(page) !== 'waiting') { await page.waitForTimeout(100); w += 100; }
  await page.evaluate(() => { window.__heard = []; });          // ignore any call
  // the student plays
  for (let i = 0; i < cols.length; i++) {
    await page.evaluate(c => Anim.onCell(c, 0), cols[i]);
    if (i < gaps.length) await page.waitForTimeout(gaps[i]);
  }
  const duringStudent = await page.evaluate(() => window.__heard.length);
  const stopped = Date.now();
  // wait for the bird to answer
  let latency = null, t = 0;
  while (t < 14000) {
    if (await state(page) !== 'waiting') { latency = (Date.now() - stopped) / 1000; break; }
    await page.waitForTimeout(60); t += 60;
  }
  await page.waitForTimeout(3200);
  const heard = await page.evaluate(() => window.__heard);
  await browser.close();
  return { heard, latency, duringStudent, errs };
}

(async () => {
  console.log('1. How long after the student stops does the bird answer?');
  console.log('   Wait for me    measured   (should match, +/- 0.3 s)');
  for (const wv of [1, 2.5, 4]) {
    const r = await run('free', wv, [0, 1, 2], [300, 300]);
    console.log('  ' + String(wv).padStart(11) + ' s',
      (r.latency === null ? ' never' : r.latency.toFixed(2) + ' s').padStart(11),
      Math.abs((r.latency || 99) - wv) <= 0.35 ? '  ok' : '  OUT OF RANGE',
      r.errs.length ? '  ERRORS ' + r.errs[0] : '');
  }

  console.log('');
  console.log('2. Mirror mode: does the bird play back what the student played?');
  const cols = [0, 2, 1, 2], gaps = [250, 620, 250];
  const r = await run('mirror', 1.5, cols, gaps);
  if (r.errs.length) console.log('  ERRORS', r.errs.join(' | '));
  console.log('  nothing recorded while the student played:', r.duringStudent === 0 ? 'ok' : 'NO — ' + r.duringStudent + ' captured, the wrapper is hearing the student too');
  const got = r.heard.map(x => x[0]);
  console.log('  student played ', JSON.stringify(cols));
  console.log('  bird played back', JSON.stringify(got));
  console.log('  notes match:', JSON.stringify(got) === JSON.stringify(cols) ? 'ok' : 'NO');
  if (r.heard.length === cols.length) {
    const back = [];
    for (let i = 1; i < r.heard.length; i++) back.push(Math.round(r.heard[i][1] - r.heard[i - 1][1]));
    console.log('  student gaps (ms)', JSON.stringify(gaps));
    console.log('  bird gaps    (ms)', JSON.stringify(back));
    const off = back.map((b, i) => Math.abs(b - gaps[i]) / gaps[i]);
    console.log('  worst gap error:', (Math.max(...off) * 100).toFixed(1) + '%',
      Math.max(...off) <= 0.15 ? ' ok (<=15%)' : ' OVER 15%');
  }
})();
