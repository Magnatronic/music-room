// CAN THE NOTE LETTER BE READ ON ITS OWN KEY?
//
// The label is drawn in the KEY'S OWN COLOUR, which reads only while keys are
// dim. `Bold` draws a key at 0.95 and the E vanished into the yellow - found by
// looking at a screenshot of the new look, not by any of the contrast numbers,
// which were all about the keys and never about the writing on them.
//
// Kept in its own file: appending it to look.js made two async blocks race and
// interleave their output, which is a probe that lies about which number belongs
// to which row.
const { chromium } = require('playwright-core');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const lin = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
const L = c => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
const ratio = (a, b) => { const l1 = Math.max(L(a), L(b)), l2 = Math.min(L(a), L(b)); return (l1 + 0.05) / (l2 + 0.05); };
// ── the label on the key, added after a screenshot showed the E vanishing ──
(async () => {
  const browser = await chromium.launch({
    executablePath: EDGE, headless: true,
    args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'],
  });
  console.log('');
  console.log('3. Can the note letter be read on its own key?');
  console.log('   look       worst letter-on-key contrast');
  for (const look of ['tint', 'bold']) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto('file:///C:/Local Docs/Coding/musicapps/echo_bird.html?s=zoneLook:' + look + ',showLabels:1&lock=1');
    await page.waitForTimeout(1100);
    const pairs = await page.evaluate(() => [...document.querySelectorAll('#bands .band')].map(b => {
      const l = b.querySelector('.lbl');
      return { key: getComputedStyle(b).backgroundColor, lab: l ? getComputedStyle(l).color : null };
    }));
    await page.close();
    const parse = s => (s.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
    const alpha = s => { const m = s.match(/[\d.]+/g); return m && m.length > 3 ? Number(m[3]) : 1; };
    let worst = 99;
    for (const p of pairs) {
      if (!p.lab) continue;
      const k = parse(p.key).map(v => v * alpha(p.key));     // key over black
      const t = parse(p.lab);
      worst = Math.min(worst, ratio(k, t));
    }
    console.log('   ' + (look === 'tint' ? 'Coloured' : 'Bold').padEnd(10) +
      worst.toFixed(2).padStart(8) + ':1  ' + (worst >= 3 ? 'ok' : worst >= 1.8 ? 'weak' : 'UNREADABLE'));
  }
  await browser.close();
})();
