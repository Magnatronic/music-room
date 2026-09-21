# UAT — Phase 6: launch links for the room PC

Branch: `phase-6-launch-parameters`, off `main`. ✅ **PASSED 2026-08-31** — merged, shipped in `v1.8.0`.

**What this is.** The room PC's control software can now open an app **already set
up and already locked**. You set an activity up the way you want it, copy a link,
and paste that into the control software. Launching it puts exactly that on the
projector, ready for a student.

```
fluid_sensory.html?s=noteCount:5,voice:synth,reverb:1&lock=1
```

**It is your own earlier design**, ported from `MusicTherapy/music-room`, with
three changes: menu size and access settings can no longer be disturbed by a
launch, and the copy dialog has a **Start locked** toggle instead of always
producing a locked link you had to hand-edit.

**Nothing for fullscreen, and there cannot be** — no web page can go fullscreen
from a URL, which is why `Music Room.cmd` uses `--start-fullscreen`. Your control
software already starts Edge that way.

Refresh the page before you start (F5).

---

## A. Making a link

| # | do this | expect |
|---|---|---|
| A1 | Open **Fluid Keys**. Set it up — a few notes, a voice, an effect, whatever you'd hand a student. | Sounds and looks how you want. |
| A2 | `Presets` → **🔗 Copy launch link**. | A **Start locked** toggle (on), a line explaining what the link does, and the link itself in a box. It says it copied to the clipboard. |
| A3 | Read the link. | It lists only what you *changed* — not a hundred settings. |
| A4 | Turn **Start locked** off. | The link updates immediately and `&lock=1` disappears. Turn it back on and it returns. |

## B. Launching it

| # | do this | expect |
|---|---|---|
| B1 | Paste the link into the browser address bar (or your control software) and open it. | The app opens with **exactly** the setup from A1, and **locked** — no rail, no menu. |
| B2 | Hold the **top-left corner for 3 seconds**. | Unlocks, and the whole menu is there as normal. |
| B3 | While unlocked, change things — a different voice, more notes. Close it. Now open the **same link** again. | Back to the setup in the link. **The link wins over whatever the last session left behind** — that is the point of it. |
| B4 | Open the app normally (double-click the file, no link). | It opens with the last setup, unlocked, as it always did. |

## C. The things a launch must not disturb

| # | do this | expect |
|---|---|---|
| C1 | `Setup` → set **Menu size** to something distinctive, say 130%. | Chrome resizes. |
| C2 | Open a launch link for that app. | The setup changes as the link says, **but Menu size is still 130%.** A launch must never resize the room's menus. |
| C3 | `Setup → Access`: turn on a controller or mouse dwell setting. | Access set up. |
| C4 | Open a launch link for that app. | **Access settings are untouched** — the student's switch or dwell still works. This is the important one: a launch must never silently turn off someone's access. |
| C5 | Look at a copied link. | It contains **no** menu size and **no** access settings. It is the activity's setup only. |

## D. When a link is wrong

| # | do this | expect |
|---|---|---|
| D1 | Edit a link by hand to something nonsense — `?s=noteCount:banana,voice:synth` — and open it. | The app opens, the voice **is** applied, the nonsense is ignored, and a message appears saying a setting wasn't understood. It must never open broken or blank. |
| D2 | Open a link with a made-up setting name. | Same — ignored, and it says so. |
| D3 | Open a link with `&lock=1` on an app you'd left unlocked. | Opens locked. |
| D4 | Open a link with `&lock=0` on an app you'd left **locked**. | Opens **unlocked**. The link decides, both ways. |

## E. The room, end to end

| # | do this | expect |
|---|---|---|
| E1 | Put a link into the control software the way you would for real, launching Edge fullscreen as usual. | Fullscreen, correct setup, locked, ready to hand over. |
| E2 | Do the same for two different activities with different setups. | Each opens as configured. |
| E3 | With a student's switch or eye-gaze set up on that machine, launch from the control PC. | Their access still works. **If this fails, stop — it's the one that matters most.** |

---

## What I verified myself

- **14/14 automated checks**: a link beats whatever the last session saved; keys the
  link doesn't name reset to the app's defaults; **menu size and access settings
  survive**; `lock=0` opens an app that was saved locked; `lock=1` alone locks
  without resetting anything; junk is ignored and announced; the `#hash` form works
  as well as `?query`; and a link copied from the pane round-trips exactly.
- Links carry no menu size and no access keys — checked on the generated link text,
  not just intended.
- All **21 pages** load clean in Edge and Firefox.

## What I could not test

- Your actual control software, and the real projector.
- **E3 is the one I'd most want you to check on the room machine.** Everything else
  I can reason about; whether a real launch leaves a real student's switch working
  is worth seeing with your own eyes.

## A note on one thing I changed my mind about

The design first said a link *could* carry access settings if it named them
explicitly. Building it showed that was wrong twice over: `bind` is an object and
came out of the encoder as `[object Object]`, and worse, a link carrying `padOn:1`
would push one student's access setup onto everyone launched with that link. So a
link now neither carries nor accepts them — which is what you said you wanted.
