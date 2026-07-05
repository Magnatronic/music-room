# Music Room

Accessible **music-making web apps for a sensory room**, built for music therapists working with
students with physical and learning disabilities. Every app runs fullscreen on a touch projector,
responds to up to five simultaneous fingers, and works **entirely offline** — open `index.html`
straight from a local folder or USB stick.

Sibling project: [touch](https://github.com/Magnatronic/touch) — visual-focused sensory animations.

## Design principles

- **Big, obvious cause-and-effect** — large touch zones, immediate sound + light.
- **Boomwhacker note colours everywhere** (C red, D orange, E yellow, F green, G teal, A purple,
  B pink) — matching the coloured instruments therapists already use.
- **Self-paced, no fail states** — apps wait for the student; nothing punishes a wrong press.
- **Therapist control** — every app has range/scale controls, named per-student presets,
  and a session lock (🔒, hold the top-left corner 3 s to unlock).
- **Offline-first** — no network requests at runtime, no build step, no dependencies.
  Binary assets (e.g. sample packs) ship as base64 inside `.js` files so they load from `file://`.

## Apps

| File | App | Status |
|---|---|---|
| `fluid_sensory.html` | 🎹 Fluid Keys — fluid painting + playable note grid | ✅ Built |
| `song_grid.html` | 🎵 Song Grid — follow-along song player | ✅ Built |
| `drums.html` | 🥁 Drum Pads — synthesized kit + backing track | ✅ Built |
| `big_switch.html` | 🔘 Big Switch Songs — one giant button plays the song | ✅ Built |
| `strummer.html` | 🎸 Chord Strummer | Planned |
| `voice_visuals.html` | 🎤 Voice Visuals | Planned |
| `voice_play.html` | 🗣️ Voice Play | Planned |
| `sampler.html` | 📼 Sampler Pads | Planned |
| `soundscape.html` | 🌧️ Soundscape Mixer | Planned |

See **`APPS.md`** for the full roadmap and per-app specs.

## Architecture: shared framework + tiny app files

The framework lives in exactly **two shared files** every app loads — there is one sound system,
one input system, one menu system, by construction:

- **`framework.js`** — settings + `localStorage` persistence, the scale/note engine with
  Boomwhacker colours and the note-zone grid, the audio engine (9 voices, 4 scales, effects with
  gated sends, polyphony auto-mixer, soft limiter, click-free retuning), 5-touch input, the menu
  panels, per-student presets, session lock, idle sim sleep, DPR sizing, WebGL context-loss
  recovery, and the render loop. It injects its own HTML (canvas, rail, menu, overlays) at load.
- **`framework.css`** — all shared styling.

Each app `.html` is then just a title, the two includes, and one `Anim` object
(`themes, defaults, schema, init, resize, splat, frame, reset`, plus optional hooks:
`styles, railButtons, setQuality, buildInstrument, buildVisuals, soundExtras, onCell,
lockMode, hideRail, paneLabels, bandColor`). `splat` coords are 0..1 with **y up**.

Script/link tags resolve relative paths on `file://`, so everything still runs offline —
just keep the folder together (copy the whole folder to a USB stick, not a single file).

## Adding a new app

1. Copy `template.html` to e.g. `drums.html` and replace the ANIMATION block.
2. In `index.html`, set that tile's `file:` from `null` to the filename.
3. Verify: Node syntax check, open from `file://`, test 5 touches + Reset settings.
