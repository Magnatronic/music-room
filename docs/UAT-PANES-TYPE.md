# UAT — pane order, chip cap and type (branch `phase-4d-panes-and-type`)

> **Passed by the user, 2026-08-26** — sections A–K. Where §J and §K disagree, §K is the
> build: Phase 4e replaced §J's `## Tuning` heading with an app tab of its own.

Everything from the launcher branch is in this tree too, so `UAT-LAUNCHER-UI.md`
still applies and is not repeated here. Open pages from `file://`; a refresh
picks up every change.

If a step fails, stop on it and give me the number.

---

## A. The Notes pane — Fluid Keys

1. Open **Fluid Keys** → **Notes**.
   **Expect**, top to bottom:
   `Number of keys` · `Register` · `Scale` · `Up / down means…` · `Starting note`.
2. **Expect: there is no separate `How many octaves` row anywhere on the pane.**
3. Look at `Up / down means…`.
   **Expect** five chips: `▦ 2 octaves` · `▦ 3 octaves` · `Loudness` ·
   `Brightness` · `Nothing`.
4. Tap **`▦ 3 octaves`**, then play up and down the screen.
   **Expect:** three octave rows, exactly as choosing "Octaves" + "3 octaves"
   used to do in two steps.
5. Tap **`Loudness`**, then tap **`▦ 2 octaves`**, then **`▦ 3 octaves`** again.
   **Expect:** each switches immediately, and **the pane does not jump or scroll
   back to the top** — it is no longer rebuilt when you change this.
