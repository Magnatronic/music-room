// Phase 11 probe. Drives the real page in Edge with a fake microphone fed from
// a WAV file. Every run must finish WELL BEFORE its WAV ends — when the file
// runs out, Chromium's fake device falls back to its own beep and the tail of
// the run is junk that reads as a loud tone. That cost four wrong answers.
const { chromium } = require('playwright-core');
const path = require('path');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const APP = 'file:///C:/Local Docs/Coding/musicapps/voice_visuals.html';
const WAV = p => path.resolve('wav', p + '.wav').split(path.sep).join('/');

async function run(wav, secs, params) {
  const browser = await chromium.launch({ executablePath: EDGE, headless: true, args: [
    '--autoplay-policy=no-user-gesture-required', '--mute-audio',
    '--use-fake-ui-for-media-stream',
    '--use-fake-device-for-media-stream',
    '--use-file-for-fake-audio-capture=' + WAV(wav) + '%noloop',
  ]});
  const ctx = await browser.newContext({ permissions: ['microphone'] });
  const page = await ctx.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await page.goto(APP + (params || ''));
  await page.waitForTimeout(400);
  await page.click('#vvGate button');
  const rows = [];
  const n = Math.round(secs * 10);
  for (let i = 0; i < n; i++) {
    await page.waitForTimeout(100);
    rows.push(await page.evaluate(() => Anim._dbg()));
  }
  await browser.close();
  return { rows, errs };
}
const max = (rows, k) => rows.reduce((a, r) => Math.max(a, r[k]), -1e9);
const late = rows => rows.slice(Math.floor(rows.length * 0.55));
const med = (rows, k) => { const v = rows.map(r => r[k]).sort((a, b) => a - b); return v[v.length >> 1]; };

