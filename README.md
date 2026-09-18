# Music Room

Some experimental web apps for use in sensory rooms. Everything runs fullscreen on a touch
projector, from a hosted page or straight off a USB stick.

## Running it

Two ways, both fine:

- **Hosted** — <https://magnatronic.github.io/music-room/>. Nothing to install, and launch
  links work the same way. Voice Visuals needs microphone access, which browsers only grant
  over HTTPS, so it works here and not from a local folder.
- **Offline** — copy the whole folder to the machine or a USB stick and open `index.html`.
  No network needed at all. Paths resolve relative on `file://`, so keep the folder together.

## Apps

| File | App |
|---|---|
| **Instruments** | *Open-ended music-making — every touch plays in key.* |
| `fluid_sensory.html` | 🎹 Fluid Keys — fluid painting + playable note grid |
| `strummer.html` | 🎸 Chord Strummer — sweep across the strings to strum |
| `drums.html` | 🥁 Drum Pads — synthesized kit + backing track |
| `sweep_chimes.html` | 🎐 Sweep Chimes — hanging chime bars that swing and knock |
| `sampler.html` | 📼 Sampler Pads — record any sound onto a pad |
| **Songs & Games** | *Structured activities with gentle goals — never a fail.* |
| `song_grid.html` | 🎵 Song Grid — follow-along song player |
| `big_switch.html` | 🔘 Big Switch Songs — one giant button plays the song |
| `echo_bird.html` | 🦜 Echo Bird — call-and-response tunes |
| `bubbles.html` | 🫧 Music Bubbles — pop drifting note bubbles |
| **Sensory & Calm** | *Mesmerising visuals and soundscapes for regulation.* |
| `soundscape.html` | 🌧️ Soundscape Mixer — rain, waves, birds on big sliders |
| `voice_visuals.html` | 🎤 Voice Visuals — the mic turns sound into light |
| `flock.html` | 🕊️ Flock — a glowing swarm gathers around your fingers |
| `slime.html` | 🍄 Slime Mould — living networks of light |
| `life.html` | 🧬 Game of Life — paint cells, new births play soft notes |

See **`APPS.md`** for per-app specs, the roadmap, and the retired apps and why they went.

## Safety and intended use

A side project, not a clinical or certified product. Intended for supervised use by staff who
know the people in the room.

Voice Visuals, Flock, Slime Mould, Fluid Keys and Game of Life put moving light on a large
screen. Nothing strobes by design, but any bright animation on a projector carries some risk
for people with photosensitive epilepsy or visual sensitivity. Try a new app out before using
it in a session, keep the room lit, and stop if anyone shows discomfort.

The audio engine has a soft limiter, but real output depends on the amplifier. Set levels
before a session rather than trusting the app.

Nothing is collected or transmitted. Settings and presets live in `localStorage` on that
machine; there are no accounts, no analytics and no network calls.

## Presets

Named per-student setups saved on the machine (`localStorage`, keyed `presets:<app>.html`), with
save / load / delete at the top of the **Presets** pane alongside **🔗 Copy launch link**. Each is
stored as a **diff from the app's defaults** — the same shape a launch link uses — so a preset
follows a later change to a default instead of pinning the old value.

Presets are an in-room convenience only. **Launch links never refer to a preset** (see below), so
editing or deleting one cannot break a link already handed to the launching software. That is why
there is no protection machinery around them: an earlier `presets.js` of undeletable "locked"
presets, with a download-and-drop-in flow to maintain it, existed solely to stop `?preset=` links
breaking, and settings-carrying links made the whole apparatus unnecessary.

## Launching an app on a given setup

The simplest route, and the one to reach for first: **Presets ▸ 🔗 Copy launch link** in any app
copies a link that *carries the setup*, so nothing has to be saved anywhere:

```
drums.html?s=voice:bell,volume:0.22,noteCount:7&lock=1
```

Only what differs from the app's defaults is listed, so links stay short and stay correct if a
default changes later. Values are typed from the matching default (`octave` and `octaveRows` are
strings that look numeric — guessing would break them), unknown or malformed entries are ignored
rather than allowed to brick the app, and `locked` can only be set via `lock=`, not smuggled in
through `s=`.

The point: the launching software's configuration *is* the setup. Nothing on the room PC defines
it, so nothing on the room PC can delete it, and there is no file to keep in sync. The cost is
that changing a setup means copying a fresh link and pasting it over the old one.

`lock=1` starts with the controls hidden (`lock=0` forces unlocked); unlock is the usual 3-second
hold on the top-left corner, and like the Lock button it sticks until someone unlocks. Both `?query`
and `#hash` are read, since some launchers mangle one or the other.

The link is absolute — an external launcher has no working directory to resolve against — and is
built from wherever the app actually is, so it self-corrects if the folder moves, and works the
same whether that is a local folder or the hosted page: open the app from its new home and copy
the link again.

A `launch.html` page once generated these in bulk, with a Folder location field for targeting a
path you were not sitting at. It was removed as redundant: you have to be at the touchscreen to
dial a setup in anyway, so the in-app button already produces the right link for the machine you
are on.

**`guide.html`** is this written for a non-technical reader: three numbered steps from "set the app
up" to "paste the link into your software", plus what to do when the folder moves. Hand that over
with the folder.

Full Windows shortcut example:

```
chrome.exe --kiosk "file:///C:/Music Room/drums.html?s=voice:bell,volume:0.22&lock=1"
```

## Architecture

Two shared files every app loads, so there is one sound system, one input system and one menu
system by construction, plus one small data file:

- **`apps.js`** — the app list (file, emoji, title, blurb, accent) in three sections, driving
  the home-page tiles.
- **`framework.js`** — settings + `localStorage` persistence; launch parameters; the scale/note engine with
  Boomwhacker colours and the note-zone grid; the audio engine (12 voices, 4 scales, gated effect
  sends, polyphony auto-mixer, soft limiter, click-free retuning); 5-touch input; menu panels;
  per-student presets; session lock; idle sim sleep; DPR sizing; WebGL context-loss recovery; and
  the render loop. It injects its own HTML (canvas, rail, menu, overlays) at load.
- **`framework.css`** — all shared styling.

Each app `.html` is then a title, the two includes, and one `Anim` object
(`themes, defaults, schema, init, resize, splat, frame, reset`, plus optional hooks:
`styles, railButtons, setQuality, buildInstrument, buildVisuals, soundExtras, onCell,
lockMode, hideRail, paneLabels, bandColor`). `splat` coords are 0..1 with **y up**.

Paths resolve relative on `file://`, so keep the folder together — copy the whole folder to a USB
stick, not a single file.

## Adding a new app

1. Copy `template.html` to e.g. `drums.html` and replace the ANIMATION block.
2. In `apps.js`, set that tile's `file:` from `null` to the filename.
3. Verify: Node syntax check, open from `file://`, test 5 touches + Reset settings.
   `.claude/skills/verify/SKILL.md` has the headless-browser recipe and its traps.

## Music

The tunes in Song Grid, Big Switch Songs and Echo Bird are traditional and long out of
copyright. All sounds are synthesized in the browser — there are no sampled recordings here.

If you add songs, check the tune is public domain first. Well known is not the same as out of
copyright, and the arrangement and the recording can be protected separately from the melody.

## Licence

MIT — see [`LICENSE`](LICENSE). Use it, change it, pass it on, at no cost; keep the copyright
notice with it. No warranty of any kind.

A personal project, maintained in my own time. Happy to answer questions about setting it up,
but there is no support commitment attached.
