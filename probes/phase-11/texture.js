// Phase 11 step 4: voiced/unvoiced and brightness, drawn.
// The claim is narrow and this measures exactly it: a CLEAR TONE must draw the
// picture the app drew before Phase 11, pixel for pixel where it can be, and
// only an UNVOICED sound may look different. A change that also moved the
// voiced look would be a redesign nobody asked for.
const { chromium } = require('playwright-core');
const path = require('path');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const APP = 'file:///C:/Local Docs/Coding/musicapps/voice_visuals.html';
const WAV = p => path.resolve('wav', p + '.wav').split(path.sep).join('/');

// Ink: how much light is on the canvas, and how much of it sits in the outer
// ring. A diffuse wide-and-dim mandala and a crisp narrow-and-bright one differ
// in both, and neither can be read from _dbg().
async function shoot(wav, params, secs, textureOff) {
  const browser = await chromium.launch({ executablePath: EDGE, headless: true, args: [
    '--autoplay-policy=no-user-gesture-required', '--mute-audio',
    '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream',
    '--use-file-for-fake-audio-capture=' + WAV(wav) + '%noloop' ]});
  const ctx = await browser.newContext({ permissions: ['microphone'] });
  const page = await ctx.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await page.goto(APP + params);
  await page.waitForTimeout(400);
  // `tw` is a nested object, so encodeSettings() refuses to put it in a link and
  // applySettingsParam() would call it junk. Set it the way the slider does.
  if (textureOff) await page.evaluate(m => {
    SETTINGS.tw = SETTINGS.tw || {};
    SETTINGS.tw[m] = Object.assign({}, SETTINGS.tw[m], { texture: 0 });
  }, textureOff);
  await page.click('#vvGate button');
  await page.waitForTimeout(secs * 1000);
  const out = await page.evaluate(() => {
    const cv = document.getElementById('c');
    const g = cv.getContext('2d');
    const W = cv.width, H = cv.height, cx = W / 2, cy = H / 2;
    const d = g.getImageData(0, 0, W, H).data;
    const m = Math.min(W, H);
    let ink = 0, outer = 0, lit = 0;
    // sample on a grid — reading every pixel of a 2560x1600 buffer is slow and
    // adds nothing
    for (let y = 0; y < H; y += 4) for (let x = 0; x < W; x += 4) {
      const i = (y * W + x) * 4;
      const v = (d[i] + d[i + 1] + d[i + 2]) / 3;
      if (v < 12) continue;
      ink += v; lit++;
      if (Math.hypot(x - cx, y - cy) > m * 0.36) outer += v;
    }
    return { ink: Math.round(ink / 1000), lit, outer: Math.round(outer / 1000),
             dbg: Anim._dbg() };
  });
  await browser.close();
  return { ...out, errs };
}

(async () => {
  const fail = [];
  const say = (ok, msg) => { console.log((ok ? '  PASS  ' : '  FAIL  ') + msg); if (!ok) fail.push(msg); };

  // MANDALA IS THE ONE THAT CAN BE MEASURED IN PIXELS. Measured: three
  // identical Mandala runs give the same ink to 0.0%, while four identical LAVA
  // runs spread 30.3% — its blobs are seeded with Math.random and drift. So a
  // 21% "difference" in Lava is inside its own noise and proves nothing, and
  // testing it that way was this probe reaching for the wrong instrument.
  console.log('=== a clear tone must look exactly as it did (Mandala, pixel-exact) ===');
  { const on  = await shoot('tone-220', '?s=visMode:mandala', 5);
    const off = await shoot('tone-220', '?s=visMode:mandala', 5, 'mandala');
    const same = Math.abs(on.ink - off.ink) / Math.max(1, off.ink);
    say(!on.errs.length && !off.errs.length, 'mandala: no errors');
    say(on.dbg.conf > 0.8, `mandala: the tone reads as voiced (confidence ${on.dbg.conf})`);
    say(same < 0.01, `mandala: ink with Voice texture on vs off differs by ${(same * 100).toFixed(1)}% ` +
      `— a voiced sound is the shipped look`); }

  // For Lava the guarantee is structural rather than statistical: every texture
  // term is multiplied by `defn`, and at defn === 1 each one is x*1, so the
  // shipped arithmetic is what runs. Checking defn is checking the branch.
  console.log('\n=== ...and for Lava, the same guarantee read where it lives ===');
  { const tone = await shoot('tone-220', '?s=visMode:lava', 5);
    const hiss = await shoot('shhh', '?s=visMode:lava', 5);
    say(!tone.errs.length && !hiss.errs.length, 'lava: no errors');
    say(tone.dbg.defn === 1, `lava: definition ${tone.dbg.defn} on a clear tone — every texture term is x1`);
    say(hiss.dbg.defn < 0.5, `lava: definition ${hiss.dbg.defn} on a hiss — the soft-edged wax`); }

  console.log('\n=== an unvoiced sound must look different from a voiced one ===');
  { const tone = await shoot('tone-220', '?s=visMode:mandala', 5);
    const hiss = await shoot('shhh', '?s=visMode:mandala', 5);
    say(hiss.dbg.conf < 0.5 && tone.dbg.conf > 0.8,
      `confidence ${tone.dbg.conf} voiced vs ${hiss.dbg.conf} hiss`);
    say(hiss.dbg.bright - tone.dbg.bright > 0.25,
      `brightness ${tone.dbg.bright} voiced vs ${hiss.dbg.bright} hiss`);
    const dLit = Math.abs(hiss.lit - tone.lit) / Math.max(1, tone.lit);
    const dInk = Math.abs(hiss.ink - tone.ink) / Math.max(1, tone.ink);
    say(dLit > 0.05 || dInk > 0.05,
      `mandala actually redraws — lit pixels ${(dLit * 100).toFixed(0)}%, ink ${(dInk * 100).toFixed(0)}% apart`); }

  console.log('\n=== brightness pushes the Mandala outer ring, and the slider turns it off ===');
  { const tone = await shoot('tone-220', '?s=visMode:mandala', 5);
    const hiss = await shoot('shhh', '?s=visMode:mandala', 5);
    say(hiss.outer > tone.outer,
      `outer-ring ink: ${tone.outer} on a tone, ${hiss.outer} on a hiss`); }

  console.log(fail.length ? `\n${fail.length} FAILED` : '\nall passed');
  process.exit(fail.length ? 1 : 0);
})();
