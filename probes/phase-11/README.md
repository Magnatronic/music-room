# Phase 11 probes — driving Voice Visuals with a fake microphone

These three scripts are what `PHASE-11-LISTENING.md` §8 promises. They are the
only way this project has to play a known sound into an app and read back what
it heard.

```
npm init -y && npm install playwright-core     # once, in this directory
node mkwav.js      # writes wav/*.wav — generated, never committed
node probe.js      # the Phase 11 findings, F1-F7 and F9
node panel.js      # the Voice section in Setup -> Access, driven by clicking
node texture.js    # step 4: voiced/unvoiced and brightness, drawn
node gate.js       # all 27 pages load clean, then all 9 styles played into
node uat1.js       # UAT round 1 fixes, driven in the page
node onset.js      # the onset fix, proved arithmetically - needs no browser
node nomic.js      # 27 pages + 9 styles drawn, dragged and swept with NO microphone
node floor.js      # 11b: the room floor across eight room levels, and clap trains
node ghost.js      # 11b: the frame-fade residue, measured off SCREENSHOTS
node claps.js      # 11b: sustained and accelerating clapping
node onsetlive.js  # 11b: onsets vs frames, in a cheap style and an expensive one
node waves.js      # 11b: where the Waves trace clips - needs no browser
node throttle.js   # 11b: onsets under CPU throttling - DID NOT WORK, see below
node lava.js       # 12: Lava's radius, sampled per FRAME; writes raw/*.json
node lava-ab.js    # 12: old vs new, off raw/ - no browser
node lava-an.js    # 12: models a candidate follower over the same raw/ rows
node lava-cost.js  # 12: what the follower costs a clap's swell
node lava-lin.js   # 12: the SHAPE of a rise - exponential vs linear vs both
node fireworks.js  # 12: how far a burst REACHES, at a known age after the bang
node mandala.js    # 12: what share of its permitted reach the mandala uses
node starfield.js  # 12: does the sky move, and does it cover the screen
node retired.js    # 12: a DELETED style inherited by the next person at the PC
node leds.js       # 12: every LED pattern selected, played into and dragged
node ledperf.js    # 12: frame rate of the full-screen LED wall
node ledshot.js    # 12: contact sheet of the LED patterns (superseded build)
node wallshot.js   # 12: contact sheet of the LED wall and the Starfield
```

Two of the counts above are out of date on purpose: `gate.js` and `nomic.js`
drive **eight** styles, not nine, since Flow was deleted on 2026-09-05. Their
headers read the length of one list rather than a written number now, because the
first run after that deletion printed "nine styles" over eight results.

`ledshot.js` photographs a build that **no longer exists** - the six-pattern LEDs
of §13.8, replaced by the wall in §13.10. It is kept because the method is right
for any style with modes, not because it can still be run against the app.

`lava.js` takes `--app=<file.html>` and `--tag=<prefix>`, so the pre-fix build
(instrumented with the same `_dbg` lines and nothing else) is measured by the
same probe rather than by a second one. It dumps raw per-frame rows to `raw/`,
which is gitignored: the analysis then re-runs in milliseconds without launching
a browser, and that is what made four candidate followers cheap to compare.

Edge is driven through `playwright-core` at
`C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe`. The microphone is
faked with three Chromium flags, the third of which takes a 16-bit PCM WAV:

```
--use-fake-ui-for-media-stream
--use-fake-device-for-media-stream
--use-file-for-fake-audio-capture=<abs path>.wav%noloop
```

## Seven things that each cost a wrong answer here

- **A run must finish well before its WAV ends.** When the file runs out, the
  fake device falls back to Chromium's own beep, and the tail of the run reads
  as a loud steady tone. That produced "silence.wav opened the gate at level
  0.55" and three other confident nonsense results. Every WAV is now far longer
  than the run that uses it.
- **Never read a span from where `level` crosses a threshold.** The ramp moves
  3.75 dB/s and the probe samples at 10 Hz, so one missed row moves the answer
  3 dB. Read the floor and ceiling the app reports, then check `level` follows
  `u^0.6` between them.
