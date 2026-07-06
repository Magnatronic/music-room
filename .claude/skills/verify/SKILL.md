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
await page.goto('file:///C:/Coding/MusicTherapy/<app>.html');
```

Set up once per session: `npm init -y && npm install playwright-core` in the scratchpad.

## Observing

- Framework globals (`SETTINGS`, `audioCtx`, `soundingVoices`, `pointers`, `NOTES`) are top-level
  `let`/`const` in a classic script — reachable from `page.evaluate(() => SETTINGS.foo)`.
  App-internal state inside the `Anim` IIFE is NOT reachable; observe via DOM/settings/voices instead.
- Audio can't be heard headless — assert `audioCtx.state === 'running'` and `soundingVoices`
  rising after an interaction. The master chain (limiter/automixer) is shared framework code.
- Sweeps: `mouse.down()` then step `mouse.move()` across with ~12 ms waits (the input loop and
  most apps sample per frame).
- Menu: `page.click('#collapse')` opens the rail menu (instrument pane by default). Panel
  controls are `.chips .chip`, `.toggle .switch`, `.row input[type=range]` (dispatch `input`).
- Collect `page.on('pageerror')` and console errors — a clean run prints none.

## Gotchas

- Quick `page.mouse.click()` is sub-frame: a pointer can appear and vanish between two rAF
  frames, so frame-loop-based input never sees it. Apps must handle taps on the down event;
  when testing taps, this is a real-bug signal, not test flakiness.
- Each `chromium.launch()` gets a fresh profile — localStorage starts empty (good for
  default-state tests; reload the same page to test persistence).
- Settings persist per filename (`settings:<file>.html`), so testing a renamed copy isolates state.
