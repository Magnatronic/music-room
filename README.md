# Music Room

Some experimental web apps for use in sensory rooms. Everything runs fullscreen on a touch
projector and works entirely offline — open `index.html` straight from a local folder or USB stick.

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

## Architecture

Two shared files every app loads, so there is one sound system, one input system and one menu
system by construction:

- **`framework.js`** — settings + `localStorage` persistence; the scale/note engine with
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
2. In `index.html`, set that tile's `file:` from `null` to the filename.
3. Verify: Node syntax check, open from `file://`, test 5 touches + Reset settings.
   `.claude/skills/verify/SKILL.md` has the headless-browser recipe and its traps.
