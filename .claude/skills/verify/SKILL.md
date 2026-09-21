---
name: verify
description: Verify a Music Room app change by driving the real page in a headless browser and observing canvas/DOM/audio state.
---

# Verifying Music Room apps

All apps are static offline pages (`file://` capable) built on `framework.js`. No build step, no server.

**The probe folders have no `node_modules` any more** (cleared 2026-09-06, with 188 MB of
regenerable data: four copies of playwright-core, 120 MB of generated test `wav/`, and the `raw/`
screenshot dumps). The scripts are all still here. Before running one:
`cd probes/<phase> && npm i playwright-core`, or point Node at another phase's copy with
`NODE_PATH=../phase-15/node_modules`. The fake-microphone gates also need their `wav/` files
regenerating - the generator is described below.

**Where the pages are** (2026-09-06): the room build is the top level — the launcher and the 20
activity files the launcher lists. The other six pages moved one folder down and the gate walks
all three folders: `archive/` holds `beat_builder.html`, `conductor.html` and `fluid_paint.html`;
`bench/` holds `template.html`, `fx_lab.html` and `sound-test.html`. They load the framework from
`../`. **It is still 27 pages** — a page nobody launches can still be the page that proves a
shared file broke, which is the whole reason they are in the gate.

## Handle

**Two browsers, not one.** Everything through 2026-08-27 was gated in **Edge only**,
and the user reported a fault that appeared in **Firefox**. The load gate now runs
in both. Firefox needs Playwright's own patched build (stock `firefox.exe` will not
drive) — `npx playwright-core install firefox`, then `require('playwright-core').firefox.launch()`.
Both were clean at 21/21 on 2026-08-28.

Playwright-core + system Edge (no bundled browsers installed):

```js
const { chromium } = require('playwright-core');
const browser = await chromium.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: true,
  args: ['--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto('file:///C:/Local Docs/Coding/musicapps/<app>.html');
```

Set up once per session: `npm init -y && npm install playwright-core` in the scratchpad.

## Observing

- **Launch parameters** (`PHASE-6`): `app.html?s=noteCount:5,voice:synth&lock=1`, and
  `#hash` works too. `launchLink(true|false)`, `settingsDiff()`, `applySettingsParam()`
  and `launchNote` are all top-level and reachable from `page.evaluate`. A link with
  `s=` resets to the app's defaults first, so it is the cheapest way to put a page
  into a known state. It will **not** set `uiScale` or any access key — those are
  refused by design.
- Framework globals (`SETTINGS`, `audioCtx`, `soundingVoices`, `pointers`, `NOTES`) are top-level
  `let`/`const` in a classic script — reachable from `page.evaluate(() => SETTINGS.foo)`.
  App-internal state inside the `Anim` IIFE is NOT reachable; observe via DOM/settings/voices instead.
- Audio can't be heard headless — assert `audioCtx.state === 'running'` and `soundingVoices`
  rising after an interaction. The master chain (limiter/automixer) is shared framework code.
- Sweeps: `mouse.down()` then step `mouse.move()` across with ~12 ms waits (the input loop and
  most apps sample per frame).
- Menu: the rail tabs are `.bbar[data-mode="instrument"|"sound"|"visuals"|"presets"]` — clicking
  one opens that pane in `#strip`. **There is no `#panel`** — this line said there was until
  2026-09-03, when a Phase 11 probe selected `#panel .chip`, found nothing, and reported five
  missing controls that were all present. `#strip` holds one `.pane` per tab, and each pane's
  content is its own id: `appContent`, `instrumentContent`, `soundControls`, `visualsContent`,
  `presetsContent`, `setupContent`. Select the content div, not a panel. (There is no `#collapse`; it was removed in the 2026-07 UI
  pass and this line described it until 2026-08-24.) Panel controls are `.chips .chip`,
  `.toggle .switch`, `.row input[type=range]` (dispatch `input`). **Every control is on the
  pane** — the `details.finetune` drawer that set-once controls hid in went in Phase 4c, so
  nothing needs opening first. Some panes are taller than the strip and scroll; use
  `scrollIntoViewIfNeeded()` rather than assuming a control is in view.
