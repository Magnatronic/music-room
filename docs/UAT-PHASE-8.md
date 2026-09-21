# UAT — Phase 8: Sound Match

**Passed 2026-08-31.** Merged to `main` and tagged `v1.10.0`.

`sound_match.html` — a pairs game where a pair is a note. 18 activity files now,
15 on the launcher, 22 pages.

---

## What the user tested, and what it took to get there

This went through **six rounds**. The record below is the round-by-round list,
because three of the faults were things the automated checks had already called
green — and *why* they did is the useful part.

### Round 1 — the shape of the game

Reviewed as a throwaway in `prototypes/sound-match.html` before any app existed,
per the pattern that has decided every Access-pane question on this project.

- ✅ A pairs game has a fail state and this suite forbids one → **forgiveness
  became a difficulty axis**: Stay up / Flip back, with a chosen hold.
- ✅ Instrument mode and Sound-only mode were **the same game with and without
  icons** (the user's observation). Collapsed to one game and one difficulty
  control, and the icons went with the mode that needed them.

### Round 2 — two faults found by ear and eye

- ✅ **Two different pairs were drawn as the same card.** Eight pairs of a
  seven-note scale wraps, and C and C′ share a pitch class. Enumerated: 8 pairs
  collides once, 9 twice, 10 three times. An octave up is now the same colour
  lightened with a mark on the letter.
- ✅ **"Some matching sounds don't sound the same."** They did not: a marimba
  note runs 4.8 s and the replay was 700 ms apart, so the second card was heard
  *through* the first's tail. A card now damps the one before it.
- ✅ Matched cards go **hollow**, not dim — under Stay up the board is full of
  bright face-up cards and a darker one is not a category.

### Round 3 — the app could not be played with a mouse

- ❌→✅ **Nothing happened when you clicked a card.** The framework's mouse and
  touch listeners are on `canvas` (`framework.js:1164`, `:1204`) and the board
  covered it, swallowing every real click. The gamepad pointer and the mouse
  dwell call `onDown()` directly and were unaffected.
  **Every test had synthesised the press that way, so all of them passed on an
  app no mouse or finger could play.** Fixed with `pointer-events:none` on every
  layer of the board; hit-testing was always in `splat()`.
- ✅ Three panes offered controls the app cannot honour — a note-count slider
  that fought the board, a Y-axis row this app never reads, paint trails for an
  app that paints nothing.

### Round 4 — the Notes tab did nothing, and reset the game doing it

- ❌→✅ `appendTuning` was given the app's own callback and nobody called
  `refreshMusic()`, so Register, Scale and Starting note wrote `SETTINGS` and
  stopped — `NOTES` was never rebuilt. Meanwhile the callback re-dealt. **Both
  halves of the user's report from one missing call.** It now retunes in place:
  cards keep their positions and their won state.
- ✅ A match no longer replays (483 ms to won, from ~2.5 s); the mismatch replay
  became a toggle, default off.
- ✅ Winning fills the board back in rather than leaving a grid of outlines.

### Rounds 5 and 6 — the dark lines

- ❌→✅ **Layouts were unstable**: with four cards on a 16:9 screen, 2×2 and 4×1
  score within one percent in the fit search, so the same size came out a block
  on one display and a single row on the next. Sizes are stated grids now.
- ❌→❌→❌→✅ **Dark vertical lines across the cards.** Three patches were aimed
  at this — separating the two faces in z, fading the back out, `will-change` —
  and each fixed the case in front of it and left the class of fault alive. The
  user's final screenshot settled it: the line crossed a revealed card *and* the
  face-down card below it at the same screen x, before any celebration. A
  **compositor tile seam**, with every card promoted to a 3D layer for it to
  appear on. The 3D flip is gone; a card squashes to nothing on the X axis and
  its faces swap which is opaque at the midpoint.

---

## The harness could not see it, and said so

A detector was written for the seams: it scans inside every card for a run of
pixels darker than its own surroundings, at three device pixel ratios, on
flipped cards and on a finished board six seconds after the celebration.

**It passed on the broken build exactly as it passed on the fixed one.**

Playwright runs a software rasteriser. GPU compositing is not in this harness at
all — the same limit that stops the WebGL apps being benchmarked in it, but
worse, because a *correctness* fault is invisible rather than merely mismeasured.
Three rounds went into confirming fixes in an environment that never showed the
bug. This is now written into `.claude/skills/verify/SKILL.md`.

---

## What was verified automatically, and holds

Edge, headless, `file://`, 0 `pageerror` / 0 `console.error` / 0 failed requests.

| # | check | result |
|---|---|---|
| 1 | every page loads clean | **22/22** |
| 2 | a **real mouse press** turns a card and sounds it | passes |
| 3 | a **real touchstart** turns a card | passes |
| 4 | a real drag across four cards | turns exactly **one** |
| 5 | a synthesised `onDown()` (gamepad / dwell path) | turns a card |
| 6 | board sizes at 1440×900, 1920×1080, 1366×768, 1280×800 | **2×2 / 3×2 / 4×3 / 5×4** every time, ~99% fill, no overflow |
| 7 | cards = notes × 2 = `noteCount` × 2 | every size |
| 8 | 10 pairs — two pairs looking alike | **none** |
| 9 | a match | 483 ms to won, no replay |
| 10 | a mismatch | 2481 ms, of which 2000 is the therapist's hold |
| 11 | Starting note changed mid-game | every face and colour rewritten, **won pair survives** |
| 12 | Register changed mid-game | same colours, pitches raised, board kept |
| 13 | colour strength at 0% | a true grey |
| 14 | no 3D anywhere | `perspective:none`, `transform-style:flat`, `will-change:auto`, and a settled card at `transform:none` |
| 15 | Notes pane | Register / Scale / Starting note only |
| 16 | Visuals pane | Colour strength and Show note letters only; no mention of paint or trails |
| 17 | locked | fully playable, at transform scale exactly **1** like every other app |
| 18 | a press inside a 50% reach area | still hits the card aimed at |

**Not verifiable here:** the compositor seams. Only a real GPU and a person
looking can confirm those, and the user did.
