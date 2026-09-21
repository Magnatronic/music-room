// THE SAME NOTE MUST BE THE SAME COLOUR, WHEREVER IT LANDS.
//
// This is the check that was missing. `bold` first alternated on the COLUMN
// index, which separated neighbours perfectly and broke Boomwhacker: on an
// 11-key scale the first C was bright and the second C was dark. The
// measurement that approved it used a SIX-key scale, where no note appears
// twice, so it could not have seen it.
//
// Driven across note counts that WRAP - 8 to 12 keys - and several scales, and
// it reads the rendered pixel of every key.
const { chromium } = require('playwright-core');
const { readPNG } = require('./png');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const lin = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
const L = c => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
const ratio = (a, b) => { const l1 = Math.max(L(a), L(b)), l2 = Math.min(L(a), L(b)); return (l1 + 0.05) / (l2 + 0.05); };

(async () => {
  const browser = await chromium.launch({
    executablePath: EDGE, headless: true,
    args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'],
  });
  let bad = 0;
  console.log('look   scale       keys   repeated notes   same colour?   worst neighbour');
  for (const look of ['tint', 'bold']) {
    for (const scale of ['major', 'minor', 'pentatonic']) {
      for (const n of [8, 11, 12]) {
        const page = await browser.newPage({ viewport: { width: 1400, height: 800 } });
        const errs = [];
        page.on('pageerror', e => errs.push(e.message));
        await page.goto('file:///C:/Local Docs/Coding/musicapps/fluid_sensory.html' +
          '?s=zoneLook:' + look + ',noteCount:' + n + ',scale:' + scale + ',showLabels:1&lock=1');
        await page.waitForTimeout(1000);
        const keys = await page.evaluate(() => [...document.querySelectorAll('#bands .band')].map(b => {
          const r = b.getBoundingClientRect(), l = b.querySelector('.lbl');
          return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2),
                   label: l ? (l.textContent || '').trim() : '' };
        }));
        const img = readPNG(await page.screenshot({ type: 'png' }));
        await page.close();
        const px = keys.map(k => {
          const o = (k.y * img.w + k.x) * img.ch;
          return [img.data[o], img.data[o + 1], img.data[o + 2]];
        });
        // group by note name and check every occurrence renders the same
        const byName = {};
        keys.forEach((k, i) => { if (k.label) (byName[k.label] = byName[k.label] || []).push(px[i]); });
        const repeated = Object.entries(byName).filter(([, v]) => v.length > 1);
        let same = true, offender = '';
        for (const [name, list] of repeated) {
          const first = JSON.stringify(list[0]);
          if (list.some(c => JSON.stringify(c) !== first)) { same = false; offender = name; }
        }
        let wn = 99;
        for (let i = 0; i < px.length - 1; i++) wn = Math.min(wn, ratio(px[i], px[i + 1]));
        if (!same || errs.length) bad++;
        console.log(look.padEnd(6), scale.padEnd(11), String(n).padStart(4),
          String(repeated.length).padStart(15), '   ',
          (same ? 'yes' : 'NO - ' + offender + ' DIFFERS').padEnd(22),
          wn.toFixed(2) + ':1', errs.length ? ' ERR ' + errs[0] : '');
      }
    }
  }
  await browser.close();
  console.log(bad ? '\n  ' + bad + ' FAILED' : '\n  every repeated note keeps its colour');
})();
