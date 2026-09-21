# UAT — Phase 3b: the solid-chrome stage

> **SUPERSEDED by [`UAT-PHASE-3C.md`](UAT-PHASE-3C.md).** Testing this one
> found three things - the activity clearing, one tap giving two notes, and
> the strip closing whenever the activity was touched - and the fixes changed
> the model underneath. Several steps below describe behaviour that no longer
> exists. Kept as the record of what was tried.

**Branch:** `phase-3-stage` · **Commits:** `689755e`, `931e1a7`, plus the docs

The settings panel no longer floats over the activity. The rail and the settings
strip are solid columns, and the play surface is whatever is left — so opening a
group **narrows the activity** instead of covering it, and closing it hands the
width back. Locking collapses both columns and gives the whole screen.

Allow about 20 minutes. If anything fails, tell me and I'll fix it on the branch
and hand you an updated checklist. Nothing merges until you pass it.

> **One thing I want your eyes on specifically — step 6.** The activity really
> changes size now, and in the free-painting apps that **wipes the painting**. I
> can defend it (see the “As built” section of `PHASE-3-STAGE.md`) but you should
> judge it before it merges, not discover it in the room.

---

## 1. The shape of the thing

1. Open **Fluid Keys** (`fluid_sensory.html`).
   **Expect:** the rail is a solid dark column down the left edge, full height,
   flush to the edge — no gap, and no longer faded until you touch it.
2. **Expect:** the activity starts to the right of the rail and nothing overlaps it.
3. Tap **Sound**.
   **Expect:** a second solid column appears beside the rail, and the activity
   **shrinks to the right of it**. Nothing is covered.
4. Tap **Sound** again.
   **Expect:** the column disappears and the activity grows back to fill the space.

## 2. Handing over is still one tap

1. With **Sound** open, tap once on the activity itself.
   **Expect:** **one** note — the one under your finger, not one further along,
   and not two. The strip closes and the activity widens **as you lift**, not as
   you press.
   *(This is where both bugs so far have been, including the double-tap you
   reported, so please try it several times at different places on the screen.)*
2. Press and **hold** on the activity.
   **Expect:** the strip stays open while your finger is down, and closes when
   you lift. That is deliberate — the activity must never resize under a hand.
3. Press on the activity and **drag** before lifting.
   **Expect:** the notes follow your finger normally, and the strip closes on
   the release.
4. Repeat in **Drum Pads** and **Song Grid**: open Sound, tap a pad or a cell.
   **Expect:** the pad you touched is the pad that fires, once.

## 3. Lock is the full-screen path

1. In any app, tap 🔒 **Lock**.
   **Expect:** both columns vanish, the activity fills the entire screen edge to
   edge, and the “Controls locked” hint appears.
2. Play in the locked app.
   **Expect:** touches land where you put them, right to the far left edge where
   the rail used to be.
3. Hold the top-left corner for 3 seconds.
   **Expect:** unlocked, the columns come back, the activity narrows again.

## 4. Each app's own furniture is inside the activity

Open each and check the named thing sits **inside the play surface** — not under
the rail, not off the edge — with the strip **closed** and again with **Sound open**:

| App | Look at |
|---|---|
| **Beat Builder** | the step grid |
| **Big Switch Songs** | the big letter, and the progress bar along the top |
| **Chord Strummer** | the chord bar along the bottom |
| **Soundscape Mixer** | the mixer strip along the bottom; tap a channel and check its editor pops up **over its own channel** |
| **Echo Bird** | the bird and its ring at the top, and the ♪ notes it throws |
| **Drum Pads** | play a pattern so the layer strip appears, centred |
| **Sampler Pads** | record a pad — the toast should be over the activity |
| **Voice Visuals** | the microphone gate |

## 5. The dialogs still cover everything

1. **Drum Pads** → ✏️ edit → tap a pad. **Expect:** the editor covers the whole
   screen **including the rail** — that is deliberate, so a tap behind it cannot
   do something else.
2. Same in **Sampler Pads**, and for the colour picker in **Visuals → Background**.

## 6. The one to judge — a settings visit clears the painting

1. Open **Fluid Paint**. Paint something with a good long stroke.
2. Tap **Sound**.
   **Expect — and this is the question:** the painting **disappears**. The canvas
   changes size, and the app clears itself when it resizes.
3. Try the same in **Game of Life** (draw some cells), **Slime**, and **Fluid Keys**.

**What I need from you:** is that acceptable? My argument for accepting it is
that settings are a setup-time action and Lock is how a session is handed over,
so a therapist rarely opens a group with a student mid-painting. Fixing it
properly is per-app — four apps, including resizing the WebGL fluid framebuffers
instead of dropping them — and that is a phase of its own, not something to do
days before the install.

Apps that redraw every frame (Drums, Song Grid, Soundscape, Conductor, Echo Bird,
Big Switch) show nothing at all, and a **Beat Builder pattern survives** — I
checked that specifically.

## 7. Control size, on the actual screen

1. **Setup → Control size**, drag to the maximum.
   **Expect:** the rail and the strip both grow, and the activity gives up the
   width. It should still be clearly the largest thing on screen.
2. **Expect:** nothing overlaps or clips, and 🔒 Lock is still reachable at the
   bottom of the rail.
3. Drag to the minimum, then back to where you want it.

> Measured for you at 1366×768 (the worst case I could construct): asking for
> 150% fits down to 100–120%, and the activity keeps **52%** of the screen with
> the strip open. At 1920×1080 it keeps 57%. What I cannot measure is whether
> that feels like enough activity to work with — that is what this step is for.

## 8. A quick pass over the rest

Open each of the remaining apps and check nothing looks broken: **Bubbles**,
**Sweep Chimes**, **Conductor**, **Flock**, **Slime**, **Game of Life**,
**Fluid Paint**, **Voice Visuals**, and the **launcher**.

---

## What I verified myself, so you do not have to

- All **20 pages** load from `file://` with **0 errors, 0 console errors, 0
  failed requests**, before and after every step.
- The canvas fills the stage in every app; **no page overlaps the rail**.
- A touch at 0.25,0.25 of the play surface maps to 0.25,0.25 **strip open,
  strip closed and locked**, in three apps.
- The four **WebGL** apps survive five strip open/close cycles with `glLost`
  false.
- Every app-owned element sits inside the stage at **1280×800 and 1366×768**,
  in both strip states.
- **57 fps either way** with `transform` or `contain:paint` on the stage — no
  measurable cost to the compositing layer.

What I could not test: how any of it reads **on the room screen from where a
therapist stands**, and whether losing the painting (step 6) is tolerable.