- **Skip the first 400 ms after the gate opens** when checking that mapping.
  `level` is a 50 ms attack envelope catching up to a step, so it legitimately
  sits below the instantaneous reading there — that transient was the whole of
  a 0.07 discrepancy that looked like a mapping error.
- **Counting identical neighbouring bands does not measure FFT resolution.**
  Resolved bands show real gaps between a voice's harmonics, and two adjacent
  zeros are two adjacent equal numbers — the metric punished the fix. Contrast
  (quietest bar over loudest) is the measurement: a smear cannot go near zero.

- **There is no `#panel`.** `panel.js` selected `#panel .chip`, found nothing,
  and reported five controls missing that were all on screen. `#strip` holds one
  `.pane` per tab and each pane's content has its own id — here, `#setupContent`.
  The `verify` skill said `#panel` until this found it; the skill is corrected.
- **Assert the design, not your first guess at it.** Two panel assertions failed
  against correct behaviour: a −45 dBFS room does *not* deserve a noisy-room
  warning (it still leaves 34 dB), and re-seeding the floor under a continuous
  tone is *meant* to measure the tone. Both were the probe expecting the opposite
  of what the design says.

- **Measure your metric’s own noise before believing a difference.** Lava seeds
  its blobs with `Math.random`, so four identical runs spread **30.3%** of total
  ink — and a 21% difference between two builds was reported as a fault before
  that baseline was taken. Mandala is bit-exact across runs (0.0%), which is why
  the pixel test lives there and Lava’s is read from `defn` instead.

## Every launcher passes --mute-audio, and it is not cosmetic

The user's USB headset started dropping out during a session that ran well over a
hundred headless browser launches. Each one loads `framework.js`, which creates
an `AudioContext` - and that OPENS THE DEFAULT OUTPUT DEVICE, which was their
headphones. Opening and closing a USB audio endpoint a hundred times in an
afternoon is a good way to make it re-enumerate. `--mute-audio` stops the browser
taking the output device at all; the fake CAPTURE device is unaffected, and no
measurement here depends on anything reaching a speaker (Voice Visuals is
listen-only and the rest of the suite only reads the canvas).

Confirmed by the user after the probe runs stopped: the headset has been fine.

## When the fake microphone stops opening

It does. On 2026-09-04, part-way through UAT round 1, `getUserMedia` went from
reliable to unusable on this machine with no code change: three consecutive
launches gave 4.2 s, never, never, and later **36 consecutive retries opened it
zero times**. The run that did open returned f0 220.0 Hz exactly, so the app was
never the problem. This is the environmental audio-device stall already on record
in this project, which last time cleared with a PC restart.

`drive.js` retries a launch that never opens, abandons an attempt after 6 s
rather than waiting out the whole run, and **reports how many retries it needed**
- a silent retry would hide a real regression behind the flakiness.

When it will not open at all, two things still work and are worth more than
waiting: `onset.js` proves envelope arithmetic with no browser, and `nomic.js`
drives all 27 pages and all 9 styles with no microphone, which still exercises
every draw path through touch and the tweak sliders. **Neither replaces driving
the page with sound.** Say which one produced a result when reporting it.

## Three more ways these probes were wrong (round 3, 2026-09-05)

- **A probe that reproduces the report is the most dangerous wrong answer.**
  `claps.js` said 27 rings from 40 claps with the drops clustered late - exactly
  what the user described, and exactly wrong. It counted rises in the length of
  the live `rings` array, and rings expire as new ones arrive, so an add and an
  expiry inside one 100 ms sample cancelled out. The real count, from an onset
  counter added to `_dbg()`, is **40 of 40**. It nearly bought a rewrite of the
  listening path. When a probe agrees with the user, check HOW it agrees.
- **`?vis=ripples` is not a launch parameter.** It is `?s=visMode:ripples`, and
  an unrecognised query string is silently ignored rather than warned about - so
  the first `floor.js` run measured ring counts in Mandala, which has no rings,
  and reported zero. The launch-link parser is in `framework.js`: `LAUNCH.get('s')`.
