# UAT — launcher tidy + panel hierarchy (branch `fix-launcher-tidy`)

> **Passed by the user, 2026-08-26.** Step 12's `How many octaves` row was then removed
> entirely in Phase 4d, which folded the octave count into the Y-axis chips.

Two commits, both on `fix-launcher-tidy`. Nothing is merged. Open pages straight
from `file://` — a refresh picks up every change, there is nothing to rebuild.

If a step fails, stop on it and tell me the number; I'll fix on the branch and
hand you back an updated list.

---

## A. The launcher — `index.html`

1. Open `index.html`.
   **Expect:** it opens straight onto **Instruments**. No "Music Room" title, no
   paragraph of intro text, no footer.
2. Look at the three section headings.
   **Expect:** `Instruments`, `Songs & Games`, `Sensory & Calm` — each a heading
   on its own, with **no strap-line sentence** underneath.
3. Look at any tile.
   **Expect:** emoji, app name, **one short line** of description. **No green
   "LIVE" badge** in the corner of any tile.
4. Count the tiles: **14**.
   **Expect:** Beat Builder, Conductor and Fluid Paint are **not** there.
   Everything else is.
5. Check the rows.
   **Expect:** Instruments **5 across on one row**, Songs & Games 4, Sensory &
   Calm **5 across on one row**. No tile stranded alone on a row of its own.
6. **Does the whole page fit without scrolling?** It should, at a normal window
   and fullscreen.
7. Tap a few tiles.
   **Expect:** each opens its app. Come back with the browser's Back button.
8. **The size question — this is the one I most need your eye on.** Are the tiles
   a comfortable target on the touch projector, at arm's length? I measured
   234×145 at 1280 wide and 251×145 at 1920. Too small, too big, or right?

## B. Control size still drives the launcher

9. Open any app → **Setup** → set **Control size** to **1.5**. Go back to
   `index.html`.
   **Expect:** the whole launcher is bigger, still **5 across**, still no
   horizontal scroll.
10. Set Control size back to **0.8** and revisit.
    **Expect:** smaller, still 5 across, still legible.
    *(Then put it back wherever you normally keep it.)*

## C. The settings panes — the label change

11. Open **Fluid Keys** → **Notes**.
    **Expect:** the labels — `Up / down means…`, `Scale`, `Starting note`,
    `Register` — are now **normal weight and the same size as the chips**, not
    big bold headings. They should read as labels, not as headings.
12. On that same pane, tap **Octaves** under `Up / down means…`.
    **Expect:** the row below reads **`How many octaves`** on **one line** — not
    "How many octaves (higher on screen = higher pitch)" wrapped onto two.
13. Open **Sound**.
    **Expect:** `Voice` is now a small label, while **`Effects`** and **`Shape
    the sound`** are still big and bold. That contrast is the whole point — a
    section that groups controls stays loud, a label on one control goes quiet.
    **Is the difference clear enough, or has it gone too quiet?**
14. Open **Visuals** in Keys mode.
    **Expect:** `Note letters` (was "Note letters on screen"). `Background` and
    `Paint colours` are small labels; the app's own `Controls` heading stays big.
15. Check three apps that build their own panes: **Drum Pads** (Sound →
    `Backing track…`), **Sampler Pads** (Visuals → `Pad colours`), **Soundscape**
    (Visuals → `Scene`).
    **Expect:** those three read as small labels too, consistent with the rest.
16. Set **Control size 1.5** and reopen a couple of panes.
    **Expect:** nothing overlaps, nothing is cut off, no label runs off the edge.

## D. The preset name box

17. Any app → **Presets**.
    **Expect:** the box now suggests **`Initials + setup, e.g. "AM — 5 notes,
    calm"`**, with a line under it: *Initials only, please — never a full name.
    Presets stay on this computer.*
18. Save a preset, load it back, delete it.
    **Expect:** all three still work exactly as before. **Nothing about how
    presets are stored has changed** — this is wording only.

## E. Nothing else moved

19. Play a few notes in two or three apps.
    **Expect:** sound and touch are unchanged.
20. Lock a session (rail → **Lock**), then hold the top-left corner 3 s to
    unlock.
    **Expect:** unchanged.

---

## What I already checked, so you don't have to

- All **20 pages** load from `file://` with 0 `pageerror`, 0 `console.error`,
  0 failed requests — before and after both commits.
- A sweep of **17 apps × 5 panes × Control size 1.0 and 1.5 = 170 pane renders**:
  no clipping, no overflow, and no section-heading class left on a lone chip row.
- Launcher measured at 1280×800, 1920×1080, 1366×768 and at Control size 0.8 and
  1.5: 5 / 4 / 5 tiles, one row per section, no page scroll in any of them.

## Known and deliberately left

- **The three delisted apps are still in the repo** and still load if you open
  the file directly. Only the launcher tiles are gone. Say the word if you want
  the files deleted too — I did not want to do that without asking.
- `Brightness (dark → bright)`, `Attack (soft → crisp)` and `Ring (short → long)`
  keep their parentheses: they say which way to drag, which nothing else shows.
- `Backing track (from this computer)` in Drum Pads is still wordy. I changed how
  it looks, not what it says — your call whether staff need the "(from this
  computer)".
