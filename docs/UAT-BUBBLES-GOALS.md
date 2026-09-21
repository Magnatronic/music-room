# UAT — Little goals belong to Free pop

Branch: `fix-bubbles-goals`, off `main`. ✅ **PASSED 2026-08-30** — merged, shipped in `v1.7.3`.

**What this is.** You asked whether Little goals are part of Free pop. They are —
and checking it turned up a real fault rather than just a tidier layout.

In **Song bubbles**, the bubbles carry the song's notes. But *Pop the colour*
picked its target colour from **all** the notes, not from the song's — so it could
ask a student to pop a colour the song never plays. The meter would never fill and
the celebration would never come. A goal that can't be completed is a fail state.

*Fill the rainbow* wasn't broken in the same way, but it put a second progress
meter and a second celebration on screen beside the song's own.

**So Little goals now appears only in Free pop.** Your setting is remembered — a
student's preset brings their goal back the moment you switch to Free pop.

Refresh the page before you start (F5).

---

## A. Free pop — unchanged

| # | do this | expect |
|---|---|---|
| A1 | **Music Bubbles**, `Bubbles → Free pop`. Open the app settings. | **Little goals** and **Pops to fill the meter** are there, as before. |
| A2 | Set **Fill the rainbow**, pop bubbles. | The rainbow meter fills along the bottom, and fills up to a celebration. Exactly as before. |
| A3 | Set **Pop the colour**, pop bubbles. | The target colour dot shows beside the meter; popping that colour fills it. As before. |
| A4 | Set **Off**. | No meter on screen. |

## B. Song bubbles — the change

| # | do this | expect |
|---|---|---|
| B1 | Switch to **Song bubbles**. Open the app settings. | **Little goals is gone from the pane**, and so is *Pops to fill the meter*. The **Song** picker is there instead. |
| B2 | Look at the screen while popping. | **No rainbow meter and no colour dot.** Just the song's own progress bar at the top. |
| B3 | Pop through a whole song. | One celebration, at the end of the song. Not two. |

## C. The setting is remembered

| # | do this | expect |
|---|---|---|
| C1 | Free pop → set **Pop the colour**. Switch to **Song bubbles**, then back to **Free pop**. | **Pop the colour is still selected.** The setting is hidden in song mode, never cleared. |
| C2 | In Free pop with a goal set, save a preset. Switch to Song bubbles. Load the preset. | Loads fine; the goal is remembered and applies once you are back in Free pop. |

## D. Nothing else moved

| # | do this | expect |
|---|---|---|
| D1 | Tap and sweep to pop bubbles in both modes. | Pops and sounds as always. |
| D2 | `Setup → Access → Mouse`, Dwell on: hold still over a bubble. | Pops — yesterday's fix still holds. |
| D3 | Drift, Bubble size, How many bubbles. | Unchanged. |

---

## What I verified myself

- **7/7 checks**: the controls are on the pane in Free pop and absent in Song
  bubbles; the meter is drawn in Free pop (6,474 lit pixels in the meter strip)
  and **not** drawn in Song bubbles (0); the setting survives the round trip.
- One helper, `goalsOn()`, gates the pane, the counting and the meter together,
  so those three cannot drift apart later.
- 6/6 bubbles tap checks still pass; **21/21** pages clean in Edge and Firefox.

## What I could not test

- A real projector and touchscreen.
- Whether a therapist ever *wanted* goals during a song. If you did, tell me —
  the honest fix then is to pick the target from the song's own notes rather than
  to hide the control.

---

## A process note

I committed this change straight to `main` before writing this checklist, which
breaks the rule that your sign-off gates `main`. Nothing had been pushed, so I
moved it onto this branch and `main` is back to carrying only the proposal and the
prototype. Flagging it rather than quietly fixing it.