- **`max` is the wrong statistic for a residue.** `ghost.js` first reported the
  brightest pixel on screen, and Mandala draws a bright ring at rest, so it
  returned a saturated 255 that said nothing. Ghosting is not bright, it is
  DIM-BUT-NOT-BLACK: a population stalled at a few 255ths. The measure is the
  count of pixels in [1,24] against the same style at rest.
- **CDP's `Emulation.setCPUThrottlingRate` did not slow this page.** 1x through
  10x all held ~70 fps in `throttle.js`, so the slow-room-PC case is UNTESTED.
  The file is kept because the question is still open, not because it answered it.

## Measure a residue off a screenshot, never off `getImageData`

`canvas-fade-never-arrives` is on record in this project as a bug that reading
pixels back **hides**: `getImageData` de-accelerates the canvas, and the
accelerated path is the one that stalls. `png.js` is a dependency-free PNG reader
so a Playwright screenshot - the composited output, which is what the user's
photograph is - can be measured in Node instead.

## Make it fail on the old code first

Every assertion here was run against the pre-Phase-11 file before being trusted.
Copy the old `voice_visuals.html` alongside as `voice_visuals_OLDCODE.html`,
point the probe at it, and it fails 16 of 22 — including `pitch01` reading
**0.097** for a 700 Hz child's squeal, which is the octave error made visible.
A probe that passes on both files is measuring something else.

## Two more ways these probes were wrong (Phase 12, 2026-09-05)

- **A 100 ms poll cannot see a 30 ms attack.** Every probe here samples
  `_dbg()` on a `waitForTimeout` loop, which is right for a room floor and
  useless for the question "does this move too fast". `lava.js` samples inside
  `requestAnimationFrame` instead. If the fault is about a *timescale*, the first
  thing to check is whether the probe's own sample rate can represent it.
- **A max over a window that contains the onset measures the onset.** The first
  run reported a 40-50% excursion on every signal, including a steady tone that
  cannot produce one, because the window it maximised over included the gate
  opening. Drop the transient and report a distribution, not a max.
- **Reconstructing the quantity from its inputs is §12.2 again.** The first
  analysis rebuilt the blob radius from `bands` and `level`. That measures what
  the radius *should* be, and would have missed any fault between the arithmetic
  and the drawing - the exact shape of the onset-versus-ring mistake. `_dbg()`
  now carries `lava.rad`, the `R` that was passed to `lavaBlob`.

## The metric that passed a build the user called jerky (Phase 12, round 2)

`lava-ab.js` measures how FAR the radius moves inside 200 ms. It cannot tell a
smooth ramp from a jump followed by a flat - they move the same distance - so it
is **structurally blind to the shape of a rise**, and the shape was the whole of
the user's next report: "still jerky when detecting sound". The build it passed
at 5.4% was the build they rejected.

Two metrics answer it, both on the drawn radius: the **biggest single frame**,
because a jerk happens in one frame, and the share of a rise **completed in its
first 100 ms**, because a one-pole front-loads and a rate cap cannot.

This is `count what the student sees` one layer down. It is not enough to measure
the right QUANTITY - `rad` was already the right quantity - if the statistic
taken over it cannot represent the fault being reported.

## Measuring the right quantity is not enough: measure the DRAWN one

Round 2 above congratulates this suite for measuring `rad`, the radius as drawn,
instead of rebuilding it from the bands. Round 3 is the same lesson one layer
further down, and it cost a whole round: **`rad` is not what the eye reads.**
`lavaBlob` draws the near-opaque core of the wax at `0.6*e*R`, and `e` follows
`defn`, which follows raw unsmoothed `conf`. Measured on a babbling child, the
drawn core moved **82% in one frame** while `rad` moved 0.64%, and every metric
in this directory reported the build smooth.

The user found it from the outside, twice over: "still jerky with short sharp
noises" and then "it is when the voice texture is high I think" — a setting that
switches the whole term off. **When a report survives a green measurement, the
next question is not "is the code wrong" but "does my number appear on screen".**

**And the simulation ranked two candidates the wrong way round.** `lava-lin.js`
models a candidate over recorded rows, which is right for choosing a rate cheaply
across six options, but it put the one-pole ABOVE pure linear on babble where the
drawn measurement put it below. Model to choose; measure the real thing to
decide.
