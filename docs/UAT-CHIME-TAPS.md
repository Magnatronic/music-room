# UAT — Sweep Chimes: taps that were being missed

Branch: `fix-chime-sub-frame-taps`, off `main`. ✅ **PASSED 2026-08-30** — merged, shipped in `v1.7.1`.

**Your report:** the chimes sometimes don't respond even though they're clearly
being hit — and then, more precisely, that **clicking repeatedly on one chime
loses several presses**. Three causes were found. The third is the one you meant.

1. **A quick tap could be missed entirely.** The chimes only heard a touch on the
   frame *after* your finger landed, so a strike over within one frame was silent.
   Real, and it will matter on the room projector — but not your symptom.
2. **Repeated hits were swallowed by a cooldown** above ~8 taps a second. Also
   real. Also not your symptom.
3. **The bar swings out from under your finger.** This is the one. Striking a
   chime sets it swinging, and the hit test followed only the bar's *current*
   position — so your next click landed in the gap it had just left, while the
   chime is still visibly there, swinging in its slot. Measured, clicking one bar
   ten times: **10/10 near the top, 6/10 at 45% down, 5/10 near the bottom** — and
   10/10 at that same low point with the bars held still. It got worse the harder
   you played, and only ever failed *after* a success, which is why it looked random.

**A chime now rings if you point at the bar where it is, or at the slot it hangs
in.** The trade you approved: tapping the empty slot of a bar that has swung
aside still rings it.

I got this wrong twice before finding it — I fixed two real faults that were not
what you were describing, because I trusted measurements of a gesture other than
yours. Step A2 is the one that matters.

Refresh the page before you start (F5).

---

## A. The bug you reported

| # | do this | expect |
|---|---|---|
| A1 | Open **Sweep Chimes**. Tap a chime firmly and quickly — the sharpest strikes you can, across different bars. 20+ times. | **Every tap rings.** No silent hits. |
| **A2** | **Click one chime repeatedly, as fast as you comfortably can — this is your exact report.** Do it on a **long bar on the left**, and click **low down**, near the bottom of the bar. That is where it failed worst. | **Every press rings.** Before this, roughly half were lost down there. Try hard to catch it out. |
| A3 | Keep clicking one chime while it is visibly swinging. | Every press rings, including while the bar is over to one side. |
| A4 | Do A1 again with two fingers at once on different chimes. | Both ring, every time. |
| A5 | Tap and hold on a chime for a second, then let go. | Rings once, swings, and rings **once** — not twice. |
| A6 | Tap the empty space where a swung-aside chime normally hangs. | It **rings** — this is the deliberate trade, not a bug. Tell me if it feels wrong in the room. |

## B. Sweeping still works as it did

| # | do this | expect |
|---|---|---|
| B1 | Sweep a finger briskly across all the chimes. | Each one rings **once**, in order, as before. |
| B2 | Drag **slowly**, resting on each chime for a moment. | Some bars ring more than once. **This is correct and unchanged** — a slow drag is a re-strike, like dragging a stick along real chimes. |
| B3 | Sweep back and forth a few times. | Sounds as it always did. Nothing rings twice per pass. |
| B4 | Turn **Breeze** up in the settings and let it blow, then tap a chime. | Your tap rings, even while the wind is ringing bars on its own. |

## C. The settings strip open — the case that catches bad coordinate maths

| # | do this | expect |
|---|---|---|
| C1 | Open **Notes** (or any settings tab) so the strip is open and the chimes shrink to fit beside it. | Chimes visibly smaller. |
| C2 | Now tap chimes **through the whole run, left to right**. | **The chime you touch is the one that rings** — not one to the side. If a tap rings the wrong bar, stop and tell me; that is the exact fault I found in another app. |
| C3 | Sweep across them with the strip open. | Rings in order, correct bars. |

## D. One-touch sweep (single-switch access)

| # | do this | expect |
|---|---|---|
| D1 | `Setup → Access` → turn on **One-touch sweep (a tap plays the run)**. | Toggle on. |
| D2 | Tap anywhere on the screen, briefly. | The **whole run** plays. |
| D3 | Do it with the fastest tap you can manage, several times. | The run plays **every time** — this was vulnerable to the same bug, and it's the most access-critical press in the app. |
| D4 | Try dragging instead of tapping. | Nothing extra happens — a drag doesn't start a second run. |
| D5 | Turn One-touch back off. | Normal sweeping returns. |

## E. Bubbles — a fault found while checking whether this generalised

You said bubbles has always worked fine, and that is right: the **mouse** path was
never wrong. The fault needed **touch** *and* an open settings pane together, so
it only ever bit during setup, on the touchscreen.

| # | do this | expect |
|---|---|---|
| E1 | Open **Music Bubbles** on the **touchscreen**. Open any settings tab so the bubbles shrink to fit beside it. | Strip open, bubbles smaller. |
| E2 | Tap bubbles — especially over on the **right-hand side**. | The bubble **you touch** pops. Previously the pop landed well to the left of your finger — about a third of the screen out at the right edge. |
| E3 | Close the strip and tap around normally. | Unchanged, as it always was. |

---

## What I verified myself

- **Repeated clicking is now 10/10 at every rate tested (0, 30, 60, 100, 150 ms
  gaps) and at every height on the bar.** Before the fix: 5–9 of 10, worst low
  down. This is the check that matches your report.
- **7/7 other checks.** One tap makes exactly one strike (proving no double-ring
  from the new handler); a sub-frame tap rings; a brisk sweep still rings 8 bars
  exactly once each; one-touch survives a sub-frame press; and with the settings
  strip open the *same* bar rings — 262 Hz both scaled and unscaled.
- **6/6 on bubbles**, including that its touch mapping now lands on the point
  touched with the strip open (960 px, where the old code used 549 px).
- **The slow-drag re-ring was measured on `main` and on the fix: 13 strikes both**,
  so the sweep path is genuinely untouched. My first check called that a failure;
  the check was wrong, not the code.
- All **21 pages** load clean in **Edge and Firefox**.

---

## What I could not test

- A real projector, a real touchscreen, and a real frame rate. Everything was
  driven with a synthetic mouse at 60 fps — **A2 and E2 on the actual room
  hardware are the real tests.**
- Whether the 0.12 s cooldown should also be shortened for *sweeps*. I left the
  sweep behaviour exactly as it was, on purpose.
- Whether A6 (the empty slot ringing) feels wrong with a student in front of it.
  That is a judgement about the room, not something a probe can answer.
