# Phase 4h — fullscreen on Lock

**Status:** ✅ UAT passed 2026-08-30, merged, shipped in `v1.7.0`.
**Trigger met:** `framework.js`, in code every one of the 17 apps runs, and it
changes the conditions under which a **stored** display key is written. Both of
those are on `CLAUDE.md`'s list, so the doc comes first.

**Numbered as 4h, not 6.** It extends [`PHASE-4F-FULLSCREEN.md`](PHASE-4F-FULLSCREEN.md)
directly and the plan already parks the note in the 4-series
(`IMPROVEMENT-PLAN.md:862`). Phase 5 is the reach area and is unbuilt; this must
not leapfrog it.

---

## 1. What this is

🔒 **Lock** also puts the browser into fullscreen. The 3-second unlock hold puts
it back — but **only if the lock is what turned it on.**

Lock is the right home for it, and not only because the rail is full. The
Fullscreen API needs **transient activation** to enter, and the Lock button click
is a real user gesture. Exiting needs no activation, which matters because the
unlock hold resolves inside a `setTimeout` with no gesture attached. The gesture
budget works out in exactly the direction the feature needs.

Not to be confused with Phase 4f, which shipped fullscreen as a **setting** on
`Setup → This screen`. That answers "what is this screen like?". This answers
"the student has the device now". They are different questions and this design
keeps them from writing over each other.

---

## 2. The fault this design exists to avoid

`onFullscreenChange` (`framework.js:142`) writes the stored preference from
whatever the browser is doing:

```js
function onFullscreenChange(){
  writeFullscreenPref(fsActive());
  ...
}
```

So the naive version — Lock calls `enterFullscreen()` — silently rewrites the
room's display setting. **Measured, not predicted:** the `fullscreen` key went
`null → "1"` on entering and `"1" → "0"` on exiting, in both a windowed and an
already-fullscreen browser (§7, run 2). A therapist who deliberately runs
windowed would find the `Setup → This screen` Fullscreen switch turned itself on,
with a student's session as the only cause.

Phase 4f was explicit that fullscreen belongs to the display, not the student —
which is why it lives outside `SETTINGS`, why no preset carries it and why
`Reset all settings` does not clear it. A lock writing that key breaks the same
rule from the other end.

**So the design is one idea: the lock BORROWS fullscreen, and a borrowed
fullscreen is never written down.**

---

## 3. Ownership

Two module-level booleans. **Cardinality: exactly one of each per document**,
both `false` at load, **neither persisted** — this phase adds **no new
`localStorage` key**, and that is the point rather than an economy. A borrowed
state that outlived the page would be indistinguishable from the therapist's own
setting on the next load.

| flag | means |
|---|---|
| `fsLockOwned` | the lock turned fullscreen on, and unlock is therefore responsible for turning it off |
| `fsLockTransition` | a lock-caused enter/exit is in flight; the next `fullscreenchange` must **not** write the preference |

**The lock only takes ownership when the stored preference is off.** If the
preference is already on, fullscreen is the therapist's, the lock is merely doing
what the preference wanted, and unlock leaves it alone. That single rule is what
makes acceptance criterion 3 fall out instead of needing a special case.

### On lock

```js
if(!fsActive() && fsSupported()){
  const ours = !readFullscreenPref();   // pref already wants it? then it is not ours
  fsLockTransition = ours;
  enterFullscreen().then(()=>{ fsLockOwned = ours; })
                   .catch(()=>{ fsLockTransition = false; });
}
```

**The lock never waits on the promise.** `setLocked(true)` does its own work
first and fires this after; a rejection is swallowed and the session is locked
regardless. A browser that refuses fullscreen must not cost a student their lock
— *no fail states*.

### On unlock

```js
if(fsLockOwned && fsActive()){
  fsLockTransition = true;
  fsLockOwned = false;
  exitFullscreen();          // needs no transient activation
}
```

### The change handler

```js
function onFullscreenChange(){
  if(fsLockTransition) fsLockTransition = false;   // borrowed: write nothing
  else writeFullscreenPref(fsActive());
  if(!fsActive()) fsLockOwned = false;             // Esc, F11, anything: the loan is over
  if(currentQuickMode==='setup') buildSetupPanel();
}
```

The last line but one is the Esc/F11 desync guard the plan asked for
(`IMPROVEMENT-PLAN.md:866`). It needs no key handler and no reconciliation: if
fullscreen is gone, the lock does not own it, whatever ended it.

---

## 4. Lifecycle

Required by `CLAUDE.md` for anything that models a thing. The thing here is
**the loan**.

