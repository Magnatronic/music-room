# Phase 11 — listening properly: what Voice Visuals hears

**Status:** designed and built 2026-09-03 on `phase-11-listening`; **UAT round 1
fixes built 2026-09-04 — §11.** Not merged, awaiting the user's round-2 UAT.

**Seven things in this document were wrong and are corrected in place**, each one
found by a probe rather than by reading: the onset constant (§2.4), the floor
seed (§2.2), a deadlock in the floor rules that had no escape at all (§2.2),
acceptance criteria 3 and 7 (§9), the meter marks (§10 step 2), and the claim
that the styles would not change in steps 1-3 (the Waves gain had to follow the
ceiling). Each correction says what the measurement was.

**And §11 adds four more, this time found by the user rather than by a probe** —
including two claims that had been written down and believed elsewhere in the
repo, and one place where this document's own onset fix was correct about frame
rate and wrong about repeated sounds.

**Trigger:** one of `CLAUDE.md`'s three, plus the lifecycle rule. It **changes
what is stored per student** — two new keys, one key retired, one key's meaning
redefined. It does **not** touch `framework.js` or `framework.css`, does **not**
change how a pointer becomes a note, and does **not** change the geometry of the
play surface. §4.1 is the reason the framework stays out of it: the one part of
this that looked like it needed a framework change was the noise floor, and the
right answer turned out to be not to store it at all.

Raised by the user on **2026-09-03**: *"could we look at how voice visuals
analyses sound and see if we can improve the way it analyses and reacts to
sound."* The review that came back is §1; this document is what to do about it.

Everything in §1 was measured by lifting the shipped functions out of
`voice_visuals.html` unchanged and running them over synthetic signals at
48 kHz and 44.1 kHz — glottal pulse trains through formant resonators, shaped
noise for fricatives, additive noise at stated signal-to-noise ratios. **None of
it was measured through a real microphone**, and §8 says what that costs.

---

## 1. What is wrong

Nine findings, ordered by what they cost a student in the room. The line numbers
are `voice_visuals.html` as it stands today.

