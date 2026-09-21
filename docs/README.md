# Music Room

Accessible **music-making web apps for a sensory room**, built for music therapists working with
students with physical and learning disabilities. Every app runs fullscreen on a touch projector,
responds to up to five simultaneous fingers, and runs from a hosted page or **entirely offline**
straight off a local folder or USB stick.

## Running it

Two ways, both fine:

- **Hosted** — <https://magnatronic.github.io/music-room/>. Nothing to install; good for trying
  it out, and launch links work the same way from there.
- **Offline** — copy the top level of the repository onto the machine or a USB stick (see *What
  goes in the room* below) and open `index.html`, or `Music Room.cmd` for a fullscreen room
  start. No network needed at all. Paths resolve relative on `file://`, so keep the folder
  together.

Everything works from either, microphone included: Chrome and Edge treat a `file://` page as a
secure context, so Voice Visuals and Sampler Pads can ask for the mic offline too.

Sibling project: [touch](https://github.com/Magnatronic/touch) — visual-focused sensory animations.

## What goes in the room

**The top level of the repository IS the build.** Copy every loose file there plus the `assets`
folder onto the machine or the USB stick, and that is the whole thing — no build step, no
install, no network:

```
index.html            the launcher
<20 activity files>   everything the launcher lists
framework.js          the shared everything
framework.css
midi.js               the MIDI reader, shared by four of the MIDI apps
songs.js              the tunes, shared by four song apps
assets/               one emoji sprite file
Music Room.cmd        opens the launcher in Edge, already fullscreen
LICENSE               MIT — travels with every copy
```

`CLAUDE.md` is the only visible file at the top level that is not part of the build; it has to sit
in the project root for the tooling that reads it. The dotfiles `.gitignore` and `.nojekyll` are
repository plumbing and need not be copied. Everything else that is not needed in the room lives
one folder down, so that copy stays easy to make and easy to check:

| folder | what is in it |
|---|---|
| `docs/` | this file and every other `.md` — the plan, `APPS.md`, the `PHASE-*` design docs, the `UAT-*` checklists |
| `archive/` | Beat Builder, Conductor and Fluid Paint — delisted 2026-08-26, kept because they still run — and the history bundle |
| `bench/` | `template.html`, the starting point for a new app, and the two harnesses `fx_lab.html` and `sound-test.html` |
| `probes/` | the measurement scripts each phase was verified with (Node + `playwright-core`) |
| `prototypes/` | throwaway UI prototypes, built to be clicked rather than read |

A page in `archive/` or `bench/` loads the framework from `../`, and repoints its own Home link,
because the framework writes a relative `index.html` that does not resolve from a subfolder. The
load gate walks all three folders, so those six pages are still covered: **27 pages, not 21.**

## Design principles

- **Big, obvious cause-and-effect** — large touch zones, immediate sound + light.
- **Boomwhacker note colours everywhere** (C red, D orange, E yellow, F green, G teal, A purple,
  B pink) — matching the coloured instruments therapists already use.
- **Self-paced, no fail states** — apps wait for the student; nothing punishes a wrong press.
- **Therapist control** — every app has range/scale controls, named per-student presets,
  a **Setup** pane (Fullscreen, Access, Reach area, Menu size, performance), and a session
  lock (🔒, hold the top-left corner 3 s to unlock).
- **A reach area — put the activity where the student can get to it** — `Setup → Reach
  area`. A projector fills a wall and a student in a wheelchair can reach one part of it.
  **Size** shrinks the whole activity (down to 25%) and **Place it** lets you drag it to
  where they can reach, watching them rather than the laptop. Nothing is cropped: the
  activity is *mapped into* the rectangle, so every note and every corner is still there.
  It is one transform in `fitSurface()` — **all 24 apps get it identically, none of them
  changed** — and it is the one thing allowed to scale a locked session, because a smaller
  activity a student can reach beats a crisper one they cannot. **🖥️ Fill the screen** is
  always there to undo it — and **a reach area never survives a page load**, because it
  describes where a chair is today rather than what a student is like, so a shared room PC
  can never hand one therapist's setup to the next therapist's student. A launch link or a
  preset is how one is deliberately restored. `PHASE-7-REACH-AREA.md`.
- **↺ Defaults is a preset, not a reset button** — first in the `Presets` list, because that
  is what it is: `applyPreset({})`, plus clearing the artwork, which is what "as if you had
  just opened the app" means. Tap-twice to confirm, since it is the only row in the list that
  destroys anything.
- **Launch links for the room PC** — `app.html?s=noteCount:5,voice:synth&lock=1`
  opens an activity already set up and already locked, so the control software can
  put exactly what a therapist chose onto the projector. Built from **🔗 Copy launch
  link** on the Presets pane. A link carries the activity's setup **only** — never
  the display's menu size, never a student's access setup — so a launch can never
  silently turn off someone's switch. It **does** carry a reach area, and a link that says
  nothing about one starts full-screen, so one therapist's setup can never be inherited by
  the next therapist's student. `PHASE-6-LAUNCH-PARAMETERS.md`, `PHASE-7-REACH-AREA.md` §6.1.
- **Fullscreen, per display** — a toggle at the top of `Setup`, so the activity fills a
  projector without anyone reaching for F11. **It cannot survive going Home**: the Fullscreen
  API is per-document and every browser drops it on navigation (measured in Edge and Firefox).
  For a room, launch with **`Music Room.cmd`** instead — `--start-fullscreen` is a *window*
  state, like F11, so it holds through the launcher and every app. Stored per machine like Menu size, not in a
  preset. The toggle renders what the browser is actually doing, so Esc and F11 cannot
  desync it. It fires `Anim.resize`, so it is set **before** an activity starts — see
  `PHASE-4F-FULLSCREEN.md`.
- **🔒 Lock takes fullscreen too — borrowed, never stored.** The lock's own click is the
  gesture the API needs, so handing the device to a student also hands it the whole screen;
  the unlock hold gives it back. A lock never writes the `fullscreen` key, so a student's
  session cannot change what the display is set to, and if the preference was already on the
  unlock leaves fullscreen alone. In a room started by `Music Room.cmd` nothing resizes and
  nothing is lost; from a windowed browser it is a real resize and clears the canvas in the
  apps that keep their state there — see `PHASE-4H-FULLSCREEN-ON-LOCK.md`.
- **Three ways in besides a finger** — `Setup → Access`, three tabs: **Controller**,
  **Mouse**, **Buttons**. They are tabs, not a mode switch, so every device stays live
  whichever one is showing — a therapist on the mouse and a student on the stick is the
  normal case. A stick moves a cursor in the same coordinates a finger uses, so no app
  knows a gamepad exists; the XAC is a hub, so switches in its ports and a joystick in its
  USB socket all arrive as one controller.
- **Pressing without a click, two ways for two students.** *Pushing the stick plays* is for
  a student who cannot aim — the note sounds the whole time the stick is pushed. **Dwell**
  is for one who can aim but cannot press — travel is silent, and arriving and holding still
  plays a note. Dwell is a **click**: it lets go on its own, because a press that ended only
  on the next movement was a note that never ended for the student least able to move again.
  It is **per device**, so it can be on for the student's stick and off for the therapist's
  mouse. Never on for touch.
- **A press reaches the app the instant it lands, whatever made it.** The initial
  `splat` is delivered by `onDown`, not a frame later by the render loop, so a tap
  shorter than one frame still counts — and, more importantly, so do presses no DOM
  event ever describes: a **dwell** and a **gamepad** press call `onDown` directly.
  An app that works around this with its own `mousedown` listener is invisible to
  exactly the students the Access pane exists for. `PHASE-4I-DOWN-EVENT-SPLAT.md`.
- **A modal owns the screen.** While a dialog is open the stick's pointer suspends and
  resumes where it was left; bound keys and buttons keep working. A modal stops *where* a
  student is pointing, never *when* they play — the same split the session lock already uses.
- **Any controller button, or any key, can do a named action** — Clear, Play, Restart —
  bound to the **rail button the app already has**, so no app declares anything. Out of the
  box **X clears and Y does the app's main action**, where the app has them. A button given
  a job stops playing a note; every other button still plays.
  `PHASE-5A-GAMEPAD-POINTER.md`, `PHASE-5B-HUB-KEYS.md`, `PHASE-5C-ACCESS-PANE.md`.
- **One Menu size for the whole room** — a single 80–150% dial scales every button, label
  and slider in all 24 apps *and* the launcher, so a wall screen and a projector across a dim
  room can each be set up once. Sizes and colours all derive from the token block at the top
  of `framework.css`; nothing in an app writes a raw pixel size.
- **Offline-first** — no network requests at runtime, no build step, no dependencies.
  Binary assets (e.g. sample packs) ship as base64 inside `.js` files so they load from `file://`.

## Apps

**19 built, 16 listed on the launcher**, grouped as `index.html` groups them.

**Instruments** — open-ended music-making; every touch plays in key.

| File | App |
|---|---|
| `fluid_sensory.html` | 🎹 Fluid Keys — fluid painting + playable note grid |
| `strummer.html` | 🎸 Chord Strummer — sweep the strings, always in harmony |
| `drums.html` | 🥁 Drum Pads — synthesized kit, pad editor + backing track |
| `sweep_chimes.html` | 🎐 Sweep Chimes — hanging bars that swing and ring |
| `sampler.html` | 📼 Sampler Pads — record any sound onto a pad, then play it |

**Songs & Games** — structured activities with gentle goals, never a fail.

| File | App |
|---|---|
| `song_grid.html` | 🎵 Song Grid — follow-along song player |
| `big_switch.html` | 🔘 Big Switch Songs — one giant button plays the song |
| `echo_bird.html` | 🦜 Echo Bird — call and response |
| `bubbles.html` | 🫧 Music Bubbles — pop drifting notes, or follow a song |
| `sound_match.html` | 🃏 Sound Match — turn two cards over and find the notes that match |

**Plug in an instrument** — needs hardware, and gives a student a physical way in.

| File | App |
|---|---|
| `midi_light.html` | 🎹 MIDI Light — plug in any MIDI keyboard or pads and every note becomes light |
| `midi_chords.html` | 🎶 Big Chords — one key, one finger, a whole chord, always in the scale |
| `midi_loop.html` | 🌱 Loop Garden — play a few notes and stop; they keep coming round |
| `midi_creatures.html` | ✨ Drift — every note sets something adrift that keeps singing |
| `midi_mirror.html` | 💬 Mirror — you play, it waits, then it answers with a phrase of its own |

**Sensory & Calm** — mesmerising visuals and soundscapes for regulation.

| File | App |
|---|---|
| `soundscape.html` | 🌧️ Soundscape — rain, waves, birds and soft chords on big sliders |
| `voice_visuals.html` | 🎤 Voice Visuals — the microphone turns sound into light |
| `flock.html` | 🕊️ Flock — a glowing swarm gathers around your fingers |
| `slime.html` | 🍄 Slime Mould — living networks of light |
| `life.html` | 🧬 Game of Life — paint cells; new ones play soft notes as they are born |

`fx_lab.html` is a bench for tuning press effects and `sound-test.html` is a
bench for the audio engine — neither is an activity, and both are deliberately
absent from `index.html`. `voice_play.html` was **cancelled** (`APPS.md:155`).

**`sound-test.html`** loads `framework.js`, hides the shell it injects and never
calls `boot()`, so it drives the engine with none of the furniture. Its adapter
turns a note index into the centre of that note's band, so hold / strike /
release land on the real `startVoice` / `retuneVoice` / `stopVoice`. It edits
the real `VOICES` table and exports a paste-ready entry. It tests **sound, not
input** — going straight from a note index to an x coordinate skips `toLocal`
and `toSim`, where two real bugs have lived.

**Built but not on the launcher** (2026-08-26, the user's call — not developed
enough to put in front of a student): `beat_builder.html` 🏗️ Beat Builder,
`conductor.html` 🪄 Conductor, `fluid_paint.html` 🌀 Fluid Paint. The files are
still here and still load clean; relisting one is a single line in `SECTIONS`.

See **`APPS.md`** for the full roadmap and per-app specs.

## Architecture: shared framework + tiny app files

The framework lives in exactly **two shared files** every app loads — there is one sound system,
one input system, one menu system, by construction:

- **`framework.js`** — settings + `localStorage` persistence, the scale/note engine with
  Boomwhacker colours and the note-zone grid (**🌈 Boomwhacker · 🌫 Muted · ◐ Mono**, one row
  meaning the same thing in every app that shows a keyboard — `PHASE-15-KEYBOARD-LOOK.md`), the audio engine (12 voices, 4 scales, three sound
  macros, effects with gated sends, polyphony auto-mixer, soft limiter, click-free retuning),
  5-touch input, the settings strip, per-student presets, session lock, idle sim sleep, DPR
  sizing, the reach area, WebGL context-loss recovery, and the render loop. It injects its
  own HTML at load:
  **`#shell`, a flex row of `#rail`, `#strip` and `#stage`**. `#stage` is only the slot the
  activity is given; the activity is **`#surface`**, always `100vw x 100vh` and **scaled** to
  fit the slot (`fitSurface()`). Chrome never covers it and it is never re-laid-out, so no app
  is told to resize when a settings group opens or the session locks - nothing an app has
  drawn is lost. With the chrome collapsed the scale is exactly 1, so a locked session is
  pixel-perfect — unless a **reach area** is set, which is the one thing allowed to scale a
  locked session and is those same three numbers answered differently. `#surface` carries
  the transform, so it is the containing block for
  `position:fixed` elements: an app that makes its own must append them to **`stageEl`**,
  not `document.body`.
- **`framework.css`** — all shared styling.

Each app `.html` is then just a title, the two includes, and one `Anim` object
(`themes, defaults, schema, init, resize, splat, frame, reset`, plus optional hooks:
`styles, railButtons, setQuality, buildApp, appLabel, buildInstrument, buildSound,
buildVisuals, soundExtras, setupExtras, onCell, lockMode, hideRail, paneLabels,
bandColor`). `splat` coords are 0..1 with **y up**.

**The settings tabs mean the same thing in every app** — that is the rule the hooks
exist to protect:

| tab | holds | always |
|---|---|---|
| *(app)* | whatever this app **is** — the song, the beat, the scene | only with `buildApp`; first |
| **Notes** | Register, Scale, Starting note, the note count | omitted via `hideRail:['instrument']` where there is no key to set |
| **Sound** | the voice row, Effects, Volume, Shape the sound | |
| **Visuals** | what it looks like | |
| **Presets** | ↺ Defaults, then per-student setups, then 🔗 Copy launch link | |
| **Setup** | Fullscreen · Access (Controller/Mouse/Buttons) · Reach area · Menu size · This computer | the `Buttons` tab only where the app has rail actions |

See `PHASE-4E-APP-TAB.md`.

Script/link tags resolve relative paths on `file://`, so everything still runs offline —
just keep the folder together (copy the whole folder to a USB stick, not a single file).

## Adding a new app

**The menu comes free.** `framework.js` builds the rail and every pane, so a new
app has Access, Reach area, Menu size, Fullscreen and Performance before it has
a single control of its own. Nothing below adds any of that per app.

1. Copy `template.html` to e.g. `drums.html`, retitle it, and replace the
   ANIMATION block. That block's header comment **is** the `Anim` contract —
   every hook the framework calls, and the two rules that fail silently.
2. Add a tile to the right section of `SECTIONS` in `index.html`:
   `{file, emoji, title, blurb, accent}`. The sections say *when* a therapist
   reaches for an app — Instruments · Songs & Games · Sensory & Calm — and are
   ordered most-used first.
3. Give it an entry in `APPS.md`, the per-app reference and the doc kept
   accurate; add a line to `IMPROVEMENT-PLAN.md` if it belongs to a phase.
4. Verify by driving the real page, not by reading it. Every page must load from
   `file://` with 0 `pageerror`, 0 `console.error` and 0 failed requests — the
   baseline `UAT-PHASE-0.md` set — and then exercise 5 simultaneous touches,
   ↺ Defaults, Lock and unlock, and Reach area at 25%.

## Safety and intended use

A side project, not a clinical or certified product. Intended for supervised use by staff who
know the people in the room.

Most of these apps put moving light on a large screen. Nothing strobes by design, but any bright
animation on a projector carries some risk for people with photosensitive epilepsy or visual
sensitivity. Try a new app out before using it in a session, keep the room lit, and stop if
anyone shows discomfort.

The audio engine has a soft limiter, but real output depends on the amplifier. Set levels
before a session rather than trusting the app.

Nothing is transmitted: there are no accounts, no analytics and no network calls. Settings and
presets live in `localStorage` on that machine — and so do **Sampler Pads recordings**, which
can be a student's own voice. They stay on that PC until someone uses **🗑 Clear pad**, and the
next person to use the machine can play them. Clear those pads at the end of a session if that
matters.

## Music

The built-in tunes shared by Song Grid, Big Switch Songs, Echo Bird and Music Bubbles
(`songs.js`) are traditional or long out of copyright. Every sound is synthesized in the
browser; there are no sampled recordings in the repository.

If you add songs, check the tune is public domain first. Well known is not the same as out of
copyright, and the arrangement and the recording can be protected separately from the melody.

## Licence

The code is **MIT** — see [`LICENSE`](../LICENSE). Use it, change it, pass it on, at no cost;
keep the copyright notice with it. No warranty of any kind.

**One exception.** The Soundscape Mixer icons in `assets/openmoji_soundscape.js` are from
[OpenMoji](https://openmoji.org) and are **CC BY-SA 4.0**, not MIT. Keep the attribution with
them, and share any change to those icons under the same licence. That notice is in the icon
file's own header, so it travels with the icons; `LICENSE` is kept to the plain MIT text,
because GitHub only recognises a licence file it can match word for word. `LICENSE` sits at the
top level rather than in `docs/` so the MIT notice travels with every copy of the build.

A personal project, 100% vibe coded and lightly tested. Happy to answer questions about setting it
up, or to try and add or fix things. Hope you enjoy :)