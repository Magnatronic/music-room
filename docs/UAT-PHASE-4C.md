# UAT — Phase 4c: the Fine-tune drawer is gone

Branch **`phase-4c-finetune`**. Nothing merges to `main` until you sign this off.

**What changed, in one line:** the collapsed `Fine-tune` disclosure at the bottom
of the Visuals pane — and a second one in the Sound pane you may never have found
— is gone. Everything that was inside it is now on the pane, under the heading it
already had. Nothing else moved.

**How to run it:** open the `.html` files from `file://` as normal. A refresh
picks up every change; there is nothing to build or restart. Design and
measurements: `PHASE-4C-FINETUNE.md`.

---

## A. The everyday check — is anything missing?

The one thing that would make this a bad change is a control that vanished. Four
apps cover all four shapes the drawer had.

| # | Do this | Expect |
|---|---|---|
| 1 | Open **`fluid_paint.html`** → rail **✨ Visuals** | No "Fine-tune" row anywhere. **Brush & Flow** and its sliders are on the pane, below Paint trails / Paint colours / Style. **Background** sits at the very bottom, now with its own heading. |
| 2 | Same pane — drag **Brush size**, then **Flow force** | Both still change the painting as they did before. |
| 3 | Open **`drums.html`** → **✨ Visuals** | **When a pad is hit** (Bloom / Glow / Pop / Off) is on the pane, not behind a disclosure. Tap **Glow**, then a pad — the pad glows. |
| 4 | Open **`bubbles.html`** → **✨ Visuals** | **No "Fine-tune" row at all.** This is one of the eight apps where it opened onto *nothing* — that empty row is what has gone. |
| 5 | Open **`strummer.html`** → **🎛️ Sound**, scroll to the bottom | **Shape the sound** — Brightness, Attack, Ring — on the pane. Drag **Ring** to the right, strum: the notes ring longer. |
| 6 | Any Keys-mode app (**`song_grid.html`**) → **✨ Visuals** | Order reads: Key look, Note letters, Paint trails, Paint colours, When a key is pressed, Background. Everything you change mid-session is above everything you set once. |

**If a control you use is missing from step 1–6, stop and tell me — that is a
fail, and it is the failure mode this phase risks.**

## B. The panes are longer now — is that a problem?

This is the trade the change makes and the part I most want your judgement on.
Nothing is hidden any more, so some panes are taller and scroll.

| # | Do this | Expect |
|---|---|---|
| 7 | **`flock.html`** → **✨ Visuals**, at your normal Control size | The longest pane in the product: 11 sliders under **Flock**. It scrolls. Scroll to the bottom and back. |
| 8 | Setup → **Control size** to **1.5**, then back to ✨ Visuals on `flock` | Still usable — scrollbar wide enough to grab, nothing clipped, nothing overlapping. |
| 9 | While you are at 1.5, open **🎛️ Sound** in `flock` | Also scrolls, and *already did* before this change with the drawer shut. Worth confirming it feels no worse. |
| 10 | Back to your normal Control size | Panes that fit still fit. |

**The question for you on 7–9:** is one long scrolling pane better or worse than
a short pane with a disclosure at the bottom? I argued better — a therapist under
time pressure does not open a disclosure, and eight apps proved the disclosure
could be empty without anyone noticing. **If it reads worse to you on the actual
screen, say so** — the fix is to reorder or to split the big simulation apps'
sliders, not to put the drawer back.

## C. Nothing else was disturbed

| # | Do this | Expect |
|---|---|---|
| 11 | In any app, **✨ Visuals** → change **Background** colour | The picker opens, the colour applies, the dot updates. |
| 12 | Set up an app the way you would for a student, **⭐ Presets** → save it | Saves and appears in the list. |
| 13 | Change several settings, then load that preset back | Everything returns, including Brightness / Attack / Ring and the background. |
| 14 | **Load a preset you saved before this change** (from `v1.0.0`), if you have one | Loads exactly as it did. No key changed, so there is nothing to migrate — but this is the one that matters, so please try a real one. |
| 15 | Preset loaded — check **Control size** | Unchanged. A student's preset must never resize the room's controls. |
| 16 | Play an app for a minute: draw, hold two fingers, tap the rail with the other hand | Sound and touch behave exactly as before. This phase did not go near the input path; step 16 is here to prove it. |
| 17 | **🔒 Lock**, play, then unlock (hold top-left 3s) | Locks pixel-perfect, nothing lost, unlock returns the chrome. |

---

## What I verified before handing this over

Driven in headless Edge from `file://`, **17 apps × 5 panes × 2 Control sizes ×
both modes = 180 pane renders**, compared against the same sweep run on a
worktree at `v1.0.0` with every drawer force-opened.

- **No control was lost anywhere.** Exactly two labels disappear across all 180
  renders: `Fine-tune` (the drawer's own summary) and `Fine-tune 💠 Mandala` in
  Voice Visuals, which now reads `💠 Mandala`. The only addition is the
  `Background` heading.
- **No `details.finetune` remains** in any pane of any app.
- **No heading with nothing under it**, in any app or pane — the standing gate
  that the 2026-08-24 empty-drawer fault would now trip.
- **All 20 pages load clean**: 0 page errors, 0 console errors, 0 failed
  requests.
- **A preset saved on `v1.0.0` loads on the branch**: 36-key blob, all 13 tuned
  settings restored, name intact, Control size correctly *not* restored.
- **Pane heights** land within one row of what the design predicted; every pane
  is shorter than the opened drawer it replaces.

What I **cannot** verify, and why you are testing it: whether a longer scrolling
pane is better than a shorter one with a disclosure. That is section **B**, and
it is a judgement about a therapist in a room, not a measurement.