| | what | where | measured |
|---|---|---|---|
| **F1** | Pitch is a raw autocorrelation with no octave check. Noise picks the winner, and the search stops at 600 Hz | `detectPitch`, 175–183 | wrong by >50 cents in **5 of 14** cases, MPM 0 of 14. Every failure is an octave or two **low**. A 200 Hz voice at 12 dB SNR reads **100 Hz**; a child at 700 Hz reads **100 Hz** |
| **F2** | Loudness is linear in amplitude with a fixed multiplier | `rawLevel`, 98–105 | **exactly 26.0 dB** of usable range in every sensitivity. Talking pins at **−25.1 dBFS**; a firm voice and a shout draw the same picture |
| **F3** | `onset()` compares two **frames**, not a rate | `onset`, 207–211 | the level needed to fire a burst is **0.29 at 24 fps, 0.50 at 60, 0.77 at 120, 0.99 at 165**. Same student, same sound, different room PC |
| **F4** | The detector reaches 600 Hz; the colour map spans 80–800 Hz | 180 vs 182 | **the top 12.5% of every palette is unreachable.** Integer lags also quantise the reading to 22 cents at 600 Hz |
| **F5** | An unvoiced sound writes no colour, so the colour freezes on the last vowel | 181 | "shhh" 0.11, "ffff" 0.15, breathy "hhh" 0.17 — all below the 0.30 gate. The confidence number is computed and thrown away |
| **F6** | `GATE` is a fixed number applied *after* the multiplier; no calibration, no high-pass, no hysteresis | 77, 123, 162 | Whisper opens at **−61.6 dBFS**, below the noise floor of a room PC with a fan and a projector |
| **F7** | 56 log-spaced bands read from a 2048-point FFT | `updateBands`, 191–205 | bands are genuinely distinct only above **295 Hz** — index 15.5 of 56. A 110 Hz voice puts energy into **all 16** bars below 300 Hz |
| **F8** | Timbre is not extracted at all | — | five vowels at one pitch are the same picture. Centroid separates voiced from unvoiced by >2 octaves; among vowels it separates open from closed but **/i/ collapses onto /u/** |
| **F9** | Four things that are right and must survive this phase | — | listen-only; `echoCancellation`/`noiseSuppression`/`autoGainControl` all off; 50 ms attack / 350 ms release; Ripples' one-sound-one-ring |

**F9 is a finding, not a footnote.** Three of the four are load-bearing:
automatic gain control would destroy the loudness→size mapping the whole app
rests on; the listen-only chain is what makes feedback howl impossible by
construction; and Ripples was fixed on 2026-08-31 to draw a ring from a
transient rather than a clock, which §2.4 must not undo.

---

## 2. What the analysis block becomes

Everything below lives in one region of one file — `rawLevel` (98),
`enableMic` (106), `analyse` (160), `detectPitch` (175), `updateBands` (191),
`onset` (207) — plus two call sites outside it: the 10 Hz poll's gate test
(123) and the waveform gain in `drawWaves` (444).

The **nine draw functions do not change in steps 1–3** — with one exception this
document missed. `drawWaves` scaled its trace by the old sensitivity multiplier,
so it had to be re-derived from the ceiling or the waveform and the size of
everything else would stop agreeing about what "loud" means. Everything else
keeps reading `level`, `pitch01`, `bands[]` and `onset()` exactly as before. That
is the whole reason this is tractable: the contract between analysis and drawing
is four names wide, and it stays four names wide.

### 2.0 The graph

```
getUserMedia ──► MediaStreamSource ──► BiquadFilter (highpass 80 Hz, Q 0.707)
                                            │
                                            ├──► analyserTime  (fftSize 2048)   → level, pitch, Waves
                                            └──► analyserFreq  (fftSize 8192)   → bands[], brightness

                       nothing is connected to audioCtx.destination. Ever.
```

Two nodes added: one filter, one analyser. **The listen-only invariant is
unchanged and must be re-checked by eye on the branch** — an `AnalyserNode` is
a pass-through, so a stray `.connect(ac.destination)` anywhere in this chain
would produce exactly the feedback howl the app exists without.

The high-pass has a visible side effect worth stating: **Waves now draws the
filtered signal.** That is an improvement — the trace stops wandering off centre
on room rumble and desk knocks — but it is a change to what one style shows, and
it belongs in the UAT.

### 2.1 Level: decibels, a measured floor, a fixed ceiling

```js
const rms   = Math.sqrt(sumSq / n);
const dbfs  = 20 * Math.log10(rms + 1e-9);
const floor = micFloorDb + 6;                       // §2.2
const ceil  = Math.min(floor + rangeDb, -6);        // never asks for more than full scale
const u     = clamp((dbfs - floor) / Math.max(6, ceil - floor), 0, 1);
target      = Math.pow(u, 0.6);
```

`rangeDb` is the sensitivity chip plus the trim: **Whisper 18 dB · Talking
28 dB · Singing 40 dB**, plus `micTrim` (−10…+10), clamped to 12…54.

**Why linear-in-decibels.** Decibels are the axis on which a person's sense of
"louder" is roughly even, and it is the axis every meter a therapist has ever
seen uses. The shipped mapping is linear in *amplitude*, which is why its first
10 dB are almost flat and its last 10 dB do not exist.

**Why the 0.6 exponent, stated honestly.** It is not a psychoacoustic law, it is
a deliberate bias: it lifts the quiet end of the range, because the app's
purpose is to make a small sound produce a large reward. At Talking, a sound
5 dB above the floor draws 0.27 of the screen instead of 0.12. The number is a
starting point and a candidate for a tweak slider later; it is **not** exposed in
this phase.

**Why the ceiling is clamped to −6 dBFS.** In a noisy room the floor rises, and
`floor + rangeDb` can ask for a level louder than the converter can represent. It
is clamped, the available range genuinely shrinks, and §5 says what the therapist
is told when it does.

The three sensitivity chips now mean **how wide a range of loudness fills the
screen** rather than how much the signal is multiplied. That is the question a
therapist is actually asking, and the labels already say it.

### 2.2 The floor is measured, adapts, and is never stored

This is the part that had to be got right, and the argument is `PHASE-7`'s
argument applied to a different quantity.

A noise floor is a fact about **the room and the microphone on this machine
today** — the fan, the projector, whether a window is open. It is not a fact
about a student. Storing it makes it inheritable; inheriting a floor measured on
a quieter day sets it *too low* and the visuals run on room noise, and
inheriting one measured on a noisier day sets it *too high* and a quiet
vocalizer gets nothing. The second failure is silent, and it lands on exactly
the student who cannot report it.

**So it is never stored.** It is a runtime variable with cardinality **one per
microphone session**, and it is re-derived every time the microphone is turned
on. That decision removes three problems at once: no new persisted key, no
addition to `LAUNCH_KEEP`, and no need to add a second exclusion beside
`delete snap.uiScale` in `buildPresetsPanel` — which would have been a
`framework.js` change and a fourth trigger.

**How it is derived.**

- **Seed.** One second at mic-on, sampled by the existing 10 Hz poll, taking the
  **minimum** of the ten samples — not the mean. The minimum is what survives a
  student who is already vocalising when the therapist presses the button, which
  is the common case, not the rare one. The gate stays shut for that second and
  the gate overlay says *"Listening to the room…"*.
    **Say the condition out loud.** Tapping this while someone is talking sets the
  floor to the talking, and the app is then deaf until the room goes quiet —
  which it recovers from on its own, but only once it does. Measured: re-seeding
  under a continuous 220 Hz tone moved the floor from −53 to −20 dBFS, exactly as
  designed. The panel therefore carries the condition as a hint rather than
  leaving a therapist to discover it.

**Corrected after measurement, twice.** The first cut counted *frames*, which
  spent the entire seed inside the first 170 ms — before the microphone had
  produced any audio at all — and set the floor to the −75 clamp in a room
  measured at −45. Driving it from the poll fixed that and left a smaller error:
  while the stream is starting, the analyser's 2048-sample buffer is only partly
  filled and the rest is zeros, so it reads several decibels low, and a seed that
  takes a **minimum** is precisely the statistic that keeps the worst of them.
  Measured: a −45 dB room seeded at **−52.8**. The first 300 ms are now discarded
  outright, and samples under −100 dB (a device that has not started) never count.
  With both fixes the same room seeds at **−46.2**.
- **Track.** The poll keeps a rolling minimum over the last 3 s. The floor
  follows that minimum **down immediately** and **up at no more than 1 dB per
  second**, and it may only rise while the gate has been **closed for at least
  1 s**.
- **Clamp.** `micFloorDb` is clamped to **[−75, −25] dBFS** on every write. The
  low end stops a digitally silent input (a muted or disconnected device) from
  producing a floor so low that dither opens the gate. The high end is the point
  at which the room is too noisy to work in, and §5 says what happens there.
- **Re-seed on demand.** A **🎧 Listen to the room** button in
  `Setup → Access` re-runs the one-second seed.

**The direction guarantee, stated as a rule:** the floor can never rise while a
student is making sound, and it falls the instant the room gets quieter. The
worst case is a student who vocalises continuously from before the mic is turned
on — their floor is set high until their first quiet moment, and then it drops
immediately. **The floor may only fail in the direction that corrects itself.**

**And that rule, alone, deadlocks. This document did not see it; the probe did.**
The guarantee protects against a floor that is too *high*. A floor that is too
*low* holds the gate permanently open — and the rise rule requires the gate to be
shut. Seed at −75 in a −45 dB room and the gate never closes again, so the floor
can never rise, and every sound reads as full for the rest of the session. The
seeding fixes above make that seed unlikely; they do not make it impossible, and
"unlikely" is not a guarantee.

**The escape:** if the gate has been open continuously for **20 seconds**, re-seed
the floor. Twenty seconds of unbroken sound is not a vocalisation, it is a wrong
floor. A student who genuinely does sustain for twenty seconds gets one re-seed
that lands on their own quietest moment — recoverable, visible on the meter, and
rare. This is the second time in this project that a rule which was right about
one direction was silent about the other; the first was the reach area.

**No automatic gain control on the ceiling. Ever.** The floor may move; the
range above it may not move on its own. If the ceiling adapted, "louder" would
stop reliably meaning "bigger", and the cause-and-effect loop *is* the therapy.
This is a non-negotiable, and it is the reason `autoGainControl:false` is in the
constraints in the first place.

### 2.3 Pitch: MPM, interpolation, a median, and a map that cannot drift

Replace the raw autocorrelation with the **normalised square difference
function** and McLeod's key-maximum rule.

```
NSDF(lag) = 2·Σ x[i]·x[i+lag] / Σ (x[i]² + x[i+lag]²)      i = 0…W-1
```

- **Window** W = 1024, lags 37…800 (60–1300 Hz at 48 kHz), reading to index
  1824 of the existing 2048-sample buffer. No buffer change.
- **Peak choice:** key maxima between a positively-sloped and a negatively-sloped
  zero crossing; take the **first** peak at or above 0.85 × the global maximum.
  That rule is what refuses the sub-octave peak the shipped code walks into.
  **The scan must start at lag 1, not at the shortest allowed lag** — a detail
  that is worth a whole bullet because getting it wrong reproduces the bug being
  fixed. The peak search skips the lag-0 lobe by walking past the initial
  positive run; start the scan inside the first period's lobe and that skip eats
  the true peak instead. Measured: **1150 Hz read as 575 Hz, an exact octave
  down**, with the band limit applied to the scan. Applying the band limit to the
  *candidates* after the scan gives 1149 Hz.
- **Parabolic interpolation** of the chosen peak. This is what removes F4's
  22-cents-per-step at the top of the range.
- **Median of the last 5 readings**, in the log-frequency domain, before the
  existing 0.15 s smoothing. A median removes a one-frame octave flip outright;
  a low-pass only smears it across a third of the palette.
- **Confidence** is the chosen peak's NSDF value, a genuine 0…1 number. It
  becomes an output — see §2.6.

**Octave continuity is deliberately not in the first cut.** The median should be
enough; adding a "prefer the candidate nearest the running value" rule before
measuring whether it is needed is how a mechanism nobody can justify ends up in
the file. If the branch's probe shows octave flips surviving the median, it goes
in then, with the measurement that justified it.

**The map is derived from the range, so F4 cannot recur:**

```js
const [fLo, fHi] = VOICE_RANGE[SETTINGS.voiceRange];
pitch01 = clamp(Math.log2(f/fLo) / Math.log2(fHi/fLo), 0, 1);
```

| `voiceRange` | span | for |
|---|---|---|
| `wide` *(default)* | 80 – 1200 Hz | everyone; today's map with the ceiling raised to meet the detector |
| `adult` | 70 – 400 Hz | an adult voice filling the whole palette |
| `child` | 180 – 1000 Hz | a child's voice filling the whole palette |
| `auto` | tracked | 10th/90th percentile of this session's voiced readings, minimum span 1.5 octaves, moved slowly |

The detector always searches 60–1300 Hz, which contains every row, so the map is
a subset of what can be detected by construction rather than by two constants
agreeing.

**`auto` has a cost and the panel must say so.** It trades reproducibility for
reach: the same note gives a different colour in a different session. For a
student learning that high means violet, that is a real loss, which is why the
default is `wide` and not `auto`.

### 2.4 Onset: a rate now, spectral flux later

**Step 1 changes one line and nothing else:**

```js
const hit = lvlRate > 10 && lvlTarget > 0.16 && t - lastBurst > 0.3;
```

where `lvlRate = (target - level) / tau` — the gap the envelope is chasing over
its own time constant. **There is no `dt` in it at all**, which is what makes the
threshold identical at every frame rate rather than merely less variable.

**`K = 6` was wrong and this is the corrected number.** The naive conversion —
0.10 per frame ÷ 1/60 s = 6 per second — ignores that the old difference was a
*smoothed step*, not the gap, and the two differ by the smoothing factor. Worked
through against the measurement instead: the old test needed level **0.495** to
fire at 60 fps, and `K = 10` puts the threshold at **0.50 at every frame rate**.
So on the machine the current behaviour was tuned on nothing changes — including
Ripples, whose `Wave rate` slider the user tuned against it on 2026-08-31 — and
every other frame rate stops being a different app.

Testing `lvlTarget` rather than `level` for the 0.16 floor is part of the same
point: `level` is dt-dependent by construction, so leaving it in would have left
a 1.1× spread across frame rates instead of removing it.

**Spectral flux is a separate step and a separate UAT.** Summing positive
frame-to-frame change across the bands would fire on a plosive landing on top of
a sound already playing, which a level jump cannot see — and unvoiced bursts are
a large share of what a non-verbal student produces. But it changes *which*
sounds make a ring, and that is a judgement only the user watching the pond can
make. It does not get smuggled in beside a fix that is provably neutral.

### 2.5 Spectrum: a second analyser, an average, and explicit decibels

- **`analyserFreq.fftSize = 8192`** — 5.9 Hz bins at 48 kHz, which resolve the
  log-spaced bands down to about 75 Hz and put F7's smear below the bottom of
  the range. `analyserTime` stays at 2048 for the time-domain buffer that pitch
  and Waves need.
- **`smoothingTimeConstant = 0`.** It is 0.8 by default, and `updateBands`
  already applies its own 0.03 s attack / 0.22 s release. Two smoothers in
  series is why the mandala lags the voice.
- **Average the bins in a band, not the maximum.** A max lets one loud bin claim
  every band whose range touches it, which is half of what F7 measures.
- **Set `minDecibels` / `maxDecibels` explicitly.** The defaults are −100/−30,
  and −30 dB **per bin** is reached easily by a voice, which pins the whole ring.
  **−90 / −25 is a starting point, not a measurement.** Per-bin levels are not
  the RMS level and cannot be derived from `micFloorDb`; these two numbers must be
  set from a measurement on the real page with a real voice, and the branch is not
  done until that measurement exists.

### 2.6 Two new signals

Both are runtime only. Neither is stored.

- **`voiced` (0…1)** — the NSDF confidence from §2.3. High is a clear sung tone;
  low is breath, hiss or noise.
- **`bright` (0…1)** — the ratio of energy above 2 kHz to total energy, taken
  from `analyserFreq`. Chosen over the spectral centroid because it is five
  lines, behaves better on quiet input, and makes the same distinction the
  centroid actually earns.

**What `bright` is not.** The measurement behind F8 is honest about its limit:
centroid (and this ratio) separates **voiced from unvoiced by more than two
octaves**, and separates open vowels from closed ones, but /i/ collapses onto
/u/. It is a brightness axis. It is not vowel identification, it must not be
described as vowel identification in the panel, and anything built on it must
survive being wrong about which vowel is being sung.

**The voiced thresholds are proposed, not measured.** The 0.11–0.22 figures in
F5 are the *shipped* confidence metric, which is a different number from NSDF.
The cut points for voiced / weakly voiced / unvoiced have to be measured on the
branch before any style is wired to them.

---

## 3. What the styles get, and what does not change

**Steps 1–3 change no draw code.** Nine styles carry on reading four names.

Step 4 wires the two new signals into **Mandala and Lava first**, not all nine:

- **`voiced`** → definition. A clear tone draws crisp, saturated, sharp-edged
  marks; breath and hiss draw soft, desaturated, diffuse ones. This gives an
  unvoiced sound a look of its own instead of the frozen hue F5 describes.
- **`bright`** → a property that is not already taken: the spikiness of the
  mandala bars, the sharpness of a blob's rim.

**Loudness stays on size and pitch stays on colour.** Those two mappings are
learned by the student, and a student who has learned them is the entire point.
Nothing in this phase moves them.

---

## 4. Cardinality and storage

`SETTINGS` is keyed `settings:voice_visuals.html`, so every row below is **one
per app file**. A preset snapshot is `Object.assign({},SETTINGS)` minus `locked`
and `uiScale`; a launch link is `settingsDiff()`, which drops `LAUNCH_KEEP` and
which `encodeSettings()` refuses to write objects into.

| key | type, values | belongs to | survives a page load | rides in a preset | rides in a link |
|---|---|---|---|---|---|
| `sensitivity` | `whisper` \| `talk` \| `sing` — **same key, new meaning** (§2.1) | the **student** | yes | yes | yes |
| `micTrim` | number, −10…+10 dB, default `0` — **new** | the **student** | yes | yes | yes |
| `voiceRange` | `wide` \| `adult` \| `child` \| `auto`, default `wide` — **new** | the **student** | yes | yes | yes |
| `boost` | **retired** (§4.2). Stays in `Anim.defaults` as `1`, read by nothing | — | yes, inert | yes, inert | never — it can never differ from its default |
| `micFloorDb` | number, dBFS | the **room, today** | **no — never stored** (§2.2) | no | no |
| `voiced`, `bright`, `f0Hz` | numbers | the current frame | no | no | no |
| `tw[mode][param]` | existing nested object | the **student** | yes | yes | **no** — an object, dropped by `encodeSettings()` |

That last row is existing behaviour, not a change, and it is worth writing down
because it is invisible: **the per-style fine-tune sliders have never ridden in
a launch link.** A therapist who tunes Mandala's Reach and then copies a launch
link does not get the reach. They get it from a preset. If step 4 adds tweak
parameters for the new signals, they inherit that same limitation.

### 4.1 Why the noise floor is not stored

§2.2 has the argument. The consequence for this document is that **this phase
adds two keys, not three**, and touches no framework code. The version of this
design that stored the floor needed `micFloorDb` in `LAUNCH_KEEP` (so a link
made on one machine could not set another machine's floor) *and* a second
exclusion in the preset snapshot beside `uiScale` (so loading a student's preset
could not carry a different room's floor). That is two framework changes and a
new class of key — "belongs to the display" — for a quantity that can be
measured in one second. Measuring it is cheaper and cannot be inherited.

### 4.2 `boost` is retired rather than redefined

`boost` multiplied the signal before the multiplier. Under §2.1 the floor and
the ceiling are absolute decibel values, so a multiplier is a pure shift of both
— it has no honest meaning left. Two ways out:

- **Keep the key and give it a new meaning.** Every existing preset then carries
  a number that means something it did not mean when it was saved, and the
  student's setup is silently wrong. This is the failure class this project
  keeps finding.
- **Retire it.** An old preset lands on the new default. The therapist sees a
  setting they have to redo once, which is visible, and they redo it in ten
  seconds.

**Retired.** `micTrim` replaces it as a ±dB trim, defaulting to 0 — which is
"unchanged", so an untouched install and an old preset land in the same place.

**But the key stays in `Anim.defaults` as `1`, and that is not tidiness.**
`applySettingsParam()` counts a key it has never heard of as junk and the boot
toast says *"⚠ Launch link: 1 setting not understood"*. Deleting `boost` from the
defaults would therefore make **every launch link written before this phase**
raise a warning about a setting that is merely obsolete — telling a therapist
their launcher is broken when it is not. Left in the defaults, an old link is
accepted in silence and the value is ignored. It also can never appear in a *new*
link, because `settingsDiff()` only writes what differs from the default and
nothing can change it.

---

## 5. Lifecycle

- **Added.** `micTrim: 0` and `voiceRange: 'wide'` go in `Anim.defaults`. An
  existing saved blob has neither; `baseDefaults()` supplies them on load, so
  every install upgrades silently and nothing migrates. `wide` is 80–1200 Hz,
  which is today's map with the ceiling raised to meet the detector — the
  closest thing to "no change" that also fixes F4.
- **A new session.** Both keys persist, exactly like every other per-student
  setting in this app. The floor does not: it is measured at mic-on, every time.
- **Changed.** `sensitivity` and `micTrim` both act on `rangeDb` and are clamped
  together to 12…54 dB, so no combination of the two can produce a range too
  narrow to play or wider than the converter has.
- **Replaced.** Loading a preset overwrites both keys. A preset saved *before*
  this phase carries neither, and because `applyPreset` rebuilds `SETTINGS` from
  the defaults rather than merging into the live one, **an old preset resets both
  to the defaults** — it does not leave the last student's values in place. That
  is checked in `framework.js:2210`, not assumed, and it is the safer of the two
  behaviours.
- **Removed.** There is no "off" for either. `voiceRange: 'wide'` and
  `micTrim: 0` *are* off, and both are one chip away.
- **Two in conflict.** Two students in one session is two presets, and the second
  load wins, as it already does for every other setting.
- **The next person to use this machine inherits it.** This is the row Phase 7
  did not have, and here it lands the other way. Both keys **are** inherited, and
  that is accepted rather than prevented, because the cost is bounded and
  visible: a stale `voiceRange: 'child'` leaves an adult's colour pinned at the
  bottom of the palette; a stale `micTrim: −10` makes everything pin at full.
  Both are **visible on screen and on the meter**, both are one control away, and
  neither can leave a student unable to use the app — which is the line Phase 7
  drew and the reason the reach area *is* prevented. The floor, which could have
  left a student unheard, is not stored at all (§2.2). **What is inheritable here
  is only what a therapist can see is wrong.**
- **The microphone changes.** A different device has a different floor. The
  floor is re-seeded at mic-on and tracks continuously, so plugging in a headset
  mid-session is corrected within seconds without anyone doing anything. The
  existing `track.onended` path already handles a device disappearing.
- **The room changes.** Someone turns on a projector, or opens a window. The
  rolling minimum follows it: down instantly, up at 1 dB/s and only while the
  gate is shut.
- **The display changes.** Nothing here is in pixels or frames. F3's fix is the
  reason: after it, refresh rate is not an input to anything.
- **An old launch link.** A link written before this phase may carry
  `boost:2.5`. It is accepted in silence and read by nothing — which is why the
  key stays in `Anim.defaults` rather than being deleted (§4.2). A link carrying
  `sensitivity:whisper` still means "the most
  sensitive of the three", which is still true — that is the argument for keeping
  the key rather than renaming it.

---

## 6. The floor: no fail states

`CLAUDE.md` requires every app to work offline, with no controller, no network
and no optional input present. The microphone is optional input, and it has more
ways to be absent than a gamepad does.

| situation | what happens |
|---|---|
| microphone never turned on | every style keeps its calm baseline, exactly as today. `level` is 0, `pitch01` holds its default. Unchanged behaviour |
| no microphone hardware at all | `getUserMedia` rejects → `micState='denied'` → the gate overlay explains and offers a retry. Unchanged behaviour |
| permission refused | as above. Unchanged behaviour |
| unplugged mid-session | `track.onended` → `micState='error'`, gate overlay reappears. Unchanged behaviour |
| **digitally silent input** (muted device, disconnected line-in) | the seed measures near −∞; `micFloorDb` clamps to **−75 dBFS**, the gate stays shut, and nothing responds. It does **not** amplify dither into a flickering screen |
| **a room too noisy to work in** (floor above −25 dBFS) | the floor clamps at −25, the ceiling clamps at −6, and the usable range collapses to 19 dB or less. The Voice section shows *"This room is noisy — only N dB of range available"* when the available range is under 15 dB, with the floor marked on the meter so the therapist can see what is being heard |
| the student vocalises through the whole seed second | the floor is set too high until their first quiet moment, then drops immediately (§2.2). The failure is in the self-correcting direction, by construction |
| a sound that pins the level | `level` saturates at 1 as it does today. Nothing clips audibly, because nothing is played |

---

## 7. What is deliberately not in this phase

- **No vowel identification.** F8's measurement says a brightness axis is what
  this earns, and that is what §2.6 builds. Formant tracking is a different
  project.
- **No automatic gain control, on the ceiling or anywhere.** §2.2.
- **No spectral-flux onset.** §2.4 — it changes which sounds fire, and it is
  separated from the fix that provably does not.
- **No microphone device picker.** A room PC can have a webcam mic and a headset,
  and `enumerateDevices` would let a therapist choose. It is a real gap, it is
  small, and it is not this. Noted for `IMPROVEMENT-PLAN.md`.
- **No new visual styles**, and no change to the nine that exist beyond step 4's
  two.
- **No recording.** Nothing is captured, buffered to disk, or stored. The
  analysers hold a moving window and nothing else, which is what it has always
  done and what the Voice tab tells the therapist.
- **No `framework.js` or `framework.css` change.** If one becomes necessary, this
  document is wrong somewhere and gets revised before any code is written.

---

## 8. How this gets verified, and what cannot be

`CLAUDE.md`'s gates apply: 27 pages loading clean, and **clicking every chip on
the app's own pane and playing into each** — the gate that caught Big Chords'
`rise is not defined`. This phase makes the second one possible for the first
time, because the microphone can be faked.

**Fake audio in the headless browser.** Edge and Chromium accept
`--use-fake-device-for-media-stream` together with
`--use-file-for-fake-audio-capture=<path>.wav` (16-bit PCM). Generating the test
signals is a node script the probe scripts for §1 already contain:

| file | asserts |
|---|---|
| `silence.wav` | floor seeds to the clamp, gate stays shut, `level` stays 0 |
| `noise-45.wav`, `noise-35.wav` | floor lands within 2 dB of the true level; the noisy-room warning appears at the right point |
| `tone-110/220/350/700/900.wav` | `f0Hz` within 25 cents; `pitch01` spans the whole 0…1 range across the set at `voiceRange:wide` — **this is the F1 and F4 gate** |
| `tone-220-noisy.wav` (12 dB SNR) | no octave error — the case the shipped detector fails |
| `shhh.wav` | `voiced` low, `bright` high, colour moves rather than freezing — the F5 gate |
| `ramp.wav` (−55 → −10 dBFS) | `level` rises monotonically across the whole ramp and does not pin before the ceiling — the F2 gate |
| `claps.wav` (7 claps, 1.5 s apart) | exactly 7 rings in Ripples, as the 2026-08-31 fix established |

`Anim._dbg()` gains `floorDb`, `rangeDb`, `f0Hz`, `conf` and `bright` so the
probe can read them; it already exposes `level`, `pitch`, `meter` and the
per-style counters.

**What cannot be verified here, stated plainly:**

- **A real microphone in a real room.** Synthetic voices are cleaner than a
  room, so F1's 5-in-14 failure rate is a floor and not a ceiling, and the
  floor-tracking rules in §2.2 are argued rather than observed.
- **F3's frame-rate fix.** The harness cannot make a headless page render at
  144 Hz. The fix is verifiable by arithmetic and by driving `frame()` with
  synthetic `dt` values; it is **not** verifiable end-to-end here, and the UAT
  step for it is "does it still behave the same on your machine", which only
  proves the neutral half.
- **`minDecibels`/`maxDecibels`.** §2.5 — the two numbers are a starting point
  and need a measurement on the real page.
- **The NSDF voicing thresholds.** §2.6.
- **Whether any of it *looks* right.** Only the real page in the real room can
  say, and that is the user's UAT, not mine.

**And the standing warning.** Six of ten probes in Phase 9d returned confident,
wrong answers, and two passed while measuring the wrong object. Every assertion
above should be made to **fail on today's code first**. A probe for F2 that
passes against the shipped linear mapping is measuring something else.

**It happened again, seven times, and the scripts are in `probes/phase-11/`.**
Its README lists each one: a run that outlived its WAV and read Chromium's own
fallback beep as a loud tone; a span read from level crossings on a ramp moving
faster than the sampling grid; an attack transient mistaken for a mapping error;
and the F7 metric above, which penalised the fix; a stale  selector that
reported five on-screen controls missing; and two panel assertions that expected
the opposite of the design; and an ink metric applied to Lava, whose own
run-to-run noise is 30.3%. Every one produced a confident number first. **The
probe was wrong before the code was, seven times out of seven, and the code was
not wrong once.**

**Made to fail on the old code, and it does:** 16 of 22 assertions fail against
the pre-phase file, including `pitch01` reading **0.097** for a 700 Hz child's
squeal — the octave error, visible as a colour.

---

## 9. Acceptance

1. `pitch01` reaches both 0.0 and 1.0 across the tone set at `voiceRange:wide`;
   the top of every palette appears on screen. **(F4)**
2. No octave error on `tone-220-noisy.wav`, and none on any tone from 80 to
   1200 Hz. **(F1)**
3. **Corrected.** "At least 35 dB of range" was written against §2.1's worked
   example and contradicts the sensitivity ranges three paragraphs above it —
   Talking is 28 dB by design, and a 35 dB floor would fail a correct build. The
   real claim F2 makes is that **the three chips now choose three different
   spans**, where the old mapping gave exactly 26.0 dB whichever was picked. So:
   across one ramp, the reported floor-to-ceiling span is 18 / 28 / 40 dB to
   within 1 dB, `level` follows `u^0.6` between them to within 0.03, and it never
   steps backwards. **(F2)**
4. The onset threshold is the same level at `dt = 1/30` and `dt = 1/144` —
   exactly, since `lvlRate` contains no `dt`. **(F3)**
5. `shhh.wav` moves the colour and lowers `voiced`; the hue does not hold the
   previous vowel's value. **(F5)**
6. With `silence.wav` the gate never opens; with `noise-45.wav` the floor lands
   within 2 dB and the gate does not chatter across 60 s. **(F6)**
7. **Corrected.** "Adjacent bands read different values" is not a measurement of
   resolution: resolved bands show real *gaps* between a voice's harmonics, and
   two adjacent zeros are two adjacent equal numbers, so the metric punishes the
   fix. The measurement is **contrast** — on a 110 Hz voice, the quietest of the
   bottom 16 bars over the loudest is under 0.15, where the old code measured
   **0.45** because a smear cannot go near zero. **(F7)**
8. Seven claps still make exactly seven rings in Ripples. **(F9)**
9. Nothing in the graph reaches `audioCtx.destination`. **(F9)**
10. All 27 pages load clean, and every one of the nine style chips is clicked and
    played into with fake audio.
11. The user's UAT passes. Nothing merges to `main` before that.

---

## 10. The order I recommend

Four commits on `phase-11-listening`, each one testable on its own.

1. **The analysis block.** ✅ **Built 2026-09-03.** High-pass, second analyser,
   dB-domain level with the measured floor, MPM pitch with interpolation and
   median, the derived colour map, and `onset()` as a rate. F1–F4, F6, F7, plus
   `voiced` and `bright` computed and exposed (which pulls step 3's measurement
   forward — the thresholds are now known, and no style uses them yet). No draw
   code touched beyond the Waves gain, which had to follow the ceiling. Probe:
   22/22, and 16/22 fail on the old file. Gates: 27/27 pages clean, and all nine
   styles played into with a 220 Hz signal and dragged through with a pointer.
2. **The Voice section.** ✅ **Built 2026-09-03.** `Setup → Access` gains a live
   readout, the noisy-room warning, **🎧 Listen to the room**, the `micTrim`
   slider replacing Extra boost, and the `voiceRange` chips. `voiceRange` goes
   here rather than on Visuals because it is a fact about the student's voice,
   and `CLAUDE.md` puts per-student input settings in `Setup → Access` — the same
   reasoning that put Sensitivity there. The gate overlay also grows a
   **"Listening to the room…"** state, because a second of nothing happening
   reads as broken.

   **One thing was built differently from this document, and the document was
   wrong.** It asked for "a floor mark and a clip mark on the meter". A mark on
   that meter cannot mean anything: the bar shows `level`, which is *already
   normalised to the floor*, so **its own zero is the floor**. The therapist's
   real question — is this student getting through, and has this room enough room
   left — needs an absolute scale, so it is a readout in decibels:
   *"Hearing −26 dB · room floor −53 dB · range 28 dB"*, plus `TOO LOUD` above
   −1 dBFS.

   **What the probe corrected here, on top of that.** The noisy-room warning was
   first tested against a −45 dBFS room and "failed". It should have: a −45 dB
   room leaves **34 dB** of range, and warning about that would be crying wolf.
   The warning is for the ceiling clamp actually biting, which needs a room around
   −22 dBFS — measured, 13 dB left. And re-seeding *under* a continuous tone
   correctly measures the tone (floor −53 → −20 dBFS): that is §2.2's designed
   consequence, not a fault, and the panel now says out loud to tap it while the
   room is quiet.
3. **The new signals.** ✅ Folded into step 1 — `voiced` and `bright` are
   computed and exposed, and their thresholds are measured rather than proposed:
   a hiss reads confidence **0.16** and brightness **1.00**, a clear 220 Hz tone
   reads **1.00** and **0.55**. The trust gate sits at 0.50 between them. Still no
   visual change. **One honest caveat:** those brightness figures come from
   harmonic stacks with no vocal-tract rolloff, so both sit brighter than a real
   voice would. The *separation* is the measured claim; the absolute numbers are
   not, and step 4 must be tuned against a real voice, not against these.
4. **Wire them into Mandala and Lava.** ✅ **Built 2026-09-03.** F5's look and F8.
   Two styles, not nine.

   **Mandala.** A clear tone draws narrow, bright, sharply-defined spokes; breath
   and hiss draw wide, dim, diffuse ones. Brightness rides on the outer ring, so
   a hiss throws it toward the walls and a dark "oo" pulls it in.
   **Lava.** The wax rim: firm on a sung tone, soft and diffuse on breath.

   **The guarantee both are built around:** `defn` is 1 at confidence 0.7 and
   above, which is what any voiced sound gives, and every texture term is
   multiplied by it — so at `defn = 1` each one is ×1 and **the shipped
   arithmetic is what runs**. Measured: three identical Mandala runs give the
   same ink to **0.0%** with Voice texture on versus off. Only unvoiced sound is
   new. A per-style **Voice texture** slider takes it to 0 and pins `defn` to 1
   outright, so there is a way back to the old look.

   **`lavaBlob`'s `bright` parameter was renamed `lum`.** It meant wax luminance
   and now shadowed a module-level signal of the same name; two meanings under
   one name inside one function is a fault waiting to be written.

   **And the probe was wrong a seventh time.** Lava's blobs are seeded with
   `Math.random`, so four identical runs spread **30.3%** of total ink — the
   21% "difference" it first reported for Lava was inside its own noise. Mandala
   is bit-exact across runs at 0.0%, so the pixel test lives there, and Lava's
   guarantee is read where it actually lives: `defn` itself.

Docs in the same branch as the code, per `CLAUDE.md`: this file, `APPS.md` §5
(which still describes the old modes and says "autocorrelation, good enough for
voice" — it will not be), `IMPROVEMENT-PLAN.md`'s phase record, and
`UAT-PHASE-11.md`.

**Spectral flux, the device picker, and any tweak sliders for the new signals
are Phase 11b if they are wanted at all.**

---

## 11. UAT round 1 — what the user found

Run 2026-09-04. Seven reports. Two were one fault, one falsified a claim in
another phase's document, one contradicted `CLAUDE.md` and was right anyway, and
one was a redesign. In the order they hurt.

### 11.1 Two claps, one ring — and no repeat explosions

**One fault, reported twice**: "2 claps pretty close together, the second is not
picked up", and "repeated loud sounds don't trigger firework explosions".

§2.4 measured the transient off `level` — the envelope the *drawing* uses, which
releases over 350 ms because that is what looks right. A second sound arriving
during that release has only a small gap left to jump. The frame-rate fix was
correct and this sat underneath it the whole time; the old code had the same
shape and the same fault.

**Measured, replicating both versions over six claps 0.25 s apart at 60 fps:**

| | rings fired |
|---|---|
| commit `3ff2f36` | **1 of 6** |
| this branch | **6 of 6** |

Swept across gaps, the old code loses the second clap at **every spacing of
0.30 s or less**; the new one keeps both from 0.15 s up.

**The look keeps its slow release; the transient gets its own fast one.** A
second envelope — 5 ms attack, 80 ms release — used only by `onset()`. After
250 ms it is down to 4%, so a second clap is as big a jump as the first. Still a
rate with no `dt` in it, so F3 is untouched: the quietest single clap that fires
is **0.50 at 24, 30, 60, 120 and 165 fps**, which is where §2.4 put it.
`ONSET_K` is 100 to keep that calibration.

**Fixing `onset()` did not finish the job — Ripples has a gate of its own.** Measured in the
page after the envelope fix: six claps 0.25 s apart gave **six bursts in Fireworks and two
rings in Ripples**, because `rippleTimer` allowed one ring per 0.55 s whatever the sound did.
The slider was there to be turned up, but a person clapping twice on purpose should not have to
find a slider first. Default now **0.2 s**, with the range widened at the *slow* end — the end
`APPS.md` actually describes it for. **6 rings from six claps**, and F9's seven-claps-seven-rings
still holds.

**A second lesson in the same place:** an envelope fix and a per-style gate looked like one
fault from the room. Only driving the page separated them, and the arithmetic proof in
`onset.js` — which was right — could never have found the second half.

**`ONSET_HOLD` goes 0.3 s → 0.12 s**, and that is a second bug this uncovered:
`APPS.md` documents Ripples' `Wave rate` as reaching **0.22 s** at the top of its
slider — which a 0.3 s refractory underneath made unreachable. **The slider lied
at its own maximum.** The hold is now low enough that each style's own gate
governs.

### 11.2 The microphone hangs — and it is not the seed

Two things under one report, and measuring separated them.

- **The seed could stall for five seconds.** It counted *clock* ticks and, if
  none of the first ten carried signal, threw the second away and retried, up to
  five times — so a microphone that emits exact zeros while its capture pipeline
  spins up left the app dead. It now counts **ticks that carried audio**, so the
  clock does not start until the device does. Measured: **998 ms**.

- **`getUserMedia` is the bigger delay and it may never answer.** Three
  consecutive launches: resolved once at **4161 ms**, and **twice did not settle
  at all** in six seconds — neither resolving nor rejecting, so `.catch()` never
  ran.

  That is the never-settling promise `PHASE-9C-MIDI-CONNECT-WAIT.md` exists
  about, and **that document declared this file not affected** — "the microphone
  path uses `getUserMedia`, which rejects rather than hangs". Reasoned, not
  measured, in a document whose entire subject is a promise that does not settle.
  Corrected there. Voice Visuals now carries 9c's pattern: the wording
  **escalates and never concludes** — a pending promise looks identical whether a
  person is still reading the prompt or Windows has wedged, so a deadline must
  not declare a cause — and a second tap starts no second request but jumps to
  the ten-second text.

  | At | Says |
  |---|---|
  | 0 s | Choose **Allow** on the prompt at the top of the window. |
  | 10 s | Still waiting. If no prompt appeared, the microphone or Windows may be stuck: unplug it and plug it in again. If that does not help, restart the PC. |

  **Nothing here makes the device open faster.** It stops four seconds of silence
  reading as a broken app.

  **And a tap after ten seconds now starts a fresh attempt.** Reported from the
  room on 2026-09-04 with a screenshot of the escalated message: 9c's rule that a
  second press starts no second request is right *while a request may still be
  alive*, but after ten seconds it leaves reloading the page as the only way out
  of a state the app put the person in. A `micAttempt` counter makes abandoning
  safe — if the old promise ever resolves, its stream belongs to a superseded
  attempt and is stopped rather than wired up.

  **The wedge is real and it is not ours.** Measured on this machine the same
  day: `getUserMedia` called directly from the page resolved in **33 ms** and the
  app went live in under a second — after the stale browser processes were
  cleared. Before that, 36 consecutive launches opened it zero times. Nothing in
  the app changed between those two measurements.

### 11.3 The explosion glow, deleted rather than tuned

"Looks terrible and is maybe not needed", with a screenshot: a green banded disc
filling half the frame, fireworks barely visible through it.

A three-stop radial gradient stained behind each burst. On an 8-bit canvas a
gradient that wide quantises into concentric rings. **This project has been here
before** — Soundscape's `glow` was a radial "that could not be stopped banding"
and became a field of static. Here there is nothing to replace it with: the burst
is the event and the glow only sat on top. `CLAUDE.md` says delete the mechanism
rather than patch around it, so `glowPatches` is gone.

### 11.4 Fine trim reads backwards

Flagged at handover, and the user chose the rename. "+8 dB" reads like *more* and
does the opposite: a wider range means a student must be **louder** to fill the
screen.

Renamed **Range** — and, more to the point than the name, it now shows the
**result** rather than the offset, so the number under the slider is the number
the readout above it prints and there is no direction left to get wrong.

### 11.5 The microphone moves to the Sound tab

*"the settings on setup from microphone is on, down to voice range would work
better on the sound menu which is currently empty. There is too much on the setup
menu."*

**This contradicts `CLAUDE.md`, which puts per-student input settings in
`Setup → Access` — and the user is right anyway.** That rule exists so a
therapist finds things in the same place every time, and an empty Sound tab
holding one paragraph saying there is nothing to set, beside a Setup tab carrying
the whole microphone *on top of* the controller, dwell and reach-area rows,
defeats it more than the move does. **For an app whose only sound is the one
coming in, the microphone is the Sound tab.** `setupExtras` is now empty and the
pane is relabelled 🎤 Voice.

### 11.6 Starfield: a held sound had nothing to do

Reported boring, with two ideas — cross it with Fireworks, use the embers as
shooting stars. The diagnosis under both: a **sustained** note only brightened a
horizontal band, so a student holding a sound watched a still picture get
slightly lighter.

- **Rising sparks**, level-driven and continuous, drifting up from the floor of
  the sky. Slow and small — this is the calm style, not Fireworks. New slider.
- **A loud sound scatters sky that stays.** The Fireworks cross, done the way
  round that suits this style: the burst does not fall and burn out, it slows to
  a stop and about a third of it *becomes* stars. A shout leaves something
  behind, which is what the memory-star comment always claimed and one star per
  sound never showed.
- **Shooting stars: cap 3 → 6.** On a talkative student most sounds got none.

**A judgement, not a measurement.** Built to be looked at; if it is wrong, the
sliders and this section are where to start.

### 11.7 What this round cost

Six of seven were real. The seventh — the seed — was real but **not the cause of
what was reported**, and finding that out meant separating a 4.2 s device open
from a 1.0 s seed.

**Three of the six were faults in things this project had already written down
and believed:** `APPS.md` on `Wave rate` reaching 0.22 s, which a constant
elsewhere forbade; `PHASE-9C` on this file being unaffected by a never-settling
promise; and `CLAUDE.md`'s tab rule, right in general and wrong for this app.
None were found by reading. All three were found by a person tapping something
and it not doing what the document said.

**And the harness got worse.** The fake microphone stopped opening reliably
part-way through this round — the environmental audio-device stall already on
record here. `probes/phase-11/drive.js` retries a launch that never opens and
**reports how many retries it needed**, because a silent retry would hide a real
regression behind the flakiness. `probes/phase-11/onset.js` exists for the same
reason: 11.1 is pure arithmetic on an envelope, so it is proved directly rather
than held hostage to a device that may not open. **That does not replace driving
the page** — it proves the mechanism, and the page proves the wiring.

---

## 12. UAT round 3 — what the user found, and what the measurements said

Eleven reports, 2026-09-05. Four turned out to be faults, one was a fault
somewhere other than where it was reported, and six are judgements about how the
styles look. **Two of my own hypotheses were measured and found wrong before any
code was written**, which is the point of §8 and is recorded here rather than
quietly dropped.

### 12.1 "It says the room is noisy but it isn't"

**Real, and the message named the wrong cause.**

The warning fires on one condition, `availDb() < 15`, which needs a measured
floor above −27 dBFS. The first hypothesis was that the floor *drifts upward*
during a session: `trackFloor()` lets it climb 1 dB/s toward the minimum of the
last three seconds, and a live room might never leave a whole second at its true
floor. `probes/phase-11/floor.js` drove 40 s of clapping with a person's presence
under it and measured a drift of **0.1 dB**. The floor does not drift. Hypothesis
dead.

What the same sweep did show:

| room | measured floor | range | warning? |
|------|----------------|-------|----------|
| −58 dBFS | −53 | 28 dB | no |
| −50 | −45 | 28 | no |
| −42 | −37 | 28 | no |
| −34 | −29 | 23 | no |
| −28 | −23 | 17 | no |
| **−24** | **−19** | **13** | **yes** |
| **−20** | **−19** | **13** | **yes** |
| **−16** | **−19** | **13** | **yes** |

Three different rooms, one answer. That is `FLOOR_MAX = -25` clamping, and at
−16 dBFS the reported floor is **9 dB wrong** — the gate then sits open on the
room alone and the average level is 0.35 with nobody making a sound.

So the warning was not detecting a noisy room. It was detecting that **the input
clamped**, which happens when a microphone is turned up too far. And the advice
it gave — *move the microphone closer to the student* — makes a hot input worse.

**Two changes.** `FLOOR_MAX` goes to −15, so a hot input is measured truthfully
instead of being flattened into one number; the clamp was guarding against a
floor seeded during speech, which the downward tracking already handles in a
second. And the warning splits in two, because a floor above −30 dBFS is not a
room anybody would sit in, it is gain:

- floor above −30 → *the microphone is running hot*, with the Windows level as
  the thing to change;
- otherwise range under 15 → the old noisy-room advice, which is now only
  offered when it is true.

**The number that decides this is the user's, not mine.** The readout prints the
measured floor; what it says in that room is the measurement I cannot take from
here.

### 12.2 "Ripples works well for a few claps but then seems to not recognise"

**The listening is not at fault, and the first probe that said otherwise was
counting wrong.**

`claps.js` reported 27 rings from 40 claps 0.5 s apart, with the drops clustered
late — exactly the reported shape. It was wrong: it counted rises in the length
of the live `rings` array, and rings expire as new ones arrive, so an add and an
expiry inside the same 100 ms sample cancelled out. **A probe that reproduces the
report is the most dangerous kind of wrong answer**, and this one nearly bought a
rewrite of the listening path.

An actual onset counter in `_dbg()` says:

| signal | style | fps | onsets | of claps |
|--------|-------|-----|--------|----------|
| 40 claps 0.5 s apart | ripples | 61.9 | **40** | 40 |
| 40 claps 0.5 s apart | leds | 62.0 | **40** | 40 |
| 40 claps, hot room | ripples | 62.2 | 39 | 40 |
| 7 claps 1.5 s apart | ripples | 61.8 | 7 | 7 |
| 6 claps 0.25 s apart | ripples | 65.6 | 6 | 6 |

Every clap fires. An attempt to force the frame rate down with CDP's CPU throttle
**did not work** — 1x through 10x all held 70 fps — so the slow-room-PC case is
untested, and is not claimed here in either direction.

What *is* measured is §12.3, and it is part of the explanation: after ten seconds
of clapping, **90% of Ripples' screen is holding a permanent ghost** of every
ring ever drawn, so a new ring landed in a wash of old ones.

> **CORRECTED BY §12.8.** This section closed the report on a count of onsets,
> and an onset is not a ring — `drawRipples` gates it a second time, and at a
> `Wave rate` of 0.3 or below that gate discards every other clap. The user found
> it by noticing the centre glow pulsing when no ring appeared. **This section is
> left as written**, because the mistake in it is the point: counting an internal
> event proves the internal event, not the app.

### 12.3 The ghosting, and why no value of `fade` could ever have fixed it

**Real, on six of the nine styles, and now measured rather than argued.**

Every style painted `rgba(background, fade)` over the canvas each frame. On an
8-bit surface that is `dst = round(dst × (1 − fade))`, and a pixel stops moving
as soon as `dst × fade ≤ 0.5`. So the fade leaves a permanent residue of
`floor(0.5 / fade)`, and **no fade below 0.5 can ever reach zero** — while a fade
of 0.5 erases the trail it exists to draw. There was no number to pick.

Measured off Playwright screenshots (`ghost.js`) rather than `getImageData`,
because `canvas-fade-never-arrives` is on record in this project as a bug that
reading pixels back *hides*. Dim-but-not-black pixels, at rest and after ten
seconds of silence:

| style | fade | at rest | +10 s | +25 s |
|-------|------|---------|-------|-------|
| **ripples** | 0.30 | 6.96% | **90.49%** | 90.49% |
| leds | 0.40 | 10.24% | 20.49% | 20.48% |
| waves | 0.30 | 7.16% | 19.95% | 19.90% |
| flow | 0.045 | 6.58% | 11.50% | **17.40%** (still climbing) |
| fountain | 0.10 | 6.55% | 10.91% | 10.91% |
| mandala | 0.30 | 53.51% | 53.70% | 53.70% |
| **lava** | **1** | 7.64% | 7.13% | 7.14% |
| **pixels** | **1** | 88.21% | 88.16% | 88.19% |
| stars | 0.45 | 36.98% | 36.88% | 36.87% |

**The two styles that already cleared were the two that were clean.** That is the
measurement that decided the fix: the frame is now cleared, not faded, in every
style.

Seven of the nine redraw themselves from state each frame and needed nothing
else. The two whose trail *was* the residue now carry their own path:

- **Flow** — each particle keeps a flat `[x,y,…]` ribbon capped by the *Trail
  length* slider, stroked whole with a brighter head over the top. This is the
  style the user also asked to be bolder, and drawing the ribbon rather than
  accumulating it is what makes that possible.
- **Fireworks** — each trail particle keeps ten points and strokes them as a
  comet tail, with the newest segment brighter over the top.

**Third time this project has answered a compositing fault by deleting the
mechanism** rather than tuning it: Soundscape's radial glow, §11.3's firework
afterglow, and now the frame fade.

### 12.4 "Clicking explosions should be the same strength as the voice"

**Real, and it was every style, not just Fireworks.**

A tap was quietly worth less than a shout everywhere: Fireworks gave a tap 18
particles at 0.30 m against the voice's 80 at 0.72 m, Ripples 0.55 against 1.0,
Mandala 0.7, Lava 0.6, and Starfield a single star against a whole scatter. There
is no reason for it — the tap *is* the deliberate act, and it is the route in for
a student who cannot vocalise yet and for a therapist demonstrating what a sound
will do. Every one now uses the same expression the voice uses at level 1.

### 12.5 The straight line across Waves

**Real, and it bit far earlier than the code claimed.**

The trace ended in `Math.max(-1, Math.min(1, buf[i]*mul))`, a hard clamp, so it
pinned flat at `cy ± amp` — 0.20H from the top, exactly where the user's
screenshot shows it. The comment above it said the trace "fills its height at the
same loudness that pins `level`". It does not: `ceilDb` is an **RMS** ceiling but
`buf[i]` is an **instantaneous sample**, and a waveform's peak is its RMS times
its crest factor. Measured (`waves.js`) — these are the `level` values at which
the line goes flat:

| room floor | sine | voice | clap |
|------------|------|-------|------|
| −53 dB | 0.93 | 0.75 | 0.61 |
| −29 dB | 0.92 | 0.69 | 0.51 |
| −23 dB | 0.89 | 0.55 | **0.23** |

In a hot room a clap flat-topped at less than a quarter of full loudness.

A crest allowance of 2.6 puts the RMS ceiling and the sample on the same footing,
and `Math.tanh` replaces the clamp — linear where the clamp was linear,
asymptotic where the clamp was flat, so there is no flat top left to draw.

### 12.6 CLOSED — every judgement resolved, 2026-09-06

**Nothing on this list is open any more.** Where each one went:

| judgement | outcome |
|-----------|---------|
| Lava's jitter | a fault, as predicted here — §13.1, shipped `v1.16.0` |
| bigger explosions + a particle-size slider | §13.3, shipped `v1.17.0` |
| a stronger Mandala at full loudness | §13.4, shipped `v1.17.0` |
| a Starfield that moves *through* space | §13.6/13.7/13.9, shipped `v1.17.0` |
| LEDs against WLED's repertoire | §13.8 built and superseded by §13.10's wall, shipped `v1.17.0` |
| Waves travelling horizontally | **built and REJECTED** — §13.2, do not rebuild |
| a bolder Flow | **moot: the style was DELETED** mid-look — §13.5 |
| **whether the Fireworks *fall* is interesting** | **judged fine as it is — "fall speed is ok". NO CHANGE MADE.** |

**The fall is the only one that closed with no code at all**, and it is worth
recording as an outcome rather than leaving on a list: a judgement asked for and
answered *"it's fine"* is finished, and re-opening it later would be re-asking a
question the user has already settled. Seven of the eight cost code; this one
cost a sentence.

Reported and not yet addressed: bigger explosions and a particle-size slider;
whether the Fireworks fall is interesting; a stronger Mandala at full loudness;
Lava's jitter (its blob radius follows a 30 ms band attack, which is not how wax
moves); Waves travelling horizontally; a bolder Flow; LEDs against WLED's
repertoire; and a Starfield that moves *through* space. These are judgements
about how the styles look, and §11.6 is the precedent: they get built one at a
time and looked at, not handed over as a checklist of seven guesses.

### 12.7 What this round cost

Two hypotheses of mine died in the harness — the drifting floor, and the
frame-rate-dependent onset — and one probe reproduced the reported symptom while
measuring the wrong quantity. Set against that, the two faults nobody had
hypothesised at all (the floor clamp flattening three rooms into one number, and
the crest factor in Waves) were both found by measuring what the page actually
did rather than by reading what it said it did. That is the same lesson as §11.7
arriving from the other direction: **reading the code found the clamp; only
measuring found what the clamp was worth.**

### 12.8 "It misses the ring every second clap, but the centre pulses"

**Real, found by the user's own discriminator, and it is the `Wave rate` slider.**

§12.2 above says the listening is not at fault and cites "40 onsets from 40
claps". **That measurement was answering the wrong question.** `onsetN` counts
transients *detected*, and `drawRipples` gates the ring a second time:

```js
if(onset() && rippleTimer<=0){ rippleRing(...); rippleTimer=0.2/tw('rate'); }
```

so a detected transient can be discarded without a ring ever appearing. Counting
onsets could not see that. **The user's second clause is what made it findable:**
the centre glow is drawn straight off `level` and passes *neither* gate, so a
clap that produces a pulse but no ring localises the fault precisely — between
detection and drawing. That is a better measurement than any I took.

Counting rings instead (`ringN`, and `probes/phase-11/rings.js`), 24 claps 0.6 s
apart:

| `Wave rate` | ring gate | onsets | **rings** | rings/clap |
|-------------|-----------|--------|-----------|------------|
| 1 (default) | 0.20 s | 24 | 24 | 1.00 |
| 0.6 | 0.33 s | 24 | 24 | 1.00 |
| 0.4 | 0.50 s | 24 | 24 | 1.00 |
| **0.3** | **0.67 s** | **24** | **12** | **0.50** |
| **0.2** | **1.00 s** | **24** | **12** | **0.50** |
| 0.15 | 1.33 s | 24 | 8 | 0.33 |

Twenty-four onsets the whole way down. The microphone hears every clap; the gate
throws half of them away. At the default it is 1.00 at every spacing from 0.4 s
to 1.2 s, and with a genuinely impulsive 1.5 ms clap as well as the 12 ms
plateau the first probe used — so the *default* is sound and this is the slider.

**Round 2 put that value there.** §11.1 widened this slider's slow end
deliberately, for "a student whose sounds run into one another", and the
checklist told the user so. The slider then persists in `SETTINGS.tw.ripples.rate`
— localStorage, and inside presets.

**Two changes, and neither is a new default.** The slow end stays: suppressing
rings is what it is *for*, and it was widened at the user's own report.

1. **The slider prints the gap it imposes** — `0.67 s`, not `×0.30` — and is
   relabelled *"Rings no closer together than"*. **This is §11.4 a second time:**
   `Fine trim` said `+8 dB` when it meant a range, was renamed `Range`, and was
   made to print the number the readout prints. A control that states a
   multiplier of an invisible constant cannot be reasoned about, and this one was
   discarding a student's sounds while saying `×0.30`.
2. **The gate is asked before `onset()`, not after.** `onset()` has a side effect
   — it sets `lastBurst`, its own refractory — so evaluating it inside a
   short-circuit that then discards the result meant a shut gate consumed the
   transient's refractory as well as its ring. Measured after the change: onsets
   and rings now agree (12 and 12, where it was 24 detected and 12 drawn). The
   ring count is deliberately unchanged — the gate is doing what the therapist
   asked it to do.

**What this cost, and it is the lesson of the round.** §12.2 declared a report
closed on a measurement that was counting the wrong noun, and wrote it into three
documents. The user found the fault by looking at two things on screen that
disagreed. **A probe that counts an internal event proves the internal event; only
counting the thing the student actually sees proves the app.** `_dbg()` now
carries `ringN` beside `onsetN` for exactly that reason, and §12.2 above is left
standing as written with this section correcting it, rather than quietly edited.

### 12.9 Ripples, round four: the gate deleted, and the ring sized from the sound

Four observations from the user on the round-three build. Three were faults; the
fourth was a question about the design that the harness could answer outright.

#### "Wave speed goes up to ×2.00 — this is way too fast"

Range is now **0.2 to 1.0**, default 1.0 — so the default is the ceiling and the
slider only calms it. **The lifecycle row that comes with narrowing a range:** a
preset or a `localStorage` value saved before today can carry ×2.00, and an
`<input type=range>` silently *displays* a clamped value while the drawing keeps
using the stored one. That is a control disagreeing with what is on screen,
which is the third time this file has had that fault. `tw()` now reads every
value through its own declared range in `TWEAKS`, so there is one definition of
what a slider can mean and nothing can outlive it.

#### "The first ring comes out at a slower rate than the others"

**Real, and worse than stated: the same clap drew a different ring depending on
the gap before it.** `rippleRing` took its strength from `level`, the *display*
envelope — 50 ms attack, 350 ms release — while the onset that fires the ring is
detected off the instantaneous level. At 60 fps a 50 ms attack has caught 28% of
its target in one frame, and on a second clap `level` starts from the previous
clap's tail rather than from zero. Measured, identical claps:

| spacing | first ring | the rest | `lvlTarget` |
|---------|-----------|----------|-------------|
| 0.6 s | 0.46 | 0.71 | 1.00 throughout |
| 0.8 s | 0.46 | 0.61 | 1.00 throughout |
| 1.2 s | 0.46 | 0.51 | 1.00 throughout |

The instantaneous level was 1.00 for every single one. **And the same numbers
show the deeper fault: `str` never left 0.46..0.73**, so loudness barely moved
the ring at all — a gentle tap and a shout drew nearly the same thing, in a style
whose whole claim is "louder = bigger, faster, brighter".

`str` is the instantaneous level now, unmultiplied, so it spans the full 0..1.
The velocity constants are retuned to `0.10 + 0.52·str` so that a full-strength
ring at Wave speed ×1.00 matches what a loud clap drew before — the speed the
look was actually judged at. Measured after: strength 1.00 at every spacing,
first ring included, and across claps from −46 to −22 dBFS a spread of **0.40**
where the old code gave 0.05, with ring speeds running 0.41 to 0.62
screen-heights per second instead of a flat 0.61.

#### "Maybe the glow in the middle could be used for lower level sounds"

**The right instinct, and it was the one part of this style a quiet student
actually has.** A sound too soft or too smooth to make a transient makes no ring
at all, so the centre pulse *is* the entire response to it — and it was mapped
linearly off `level`, so a hum at level 0.10 moved it by a twentieth of the
screen and could not be seen to do anything.

A 0.45 gamma lifts exactly that end: level 0.10 now reads 0.37 and level 0.25
reads 0.54, so a quiet sound visibly opens the pond while a loud one still pins
it. Radius and alpha both widened to suit. A ring is now born at the glow's
edge rather than inside it, so it reads as thrown *off* the pulse — which matters
more now that the pulse is bigger.

#### "Is there any benefit to the ring gate? Should we keep it as low as possible?"

**No benefit. It is deleted.**

The gate was written for "a student whose sounds run into one another", so it was
driven with the sounds that actually do that — a raspberry bursting every 71 ms,
a babble with a syllable every 250 ms, a sustained hum — at gates of 1.33 s,
0.20 s and 0.07 s. Rings per second:

| signal | 1.33 s | 0.20 s | 0.07 s |
|--------|--------|--------|--------|
| raspberry, burst every 71 ms | 0.06 | 0.06 | 0.06 |
| babble, syllable every 250 ms | 0.08 | 0.08 | 0.08 |
| one sustained hum | 0.07 | 0.07 | 0.07 |
| **deliberate claps 0.6 s apart** | **0.53** | **1.60** | **1.60** |

**It changes nothing on any sound it was built to tame.** `onset()` already holds
all three to one ring each, because it requires a *transient* and carries its own
0.12 s refractory — which is why Fireworks, with no second gate at all, was
measured giving one explosion for a steady four-second tone. The only signal the
gate measurably affects is deliberate, separated clapping: the one thing that
must never be suppressed, and exactly what it was doing when the user found it in
§12.8.

A control whose only measurable effect is to discard what a student meant to do
is not a control. `onset()` governs alone, and the freed slider slot goes to
**Centre glow** — the user's own suggestion, and the thing a quiet student has.

**The general point, and it is the one worth keeping.** This gate was added in
round 2 for a plausible reason, defended in a comment, given a slider and a
widened range, and never once measured against the sounds it named. It took four
rounds and a student's clapping to find out it did nothing but harm. **A guard
added for a hypothetical case is a hypothesis, and it should be driven with the
case it names before it ships** — the same discipline §8 applies to faults,
applied to fixes.


---

## 13. Phase 12 — the six looks, one at a time ✅ `v1.16.0` and `v1.17.0`

**All of it is UAT-passed and merged.** Lava shipped as `v1.16.0` on 2026-09-05;
Fireworks, the Mandala, the Starfield and the LED wall as `v1.17.0` on
2026-09-06, with the Flow deletion between them. Two of the eight looks were
built and **not** kept — travelling Waves (§13.2, rejected) and the six-pattern
LEDs (§13.8, superseded by the user's own better design in §13.10) — and both
are recorded here rather than quietly dropped, because what they cost is the
useful part.

§12.6 left seven visual reports deliberately unbuilt, and §11.6 says why they are
built one at a time and looked at rather than handed over as a checklist of
guesses. This section grows one entry per look.

### 13.1 Lava's jitter — wax has mass ✅

**UAT-passed after three rounds** (2026-09-05): "all works good". Rounds two and
three are §13.1a and §13.1b, and in both of them **the measurement was the thing
that had to be fixed before the code** — that is the lesson of this look, more
than anything about wax.

**A fault, and its size was measured before anything was written.**

The prediction in §12.6 was that the blob radius follows `updateBands`' 30 ms
attack and wax does not move in 30 ms. That is a claim about a timescale, and
every probe in this directory samples `_dbg()` at **100 ms** — which cannot see a
30 ms attack at all. `probes/phase-11/lava.js` samples once per **animation
frame** instead and dumps the raw rows to `raw/`, so the analysis (`lava-ab.js`)
re-runs without launching a browser.

The first answer it gave was wrong in the way §12.2 warns about, twice over: it
reported a worst-case 200 ms excursion of 40–50% on every signal including a
steady tone, because the window it maximised over **contained the gate opening**
— it was measuring the sound starting. And it read the radius **reconstructed
from the bands**, which is the input to the thing, not the thing. `_dbg()` now
carries `lava.rad`, the `R` that `drawLava` actually passed to `lavaBlob`, and
the numbers below are that, measured on both builds by the same probe, with the
pre-fix copy carrying the same two instrumentation lines and no other change.

Percentages are **of that blob's own radius**, inside a 200 ms window, on
sustained sound only — Lava seeds its blobs with `Math.random`, and the README
records that spreading 30% of total ink between runs, so an absolute number here
would measure the seed.

| signal | build | typical blob | worst blob p95 | direction reversals/s |
|--------|-------|--------------|----------------|-----------------------|
| a child babbling | old | 4.1% | **20.2%** | 8.4 |
| | **new** | 1.4% | **5.4%** | 3.6 |
| a raspberry | old | 1.9% | 4.7% | **27.1** |
| | **new** | 1.3% | 2.6% | **1.3** |
| clapping | old | 6.7% | **68.7%** | 1.3 |
| | **new** | 4.6% | 23.7% | 1.2 |
| a sustained hum | old | 1.3% | 1.9% | 0.2 |
| | **new** | 1.4% | 2.0% | 0.2 |

A blob was changing size by a fifth of itself in a fifth of a second on a child
babbling, and reversing direction 27 times a second on a raspberry. **The hum row
is why this reached the user instead of being found here**: on a sustained tone
the fault measures 1.3%, and a sung note is what a listening app gets tested with.

**The fix is a split, not a number.** The radius gets its own follower on top of
the band — attack 0.35 s, release 0.8 s — and the **luminance keeps the fast
one**. That is the honest physics, and it is also what keeps the app answering a
student immediately: light has no mass and wax does, so a blob still brightens on
the syllable and only stops snapping. The band followers themselves are untouched,
because Mandala and the LEDs are *supposed* to flash on the syllable — this is a
per-style follower in `drawLava`, not a change to `updateBands`.

**What the follower costs, and the gain that buys it back.** A 0.35 s attack
cannot reach a clap's peak, so the swell fell with it:

| build | a clap's peak swell | lag to that peak |
|-------|--------------------|------------------|
| old | +46.0% | 109 ms |
| follower alone | +19.9% | 318 ms |
| **shipped** (follower + saturating gain) | **+25.4%** | **320 ms** |

The gain **saturates to unity** rather than multiplying — `x·G/(1+(G−1)x)` at
G = 2.5. A flat ×1.8 was modelled first and rejected on the arithmetic: it takes
a *sustained* shout to 3.2× the rest radius instead of 2.4× and fills the screen
with blobs. The transient is the part the follower flattens; the sustain is not,
and must not be touched. Measured across G = 1, 1.8, 2.5 and 3.5, the 2.5 curve
is where the swell stops climbing — 3.5 buys 2.5 more points of swell for 3.5×
the gain on small-signal band noise.

**Contingency is the reason to worry about this fix**, and it is why the lag
number is in the acceptance criteria at all: a student who makes a sound and sees
the screen answer 320 ms later may not connect the two, where 109 ms is
unarguable. Two things carry that: the brightness is still instant, and a tap
still strikes the blob away like a snooker ball on the frame it lands. It is the
*size* that now behaves like wax. **This is the one judgement in the fix, and it
is the user's to overturn** — the numbers for a shorter attack are in the table
above and in `lava-cost.js`.

Gates: 28/28 pages clean (the instrumented old copy was in the sweep and clean
too), 9/9 styles played into, 9/9 styles drawn and swept with no microphone.

#### 13.1a Round two — "I like how it fades back, but it is still jerky"

Two reports, and **the first one names a fault in my measurement, not only in the
build**. The user: *"i like how it fades back, but it is still jerky when
detecting sound, maybe it should grow linearly"*, and then *"also looks like the
balls jump around instantly into different locations when detecting sound"*.

**The metric could not have caught either.** `lava-ab.js` measures how FAR the
radius moves inside 200 ms. That scores a smooth ramp and a jump-then-flat
identically — it is blind to the SHAPE of a rise, which was the entire report,
and it is why a build measuring 5.4% still looked jerky. Two metrics were added,
both on the drawn radius: the **biggest single frame**, because a jerk happens in
one frame, and how much of a rise is **completed in its first 100 ms**.

**Fault one: a one-pole moves fastest on its first frame.** That is what an
exponential attack *is* — it covers the largest fraction of the gap immediately
and then creeps. On top of it, `WAX_GAIN`'s saturating curve is **2.5× steepest
at zero**, exactly where a rise begins: a gain added to fix the *size* of the
response had steepened the *start* of it.

**And a slew limit alone is not the answer either.** Pure linear growth was built
and measured first, because it is what the user asked for, and it lost:

| build | babble: biggest frame | clapping: biggest frame | front-loaded (clap) |
|-------|----------------------|------------------------|---------------------|
| original | 4.39% | 12.71% | 94% |
| round 1 (one-pole + gain) | 0.94% | 3.08% | 44% |
| pure linear 1.0/s | **1.25%** | 2.19% | 38% |
| **shipped: whichever moves less** | **0.55%** | **1.84%** | **30%** |

A cap makes a *small* rise move at the full rate too, where a one-pole makes it
gentle in proportion to how small it is. So pure linear beat round 1 on clapping
and **lost to it on a babbling child**. The rise now takes `min(rate·dt,
one-pole step)`: the cap governs a clap, the one-pole governs a syllable, and it
is better than both on every signal measured. It is still linear for almost all
of a big rise, which is where the user was looking when they asked for it.

**Fault two: the blobs really did jump, and it was not the wax at all.**
`b.x += b.vx*dt*(1+level*1.5)` multiplies every blob's drift speed by up to 2.5×
off the **instant** `level`, which has a 50 ms attack. Measured off the same
loudness rows: on a clap that multiplier moves **41.3% in a single frame** and
takes every blob from rest to full speed in 66 ms, together. On `waxLvl` the
worst frame is 2.35%. Speed now carries the same mass the size does. The
snooker strike is untouched — it is touch-only, and a tap should still be
instant.

**Brightness was measured before being left alone.** It moves at most 9.6% in a
frame on a clap and 1.9% on a raspberry: that is a flash, not a flicker, so the
luminance stays on the fast band and the app still answers a student instantly in
light.

**What it costs, and it is the same trade-off as T3.** A clap's swell falls from
+25.3% at 317 ms to **+17.8% at 349 ms**. The acceptance criterion of ≥25% swell
is therefore **missed deliberately**, twice now, in favour of the smoothness the
user asked for twice. A constant multiplier on the wax value buys the size back
at proportional cost to every step, and a 0.25 s attack buys it back by
steepening the start — both are one-liners and both are the user's call.

Gates: 27/27 pages clean, 9/9 styles played into, 9/9 drawn and swept with no
microphone.

### 13.6 A Starfield that moves through space ✅ UAT-passed, `v1.17.0`

Fifth look, and taken with §13.2 firmly in mind: travelling Waves was rejected
because it changed what a style *meant* and offered no way to dial it back. This
one deepens Starfield's own metaphor rather than reinterpreting an axis — **and
its `Travel speed` slider reaches 0, where the field is exactly the still sky it
is today.** If the flight is wrong for a student, it turns off; it does not have
to be dropped whole.

**What it does.** Every star has a depth `z`. Its screen position is a fixed
offset from a vanishing point divided by `z`, so it sweeps outward and
accelerates as it comes past, and respawns in the distance. Loudness is the
throttle; silence still drifts. The vanishing point sits at the **pitch height**,
so a rising voice lifts the horizon — and it is *followed*, not set, because
moving it per frame would jump every star at once, which is precisely the fault
§13.1 spent three rounds removing from Lava.

**Measured on the page** (`probes/phase-11/starfield.js`):

| setting | stars past the camera / s |
|---------|---------------------------|
| `Travel speed` 0 | **0.0** |
| travel 1, silence | 8.6 |
| travel 1, a loud hum | **142.9** |
| travel 2, a loud hum | **285.7** |

Zero is exactly zero, loudness moves it 16-fold, and the slider's top is exactly
double its middle. A screenshot diff agrees that the picture moves — 0.17% of
pixels changing per 0.35 s before, **2.18%** after — but it **saturates**: a star
that moves further than its own width reads as "changed" whatever its speed, so
it cannot tell travel 1 from travel 2. That is why the flight rate is counted
directly rather than inferred from the picture.

#### A claim was written into the code and measured false

The Flow look reported in passing that Starfield's ink share fell from 51.1% to
35.7% on a 4x canvas — the sky getting emptier on a bigger screen — and the first
version of this comment said depth scaling fixed it. **Neither part survived.**
That figure counted every non-black pixel, and in this style most of those are
the nebula haze, whose discs are placed at random and vary more between *runs*
than between canvas sizes. Counting only pixels bright enough to be a star, the
falloff is **0.84 before and 0.82 after** — unchanged.

What the depth scaling did do is worth more anyway: **star ink roughly doubled**
at both canvas sizes, 0.44% to 0.91%, because a near star is large. The sky is
fuller; it is not less prone to emptying. The wrong claim is left in the code as
a struck-through note rather than quietly deleted, and §13.5's version of it is
corrected too.

**Memory stars fly too.** A burst that settles used to become a fixed point;
fixed points in a moving field would be the only still things on screen. A
resting spark now joins the field at the depth it is standing in — the projection
solved backwards — so it does not jump on the frame it is created.

Gates: 27/27 pages clean, 9/9 styles played into, 9/9 drawn and swept with no
microphone, including the new slider.
### 13.7 Starfield, round two — and the halo ✅ UAT-passed, `v1.17.0`

Four reports, all real, and a photograph settled the first two.

**The halo is DELETED, not tuned.** It was three `glowDisc` radial gradients a
quarter of the screen across at alpha 0.035, and the user's photograph is exactly
what that becomes on an 8-bit canvas: three enormous dim discs with visible
concentric rings. **Fourth time this project has answered a banding radial
gradient by removing the mechanism** — Soundscape's glow, §11.3's firework
afterglow, §12.3's frame fade, now the nebula haze. The harness is a software
rasteriser and cannot see a compositing fault at all, so there was never a number
to tune it against.

**The clump.** Stars were seeded in a small disc around the vanishing point and
their offset divided by `z`, so at `z` near 1 — where a star spends most of its
life — every one sat within 0.085 of the centre. The photograph is a knot of
stars in the middle of an empty screen, and the arithmetic says it could not have
been anything else: with a constant `dz` the density per unit area goes as 1/R³.
**No value of the spread fixes that, because the fault is where stars are BORN.**
They are born anywhere on the screen now and sweep outward from there, so
steady-state coverage is uniform by construction rather than by tuning. Offsets
are per-axis in fractions of W and H, so a wide screen fills its corners instead
of a square's worth of sky sitting in the middle of it.

Measured on a 16×9 grid: **100% of the width used, 64% of cells lit**, against a
clump before. The seed spread is 0.5 rather than 0.58 for a measured reason — at
0.58 about a sixth of every seed landed outside the frame and respawned on its
first frame, 931 stars/s passing the camera with 300 stars in the sky, which is
waste rather than flight. 594/s now.

**More stars:** 140/90/55 by quality became 300/190/110, and the `Stars` slider
reaches 2.5. A field that fills the screen needs more of them than a knot did.

**The speed cannot be zero.** `Travel speed` is 0.25–2. This overrules §13.6's
design, where 0 was the whole point of the slider — my answer to travelling Waves
being undialable. The user would rather it always flew, and it is their room.

**Rising sparks are now Passing dust.** They drifted *up* from the floor while
the rest of the sky flew outward — the only things in the frame moving the wrong
way. Same idea inside the same geometry now: a sound throws coloured dust into
the field and it flies past with everything else. The slider's **key** stays
`sparks`, so a therapist who had already turned it down keeps their setting and
only the label changes.

**A test regression, mine.** `gate.js` referenced `styles.length` in a header
above the `const` declaring it, so gate 2 threw before running. It went in when
the style count became dynamic (§13.5) and I never re-ran the gate on that
branch. It reached `main`.

### 13.8 LEDs against WLED's repertoire ❌ SUPERSEDED by §13.10 after one round

**The honest comparison first: this style had three of WLED's effects** — a VU
fill, a theatre chase and bidirectional pulses — **all running at once, with no
way to choose between them.** WLED is fundamentally a chooser: a strip is
hardware, an effect is a choice made on it. So that is the shape copied.

Six patterns on the one strip, each sound-reactive, none of them decoration
waiting for a sound that never comes:

| # | pattern | what the sound does |
|---|---------|---------------------|
| **1** | **Strip + EQ** | the shipped look: VU fill, chase, pulses |
| 2 | Meteors | heads with tails; transients launch them, loudness streams them |
| 3 | Sparkle | a random subset lit, re-rolled on every transient (WLED's Twinkle) |
| 4 | Fire | flicker hottest at the bottom-centre, height from loudness |
| 5 | Rainbow run | a palette wave around the strip, loudness sets its speed |
| 6 | Breathe | the whole strip together — the calm one, for a student who needs less |

**Pattern 1 is the default and is exactly the shipped look**, because `tw()`
returns 1 for a tweak nobody has set. Anything else would silently change the
style for every therapist who already had it set up.

`Equalizer height` now reaches **0**, so the strip can run alone — Breathe with
nothing bouncing in the middle of it.

**Every pattern was selected, played into and dragged across**
(`probes/phase-11/leds.js`), which is the gate CLAUDE.md exists for: a fault
inside one pattern's draw code cannot throw until that pattern is both chosen and
given a sound. All six clean, and **all 15 pairs of them are visibly different
pictures** — six names over one picture would pass every error check ever
written.

**Photographing them against a HELD hum found a real fault.** Meteors launched
only on a transient, so a student holding a note got an empty strip — §11.6's
"a sustained sound has nothing to do", one style later. They now also launch on a
rate that follows loudness. The montage is what caught it; the error gate could
not have.

### 13.9 Starfield round three, and the LED wall ✅ UAT-passed, `v1.17.0`

#### The flight stopped steering, and that fixed a fault as well as a preference

*"The stars moving at you move up and down very quickly with high and low
sounds. This movement needs to be more gradual, maybe none at all as it may be
disorientating — and actually sometimes it moves so much part of the screen is
blank."*

The blank is the half of that which was a **fault**, and it follows from the
geometry rather than from the speed. Every star is born as an offset **from the
vanishing point**, so moving that point moves the whole field's origin — and the
region it has just vacated contains no stars at all until enough new ones have
been born to refill it, which at these speeds never happens. A longer lag could
not have fixed it; only the origin holding still could. **The vanishing point is
the centre of the screen now, full stop.**

Pitch keeps its height: the **voice band** still lights the stars at the pitch
height, which shows the same thing without moving the geometry underneath it.

#### Two things that were there and could not be seen

- *"I can't really see the passing dust."* It was emitted at 16/s, at a star's
  size, born at `z` 0.55–1 — far away, small and dim, in a field that had just
  gained 300 stars to hide it among. Now 3× the rate, twice the size, full
  brightness rather than 0.7, and born **near** (`z` 0.30–0.75) so it is already
  large when it appears. It is the one thing in this style that is purely the
  student's own sound, and it was the least visible thing on screen.
- *"The changes in colour themes are very subtle."* Stars were drawn **white**
  and only mixed toward the palette where the voice band lit them, so changing
  theme moved almost nothing. Each star now keeps its own place in the palette.

### 13.10 The LED wall — one idea instead of six ❌→✅

**§13.8's six patterns lasted one round.** *"The LED has potential, but I don't
like the mixture of styles. What about a full grid of LEDs that cover the whole
screen and the chase around the outside, is on every internal rectangle as you
move to the centre."*

They are right, and the correction is worth more than the code: **six unrelated
effects behind a slider is a menu, not a style.** §13.8 copied WLED's *shape* —
a chooser — when what this room needed was WLED's *idea*, a wall of LEDs running
one thing well. The strip-around-the-edge plus a separate centre equalizer was
already two unrelated things sharing a screen; six made it worse, not better.

**What it is now.** The whole screen is a grid of LEDs. Every LED belongs to
exactly one concentric rectangle — its **ring**, the distance to the nearest
edge in grid steps — and to one position around that ring's perimeter. The chase
is a hotspot travelling around **every** ring at once. Each ring also carries one
frequency band, low at the edge and high at the centre, so a voice lights the
wall from the outside in, and a transient sends a wave running inward across the
rings.

The four controls all act on that one thing:

| control | what it does |
|---------|--------------|
| `LED size` | how big the LEDs are, so how many fill the screen |
| `Chase speed` | how fast the hotspots travel; loudness adds to it. **0 is OFF**, not frozen |
| **`Spiral`** | how far each ring's phase lags the one outside it — **0** and the rings pulse together, **2** and they trail into a spiral |
| `Sound spread` | how strongly each ring's own frequency band lights it |

`Pattern` and `Equalizer height` are gone from the menu, because the things they
selected are gone.

**Zero means off.** The first build stopped *advancing* the chase at `Chase
speed` 0 and carried on lighting it, so the bottom of the slider left a ring of
stationary bright dots on every rectangle — the user photographed it. That is not
what a speed of zero means, and not what the other sliders reaching 0 in this app
do. Measured in silence, pixels brighter than the resting wall: **0.000% at chase
0**, and 1.77–1.83% at every non-zero setting — a clean step at the bottom with
the slider still working across the rest of its range.

**Frame rate measured, because a full-screen grid is about 1,100 dots redrawn
every frame** and that is exactly the sort of change that quietly halves the rate
on a room PC. At 1920×1080: **60.1 fps at the default LED size, 59.9 at the
smallest the slider allows** (the real worst case, taken from the slider's own
range) and 60.2 at the largest, against 60.0 for Starfield and Mandala. Headless
is a software rasteriser, so read this as "nothing pathological here", not as a
GPU measurement.

Gates: 27/27 pages clean, 8/8 styles played into, 8/8 drawn and swept with no
microphone, with the menus showing the new controls.

### 13.5 🌀 Flow DELETED at the user's request, 2026-09-05

*"Actually delete Flow. I don't like it."* Voice Visuals has **eight** styles now.
The style, its vector field, its tweaks and its touch handler are gone from
`voice_visuals.html`; it lives in git history like MIDI Weather does.

**The boldness work it was deleted mid-way through is abandoned, and the
measurement it had already produced contradicted my hypothesis anyway.** Flow's
stroke widths are the raw constants `1.5` and `2.2` where every other style
scales by `H/800` or `min(W,H)`, so the prediction was that its ink share would
fall as the screen grew. It did not: 9.95% at 1280x800 against 9.76% at
2560x1600. (A second claim was made here and is now **withdrawn**: that
Starfield's ink share fell from 51.1% to 35.7% on a 4x canvas because its star
count is fixed. Both numbers count every non-black pixel, and in Starfield most
of those are the nebula haze, whose discs are placed at random and vary more
between *runs* than between canvas sizes. Counting only pixels bright enough to
be a star, the falloff is 0.84 — and it is 0.82 after §13.6's rebuild, i.e.
unchanged. The metric was measuring randomness. See §13.6.)

#### The row that gets forgotten is inheritance

CLAUDE.md names replacement, duplication and inheritance as the three lifecycle
rows that get missed, and a deleted style is an inheritance problem: a shared
room PC where a therapist left Voice Visuals on Flow, a preset saved with it, or
a printed launch link naming it. `probes/phase-11/retired.js` drives all three.

**It found a real inconsistency.** `init()` clamped an unknown `visMode` to
Mandala, but the draw dispatch ended in `else drawStars(...)` — so a **preset**,
which is applied *after* init, would have drawn Starfield while the Style chips
showed nothing selected. Two fallbacks disagreeing is worse than either. The
clamp now sits in `frame()`, so every route — saved settings, launch link,
preset, a live edit — lands on Mandala.

Also measured, because it changes what a therapist sees: with nine styles the
Style row hit the `CHIP_CAP=8` collapse and showed four plus an expander. **With
eight it shows every style inline.**

Two things deliberately NOT touched: `Anim.lockMode:'flow'` and
`defaults.mode:'flow'` are the **framework's play mode**, not this style — a name
collision, and deleting them would have broken how the app reads a pointer.

Gates: 27/27 pages clean, 8/8 styles played into, 8/8 drawn and swept with no
microphone, 9/9 inheritance checks clean. The style lists inside `gate.js`,
`nomic.js` and `ghost.js` are now single constants, because the first run after
the deletion printed "nine styles" over eight results.
### 13.3 Fireworks: bigger explosions, and a particle-size slider ✅ UAT-passed, `v1.17.0`

Third look, and chosen deliberately after §13.2 was rejected: this one changes an
**amount**, not a meaning.

**The slider was the fault, not the explosion.** `Burst size` scaled the particle
count linearly but the launch speed by `sqrt`, so its entire range moved a
burst's reach from 0.180 to 0.315 of `min(W,H)` — a factor of 1.75, and **no
setting made a firework that filled the screen**. It scales the speed linearly
now, the base speed is higher, and the drag is gentler.

Reach at +0.9 s, p90 of a burst's own particles, as a fraction of `min(W,H)`:

| `Burst size` | before | after |
|--------------|--------|-------|
| minimum | 0.180 | 0.179 |
| **default** | **0.245** | **0.340** |
| maximum | 0.315 | **0.571** |

The bottom of the slider deliberately still sits **below the old default**, so a
therapist who preferred the smaller burst keeps it. That is the courtesy §13.2
could not offer — travelling Waves had no setting that gave the old behaviour
back, which is part of why it had to be dropped whole rather than dialled down.

**`Particle size` is new** (0.4–3), on both the embers and the burst.

#### The probe was wrong, and it is the fourth time this phase

The first version of `fireworks.js` reported the old burst reaching **0.077** —
a 62-pixel puff on an 800-pixel screen — and that number went into a commit
message and into a comment before it was caught. It was wrong three separate
ways, each found only by looking at raw per-frame output:

1. **It measured every trail particle from the newest burst's origin**, so the
   survivors of the *previous* explosion, which are far away by then, set the
   p90. It reported p90 0.30 beside p50 0.02 — a shape no burst ever had.
   Particles are tagged with a burst id now.
2. **It took a max over each percentile independently**, mixing a p50 from one
   frame with a p90 from another.
3. **It split bursts on every frame with `age < 0.05` rather than on the
   transition into it.** A burst spends about three frames there, so each one
   contributed one real sample and two newborn ones — and the mean of
   `[0.80, 0.02, 0.03]` is 0.28, which is exactly the age it printed while
   claiming 0.8 s. Every figure in the table was about a third of the truth.

The fix that found all three was **printing the age it actually matched instead
of the age it asked for**. That is the same discipline as §13.2's launch
parameter: *a probe must report what it measured, not what it requested.*

#### And a mechanism was built on the wrong answer, then deleted

Believing the 0.077 figure, the reach was blamed on gravity being applied at full
strength from a particle's first frame — cancelling the upward half of the sphere
before it could open. A ramp was added to fade the fall in over 0.4 s. Measured
with the fixed probe it moved the reach by **nothing**: p90 at +0.9 s was 0.314
with it and 0.318 without, and slightly *worse* at the slider's bottom. It is
deleted, not kept as decoration — [[guards-are-hypotheses]] applied to a feature
rather than a guard.

The drag change was A/B'd rather than asserted for the same reason: it is worth
about half the extra reach at the default (0.245 → 0.280 on speed alone, 0.318
with it) and about a tenth at the top, where the linear scaling does the work.

Gates: 27/27 pages clean, 9/9 styles played into, 9/9 drawn and swept with no
microphone, including the new slider.
### 13.4 Mandala at full loudness ✅ UAT-passed, `v1.17.0`

Fourth look. Like Fireworks it turned out to be arithmetic rather than taste.

**At a student's loudest, the mandala was drawing at half size.** A band value is
the **average** of its FFT bins, and a voice puts its energy into a few
harmonics, so averaging dilutes it — the loudest band of a sung 220 Hz tone
measures 0.69, not 1. `Math.pow(v,1.5)` then compressed what was left. Measured
at the top of the app's own calibrated loudness (`probes/phase-11/mandala.js`,
off `_dbg().mand.use` — the share of its permitted reach the longest spoke is
actually taking):

| signal, at loudness ≈ 1 | before | after |
|-------------------------|--------|-------|
| a broadband ramp | 0.920 | 0.979 |
| **a sung tone, 220 Hz** | **0.588** | **0.815** |
| a sung tone, 350 Hz | 0.472 | 0.730 |
| a babbling child | 0.647 | 0.852 |
| clapping | 0.397 | 0.667 |
| a hiss | 0.115 | 0.268 |

The gain **saturates rather than clamps** — the same shape as Lava's wax gain,
for the reason Waves' flat line taught: a hard clamp draws a flat top, and here
that would be several spokes all stopping at the same length and reading as a
circle. The gamma is untouched, so the *shape* of the spectrum is exactly as it
was; only the scale it is drawn at has moved. The outer ring gets the same gain.

**The cost, and it is real.** Filling the picture at the top compresses its
dynamics. Off the same ramp, spoke length as a percentage of the loudest:

| loudness | before | after |
|----------|--------|-------|
| 0.3–0.4 | 23% | 44% |
| 0.5–0.6 | 32% | 56% |
| 0.7–0.8 | 45% | 69% |
| 0.9–1.0 | 100% | 100% |

A quiet sound is still visibly smaller than a loud one, but by less. **That cuts
both ways for this room**: less headroom to reward a student for getting louder,
and a picture that is no longer nearly invisible for a student who cannot get
loud at all. It is the user's call and it is in the checklist.

**A steeper gamma was tried to keep the contrast and rejected on the
measurement**: gamma 2.2 with gain 6 read 40/55/70% against 44/56/69% — a
difference of nothing — while a hiss fell from 0.27 to 0.19. The compression is
inherent to filling the picture, not a tuning failure.

**The instrumentation was wrong first, for the fifth time this phase.** It
compared `len` in pixels against a stored fraction of `min(W,H)`, so every spoke
beat the stored value and it recorded the **last** spoke rather than the longest
— reporting 0.010 where the formula plainly gives 0.272. It was caught by
checking the reading against the arithmetic it was supposed to confirm, which is
the cheapest check there is and the one I keep skipping.

Gates: 27/27 pages clean, 9/9 styles played into, 9/9 drawn and swept with no
microphone.

### 13.2 Waves travelling horizontally ❌ BUILT, SHOWN, AND REJECTED

**Do not build this again.** It was built in full on `phase-12-waves-travel`,
measured, shown to the user, and their verdict was *"don't like it. drop it.
prefer it the way it was."* The branch is kept, unmerged, so the work is
recoverable; `main` keeps the oscilloscope.

**What it did.** Waves' `x` was position inside the last 43 ms of audio, redrawn
whole every frame, so nothing moved across the screen and a sound was gone the
instant it stopped. The rewrite kept the same real waveform as a scrolling
record — newest column at the right, everything drifting left, a `Time on screen`
slider from 0.8 s to 4.8 s. It worked: measured travel 0.422 screens/s against a
designed 0.417, and 0.205 against 0.208 at the slider's top.

**The reason it was wrong, and it is worth keeping.** In the oscilloscope a new
sound redraws the trace across **100% of the width within one frame**. Scrolling
makes the shape response local to the right-hand edge — `dt/span` of the width
per frame, about **4% of the screen in the first 100 ms**. Persistence was bought
with immediacy, and for this room immediacy won.

That is the same trade-off as Lava's swell (§13.1, T3) and it went the other way,
which is the point: **there is no general answer, and the user is the one who can
see it.** The measurements said the feature did exactly what it was built to do.
They were not the question.

**A second thing to keep.** The design was pitched as "the one most likely to
hide a fault rather than be a taste call". That was backwards — changing what the
horizontal axis *means* is the biggest identity change of the six looks, which
makes it more of a taste call, not less. **The fault-hunting argument belonged to
Lava; it was borrowed for a piece of work it did not fit**, and the pitch shaped
what the user was asked to look for.

#### 13.1b Round three — "especially when the voice texture is high"

*"With short sharp noises it still is jerky, especially with the initial noise"*
— and then, unprompted, *"it is when the voice texture is high I think."* That
second sentence is the whole finding, and it named a signal I had not looked at
once.

**The jerk was never in the radius.** `conf` is raw NSDF confidence, replaced
whole on every pitch poll and smoothed nowhere. `defn()` maps it through a
0.4-wide window, and `lavaBlob` draws the near-opaque core of the wax at
`0.6·e·R` where `e = 0.55 + 0.45·defn`. So `defn` falling 1 → 0 shrinks the
blob's **visible** edge from 0.60R to 0.33R — nearly half — with no follower
anywhere in that path.

Measured per frame on a babbling child:

| | biggest single frame |
|---|---|
| `R`, the radius the code computes | 0.64% |
| **`0.6·e·R`, the radius the eye reads** | **82.32%** |
| `defn` itself | **1.000 — the full swing, between two frames** |

**Every metric in `probes/phase-11` said this build was smooth**, because every
one of them measures `rad`. §13.1 already congratulated itself for measuring the
radius as drawn instead of rebuilding it from the bands — and then measured the
wrong radius. *The eye reads the picture; the probe read the arithmetic behind
it.* This is the third time in this phase that the measurement, not the code, was
the thing that had to be fixed first.

It also explains the shape of the report exactly. A *sustained* hiss holds `conf`
low and looks correct. A **short sharp noise** crosses the voiced/unvoiced window
and comes back inside a few frames, which is a snap; and the **first** one after
silence is the largest crossing there is. With `Voice texture` at 0 the whole
term is disabled — `defn()` returns 1 — which is why the setting predicted it.

**The fix is at `defn`'s source, not in Lava.** `confS` is a drawing-side copy of
`conf` with the same rise shape the wax uses — `min(rate·dt, one-pole)` — but
**symmetric**, because there is no story about firming up faster than softening.
Raw `conf` still gates `PITCH_TRUST`: that is a detection decision and must stay
instantaneous. Mandala's `wide`/`dim` spokes hang off the same `defn()` and had
the same fault, so one follower fixes two styles.

| signal | visible core, before | after | `defn` worst frame |
|--------|---------------------|-------|--------------------|
| a child babbling | 82.32% | **3.16%** | 1.000 → **0.068** |
| a raspberry | 5.65% | **0.27%** | 0.069 → 0.000 |
| clapping | 1.87% | 1.81% | 0.000 → 0.000 |

**And the feature still arrives**, which is the thing a follower can quietly
break. Mean `defn` over the last three seconds: a hiss 0.000 before and after, a
voiced tone 1.000 before and after. What changed is a babble — 0.719 → 1.000 —
and that is the intent, not a regression: brief unvoiced moments *inside* speech
no longer collapse the edge, while a sustained unvoiced sound still softens
fully.

Gates: 27/27 pages clean, 9/9 styles played into, 9/9 drawn and swept with no
microphone.
