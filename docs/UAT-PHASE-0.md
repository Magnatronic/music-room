# UAT — Phase 0: baseline

**Branch:** `phase-0-baseline` · **Commit:** `9c1d1cb`

This phase changed **no app behaviour**. It recorded what the apps do today and
fixed three documents that had drifted. So the check is short — about five
minutes — and it is mostly "does the writing now tell the truth".

If anything below fails, tell me and I will fix it on the branch and hand you an
updated checklist. Nothing merges until you pass it.

---

## 1. The apps still open and play

The point is that nothing broke, so a spot check is enough.

1. Open `index.html` from the folder (double-click it — do **not** use a server).
2. Open **Fluid Keys**. Touch the screen in a few places.
   **Expect:** notes sound, colour appears under your finger, no error box.
3. Go back and open **Drum Pads**. Tap two or three pads.
   **Expect:** each pad sounds.
4. Go back and open **Conductor**. Move a finger around, then stop and wait 5 s.
   **Expect:** sound follows the movement and fades to silence when you stop —
   and **stays silent**. It should not hum or drone while your hand is still.

> Step 4 is the one thing worth doing carefully. Conductor keeps a silent
> oscillator running at rest on purpose, so that movement can resume without a
> click. I verified it is silent, but headless testing cannot actually *hear*.
> **You can.** If you hear anything at all while your hand is still, say so —
> that would be a real defect and my testing could not have caught it.

## 2. The README tells the truth

1. Open `README.md`.
2. Read the **Apps** section.
   **Expect:** 17 apps in three groups — Instruments, Songs & Games, Sensory &
   Calm — matching the three groups you see on `index.html`. Every app you
   actually use should be listed, and none should say "Planned".
3. **Expect:** a note that `fx_lab.html` is a bench, not an activity, and that
   Voice Play was cancelled.

Previously this table listed Chord Strummer, Voice Visuals, Sampler Pads and
Soundscape as *Planned* — all four have been built for a month — and omitted
seven apps entirely.

## 3. Nothing that matters was touched

1. Run `git show --stat` on the branch, or just look at the file list below.
   **Expect:** only `README.md`, `.claude/skills/verify/SKILL.md` and the new
   `IMPROVEMENT-PLAN.md`.
   **Expect NOT:** any change to `framework.js`, `framework.css`, `songs.js`, or
   any app `.html`.

---

## What I verified, and how

- **All 20 pages** (17 apps + `index`, `template`, `fx_lab`) opened from
  `file://` in headless Edge, each given a tap the frame loop can see.
  **Result: 0 errors, 0 warnings, 0 failed requests.**
- **Release tails** sampled at +0.3 s, +2 s and +5 s after a note is let go.
  Fluid Keys, Sweep Chimes, Song Grid and Flock all reach zero. Conductor holds
  one silent voice by design (see step 4 above).

## What I could not verify

- **Anything audible.** Headless Chromium produces no sound. I can assert that a
  voice exists and that its gain is driven to 0.0001, but only you can confirm
  the room is actually quiet. Step 4 is where that matters.
- **Anything on the real hardware** — the touchscreen, the projector, and the
  switches. Those wait for the room.

---

## After you pass

Phase 0 merges to `main` and I start **Phase 1** — the contrast, touch-target and
`--ui-scale` pass, plus the new **Setup** pane that Phase 2's switch controls
need a home in. That is the first phase you will actually *see* a difference in,
and the first one where a UAT will take longer than five minutes.
