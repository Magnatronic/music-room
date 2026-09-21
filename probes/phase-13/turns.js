// DOES THE BIRD CUT THE STUDENT OFF?
//
// The claim, from reading the code: in Free mode the student's turn ends on a
// NOTE COUNT — `if(reply.length >= call.length)` — so a 3-note call gives the
// student exactly 3 notes before the bird judges and takes its turn back. The
// design doc promises the bird "waits forever", and it does wait forever for a
// reply to START; the question is whether it waits for one to FINISH.
//
// The conversation is started through `Anim.railButtons`, which is the same
// object the rail renders, rather than by hunting for a button by its label.
// Replies go through `Anim.onCell`, which IS the framework's own reply path for
// this app — the fault under test is in the reply bookkeeping, not in how a
// pointer becomes a cell, so driving it here is honest. It would NOT be honest
// for a question about touch.
// READ THE `free` ROWS, NOT THE `copy` ONES. Copycat ends the student's turn
// when they complete the copy, and the call here is RANDOM while this probe
// plays notes 0,1,2 in a cycle - so whether the student ever hits the called
// note varies run to run. Two runs of this file gave "copy 1 -> 2 notes, cut at
// 3" and "copy 1 -> 8 notes, never", and both were correct behaviour. The free
// rows are deterministic and are what the fix is about; copy mode's code path is
// untouched apart from recording the note's time.
const { chromium } = require('playwright-core');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const APP = 'file:///C:/Local Docs/Coding/musicapps/echo_bird.html';

const state = page => page.evaluate(() => {
  const b = document.getElementById('ebBird');
  return b ? b.dataset.s : 'none';
});

(async () => {
  const browser = await chromium.launch({
    executablePath: EDGE, headless: true,
    args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'],
  });
  console.log('A student plays 8 notes, one every 350 ms, into a call of N notes.');
  console.log('"got" = notes played while it was still the student\'s turn.');
  console.log('');
  console.log('mode  call notes   student got   bird took over after');
  for (const mode of ['free', 'copy']) {
    for (const len of [1, 3, 5]) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
      const errs = [];
      page.on('pageerror', e => errs.push('pageerror: ' + e.message));
      page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
      await page.goto(APP + '?s=birdMode:' + mode + ',phraseLen:' + len + ',callFrom:random&lock=1');
      await page.waitForTimeout(600);
      await page.evaluate(() => {
        const b = (Anim.railButtons || []).find(x => x.id === 'ebplay');
        if (b) b.onClick();
      });
      let waited = 0, ok = false;
      while (waited < 12000) {
        if (await state(page) === 'waiting') { ok = true; break; }
        await page.waitForTimeout(120); waited += 120;
      }
      if (!ok) {
        console.log(mode.padEnd(6), String(len).padStart(5), '    never handed over');
        await page.close(); continue;
      }
      let got = 0, cutAt = null;
      for (let i = 0; i < 8; i++) {
        const st = await state(page);
        if (st === 'waiting') got++;
        else if (cutAt === null) cutAt = i;
        await page.evaluate(n => Anim.onCell(n % 3, 0), i);
        await page.waitForTimeout(350);
      }
      await page.close();
      console.log(mode.padEnd(6), String(len).padStart(5), '       ', String(got).padStart(6),
        '        ', cutAt === null ? 'never (good)' : 'note ' + (cutAt + 1),
        errs.length ? '  ERRORS ' + errs[0] : '');
    }
  }
  await browser.close();
})();