(async () => {
  const R = {}, fail = [];
  const say = (ok, msg) => { console.log((ok ? '  PASS  ' : '  FAIL  ') + msg); if (!ok) fail.push(msg); };

  console.log('\n=== F1/F4 pitch: six tones, voiceRange wide (80-1200 Hz) ===');
  for (const [w, f] of [['tone-110',110],['tone-220',220],['tone-350',350],
                        ['tone-700',700],['tone-900',900],['tone-1150',1150]]) {
    const { rows, errs } = await run(w, 7);
    const L = late(rows), f0 = med(L, 'f0'), p = med(L, 'pitch');
    const cents = 1200 * Math.log2(f0 / f);
    R[w] = { f0, p };
    say(Math.abs(cents) < 50 && !errs.length,
      `${w}: f0 ${f0.toFixed(1)} Hz (${cents >= 0 ? '+' : ''}${cents.toFixed(0)} cents), pitch01 ${p.toFixed(3)}` +
      (errs.length ? '  ERRORS: ' + errs[0] : ''));
  }
  // The gate is the TOP of the map. The old detector stopped at 600 Hz against a
  // map that ran to 800, so pitch01 could not pass 0.875 whatever was sung.
  const spread = R['tone-1150'].p - R['tone-110'].p;
  say(R['tone-1150'].p > 0.95 && spread > 0.8,
    `palette reaches ${R['tone-1150'].p.toFixed(3)} at 1150 Hz (old ceiling was 0.875), spread ${spread.toFixed(3)}`);

  console.log('\n=== F1 pitch in a noisy room: 220 Hz at 12 dB SNR ===');
  { const { rows } = await run('tone-noisy', 7);
    const f0 = med(late(rows), 'f0');
    say(Math.abs(1200 * Math.log2(f0 / 220)) < 50,
      `f0 ${f0.toFixed(1)} Hz — the old detector read 100.2 Hz here`); }

  // F2's real claim is NOT "more range" in the abstract — it is that the three
  // sensitivity chips now choose DIFFERENT spans. The old mapping gave exactly
  // 26.0 dB whichever chip was picked; the chip only slid the window up and
  // down. So the gate is three spans, matching their settings, from one ramp.
  console.log('\n=== F2 level: the three sensitivities must give three spans ===');
  // The span is read from the floor and ceiling the app reports, NOT from where
  // `level` crosses 0.02 and 0.995. Reading it from the crossings measures the
  // 100 ms sampling grid against a ramp moving 3.75 dB/s, and a single missed
  // row moves the answer 3 dB — which is exactly the wrong answer this probe
  // gave first time round.
  { const want = { whisper: 18, talk: 28, sing: 40 }, got = {};
    for (const s of ['whisper', 'talk', 'sing']) {
      const { rows } = await run('ramp', 11, '?s=sensitivity:' + s);
      const settled = rows.filter(r => !r.seeding && r.floorDb > -60);
      const r0 = settled[settled.length - 1];
      const span = r0.ceilDb - r0.floorDb;
      got[s] = span;
      const lv = rows.map(r => r.level);
      let drops = 0; for (let i = 1; i < rows.length; i++) if (lv[i] < lv[i-1] - 0.02) drops++;
      // and the level must actually FOLLOW that scale, not merely be bounded by
      // it. The first 400 ms after the gate opens are skipped: `level` is the
      // 50 ms attack envelope catching up to a step, so it legitimately sits
      // below the instantaneous reading there. That transient — not the mapping
      // — is the whole of the 0.07 this measured before it was excluded.
      let worst = 0, open = 0;
      for (const r of settled) {
        if (r.level <= 0 || r.level >= 1) { open = 0; continue; }
        if (++open <= 4) continue;
        const u = (r.dbfs - r.floorDb) / (r.ceilDb - r.floorDb);
        worst = Math.max(worst, Math.abs(r.level - Math.pow(Math.max(0, Math.min(1, u)), 0.6)));
      }
      say(Math.abs(span - want[s]) < 1 && drops <= 2 && worst < 0.03,
        `${s}: floor ${r0.floorDb.toFixed(1)} → ceiling ${r0.ceilDb.toFixed(1)} dBFS = ${span.toFixed(1)} dB (set to ${want[s]}); ` +
        `level tracks u^0.6 to ${worst.toFixed(3)}; ${drops} downward steps`);
    }
    say(got.sing - got.whisper > 15,
      `the chips actually change the span: ${got.whisper.toFixed(1)} / ${got.talk.toFixed(1)} / ${got.sing.toFixed(1)} dB (old code: 26.0 / 26.0 / 26.0)`); }

  console.log('\n=== F6 the room floor ===');
  { const { rows } = await run('silence', 9);
    say(max(rows, 'level') < 0.001 && !rows.some(r => r.gate),
      `silent device: peak level ${max(rows, 'level').toFixed(4)}, gate never opened`); }
  { const { rows } = await run('noise-45', 10);
    const f = rows[rows.length - 1].floorDb - 6;
    say(Math.abs(f + 45) < 3, `-45 dB room: floor measured ${f.toFixed(1)} dBFS (true -45.0)`);
    let flips = 0; for (let i = 1; i < rows.length; i++) if (rows[i].gate !== rows[i-1].gate) flips++;
    say(flips <= 2, `gate chatter across 10 s of steady noise: ${flips} transitions`);
    say(rows[rows.length - 1].rangeDb > 10, `range left in a -45 dB room: ${rows[rows.length-1].rangeDb.toFixed(1)} dB`); }

  console.log('\n=== F5 voiced vs unvoiced ===');
  { const s = late((await run('shhh', 7)).rows), v = late((await run('tone-220', 7)).rows);
    const sc = med(s, 'conf'), vc = med(v, 'conf'), sb = med(s, 'bright'), vb = med(v, 'bright');
    say(sc < 0.5 && vc > 0.8, `voicing confidence: hiss ${sc.toFixed(2)}, tone ${vc.toFixed(2)} (trust gate 0.50)`);
    // An ABSOLUTE brightness threshold would be testing my synthesis, not the
    // code: these harmonic stacks have no vocal-tract rolloff, so they sit far
    // brighter than a real voice. The separation is the claim.
    say(sb - vb > 0.25, `brightness: hiss ${sb.toFixed(2)} vs tone ${vb.toFixed(2)} (separation ${(sb-vb).toFixed(2)})`); }

  // F7: with a 2048-point FFT the log-spaced bands below 295 Hz all read the
  // same handful of 23 Hz bins, so the bottom third of the Mandala moved as a
  // block. The gate is that adjacent LOW bands now carry different values on a
  // voice whose harmonics are spaced widely enough to resolve.
  console.log('\n=== F7 the low bands must resolve ===');
  { const { rows } = await run('tone-110', 7, '?s=visMode:mandala');
    const L = late(rows).filter(r => r.bands && r.bands.length >= 24);
    if (!L.length) { say(false, 'no band data — is the mode mandala?'); }
    else {
      // Counting IDENTICAL neighbours is the wrong metric and it gave the wrong
      // answer: resolved bands show real GAPS between a 110 Hz voice's
      // harmonics, and two adjacent zeros are two adjacent equal numbers. What
      // separates resolution from smear is CONTRAST — an unresolved low end
      // spreads one blob across every bar, so its quietest bar is still loud.
      const b = L[L.length >> 1].bands, lo = b.slice(0, 16);
      const hi = Math.max.apply(null, lo), min = Math.min.apply(null, lo);
      const ratio = hi > 0 ? min / hi : 1;
      say(ratio < 0.15, `bottom 16 bars of ${b.length}: quietest/loudest = ${ratio.toFixed(2)} ` +
        `(old code measured 0.45 — a smear with no gaps) [${lo.map(v => v.toFixed(2)).join(' ')}]`);
    } }

  console.log('\n=== F9 seven claps still make rings (Ripples) ===');
  { const { rows, errs } = await run('claps', 11, '?s=visMode:ripples');
    say(!errs.length, `no errors${errs.length ? ': ' + errs[0] : ''}`);
    say(max(rows, 'rings') > 0, `rings fired, peak concurrent ${max(rows, 'rings')} — the count of SEVEN is a UAT judgement, not this`); }

  console.log(fail.length ? `\n${fail.length} FAILED` : '\nall passed');
  process.exit(fail.length ? 1 : 0);
})();
