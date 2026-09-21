# UAT — Phase 16: a long press must not open a menu

> ✅ **PASSED on the projector, 2026-09-06** — "all works". The half of the chain
> this harness could not reach is now confirmed by the only machine that could
> settle it: a held finger no longer raises a menu.

**On the touch projector, please — that is the only machine this can be settled on.**
Headless Chromium does not run the touch gesture recogniser that turns a held
finger into a context menu, so my gates cover the event being refused, not the
finger raising it. `PHASE-16-LONG-PRESS-MENU.md` §7.

**Copy the top level of the folder over first.** `framework.js` and `index.html`
both changed, and `index.html` is the one that is easy to forget, because it is
the launcher rather than an app.

| # | Do this | Expect |
|---|---|---|
| 1 | On the **launcher**, hold a finger on an app tile for 3 seconds. | No menu. The app opens on release, or nothing happens — but no menu. |
| 2 | Open **MIDI Chords**. Hold a finger on a rail button (⚙️ Setup, 🎵 Notes) for 3 s. | No menu. The pane opens as usual. |
| 3 | On any pane, hold a finger on a **chip** (a palette, a look) for 3 s. | No menu. The chip selects. |
| 4 | Hold a finger on a **slider** and drag it slowly, pausing mid-drag. | No menu. The slider follows. |
| 5 | Hold a finger on the **activity** for 5 s — a sustained note. | No menu. The note holds and stops when you lift. |
| 6 | Hold the **top-left corner for 3 s** with the session locked. | It unlocks, with no menu on the way. |
| 7 | The one place a menu SHOULD still appear: **Setup → the launch-link box**. Right-click it with a mouse, or hold a finger on it. | The normal menu, with **Copy** — that box exists to be copied out of. |
| 8 | **Presets → the name box.** Right-click with a mouse. | The normal menu, with Paste. |

If 1–6 still show a menu anywhere, tell me **which one and on which page** — that
distinguishes a listener that is not firing from a menu Edge draws outside the
page, and they need different answers.

---

## Not part of this phase — the MIDI Chords question, answered

> "On MIDI Chords, clicking on the screen at the top gives a bigger effect at the
> top than the bottom. I thought we had fixed this, or is this how it is intended?
> Or maybe it was MIDI Light?"

**Intended, and both halves of your memory are right.**

A finger has no velocity — a MIDI key is struck harder or softer, a touch is not.
So a touch's **height is its velocity**: `0.35 + 0.6y`, gentle at the bottom of
the screen and firm at the top. In **MIDI Chords** velocity decides **how many
notes are in the chord**, so this is not a bigger picture, it is **more notes**:

| where you tap | notes you get |
|---|---|
| bottom of the screen | 2 |
| middle | 3 |
| top | 3, or 4 where the scale has room above that note |

**MIDI Light is the app you were remembering.** A touch there is a fixed velocity
of 96 whatever its height — measured 1 note at all five heights, top to bottom.
Creatures, Loop Garden and Mirror vary only in size and brightness, 1.04x to
1.15x, and never in how many notes come out.

**And what was fixed, in Phase 9d, was something adjacent**: a touch's mark used
to be drawn at the height its velocity implied, so the light appeared where the
finger was not. That is fixed — the mark lands under the finger. How hard the tap
counts as was always the height, and still is.

**If you would rather it did not vary:** MIDI Chords → the app tab → **How big the
chord is** → *Single notes*, *Always 3*, *Always 4* or *Always 5* instead of *How
hard you press decides*. Then every tap plays the same chord wherever it lands. It
is a per-student setting and it rides in a preset, so it can differ between two
students on the same machine. **No code change, and I have not made one** — which
way it should sit is yours to choose, and worth choosing per student: the height
response is expressive for someone who can reach the whole screen and a penalty
for someone who can only reach the bottom of it.
