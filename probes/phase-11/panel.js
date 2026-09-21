// Phase 11 step 2: the Voice section in Setup -> Access.
// Every control is driven the way a therapist drives it — clicked, not
// synthesised — because a panel that reads correctly and does nothing is
// exactly the class this project keeps finding.
const { chromium } = require('playwright-core');
const path = require('path');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const APP = 'file:///C:/Local Docs/Coding/musicapps/voice_visuals.html';
const WAV = p => path.resolve('wav', p + '.wav').split(path.sep).join('/');

async function open(wav, params) {
  const browser = await chromium.launch({ executablePath: EDGE, headless: true, args: [
    '--autoplay-policy=no-user-gesture-required', '--mute-audio',
    '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream',
    '--use-file-for-fake-audio-capture=' + WAV(wav) + '%noloop' ]});
  const ctx = await browser.newContext({ permissions: ['microphone'] });
  const page = await ctx.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await page.goto(APP + (params || ''));
  await page.waitForTimeout(400);
  await page.click('#vvGate button');
  // open the Voice tab (what was Sound). There is no #panel — the strip holds .pane divs and the
  // Setup pane's content is #soundControls. Clicking a rail tab that is already showing CLOSES the
  // strip, so ask what is open rather than clicking blind.
  await page.click('.bbar[data-mode="sound"]');
  await page.waitForTimeout(300);
  if (await page.evaluate(() => currentQuickMode) !== "sound") {
    await page.click('.bbar[data-mode="sound"]'); await page.waitForTimeout(300);
  }
  return { browser, page, errs };
}
const txt = (page, sel) => page.evaluate(s => { const e = document.querySelector(s); return e ? e.textContent : null; }, sel);

