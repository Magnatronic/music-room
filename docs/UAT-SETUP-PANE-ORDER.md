# UAT — Setup pane order, and ↺ Defaults

Branch: `fix-setup-pane-order`, off `main`. Separate from Phase 4h so the two
don't tangle. Nothing merges until you pass this.

**What changed:**

1. The **Setup** pane is now `Fullscreen · Access · Menu size · Performance ·
   Show performance`. **Fullscreen is first.**
2. **"Reset all settings" is gone from Setup.** It is now **↺ Defaults**, the
   first row of the **Presets** list — because that is what it always was.
3. ↺ Defaults asks twice before it does anything.

Refresh the page before you start (F5).

---

## A. The Setup pane

| # | do this | expect |
|---|---|---|
| A1 | Open any app → **Setup**. | The pane opens on **Fullscreen**, at the very top. |
| A2 | Read down the pane. | `Fullscreen` → `Access` → `Menu size` → `This computer` (Performance, Show performance). **No "Start over" section, no "Reset all settings" button.** |
| A3 | Toggle **Fullscreen** on and off. | Works exactly as before. |
| A4 | Drag **Menu size** to 150%, then back. | Everything scales as before; the pane is still readable and you can still reach all of it. **Try this at 150% on the smallest screen you have** — that is where a long pane hurts. |
| A5 | Check **Drums**, **Sampler** and **Voice Visuals**. | Same order. These three take over panes, so they are the ones most likely to look wrong. |

## B. ↺ Defaults

| # | do this | expect |
|---|---|---|
| B1 | Open **Presets**. | **↺ Defaults** is the first row under `Saved presets`, above any saved ones. |
| B2 | Change some settings (volume, number of notes, a colour), and draw something on screen. | Changes take effect. |
| B3 | Tap **↺ Defaults** **once**. | It changes to **"Tap again to reset"**. **Nothing is reset** — your settings and your drawing are untouched. |
| B4 | Wait 3+ seconds without tapping. | It goes back to **↺ Defaults**. Still nothing reset. This is the important half: a stray tap must be harmless. |
| B5 | Tap it twice, quickly. | Settings go back to defaults **and the screen clears** — as if you had just opened the app. |
| B6 | Save a preset, then tap ↺ Defaults twice. | Your **saved presets are still listed**. Defaults resets *settings*, never your saved presets. This is the confusion the old name caused. |
| B7 | Load a saved preset. | Loads as before. The drawing is **not** cleared — only ↺ Defaults clears it. |

## C. Conductor — the reason Defaults still clears

| # | do this | expect |
|---|---|---|
| C1 | Open **Conductor** and move around to build up a baton trail. | A trail accumulates. Note there is **no 🧹 Clear button** on the rail in this app. |
| C2 | Presets → tap ↺ Defaults twice. | The trail is wiped. This is the only way to clear it, which is why Defaults still clears the canvas. |

## D. Nothing else moved

| # | do this | expect |
|---|---|---|
| D1 | Open `Notes`, `Sound`, `Visuals`. | Unchanged. |
| D2 | Lock the session, unlock with the 3 s corner hold. | Unchanged. |
| D3 | With a gamepad connected, check `Setup → Access` still has its three tabs and they still work. | Unchanged — only its position on the pane moved. |

---

## What I verified myself

- **40/40 automated checks across five apps** — Life, Fluid Keys, Drums,
  Conductor and Voice Visuals, including the three that take over panes. The
  checks read what each pane actually *says* in document order, rather than
  trusting the source.
- Covered: the order in every one of those apps; no `Start over` left anywhere;
  ↺ Defaults first in the list; one tap arms and does **not** reset; the second
  tap does; and the arming **expires** after 3 s so a later single tap is safe.
- All **21 pages** load clean in **Edge and Firefox** — 0 `pageerror`,
  0 `console.error`, 0 failed requests.

## What I could not test

- **How it feels at 150% on a short screen** (A4). The pane is longer above
  Menu size now, and Menu size is the control that fixes a pane you can't read.
  It scrolls, so nothing is unreachable — but whether it is *annoying* is a
  judgement I can't make from here, and it is the one thing I would change my
  mind about if it feels wrong.
- A real projector, and a real touch (everything was driven with a mouse).
