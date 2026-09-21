# The audio stall — investigation log, 2026-08-25

**Status: UNRESOLVED. Cause unknown. No fix works reliably. Nothing merged.**

This is a record of an evening's investigation that did not reach an answer. It
is written down because almost all of its value is in the **negative** results —
nine mechanisms were tested and killed, and without this list the next session
would test them again.

---

## 1. The symptom

Reported as an input bug: *"when I switch between apps it takes several seconds
for clicking/dragging to be recognised. Then when it is and paint/strums happen
there is no sound and it takes several seconds for sounds to be triggered."*
Later: *"the menus are not working as well"*, *"it's not just the canvas"*.

In Firefox, on Chord Strummer: touch recognised and animated → no sound → touch
stops doing anything → delayed sound → everything works.

**It is not an input bug.** Instrumented on the reporting machine, `mousedown`
reaches the window, the canvas, `onDown()` and `startVoice()` all in the same
millisecond. The page then freezes inside **`new AudioContext()`**, which is
called from `startVoice()` → `getAudio()` inside the `mousedown` handler. The
canvas, the rail and the settings strip freeze together because it is one
synchronous call on the main thread.

Measured at the line, on the reporting machine:

| | blocked |
|---|---|
| `getAudio()` total | 7653 ms |
| **`new AudioContext()`** | **7632 ms** |
| everything else (node graph, keep-alive buffer, 3.8 s impulse, sends, `resume()`) | 21 ms |

Other runs of the same code: **2856 ms**, and **27–28 ms**.

---

## 2. The fact that rules out a code regression

**The same build produced both outcomes.**

| run | folder | blocked |
|---|---|---|
| single click | `PHASE-current` | **28 ms** |
| a later run | `PHASE-current` | **7653 ms** |

Identical bytes, opposite results. **No difference between versions can explain
a fault that one version produces both with and without.**

This also invalidates the bisect that pointed at `689755e` ("the chrome stops
floating"). Whichever build was opened during a bad run looked broken. The
constructor is byte-identical in every version tested:

```
A-before-our-work        new(window.AudioContext||window.webkitAudioContext)({latencyHint:'balanced'})
B-after-phase-1          (identical)
B2-chrome-stops-floating (identical)
current branch           (identical)
```

Both the oldest and newest builds call it from the same line — `p.voice =
Anim.noVoices ? 0 : startVoice(s.x,s.y)` — at the same moment, the first
`mousedown`.

**Caveat, stated honestly:** the pre-Phase-0 build (`A`) has only ever produced
fast runs (27, 28, 28 ms), and it has never been observed slow. Three runs of an
intermittent fault is a small sample, not a clean bill of health. The user
maintains the original never did this. That remains unreconciled.

---

## 3. Nine mechanisms tested and killed

Do not re-test these without new evidence.

| # | hypothesis | test | result |
|---|---|---|---|
| 1 | The OS is opening the audio device | Bare page, **none of our code**, times `new AudioContext()` | **2 ms**, six times in a row |
| 2 | A busy WebGL loop starves it | Same bare page + a 60 fps full-screen shader loop | **2 ms** idle, **2 ms** under load |
| 3 | `latencyHint:'balanced'` is slow to negotiate | `FIX2` removed it | still froze |
| 4 | GPU compositing (`transform:translateZ(0)` on `#stage`) | `B2-TEST-no-gpu-layer` removed that one line | still froze |
| 5 | Canvas reallocation thrash at fractional DPR | 6 builds × dpr 1 / 1.25 / 1.5 | **0 reallocations** anywhere |
| 6 | Something covers the canvas and swallows clicks | `elementFromPoint` at 4 points in 4 builds | canvas receives every click |
| 7 | Stuck pointers / bfcache on navigation | Drove the exact index→app→home→app sequence | `pointers` 0, `bfcache` false, audio running |
| 8 | Input starvation on a slow machine | CPU throttled 1× / 4× / 8×, taps repeated | canvas tap ≤ 450 ms, rail tap ≤ 785 ms |
| 9 | AudioContexts accumulating in the browser | 9-condition matrix, **fresh browser per row** — live contexts in the same page, in another tab, recently closed, audio playing | **0–43 ms in every condition** |

Row 9 was run because a local test appeared to show 20 s blocks. Under
controlled conditions it did not reproduce — **those 20 s figures were artefacts
of a multi-page headless setup and are withdrawn.**

---

## 4. Fixes tried

| | change | result |
|---|---|---|
| FIX1 | `setTimeout(getAudio, 0)` in `boot()` | appeared to work |
| FIX2 | drop `latencyHint:'balanced'` | still froze. **Do not pursue** — that value was chosen deliberately to stop audible glitches on modest machines |
| FIX3 | both of the above | inconclusive (warm runs) |
| FIX4 | launcher opens the device before an app loads | inconclusive (warm runs) |
| FIX5 | launcher warm **and** boot prime | **worse** — two contexts per navigation |
| FIX6 | boot prime + release on `pagehide` | appeared to work, **then the fault returned** |

**FIX6 failing is the most important result of the evening.** Priming at boot
does not cure it; at best it moves the stall from the first touch into page load.
Nothing here is ready to merge.

Test folders are under `C:/Local Docs/Coding/musicapps-bisect/` (disposable, all
built from the archive bundle or from the branch; nothing in the repo depends on
them). `ZERO-OUR-CODE/` holds the two bare pages that contain none of this code.

---

## 5. What is still true regardless of cause

`getAudio()` is called from `startVoice()` inside the `mousedown` handler. **Any**
stall in it freezes the whole page and loses the student's notes — 14 queued
clicks with `soundingVoices` 0 was measured. A call that can block for seconds
does not belong on the input path.

That argues for moving it off the touch **defensively**, but FIX6 shows moving it
is not sufficient on its own, and a fix whose mechanism is not understood cannot
be trusted. Both things are true at once.

---

## 6. Where to start next time

1. **`edge://media-internals`**, open in one tab while reproducing in another. It
   logs device-open events, requested vs actual buffer size, sample-rate
   mismatches and device errors — the browser's own account of what the
   constructor is waiting on. This is the one place the answer is likely to be,
   and it has not been looked at.
2. **Does it happen with Edge as the only application running**, no VPN, no other
   tabs? Separates "our app trips something in this environment" from "this
   environment does it to anything".
3. **Does it happen on the room PC?** That is the machine that matters for the
   install; the reporting machine is a gaming PC with two screens.
4. If it proves environment-specific, the decision is a product one: ship with
   the stall moved off the touch and document it, or hold.

**The bar any fix must clear before it goes near `main`:** a run without the fix
must stall and a run with it must not, alternating, at least twice each. FIX1 and
FIX6 were both called working on a single run, and both were wrong.
