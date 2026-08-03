---
name: verify
description: Verify a Music Room app change by driving the real page in a headless browser and observing canvas/DOM/audio state.
---

# Verifying Music Room apps

All apps are static offline pages (`file://` capable) built on `framework.js`. No build step, no server.

## Handle

Playwright-core + system Edge (no bundled browsers installed):

```js
const { chromium } = require('playwright-core');
const browser = await chromium.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: true,
  args: ['--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto('file:///C:/Local%20Docs/Coding/MusicTherapy/music-room/<app>.html');
```

The repo path contains a space — it must be `%20` in the `file://` URL or the page silently
fails to load. Use 1920×1080 when the change is about how something reads on the projector.

Set up once per session: `npm init -y && npm install playwright-core` in the scratchpad.

Write the script with the Write tool, not a bash heredoc — a heredoc eats the backslashes in the
Edge executable path and you get "executable doesn't exist at C:Program FilesMicrosoft...".

## Observing

- Framework globals (`SETTINGS`, `audioCtx`, `soundingVoices`, `pointers`, `NOTES`, `bgRGB`,
  `applyBg`, `pokeSim`) are top-level `let`/`const` in a classic script — reachable from
  `page.evaluate(() => SETTINGS.foo)`.
- State inside the `Anim` IIFE is NOT reachable directly, but `Anim` itself is, so **anything the
  app hangs off the returned object is fair game**. Several apps expose `Anim._dbg()` for exactly
  this (`voice_visuals` reports mic state, level, pitch, and per-style internals). Add to `_dbg()`
  rather than inventing a test-only seam. `Anim.railButtons[n].onClick()` works too.
- Driving the app: set `SETTINGS.<key>` directly and call `pokeSim()`. This is far more reliable
  than clicking through panels and is how most checks should be written.
- Audio can't be heard headless — assert `audioCtx.state === 'running'` and `soundingVoices`
  rising after an interaction. The master chain (limiter/automixer) is shared framework code.
- Sweeps: `mouse.down()` then step `mouse.move()` across with ~12 ms waits (the input loop and
  most apps sample per frame).
- Menu: there is no `#collapse` — that went in the wall-touch UI redesign. The rail is plain
  `button` elements found by their text (Voice / Sound / Visuals / Presets / Mic / Lock):
  ```js
  for (const b of await page.$$('button'))
    if (/Visuals/i.test(await b.innerText())) { await b.click(); break; }
  ```
  Panel controls are `.chips .chip`, `.toggle .switch`, `.row input[type=range]` (dispatch `input`).
  Reading `.chips .chip` text is a good way to assert a style was really added or retired.
- Collect `page.on('pageerror')` and console errors — a clean run prints none.
- Pixel-level checks are available and worth it for "does this colour actually match" questions:
  `canvas.getContext('2d').getImageData(...)` and histogram the result.

## Faking the microphone (`voice_visuals`)

Launch with `--use-fake-device-for-media-stream --use-fake-ui-for-media-stream` and grant
`permissions: ['microphone']` on the context. The fake device alone produces almost no usable
signal, so patch the analyser to synthesise one, then turn the mic on via the rail button:

```js
await page.evaluate(() => {
  AnalyserNode.prototype.getByteFrequencyData = function (b) { /* spectrum */ };
  AnalyserNode.prototype.getFloatTimeDomainData = function (b) { /* waveform */ };
  Anim.railButtons[0].onClick();          // the mic toggle
});
```

For **pitch**, the waveform must be genuinely periodic at the frequency you intend
(`2π·hz/audioCtx.sampleRate` per sample) — autocorrelation will not lock onto a hand-waved
`sin(i*0.2)` and you will misread a correct app as broken. Sanity-check with `_dbg().pitch`
before concluding anything about pitch behaviour. 440 Hz reads ≈0.74; the detector octave-errors
around 880 Hz, which is pre-existing and not worth chasing.

## Gotchas

- **The mic gate blocks the canvas.** Until the mic is on, `voice_visuals` covers the page with a
  "Tap to turn on the microphone" overlay, so every mouse event lands on a `<button>` and no
  pointer ever reaches the app — touch tests silently do nothing. Turn the mic on first.
- **A held-but-still touch emits no `splat()`.** The framework only calls `Anim.splat()` when a
  pointer *moves* (`framework.js` input loop), so press-and-hold behaviour must be read off
  `pointers` instead. When testing a hold, hold *without moving* — moving hides the bug.
- Quick `page.mouse.click()` is sub-frame: a pointer can appear and vanish between two rAF
  frames, so frame-loop-based input never sees it. Apps must handle taps on the down event;
  when testing taps, this is a real-bug signal, not test flakiness.
- The sim sleeps ~20 s after the last activity and stops calling `Anim.frame()`. Long waits in a
  test can therefore freeze the picture rather than settle it — poke it or keep the mic fed.
- Watch for metrics that are pinned by construction: e.g. "minimum z across all stars" never moves
  in a starfield, because some star is always about to respawn. Probe a specific element instead.
- Each `chromium.launch()` gets a fresh profile — localStorage starts empty (good for
  default-state tests; reload the same page to test persistence).
- Settings persist per filename (`settings:<file>.html`), so testing a renamed copy isolates state.
  Writing a retired value into `settings:<file>.html` and reloading is the way to check that stale
  saved settings degrade gracefully instead of bricking the app.
