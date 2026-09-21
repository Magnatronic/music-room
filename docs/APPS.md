# Music Room — App Roadmap & Specs

The living planning document for the sensory-room music suite. Apps are ordered by recommended
build sequence. Effort is relative (S/M/L). Update this doc as therapist feedback arrives.

**Where the files are** (2026-09-06): the top level of the repository is the room build and
nothing else — the launcher, the 20 activity files it lists, the four shared files and `assets/`.
The three delisted apps are in `archive/`, `template.html` and the two benches are in `bench/`,
and every `.md` including this one is in `docs/`. See README, *What goes in the room*.

## Cross-cutting conventions (every app)

- Built from `bench/template.html`; all apps share `framework.js` + `framework.css` (see README), so
  the sound system, input, menu, presets and lock are identical everywhere by construction.
- **Boomwhacker note colours** for anything pitched (C red, D orange, E yellow, F green, G teal,
  A purple, B pink) — matches the physical instruments the therapists use.
- **Therapist controls**: scale/root/register/number-of-notes where pitched; named per-student
  **presets**; **session lock** (hold top-left 3 s to unlock); volume + voice + effects.
- **Self-paced, no fail states** — apps wait for the student. "Wrong" input is never punished;
  at most it is quieter or neutral.
- **Offline-first**: zero network at runtime. Binary assets (samples) ship as base64 inside `.js`
  files loaded via `<script src>` (Chrome blocks `fetch()` of sibling files on `file://`).
  Sample-pack convention: `assets/<pack>.js` defining `window.SAMPLE_PACKS['<pack>'] =
  { sampleName: 'data:audio/...;base64,....', ... }`.
- **Backing tracks** are a feature, not an app: therapist loads their own MP3 via
  `<input type="file">` + `URL.createObjectURL` + `<audio>` (works offline, nothing bundled),
  with volume and pause controls in the Sound panel.
- Mic apps require the room's external microphone and never output the mic signal to the
  speakers unless the app is explicitly designed for it (feedback risk).