| case | behaviour |
|---|---|
| **Added** — Lock tapped, windowed, pref off | Enters. Loan opens. Pref stays `0`. |
| **Added** — Lock tapped, pref already on but windowed (a fresh load, which cannot auto-enter) | Enters, **no loan**. The pref write is allowed and writes `1` over `1`. Unlock leaves it fullscreen. Incidentally does the job `armFullscreenReapply` could not: that arms on `stageEl`, and Lock is chrome, not surface. |
| **Added** — Lock tapped, already fullscreen | Nothing to do. No loan. |
| **Changed** — Esc or F11 ends fullscreen while locked | Loan closes. Session **stays locked**. The pref write is allowed, because this change was not ours. It writes `"0"` — and where a loan existed the preference was already off, so **nothing `readFullscreenPref()` returns changes**. The stored *string* can still move from unset (`null`) to `"0"`; that is a write, not a change of meaning, and an earlier draft of this row wrongly said the value does not move at all. Unlock then does nothing to the window. |
| **Removed** — unlock hold completes with a loan open | Exits. Pref untouched. |
| **Removed** — unlock hold completes with no loan | Window untouched. |
| **Duplicated** — Lock tapped while already locked | Cannot happen: `applyLock()` hides the rail, so `#lockBtn` is unreachable. If it ever becomes reachable, `!fsActive()` makes the second tap a no-op. |
| **Replaced** — a preset is loaded | `applyPreset` already forces `SETTINGS.locked=false` and must call the same unlock path, or a loan is orphaned: fullscreen stays on with nothing left to turn it off. **This is the case most likely to be forgotten** — and it duly was. `applyDefaults` (↺ Defaults, added on a *separate* branch the same day) unlocks the same way and needed the same call. Neither branch's tests could see it, because neither had both halves; it was caught by re-reading this row at the merge. **Any new path that clears `SETTINGS.locked` must call `lockReleaseFullscreen()`.** |
| **Replaced** — `Reset all settings` | Must not exit fullscreen unless a loan is open. Phase 4f's rule that a reset does not throw a therapist out of fullscreen still holds; a *borrowed* fullscreen is a different thing and may go. |
| **Conflict** — the page navigates while locked | ⌂ Home is hidden when locked. If a navigation happens anyway the loan dies with the document, which is correct: the Fullscreen API is per-document and cannot span navigation (Phase 4f §16–17). The next page loads windowed. |
| **Conflict** — the browser refuses | Locked, windowed, no loan. Silent. F11 remains the therapist's fallback, which is what the Setup pane's hint already says. |
| **Conflict** — a finger is down when the resize lands | `fitSurface()` bails while any pointer is down, then runs again from `loop()` on the next frame (`framework.js:2465`), so the scale self-corrects the frame after the last finger lifts. **No new work.** Verified by reading both; `fitSurface` is called unconditionally every frame and bails on a cached transform. |

---

## 5. The cost, stated plainly

**Entering fullscreen from a windowed browser is a real viewport change, and a
viewport change destroys what is on the canvas.** `sizeCanvas()`
(`framework.js`) reassigns `canvas.width` whenever the client size moves, which
clears a 2D canvas by definition, and then calls `Anim.resize` — where several
apps re-allocate or re-seed.

