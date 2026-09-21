# UAT — Phase 4h: fullscreen on Lock

Branch: `phase-4h-fullscreen-on-lock`. Nothing is merged until you pass this.

**What changed:** 🔒 Lock now also takes the browser fullscreen, and the 3-second
unlock hold gives it back. It only does that when it has to — and it never
changes your `Setup → This screen → Fullscreen` setting.

**Refresh the page before you start** (F5). No rebuild, no restart.

---

## A. The room — the case that matters most

Start Edge with **`Music Room.cmd`**, so the window is already fullscreen.

| # | do this | expect |
|---|---|---|
| A1 | Open **Life** (or Flock, or Fluid Paint). Draw something and let it run. | A pattern on screen. |
| A2 | Press 🔒 **Lock**. | Chrome disappears. **The pattern is exactly as it was — nothing flickers, resizes, clears or restarts.** This is the whole point; if anything on screen is lost, stop and tell me. |
| A3 | Hold the **top-left corner for 3 seconds**. | Unlocks. Still fullscreen. The pattern still there. |
| A4 | Open `Setup → This screen`. | **Fullscreen is still OFF** (it was never on — `Music Room.cmd` is a window state, not this switch). Locking must not have turned it on. |

## B. A windowed browser — the desk case

Open any app by double-clicking the `.html` file, so Edge is **not** fullscreen.

| # | do this | expect |
|---|---|---|
| B1 | Check `Setup → This screen`. | Fullscreen **off**. |
| B2 | Press 🔒 **Lock**. | Locks **and** goes fullscreen — browser bars and taskbar gone. |
| B3 | Hold the top-left corner 3 s. | Unlocks **and** returns to a window. |
| B4 | Open `Setup → This screen`. | **Fullscreen is still OFF.** It must not have switched itself on. This is the single most important check on this page. |
| B5 | In **Life**: draw a pattern first, *then* press Lock. | The pattern **is lost** — the window resizing clears the canvas. **This is expected and documented**, not a bug. It does not happen in the room (test A2). Tell me if you think it is not an acceptable trade. |

## C. When fullscreen is already your setting

| # | do this | expect |
|---|---|---|
| C1 | Windowed. `Setup → This screen` → turn **Fullscreen ON**. | Goes fullscreen. |
| C2 | Press 🔒 **Lock**. | Locks. Still fullscreen. |
| C3 | Hold the corner 3 s to unlock. | Unlocks and **stays fullscreen** — your setting is yours, the lock does not take it away. |
| C4 | `Setup → This screen`. | Fullscreen still **ON**. |

## D. Escape hatches — nothing should get stuck

| # | do this | expect |
|---|---|---|
| D1 | Windowed. Press Lock (goes fullscreen). Now press **Esc**. | Leaves fullscreen. **Still locked** — Esc must not unlock the session. |
| D2 | Now hold the corner 3 s. | Unlocks normally. Window unchanged. |
| D3 | `Setup → This screen`. | Fullscreen **off**. |
| D4 | Press Lock, then press **F11** twice. | The session stays locked throughout; nothing is stuck, and you can still unlock with the corner hold. |

## E. It still works everywhere else

| # | do this | expect |
|---|---|---|
| E1 | Repeat B2/B3 in **Drums** and in **Song Grid**. | Same behaviour. Pads and keys still play while locked. |
| E2 | With a gamepad/XAC connected and `Setup → Access` on, lock and unlock. | The pad pointer keeps working while locked, as before. |
| E3 | Open the launcher (`index.html`). | Unaffected — it has no lock and no framework. |

---

## What I verified myself

- 10/10 automated checks in Edge, using the real 3-second corner hold rather than
  a shortcut: entering, exiting, the preference never being rewritten, the
  already-on case, Esc closing the loan, a preset load closing it, and a browser
  that refuses still locking silently.
- **The A2 case measured directly**: Life's grid held at 17200 lit pixels through
  a lock, with canvas, viewport and window state all unmoved.
- All **21 pages** load clean in **Edge and Firefox** — 0 `pageerror`,
  0 `console.error`, 0 failed requests.

## What I could not test

- A **real projector** and the room's actual machine.
- A real **touch** lock — everything above was driven with a mouse.
- **B5's list** of which apps lose their canvas was measured on a viewport change
  rather than on a real fullscreen transition, because the automation window
  refuses to honour one. It is the same code path, but the room is the place to
  confirm A2.
