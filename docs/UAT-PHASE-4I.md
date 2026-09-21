# UAT — Phase 4i: dwell works everywhere

Branch: `fix-dwell-down-splat`, off `main`. ✅ **PASSED 2026-08-30** — merged, shipped in `v1.7.2`.

**Your report:** the mouse dwell doesn't work on the bubbles.

**What it turned out to be.** A dwell press is *made up* by the framework — it
never produces a real mouse event. Bubbles and Sweep Chimes had both been changed
to listen for a real mouse press, so a dwell had nowhere to land. Measured, it was
**both dwell routes in both apps** — the mouse *and* the controller — which is
exactly the two students dwell is for: the one who can aim but can't press.

**Sweep Chimes is my fault and it shipped.** Dwell worked there until yesterday's
fix, which added that listener. Bubbles has been like it since dwell was built.

**The fix.** The framework now hands the press to the app the instant the pointer
lands, however the press was made — a finger, a mouse, a dwell, a stick. Both apps
lost their own listeners entirely; this change deletes more code than it adds.

Refresh the page before you start (F5).

---

## A. The bug you reported

Set `Setup → Access → Mouse`: **Dwell on**, and turn the dwell time down to
about a second so testing isn't slow.

| # | do this | expect |
|---|---|---|
| A1 | **Music Bubbles.** Move the mouse over a bubble and hold perfectly still. | The ring fills, and the bubble **pops**. Nothing happened before. |
| A2 | Do it several times on different bubbles, including near the **right-hand edge**. | Pops every time, at the bubble you're pointing at. |
| A3 | **Sweep Chimes.** Hold the mouse still over a chime. | The chime **rings**. |
| A4 | Move a little, hold still again. | Rings again. Resting without moving must **not** ring it over and over. |
| A5 | Any other app (Fluid Keys, Drum Pads). | Dwell works as it always did — nothing here should have changed. |

## B. The controller, which had the same fault

`Setup → Access → Controller`: **Stick moves a pointer** on, **Dwell** on,
*Pushing the stick plays* **off**.

| # | do this | expect |
|---|---|---|
| B1 | **Bubbles.** Drive the pointer onto a bubble with the stick, then **let the stick go back to centre** and leave it. | The ring fills and the bubble pops. This is the case that was completely dead — a parked stick made no sound at all. |
| B2 | **Sweep Chimes.** Same: drive onto a chime, release the stick, wait. | The chime rings. |
| B3 | Drive around without stopping. | Bubbles pop / chimes ring as you pass through, as before. |
| B4 | With **Pushing the stick plays** on instead, push the stick around. | Works as before. |

## C. Nothing from yesterday regressed

| # | do this | expect |
|---|---|---|
| C1 | Chimes: click one chime repeatedly, fast, **low down on a long left-hand bar**. | Every press rings — yesterday's fix still holds. |
| C2 | Chimes: sweep briskly across the whole run. | Each chime rings once, in order. |
| C3 | Chimes: tap one chime once, firmly. | Rings **once**, not twice. Two routes into the app were merged into one, so a double-ring is the thing to watch for. |
| C4 | Bubbles: tap bubbles normally, quickly. | Pop once each, no doubles. |
| C5 | Bubbles, strip open: tap on the right-hand side. | Pops the bubble you touch. |
| C6 | Chimes: `Setup → Access` → **One-touch sweep** on, tap anywhere. | The whole run plays, every time. |

## D. Painting apps — the widest blast radius

This changed one line every app runs, so the point is that nothing looks different.

| # | do this | expect |
|---|---|---|
| D1 | **Fluid Keys**, **Fluid Paint**, **Slime**, **Flock**: tap and drag. | Paint and sound exactly as before. No doubled blobs, no extra dab at the start of a stroke. |
| D2 | **Fluid Keys** in Keys mode with paint set to the small/subtle option: tap a note. | The blob is **small**, as it was — not a full-size splash. |
| D3 | **Game of Life**: tap to seed cells, then drag. | Cells appear where you tap, as before. |
| D4 | **Drum Pads**, **Song Grid**, **Big Switch**: tap around. | Unchanged. |

---

## What I verified myself

- **The press now arrives once** in Bubbles, Chimes and Life on all three routes —
  mouse dwell, controller dwell, and a sub-frame tap. Before: zero on both dwell
  routes in Bubbles and Chimes.
- **Keys-mode subtle paint still carries its small radius** (0.06) on the tap, and
  `full` still carries no override — the detail most likely to have been dropped
  silently.
- **Everything from yesterday holds**: 7/7 chimes checks, 6/6 bubbles checks,
  repeated clicking 10/10 at every rate and every height on the bar.
- `fluid_sensory` correctly receives no press-splat, because Keys mode with paint
  off means `paintMode()` is `'off'` — the render loop applied that identical
  check before, so it is unchanged behaviour, not a regression. I checked rather
  than assumed.
- All **21 pages** load clean in **Edge and Firefox**.

## What I could not test

- A real projector, a real touchscreen, a real XAC. All synthetic, at 60 fps.
- **D1–D4 are the ones I would most like a human eye on.** The change is one line
  in the shared input path that all 17 apps run, and a doubled or mistimed dab is
  the kind of thing a probe counts correctly and still fails to notice looks wrong.
