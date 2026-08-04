# Music Room — App Roadmap & Specs

The living planning document for the sensory-room music suite. Apps are ordered by recommended
build sequence. Effort is relative (S/M/L). Update this doc as therapist feedback arrives.

## Cross-cutting conventions (every app)

- Built from `template.html`; all apps share `framework.js` + `framework.css` (see README), so
  the sound system, input, menu, presets and lock are identical everywhere by construction.
- **Boomwhacker note colours** for anything pitched (C red, D orange, E yellow, F green, G teal,
  A purple, B pink) — matches the physical instruments the therapists use.
- **Therapist controls**: scale/root/register/number-of-notes where pitched; named per-student
  **presets**; **session lock** (hold top-left 3 s to unlock); volume + voice + effects.
- **Launchable from other software** (2026-08, for the shared sensory room):
  `app.html?s=voice:bell,volume:0.22&lock=1` opens an app on an exact setup, optionally straight
  into locked play. The link carries the settings themselves — only the diff from the app's
  defaults — so **nothing on the room PC defines a launch**, and nothing anyone does there can
  break one. **Presets ▸ 🔗 Copy launch link** produces it in any app. Presets are stored in the
  same diff shape, so loading one and pressing the button gives that preset's link.
  `guide.html` is the step-by-step version for whoever configures the launching software. See
  README. A `launch.html` bulk link-generator was built and removed the same day as redundant —
  you have to be at the touchscreen to dial a setup in, so the in-app button already emits the
  right link for that machine.
  A `presets.js` of undeletable "locked" presets, with a download-and-drop-in flow to maintain it,
  was built and then removed the same day: it existed only to stop `?preset=<name>` links breaking
  when someone deleted a preset, and settings-carrying links made the entire problem — and the
  `?preset=` parameter — disappear.
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
  saved whole setup, usually per student. The rail is **Notes · Sound · Visuals · Presets** in
  every app; apps may re-label *Notes* when the pane genuinely isn't notes ("Songs", "Chords",
  "Scenes"), but the Sound tab keeps its name (icon variants allowed, e.g. Voice Visuals' 🔇).
  The root-note chips are always labelled **"Starting note"**, never "Key".
- **Fine-tune drawer**: set-once controls (app sliders, background colour, Performance quality,
  stats) live in the collapsed `Fine-tune` disclosure at the bottom of the Visuals panel —
  `appendFineTune(el, build?)` in framework.js. `makeDrawer(el, build, label?)` builds the same
  disclosure under any name and remembers each one's open state separately. Keep the everyday top level to what changes
  mid-session: Style chips, paint colours, and (Keys mode) zone/press feedback.
- **Voices** (expanded 2026-07): Pure, Warm, Bell, Glass, Deep, Harp (layered decaying
  harmonics — a Karplus-Strong delay-line version was tried and cut, see the note in
  framework.js), E-Piano (2-op FM tine), Music box,
  Marimba and Kalimba (modal synthesis on the real instruments' inharmonic partial ratios),
  Synth, Pad. Retro and the generic Pluck are retired; saved settings migrate to
  Synth/Kalimba automatically. Three **sound macros** — Brightness, Attack, Ring — sit in
  the Sound pane's Fine-tune drawer and map across every voice (0.5 = the engine's
  original values); presets capture them like any other setting.

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
size/brightness, pitch = colour/height. Visual styles: Mandala, Lava, Waves, Flow, Pixels, LEDs,
Ripples, Starfield. (A 🎆 Fireworks style shipped and was retired — the bursts read as noise next to
the calmer styles and nothing was lost by dropping it.)

**Therapy goals.** Rewards vocalization for non-verbal students; breath control; call-and-response
with the therapist's voice or instruments; the room "hears" the student.

**Build notes.** `getUserMedia` + `AnalyserNode`; tap-to-enable mic UX with graceful denial
fallback; **no audio output** (feedback safety). Sensitivity presets ("whisper" mode for quiet
vocalizers is the key therapy feature — tiny sounds must produce big rewards). Pitch detection
via autocorrelation on the time-domain buffer (good enough for voice).

**💧 Ripples — one ring per frame, and a pop wins.** The timed ring and the onset splash used to be
independent, so a loud sound landed both at once and then — because the level release is slow
(~0.35 s) — the timer kept re-triggering all the way down the decay, turning one clap into a train
of ripples over the next second. Timed rings now only fire while the sound holds or builds. The
decay test must be **relative** to the level (`> -level*0.8`): a release always falls at
`level/0.35` per second, so any fixed threshold gets cleared once the level grows small and the
train starts up again about a second after the clap — which was exactly the reported symptom, and
which a first fix using an absolute rate did not cure. Measured: one clap went 6 rings → 1, while a
sustained 2 s note still gives its steady train of 16.

**Idle sleep — read this before adding a style.** The frame loop keeps the sim awake while anything
is "still busy", and every one of those tests must be gated on the style that owns it. A style's
leftovers are only wound down by its own draw function, which stops running the instant you switch
away, so an ungated test latches true forever and the projector renders a frozen picture all night.
This was live for Pixels, Flow, Ripples and Mandala (measured: 152 pokes in 2.5 s after switching
away, never sleeping). `touchRings` is the one exemption — it is drawn and decayed every frame in
every style. Note that sleep lands ~32 s after the last activity, not 20: the app pokes for 20 s of
frame time and each poke buys 12 s, which matters when testing it.

**💡 LEDs style.** The whole screen is one LED matrix panel running a polar plasma — the look WLED
people actually reach for on a big matrix (Stefan Petrick's Animartrix family, Soap, Octopus) rather
than a spectrum analyser. Spiral arms wind outward from the middle while a second set counter-rotates
through them, both warped by a drifting noise field, so the pattern never repeats. Colour comes from
the field itself and so varies in **both** directions — that is the whole point, and the thing an
earlier scrolling-equalizer version could never do (it mapped colour to row only, so the panel could
only ever show one fixed vertical rainbow with brightness flickering on top; it read as flat).
Silence leaves it drifting slowly; a voice speeds the field up, blooms it brighter and slides the
palette by pitch; a sharp sound rolls a surge out from the centre. A finger drags the bright heart of
the pattern around the panel. Dials: LEDs across (16–96), drift speed, pattern scale.

**⭐ Starfield style.** Not a photo of a sky — you fly through it. Stars live in 3D and rush outward
past a vanishing point, so there is real depth: far ones crawl, dim and cool; near ones tear past
fat, bright and white-cored. The voice is the throttle (quiet = a slow drift, a shout = full warp),
**holding a finger anywhere on the wall** throttles up too, pitch slides the palette, and coloured
nebula clouds swell past as you go. Colour is a function of depth and pitch together, so the whole
theme is on screen at every moment. Dials: stars, warp speed, trail length.

**The vanishing point is pinned to the centre and nothing may move it.** Every star is projected
from it, so shifting it re-projects the whole sky at once and the field lurches sideways — which is
disorientating however gently it is eased, and is not fixable by softening the spring. An earlier
version let a finger drag it (and snapped it back 1.2 s after release, a second lurch the other way)
and let pitch slide it up and down; both were wrong for the same structural reason. Touch is now a
pure throttle with no aim — the whole wall is the accelerator, which also suits a student who cannot
target precisely. Note that a held-but-still finger emits no `splat()` at all (the framework only
calls it when a touch *moves*), so the throttle reads `pointers` directly.

The version this replaced drew all ~140 stars pure white (`[255,255,255]` hardcoded), never moved
them, and hid its only background colour behind a 3.5%-alpha haze — hence "not very colourful and a
bit boring". If the star alpha is ever retuned, keep a **floor** on it: a squared falloff makes
everything that is not right on top of you invisible and leaves a black hole around the vanishing
point. The old memory-stars (a sharp sound permanently added a coloured star to the sky) do not
survive the move to a moving field — the reward is now a burst of speed instead.

Two things that matter if the LEDs style is ever retuned: the noise warp feeding the spiral phase
must stay **low frequency** — a warp that turns over faster than a couple of LEDs aliases into
confetti — and
the palette position must **ping-pong** rather than wrap, because a theme runs red→purple and
wrapping snaps straight back to red at the seam.

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
- **Game mode** (optional, therapist-enabled) — soft goals, never fail states: "pop 10 bubbles"
  fills a rainbow meter → celebration burst; "pop the green ones" (colour targeting); a chill
  streak counter that only ever grows or gently resets. No lives, no game-over, no timer
  pressure unless the therapist adds one.

**Settings.** Drift speed, bubble size (huge → small), spawn density, direction (up / drifting
sideways / falling like snow), which notes/colours appear, game-mode goals.

---

## 12. 🏗️ Beat Builder — `beat_builder.html` ❌ REMOVED

Removed 2026-07-31 at the therapist's call — it was built and trialled but not wanted in
the suite. See git history (through `dc2d3f0`) for the full spec and implementation.

---

## 13. 🪄 Conductor — `conductor.html` ❌ REMOVED

Removed 2026-07-31 at the therapist's call — it was built and trialled but not wanted in
the suite. See git history (through `dc2d3f0`) for the full spec and implementation.

---

## 14–16. Sensory & Calm ports from the Touch repo ✅ BUILT (2026-07)

Three sensory-room animations ported from the earlier `touch` repo
(github.com/Magnatronic/touch) onto this framework, so they share the suite's sound
model (note bands, Boomwhacker colours, Keys/Flow, presets, session lock) instead of
the old continuous x→pitch mapping that confused therapists.

- **🍄 Slime Mould — `slime.html`** GPU Physarum simulation (WebGL2): agents burst from
  each touch and weave glowing networks. Gossamer/Dense/Rivers/Chaos styles, repel mode.
- **🧬 Game of Life — `life.html`** Paint living cells, watch them evolve; births play
  quiet `pluckNote`s in the current key. Its cell-colour setting is `cellColor`
  (renamed — the framework owns `colorMode`).
- **🕊️ Flock — `flock.html`** Boids swarm that gathers to (or flees) the fingers;
  Murmuration/Fireflies/Plasma/Embers/Aurora styles.
  Attractors are built from `pointers` at the top of `frame()`, **not** from `splat()`. splat only
  fires when a touch *moves*, and `_attractors` is rebuilt every frame, so a finger resting still
  used to exert no pull at all; splat also fired once per interpolated step, so a fast flick stacked
  up to ten attractors and yanked far harder than a slow drag over the same ground. One attractor
  per finger per frame is consistent either way. Touch pull runs 2–10 (was 1–8) against a ×4.2 gain
  (was ×3.2) — the old bottom of the range barely moved the swarm — and `pull` is clamped to the
  slider minimum so a device carrying an old saved value doesn't sit below what the UI can express.
  `Anim._dbg(x,y)` reports agents within the touch radius; measure pull with that, **not** with lit
  pixel counts, which swing several-fold frame to frame on trails and glow alone.

All three default to **Flow mode** (`defaults.mode:'flow'`) — sensory-first, with the
Keys grid one rail-tap away. The home page groups them under **Sensory & Calm** with
Soundscape and Voice Visuals. The `touch` repo is now superseded/frozen.

---

## 17. 🌀 Fluid Paint — `fluid_paint.html` ❌ REMOVED

Removed 2026-07-31 at the therapist's call: Fluid Keys does the job better, so the
sensory-only fork was not worth keeping alongside it. It was a fork of Fluid Keys sharing
the Navier–Stokes core but deliberately not synced, adding bloom, 3D dye shading, an
exposed Swirl slider and ambient drift. See git history for the full spec and
implementation — those visual extras are the place to start if the instrument ever wants
them.

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