6. Tap **`Loudness`**, close the strip, reopen it, and tap **`▦ 3 octaves`**.
   **Expect: it comes back on 3, not 2** — the row count you chose is remembered
   even while the Y-axis is doing something else. *(This is the one I'd most like
   you to check: it's the case where two settings share one row.)*
7. Switch to **Flow** mode (rail 🌊) and reopen **Notes**.
   **Expect:** the top control now reads **`Number of notes`**, not "keys" — in
   Flow there are no keys to press. `Glide between notes` appears below the
   Y-axis row.
8. Switch back to **Keys** (rail 🎹).
   **Expect:** `Number of keys` again.

## B. Your saved setups still load

9. **Presets** → load a preset you saved *before* today, if you have one.
   **Expect:** it loads exactly as before, including its octave behaviour.
   **Nothing about what is stored has changed** — `yAxis` and `octaveRows` are
   still two separate settings, so there was no migration to get wrong.
10. Save a new preset, switch some Notes settings, load it back.
    **Expect:** everything returns, including the octave row count.

## C. The Sound pane

11. Open **Sound**.
    **Expect: all 12 voices visible at once** — Pure, Warm, Bell, Glass, Deep,
    Harp, E-Piano, Music box, Marimba, Kalimba, Synth, Pad. **No "All 12 ⌄"
    button.**
12. **Expect:** `Reverb`+`Echo` on one row and `Chorus`+`Mute` on the next, each
    sitting in its own rounded panel so it's obvious which switch belongs to
    which word.
13. Tap each of the four, anywhere on its half-row (the label, not just the
    switch).
    **Expect:** all four toggle, and you hear reverb / echo / chorus / mute
    actually change.
14. **Expect** the headings `Effects` and `Shape the sound` are **noticeably
    smaller than before** but still clearly headings — bigger and brighter than
    `Voice`, `Volume`, `Brightness`.

## D. Voice Visuals — the other capped list

15. Open **Voice Visuals** → **Visuals**.
    **Expect: every style shows** with no expander. This one I did not plan for —
    it was the second capped list and the sweep found it.
    *(Written when there were nine, including Flow. **Flow was deleted on
    2026-09-05 and there are eight**: Mandala, Lava, Waves, Pixels, LEDs,
    Ripples, Fireworks, Starfield. The step still passes — eight is under the
    cap too — but the list it named would fail.)*
16. **Expect** this pane is now slightly taller than the strip and **scrolls**.
    Check you can reach the bottom of it. *(Measured 1130 against a 1080 strip.
    If you'd rather have the expander back on this one pane, say so.)*

## E. Control size — the real point of the type fixes

17. **Setup** → **Control size** → **1.5**.
18. Open the **background colour** swatch (Visuals → `Background`).
    **Expect:** the dialog's text and its **✕ close button are now big too**.
    Before today they stayed at 14–16px on a 44px button while everything behind
    them grew.
19. Still at 1.5, tap **Lock** on the rail.
    **Expect:** the "Controls locked — press and hold the top-left corner for 3
    seconds to unlock" message is **large and easy to read**. It used to be
    pinned at 13px however big you'd set the controls — which is the thing that
    matters most here, because it's the instruction for getting back in.
20. Hold the top-left corner 3 s.
    **Expect:** unlocks, and the "🔓 Unlocked" confirmation is also large.
21. Set Control size to **0.8** and glance at a few panes.
    **Expect:** everything still legible, nothing overlapping or cut off.
    *(Then put Control size back where you want it.)*

## F. Nothing else moved

22. Play in three or four apps, including **Drum Pads** and **Sampler Pads**
    (open their pad dialogs).
    **Expect:** sound, touch and the dialogs all behave as before; the dialog
    text now follows Control size.
23. **Expect:** the diagnostics readout (Setup → `Show performance`) and the
    Sampler/Drums "editing" pill on the activity are **unchanged in size**. That
    is deliberate — they sit on the activity surface and already scale with it,
    so making them follow Control size would scale them twice.

## G. Chord Strummer

24. Open **Chord Strummer** → **Chords**.
    **Expect**, top to bottom: `Number of strings` · `Register` ·
    `Starting note` · the **Chord buttons offered** heading · the chord toggles
    · `Strum when a chord is chosen`.
25. **Expect** the six chord toggles sit **two to a row** — `C — I` beside
    `Dm — ii`, and so on — each in its own rounded panel.
26. Turn chord buttons off one by one until you have turned off **all six**.
    **Expect: the last one switches itself back on.** A student must never be
    given a chord bar with no buttons on it. *(Asserted in code too, but worth
    seeing.)*
27. Open **Sound**.
    **Expect:** `Strings sound` first, then **Effects** (Reverb+Echo, Chorus+Mute,
    then Volume), then **Shape the sound** (Brightness, Ring, Louder with faster
    sweeps) — the same headings and the same running order as Fluid Keys.
28. **Expect** the sliders read `Brightness (soft → bright)` and
    `Ring (short → long)` — they used to say `↔` and "Ring time".
29. Strum a few chords and move the sliders.
    **Expect:** sound behaviour is unchanged; only the layout moved.

## H. Setup

30. Any app → **Setup**.
    **Expect** the order: **This screen** (Control size) → **Start over**
    (Reset) → **This computer** (Performance, Show performance).
31. **Expect** Performance and Show performance are now the **last things on the
    pane**. They are developer controls and used to sit second, above Reset.

## I. Sweep Chimes

32. Open **Sweep Chimes**. **Expect the rail tab now reads `🎵 Notes`**, not
    "🎐 Chimes" — it holds only note controls now. Open it.
    **Expect**, and nothing else: `Number of chimes` · `Register` · `Scale` ·
    `Starting note`.
33. Open **Sound**.
    **Expect: no Scale, Starting note or Register here any more** — they were on
    this tab, which is where the musical content of this app sat in no other.
    **Expect**: `Material (look + sound)` → `Effects` (paired) → `Volume` →
    `Shape the sound` → `When the chimes move` (Knocking sounds, Breeze).
33b. **Two of your moves I did not make, and I'd like you to judge them.**
    `Breeze strength` and `Knocking sounds` are on **Sound**, not Visuals,
    because both make noise: breeze rings the bars directly (it is the only
    control that makes this app play with nobody touching it), and knocking
    gates the contact *sounds* — the bars collide either way. Turn Breeze up
    with your hands off the screen and listen. If you still want them in
    Visuals, say so and they move.
33c. Open **Visuals**. **Expect** `Hanging from` · `Note letters on screen` ·
    `Sweep trail` + `Touch ripples` paired · `Background`.
33d. Open **Setup**. **Expect** a new **`Access`** section between `This screen`
    and `Start over`, holding `One-touch sweep`. Check any other app's Setup
    — **expect no `Access` section there**, since only apps that offer one get
    the heading.
34. **Before touching anything**, sweep the chimes and listen.
    **Expect: it sounds exactly as it did.** The three new sliders sit at their
    0.5 default and every mapping is neutral there — this is the step that
    matters most, because it is the claim that nothing existing changed.
35. Drag **Ring** to the far right and sweep.
    **Expect:** a much longer tail — about three times the decay.
36. Drag **Ring** to the far left and sweep.
    **Expect:** a short, damped knock.
37. Put Ring back to the middle. Drag **Brightness** to each end and sweep.
    **Expect:** noticeably brighter / duller, **without getting louder or
    quieter** — it rides the upper partials only.
38. Drag **Attack** to the far left and sweep.
    **Expect:** a softer start to each chime rather than a sharp strike. *(Worth
    your ear specifically: a struck chime with a slow attack may or may not be
    musically useful. If it isn't, say so and I'll drop that one slider.)*
39. Try the same across two or three **Materials** — Metal rings longest, Bamboo
    and Woodblock are short.
    **Expect:** the sliders behave sensibly on all of them; nothing rings for an
    absurd length or cuts off abruptly.
40. **Presets** → save a setup with the sliders moved, change them, load it back.
    **Expect:** the shaping returns with the preset. **Nothing new is stored** —
    `tone`, `attack` and `ring` were always saved for every app; they simply did
    nothing here until now.

## J. The tuning audit — seven apps had the notes on the Sound tab

You spotted this on Song Grid. It was in seven apps, all from one copy-pasted
block, so check a few rather than all of them.

41. Open **Song Grid** → **Songs**.
    **Expect**: `Song` · `How it plays` · `Repeat when finished` · a **Tuning**
    heading with `Register` · `Scale` · `Starting note` · then **Your songs**.
42. Open **Song Grid** → **Sound**.
    **Expect: `Voice` → `Effects` → `Volume` → `Shape the sound`, and nothing
    else** — identical in shape to Fluid Keys. No Scale, no Starting note, no
    Register.
43. Change `Starting note` on the Songs tab and play.
    **Expect:** the song transposes, exactly as it did when the control was on
    the Sound tab. **Nothing about what is stored has changed** — the controls
    only moved.
44. Check the same two tabs on **Music Bubbles** and **Echo Bird**.
    **Expect** the tuning group sits with `Number of notes` / `Number of keys` —
    in those two the count was on Notes while the rest was on Sound, so it was
    split across tabs.
45. Also spot-check **Big Switch Songs**, **Beat Builder** and **Conductor**.
    **Expect** a `Tuning` section on the first tab and none of it on Sound.
46. Open **Soundscape** → **Scenes**.
    **Expect** a `Key for musical sounds` section at the bottom (`Register`,
    `Starting note` — there is no Scale here), with the note underneath about it
    applying when a sound is next switched on. **Sound** should now be
    `Effects` → `Volume` → `Winding down`.
47. Open **Drum Pads** → **Sound**.
    **Expect `Backing track (from this computer)` is here now**, not on the Pads
    tab. **Load a track, play and pause it.** *(This is the step most worth doing:
    moving it meant re-pointing its rebuild callbacks, and a mistake there would
    show as the button doing nothing or the pane flickering.)*

## K. Phase 4e — the app tab (`Song · Notes · Sound`)

This replaces what section J did: the `## Tuning` heading is gone, and the app
content it sat next to has its own tab.

48. Open **Song Grid**. **Expect six tabs**: `🎵 Song` · `🎵 Notes` ·
    `🎛 Sound` · `✨ Visuals` · `⭐ Presets` · `⚙ Setup`, in that order.
49. **Song** → Song, How it plays, Repeat when finished, Your songs.
    **Notes** → **Register, Scale, Starting note and nothing else.**
    **Sound** → Voice, Effects, Volume, Shape the sound. Compare Notes and Sound
    against **Fluid Keys** — they should read the same.
50. Change the song, then change `How it plays`.
    **Expect** the Song pane rebuilds in place and stays open. *(These controls
    used to rebuild the Notes pane; if I missed one it will close the strip or do
    nothing.)*
51. Check the other seven that gained a tab: **Big Switch** (`🔘 Song`),
    **Music Bubbles** (`🫧 Bubbles`), **Echo Bird** (`🦜 Bird`),
    **Conductor** (`🪄 Conduct`), **Beat Builder** (`🏗 Beat`),
    **Soundscape** (`🌧 Scenes`), **Chord Strummer** (`🎸 Chords`).
    **Expect** each one's Notes tab is only the tuning.
52. **Bubbles** and **Echo Bird**: **expect the note count sits with the tuning**
    on Notes. Their count was on one tab and the rest on the other.
53. **Drum Pads** and **Sampler Pads**: **expect five tabs and NO Notes tab.**
    A drum kit has no key, so a Notes tab there would be an empty pane.
54. **Voice Visuals**: **expect four tabs** — no app tab and no Notes tab. Its
    `Sensitivity` and `Extra boost` are microphone input, so they are now in
    **Setup → Access**. Check the microphone still works.
55. **Fluid Keys, Fluid Paint, Flock, Slime, Game of Life, Sweep Chimes**:
    **expect five tabs, unchanged** — they have no app content, so they pay
    nothing for this.
56. **Presets**: load a preset saved before today in two or three apps.
    **Expect** it loads and behaves identically. **No setting was added, moved or
    renamed** — only which pane draws it.
57. Set **Control size 1.5** on a six-tab app, then look at the rail.
    **Expect** the rail may now scroll — and **expect a visible scrollbar** down
    its edge when it does. It used to scroll with the bar hidden, so Setup and
    Lock simply vanished. Check you can still reach **Lock**.

---

## What I already checked

- **21 pages** load clean from `file://` — 0 `pageerror`, 0 `console.error`,
  0 failed requests.
- **17 apps × 5 panes × Control size 1.0 and 1.5 = 170 pane renders**: nothing
  overflows the strip at either size.
- The merged Y-axis row writes both keys, and `octaveRows` survives choosing
  Loudness (step 6, asserted in code as well as by eye).
- Strummer's two panes read in the asserted order, and the "you cannot turn off
  every chord" safety net still holds after the toggles were paired.
- Setup's three sections come out `This screen` → `Start over` → `This computer`.
- Every app's Notes tab asserted to hold **only** Register / Scale / Starting
  note / the note count (plus Fluid Keys' own `Up / down means…` and `Glide`,
  which are note behaviour and only exist where there is a surface to move on).
- The app tab appears exactly where `Anim.buildApp` is defined, and is first.
- **Every one of the 17 apps still reaches Control size 1.00 at 1920×1080**, six
  tabs or five.
- **184 pane renders** at Control size 1.0 and 1.5, nothing overflowing.
- Every pane of every app dumped and classified: **no musical content is left on
  any Sound or Visuals pane**. Six remaining flags were read and dismissed —
  Beat Builder's `Sounds` picks grid rows, `Speed` in Flock/Life/Slime is
  animation speed, `Key look` and `Key colours` are appearance.
- Sweep Chimes' two panes read in the asserted order, and the three shaping
  macros were measured landing in `chimeStrike` at the AudioParam: upper/
  fundamental 0.663 → 1.641 at Brightness 1.0 and 0.317 at 0.0; longest decay
  1.89 s → 5.67 s at Ring 1.0 and 0.47 s at 0.0; all three neutral at 0.5.
- `Number of keys` / `Number of notes` in both modes.
- Every size that was fixed now scales ×1.5, and the two on the activity surface
  correctly do not.

## Known, and deliberate

- **The Sound pane still scrolls on some apps** — but it is **88px shorter** than
  before, not longer, despite eight more voice chips: the paired toggles and the
  smaller headings more than paid for them. Panes that scroll went 10 → 11 of 51,
  the one that flipped being Voice Visuals (step 16).
- **`Brightness (dark → bright)`, `Attack (soft → crisp)`, `Ring (short → long)`**
  keep their parentheses — they say which way to drag.
- **Fullscreen is not in this branch.** It belongs on **Lock**, not the rail, and
  it needs its own lifecycle work (silent failure if the browser refuses;
  Esc/F11 not desyncing it from the lock state). Separate piece when you want it.