- **UI glossary — the same word always means the same thing** (from the 2026-07 UI review):
  **Theme** = a colour palette (Ocean, Lava…). **Style** = a behaviour/motion preset (Calm,
  Storm…). **Voice** = the timbre picker inside the Sound tab (Pure, Bell…). **Preset** = a
  saved whole setup, usually per student. Tapping a rail group opens the **settings strip**, a
  solid column beside the rail. It never covers the activity: the activity is scaled down to
  fit beside it, so nothing it has drawn is lost and all of it stays visible. It stays open
  until you tap its rail icon again (2026-08-25; `PHASE-3-STAGE.md`). The rail is **Notes · Sound · Visuals · Presets ·
  Setup** in every app; apps may re-label *Notes* when the pane genuinely isn't notes ("Songs",
  "Chords", "Scenes"), but the Sound tab keeps its name (icon variants allowed, e.g. Voice
  Visuals' 🔇). The root-note chips are always labelled **"Starting note"**, never "Key".
- **Setup pane** (added 2026-08-24): the display and the machine, not the music. Ordered
  **Fullscreen · Access · Reach area · Menu size · Performance · Show performance**
  (2026-08-31). Mostly
  by *who owns the setting* — Access and Reach area are the student's and ride in a preset,
  Menu size is
  the display's and never does, the last two are the developer's. **Fullscreen breaks that
  on purpose and goes first**: it groups with Menu size by ownership, but it is reached for
  often when a machine is being set up, and the pane opens on its first control.
- **Reach area** (2026-08-31): **Size** (25–100%), **Place it**, and **🖥️ Fill the screen**.
  On a projector filling a wall, a student in a wheelchair can reach one part of it; this
  shrinks the whole activity into a rectangle they *can* reach. Nothing is cropped — the
  activity is mapped into the rectangle, so every note and every corner is still there.
  With **Place it** on, dragging the activity moves it and plays nothing; turn it off to
  play again. It is one transform in `fitSurface()`, so **all 19 apps get it identically
  with no per-app work**, and it survives Lock. It does **not** survive a page load: it
  describes where a chair is today, not what a student is like, so a shared room PC never
  inherits one. A launch link that names it, or a preset, restores it deliberately.
  `PHASE-7-REACH-AREA.md`.
  **There is no "Reset all settings" here any more** — it was always a preset, and it now
  lives in the preset list as **↺ Defaults**.
- **Launch links** let the room PC's control software open an app already set up
  and locked: `app.html?s=noteCount:5,voice:synth,reverb:1&lock=1`. `s=` lists only
  what differs from the app's defaults; `lock=1` opens it ready to play, and the
  3-second corner hold still reaches the whole menu. Build one with **🔗 Copy launch
  link** on the `Presets` pane — it has a **Start locked** toggle and copies to the
  clipboard. A link carries **the activity's setup only**: never the display's menu
  size, never a student's access setup, so launching an activity can never turn off
  a switch or a dwell. Junk in a link is ignored and says so on screen. Fullscreen
  is not in the link and cannot be — no URL can go fullscreen at load — so the
  launcher starts Edge with `--start-fullscreen`. `PHASE-6-LAUNCH-PARAMETERS.md`.
- **`Music Room.cmd`** opens the launcher in Edge already fullscreen, and **stays** fullscreen
  across every page, which the in-app toggle cannot. Deliberately not `--kiosk`: Edge's kiosk
  mode runs InPrivate and would discard every preset when the window closed.
- **Presets can be carried off the machine** (`PHASE-10-PRESET-BACKUP.md`). 💾 **Save all
  presets to a file** writes **every app's** presets into one `.json` — through a real **Save
  as** dialog where the browser has one, so it can go straight onto the room's USB stick
  (measured: `file://` is a secure context and `showSaveFilePicker` opens in Edge and Chrome;
  Firefox lacks the API and takes a download instead); 📂 **Load presets from a
  file** merges one back. IT asked where presets and recordings are kept, and the answer exposed
  the gap: presets lived only in this browser profile's `localStorage`, so *clear browsing data*
  or a reimaged PC took every therapist's saved setup with no way to have kept a copy — while the
  Sampler's recordings already had a file.
  **Import can only ADD.** Same name and identical settings is skipped, so importing the same
  file twice does nothing the second time; same name and *different* settings arrives as
  `name (2)`. Nothing on the machine is ever overwritten or deleted, because a room PC is shared
  and two therapists can each have an "AM — calm" meaning different students.
  **Settings, recordings, `ui-scale` and `fullscreen` are deliberately not in the file** — the
  first two have their own homes, and the last two belong to the *display*, which is why
  `uiScale` is stripped from a preset when it is saved. **The file carries preset names**, so the
  pane repeats that these are initials only: a file leaves the machine in a way `localStorage`
  does not, and a downloads folder may be synced.
- **↺ Defaults is a preset** — the one you always have, first in the `Presets` list. It is
  `applyPreset({})`, and the only difference is that it also clears the artwork: *Defaults*
  means "as if you had just opened the app", and it is the only way to wipe the canvas in
  the twelve apps that hide the 🧹 Clear rail button (Conductor's baton trail accumulates
  and has no other control). **Tap-twice** — *"Tap again to reset"* for three seconds —
  because it is the only row in the list that destroys anything; the others just swap
  settings. It was a button reading *Reset all settings* on the Setup pane, and before that
  the same button on this pane, where it read as "wipe my students' saved setups". Naming
  it after the thing it loads is what fixed that; the location was never the problem.
- **Fullscreen** (first on `Setup`) hides the browser bars and the taskbar so the
  activity fills the screen. Stored under its own `fullscreen` key, per display — a preset
  never carries it and ↺ Defaults never clears it. The switch shows what the
  browser is really doing, so Esc and F11 just turn it off. A fresh page load starts
  windowed (a gesture-less request is refused) and the preference re-applies on the first
  tap in the new app. Switching it fires `Anim.resize`, so set it before a student starts.
- **🔒 Lock also takes fullscreen, and gives it back.** Lock is the "hand it to the student"
  gesture, and its click is the user gesture the Fullscreen API needs. The lock only
  **borrows**: the `fullscreen` key is never written by a lock, so a student's session
  cannot turn the therapist's display setting on. If the preference was already on, the
  lock does not own fullscreen and the unlock hold leaves it alone. Esc or F11 ends the
  loan without unlocking. A browser that refuses still locks, silently.
  **In a room launched with `Music Room.cmd` nothing visibly happens** — the window is
  already fullscreen, so nothing resizes and nothing on the canvas is lost. From a
  *windowed* browser it is a real resize, which clears the canvas in Life, Conductor,
  Bubbles, Slime and Fluid Paint. See `PHASE-4H-FULLSCREEN-ON-LOCK.md`.
- **The Access pane is three tabs** — `Controller`, `Mouse`, `Buttons`. **Tabs, not a mode
  switch**: every device stays live whichever one is showing, because a therapist on the
  mouse and a student on the stick is the normal case, not a conflict. Everything on all
  three is **per student, so it rides in a preset**. `PHASE-5C-ACCESS-PANE.md`.
- **Controller** (`padOn`/`padButton`/`padSpeed`/`padDead`/`padAuto`) turns a gamepad stick
  into a pointer and a button into a press. Off by default; with nothing plugged in nothing
  polls and nothing draws. The button is *learned* by pressing it, because nothing in
  software can know which switch is in which XAC port; with none learned, **any** button
  presses. Buttons are shown by **name** (`A`, `Left trigger`) wherever the pad reports the
  standard mapping — which is what turns "which XAC port did I just press" into something
  readable. **A real XAC does report it**, confirmed on hardware 2026-08-30, so its ports
  come through by name; the fallback to `Button 6` is for pads that do not. **Pushing the stick plays** (`padAuto`) makes deflection itself the press, for a
  student who cannot work a button at all; a button still works alongside it.
- **Dwell**, on the Controller tab *and* the Mouse tab, and **per device**
  (`dwellPad`/`dwellPadMs`, `dwellMouse`/`dwellMouseMs`, 0.4–6.0 s). For the other student
  — one who can aim accurately but cannot press. **Travel is silent**; arriving and holding
  still plays a note. That is what makes it a different setting from *Pushing the stick
  plays*, which sounds every cell crossed on the way. Per device because the therapist works
  the mouse while the student works the stick, and one shared setting would make the
  therapist's own mouse fire whenever they paused.
  **A dwell is a CLICK, not a hold**: it presses, holds 250 ms, and lets go on its own with
  nothing having to move — a press that ended only on the next movement was a note that
  never ended for the student least able to move again. **One click per arrival**; only
  movement re-arms it, so resting does not repeat it. The count runs **only while stopped**,
  with a 6px jitter allowance measured from an anchor so a slow creep cannot quietly
  complete a dwell. The controller measures stick **deflection** instead, because at the
  edge of the surface the cursor stops while the stick is still pushed.
  **Never for touch** — a hand resting on the glass would fire it constantly, so it is
  excluded by construction, not by a setting. Under `padAuto` the controller's dwell toggle
  is replaced by a line saying why: never a toggle that silently does nothing.
- **A modal owns the screen** (`.modal`). While one is open the stick's pointer **suspends**
  — the note lifts, the ring goes, and it resumes **where it was left**, not at the centre,
  so a student slow to aim does not lose their aim because a therapist opened a picker.
  **Bound keys and buttons keep working**, exactly as they do while the session is locked:
  a modal stops *where* a student is pointing, never *when* they play. Before this the stick
  played notes behind the colour picker in every app that has one, and retargeted the Drums
  and Sampler pad editors onto a different pad while the therapist was in them. There are
  three modals — `clrOv` (framework), `dpOv` (Drums), `smOv` (Sampler) — the same three that
  sit on the body rather than `stageEl`; a new one opts in with `class="modal"`. The mouse
  needs no rule: its dwell is gated on the canvas's own `mouseenter`/`mouseleave`.
- **Big pointer** (`bigPointer`, Mouse tab) draws the high-contrast ring for the mouse, for
  a screen across a room. It is forced on while mouse dwell is on, because **the ring is
  what shows the dwell countdown filling**. The system arrow is hidden over `#surface`
  — never over the rail or the panel — when a ring is drawn in its place.
- **Buttons** (`bind`) gives a **key or a controller button** to any **rail button this app
  already has**, so no app declares anything. `bind` is keyed by action —
  `{ '<railId>': {type:'key'|'pad', code} }` — and replaces Phase 5b's `keyMap`, which is
  folded in once on load. Out of the box **X → Clear** and **Y → the app's main action**
  (Play/Pause/Restart, found by the name already on the rail), only where the app has them;
  ✕ clears one and it stays cleared. **A button given a job stops playing a note**, every
  unbound button still plays, and the Controller tab names live which ones went quiet. One
  physical trigger has one job: taking one already in use moves it. A held key fires once, a
  macro burst fires once (250 ms guard), and both keys and buttons keep working while the
  session is **locked**, because that is when the student is playing. For a keyboard-style
  switch box such as the Microsoft Adaptive Hub. `PHASE-5B-HUB-KEYS.md`.
- **Menu size** (`--ui-scale`, 0.8–1.5; the setting is still `uiScale` and the key still
  `ui-scale` — the 2026-08-27 rename was the label only) scales every control, label and slider from one
  number. It is a property of the **display**, not of an app or a student: it lives under its
  own global `ui-scale` key rather than the per-file `settings:<file>` blob, so setting it once
  applies to all 19 apps and the launcher. Presets deliberately do **not** capture it. The
  ceiling is per-display — `fitUiScale()` steps it down until the rail fits, because on a
  768-high screen a 1.5 rail pushes 🔒 Lock off the bottom, and the rail scrolls with a hidden
  scrollbar. What was asked for is remembered; what fits is applied.
- **Never write a raw pixel size or colour for a control.** Everything derives from the token
  block at the top of `framework.css`, and every size multiplies by `--ui-scale`. Contrast
  floor: secondary text never below `0.72` alpha, borders never below `0.30`, nothing under
  14px. Panel helper text uses the `.hint` class. (The floors were swept across every app and
  pane on 2026-08-24; the violations were all inline `style.cssText` in app files.)
- **No drawers — every control is on the pane.** Set-once controls (app sliders, background
  colour) sit at the bottom of the Visuals pane under their own `.sectn` heading, with the
  everyday ones above: Style chips, paint colours, and (Keys mode) zone/press feedback. Order
  is the only grouping mechanism; there is nothing to open. *The `Fine-tune` disclosure and
  `appendFineTune` were removed in Phase 4c (`PHASE-4C-FINETUNE.md`); Performance and
  Show-performance had already moved to the Setup pane on 2026-08-24, being properties of the
  machine rather than of an app's visuals.*
- **Remove a group's last control and its heading goes too.** Eight apps spent a day rendering
  a `Fine-tune` drawer that opened onto nothing, because the controls moved out and the
  container stayed. The framework cannot enforce this — an app appends its own children — so
  `UAT-PHASE-4C.md` §B sweeps every app × every pane for a `.sectn` with nothing under it.
- **Every chip in a group is shown.** Groups longer than 8 used to collapse to 4 plus an
  "All N ⌄" expander — removed 2026-08-26: an expander is one more thing to find before you
  can choose, and Voice is the most-used control on the Sound pane. Two groups were capped,
  not one (Voice, and Voice Visuals' styles — 9 of them then, 8 since Flow was deleted on
  2026-09-05). The rows came back from pairing the effect
  toggles two to a row (`.tgpair`) and dropping `.sectn` to `--font-l`.
- **A section heading groups several controls; a control's own label is `.ctlh`.** They were
  both `.sectn`, so every chip row shouted as loudly as the section it sat in. `.ctlh` matches
  the toggle and slider labels beside it: `--font-m`, weight 600, `--ink-dim`.
- ~~**Chip groups longer than 8** collapse to 4 options plus an "All N ⌄" expander~~
  (`CHIP_CAP`/`CHIP_SHOW` in framework.js). The current value is always among the visible ones.
  This is what pays for the taller controls: 12 voices was a wall of chips that pushed
  everything under it off the panel.
- **Voices** (expanded 2026-07): Pure, Warm, Bell, Glass, Deep, Harp (layered decaying
  harmonics — a Karplus-Strong delay-line version was tried and cut, see the note in
  framework.js), E-Piano (2-op FM tine), Music box,
  Marimba and Kalimba (modal synthesis on the real instruments' inharmonic partial ratios),
  Synth, Pad. Retro and the generic Pluck are retired; saved settings migrate to
  Synth/Kalimba automatically. Three **sound macros** — Brightness, Attack, Ring — sit at the
  bottom of the Sound pane under `Shape the sound` and map across every voice (0.5 = the
  engine's original values); presets capture them like any other setting.

## Custom song import (framework feature) ✅ BUILT

Therapists should be able to add their own songs to the shared library (`songs.js` powers Song
Grid, Big Switch, Echo Bird, and Music Bubbles' song mode). Import format: **ABC notation** —
plain text pasted into a textarea in the therapist panel, so it works offline and songs are
freely findable online (abcnotation.com, thesession.org: search "<song name> abc").

- Parse a melody subset only: `T:`/`K:`/`L:` headers, notes A–G with octave marks and duration
  multipliers, rests, bar lines (ignored). ~100–150 lines, no dependencies.
- Convert absolute pitches to scale degrees relative to the declared key → the existing
  movable-do `[[deg, beats], ...]` format, so imported songs transpose with root/register/scale
  automatically and work in every song-engine app for free. Compute `span` from the range.
- Notes outside the scale snap to the nearest degree with a gentle "n notes adjusted" notice —
  never reject a song outright.
- Also accept bare letter lines (`C C G G A A G`) — the format of Boomwhacker song sheets.
- Custom songs persist in localStorage; export/import as `.json` so therapists can share song
  packs between machines.

---

## 1. 🎵 Song Grid — `song_grid.html` ✅ BUILT

**Concept.** The note grid from Fluid Keys becomes a song teacher: pick a song, and the grid
lights the next note; the student plays the whole song by pressing lit cells at their own pace.

**Therapy goals.** Sequencing, cause-and-effect, guaranteed success experience, turn-taking
(therapist and student can alternate notes), fine/gross motor targeting (cell size via
number-of-notes/octaves).

**Modes.**
- **Listen** — autoplays the song at a tempo slider's speed; cells light as it plays.
- **Follow along** (default) — the next cell pulses with a glowing halo; pressing it advances.
  Other cells still sound (quietly) — exploration is never an error.
- **Rhythm** (stretch goal) — cells light in tempo, student plays along, sparkles reward
  on-beat presses. No misses, no score.

**Songs.** Stored movable-do: `{name, emoji, notes:[[deg, beats], ...]}` where `deg` is a scale
degree (negative = below root, 8+ = next octave) — songs transpose automatically with the
root/register controls and reuse `buildScale()`. Starter set (public domain): Twinkle Twinkle,
Mary Had a Little Lamb, Hot Cross Buns, Ode to Joy, Frère Jacques, Happy Birthday, Row Your Boat.

**Reward.** Completion shimmer: all cells ripple-flash in sequence + celebratory arpeggio.

---

## 1b. 🃏 Sound Match — `sound_match.html` ✅ BUILT

**Concept.** A pairs game where a pair is a **note**. Turn two cards over; if they are the
same note they are won and stay won, and if they are not you hear them again, one after the
other, before they turn back.

**Therapy goals.** Auditory memory and discrimination, turn-taking (a real two-player mode),
sustained attention, and — via the Boomwhacker colours — the same colour-to-pitch association
the physical instruments carry.

**No fail state, the same as everywhere else.** A pairs game normally punishes a mismatch by
turning the cards back and taking your turn away. Here **forgiveness is a difficulty axis**:
*Stay up* means a revealed card never re-hides (matching, not memory) and stays choosable;
*Flip back* is the classic, with **They stay up for** 1 / 2 / 4 seconds. Nothing is scored,
nothing is timed, and in one-player no turn is lost. A mismatch never buzzes.

**Board size is Small / Medium / Large / Huge** — **2×2, 3×2, 4×3 and 5×4**, stated grids
rather than a search. Letting the app choose the shape gave boards that were even, full and
still wrong: with four cards on a 16:9 screen, 2×2 and 4×1 score within a percent of each
other, so the same size came out a block on one display and a single row on the next. The
stated grid fills the activity — cards are not square and need not be; what made a small board
look unbalanced was the grid changing shape under it, not the card proportions. On a display
taller than it is wide the grid turns. Columns × rows as sliders was tried first and dropped:
it let a therapist build 3×3, and a pairs game cannot use an odd card. The pair count falls out
of the size and the app writes `noteCount` itself, so there is no number-of-notes slider
anywhere and the two can never disagree.

**The Notes tab is Register, Scale and Starting note — and nothing else.** Built with the
framework's own `appendTuning`, so those three keep their order and labels. The count is gone
because the grid owns it, and the *Up / down means…* row is gone because this app never reads
the height of a touch: it would be a control that does nothing.

**The Visuals tab is Colour strength and Show note letters.** Nothing is painted here, so
paint trails and paint colour would be the same kind of dead control. Colour strength runs
0–100% and pulls each face toward the grey of its own brightness — all the way to grey at the
bottom — for a student who finds saturated colour hard going or a projector that oversaturates.

**How they match them** (the 🃏 Game tab) is the one difficulty control:
- **Colour and sound** — the note's Boomwhacker colour with its letter. An octave up is the
  same colour *lightened* with a mark on the letter (C, C′), because eight pairs of a
  seven-note scale wraps round and C and C′ share a pitch class: without it two different
  pairs would be drawn as the same card.
- **Sound alone** — every face identical, carrying only a waveform that wakes up while that
  card is sounding. Each pair takes **its own voice**, because a tone apart on one instrument
  is not a difference a student can hold in their head. This mode **withdraws Stay up**: the
  two cancel, and a board of identical face-up cards tells you nothing.

**One sound at a time.** A card's note damps the one before it, so the second card is never
heard through the first's tail — that is what makes two cards of a pair actually sound the
same. **A match never replays**: the answer is already yes, and the seconds it cost were a
student waiting to be told what they had worked out. A mismatch replays only if **Play them
again** is on, for a student being taught to compare; then the gap between the two follows the
Sound tab's **Ring** macro rather than being a constant.

**Changing the Notes tab retunes the board, it does not deal again.** Register, Scale and
Starting note change *which* note each card is, not how many there are or where they lie, so a
register nudged mid-game costs nobody their board. (The first cut passed its own callback to
`appendTuning` without calling `refreshMusic()`, so those three rows changed `SETTINGS` and
nothing else — the pane looked live and the game never moved, while the old handler re-dealt.
An app substituting its own tuning callback must still call `refreshMusic()`.)

**The card flip is 2D, deliberately — do not reintroduce `preserve-3d`.** A card squashes to
nothing on the X axis and comes back, and its two faces swap which is opaque at the halfway
point, where the card is 6% wide. It looks like a flip, there is no back face that can leak,
and nothing is promoted to a compositor layer of its own.

The 3D version it replaced (`transform-style:preserve-3d` + `rotateY` + `backface-visibility`)
produced **dark lines across the cards on a real GPU that no headless run could reproduce** —
a compositor tile seam, at a fixed screen x, crossing several cards at once and visible on a
plainly revealed card. Three patches were tried against it: separating the faces in z, fading
the back out, and `will-change` to force each card onto its own layer. **Each fixed the case in
front of it and left the class of fault alive**, and `will-change` on a large card arguably
made tiling more likely rather than less.

**This class of fault cannot be caught here.** Playwright runs a software rasteriser: a
detector that scanned inside every card for a dark line against its own background, at three
device pixel ratios, on flipped cards and on a won board, passed on the *broken* build as
readily as on the fixed one. GPU compositing needs a real GPU and a person looking — the same
limit the verify skill records for the WebGL apps. The lesson is the one that generalises:
**when a fault cannot be reproduced in the harness, delete the mechanism rather than patch
around it.**

**Winning fills the board back in.** It ends as a grid of hollow outlines, which is a quiet way
to finish something a student has just worked through — so every card lights in its own colour
and sounds, in a wave across the board, and it is left glowing.

**Sound.** Cards sound through the framework's own `pluckNote` at the note's column, so the
Sound tab's voice, effects, volume and the Shape-the-sound macros all apply unchanged.
`noVoices:true` — a press is one card, not a sustained pitched zone.

**Input.** The cards are DOM but carry **no click handler**: a tap arrives through
`Anim.splat` with `opts.velScale === 0`, the press marker onDown sets (PHASE-4I). That is the
one path a finger, a mouse, a dwell and a gamepad stick all share, and a drag across the board
turns nothing over. **Every layer of the board sets `pointer-events:none`** — the framework's
mouse and touch listeners are on `canvas` (`framework.js:1164`, `:1204`) and the board covers
it, so anything here that accepts a pointer swallows real clicks entirely, while the gamepad,
which calls `onDown()` directly, carries on working. **There is no press-and-hold "peek"** — an app is told about presses, not
releases — so re-listening is a second tap on your own first choice, which takes it back and
costs nothing.

---

## 1c. 🎹 MIDI Light — `midi_light.html` ✅ BUILT

Design: `PHASE-9-MIDI.md`. On the launcher under **Plug in an instrument** — a section named
for when a therapist reaches for it, like every other, rather than for the technology:
"MIDI" means nothing to someone who does not already know the word, and the precondition is
that something has to be plugged in.

**Concept.** Plug any MIDI instrument in and play it — keys, pads, knobs.

**Two people playing at once is NOT what is special about it.** The framework has taken five
simultaneous touches since Phase 0, so a therapist and a student can already share Fluid Keys
or Drum Pads. What is different here is that the two are at **different surfaces** — one at the
instrument, one at the screen — so neither has to reach across the other, and a student who
cannot reach the screen at all can still play.

**Why it earns a place.** Not "MIDI is fun": **a MIDI instrument is another route in.** A pad is
a large physical target with resistance and a rebound; a weighted key gives feedback glass never
will. For a student who cannot organise a touch on a flat screen, a pad may be reachable when
the projector is not. That puts it beside the gamepad pointer and the reach area.

**It cannot depend on knowing the device, because the room does not know either.** A MIDI port
offers a name, a manufacturer and an id — there is no field that says "drum pad". So:

- **A note's own LENGTH decides whether it is an impact or a sustain**, not the instrument. A
  tapped pad is 20 ms and a held chord is two seconds; that is observable per note and adapts to
  the player as well as the device. Classification survives only as a hint on the pane
  (🎹 keys · 🥁 pads · 🎛️ knobs) and never gates behaviour.
- **It finds its own range**, from a rolling window of recent notes so it contracts as well as
  widens. Eight pads on notes 36–43 fill the whole screen; so does an 88-key piano; a device
  swapped mid-session is followed within a few notes. It snaps while learning and eases after —
  easing from the starting guess made the first thing anyone played slide about for three
  seconds.
- **Every note is pulled into the Notes tab's scale**, so a wrong one is not possible and a drum
  pad — which has no musical pitch — makes music rather than a low cluster. **As played** is
  there for a therapist who wants the instrument's own tuning.

**Sound is the framework's, with no framework change.** A snapped note is a scale degree, the
framework's notes are scale degrees, so a note is a column: `startVoice(x, velocity)` with
`yAxis:'loud'`, which is what makes a sustained framework voice answer to how hard a key was
pressed. The whole Sound tab applies.

**One range PER CHANNEL, not one for the app.** The pads and the keys of a single controller are
separate instruments on separate channels: eight pads on notes 36–43 inside a keyboard's 36–84
span all land on the bottom column and play the same note, which is what "the pads seem
different" turned out to be. Each channel gets its own span and its own spread.

**The Notes pane is built by the app**, and deliberately does not offer *Up / down means…*: this
app puts the VELOCITY on y (`yAxis:'loud'`), so exposing that row would let a therapist silently
break the velocity response. It offers Register, Scale, Starting note and how many notes.

**Seven styles**, each with **its own three parameters** on the Visuals pane — the pane never
offers a control the current style cannot honour. **🌈 Aurora** (bold columns, polyphony reads as
chords of light) · **🎆 Fireworks** (a burst then falling embers; a held note keeps a fountain) ·
**💧 Ripples** (rings spreading and crossing) · **🫧 Bloom** (soft circles that breathe while
held) · **✨ Constellation** (notes as stars, joined when played close together) · **🎨 Splash**
(paint that stays and builds a picture) · **🌫️ Static swell** (density follows what is held;
static has no gradient, so it cannot band). Ribbon was built and cut — the user did not like it.

**Every style answers both a tap and a held note.** A sustain-first style that draws nothing for
a tap leaves a student who only taps looking at a blank screen; Static swell had exactly that
fault and now throws a puff on impact as well as standing a field while held.

**Height is velocity**, hard: `0.10 + 0.86·force^0.75`, so a soft press looks soft and a hard one
reaches for the ceiling.

**Seven palettes** — Note colours (the Boomwhacker ones, and the default because they agree with
the instruments in the room), Ocean, Fire, Forest, Candy, White, and **🎲 Random**, which gives
each note its own colour and *holds it steady for that note*, so a phrase keeps its identity —
a colour redrawn at random every frame would strobe, which is the last thing a sensory room
wants. A ramp palette maps the *played range* rather than the note, so it works whatever is
plugged in.

**Persistence is a SNAPSHOT OF WHAT WAS DRAWN**, not a token mark. Each style used to stamp one
representative blob at the note's position, so an explosion left a circle behind and a
constellation left a circle behind — the picture recorded *where* a thing happened rather than
*what it looked like*, and Static swell stamped nothing at all. The styles now draw onto a
transparent live layer which is composited into the picture, so the actual embers, the actual
rings and the actual joining lines are kept — **for every style, including ones not written yet,
with no per-style code**.

Three things that layer had to get right:

- it is **transparent where nothing was drawn**, so a stamp only ever touches pixels a style
  painted and older marks elsewhere are never washed out;
- it composites **`source-over`, not `lighter`** — an additive layer that is never cleared climbs
  to white and stays there;
- it is deposited **per second, not per frame**. A fixed alpha every frame lays an ember down
  ninety times over its life, and eighteen notes of Fireworks filled the screen with a flat
  orange wash. Scaling by `dt` also makes the build-up independent of the frame rate, which
  matters because `quality:auto` moves it.

**🧽 Wipe** on the rail clears the picture. Splash carries a `minPersist` floor, because a
painting that vanishes is not a painting. No measurable cost: with ten notes held at once on a
1920×1080 canvas, persistence on and off both hold a 16.7 ms median frame.

**A touch lands where it is touched.** A MIDI note has no place of its own, so it takes x from
the played range and y from how hard it was hit; a touch *does* have a place, and deriving its
height from velocity put the light somewhere the finger was not. Measured at two corners of the
screen: the light lands within 0.00 of the touch on both axes.

**Robustness a room needs, and ONE PORT PER INSTRUMENT CARRIES THE NOTES.** The Akai MPK mini IV
presents four ports, and all are bound because there is no telling in advance which one has the
keys — but when two of them deliver the same keypress the app hears two presses, and if those
arrive on *different channels* they get different auto-ranges, land on different columns and
**play two different pitches at once**. That is what "it sounds like a piano with a synth
underneath" was: not two timbres, two notes. The first port of a **device** to send a note now
owns that device's notes and its siblings are ignored — per device and not globally, because a
therapist's keyboard and a student's pad are two instruments and both must play. The claim lapses
after three seconds of silence, so an instrument that switches its output still works, and a
same-note repeat inside 15 ms is dropped as a second net.

The rest of what a room needs: system real-time bytes (clock, active sensing) are ignored;
`All notes off` is obeyed; a device unplugged mid-note releases what it was holding; nothing
sounds for ever if a device forgets a note-off; a **🔇 Silence** rail button stops everything; and
a touch on the screen plays it, so it is never a dead screen with no instrument attached.

**Something else on the machine may be sounding the instrument too, and this app cannot stop
it.** Web MIDI does not take exclusive ownership of a port: every program that has the device
open receives the same notes. On Windows a controller routed to the **Microsoft GS Wavetable
Synth** — usually by the manufacturer's own software sitting in the tray, and the MPK's ports are
named "DAW Port", "Plugin Port" and "Software Controller" precisely because that suite exists —
plays a General MIDI piano that no setting in here can change.

The symptom is exact: **the Sound tab's voice is audible underneath a piano that never changes**,
and a touch on the screen sounds correct because a touch is not MIDI. Confirmed from the other
direction as well — the app builds bit-for-bit the same voice for a MIDI note as for a touch:

| Sound tab | from MIDI | from a touch |
|---|---|---|
| Pure | `sine@440` | `sine@440` |
| Synth | `sawtooth@440 ×3` | `sawtooth@440 ×3` |
| Bell | `sine@440 sine@1214 sine@2376` | `sine@440 sine@1214 sine@2376` |

**The test that settles it in the room:** close this page entirely and press a key. If a piano
still sounds, another program is playing the instrument, and the fix is to close it — nothing
here can.

**The permission prompt appears on every connect** — a `file://` origin does not persist it. That
is the same bargain Voice Visuals already makes for the microphone.

**The canvas is cleared and redrawn, never faded**, so it cannot grow the ghost that took four
attempts to remove from Soundscape.

---

## 1d. `midi.js` — the file four of the five MIDI apps share

Loaded with `<script src>` **after** `framework.js`, the way `songs.js` is shared by Song Grid,
Big Switch, Echo Bird and Bubbles. It exists because five apps were about to carry five copies of
plumbing that took a whole phase to get right, and because the menu wording of six apps drifts
apart the moment each writes its own.

**MIDI Light is the exception and loads only `framework.js`.** It was built in
Phase 9, before this file existed, and keeps its own `connect`/`bind`/`onMidi`
and its own `.mlnote` status line (`midi.js` calls that class `.midinote`).
**Anything wrong with the reader must be fixed in both places** — see
`PHASE-9C-MIDI-CONNECT-WAIT.md` §2, where believing "six apps share it" almost
shipped a half fix.

It holds **the reader**: one port per device owns that device's notes; one learned range per
channel; system real-time ignored, `All notes off` obeyed, a device unplugged mid-note releasing
what it held, nothing sounding for ever. It holds **the translation**: a note becomes a column of
the therapist's scale, which is why the whole Sound tab applies with no framework change, and
`stepBy` moves a note by scale degrees so an app can answer or harmonise without leaving the key.
It holds **the shared menu blocks** — the Connect block, `Notes played`, the palette row, the
Notes pane — so the six cannot say the same thing in six ways. And it holds `PX`/`PY`, which give
a finger its own place and fall back to the played range and the velocity only for a note that
has none.

**It never draws.** Every picture in every MIDI app is that app's own.

**A ramp palette takes its colour from the HIT, not from the note** (Phase 15, and the user's
observation). `colourOf`/`colourOfCol` used the note's position across the keyboard, and the mark
is drawn at that same position — so a note always painted the same colour in the same place, and
a phrase played repeatedly built a picture in a handful of colours each pinned to its own stripe
of the screen. They now take the point on the ramp from the event's own random `hue`, which every
event has carried since Random was fixed to be per-hit. A mark still keeps ONE colour for its
whole life; a colour rerolled each frame would strobe, which is the last thing a sensory room
wants. `🎵 Note colours` and `🎲 Random` never reach that branch and are unchanged.

**Three things it now answers once for everybody**, added in Phase 9d because five apps had
answered them five ways or not at all:

- **`BLEND`** — every app draws marks through `screen`, not `lighter`. Addition clips to white and
  nothing limited how many marks could overlap, which is one cause behind three separate faults
  the user found. `screen` approaches white without overshooting. One name here rather than a
  choice per look, because a look set wrong is a therapist's problem and this cannot be set wrong.
- **`level(force, soft)`** — one loudness for all six. Four apps fired plucks at `gainMul`
  0.07–0.24 while Big Chords and MIDI Light hold framework voices at full velocity, so four of
  the six were about five times quieter than the other two.
- **Two palettes that do not run to white** — `💎 Jewel` and `🌑 Deep`. Every other ramp ends at
  250–255 across all three channels, so the top of a range paints in **white**, which is most of
  why a kept picture drifts pale as it builds. These stay saturated the whole way up and are the
  ones to reach for with Persistence on.
- **`LINGER` / `makePaint()`** — how long a mark lasts, and whether a picture is kept. The
  controls are **Linger** and **Persistence**, the second being the name MIDI Light has always
  used, because a control that means the same thing has to be called the same thing.
  **Persistence is a TOGGLE, not a slider** (Phase 15): the user watching it in the room asked
  for "no persistence or 100%", because a picture caught halfway through fading does not look
  good. The fading code is still there and still correct — it is simply never asked for a partial
  value. It reads `> 0`, which is the same truthiness the switch itself draws from; a threshold
  that disagreed with the switch is exactly how this shipped broken for anyone holding a
  fractional value from the old slider. See `probes/phase-15/agree.js`. **Linger is
  offered only by Big Chords and Mirror**, whose marks have no lifetime of their own; Loop Garden
  and Drift each name theirs on their first tab, and had the slider on the pane **doing nothing**
  until 2026-09-02.

**A KEPT PICTURE USED TO GO GREY IN THE MIDDLE, and the cause is the DEPOSIT RATE.** Stamping a
few percent of the live layer per frame means a pixel needs about twenty-six frames under a mark
to take its colour, and a mark is only over it for two or three — so its value is a long-run
**average** of everything that ever passed, and the average of many hues is grey however slowly
you take it. Where the playing piles up, everything passes.

**Depositing hard fixes it.** `1-exp(-dt*45)` puts most of the mark down in the frames it is
actually there, so the picture holds the colour of the **last thing that passed** — a saturated
colour — instead of a mean. It is frame-rate independent. Measured against a copy of the old
code, repeated clicks in one place at *kept for ever*:

| | saturation over fifty seconds | luminance |
|---|---|---|
| before | 0.643 → **0.559**, still falling | 50 → 117, still climbing |
| after | ~0.65, **steady** | plateaus at 127 by twelve seconds |

**Two wrong answers came before that one, and both are worth keeping.** The first was to slow the
deposit — which only postpones an average. The second was to let the picture **fade**, which
bounds how much paint is on the canvas but does nothing where paint arrives faster than it leaves,
so the middle still averaged its way to grey. The fade stayed because it is independently useful:
below the top of the slider the picture reaches a steady state instead of filling, using
`destination-out` on a **transparent** layer, which multiplies alpha down and **converges** —
unlike painting the background colour over an opaque canvas, which never arrives and leaves a
ghost (see Soundscape). **Persistence now means what the word means:** how long the picture lasts.

**`midi_light.html` had its own copy of the same formula and the same fault**, found because the
user asked whether it was a problem elsewhere. Nothing else in the repo accumulates one canvas
into another this way; `flock.html` and `life.html` draw a glow buffer once per frame and clear
it. The palette still matters — hues from one ramp stay in that ramp — but it is no longer
load-bearing. The
  persistence is MIDI Light's mechanism moved across unchanged: a transparent live layer stamped
  onto a keep layer, deposited **per second, not per frame**. Never a canvas fade toward the
  background — that does not converge and leaves a ghost.

**The Connect block waits without ever concluding.** `requestMIDIAccess` looks
identical whether the permission prompt is sitting unanswered or Windows' MIDI
service is wedged, so nothing here declares a cause: the message escalates from
*"choose Allow on the prompt"* to, after ten seconds, *"still waiting — unplug
the instrument, or restart the PC"*, and a second press of Connect starts no
second request but shows that advice at once. A rejection reports the error it
actually got, and says "refused" only for `NotAllowedError`/`SecurityError`.
Before Phase 9c it sat on "Asking for permission…" for ever. See
`PHASE-9C-MIDI-CONNECT-WAIT.md`.

**A change in it is four changes, plus the same edit again in MIDI Light.**
Treat it the way the design-doc trigger in `CLAUDE.md` treats `framework.js`.

---

## 1e. 🎶 Big Chords — `midi_chords.html` ✅ BUILT

Design: `PHASE-9-MIDI.md`. **Concept.** One key, one touch, one pad — a whole chord.

**The point is the ratio, not the harmony trick.** The smallest motor act a student can manage
produces the biggest musical result the room can make. Everything else in the suite gives one
touch one note.

**The chord is built from SCALE DEGREES, never from semitone intervals.** The framework's notes
*are* the degrees of the chosen scale, so taking every other one above the note played is
diatonic by construction: in key, in every scale, with no chord table and nothing that can come
out wrong. **A chord that will not fit above the note is stacked below it instead** — so a note
near the top of the range gives a *different* chord rather than the same one flattened against
the ceiling, and no two places on the instrument sound alike. Ten notes is the default rather
than eight, because a four-note stack needs seven degrees of headroom before it has to turn round.

**Velocity is the SIZE of the chord.** Gently, one note; hard, four. That gives a student
something expressive to do with a skill they already have, and rewards effort without punishing
its absence. **How big the chord is** can be pinned to 1, 3, 4 or 5 for a student for whom
velocity is not a controllable dimension.

**Four looks, three parameters each** — **▮ Towers** (one slab per note, stacked) ·
**🪟 Panes** (wide soft bands) · **🎆 Bloom** (concentric rings) ·
**✦ Sparks** (a rising cluster per note). One mark per note of the chord, so the eye is told
what the ear is told.

**Arcs was cut on 2026-09-01** — the user did not like it. Sparks replaced it rather than a
fourth large shape, because the other three are all big and **small actors read better than big
ones**. It carries no state of its own: the scatter comes from the chord's hue and the note index.

**Sparks radiate from one point in every direction**, and getting there took two goes. It was a
fan that climbed, for three reasons at once: each note of the chord was offset upward by its
index, the burst carried an upward bias term, and the horizontal and vertical radii were driven
by *different sliders*, so it was an ellipse. Measured after: lit mass in all eight sectors about
the touch, 24% upward against 44% downward. **The delay before they moved was a second bug in the
same place** — `life` deliberately stops while a key is held so a held chord does not fade, and
Sparks was using it to drive how far out they had travelled, so they sat piled at the centre
until the key came up. Sparks has its own clock.

**A look change retires the live chords and KEEPS the picture; Wipe stops everything.** Two
problems wearing the same clothes: a chord still animating gets redrawn by whatever look is now
selected and appears to change shape retrospectively — that is the one to stop. What is already
painted was finished by the old look and is a record of something that happened, so the next look
layers over it. Wipe clears the canvas *and* the live chords, because clearing the canvas alone
let them draw themselves back a frame later.

**The glow is not the picture.** Panes took its halo radius off a width that reaches 92% of the
screen, so the glow was half the canvas across and washed the app out. Radii are capped against
the short edge, the alphas are cut two to three times, and the **Glow** sliders run 0–1.6 rather
than 0.2–3. Measured against the old code: one chord with Glow up lights 41% of the canvas
against 100% before. **Size** now does something on every look — it did nothing at all on Panes
and only set the width on Towers.

**The step between slabs is exactly the slab height.** It was slightly more, which left a
hairline of background between them — the same dark-seam-between-tiles fault Sound Match had.

**A touch stands the chord ON the point.** The tower's base, the rings' centre and the arcs'
centre are all the finger; a MIDI note, which has no place of its own, uses the played range for
x and the app's own floor for y. Measured against the point clicked: 0.000 on both axes.

---

## 1f. 🌱 Loop Garden — `midi_loop.html` ✅ BUILT

Design: `PHASE-9-MIDI.md`. **Concept.** Play a few notes and stop, and it keeps going.

A note played is planted on a wheel of **time** and comes round again, a little quieter each
pass. Two things follow that are worth having in a room: a student's contribution outlives the
moment they made it, and **the room does not fall silent the instant a hand comes off** — which
is usually when regulation breaks. Nobody has to keep playing for it to sound like music.

**Where a seed sits is WHEN it was played**, never which key made it, so it works with any
instrument ever plugged in.

**A touch plants a seed at that moment in the loop** — the angle it lands at *is* the point in
time it will sound. This is the only place in the suite where a finger picks a point in time, and
it means a pattern can be laid round the wheel by hand with no instrument attached at all.

**The wheel is inverted in PIXELS, not in the 0..1 the framework hands over.** The framework
gives `splat` a fraction of the width and a fraction of the height; the wheel is round on the
screen, and a fraction of the width is not a fraction of the height. Read as fractions the seed
landed a tenth of a screen from the finger. In pixels: 0.000 on both axes.

**Four shapes, three parameters each** — **🎡 Wheel** · **🪐 Orbit** (the field
turns and each seed drags a comet tail) · **🌼 Bloom** (drawn petals, opening with how hard the
note was played) · **🎗️ Ribbon** (a left-to-right timeline, which **Lean** tilts).
**Once round takes** 4–32 seconds; **a note lasts** from two passes to for ever. **The track** —
the rings and the moving hand — has its own slider down to hidden, and **the sweep leaves a
wake** is its own slider beside it. **🧹 Empty** on the rail takes everything off.

**How far out a seed sits is HOW HARD it was played**, through the same shared `PY()` the rest of
the suite uses. It used to be the note's place in the learned range, so a run up the keyboard
climbed the screen while the auto-range was still settling underneath it — which is what made a
played phrase look unrelated to anything. **The pitch is still there: it is the colour.**

**The arm reaches the edge of the screen**, not the rim of the wheel: it is the clock, and the
room should see it sweep the whole picture. **With Persistence up, each note SMEARS as the sweep goes over it**, forwards, the way a brush
drags paint — the arm travels toward increasing time and pulls the paint along with it. **Only the
smears are painted.** A seed's own mark is a large soft radial, and depositing it every frame it
existed buried the picture under fuzzy blobs with the strokes lost inside them, so the seed loop
runs twice: the smears are drawn and stamped, and only then are the seeds, the rings and the hand
drawn *over* the picture. Measured: a note the arm has not reached yet paints 0.08% of the canvas.

**A smear is a brush stroke, not a hairline** — broad at the head, tapering to nothing, bending
off the line most in the middle, keyed to the seed's own wobble so two notes in the same place do
not lay down the same stroke. One polyline at one width drew a dead-straight thread, which in
Ribbon is a horizontal line and reads as a scratch.

It took four corrections in all: it fired on the *click* (the same flag marks a freshly planted
seed), it ran *backwards*, it painted the seed as well as the stroke, and the stroke had no body. **The rings and the hand are never painted** — they
are drawn after the stamp, straight on the screen, so the furniture cannot build up into the
picture. Measured: 0.02% of the canvas painted after five seconds of the sweep with nothing
played, against 12.9% once six notes are down.

That took three goes. A *wake* behind the arm came first and was wrong twice — once because it
lived inside the track block at a tenth of the track's own alpha, so with *The track* down it did
not exist; once because it was eighteen rays from the centre, 66 pixels apart at the rim, so it
painted almost nothing. Then it worked and was still wrong, because **the picture was of the
mechanism rather than of the playing**. The wake is gone. **Changing shape clears the picture**:
the four layouts have nothing to do with each other, so what is already painted is only debris. **Ribbon's third slider was Height**, which only
squashed the timeline into less of the screen and fought Size and Glow rather than contrasting
with them; Lean tilts the ribbon instead, so the three sliders do three different things.

---

## 1g. ✨ Drift — `midi_creatures.html` ✅ BUILT

Design: `PHASE-9-MIDI.md`, reframed in `PHASE-9D-MIDI-POLISH.md` §4.2. **Concept.** Every note
sets something adrift that keeps singing. **The file keeps its old name**; the app does not.

**A sound that is a THING is easier to attend to than a sound that is an event.** Joint attention
is a named goal, and it is far easier to share attention on a creature — "look at yours, the big
blue one" — than on a note that has already gone.

It is generative the way Loop Garden is, but the music comes from a **population** rather than a
wheel: each creature sings in its own time, so they drift out of step and a handful of notes
becomes a slowly shifting texture with nobody playing.

**Holding a key grows yours**, which gives sustained pressure something to do and makes a bigger
creature that sings **lower** — the drop is in scale degrees, so it stays in key.

**A note hatches a SWARM, and a look is how the swarm is drawn.** Up to 40 agents per note,
each steering by cohesion, separation and alignment against its own group — so the shape on
screen is something the swarm is *doing* rather than a shape anything was drawn as. **Three
looks:** **🜁 Murmuration** (velocity-aligned streaks; the default) · **🪰 Fireflies** (a pulsing
glow and a crisp core, blinking out of step) · **🔥 Embers** (a short tail and a bright head,
rising, flickering and dimming as it climbs).

**Threads was cut on 2026-09-02** — lines between near neighbours, a good idea that never came
right. Three attempts at making it crisp and it still read as blurry on a screen. **Three looks
that work beat four with a dud in the set**, and its render path went with it.

**Three passes to get here, and the first two were both half-right.** Taking the animals out was
necessary and not sufficient; making everything small and abstract was also necessary and also
not sufficient. The verdict that landed it was *"just circles in slightly different forms"* —
which was exactly right, because all four looks were drawing the same dot in four arrangements.
**The behaviour was the missing half.** The renderings are borrowed from `flock.html`, which had
already solved this: streaks, glow, sparks. `blob()` and `body()` — the radial-gradient marks
everything used to sit on — are deleted.

**The flocking constants are not exposed.** Cohesion, separation, alignment and speed together
are what makes a murmuration a murmuration, and a therapist has no reason to be handed four more
sliders to get it wrong with. Each look keeps its own three.

**Four passes, and the fourth was about the sliders doing something.** *Togetherness* now relaxes
separation as well as driving cohesion — driving cohesion alone barely showed, because separation
was still holding them apart. *How many* reaches 40 and widens the swarm with it, or forty agents
just pile into the same space. **The mark had a floor of 0.7 pixels**, so most of Size's travel
was below the point where anything could be seen on a projector.

**Embers was a second Murmuration** and is now the thing it is named after: it barely flocks,
rises harder, flickers, and dims as it climbs. A tail and a bright head is the same picture a
streak makes, which is why the two looked alike. **Threads drew every pair within reach**, and
that overdraw — dozens of soft half-transparent lines crossing — is what read as blurry;
thickening them made it worse. Nearest three each, thin and nearly opaque. **The streak flicker**
was the steering changing an agent's velocity every frame and the speed cap clipping it: the
physics keeps the real velocity and the picture uses a lagged copy.

**It was a pond with fish in it, and that was the fault.** 🐟 on the tab, Fish as the default,
and an eye drawn on three of the four looks — "because a thing with an eye is somebody", which
was the reasoning and was wrong for the room this is for. Two of the four looks were already
abstract underneath: the drawing was fine and **the framing was doing the damage**. `eye()` is
deleted, and the tab, the title, the launcher tile and the copy all moved with it. An old saved
`look` value falls back to Motes.

**How much they move** goes down to *still* on the Visuals pane, for a student distracted by
drift — they then stay exactly where they started, which is also where a finger put them.

---

## 1h. 💬 Mirror — `midi_mirror.html` ✅ BUILT

Design: `PHASE-9-MIDI.md`. **Concept.** You play, it waits, then it answers.

**Echo Bird already covers "play back what you heard"** — which is a memory task, and a test:
there is a right answer and a student can fail it. This is the other thing therapists actually
do, which is improvised call and response. It never asks the student to repeat anything. It
listens, waits until they stop, and answers with a phrase that keeps their **rhythm** but moves
the notes. There is no right answer, so there is nothing to fail, and the only thing being taught
is the shape of a turn: you go, I go, you go.

**Every reply is built from scale degrees**, so it lands in the therapist's key however it is
transformed and never needs to know where anything is on the instrument. **Five ways to answer** —
a little higher · upside down · carries on (and adds a note of its own) · backwards (the same
notes walked back, keeping the rhythm) · a quiet shadow. **Before it answers**: 0.8 to 4 seconds.

**Theirs rise, ours fall**, from a line across the middle, and a reply carries a ring — a turn you
can see as well as hear. **Four looks, three parameters each** — **🌊 Drift** ·
**▮ Bars** · **◎ Rings** · **〰️ Wave** (one curved line per side, through the marks in the
order they were played).

**The answer is a MIRROR of what was played, and only its pitch is transformed.** It used to be
drawn at the transposed note's column, at `y=0.5` always, in a `Math.random()` hue — three ways
of being unrelated to the thing it was answering, which is most of why nobody could tell what it
was doing. The phrase now carries where and what colour, and the reply takes the source's place
mirrored about the line and the source's colour. Measured: tapped (0.24, 0.30), answered at
x 0.24 and y 0.79 which mirrors to 0.21, hue 2° apart. **Both halves wash in the same colour**,
so the answer no longer reads as a different kind of thing.

**The line runs across the screen or down it**, on a chip — the whole layout is written as
"along the line" and "away from the line", so turning the mirror on its side is one piece of
geometry rather than a second copy of the app. Bars is the only look with a direction of its own
and stands away from the line whichever way it runs.

**Wave replaced Trace** rather than joining it. Trace joined each mark to its neighbour with a
separate straight segment, which drew the same points without ever reading as one line — and a
fifth option does not fix a default that is not reading. A phrase *is* a sequence, so a line
through it is the phrase, and the answer's line is the shape of yours turned over. See
`PHASE-9D-MIDI-POLISH.md` §5.5.

**A finger-placed mark skips the step off the line.** Every mark steps a little off the middle
line so it does not start *on* it — but a mark a finger placed already has a place of its own, and
stepping that one would put it where the finger was not. Measured: 0.000 across, 0.008 down.

**Say whose turn it is** can be turned off on the Visuals pane; the two halves still say it.

---

## 2. 🥁 Drum Pads — `drums.html` ✅ BUILT

**Concept.** 4–8 large percussion zones (kick, snare, hi-hat, clap, shaker, tom, cowbell,
cymbal). Tap anywhere in a zone; the zone flashes and its icon bounces.

**Therapy goals.** Cause-and-effect, bilateral coordination (two-hand patterns), loud/quiet
exploration (optional Y = loudness), playing along to music.

**Sound.** Synthesized kit first (Web Audio percussion is genuinely good: kick = sine pitch drop,
snare = noise + bandpass + tone, hat = filtered noise burst, clap = 3 noise taps). Optional
embedded-sample kit later (`assets/kit_acoustic.js`, ~300 KB) selectable in the Sound panel.

**Features.** Pad count 2–8 (fewer = bigger targets); pad layout grid or row; backing-track
player (see conventions); optional auto-metronome with visual pulse.

---

## 3. 🔘 Big Switch Songs — `big_switch.html` ✅ BUILT

**Concept.** The whole screen is ONE giant button. Every activation — touch anywhere, any
keyboard key, or an accessibility switch (switches present as Space/Enter) — plays the NEXT
note or phrase of the chosen song with a full-screen burst of colour.

**Therapy goals.** This is the classic switch-access interaction (like a Big Mack): students with
minimal or unreliable motor control get full musical agency. Phrase mode (one press = one bar)
gives big reward per action; note mode gives fine sequencing.

**Build note.** Reuses Song Grid's song engine verbatim — build after (or alongside) Song Grid.
Settings: song, note/phrase granularity, visual burst style, hold-to-repeat on/off.

**The song builds a picture** (Phase 14, 2026-09-06). Every press drops its note on screen —
across by how far through the tune it is, up by its pitch — so the melody draws itself as the
student plays it, and twenty presses leave twenty marks behind. It replaces a **6 px progress
bar at the very top of the screen**, which a student looking at the middle never saw, with
progress they cannot miss: the picture reaching the right-hand edge *is* the song finishing.
Marks are held as state and redrawn onto a cleared canvas every frame — never accumulated on
the canvas, which is the rule `canvas-fade-never-arrives` taught. Measured: ink on screen goes
0.25% → 5.46% over twelve presses. **The finishing flourish does not draw** — it runs through
`playNote` too, and every one of its notes landed at `done()/total() = 1`, stacking a column of
dots on the right-hand edge of the student's drawing. That was caught by looking at a
screenshot; every check was green.

**At rest, a slow breath invites a press.** The screen used to be black between presses, in the
one app whose whole interaction is *press* — the same fault as a held note doing nothing in
Starfield. It appears only after the student has been still for 1.6 s, so it never competes
with a note they just played. Measured: 0.25% → 0.80% ink at rest.

**Patterns as well as songs, and they suit this app better.** In Big Switch the STUDENT
supplies the rhythm, so a song loses half of what makes it that song, and stopping after eight
presses leaves a student mid-phrase on a note that wants to go somewhere. A pattern depends
only on pitch **order**, which survives any pace, and has no wrong place to stop:
**↗ Climbing**, **↘ Falling**, **🔔 Chimes** (an arpeggio — chord tones only, so nothing can
clash), **〰️ Wandering** (pentatonic — the scale that cannot sound wrong whatever order it is
played in), **🎪 Bouncing**. They are generated in the *shape of a song* so progress,
celebration, repeat and the phrase splitter all work on them unchanged, and they are built in
`big_switch.html` rather than in `songs.js` on purpose: that file is shared by four apps.
Verified by recovering the pitch of every note actually played and checking it against what the
name claims — Chimes only ever plays {0,2,4,7}, Wandering only pentatonic degrees.

**Changing the song or the granularity starts the run again, cleanly.** A phrase, a whole tune
and the flourish all queue their notes on `setTimeout`; `applySong()` reset the counters and
left those timers to fire, so the previous tune played on into the new one. The granularity
chips were worse — they reset `pos`/`phrasePos` and left the marks, the note count,
`celebrating` and `playing` alone. Every scheduled note goes through `later()` now, which keeps
its id, and **`resetRun()` is the one place that starts a fresh sheet**, called by the chips,
the ⏮ button and `applySong()` alike. Measured: 0 notes and 0 marks survive a change, progress
back to 0%, **and four presses afterwards still give four notes** — a reset that left the app
dead would be worse than the bug.

**The same class of fault was in Echo Bird and is now fixed** — found by checking whether this
one generalised rather than by a second report. `success()` queued the bird's whole response on
timers while `stopConvo()` only set a flag, so changing the bird game, changing where calls come
from, or pressing pause all left the previous response playing on. Measured 4 notes still
playing before; 0 after, with the bird still able to start again.

**The picture reads left to right in every granularity.** `addMark` took its x from
`done()/total()`, and `done()` counts whatever the *granularity* counts — so in phrase mode,
where `phrasePos++` runs the moment the press is handled while the notes play on timers
afterwards, every note of a phrase took the x for *after* the phrase had finished. A pattern is
two phrases, so the second press stacked eight notes against the right-hand edge; the user
photographed it. x now comes from a count of notes actually **marked**, which is the same
quantity in all three granularities and cannot go backwards. Checked across **24 combinations**
— five patterns and three songs times three granularities — all running 0.000 → ~0.94 with no
step backwards (`probes/phase-14/draw.js`, reading the marks as drawn).

**The full-screen flash is rate-limited, and that is a safety property rather than a look** —
the same call `PHASE-9D` made about MIDI Weather's lightning. The user raised it: *"the screen
flashing when the note is played could be triggering as well."* Measured before the change
(`probes/phase-14/flash.js`): a single flash changes relative luminance by **0.037** on the
dark default, which is **below** the 0.10 that defines a flash — but the **rate** was 6/s
pressing quickly, 10/s for a whole tune, and 10/s for the finishing flourish, against a general
flash threshold of **three per second**. So the rate is what was wrong, and the rate is what
was fixed: one wash per 340 ms (~2.9/s). Measured after: **6 → 3, 10 → 2, and the flourish
10 → 0** — with 14, 32 and 32 notes still played. *Nothing the student did is discarded; only
the screen-sized flash of it.* The flourish does not wash at all, because a travelling
highlight is a small area. **`Flash the screen on each note`** turns it off outright for a
student who is photosensitive or simply overwhelmed by it; the dots remain, so the app still
answers every press.

**The giant note letter is OFF by default.** It is 38vh of text across the middle of the screen
and it dominates the picture the student is drawing. The toggle was always there; only the
default changed.

**The finishing flourish walks the student's own picture**, lighting each dot as its note
sounds, instead of running a chromatic scale that had nothing to do with what they played. If
there is no picture it falls back to the scale run, because a celebration with nothing in it is
worse than a generic one. Verified by comparing the pitches played during the flourish against
the pitches the student pressed — identical, in order.

**One press can play the whole tune.** A third granularity beside *One note* and *A whole
phrase*. For a student with one reliable press who cannot repeat it, one-note-per-press is a
song they will never reach the end of — this is the Big Mack case the app is named for. Presses
during playback are ignored rather than queued or restarting: "I pressed and the music is
happening" has to stay true. The speed slider is shown for both app-plays-the-rhythm modes and
hidden for *One note*, where the student sets the rhythm and it governs nothing.

---

## 4. 🎸 Chord Strummer — `strummer.html` ✅ BUILT

**Concept.** Autoharp/omnichord: the screen is filled with vertical strings. Sweeping across
them strums a harp arpeggio; big labelled chord buttons (I, IV, V, vi in the chosen key) change
the harmony, so every sweep is always "right".

**Therapy goals.** Gross-motor arm sweeps produce rich musical results; accompanying the
therapist's singing; choice-making via chord buttons (which can be therapist-operated while the
student strums).

**Sound.** Plucked string synthesis (Karplus-Strong via a delay-line, or the existing pluck
voice); strings tuned to the current chord's notes across 2–3 octaves.

**Settings.** Key/root, string count (8–24), which chords are offered, strum sensitivity.

---

## 5. 🎤 Voice Visuals — `voice_visuals.html` ✅ BUILT

**Concept.** Microphone-driven visuals: vocalize and the room responds with light. Loudness =
size/brightness, pitch = colour/height.

**Eight styles** — 🌸 Mandala, 🫧 Lava, 〰️ Waves, 🟩 Pixels, 💡 LEDs, 💧 Ripples,
🎆 Fireworks, ⭐ Starfield. **🌀 Flow was DELETED on 2026-09-05** at the user's request —
"actually delete Flow, I don't like it" — and lives in git history, like MIDI Weather.
A saved setting, preset or launch link still naming `flow` falls back to Mandala: the clamp
sits in `frame()` rather than `init()`, because a preset is applied *after* init and the draw
dispatch's own `else` would otherwise have drawn Starfield while the Style chips showed
nothing selected. With eight styles the Style row no longer hits the chip cap, so every style
is now shown inline.

**Therapy goals.** Rewards vocalization for non-verbal students; breath control; call-and-response
with the therapist's voice or instruments; the room "hears" the student.

**Ripples: one sound, one ring** (2026-08-31). A ring comes from a TRANSIENT and nothing else,
so the pond keeps time with a person clapping. There used to be a free-running emitter firing
every `(0.4 - 0.3*level)` seconds for as long as the level stayed over 0.02 — which a clap does
for most of a second while it decays — so the pond rippled on a clock of its own. Measured with
seven recorded claps 1.5 s apart: 22 rings, evenly spaced, none of them lining up with a clap;
now 7 rings at exactly the clap interval. A held note has no transient and makes one ring as it
starts; the centre glow, which breathes with the level, is what shows a sustained sound.
**`Wave rate` sets how close together two sounds can each still get their own ring** — 0.07 s at
the top of the slider, 1.33 s at the bottom, **default 0.2 s**, for a student whose sounds run
into one another. `onset()` is shared with four other styles.

**That 0.22 s was unreachable, and had been since it was written** (found in Phase 11 UAT,
2026-09-04). `onset()` carried its own 0.3 s refractory, which sat underneath this slider as a
floor — so at its most responsive setting the slider promised 0.22 s and delivered 0.3. Worse,
the transient was measured off the 350 ms release envelope, so a second clap arriving during
the first one's decay had almost no gap left to jump: **six claps 0.25 s apart produced one
ring.** `onset()` now runs off a separate 5 ms/80 ms envelope and its refractory is 0.12 s, so
the same six claps produce six.

**And fixing `onset()` did not finish the job, because this style has a gate of its own.** With
the transient right, six claps 0.25 s apart gave six bursts in Fireworks and **two rings here** —
the old default let one ring through per 0.55 s whatever the sound did, so a person clapping
twice on purpose had to find a slider first. The default is **0.2 s** now and the range is
widened at the *slow* end instead, which is the end this slider was described for. Measured in
the page: **6 rings from six claps 0.25 s apart**, and seven claps 1.5 s apart still give seven.
See `PHASE-11-LISTENING.md` §11.1.

**Build notes.** `getUserMedia` + `AnalyserNode`; tap-to-enable mic UX with graceful denial
fallback; **no audio output** (feedback safety). Sensitivity presets ("whisper" mode for quiet
vocalizers is the key therapy feature — tiny sounds must produce big rewards).

**How it listens, rebuilt 2026-09-03** (`PHASE-11-LISTENING.md`). The old line here said
"pitch detection via autocorrelation on the time-domain buffer (good enough for voice)". It was
not. Measured over 14 synthetic voices, that detector was wrong by more than 50 cents in **5 of
them, always an octave or two LOW** — a 200 Hz voice at 12 dB SNR read 100 Hz, and a child
squealing at 700 Hz read 100 Hz, sending the screen to the *bottom* of the palette. Five other
faults were measured alongside it. What replaced them:

- **The graph is `src → highpass 80 Hz → two analysers`**, and nothing reaches the destination.
  The second analyser is 8192-point, for the spectrum alone: at 2048 the log-spaced bands below
  295 Hz all read the same few 23 Hz bins, so the bottom third of the Mandala moved as a block.
- **Loudness is decibels above a MEASURED room floor**, `((dB−floor)/(ceiling−floor))^0.6`. The
  old mapping was linear in amplitude and gave exactly 26.0 dB of range whichever sensitivity was
  chosen. The chips now set the *span* — Whisper 18 dB, Talking 28, Singing 40.
- **The floor is measured at mic-on and never stored.** It is a fact about the room today, not
  about a student, and storing it is what would let one therapist's quiet afternoon leave the
  next student unheard. It falls at once and rises only in silence — and, because that rule alone
  deadlocks, it re-seeds after 20 seconds of unbroken sound.
- **Pitch is MPM** (normalised square difference) with parabolic interpolation, a five-frame
  median, and a search band of 60–1300 Hz that always contains the colour map. 0 of 20 wrong.
- **`onset()` is a rate per second, not a difference between two frames.** The old test needed
  level 0.29 to fire at 24 fps and 0.99 at 165 — the same sound made a firework on one room PC
  and nothing on another.
- **Two new signals, drawn in Mandala and Lava.** `voiced` (the NSDF confidence — a hiss reads
  0.16, a clear tone 1.00) sets **definition**: a sung tone draws narrow, bright, sharp spokes
  and firm-edged wax; breath and hiss draw wide, dim, diffuse ones. `bright` (a spectral
  centroid) rides the Mandala's outer ring, so a hiss throws it toward the walls. Both go
  through a definition term that is **exactly 1 on any voiced sound**, so an ordinary
  vocalisation draws the shipped picture — measured at 0.0% ink difference — and only unvoiced
  sound is new. A per-style **Voice texture** slider at 0 restores the old look outright.
  `bright` is **not** vowel identification: /i/ sits with /u/.
- **The therapist can see what it hears.** The **🎤 Voice** tab reads *"Hearing −26 dB · room
  floor −53 dB · range 28 dB"*, names a microphone running hot or a room too noisy to work in,
  and carries **🎧 Listen to the room**. `Extra boost` is retired for **Fine trim** in decibels (a multiplier has no
  meaning once the floor and ceiling are absolute), and **Voice range** (Wide / Adult / Child /
  Auto) decides which colours a given student can reach at all.

**What the user's first round of testing changed** (2026-09-04, `PHASE-11-LISTENING.md` §11):

- **Two claps close together made one ring, and repeated loud sounds made no firework.** One
  fault: the transient was read off the 350 ms release envelope the drawing uses, so a sound
  arriving during that decay had almost no gap left to jump. Measured, six claps 0.25 s apart:
  **1 ring before, 6 after.** `onset()` now has its own 5 ms/80 ms envelope, and its refractory
  drops 0.3 s → 0.12 s. A single clap still needs level 0.50 at every frame rate.
- **The microphone can hang, and the app now says so.** `getUserMedia` was measured resolving
  once at 4.2 s and twice not at all — the same never-settling promise as Phase 9c's MIDI
  connect, which had declared this file unaffected. The wait now escalates after ten seconds and
  never concludes a cause; a second tap jumps to that text rather than starting a second
  request. The room seed, separately, was stalling up to five seconds and now takes 1.0 s.
- **The Fireworks afterglow is deleted**, not tuned: a wide radial gradient that banded into
  concentric rings on an 8-bit canvas, the same fault Soundscape's `glow` had.
- **Starfield answers a held sound.** Rising sparks drift up while there is sound, and a loud
  one scatters a burst that slows to a stop and *becomes* stars rather than falling. Shooting
  stars cap 3 → 6.
- **The microphone settings moved from `Setup → Access` to the Sound tab**, which for a
  listen-only app is where the sound is. `Fine trim` is renamed **Range** and shows the
  resulting range in dB rather than an offset.

**What the user's third round of testing changed** (2026-09-05, `PHASE-11-LISTENING.md` §12):

- **"It says the room is noisy but it isn't" — the warning was reporting the input, not the
  room.** `FLOOR_MAX` was −25, so rooms measured at −24, −20 and −16 dBFS all came back as the
  *same* floor; at −16 that is 9 dB wrong, the gate sits open on the room alone, and the level
  averages 0.35 with nobody making a sound. The clamp is now −15, so a hot microphone is
  measured truthfully, and the warning splits: a floor above −30 dBFS says **the microphone is
  running hot** and points at the Windows level, because a room nobody would sit in does not
  reach −30 and *"move the microphone closer"* makes a hot input worse. A hypothesis that the
  floor **drifts upward** during a session was measured first and is false — 0.1 dB over 40 s of
  live clapping.
- **The frame is CLEARED, not faded — every style.** `rgba(bg, fade)` on an 8-bit canvas is
  `dst = round(dst × (1 − fade))`, which stops moving as soon as `dst × fade ≤ 0.5`. So a fade
  left a permanent residue of `floor(0.5/fade)` and **no value under 0.5 could ever reach
  zero**. Measured off screenshots after ten seconds of silence, Ripples ended with **90% of
  the screen** holding a stalled ghost of every ring ever drawn; the only two styles that were
  clean were the two already clearing. Now 6.6% and falling. Flow (deleted 2026-09-05) and
  Fireworks — the two whose
  trail *was* the residue — carry their own path in `h` and stroke it.
- **"It misses the ring every second clap, but the centre pulses" — the `Wave rate` slider.**
  The second clause is what localised it: the centre glow is drawn off `level` and passes
  neither of the ring's two gates, so a pulse with no ring puts the fault between detection
  and drawing. `drawRipples` gates the ring again on `rippleTimer = 0.2/tw('rate')`, and at
  ×0.30 that is 0.67 s — so 24 claps 0.6 s apart give **24 onsets and 12 rings**, at ×0.15
  eight rings, against 24 at the default. Round 2 widened that slider's slow end deliberately
  and the value persists in `SETTINGS.tw`. The slow end stays — suppressing rings is what it
  is *for* — but the slider now reads **"Rings no closer together than … 0.67 s"** instead of
  "Wave rate ×0.30", which is §11.4's `Fine trim → Range` lesson a second time: **show the
  result, not the multiplier.** The gate is also asked *before* `onset()` now, so a shut gate
  no longer consumes the transient's refractory as well as its ring.
- **An onset is not a ring, and counting the first proved nothing about the second.** A
  measurement of "40 of 40 onsets" closed this report prematurely; `_dbg()` now carries
  `ringN` beside `onsetN`. *(An earlier probe reporting 27 of 40 rings was separately wrong —
  it counted rises in the live rings array, which also falls as rings expire.)*
- **Then the ring gate was DELETED outright** (round 4). Driven with the sounds it was
  written for — a raspberry bursting every 71 ms, a babble with a syllable every 250 ms, a
  sustained hum — it changed **nothing**: 0.06, 0.08 and 0.07 rings/second at gates of
  1.33 s, 0.20 s *and* 0.07 s alike. `onset()` already holds all three to one ring, because
  it requires a transient and carries a 0.12 s refractory. The only signal the gate affected
  was deliberate separated clapping, 0.53 against 1.60 rings/second — the one thing that must
  never be suppressed. `onset()` governs alone; the freed slider is **Centre glow**.
- **The ring is sized from the sound that made it.** `str` came from `level`, the display
  envelope, so identical claps drew different rings depending on the gap before them —
  first 0.46, then 0.71 / 0.61 / 0.51 at 0.6 / 0.8 / 1.2 s spacing, while the instantaneous
  level read 1.00 for every one. And `str` never left 0.46..0.73, so **loudness barely moved
  the ring at all**. It is the instantaneous level now: spread 0.40 across claps from −46 to
  −22 dBFS where the old code gave 0.05, and a loud ring's speed is unchanged.
- **The centre glow answers a quiet student**, who is the one making no transient and so no
  ring at all. It was linear in `level`, so a hum at 0.10 moved it by a twentieth of the
  screen; a 0.45 gamma reads 0.37 there instead. A ring is born at the glow's edge now, so it
  reads as thrown off the pulse. **Wave speed** is 0.2–1.0 (was 0.4–2.0), and `tw()` clamps
  every stored tweak to its slider's declared range — a preset saved at ×2.00 used to leave
  the slider showing 1.00 while the drawing used 2.00.
- **A tap is worth a shout.** Every style's touch was quietly weaker than its own voice
  response — Fireworks 18 particles against 80, Ripples 0.55 against 1.0, Starfield one star
  against a scatter. All now use the expression the voice uses at level 1.
- **Fireworks explode properly** (Phase 12's third look). `Burst size` scaled the particle
  count linearly but the speed by `sqrt`, so its whole range moved a burst's reach from 0.180
  to 0.315 of `min(W,H)` and **no setting filled the screen**. Speed scales linearly now, the
  base is higher and the drag gentler: reach at +0.9 s goes 0.245 -> **0.340** at the default
  and 0.315 -> **0.571** at the top, with the bottom (0.179) still below the old default so the
  smaller burst stays available. **`Particle size`** (0.4-3) is new, on the embers and the
  burst alike. A gravity ramp built on a mis-measurement was deleted after an A/B - 0.314 with
  it, 0.318 without.
- **Waves travelling horizontally was BUILT AND REJECTED** (Phase 12's second look) - see
  `PHASE-11-LISTENING.md` 13.2, and do not rebuild it. An oscilloscope answers a new sound
  across 100% of the width in one frame; scrolling made that local to the right edge, about 4%
  in the first 100 ms. Persistence was bought with immediacy, and immediacy won.
- **The Mandala fills its frame at full loudness** (Phase 12's fourth look). A band value is
  the *average* of its FFT bins and a voice concentrates energy in a few harmonics, so the
  loudest band of a sung tone measures 0.69, not 1 - and `v^1.5` compressed what was left. At
  the top of the app's own calibrated loudness the longest spoke was using **0.588** of the
  reach it is allowed for a sung tone and **0.115** for a hiss; now 0.815 and 0.268. The gain
  **saturates rather than clamps**, so there is no flat top of equal-length spokes, and the
  gamma is untouched so the spectrum's shape is unchanged. The cost is compressed dynamics - a
  half-loud sound is 56% of the full picture where it was 32% - which helps a student who
  cannot get loud and costs headroom for one who can.
- **LEDs are a WALL, not a strip** (Phase 12, after the user rejected the six-pattern build).
  The whole screen is a grid of LEDs; every LED belongs to one concentric rectangle — its
  **ring** — and the chase runs around *every* ring at once. **`Spiral`** sets how far each
  ring's phase lags the one outside it: 0 and the rings pulse together, 2 and they trail
  inward. Each ring carries one frequency band, low at the edge and high at the centre, so a
  voice lights the wall from the outside in and a transient runs a wave inward. Controls:
  `LED size`, `Chase speed` (**0 is off**, not frozen — measured 0.000% bright pixels there
  against 1.8% at every non-zero setting), `Spiral`, `Sound spread`. **The six-pattern version lasted one
  round** — *"I don't like the mixture of styles"* — and the lesson is that six unrelated
  effects behind a slider is a menu, not a style. Measured 60 fps at 1920×1080 at every LED
  size (~1,100 dots a frame).
- ~~**LEDs have a repertoire**~~ — **BUILT AND SUPERSEDED, never shipped.** For one round the
  LEDs offered six patterns behind a slider (Strip + EQ, Meteors, Sparkle, Fire, Rainbow run,
  Breathe) with an `Equalizer height` that reached 0. The user rejected it — *"I don't like
  the mixture of styles"* — and the wall above replaced it. **Neither those patterns nor that
  slider exist in the app**; the entry stays for the lesson, which is that six unrelated
  effects behind a slider is a menu, not a style. `probes/phase-11/leds.js` is kept because
  its method — every pattern selected, played into AND dragged across, then checked pairwise
  as pictures — is the right shape for any style with modes.
- **Starfield flies through space** (Phase 12's fifth look). Every star has a depth; its
  position is an offset from a vanishing point divided by `z`, so it sweeps outward and
  accelerates past you and respawns in the distance. Loudness is the throttle, silence still
  drifts, and the vanishing point sits at the pitch height — *followed*, not set, because
  moving it per frame would jump every star at once. Measured: **0.0 stars past the camera per
  second at `Travel speed` 0**, 8.6 in silence, 142.9 on a loud hum, 285.7 at the slider's top.
  **The slider reaching 0 is the point** — it gives back exactly the still sky, which is the
  courtesy travelling Waves could not offer. Star ink roughly doubled (0.44% → 0.91%) because a
  near star is large; a claim that this also fixed the sky emptying on a bigger canvas was
  measured **false** and corrected.
- **The straight line across Waves was a hard clamp**, `Math.max(-1, Math.min(1, …))`, pinning
  the trace flat at 0.20H from the top. It bit far earlier than the code claimed, because
  `ceilDb` is an RMS ceiling applied to instantaneous samples: measured, a voice went flat at
  level 0.75 and a clap at 0.61, and in a hot room a clap at **0.23**. A crest allowance of 2.6
  plus `Math.tanh` leaves no flat top to draw.

**Phase 12 — the looks, one at a time** (`PHASE-11-LISTENING.md` §13):

- **Lava's blobs have wax's inertia now.** The radius followed the band follower's 30 ms
  attack, so a blob changed size by **a fifth of itself inside 200 ms** on a child babbling
  and reversed direction **27 times a second** on a raspberry — while a sustained hum measured
  1.3%, which is why a listening app tested with a sung note never showed it. The radius gets
  its own follower (0.35 s attack / 0.8 s release) and the **luminance keeps the fast one**:
  light has no mass, wax does, so a blob still brightens on the syllable and only stops
  snapping. `updateBands` is untouched — Mandala and the LEDs are *meant* to flash on it. The
  follower costs a clap's swell, +46% → +20%, and a gain that **saturates to unity** returns
  Measured on the radius as drawn (`_dbg().lava.rad`), not reconstructed from the bands.
- **It grows at a constant rate and fades back exponentially**, after the user tested the
  first build: *"I like how it fades back, but it is still jerky when detecting sound."* A
  one-pole attack **moves fastest on its first frame** — 94% of a clap's rise inside 100 ms
  in the original, 44% with the follower — and the saturating gain that bought the swell back
  was 2.5× steepest at zero, so a fix for the *size* of the response had steepened the *start*
  of it. Pure linear growth was measured too and lost on speech (a cap makes a small rise move
  at full rate as well); the rise takes **whichever of the two moves less**, and is better than
  either on every signal: biggest single frame 3.08% → **1.84%** on clapping, 0.94% → **0.55%**
  on a babbling child. It costs a clap's swell, +25% → +18% at 349 ms.
- **`defn` is smoothed, and that was the jerk all along.** The user: *"with short
  sharp noises it still is jerky, especially with the initial noise… it is when the voice
  texture is high I think."* `conf` is raw NSDF confidence, replaced whole every pitch poll
  and smoothed nowhere; `lavaBlob` draws the wax's near-opaque core at `0.6·e·R` with
  `e = 0.55+0.45·defn`, so `defn` falling 1 → 0 nearly halves the blob's **visible** edge.
  Measured on a babbling child, `defn` swung the full **0 → 1 between two frames** and the
  drawn core with it — **82% in one frame**, while `R` moved 0.64%. Every probe in
  `probes/phase-11` had said the build was smooth, because they all measure `R`. `confS` is
  now a drawing-side copy with the same rise shape as the wax, symmetric; raw `conf` still
  gates `PITCH_TRUST`, which is a detection decision. **Mandala's `wide`/`dim` spokes read
  the same `defn()` and had the same fault** — one follower, two styles. A hiss still reaches
  0.000 and a voiced tone 1.000, so the texture feature is unchanged at rest.
- **Sound speeds the drift up with the same mass** — *"the balls jump around instantly into
  different locations."* `b.x += b.vx*dt*(1+level*1.5)` ran off the instant `level`, so a clap
  moved every blob's speed multiplier **41% in one frame** and took them all from rest to full
  speed in 66 ms together. On the slow signal the worst frame is 2.35%. The snooker strike is
  untouched: a tap is still instant, because a tap is a deliberate act.

`probes/phase-11/` drives the real page with a fake microphone fed from generated WAVs. Its
README carries the ways that probe was wrong before the code was - now including two round-3
hypotheses that died in the harness, and one probe that reproduced the reported symptom while
measuring the wrong quantity.

---

## 6. 🗣️ Voice Play — `voice_play.html` ❌ CANCELLED

Cancelled 2026-07: the sensory room is getting a hardware voice effects unit, which handles
live voice transformation (and its feedback risks) better than a browser app can. If a
software fallback is ever wanted, the safest design was granular record-then-replay
(0.5–2 s clips, transformed) rather than live monitoring — see git history for the full spec.

---

## 7. 📼 Sampler Pads — `sampler.html` ✅ BUILT

**Concept.** Koala-lite: 4–9 big pads, tap to play. The rail ✏️ button toggles edit mode:
tapping a pad there opens an editor dialog — record from the mic (up to 20 s, silence
auto-trimmed), trim by dragging waveform handles, per-pad label (emoji or short word),
pitch/speed. Looping pads show tempo controls automatically (BPM starts at the loop's
natural tempo) for simple backing tracks. Sounds export/import as a .json file.

**Therapy goals.** The student's own voice/sounds become the instrument — identity, motivation,
personalized sessions ("play YOUR sound"). Therapists can pre-record session-specific sounds.

**Build notes.** Record via MediaRecorder → decode to AudioBuffer for low-latency playback.
Persist kits: localStorage holds ~5 MB (enough for short clips as base64); add export/import
kit as a downloadable `.json` for bigger libraries. Lock recording behind the therapist panel
so students can't accidentally erase pads.

---

## 8. 🌧️ Soundscape Mixer — `soundscape.html` ✅ BUILT (reworked 2026-07)

**Concept.** A mynoise.net-style ambient mixer: the screen is 8 full-height slider columns,
one per sound layer. Touching a column sets that layer's level (higher = louder, the very
bottom switches it off) — the student literally mixes their own environment with whole-arm
movements. **Scenes** swap in a different set of 8 layers: Calm classics, Rainstorm, Forest,
Ocean, Night sky. The 🌙 rail button glides every slider down to silence (wind-down time is a
therapist setting). The original tap-to-toggle tile design was replaced because levels-as-height
gives finer agency and clearer visual state (v1 also shipped with tiles that showed no sounds).

**Therapy goals.** The regulation/relaxation end of the sensory diet — students compose their
own calming environment; useful as a session wind-down. Sliders add graded control (loud/quiet
exploration) on top of on/off cause-and-effect.

**Slider colours: Bold · Soft · Off** (Visuals). `k` is how far a column's background is pulled
toward its layer's colour and `fill` is the body of the slider itself. Three things were fixed
on 2026-08-31, all of them the same 8-bit arithmetic:

- **The canvas kept a ghost of everything drawn on it.** The tinted wash never converged:
  compositing on an accelerated canvas ROUNDS, so an alpha-0.18 fade toward the wash stalls a
  few levels above it and stays there. Measured over 576 points 25 s after stamping a white
  block, **568 still ghosting at Bold and 110 at Soft**. It fades toward the tint, burns one
  level so it must keep moving, then `lighten`s at the same tint so it cannot go past — 0/576
  in all three modes. A burn does not fight the wash as long as the clamp is to the wash
  rather than to the background.
- **The slider body accumulated.** Redrawn over itself every frame on top of a fade, it settled
  at whatever equilibrium the fade left, and that quantises at different levels down the
  gradient — the horizontal banding that made a slider look patchy. Drawn with `lighten`
  against an opaque tint now, so every frame gives the same result (207 direction reversals
  down a slider, to 13). **`fill` therefore means what it says**: the fraction of the way from
  the background to the layer's colour. The old numbers were tuned against an overshoot.
- **Off means off.** It used to remove only the column wash while the slider still drew in its
  own colour. It draws no body at all now, just a faint cap, so the scene behind is visible —
  which is the point of turning colours off.

**The `glow` visual is a field of static, and must not go back to being a gradient.** Soft
drone, Deep water and Deep space hum all use it. It was a large radial, and re-stamped every
frame on a fading canvas its rounding lands identically every frame, so the quantisation steps
pin in place and build into concentric rings. Three attempts — separating the stops, drifting
lobes, jittering the radius — each helped and none fixed it, and one blew Deep water out badly
enough that the rings got worse. It is specks at random positions now, with the soft edge made
by a fall-off in their **density** rather than their alpha (radius as `u^0.62`, not `sqrt(u)`).
Nothing is interpolated across a large area, so nothing can contour however long it runs. No
frame cost: 620 specks a frame with eight layers at full on 1920×1080 holds the same 16.7 ms
median as the radial did.

**Sound.** All synthesized (filtered-noise recipes; scheduled chirps, thumps, bells; the
drone/chimes/shimmer/hum/buoy-bell/pulsar layers are key-aware via root+register) — no samples,
fully offline. Audio nodes exist only while a slider is up. Visuals blend one effect per active
layer (rain streaks, wave lines, ember sparks, starfields...) plus per-column level bars.

**Refinements (2026-07).** Each scene has a cohesive colour palette (sliders read as one
world) and every column sits in a subtle wash of its own colour (grey while muted); icons are
OpenMoji SVGs embedded offline in `assets/openmoji_soundscape.js` (CC BY-SA 4.0, emoji
fallback if missing). A control strip under every slider gives a **🔇 quick mute** (keeps the
level, dims the column) and a **🎚 tune button** that opens that sound's editor card in place —
1–4 sliders per sound (how often / variation / pitch / tone / movement, plus specials like
thunder distance and heartbeat speed), applied live, stored per device and captured by
Presets. The Scenes panel lists the same editors; session lock hides 🎚 but keeps 🔇. Event
layers get gently denser as their slider rises. The mix (levels + mutes) is remembered per
scene between visits ("Remember the mix" toggle) and fades back in at the first touch.

---

## 9. 🦜 Echo Bird — `echo_bird.html` ✅ BUILT

**Concept.** Call-and-response on the note grid. The app (a friendly bird character) plays a
short phrase — 2–4 notes, cells lighting as they sound — then waits. The student replies on the
same grid. ANY reply is celebrated; a matching reply gets an extra shimmer and the bird's
delighted flourish. Then the bird plays the next call.

**Therapy goals.** Turn-taking and joint attention — the core call-and-response technique of
music therapy sessions, currently missing from the suite. Auditory memory and imitation for
students working at that level, with zero penalty for students who just want to answer freely.

**Modes.**
- **Free reply** (default) — bird calls, student plays anything, bird responds warmly. Pure
  conversation; match detection only adds sparkle, never gates progress.
- **Copycat** — the called cells stay gently haloed as a visual guide; matching them in order
  triggers the big celebration. Still no fail state — stray notes sound normally.
- **Therapist call** — the therapist plays the call from a second area/row (or the same grid
  while holding a modifier), turning it into a live human duet with the app as referee/rewarder.

**Settings.** Phrase length (1–5 notes), whether calls are drawn from a chosen song (reuses the
Song Grid song engine — the song becomes a sequence of calls) or generated within the current
scale, reply time window (or "wait forever", the default), bird tempo.

**Build note.** Reuses the Song Grid engine and grid rendering nearly verbatim — build first of
the new batch.

**The student's turn ends when they STOP, not when they have played enough** (Phase 13,
2026-09-06). Free mode used to judge on a note count — `if(reply.length >= call.length)` — so a
student got exactly as many notes as the bird had just played and was then talked over.
Measured on the running app (`probes/phase-13/turns.js`): a 3-note call gave 3 notes and the
bird took its turn back on note 4, and **a 1-note call gave one note**, which is the setting
most likely to be used with the students who most need room. The doc promised the bird "waits
forever"; it waited forever for a reply to *start* and not at all for one to *finish*. A
**`Wait for me`** slider (1–8 s, default 2.5) now says how long a silence means "I've
finished", and the bird still waits forever for the first note. Measured after the fix: 8 of 8
notes at every call length, never interrupted, and the bird answers at 1.06 / 2.51 / 4.03 s
for settings of 1 / 2.5 / 4.

**Stopping the bird stops the queue too.** Every scheduled note goes through a `later()`
helper that keeps its id, and `stopConvo()` clears them before anything else — so the one
function that means "the conversation is over" makes that true of the queue as well as of the
state. The floating ♪ glyph is deliberately excluded: it removes itself after 1.5 s and
cancelling it would strand the element on screen.

**🪞 The bird copies me** — a third mode, and the half of call-and-response the app was
missing. Being imitated is the accessible side of the interaction: a student who cannot copy a
call can still notice that the bird just played *their* tune back, so the app can now talk
*with* students it could previously only talk *at*. The student leads, the bird answers. Three
things make it safe rather than a delay effect: it is a **mode**, not always-on (in Copycat a
bird that imitates the student muddles the task); it is capped at the last **12** notes, so a
long improvisation is not parroted back for a minute; and it hands the phrase back **in the
student's own rhythm**, converting their measured gaps into the beat units the calling loop
already uses so `beatSecs()` reproduces them exactly. Measured: notes echoed in order, gaps
within **6.8%** of the student's own. *An echo that quantised a student's timing to the bird's
tempo would be a correction, and a correction is a fail state wearing a friendly hat.*
In this mode the menu hides `Calls come from`, `Notes per call` and `Bird speed`, because the
bird makes no calls and a slider that governs nothing is worse than no slider.

---

## 10. 🎐 Sweep Chimes — `sweep_chimes.html` ✅ BUILT

**Concept.** A row or arc of hanging wind-chime bars fills the screen. Dragging through them
rings them with real physics: bars swing on their pivots, knock into neighbours, and set each
other ringing. Low/long bars on the left, high/short bars on the right — pitch is spatial.

**Therapy goals.** Gross-motor sweeps and continuous movement (like Strummer but with physical
cause-and-effect the student can *see* — the bar they hit visibly swings); pitch-space mapping
(left = low, right = high); gentle unpredictability (knock-on collisions) that rewards
experimentation.

**Sound.** Existing pluck/bell voices, bars tuned to the current scale across the chosen
register. Strike velocity from drag speed → loudness and swing amplitude.

**A tap arrives as the press itself, from `onDown`** (2026-08-30, after the user
reported chimes that "sometimes do not respond even though they are clearly being
hit"). The framework's first `splat` used to arrive on the *next* frame, so a press
shorter than one frame was silent — 8 ms silent, 16 ms rang at 60 fps, and the
window widens to 33–50 ms on a projector running 20–30 fps. `splat` is this app's
only hit path, because `mode:'flow'` + `noVoices:true` means `onDown` starts no
voice and fires no `onCell`. **The framework now delivers that press in `onDown`
for every app** (`PHASE-4I`), so this app needs no listener of its own — and a
`mousedown` listener would in any case be invisible to a dwell or a gamepad, which
call `onDown` directly and dispatch no DOM event. `velScale===0` marks the press,
and that is what bypasses the cooldown.

**And a bar is hit where it IS *and* where it HANGS.** The real cause of the
reported misses: striking a chime sets it swinging, the hit test followed only the
bar's current angle, and the next press fell into the gap it had left — while the
chime is still visibly there. Measured, ten clicks on one bar: 10/10 near the
pivot, 6/10 at 45% down, 5/10 near the bottom, and 10/10 at that low point with
the bars held vertical. So `hitBars` accepts a point on the swung bar **or**
inside the vertical slot it rests in. Slots cannot overlap (tolerance
`barW/2+brushR` ≈ 0.35 x spacing, centres one spacing apart), and rest is `th=0`
in both layouts — the arc moves each *pivot*, and every bar still hangs straight
down from its own. **Accepted cost:** tapping the empty slot of a bar that has
swung aside rings it, which slightly loosens this app's "cause-and-effect you can
see" goal. Taken because a student aims at a chime, not at a swinging line, and an
instrument must not get harder to play the more it is played.

A fresh press also **bypasses the 0.12 s per-bar cooldown** — that cooldown exists to stop one *sweep* re-ringing a bar it is still
crossing, and it was silently swallowing deliberate repeat taps (only 3 of 6 rang
at ~90 ms apart). One-touch sweep is triggered from the same handler, since a
switch press is the shortest press of all. Same fix as `bubbles.html:292`.

**Settings.** Bar count (5–15; fewer = bigger targets), layout (straight row / hanging arc),
collision chaining on/off (off = each bar independent, calmer), material look (bamboo, metal,
crystal — pick voice to match).

---

## 11. 🫧 Music Bubbles — `bubbles.html` ✅ BUILT

**Concept.** Bubbles drift up (or across) the screen, each tinted a Boomwhacker note colour.
Pop one and it bursts into sparkles and sounds its note. Escaped bubbles simply recycle — no
misses, no score, unless a game mode is deliberately switched on.

**Therapy goals.** Visual tracking plus timed reach — the only app in the suite where targets
*move*. Therapist tunes difficulty precisely: drift speed, bubble size, and density map directly
to the student's tracking and reach ability. Colour–note association reinforces the Boomwhacker
mapping used everywhere else.

**Modes.**
- **Free pop** (default) — endless gentle bubbles in the current scale.
- **Song bubbles** — bubbles carry the next notes of a chosen song (song engine again); popping
  any bubble plays the next song note, popping the *highlighted* one adds sparkle. The song
  always progresses — exploration is never wrong.
- **Little goals** (optional, therapist-enabled, off by default) — soft goals, never fail
  states. Two of them, chosen on the **Bubbles** tab: *🌈 Fill the rainbow* counts every pop
  into a meter, and *🎯 Pop the colour* fills the same meter only with pops of the one colour
  shown beside it, picking a fresh colour after each celebration. *Pops to fill the meter* sets
  the goal (5–20, default 10). Filling it empties the meter and plays a celebration burst —
  pops during the ~1.6 s celebration do not count. No lives, no game-over, no timers.

**Settings.** Drift speed, bubble size (huge → small), spawn density, direction (up / drifting
sideways / falling like snow), which notes/colours appear, game-mode goals.

---

**Little goals are Free pop only** (2026-08-30). In song mode a bubble carries the
song's note, but the colour target was chosen from *every* note column — so
`Song bubbles` + `Pop the colour` could set a colour the song never plays, leaving
a goal the student could never complete. That is a fail state. `Fill the rainbow`
was milder but still wrong there: a second progress meter and a second celebration
beside the song's own. `goalsOn()` now gates the pane, the counting and the meter
together, so they cannot drift apart. **The setting is kept, not cleared** — a
student's preset carries their goal back the moment Free pop returns.

## 12. 🏗️ Beat Builder — `beat_builder.html` ✅ BUILT — ⚠ NOT ON THE LAUNCHER

> Delisted from `index.html` on 2026-08-26: not developed enough to put in
> front of a student. The file is unchanged and still loads clean — relisting
> it is one line in `SECTIONS`.

**Concept.** A big-cell step sequencer: 4 or 8 steps across, 2–4 sound rows (drums and/or notes).
Tap cells to toggle them; the loop plays continuously with a bouncing playhead. The student
*composes* something that keeps existing — different agency from every performance app.

**Therapy goals.** Planning and prediction (place a sound, anticipate when it returns), pattern
awareness, ownership and identity ("YOUR song"), session continuity — saved beats reload next
week ("remember what you made?"). Also a natural collaboration surface: therapist fills one row,
student fills another.

**Sound.** Drum rows reuse the synthesized Drum Pads kit; note rows use the current scale/voice.
Tempo slider with a big visual pulse; swing toggle for instant groove.

**Features.** Row count and step count are therapist controls (start 2×4 for emerging users);
clear-row and clear-all behind the therapist panel (students can't wipe work accidentally);
compositions save into the existing named-preset system for recall across sessions.

---

## 13. 🪄 Conductor — `conductor.html` ✅ BUILT — ⚠ NOT ON THE LAUNCHER

> Delisted from `index.html` on 2026-08-26: not developed enough to put in
> front of a student. The file is unchanged and still loads clean — relisting
> it is one line in `SECTIONS`.

**Concept.** The inverse of every other app: music plays only while the student *moves*. A song
(existing library) flows while the pointer/finger is in motion — movement speed sets tempo,
vertical position sets volume/brightness — and fades gracefully to a shimmer when they stop.
A comet trail follows the "baton".

**Therapy goals.** Sustained continuous movement rather than discrete presses — range-of-motion
and movement-endurance work (including wheelchair users doing arm sweeps); self-regulation
(fast/slow, loud/quiet under the student's control); the profound reward of an orchestra that
obeys you.

**Modes.**
- **Conduct a song** — song engine supplies the notes; movement is the transport.
- **Conduct a texture** — no song, just a rich chord pad in the current key that swells with
  motion; calmer, no sequencing demand.

**Settings.** Motion sensitivity (tiny tremor movements can count — the "whisper mode"
equivalent for motor control), fade-out patience (how long stillness lasts before the music
rests), tempo range clamp, trail visuals.

**Build notes.** Input is pointer-move deltas smoothed over ~300 ms; no camera needed for v1.
A webcam-motion input mode can arrive later via the framework input-adapter work.

---

## 14–16. Sensory & Calm ports from the Touch repo ✅ BUILT (2026-07)

Three sensory-room animations ported from the earlier `touch` repo
(github.com/Magnatronic/touch) onto this framework, so they share the suite's sound
model (note bands, Boomwhacker colours, Keys/Flow, presets, session lock) instead of
the old continuous x→pitch mapping that confused therapists.

- **🍄 Slime Mould — `slime.html`** GPU Physarum simulation (WebGL2): agents burst from
  each touch and weave glowing networks. Gossamer/Dense/Rivers/Chaos styles, repel mode.
- **🧬 Game of Life — `life.html`** *Glow is a single-pass blur through a small
  buffer (a third linear, capped at 640 px), so it costs about the same on a 4K wall
  as on a laptop — measured at ~0 ms/frame at Cell 14 and 5.4 ms at Cell 8, against
  43–93 ms for the per-cell `shadowBlur` it replaced. It is deliberately **not**
  scaled by `activeQuality()`: that was tried and made the frame rate hunt, because
  glow was a large part of what auto-quality was measuring.*
  **Ghost Trail and Glow both run 0–10**, trimmed from 20 on 2026-08-27: the top half
  of each bought almost nothing (Ghost Trail 0→10 reaches 0.42 s and 10→20 only
  0.67 s; Glow feeds a blur that caps, so past ~12 it was identical at large cell
  sizes). A saved preset holding the old 20 is clamped to 10 on load. Paint living cells, watch them evolve; births play
  quiet `pluckNote`s in the current key. Its cell-colour setting is `cellColor`
  (renamed — the framework owns `colorMode`).
- **🕊️ Flock — `flock.html`** Boids swarm that gathers to (or flees) the fingers;
  **Murmuration / Fireflies / Embers** styles. Six colour themes (Sky, Garden,
  Violet, Embers, Aurora, Prism) are separate from the styles and set the palette
  only. *Touch pull* is 2–20, default 6. **A finger held still keeps pulling, and
  pulls harder the longer it rests** — up to 2.2× over 1.6 s — so a student who
  cannot swipe can still gather the flock; moving the finger resets the bonus.
  Plasma and Aurora were *styles* until 2026-08-26 and were removed for reading
  poorly on a projector; a saved preset naming either is migrated on load.
  *Trail length* is read as a **duration**, not as a fade alpha — trail time goes as
  1/alpha, so the old linear map put more of the slider's effect in its last five
  units than its first fifty (40 cleared in 0.22 s, 60 took 1.45 s and held a faint
  copy of the whole flock path on screen). Now 0.08 s at 20 and 0.47 s at 60, and
  driven from `dt` so a drop to 30 fps no longer doubles it. The fade also carries a
  `color-burn` pass: 8-bit compositing on an accelerated canvas **rounds**, so a plain
  alpha fade stalls a few levels above the background and never arrives — everywhere
  the flock had been sat at `rgb(3,3,3)` against an untouched `rgb(0,0,0)`. See
  `IMPROVEMENT-PLAN.md`. Soundscape was checked for the same fault and does not have it:
  its wash repaints every pixel each frame, so there is no untouched region to split against.

All three default to **Flow mode** (`defaults.mode:'flow'`) — sensory-first, with the
Keys grid one rail-tap away. The home page groups them under **Sensory & Calm** with
Soundscape and Voice Visuals. The `touch` repo is now superseded/frozen.

---

## 17. 🌀 Fluid Paint — `fluid_paint.html` ✅ BUILT (2026-07) — ⚠ NOT ON THE LAUNCHER

> Delisted from `index.html` on 2026-08-26: not developed enough to put in
> front of a student. The file is unchanged and still loads clean — relisting
> it is one line in `SECTIONS`.

Sensory fork of Fluid Keys: same Navier–Stokes core, deliberately diverged. Locked to
Flow (no Keys grid), calm defaults (pad voice, smooth glide), plus visual enhancements
that stay OUT of the instrument on purpose: **bloom** (soft-knee prefilter + separable
blur at low res, Glow slider), **3D shading** (dye brightness lit as a heightfield),
an exposed **Swirl** (vorticity) slider, and opt-in **Ambient drift** — the canvas
paints itself with soft splats, intentionally keeping the sim awake (skips idle-sleep
power saving, so it's off by default). Styles: Calm / Silk / Nebula / Lava lamp /
Smoke / Storm. The fork does not track fluid_sensory.html — don't sync them.

---

## Later / ideas parking lot

- **Realistic melodic instruments** (piano/marimba via multisample packs) — revisit once the
  assets/sample-pack pattern is proven with drums; full sample sets may need a hosted (non-USB)
  deployment or a local server.
- **Accessibility input adapters** (framework level): switch scanning, Xbox Adaptive Controller
  (Gamepad API), webcam motion, Web MIDI for real instruments.
- **Room lighting** (WLED/Hue sync) — needs a local bridge app; after the suite matures.
- **Breathing Buddy** — paced-breathing glow with soft tone; receptive regulation tool.
- **Resonance Room** — hold-to-bloom sustained tone; trains sustained touch, deeply calming.
- **Choice Board Jukebox** — 2–6 picture tiles holding therapist-assigned songs; choice-making,
  natural switch-scanning target.
- **Sound Story** — touchable illustrated scenes (farm, storm, space) for narrative sessions;
  art-asset heavy.