- **Every chip in a group is rendered.** The `CHIP_CAP=8` collapse (four options
  plus an "All N" expander, on Voice and on Voice Visuals' Style) went on
  2026-08-26 — a probe that clicks `.chip.more` first now finds nothing.
- **The tab set varies per app, so never assume five.** `.bbar[data-mode=...]`
  may include `app` (first, when `Anim.buildApp` exists) and may be missing
  `instrument` (Drums, Sampler, Voice Visuals have no scale to set). Read
  `[...document.querySelectorAll('#tabs .bbar')].map(x=>x.dataset.mode)` rather
  than hard-coding the list.
- **Two heading classes, and they mean different things.** `.sectn` groups several
  controls ("Effects"); `.ctlh` labels exactly one ("Scale", "Voice"). Selecting
  `.sectn` to find a chip group's label stopped working in Phase 4c's follow-up.
- **The Y-axis row writes two settings keys.** `Up / down means…` carries
  `▦ 2 octaves | ▦ 3 octaves | Loudness | Brightness | Nothing`; an octave chip
  sets `SETTINGS.yAxis='octaves'` *and* `SETTINGS.octaveRows`. There is no
  separate "How many octaves" row to click.
- **Clicking the rail tab that is already showing CLOSES the strip** (`showQuickMode`). Probing
  the same pane twice in a loop silently measures a closed pane and returns zeros — click, then
  re-click if `currentQuickMode` is not what you asked for.
- **`Anim.lockMode` is a string in some apps and `true` in others.** `framework.js:130` uses it
  as a mode name, `framework.js:1035` as a flag, so `typeof x === 'string'` and `!!x` classify
  different sets of apps. Pick the one that matches what you are testing.
- Collect `page.on('pageerror')` and console errors — a clean run prints none.

## Measuring: four traps that each cost a wrong answer here

These are not style points — each one produced a confident, wrong result before it
was caught. 2026-08-30/31.

- **Drive the gesture the user described.** Two correct fixes shipped for the wrong
  fault because the reported gesture ("clicking repeatedly on a chime") was never
  reproduced — a minute of doing exactly that showed the branch had changed nothing.
- **Sound and pixels are downstream of the thing you are testing.** A meter check
  kept failing because *bubbles drifted through the sampled strip*; bubbles only
  sing if one is under the point; a chime only rings if the point is on a bar.
  Either measure the mechanism the change touches (wrap `Anim.splat` and count
  `velScale===0` calls; wrap the global `toLocal` to read the point a handler used),
  or make the confound impossible by construction — side-drift and the smallest
  bubbles cannot reach the meter strip.
- **Measure a decaying effect while it is still lit.** A chimes cost of 0.29 ms was
  of bars that had gone dark 400 ms after the sweep ended.
- **A "worst case" must come from the real slider range.** A Life benchmark set
  `speed:1` — near the minimum of a slider that goes to 20 — while calling itself
  worst case. Read the app's `schema` for the true min/max.

- **A whole-canvas reading measures the biggest thing on the canvas, which is
  rarely what you are testing.** Asking "did the light land under the finger" in
  the six MIDI apps gave three different wrong answers before it gave a right
  one: the centroid of everything lit measured a half-screen wash; a higher
  threshold measured a caption; two touches differenced measured the FIRST
  mark drifting between the snapshots. What works is one touch on a still screen
  — the app's own movement and captions turned off — differenced against the
  frame immediately before it. Turn off everything that moves or writes, then
  measure only what the gesture ADDED.

**And before believing a test that has started failing, run it against `main`.**
The chimes sweep check went 6/7 twice during Phase 6 and both times `main` produced
the same spread: the assertion was too tight, not the code broken.

**Compositing artifacts are invisible to this harness — not just slow.** Playwright
runs a software rasteriser, so anything that only goes wrong when a real GPU
composites the page cannot be reproduced here AT ALL. Sound Match's card flip
(`transform-style:preserve-3d`) drew dark tile seams across the cards on the
user's machine; a detector that scanned inside every card for a dark line
against its own background, at three device pixel ratios, on flipped cards and
on a finished board, **passed on the broken build exactly as it passed on the
fixed one**. Three fixes were "confirmed" in an environment that never showed
the fault. If a user reports something visual you cannot reproduce, do not keep
patching: **delete the mechanism**. The 3D flip became a 2D squash and the whole
class of fault went with it. And say plainly that a fix is unverified — a green
run against a bug the harness cannot see is not evidence.

**WebGL apps cannot be benchmarked headless.** `slime`, `fluid_paint` and
`fluid_sensory` run on swiftshader, so any frame rate measures a software
rasteriser, not the room's GPU.

## Gotchas

- Quick `page.mouse.click()` is sub-frame: a pointer can appear and vanish between two rAF
  frames, so frame-loop-based input never sees it. Apps must handle taps on the down event;
  when testing taps, this is a real-bug signal, not test flakiness.
- Each `chromium.launch()` gets a fresh profile — localStorage starts empty (good for
  default-state tests; reload the same page to test persistence).
- Settings persist per filename (`settings:<file>.html`), so testing a renamed copy isolates state.
- `soundingVoices` counts **fading tails**, not just audible notes (`framework.js:244`). A
  reading of 1 a second after release is a release tail completing, not a stuck note — the
  default release runs ~1.75 s (`rel*7`). Sample at +5 s before calling anything stuck.
- **Conductor legitimately holds a voice at rest.** `buildVoice()` keeps a sustained oscillator
  alive and drives its *gain* from motion, so `soundingVoices` stays at 1 indefinitely with the
  voice silent at 0.0001. That avoids a click each time movement resumes. Not a leak.
- Apps needing an input the harness can't supply report `audio=not-created` on a bare centre
  tap: `voice_visuals` (microphone), `sampler` (a pad must be recorded first), `beat_builder`
  (a step must be filled). `index` and `fx_lab` have no audio by design.
## Driving the access work (Phase 5a/5b/5c)

A gamepad is faked by replacing `navigator.getGamepads` in `page.addInitScript`, so
it is installed **before page script** and the framework sees it from the first
poll. Return a fresh object each call — the framework reads `.buttons[b].pressed`
and `.axes` every frame, and a frozen snapshot never changes:

```js
await page.addInitScript(() => {
  window.__pad = { axes:[0,0,0,0], buttons:new Array(17).fill(0) };
  const mk = () => ({ id:'Fake Pad (STANDARD GAMEPAD)', index:0, connected:true,
    mapping:'standard', timestamp:performance.now(), axes:window.__pad.axes.slice(),
    buttons:window.__pad.buttons.map(v=>({pressed:v>0.5, touched:v>0.5, value:v})) });
  navigator.getGamepads = () => [mk(), null, null, null];
  window.dispatchEvent(new Event('gamepadconnected'));
});
```

Then drive it with `page.evaluate(a => { window.__pad.axes = a; }, [0.9,0.4,0,0])`.
`mapping:'standard'` is what makes buttons report by name — a real XAC does report
it (confirmed on hardware 2026-08-30), so the fake matches the hardware.

- **The setting key is `padOn`, not `padPointer`.** Writing an unknown key to
  `SETTINGS` fails silently and the pointer never appears. The access keys are
  `padOn, padButton, padSpeed, padDead, padAuto, dwellPad, dwellPadMs, dwellMouse,
  dwellMouseMs, bigPointer, bind`.
- **`.padcur` matches TWO different rings.** The pad cursor is `.padcur`; the mouse
  ring is `.padcur big`, and it exists but is `display:none` whenever no mouse ring
  is wanted. `document.querySelector('.padcur')` may hand you the hidden mouse one
  — use `.padcur:not(.big)` for the pad ring.
- **A modal suspends the pad pointer** (`class="modal"` on a body-level overlay).
  If the pointer mysteriously stops responding, check nothing left a `.modal` in
  the DOM.
- **`keyLastFire`** is a top-level object keyed by rail id — the cleanest proof a
  bound key or button actually fired its action.
- **Park the pointer off-centre before testing anything about its position.** A
  pad pointer is created at the canvas centre, so "resumed where it was" and "reset
  to the centre" read identically if you never moved it first.

- **`sound-test.html` is the engine bench** and needs neither a tap nor `Anim`: it
  loads `framework.js`, calls `initSettings()` + `buildScale()` itself and never
  calls `boot()`, so there is no rail, no render loop and no WebGL context. Drive
  it through its `Sound` / `Notes` adapters from `page.evaluate` — `Sound.hold()`
  returns a handle whose `.vid` is the key into the framework's own `voices` map,
  so `voices[vid].freq` is how you prove a strike RETUNED rather than starting a
  second voice. `Sound.stats()` gives `{state, voices, held, cap}`.