So **Lock stops being guaranteed-lossless.** That guarantee is currently a
non-negotiable ("no app is told to resize when the chrome opens or the session
locks, so nothing a student has drawn is lost"), and this phase narrows it: a
settings visit and a lock-with-no-resize are still lossless; a lock that actually
changes the viewport is not.

Measured, §7 run 3 and 4 — a 1280×800 → 1920×1080 viewport change:

| app | what happens |
|---|---|
| `life.html` | **wiped** — grid re-alloc'd and `reset()` at `life.html:479` |
| `conductor.html` | **wiped** — the baton trail lives only on the canvas |
| `bubbles.html` | **wiped** — `bubbles.length=0` at `bubbles.html:302` (6% of lit pixels left, which is respawn, not survival) |
| `fluid_paint.html` | **wiped** — the dye FBOs re-init when the resolution class changes, and this change crosses it |
| `slime.html` | **wiped** — `clearTrail()` at `slime.html:369`, unconditional |
| `fluid_sensory.html` | survived this particular size change — its FBO re-init is conditional and did not fire |
| `flock.html` | survives — `resize` rescales the agents rather than dropping them |
| `soundscape.html`, `strummer.html`, `echo_bird.html`, `big_switch.html`, `song_grid.html`, `drums.html`, `sampler.html`, `beat_builder.html` | survive — the canvas is a background they repaint from live state every frame; `this.reset()` in `resize` costs nothing a student can see |

**Honest limit on that measurement:** the metric counts lit pixels, so it cannot
tell "the student's pattern survived" from "the app immediately drew a fresh one
of similar density". Slime and Fluid Sensory both regenerate continuously, so
their rows are read from their source, not from the pixel count. Slime's clear is
unconditional in the code and is reported as wiped despite the pixels recovering
to 51% within a second.

### Why it is still worth building

**In the room this costs nothing at all.** `Music Room.cmd` starts Edge already
fullscreen, and §7 run 2 measured the viewport as unchanged at 1920×1080 through
a complete enter/exit pair — no resize, so no wipe, in any app.

The feature therefore only *does* anything when the browser is windowed, which is
precisely the case it exists to fix: someone opened Edge normally instead of
using the shortcut. In that situation the therapist is locking **before** handing
the device over, so there is usually nothing drawn yet.

The loss is real, it is confined to the desk and to a mid-session lock, and it is
recorded here rather than discovered later.

---

## 6. No new switch

`Setup → This screen` already carries a Fullscreen control. A second one asking a
near-identical question is the clutter Phase 4g spent a day removing, and Lock is
meant to be one tap. Unconditional, and reversible by the unlock hold.

The alternative — a `Fullscreen when locked` toggle — was considered and
rejected: it adds a stored key, a lifecycle, and a way for the room to be
configured into the behaviour it already has.

---

## 7. Measurements

Run 2026-08-30, Edge via playwright-core, `file://`.

**Run 1 — `--start-fullscreen` under automation: void.** The window came up
921×920 and never resized. The flag is ignored for an automation-controlled
window, so nothing from that run is usable. Recorded because it looked like a
result.

**Run 2 — the room, window state driven through CDP `Browser.setWindowBounds`.**
The real F11-equivalent state, which is what `Music Room.cmd` produces.

| | inner | `fullscreenElement` | `windowState` | `fullscreen` key |
|---|---|---|---|---|
| at load | 1920×1080 | false | fullscreen | `null` |
| after `requestFullscreen` | 1920×1080 | true | **fullscreen** | `"1"` |
| after `exitFullscreen` | 1920×1080 | false | **fullscreen** | `"0"` |

**Two answers.** The API pair leaves the window's own fullscreen state intact —
the room cannot be thrown out of fullscreen by a lock or an unlock, and the
viewport never moves, so nothing is wiped. And the preference key moved on both
transitions, which is §2's fault, measured.

`exitFullscreen` was issued from inside a `setTimeout` with no transient
activation — the unlock hold's exact situation — and resolved `ok`.

**Runs 3 and 4 — the wipe.** Viewport 1280×800 → 1920×1080, which is the change
fullscreen causes at a desk, driving `sizeCanvas()` the same way. Results in §5.
Measured on the viewport change rather than on fullscreen itself because the
automation window would not honour a real API fullscreen resize; it is the same
code path.

---

**Run 5 — the question that mattered most: Lock, in a room already fullscreen,
with something drawn.** The whole gesture, `requestFullscreen` fired from inside
`#lockBtn`'s own click handler, on Life with a drawn pattern:

| step | lit pixels | canvas | inner | windowState |
|---|---|---|---|---|
| after drawing | 17200 | 1920×1080 | 1920×1080 | fullscreen |
| **after Lock** | **17200** | 1920×1080 | 1920×1080 | fullscreen |
| after the unlock exit | **17200** | 1920×1080 | 1920×1080 | fullscreen |

**Nothing is lost.** Nothing resizes, so `sizeCanvas()` never fires `Anim.resize`.
This was measured rather than inferred from run 2's unchanged viewport, because
"the viewport did not move, therefore the canvas survived" is a chain of two
assumptions and the second one is the one that matters.

---

## 8. As built

`framework.js` only. **No app changed, no CSS changed, no new stored key.**

| what | where |
|---|---|
| `fsLockOwned`, `fsLockTransition` | `framework.js:149` |
| `lockTakeFullscreen()` | `framework.js:154` |
| `lockReleaseFullscreen()` | `framework.js:166` |
| the suppression + desync guard in `onFullscreenChange` | `framework.js:173` |
| called from `setLocked` | `framework.js:2197` |
| called from `applyPreset` | `framework.js:1801` |

### Verified

10/10 acceptance checks, driving the real pages in Edge — including the actual
3-second corner hold for every unlock, not a `setLocked(false)` shortcut.

Both initial failures were faults in the harness, not the code, and are recorded
because each was nearly read as a pass/fail of the feature:

- **The refusal test never refused.** The stub assigned to
  `document.documentElement.requestFullscreen` inside an init script, where
  `documentElement` does not exist yet, so the assignment threw and fullscreen
  went ahead normally. On `Element.prototype` it refuses properly — and the
  session still locks, silently, with no loan.
- **`null` is not `"0"`.** The Esc check compared the raw stored string; both
  values read as off. Fixed by asserting on `readFullscreenPref()`, which is what
  the framework itself reads. §4's "Changed" row was corrected to match.

**Load gate: 21/21 clean in Edge and 21/21 in Firefox** — 0 `pageerror`,
0 `console.error`, 0 failed requests.

---

## 9. Acceptance

1. Windowed + Lock → fullscreen, chrome collapsed, surface at scale 1.
2. Unlock hold → back to windowed, and `Setup → This screen` Fullscreen is **still off**.
3. Fullscreen already on (switch or `Music Room.cmd`) + Lock → unlock leaves it fullscreen.
4. Esc while locked → stays locked, pref unchanged, unlock does nothing to the window.
5. Loading a preset while locked → unlocks **and** closes the loan.
6. Browser refuses → still locks, silently.
7. All 21 pages load clean in Edge and Firefox: 0 `pageerror`, 0 `console.error`.
