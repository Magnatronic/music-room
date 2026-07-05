# Music Room — App Roadmap & Specs

The living planning document for the sensory-room music suite. Apps are ordered by recommended
build sequence. Effort is relative (S/M/L). Update this doc as therapist feedback arrives.

## Cross-cutting conventions (every app)

- Built from `template.html` (shared framework — see README). One HTML file per app.
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

---

## 1. 🎵 Song Grid — `song_grid.html` (BUILD FIRST, M)

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

## 2. 🥁 Drum Pads — `drums.html` (S/M)

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

## 3. 🔘 Big Switch Songs — `big_switch.html` (S)

**Concept.** The whole screen is ONE giant button. Every activation — touch anywhere, any
keyboard key, or an accessibility switch (switches present as Space/Enter) — plays the NEXT
note or phrase of the chosen song with a full-screen burst of colour.

**Therapy goals.** This is the classic switch-access interaction (like a Big Mack): students with
minimal or unreliable motor control get full musical agency. Phrase mode (one press = one bar)
gives big reward per action; note mode gives fine sequencing.

**Build note.** Reuses Song Grid's song engine verbatim — build after (or alongside) Song Grid.
Settings: song, note/phrase granularity, visual burst style, hold-to-repeat on/off.

---

## 4. 🎸 Chord Strummer — `strummer.html` (M)

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

## 5. 🎤 Voice Visuals — `voice_visuals.html` (M)

**Concept.** Microphone-driven visuals: vocalize and the room responds with light. Loudness =
size/brightness, pitch = colour/height. Visual modes: bloom (a glow that swells), ripples,
particle fountain, aurora bands.

**Therapy goals.** Rewards vocalization for non-verbal students; breath control; call-and-response
with the therapist's voice or instruments; the room "hears" the student.

**Build notes.** `getUserMedia` + `AnalyserNode`; tap-to-enable mic UX with graceful denial
fallback; **no audio output** (feedback safety). Sensitivity presets ("whisper" mode for quiet
vocalizers is the key therapy feature — tiny sounds must produce big rewards). Pitch detection
via autocorrelation on the time-domain buffer (good enough for voice).

---

## 6. 🗣️ Voice Play — `voice_play.html` (M/L, riskier)

**Concept.** Hear your own voice transformed: echo canyon, deep giant voice, chipmunk, robot
(ring mod), stutter. Big icon buttons choose the effect; the screen visualizes input vs output.

**Therapy goals.** Vocal experimentation and self-recognition; hugely motivating for students
who love hearing themselves.

**Build notes.** Feedback management is the core problem: prefer headphones/directional mic;
include an anti-feedback ducker (mute output while input is loud → take-turns echo pattern
rather than live monitoring). Pitch shift via granular playback (record 0.5–2 s, replay
transformed) is safer than live shifting and doubles as a mini turn-taking game. Build after
Voice Visuals proves the mic pipeline.

---

## 7. 📼 Sampler Pads — `sampler.html` (M)

**Concept.** Koala-lite: 6–9 big pads. Hold a pad to record (MediaRecorder from the mic),
tap to play. Per-pad colour + icon; per-pad pitch/speed slider; optional loop toggle.

**Therapy goals.** The student's own voice/sounds become the instrument — identity, motivation,
personalized sessions ("play YOUR sound"). Therapists can pre-record session-specific sounds.

**Build notes.** Record via MediaRecorder → decode to AudioBuffer for low-latency playback.
Persist kits: localStorage holds ~5 MB (enough for short clips as base64); add export/import
kit as a downloadable `.json` for bigger libraries. Lock recording behind the therapist panel
so students can't accidentally erase pads.

---

## 8. 🌧️ Soundscape Mixer — `soundscape.html` (S/M)

**Concept.** Big illustrated tiles (rain, ocean, birdsong, wind, campfire, soft chord drone,
heartbeat). Touching a tile fades its loop in/out; the tile glows while active. The visuals
blend the active layers (rain streaks + ember glow...).

**Therapy goals.** The regulation/relaxation end of the sensory diet — students compose their
own calming environment; useful as a session wind-down. Complements the high-stimulation apps.

**Sound.** All synthesized loops (filtered noise recipes for rain/wind/waves; randomized sine
chirps for birds; the existing pad voice for the drone in the current key) — no samples needed.

---

## Later / ideas parking lot

- **Realistic melodic instruments** (piano/marimba via multisample packs) — revisit once the
  assets/sample-pack pattern is proven with drums; full sample sets may need a hosted (non-USB)
  deployment or a local server.
- **Turn-taking duet** — split screen call-and-response; app replays the student's phrase.
- **Conducting** — music plays only while the student moves; movement speed = tempo.
- **Accessibility input adapters** (framework level): switch scanning, Xbox Adaptive Controller
  (Gamepad API), webcam motion, Web MIDI for real instruments.
- **Room lighting** (WLED/Hue sync) — needs a local bridge app; after the suite matures.
