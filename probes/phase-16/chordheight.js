// HOW MANY NOTES DOES ONE TAP PLAY, AT EACH HEIGHT?
//
// Two brightness runs said midi_chords gives LESS at the top, the opposite of the
// report, and both were measuring the wrong thing. The difference a person
// notices in this app is not the size of the picture, it is HOW MANY NOTES COME
// OUT: chordFor() picks the chord from velocity (<0.30 one, <0.55 two, <0.80
// three, else four) and a touch's velocity is its height, 0.35 + 0.6*y.
//
// So count the notes. `towers` is not exposed, but each tower carries its `cols`,
// and every note started is a voice in the framework's own map - so count the
// voices sounding while the finger is still down.
const { chromium } = require('playwright-core');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const DIR = 'file:///C:/Local Docs/Coding/musicapps/';

(async () => {
  const b = await chromium.launch({ executablePath: EDGE, headless: true,
    args: ['--autoplay-policy=no-user-gesture-required','--mute-audio'] });
  const W = 1000, H = 700;
  const rows = [];
  for (const app of ['midi_chords.html','midi_light.html','midi_mirror.html']) {
    for (const pct of [0.95, 0.75, 0.5, 0.25, 0.05]) {     // 0.95 = near the BOTTOM
      const page = await b.newPage({ viewport: { width: W, height: H } });
      await page.goto(DIR + app + '?lock=1');
      await page.waitForTimeout(800);
      await page.mouse.move(W*0.5, H*pct);
      await page.mouse.down();
      await page.waitForTimeout(200);
      // Count while the finger is DOWN - a released note is still fading out.
      const n = await page.evaluate(() => {
        try { return (typeof voices !== 'undefined')
          ? (voices.size !== undefined ? voices.size : Object.keys(voices).length) : -1; }
        catch (e) { return -1; }
      });
      await page.mouse.up();
      await page.close();
      rows.push({ app, screenY: pct, notes: n });
    }
  }
  await b.close();
  console.log('one tap, held, counting the notes it started');
  console.log('');
  let last = '';
  for (const r of rows) {
    if (r.app !== last) { console.log(''); console.log(r.app); last = r.app; }
    const where = r.screenY > 0.8 ? 'bottom of the screen'
                : r.screenY > 0.6 ? 'lower'
                : r.screenY > 0.4 ? 'middle'
                : r.screenY > 0.2 ? 'upper' : 'top of the screen';
    console.log('  ' + where.padEnd(22) + (r.notes < 0 ? 'could not read' : r.notes + ' note' + (r.notes === 1 ? '' : 's')));
  }
})();