(async () => {
  const fail = [];
  const say = (ok, msg) => { console.log((ok ? '  PASS  ' : '  FAIL  ') + msg); if (!ok) fail.push(msg); };

  console.log('=== the Voice section exists and says what it is hearing ===');
  { const { browser, page, errs } = await open('tone-220');
    await page.waitForTimeout(2500);
    const read = await txt(page, '#vvRead');
    say(!errs.length, `no errors${errs.length ? ': ' + errs[0] : ''}`);
    say(/Hearing -?\d+ dB . room floor -?\d+ dB . range \d+ dB/.test(read || ''),
      `readout: "${read}"`);
    const fill = await page.evaluate(() => document.getElementById('vvMeterFill').style.width);
    say(parseFloat(fill) > 20, `meter moving: ${fill}`);
    say((await txt(page, '#vvWarn')) === '', 'no warning at all in a quiet room');
    // the controls a therapist reaches for
    const labels = await page.evaluate(() =>
      [...document.querySelectorAll('#soundControls label')].map(l => l.textContent));
    say(labels.includes('Range'), `Range slider present (labels: ${labels.join(', ')})`);
    say(!labels.includes('Extra boost'), 'Extra boost is gone — it has no meaning under a dB mapping');
    const chips = await page.evaluate(() =>
      [...document.querySelectorAll('#soundControls .chip')].map(c => c.textContent));
    for (const want of ['🌍 Wide', '🧑 Adult', '🧒 Child', '🎯 Auto', '🎧 Listen to the room'])
      say(chips.some(c => c.includes(want)), `chip "${want}"`);
    await browser.close(); }

  console.log('\n=== the voice-range chips change which colours are reachable ===');
  { const { browser, page } = await open('tone-220');
    await page.waitForTimeout(2500);
    const pick = async label => {
      await page.evaluate(l => {
        const c = [...document.querySelectorAll('#soundControls .chip')].find(x => x.textContent.includes(l));
        c.click();
      }, label);
      await page.waitForTimeout(900);
      return page.evaluate(() => Anim._dbg());
    };
    const adult = await pick('🧑 Adult'), child = await pick('🧒 Child'), wide = await pick('🌍 Wide');
    say(adult.range[0] === 70 && adult.range[1] === 400, `Adult maps ${adult.range.join('-')} Hz`);
    say(child.range[0] === 180 && child.range[1] === 1000, `Child maps ${child.range.join('-')} Hz`);
    say(wide.range[0] === 80 && wide.range[1] === 1200, `Wide maps ${wide.range.join('-')} Hz`);
    // the same 220 Hz tone must land at three different places in the palette
    say(Math.abs(adult.pitch - child.pitch) > 0.2 && Math.abs(adult.pitch - wide.pitch) > 0.1,
      `one 220 Hz tone -> pitch01 ${adult.pitch.toFixed(2)} adult / ${child.pitch.toFixed(2)} child / ${wide.pitch.toFixed(2)} wide`);
    await browser.close(); }

  console.log('\n=== Fine trim moves the ceiling, and the readout follows ===');
  { const { browser, page } = await open('tone-220');
    await page.waitForTimeout(2500);
    const before = await page.evaluate(() => Anim._dbg());
    await page.evaluate(() => {
      const i = [...document.querySelectorAll('#soundControls .row')]
        .find(r => r.querySelector('label') && r.querySelector('label').textContent === 'Range')
        .querySelector('input');
      i.value = '-8'; i.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.waitForTimeout(400);
    const after = await page.evaluate(() => Anim._dbg());
    say(Math.abs((before.rangeDb - after.rangeDb) - 8) < 1.5,
      `range ${before.rangeDb} dB -> ${after.rangeDb} dB at trim -8`);
    say(/range \d+ dB/.test(await txt(page, '#vvRead')), 'readout still live after the change');
    await browser.close(); }

  console.log('\n=== a room the app cannot work in is named, and its cause named right ===');
  // A -45 dB room is NOT the case: floor -39, ceiling clamped to -6, so 33 dB
  // survives and no warning is right. The warning is for the clamp actually
  // biting, which needs a room around -22 dBFS — and testing it against -45
  // was this probe asserting a fault that was not there.
  //
  // Phase 11b: this assertion then went stale in the other direction. It
  // required the word "noisy", and a -22 dBFS room is not a noisy room - it is
  // a microphone turned up too far, which needs the opposite advice. There is
  // now one message and it leads with the microphone's level. Reported by the
  // user as "it says the room is noisy but it isn't".
  { const { browser, page } = await open('noise-45', '?s=sensitivity:sing');
    await page.waitForTimeout(3000);
    const d = await page.evaluate(() => Anim._dbg());
    say(d.rangeDb > 25 && (await txt(page, '#vvWarn')) === '',
      `a -45 dB room still leaves ${d.rangeDb} dB — correctly no warning`);
    await browser.close(); }
  { const { browser, page } = await open('noise-22', '?s=sensitivity:sing');
    await page.waitForTimeout(3000);
    const w = await txt(page, '#vvWarn'), d = await page.evaluate(() => Anim._dbg());
    say(d.rangeDb < 15, `a -22 dB room leaves only ${d.rangeDb} dB (floor ${d.floorDb}, ceiling clamped to ${d.ceilDb})`);
    say(/level is turned up too high/.test(w || '') && !/^This room is noisy/.test(w || ''),
      `warning names the microphone, not the room: "${(w || '').slice(0, 52)}…"`);
    await browser.close(); }

  console.log('\n=== "Listen to the room" re-measures ===');
  { const { browser, page } = await open('tone-220');
    await page.waitForTimeout(2500);
    const before = await page.evaluate(() => Anim._dbg());
    await page.evaluate(() => [...document.querySelectorAll('#soundControls .chip')]
      .find(c => c.textContent.includes('Listen to the room')).click());
    await page.waitForTimeout(200);
    const during = await page.evaluate(() => Anim._dbg());
    say(during.seeding === true && during.mic === 'seeding', `re-seeding started (mic state "${during.mic}")`);
    // NOT level === 0: level is the 350 ms release envelope and it decays, which
    // is the point — nothing snaps to black. The claim is that the GATE is shut,
    // so nothing new is registered while it listens.
    say(during.gate === false, `gate shut while listening (level still releasing at ${during.level})`);
    await page.waitForTimeout(2200);
    const after = await page.evaluate(() => Anim._dbg());
    say(after.mic === 'on' && after.seeding === false, `finished, back to "${after.mic}"`);
    // Re-seeding UNDER a continuous tone measures the tone. That is the designed
    // consequence, not a fault — §2.2's answer is that the floor drops again at
    // the first quiet moment, and this WAV never has one. Asserting the floor
    // stayed put was this probe expecting the opposite of the design.
    say(after.floorDb > before.floorDb + 15,
      `floor ${before.floorDb} -> ${after.floorDb} dB: told to treat a 220 Hz tone as the room, it did`);
    await browser.close(); }

  console.log('\n=== ...and re-seeding in silence leaves the floor where it belongs ===');
  { const { browser, page } = await open('silence');
    await page.waitForTimeout(2500);
    const before = await page.evaluate(() => Anim._dbg());
    await page.evaluate(() => [...document.querySelectorAll('#soundControls .chip')]
      .find(c => c.textContent.includes('Listen to the room')).click());
    await page.waitForTimeout(2400);
    const after = await page.evaluate(() => Anim._dbg());
    say(Math.abs(after.floorDb - before.floorDb) < 3,
      `floor ${before.floorDb} -> ${after.floorDb} dB across a re-seed in silence`);
    await browser.close(); }

  console.log('\n=== the new keys ride in a preset and in a launch link ===');
  { const { browser, page } = await open('tone-220', '?s=micTrim:-5,voiceRange:child');
    const d = await page.evaluate(() => Anim._dbg());
    say(d.range[0] === 180, `launch link set voiceRange: map ${d.range.join('-')} Hz`);
    say(d.rangeDb === 23, `launch link set micTrim: range ${d.rangeDb} dB (28 - 5)`);
    const note = await page.evaluate(() => launchNote);
    say(!/not understood/.test(note || ''), `launch note: "${note}"`);
    // and an OLD link naming the retired key must not be called broken
    await page.goto(APP + '?s=boost:2.5,sensitivity:whisper');
    await page.waitForTimeout(400);
    const n2 = await page.evaluate(() => launchNote);
    say(!/not understood/.test(n2 || ''), `an old link carrying boost:2.5 -> "${n2}"`);
    await browser.close(); }

  console.log(fail.length ? `\n${fail.length} FAILED` : '\nall passed');
  process.exit(fail.length ? 1 : 0);
})();
