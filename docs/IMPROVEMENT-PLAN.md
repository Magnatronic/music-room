# Music Room — improvement plan, drawn from Sensium

**Written 2026-08-24.** Sensium (`SR1`) started by copying this project's
`framework.js` as the basis for its keyboard app. A month later Sensium has
things this project does not, and this is the plan to bring them back — ordered
against a **hard install date in the week of 2026-08-31**, in a room where
**accessibility switches are in use**.

Status key: 🔜 planned · 🚧 in progress · ✅ done · ❌ cancelled · ⏸️ deferred past the freeze

---

## Where things stand — 2026-09-06

**Phase 14 — Big Switch** ✅ **merged as `v1.18.0`, 2026-09-06** (`UAT-PHASE-14.md`), together
with a fix to Echo Bird's queued notes that came out of it. The second of the two apps the user named as weakest. Its problems were
judgements rather than faults, and all three were the same shape: **nothing happened when the
student was not pressing, and nothing accumulated when they were.**

- **The song builds a picture** — each press drops its note on screen, across by progress and up
  by pitch, so the tune draws itself. Ink 0.25% → 5.46% over twelve presses.
- **A slow breath at rest** invites a press in the one app whose whole interaction is pressing.
- **Patterns as well as songs** — Climbing, Falling, Chimes, Wandering, Bouncing. The user asked
  for these ("I am not musical") and they suit the app better than songs do: the student
  supplies the rhythm here, so material that depends only on pitch ORDER survives being played
  at any pace and has no wrong place to stop.
- **One press plays the whole tune** — the user's suggestion, and the Big Mack case the app is
  named for.
- **The full-screen flash is rate-limited to under 3/s — a SAFETY property**, after the user
  asked whether it "could be triggering". Measured: one flash is 0.037 of relative luminance,
  BELOW the 0.10 that defines a flash, but the rate was 6/s pressing, 10/s for a whole tune and
  10/s for the flourish, against a limit of three. Now 3 / 2 / 0, with every note still played.
  `Flash the screen on each note` turns it off entirely. Same call PHASE-9D made about Weather's
  lightning.
- **The giant note letter is off by default** — 38vh of text over the picture — and the
  **flourish now walks the student's own dots** instead of running an unrelated scale.

Both apps the user called weakest are now done: Echo Bird in Phase 13, Big Switch here.

**And the Big Switch reset fault generalised.** Echo Bird queued the bird's whole response on
timers while `stopConvo()` only set a flag, so changing the bird game or pressing pause left
the previous response playing on — 4 notes measured, 0 after the fix. Found by CHECKING whether
the reported fault existed elsewhere, not by waiting for a second report.

**Three faults in Phase 14 were found by LOOKING at a screenshot while every check was green:**
the flourish stacking dots at the right-hand edge, the phrase-mode picture drawing as a vertical
line, and Wandering clamping into a flat line. The last is the sharpest lesson — the check
asserted that Wandering only played pentatonic degrees, which a pattern that plays the SAME
pentatonic note sixteen times passes perfectly. **Membership is not movement.**

## Where things stand — 2026-09-06 (Phase 13)
**Phase 13 — Echo Bird's turn-taking** ✅ **UAT-passed ("bird is good") and merged, 2026-09-06.**
It was merged LATE, and that is worth recording: the user then opened the app from a branch cut
off `main` and found the mirror mode missing, exactly as they had earlier found Flow still in
the menu. **When they say it is good, that is the pass — merge it.** The user named Echo Bird and Big Switch as the two weakest apps. Echo
Bird went first because it had a **fault** rather than a judgement, and the fault was measured
before it was fixed: in Free mode the student's turn ended on a NOTE COUNT, so they got exactly
as many notes as the bird had played and were then talked over — a 1-note call gave them one
note. The turn ends on **silence** now (`Wait for me`, 1–8 s, default 2.5), and the bird still
waits forever for the first note.

**The user's own idea, and it is the better half of the phase:** "is it a good idea for the
bird to echo back what the user plays so it works in both directions?" Yes — being imitated is
the *accessible* side of call-and-response, and it opens the app to students who cannot copy a
call but can notice being copied. Built as a third mode, capped at 12 notes, and echoing the
student's own rhythm rather than quantising it. It needed the silence detection first, which is
why the two shipped together.

**Still open: Big Switch.** Its weaknesses are judgements rather than faults — at rest the
screen is dead so nothing invites a press, twenty presses leave no trace, and the only progress
cue is a 6 px bar at the top of the screen that a student looking at the middle never sees. The
proposal is that the song **builds a picture**: each press drops its note onto the screen,
coloured and placed by pitch, so the melody draws itself as the student plays it.

## Where things stand — 2026-09-06 (Phase 12)

**Phase 12 is DONE and merged as `v1.17.0`** — "all passed", 2026-09-06. Voice Visuals has
**eight** styles. What shipped: Lava's wax inertia (`v1.16.0`), bigger Fireworks with a
`Particle size` slider, a Mandala that draws at full size at full loudness, a Starfield that
flies through space, and the **LED wall** — the whole screen a grid of LEDs with the chase
running around every concentric rectangle, which is the user's own design.

**Two builds were thrown away and both are recorded rather than dropped:** travelling Waves
(13.2) and the six-pattern LEDs (13.8). The lessons are worth more than the code was — an
oscilloscope answers a new sound across 100% of the width in one frame where scrolling answers
across 4%; and six unrelated effects behind a slider is a menu, not a style.

**12.6 is CLOSED — every judgement on it is resolved.** The last one, whether the Fireworks
*fall* is interesting, was **judged fine as it is** ("fall speed is ok", 2026-09-06) and cost
no code. That is an outcome, not an omission: a judgement the user has answered is finished,
and reopening it would be re-asking a settled question.

**The through-line of the whole phase: the MEASUREMENT was the thing to fix first, five times.**
A metric blind to the shape of a rise; the radius measured one layer before the eye reads it; a
burst probe wrong three separate ways whose number reached a commit message; an instrumentation
line comparing pixels against a fraction; and a claim about a style's ink share that was
measuring randomly-placed haze. See [[measure-what-is-drawn]].

## Where things stand — 2026-09-06

**Phase 16 — a long press must not open a menu** (`PHASE-16-LONG-PRESS-MENU.md`), ✅
**UAT-PASSED on the touch projector 2026-09-06** — "all works" — and shipped in `v1.20.0`
(`UAT-PHASE-16.md`). The projector was the only machine that could settle it. A finger resting on a control
brought up Edge's context menu over the top of it — reported against the **menu items**, which is
why the fix is on the document and not the canvas. Windows' "press and hold" was already off and
irrelevant: Chromium synthesises `contextmenu` from a long touch press in its own recogniser, so
no OS setting reaches it, but a page can decline the event — and that keeps the fix on the USB
stick rather than in a policy to re-apply on every machine. It collides with this suite harder
than most because **holding is our vocabulary**: a sustained note is a held finger, unlocking is a
three-second hold, and a student with a motor impairment often has no brisk press to give. One
listener at the document, capture phase, beside the `dragstart` one that has been there for the
same reason. **`index.html` needed its own copy** — it does not load `framework.js`, so a
framework-only fix leaves the menu popping on the first screen a therapist touches; the
`midi_light` lesson, twice in two days. Allowed in the two fields you type into or copy out of,
by field **type** rather than tag, because `input` covers both the preset name and all six
sliders. 102 targets across 21 pages refused; the finger-to-event half cannot be driven headless
and is the user's test.

**A tap's height is its velocity, and in Chords that means MORE NOTES** — answered, not changed.
"Clicking at the top gives a bigger effect than the bottom… or maybe it was MIDI Light?" Both
halves right. A finger has no velocity, so height is it (`0.35+0.6y`); `chordFor` picks the chord
size from velocity, so the bottom of the screen gives 2 notes and the top 3 or 4. **MIDI Light is
the app they remembered**: a touch there is a fixed velocity of 96, measured 1 note at all five
heights. **Three measurements to see it**, and the first two said the opposite of the report —
lit area, then integrated brightness, both clipped by the screen edge and both measuring the
picture when the difference was in the SOUND. The control already exists (*How big the chord is*
→ *Always 3*), it is per student and rides in a preset, and which way it sits is the therapist's
call. `UAT-PHASE-16.md`.

**The folder is now the build** (2026-09-06, after `v1.19.0` shipped). The user asked for one
thing and the reason is the room: *"could we move all docs out the main folder, and apps no
longer used so it is easy to copy the files to go in the room."* Copying the software onto a room
PC meant picking 26 files out of 80, by eye, with 50 markdown files and three retired apps mixed
in among them — a job nobody should have to do twice, and one where the failure is silent until a
therapist clicks something that is not there.

**The top level is now exactly the build**: `index.html`, the 20 activity files the launcher
lists, `framework.js`, `framework.css`, `midi.js`, `songs.js`, `assets/` and `Music Room.cmd`.
Select all, copy, done. Everything else went one folder down — `docs/` (every `.md`), `archive/`
(Beat Builder, Conductor, Fluid Paint, delisted 2026-08-26, and the history bundle) and `bench/`
(`template.html`, `fx_lab.html`, `sound-test.html`). `CLAUDE.md` is the one exception at the top
level, because the tooling loads it from the project root.

**Two things the move broke, both fixed in the moved files rather than in the framework**: their
includes needed `../`, and the Home button needed repointing, since `framework.js` writes a
relative `<a href="index.html">` that resolves to nothing from a subfolder. Fixing that in
`framework.js` would have been one line and the wrong line — it is loaded by all 20 apps that go
in the room, and the fault belongs to the five pages that moved. **The gate walks all three
folders**, so it is still 27 pages and not 21: a page nobody launches can still be the page that
proves a shared file broke. 27/27 clean after the move.

**Phase 15 — one keyboard look, and colours that mix** (`PHASE-15-KEYBOARD-LOOK.md`), ✅
**UAT-PASSED by the user on 2026-09-06, merged as `v1.19.0`.** The ask was to standardise the
keyboard across every app that shows one, and the plan was cut twice by the user before any code
was written: five apps show a keyboard, not thirteen, and the row offers **three** looks, not
five — **🌈 Boomwhacker** (the physical instruments' colours at full strength, 3.39:1 to 12.55:1
against the background where the shipped keyboard was 1.12:1), **🌫 Muted** (the keyboard exactly
as it was) and **◐ Mono** (no hue at all, 16.19:1). `Lines only` and `Invisible` left the row;
both values still WORK, so the three apps that set `zoneLook:'off'` internally are untouched.

**Two attempts to separate neighbouring keys by dimming alternate ones were both wrong**, and
both were found by the user rather than by a gate. Alternating on the **column index** gave the
same note two colours — "bold is supposed to be boomwhacker colours!!!! Look at the C's" — and my
measurement had used a 6-key scale where no note repeats, so it could not see it. Alternating on
the **degree** fixed that and still failed: dimming a colour does not make a quieter version of
it, it makes a different colour with a different name. D is hue 28° and reads as orange; at 0.35
it is the same hue at 18% lightness and reads as **brown**. Nothing is dimmed now. Every key is
its own colour and a dark separator does the separating, which is also what makes it work for a
colour-blind student. **Mono takes the opposite of the background** rather than a hardcoded
white, so it reverses on a pale screen and a press **inverts** the key; its octaves are flat,
because a depth cue that is only a brightness step is a second signal in a look chosen for
having none. The letter shadow is gone from `.band .lbl` throughout.

**Colours MIX by default in all five MIDI apps** (the user's idea, and the sharpest observation
of the phase): a ramp palette took its colour from the note's position across the keyboard, and
the mark is DRAWN at that same position — so a note always painted the same colour in the same
place and a picture built through persistence came out "very samey, as they go in the same area".
The colour now comes from the hit's own random `hue`, which needed no new plumbing because every
event has carried one since Random was fixed to be per-hit. Built behind a toggle in MIDI Light
first, shown, and then made the default with the toggle removed at the user's word; `midi.js`
carried it to the other four in one edit.

**Persistence is a toggle** — "no persistence or 100%", because the fade did not look good in the
room — **and it shipped broken for the only people it could break for.** The switch draws itself
from `SETTINGS.persist` as a truthiness, so a therapist's saved slider value of 0.3 showed **ON**
while a `>= 0.5` threshold handed the drawing code 0: the switch said on, nothing was kept, and
toggling it off and on wrote a real `true` that finally agreed. Fine on every fresh profile,
broken for everyone who had ever used it. The threshold is the switch's own rule now, and
`probes/phase-15/agree.js` reads the two numbers directly — what the switch SHOWS against what
the code GETS — over five apps × eight stored values: **20 of 40 disagreed, 40 of 40 agree.** Two
earlier probes had reported them in agreement; one drove two drags on the same page and falsely
convicted MIDI Creatures, the other counted lit pixels and was structurally incapable of seeing a
threshold. **Changing a control's TYPE is a lifecycle change** and needs the inherited-value row
CLAUDE.md asks for — that row is the whole of this fault.

**Deferred, deliberately:** consolidating the 16 near-copies of the same four palettes, and
Sampler's pads still taking pitch-class colours although they hold recordings (Drums already opts
out). Both were on the plan and neither is worth touching the night before the software goes into
the room.

**Phase 12 — the Voice Visuals looks, one at a time** (`PHASE-11-LISTENING.md` §13), ✅ **UAT-PASSED
by the user on 2026-09-05 after THREE rounds, merged as `v1.16.0`.** The checklist is
`UAT-PHASE-12.md`. §12.6 left seven visual reports out of Phase 11 deliberately; this
phase takes them one at a time and shows each one, per §11.6. **First: Lava's jitter, which
§12.6 predicted was a fault dressed as a judgement, and was.** The blob radius followed the
band follower's 30 ms attack, so it moved 20.2% of itself inside 200 ms on a child babbling
(worst blob, p95) and reversed direction 27.1 times a second on a raspberry — now 5.4% and
1.3. A sustained hum measured 1.3% before and after, which is exactly why a listening app
tested with a sung note never showed it. The radius gets its own 0.35 s/0.8 s follower and the
luminance keeps the fast one; `updateBands` is untouched, because Mandala and the LEDs are
supposed to flash on the syllable. **Round two of their testing found the metric was
blind to the report**: "still jerky when detecting sound" is about the SHAPE of a rise, and a
200 ms-excursion measure scores a smooth ramp and a jump-then-flat identically. A one-pole
moves fastest on its first frame; the rise now takes whichever of a rate cap and a one-pole
moves less, and the biggest single frame on a clap is 12.71% → 1.84%. They also caught the
blobs *moving* instantly — `1+level*1.5` on the drift speed shifted 41% in one frame — which
is on the slow signal now. **Round three found the jerk was never in the radius at all**, from the user's own
observation that it depended on `Voice texture`: `conf` is raw NSDF confidence smoothed
nowhere, and the wax's near-opaque core is drawn at `0.6·e·R` with `e` following it, so
`defn` swung the full 0 → 1 between two frames and the **visible** edge moved 82% in one
frame while `R` moved 0.64%. Every probe here had passed the build, because every one of them
measures `R`. Mandala reads the same `defn()` and had the same fault. **The measurement, not
the code, has now been the thing to fix first three times in this phase.**
**The trade-off is contingency and it was the user's call**: a
clap's swell is +18% at 349 ms where it was +46% at 109 ms, and they accepted it on the
screen rather than on the numbers.

**The LEDs are now a WALL** (13.10): the whole screen is a grid, every LED belongs to a
concentric rectangle, and the chase runs around every one of them — the user's own design,
after they rejected the six-pattern build with "I don't like the mixture of styles". Six
unrelated effects behind a slider is a menu, not a style. `Spiral` sets how far each ring lags
the one outside it. 60 fps at 1920x1080 at every LED size.

**Starfield round three** (13.9): the vanishing point no longer tracks pitch — that was
disorienting AND it left part of the screen blank, because stars are born as offsets from that
point and the region it vacates never refills. Dust is 3x the rate and twice the size, and
stars take their colour from the palette so a theme change is visible.

**The sixth look, LEDs against WLED's repertoire, was BUILT and then REPLACED** (13.8). The
honest comparison: this style had three of WLED's effects running at once with no way to
choose. Six patterns now on the one strip — Strip + EQ (the default and exactly the shipped
look), Meteors, Sparkle, Fire, Rainbow run, Breathe. Every one selected, played into and
dragged across; all 15 pairs differ as pictures. Photographing them against a HELD hum found
Meteors empty for a sustained sound, which the error gate could not have caught.

**Starfield round two** (13.7): the halo the user photographed was three wide radial gradients
banding on an 8-bit canvas and is **deleted** — the fourth time this project has answered that
fault by removing the mechanism. The clump was fixed at its cause, where stars are BORN: 100%
of the width used now, 64% of a 16x9 grid lit. More stars, `Travel speed` can no longer be 0
(the user overruled 13.6's design), and rising sparks became Passing dust flying with the
field.

**The fifth look, a Starfield that moves through space** (13.6), ✅ **shipped in `v1.17.0`.** Every star has a depth and sweeps
past the camera; loudness is the throttle. Measured 0.0 stars/s at `Travel speed` 0, 8.6 in
silence, 142.9 on a loud hum, 285.7 at the top. **The slider reaching 0 is deliberate**: it
gives back exactly today's still sky, the dial-it-back that travelling Waves lacked. A claim
that depth scaling also fixed the sky emptying on a big canvas was measured false and
corrected in the code and the phase record.
**🌀 Flow was DELETED on 2026-09-05** at the user's request, part-way through a look at making
it bolder. Voice Visuals has eight styles. The inheritance row is the one that mattered and it
found a real inconsistency: `init()` clamped an unknown style to Mandala while the draw
dispatch fell through to Starfield, so a preset — applied after init — would have drawn one
thing while the chips said another. The clamp is in `frame()` now, and
`probes/phase-11/retired.js` drives saved settings, launch link and preset. The abandoned
boldness measurement had already refuted its own hypothesis (ink share 9.95% -> 9.76% across a
4x canvas, i.e. flat). A second claim from that measurement — that Starfield's sky empties on a
bigger canvas — was later **withdrawn**: it counted nebula haze placed at random, not stars.
See 13.6.
**The third look, Fireworks** (13.3), ✅ **shipped in `v1.17.0`**: bigger
explosions and a `Particle size` slider. `Burst size` scaled the count linearly but the speed
by `sqrt`, so its whole range moved a burst's reach by a factor of 1.75 and no setting filled
the screen; it is 3.6 now, and the default goes 0.245 -> 0.340. **The probe was wrong three
separate ways and one of its numbers reached a commit message** - see 13.3 - and a mechanism
built on that bad number was deleted after an A/B rather than kept.
**The fourth look, Mandala at full loudness** (13.4), ✅ **shipped in `v1.17.0`.** Arithmetic again, not taste: a band value is the average of its FFT bins, so a sung
tone's loudest band reads 0.69 and `v^1.5` compressed that further - at a student's loudest
the mandala drew at **half size**, using 0.588 of its permitted reach for a tone and 0.115 for
a hiss. Now 0.815 and 0.268, with a saturating gain so there is no flat top. The cost is
compressed dynamics (a half-loud sound goes 32% -> 56% of the full picture) and it is the
user's call. A steeper gamma to keep the contrast was tried and rejected on the measurement.

**The second look, Waves travelling horizontally, was built, measured, shown and REJECTED**
(§13.2). It did what it was built to do — measured travel 0.422 screens/s against a designed
0.417 — and the user preferred the oscilloscope: *"don't like it. drop it."* The reason is
worth keeping. An oscilloscope answers a new sound across **100% of the width in one frame**;
scrolling makes that response local to the right edge, about **4% of the screen in the first
100 ms**. Persistence was bought with immediacy, and in this room immediacy won. The branch
`phase-12-waves-travel` is kept unmerged; `main` keeps the oscilloscope.

**Five looks from §12.6 are still open** and are the next work on this app, taken one at a
time: Fireworks size and a particle-size slider, whether the Fireworks fall is interesting, a
stronger Mandala at full loudness, Waves travelling horizontally, a bolder Flow, LEDs against
WLED's repertoire, and a Starfield that moves *through* space.

**Phase 11 — listening properly** (`PHASE-11-LISTENING.md`), ✅ **UAT-PASSED by the user on
2026-09-05 after FOUR rounds of their testing, merged as `v1.15.0`.** The checklist is
`UAT-PHASE-11.md`. Four rounds found seventeen faults between them, and the two that took
longest to find were both found by the user noticing something on screen rather than by any
measurement of mine: a photograph of grey streaks that turned out to be 8-bit rounding, and
"the centre pulses but the ring doesn't", which localised a fault to the one span I had not
instrumented. **Six visual judgements were deliberately left out of the phase** and are listed
in §12.6 — they are the next piece of work on this app, taken one at a time.

**Round 3 (2026-09-05, §12): eleven reports, four faults, and two of my own hypotheses
measured dead before any code was written.** The one that matters most is the room reading.
"It says the room is noisy but it isn't" turned out to be the warning reporting the *input*
rather than the room: `FLOOR_MAX` was −25 dBFS, so rooms measured at −24, −20 and −16 all
came back as the **same** floor, and at −16 that is 9 dB wrong — the gate sits open on the
room alone and the level averages 0.35 with nobody making a sound. A hot microphone and a
noisy room need opposite advice, and the message was giving the wrong one (*"move the
microphone closer"* makes a hot input worse). The clamp is now −15 and the warning splits at
a −30 dBFS floor, which no room a person would sit in reaches.

**The ghosting the user photographed is arithmetic, and no value of `fade` could ever have
fixed it.** `rgba(bg, fade)` on an 8-bit canvas is `dst = round(dst × (1 − fade))`, which
stops moving as soon as `dst × fade ≤ 0.5` — a permanent residue of `floor(0.5/fade)`, and
anything under 0.5 never reaches zero while 0.5 erases the trail it exists to draw.
Measured off screenshots, Ripples ended ten seconds of silence with **90% of the screen**
holding a stalled ghost of every ring ever drawn; the only two clean styles were the two
already hard-clearing. Every style now clears, and the two whose trail *was* the residue
(Flow, Fireworks) carry their own path. **Third time this project has answered a
compositing fault by deleting the mechanism** — Soundscape's glow, §11.3's afterglow, now
the fade.

**Three hypotheses died in the harness, one probe reproduced the symptom while measuring the
wrong thing, and one of my own conclusions was wrong until the user corrected it.** The floor
does *not* drift (0.1 dB over 40 s of live clapping). And "Ripples misses every second clap"
**is real** — §12.8. I closed it on "40 onsets from 40 claps", but an onset is not a ring:
`drawRipples` gates it again on the `Wave rate` slider, and at ×0.30 that gate is 0.67 s, so
24 claps 0.6 s apart give 24 onsets and **12 rings**. The user found it by noticing the centre
glow pulsing when no ring appeared — the glow passes neither gate, which localises the fault
exactly. **Counting an internal event proves the internal event, not the app.** The slider now
prints the gap it imposes in seconds rather than a multiplier of an invisible constant, which
is §11.4's `Fine trim → Range` lesson arriving a second time.

**Round 4 deleted that gate altogether** (§12.9). Driven with the sounds it was written for —
a raspberry bursting every 71 ms, a babble, a sustained hum — it changed **nothing**: 0.06,
0.08 and 0.07 rings/second at 1.33 s, 0.20 s and 0.07 s alike, because `onset()` already
requires a transient and carries its own refractory. The only signal it affected was
deliberate clapping. **A guard added for a hypothetical case is a hypothesis, and this one
shipped through four rounds without once being driven with the case it named.** Also in round
4: the ring was sized from the smoothed display envelope, so identical claps drew different
rings depending on the gap before them (0.46 / 0.71 / 0.61 / 0.51) while the instantaneous
level read 1.00 for all of them — and loudness barely moved the ring at all, spread 0.05
where it is now 0.40. The centre glow, which is the *only* thing answering a student too
quiet to make a transient, was linear in level and is now lifted at that end. Also fixed: a tap was quietly weaker than a shout in every style, and the
straight line across Waves was a hard clamp biting at level 0.61 for a clap (0.23 in a hot
room) because an RMS ceiling was being applied to instantaneous samples.

**Still open — six judgements about how the styles look**, listed in §12.6: bigger
explosions and a particle-size slider, Mandala at full loudness, Lava's jitter, Waves
travelling horizontally, a bolder Flow, LEDs against WLED's repertoire, and a Starfield that
moves *through* space. Built one at a time and looked at, per §11.6.

**Rounds 1 and 2 (2026-09-04, §11).** Seven reports, six real faults. Two claps close
together made one ring and repeated loud sounds made no firework — one fault, the transient
being read off the 350 ms release envelope the drawing uses. `getUserMedia` was measured
resolving once at 4.2 s and twice not at all, the same never-settling promise Phase 9c had
declared this file safe from; the wait now escalates and a second tap starts a fresh
attempt. The Fireworks afterglow was deleted rather than tuned. The microphone settings
moved from `Setup → Access` to the 🎤 Voice tab, which for a listen-only app is where the
sound is.

**The original four steps.** The user asked for a look at how Voice
Visuals analyses sound. Lifting its functions out of the file and driving them with
synthetic voices found six measured faults, and two of them failed hardest on the students
the app exists for: the pitch detector was wrong by an octave or two in **5 of 14** cases —
a child squealing at 700 Hz read as 100 Hz, sending the screen to the *bottom* of the
palette — and `onset()` compared two *frames* rather than a rate, so the level needed to
fire a firework ran from **0.29 at 24 fps to 0.99 at 165**: the same sound, a different
room PC, a different app. Also: exactly 26.0 dB of loudness range whichever sensitivity was
picked, the top 12.5% of every palette unreachable, no room calibration at all, and the
bottom third of the Mandala unresolvable from a 2048-point FFT.

Step 1 rebuilds the listening block — high-pass, a second 8192-point analyser, decibel-domain
level over a **measured room floor that is deliberately never stored**, MPM pitch, and a
frame-rate-free onset. No draw code changed. **The interesting decision is §2.2:** a noise
floor is a fact about the room today, not about a student, so storing it is what would let one
therapist's quiet afternoon leave the next student unheard — the Phase 7 lesson, landing on a
different quantity. **The interesting mistake is also §2.2:** the rule that the floor may fall
freely but rise only in silence is a deadlock, because a floor set too low holds the gate open
and forbids its own correction. The probe found that; the document did not.

Step 2 puts it in front of the therapist: `Setup → Access` now says *"Hearing −26 dB · room
floor −53 dB · range 28 dB"*, names a room too noisy to work in, and has a **🎧 Listen to the
room** button. Extra boost is retired for a Fine trim in decibels, and **Voice range**
(Wide / Adult / Child / Auto) decides which colours a given student can reach at all.

**Six probe assertions were wrong before any code was**, and `probes/phase-11/README.md`
lists each — including a run that outlived its WAV and read Chromium's fallback beep as a
loud tone, and a stale `#panel` selector (there is no `#panel`; the `verify` skill said there
was, and is corrected) that reported five on-screen controls missing.

**Phase 10 — presets you can carry off the machine** (`PHASE-10-PRESET-BACKUP.md`),
**UAT-passed and merged as `v1.14.0`**. IT asked where presets and recorded samples are
stored; the answer is this browser profile's `localStorage` and nowhere else, and it
exposed a gap — the Sampler could already export its recordings to a file, presets could
not be exported at all, so *clear browsing data* or a reimaged PC took every saved setup
irrecoverably. Export now writes **every app's** presets into one file and import **merges
without ever deleting**: identical is skipped (so a second import is a no-op), a clashing
name arrives as `name (2)`, and nothing on the machine is overwritten.


**`main` = `v1.15.0` — Phases 9b–9g, 10 and 11, all UAT-passed by the user and
merged.** The rest of this file is the historical record, newest entries
near the top of each series. Read this block first. Counts of "17 apps" further
down are the record of what was true then, not errors.

**23 activity files, 20 on the launcher, 27 pages.** Five MIDI apps under *Plug
in an instrument*: MIDI Light, Big Chords, Loop Garden, Drift and Mirror. **MIDI
Weather was built, polished and then DELETED** at the user's request on
2026-09-01; it lives only in git history.

**What the six rounds of the user's own testing actually produced.** Twenty-six
reported items in the first round alone, and **nineteen of them came from six
shared causes** — additive blending that summed to white, no way to hold or
linger a picture, four apps five times quieter than the other two, a Silence
button that did nothing in three, a silent `end()` that skipped cleanup and left
Big Chords sounding for ever, and a sea that multiplied absolute time by a
changing rate. That ratio is the lesson: **the faults were in the shared code and
the per-app symptoms were how they showed.**

**One open item that is not ours.** The machine's audio device is misbehaving
again — `AudioContext encountered an error from the audio device` at random, and
an oscillator's `onended` not firing, which leaves `soundingVoices` climbing. It
reproduces in `drums.html`, which has no MIDI code, and `framework.js` is
untouched by this phase. **If `onended` genuinely stops firing on the room PC the
automixer holds the gain down and the app gets quieter over a session** — the
first plausible user-visible consequence this fault has had. See
`investigate-audio-stall` and the memory note.

**Everything planned for the install has shipped.** The install week is now.

**Phase 9g — the fourth round.** The menu prose is cut back across all five apps (the longest
was 397 characters) and the stale "Keep what is drawn" sentences go — the slider had been renamed
a round earlier, the sentences under it had not, which is what a screenshot caught. Chords'
Sparks radiate from the point, and their odd motion had a cause: distance came off a `grow` ramp
that finished in a fifth of a second and then handed over to a linearly growing term — fast, an
abrupt change of pace, then constant. **Loop Garden paints only the NOTES**: each smears back
along the loop as the sweep goes over it, the rings and the hand are drawn after the stamp so
they can never build into the picture, and the wake setting is gone — the picture had been of the
mechanism rather than of the playing. Drift's fourth pass fixed the streak flicker (the speed cap
clipping a velocity that changes every frame), made Togetherness and How many bite, put a floor
under the mark, and made **Embers** something other than a second Murmuration. Mirror's line can
run across or down.

**Phase 9f — the third round.** MIDI Light's Fireworks fountain spawned at `PY(ev)*0.5`, so a
held note fountained from a second point below the burst. **`heightOf` could not reach the floor
of the screen**: `pow(f,0.75)` raised quiet notes on top of a 0.10 floor, so the bottom quarter
was unreachable however softly anyone played — now `0.03+0.94*pow(f,1.35)`, and it is shared, so
every app gained the bottom of its screen. Big Chords' glow was the picture and is now capped.
Loop Garden's wake did not work twice over (inside the track block, and drawn as rays 66 pixels
apart at the rim) and now paints with Persistence on all four shapes. **Drift took three passes**
— the animals, then the size, then finally the behaviour: a note hatches a swarm that flocks, and
the four looks are four renderings of it, borrowed from `flock.html`. The verdict that landed it
was "just circles in slightly different forms", which was exactly right.

**Phase 9e — the second pass, and Weather deleted** (`UAT-PHASE-9D.md`). The user began testing
9d and sent a second list. **MIDI Weather is deleted at their explicit request** — the file, not
just the launcher tile: they did not like it. It is recoverable from git history. That also
retires the photosensitivity fix, which was Weather's alone. **27 pages, 20 on the launcher.**

Big Chords loses **Arcs** for **✦ Sparks**, and changing the look now clears the kept picture —
persistence was showing the old look's marks underneath the new one, which read as two things
being drawn at once. Loop Garden puts **how hard you played** on the radius rather than the
note's place in a still-settling range (pitch is the colour), the sweeping arm reaches the edge
of the screen and can leave a wake, and Ribbon's Height becomes **Lean**. Drift goes small: every
look is made of **points**, the base mark is a quarter of its old size, and `blob()`/`body()` are
deleted — abstract was necessary but not sufficient, and anything that grew large looked tacky.
Two palettes that **do not run to white** answer why a kept picture drifts pale. "Keep what is
drawn" is renamed **Persistence**, which is what MIDI Light always called it.

**Phase 9d — what the UAT found** (`PHASE-9D-MIDI-POLISH.md`). The user played the five new
apps and reported twenty-six things. **Nineteen came from six causes**, every one of them in
shared code or in all five apps at once, which is the finding that made this one phase rather
than twenty-six patches: everything was drawn additively so everything summed to white; no app
could hold or linger a picture; four apps were five times quieter than the two that hold voices;
🔇 Silence was a no-op in three; `end(id,silent)` skipped `onRelease` so Big Chords never
released its own voices; and Weather's sea multiplied absolute time by a rate that changed, so
one note shifted the wave thirteen cycles after ten minutes — **which is why a thirty-second
check never saw it, and a therapist with the app open for a session would see nothing else**.

**The lightning was taken on its own, before the rest.** A full-screen additive white `fillRect`,
retriggerable about twice a second with no rate limit, in a suite for a room where a student's
history may not be known — and hard playing is precisely what the storm sky rewards. Now a forked
bolt with the glow capped and centred on the strike, held to one strike per 1.1 s. Measured under
six seconds of continuous hard playing: 0.67 Hz, shortest gap 983 ms, 3.0% of the screen above
L=140 at its brightest. **That is a safety property, not a look, and neither number is tunable.**

Also: Mirror mirrors (its answer took the transposed note's column, `y=0.5` always and a
`Math.random()` hue — three ways of being unrelated to the thing it answered); Orbit's seeds meet
the top marker they had been ignoring; a touch lands under the finger anywhere on Loop Garden's
canvas rather than snapping to the rim; the stars fade instead of switching off at the fifth
note; Creatures becomes **Drift** and stops being animals; rain has depth; spray is thrown and
falls; Bloom is no longer the Wheel with more blobs on it; and Mirror's Trace becomes **Wave**,
one curved line per side, which is what makes the mirroring legible.

**Phase 9c — the connect that never answers** (`PHASE-9C-MIDI-CONNECT-WAIT.md`).
The user's MIDI stopped connecting; the pane sat on *"Asking for permission…"* and stayed
there, and a PC restart fixed it with no code change. The message is set immediately
before `requestMIDIAccess` and cleared only when the promise settles — so the promise
**never settled**, the `.catch()` never ran, and with no timeout the app waited for ever
while saying something that reads as normal progress. That is a fail state, which the
non-negotiables do not allow. **A pending request looks identical whether the permission
prompt is unanswered or the OS is wedged**, so the fix escalates the wording with time and
never declares a cause; a second press starts no second request and shows the escalated
advice at once; and the `.catch()` stops reporting every rejection as a refusal. The
restart is named in the message because it is what actually works on this machine — for
this and for the audio stall. **The same bug lived in two files**: `midi_light.html`
predates `midi.js` and duplicates its reader, and four docs saying "all six share
`midi.js`" nearly turned a two-file fix into a one-file one. Those docs are corrected.

**Phase 9b — the five MIDI prototypes become apps** (`PHASE-9-MIDI.md` §10). Big Chords,
Loop Garden, Creatures, Mirror and Weather join MIDI Light under **Plug in an instrument**;
Pulse was discarded. Five of them share **`midi.js`**, a top-level file loaded after
`framework.js` the way `songs.js` is shared by four song apps — the reader, the
note-to-column translation, and the menu blocks the six have in common, so they cannot
drift apart in wording (MIDI Light predates the file and keeps its own copy —
see Phase 9c). **A change in `midi.js` is five changes**, so it joins
`framework.js` under the design-doc trigger. Each app carries four looks with three
parameters apiece and nothing on its panes that does not apply to it. The rule that had
to be re-learned once per app: **a touch lands where it is touched** — Loop Garden was
inverting a round wheel in fractions of width and height, Big Chords grew its tower from
the foot of the screen, Mirror stepped a finger-placed mark off the line. **Awaiting the
user's UAT.**

**Phase 9 — MIDI, a physical way in** (`midi_light.html`, `PHASE-9-MIDI.md`), tagged
`v1.12.0`. Plug any MIDI instrument in and play it. What is different about it is not
two players at once — the framework has taken five touches since Phase 0 — but that the
two are at **different surfaces**, so a student who cannot reach the screen can still
play. The rule that makes it work with hardware nobody here has seen: **a note's own
LENGTH decides whether it is an impact or a sustain, not the device it came from** — so
the classification is a hint on the pane and never gates behaviour. It finds its own note
range and pulls every note into the Notes tab's scale, and it needs no framework change,
because a snapped note is a scale degree and the framework's notes are scale degrees.

**v1.11.0 — the room build, 2026-08-31.** The milestone at which every app has been
driven by the therapist who will use it and the faults that survived that are fixed.
Soundscape's canvas no longer keeps a ghost, `Slider colours: Off` means off, Bold and
Soft differ, the slider gradients are smooth, and the drone/deep water/space hum are
fields of static rather than a radial that could not be stopped banding. Voice Visuals'
ripples keep time: one clap, one ring. See `APPS.md` for each, and the corrected
measurement block further down this file.

**Phase 8 — Sound Match, a memory game** (`sound_match.html`), the first NEW APP since
the framework was built rather than a change to it, UAT-passed and tagged `v1.10.0`
on 2026-08-31. On the launcher under Songs & Games; `UAT-PHASE-8.md`.
**Four rules it establishes that the next app should inherit:**

- **A tap belongs in `Anim.splat`, not on a DOM element.** The cards are DOM but carry
  no click handler, because the gamepad pointer and the mouse dwell inject coordinates
  rather than dispatching DOM events. `opts.velScale === 0` is the press and nothing else
  is — onDown passes 0, the render loop always passes more (PHASE-4I). One entry point
  reaches a finger, a mouse, a dwell and a stick, and a drag turns nothing over.
- **A pane must not offer a control the app cannot honour.** The first cut left the standard
  Notes and Visuals panes in place, so a therapist was offered a number-of-notes slider that
  fought the board, a Y-axis row this app never reads, and paint trails for an app that paints
  nothing. `buildInstrument` and `buildVisuals` now build both from what is actually there;
  `appendTuning` keeps the three Notes rows that do apply identical to every other app.
- **An overlay must set `pointer-events:none`.** The framework's mouse and touch listeners are
  on `canvas`, and a full-screen board on top of it swallowed every real click — while the
  gamepad and the dwell, which call `onDown()` directly, kept working. **Every test had
  synthesised the press, so all of them passed on an app no mouse could play.** Drive the
  gesture the user described.
- **An app substituting its own tuning callback must still call `refreshMusic()`.** Passing
  `appendTuning` an app callback and nothing else left Register, Scale and Starting note
  writing `SETTINGS` and stopping there — `NOTES` was never rebuilt, so the pane looked live
  and the game never moved, while the callback re-dealt and destroyed the board. Both halves
  from one missing call.
- **When a fault cannot be reproduced in the harness, DELETE THE MECHANISM.** The card flip
  used `transform-style:preserve-3d`, and on the user's GPU it drew compositor tile seams
  across the cards. Three patches — a z separation, fading the back out, `will-change` —
  each fixed the case in front of them and left the class of fault alive. It is a 2D squash
  now and the whole class went with it. **Playwright runs a software rasteriser: a detector
  written for that exact artifact passed on the broken build.** Now in
  `.claude/skills/verify/SKILL.md`. A green run against a bug the harness cannot see is not
  evidence, and saying so is part of the report.
- **`Anim` is told about presses, not releases.** The prototype's press-and-hold "peek"
  could not be built, and rather than add a DOM listener only a finger could reach,
  re-listening became a second tap that takes your choice back. An `Anim.onUp` hook would
  be a framework change and needs a design doc; nothing has needed one twice yet.

**v1.9.0 — the reach area** (`PHASE-7-REACH-AREA.md`), UAT-passed 2026-08-31. The
whole activity mapped into a rectangle a student can physically get to: `Setup →
Reach area`, a Size slider and a drag. It is four numbers changed in `fitSurface()`
and **no app was touched**. Two things about it are worth knowing before working on
anything nearby:

- **It is the one exception to "locked is pixel-perfect"**, which `CLAUDE.md` now
  states that way. Nothing else may claim it.
- **It never survives a page load**, unlike every other student setting, because it
  describes where a chair is today rather than what a student is like. A launch link
  or a preset restores one deliberately; a shared room PC can never inherit one.

| open | what |
|---|---|
| **On the room machine** | Push **Slime**, **Fluid Paint** and **Fluid Keys** to maximum with `Setup → Show performance` on. The per-element canvas audit cleared every Canvas2D app, but the three WebGL ones **cannot be benchmarked headless** — Playwright runs them on swiftshader, which measures a software rasteriser rather than the room's GPU. This is the only performance question left. |
| **Optional** | The schema `group:` field for the five visual apps — one small framework addition plus five array edits. The cheap half of the pane-grouping sweep that was dropped. |
| **The user's call, not a tidy-up** | Conductor's `Motion sensitivity` / `Seconds of stillness` are *input* settings, and `Setup → Access` is their home. |
| **Watch only** | The audio stall. Quiet since 2026-08-26; nothing to do while it stays quiet. `AUDIO-STALL-INVESTIGATION.md` on branch `investigate-audio-stall`. |

**Cancelled by the user — do not re-propose:** Phase 3 (presets) and the 17-pane
grouping sweep. Both have their reasoning recorded where they sit, together with
what dropping them costs. `PANE-GROUPING-PROPOSAL.md` and
`prototypes/panel-groups.html` are kept so reopening the second costs nothing.

**Four rules from this week that generalise beyond the changes that produced them:**

1. **A workaround that listens for a *device* rather than for the framework's own
   event silently excludes every student who does not use that device.** Dwell and
   gamepad presses are synthesised and dispatch no DOM event (Phase 4i).
2. **Any new path that clears `SETTINGS.locked` must call `lockReleaseFullscreen()`**
   (Phase 4h).
3. **`ctx.shadowBlur` per element is dangerous because of the element COUNT, not
   the technique.** Thousands of cells, yes; fifteen bars, no.
4. **Drive the gesture the user described before believing a measurement of a
   different one.** Two correct fixes shipped for the wrong fault before the
   reported gesture was reproduced.
5. **"Inherited by the next user of a shared machine" is a lifecycle row**, and it
   belongs beside replacement and duplication as one that gets forgotten. Phase 7's
   design doc had every other row and not that one, and that is precisely where its
   fault was. Ask it of anything stored on a room PC.
6. **A derived visual belongs where the value is READ, not at every place it is
   written.** Phase 7's black surround was first wired to the two controls that
   change the setting; a screenshot taken through neither showed the stale paint
   that invites. Driving it from `fitSurface()` — which already reads the value —
   made forgetting impossible.

---

## 0. The premise correction — the sound engine has nothing to give back

The obvious assumption is that Sensium improved the audio. **It did not.**
`apps/sound.js` was harvested from `framework.js:238–636` and refactored; every
sonic property came across unchanged, and nothing was added:

| | `framework.js` | `apps/sound.js` |
|---|---|---|
| 12 voices; 2-op FM tine; modal marimba/kalimba; layered-harmonics harp | `:246` | same table |
| Brightness / Attack / Ring macros | `:343` (`tone`) | same, `brightness` |
| `latencyHint:'balanced'`; keep-alive noise floor; gated FX sends; soft-knee limiter; polyphony auto-mixer | `:355–428` | same |
| 12 ms scheduling headroom; release on the articulation node; pluck re-strike | `:431–636` | same |
| Chorus | present | cut |

Sensium's version is smaller because it is **decoupled** — no global `SETTINGS`,
no `freqForX()` baking "X across the screen = pitch" into the audio layer. That
is a real improvement *for a library that has to drop into any page*. It is not
an improvement anyone can hear, and applying it here means surgery on the one
file all 17 apps depend on, days before an install.

**Decision: do not touch the audio engine.** Two optional carry-backs, neither
on the critical path:

- The **voice editor bench** (`sound-test.html` + `Sound.defineVoice`) — live
  sliders, hold-to-A/B against the saved voice, and an export that emits a
  paste-ready `VOICES` entry. Pays for itself whenever voices get tuned.
- The **palette observations** (`SR1/docs/PHASE-E-SOUND.md:208`): `bell` and
  `epiano` carry no `pluck`, so their fundamentals ring indefinitely — plausibly
  deliberate, worth *listening to* rather than assuming wrong. And the set has no
  breathy/wind timbre and no struck metal (gong, singing bowl).

The `WHY:` comments in `sound.js` were checked one by one against
`framework.js`: every explanation is already here, in different wording. There is
nothing to back-port.

---

## 1. What is actually worth porting

| | Sensium | Here today |
|---|---|---|
| Switch / keyboard access — `direct` · `scan` · `next` | `shell.js:199–352` | absent |
| Gamepad / Xbox Adaptive Controller | `shell.js:254`, `trigger.js:255–310` | absent |
| `--ui-scale`, one therapist dial (0.8–1.5) | `shell.css:18` | absent; sizes hard-coded |
| Token set + contrast floor | `UI-STYLE-GUIDE.md` §3 | `:root{--accent}` only |
| Rail + strip, no drawer, no modals | `shell.js` §3 | rail + **overlay** panel + Fine-tune drawer + 3 modals |
| Undo instead of confirm | `shell.js:1264` | preset delete is silent and final |
| Initials-only preset names | `PHASE-E-SOUND.md:541` | placeholder names a student |

### What must NOT come across

- **Sensium's `shell.js` wholesale.** It has no render loop, no WebGL, no perf
  autoscaling, no theme/style vocabulary, no idle sleep. Adopting it is a rewrite
  of 17 apps against a different hook contract. `framework.js` stays the shell;
  ideas and code fragments come to it.
- **The controller preset store** (`/presets`, `data/presets.json`). Music Room is
  offline `file://` by construction. The *safeguarding rule* and the
  *shell/app split* travel; the HTTP layer does not.
- **`trigger.js` as a file.** Its `<source>:<code>` token vocabulary exists to
  feed Sensium's rule engine, which has no counterpart here. Lift `pressedCodes`
  / `watchPads` / `padCount` (~60 lines) into `framework.js` and leave the rest.

---

## 2. Phase order

**Revised 2026-08-24 after the user's challenge, and they were right.** The first
cut of this plan put switch access first and deferred "the UI rework" wholesale
to after the freeze. That treated the rework as one indivisible thing. It is not,
and the split matters, because **the switch controls have nowhere to live until
part of it is done.**

### The rework is four parts, not one

| | Files | Risk | Switch work needs it? |
|---|---|---|---|
| **a.** Tokens, contrast, 64px touch floor | `framework.css` only | near zero | helps |
| **b.** A **Setup pane** + plain-English labels | injected HTML `framework.js:15` + `PANE_BUILDERS` + `PANE_IDS`, ~20 lines | low | **yes** |
| **c.** Kill the Fine-tune drawer; one control per row | panel builders + the 12 apps calling `appendFineTune` | ~~medium~~ **low, and there were two drawers** | no |
| **d.** Rail + strip that **insets** the play surface; widget registry | framework + every app's `resize` | high | no |

Only **d** is genuinely expensive, and for a specific reason: `#panel` is
`width:min(460px,46vw)` and **overlays** the canvas today
(`framework.css:71`). Turning it into a strip that takes width from the play
surface changes the canvas dimensions every app lays out against. That is the
17-app part, and it is the wrong side of a hard date.

**Where the no-overlay principle buys less here than in Sensium:**
`applyLock()` sets `ui.style.display='none'`, so during student play there is no
chrome and no overlay at all. The overlay only bites when a therapist adjusts
mid-session with a student playing — real, but the lesser case. What actually
makes this hard for a therapist to use is in **a**, **b** and **c**:

- `.sectn` — the section labels you navigate *by* — are 11px uppercase at **0.35
  alpha**. The least legible thing on screen is the wayfinding.
- `details.finetune summary` is 12px at **0.45 alpha**, and it *hides* settings
  behind a disclosure a therapist under time pressure will not open. *(Phase 1
  made it legible; Phase 4c removed the disclosure altogether.)*
- Every control is under the 64px floor (see Phase 1).
- There is no home for an access setting.

### Order

Switches are in use, the date is hard, and the freeze is early. So: the cheap
half of the rework first — it is what makes the switch work land somewhere a
therapist can find — then the switch work, then the rest of the rework as slack
allows.

### Phase 0 — baseline ✅ (2026-08-24)

Nothing ships blind.

- Fix `.claude/skills/verify/SKILL.md` — it points at `file:///C:/Coding/
  MusicTherapy/`, a path that no longer exists. Correct it to this folder.
- Run all 17 apps headless; collect `pageerror` and console errors; record them.
- Fix the stale `README.md` status table: it lists Chord Strummer, Voice Visuals,
  Sampler Pads and Soundscape Mixer as *Planned*, and omits the seven apps built
  since. `APPS.md` is the accurate one.

**Acceptance:** every app opens from `file://` with a clean console, and the
README table matches `APPS.md`.

#### As built

**All 20 pages load clean — 0 errors, 0 warnings, 0 failed requests.** Every
`.html` in the folder was opened from `file://` in headless Edge, given a tap the
frame loop can see (down · move · up across frames), and watched for
`pageerror`, `console.error` and `requestfailed`. That is a better starting
position than assumed, and it means any error appearing in Phase 1 or 2 is one I
introduced.

Two findings worth keeping, both recorded in the verify skill so a later run does
not re-investigate them:

- **`soundingVoices` counts fading tails**, not audible notes (`framework.js:244`).
  A reading of 1 shortly after release is the ~1.75 s release tail completing.
  Sampled at +5 s, Fluid Keys, Sweep Chimes, Song Grid and Flock all reach 0.
- **Conductor legitimately holds a voice at rest**, and stayed at 1 at +5 s.
  `buildVoice()` (`conductor.html:100`) keeps a sustained oscillator alive and
  drives its *gain* from motion, silent at 0.0001 — so movement can resume
  without a click. Not a leak, and not to be "fixed".

Apps reporting no audio context on a bare centre tap need an input the harness
cannot give: `voice_visuals` (microphone), `sampler` (a pad must be recorded),
`beat_builder` (a step must be filled). `index` and `fx_lab` have no audio by
design.

**Three stale things fixed**, two of them beyond the planned scope:

- `.claude/skills/verify/SKILL.md` pointed at `file:///C:/Coding/MusicTherapy/`.
- The same skill documented `page.click('#collapse')` to open the menu.
  `#collapse` was removed in the 2026-07 UI pass; the tabs are
  `.bbar[data-mode=…]`. A verification skill that cannot open the menu is worse
  than none, so it was corrected rather than noted.
- `README.md` described **9 voices**; the palette went to 12 in the 2026-07
  expansion (`APPS.md:41`). The status table listed four built apps as *Planned*
  and omitted seven others; it is now grouped as `index.html` groups them, with
  `fx_lab` marked a bench and `voice_play` marked cancelled.

### Phase 1 — legibility, touch floor, and the Setup pane ✅ (2026-08-24)

**Parts a + b.** The phase that makes the tool easier for a therapist, and the
one the switch work depends on. No app file is touched.

**a — tokens and contrast.** Measured against the style guide's floors,
`framework.css` (217 lines) is below them everywhere:

| | now | floor |
|---|---|---|
| slider thumb | 34px | 64 |
| switch | 64×36 | 64 |
| swatch / picker / bgpick | 44×44 | 64 |
| chip min-height | 50px | 64 |
| `.sectn` section labels | 11px, 0.35α | 14px, 0.72α |
| `details.finetune summary` | 12px, 0.45α | 14px, 0.72α |
| body & value text | 13–14px | 14 xs / 17 m |
| value text alpha | 0.5 | 0.72 |
| "No presets saved yet" | 0.4 | 0.72 |
| track & border alpha | 0.15–0.20 | 0.30 |

Introduce `--ui-scale` and the token set, then express every size through them.

**b — the Setup pane.** Add a fifth pane to the vocabulary: edit the injected
HTML string (`framework.js:15`), `PANE_BUILDERS` and `PANE_IDS`
(`framework.js:1118`). It holds **Control size** (`--ui-scale`), Performance
quality and Reset — pulled up out of the Fine-tune drawer — and in Phase 2 it
gains the access controls. Copy Sensium's therapist-language labels rather than
inventing new ones; the naming *is* the usability.

**Acceptance:** at `--ui-scale: 1` no in-panel control is under 56px and no text
under the contrast floor; at 1.5 nothing overlaps or clips in any of the 17 apps;
at 0.8 everything is still legible; Setup opens from the rail in every app and
Control size visibly changes the panel.

> **A correction to this plan's own criterion.** It first said "nothing under
> 64px". That is wrong, and copying it would have cost ~14% more vertical growth
> than needed. Sensium uses **56px for every control in a panel** and reserves
> **64px for standalone targets** — buttons, list rows, a drawer head — with an
> explicit note at `shell.css:309` that a 64px stepper towered over the 56px
> chips beside it and the two read as different classes of control. Both floors
> are now in the token block as `--control` and `--target`.

#### As built

**Everything measured before it was written.** Four things came out of that, and
three of them changed the design:

**1. The panel had almost no headroom, and 56px controls would have blown it.**
Measured across 5 apps × 4 panes × 3 screen sizes: panes fit today with 7–36px to
spare, and the Sound pane already overflowed at 1366×768. Raising controls to
56px alone pushed *six of eight* sampled panes into overflow at 1920.

**2. The guide's two-column chip rule does not transfer, and the measurement is
why.** Sensium mandates a fixed 2-col grid because at a 420px strip its longer
labels leave ragged rows. Here the labels are short (note names, Low·Middle·High)
and the panel is 460px, so flow-wrap already packs 3–4 per row. Forcing two
columns made every pane **20–60% taller**. Chips stay flow-wrapped, and
`framework.css` records why so it is not "fixed" later.

**3. What actually paid for the height was capping long chip groups.** The Sound
pane's outlier was two big groups; `rootOptions()` turns out to return only the 7
naturals, so **Voice (12) was the real wall**. Capping groups over 8 to 4 plus an
"All N ⌄" expander brings every pane back inside a 1080-high screen — song_grid's
worst pane ends up *shorter than it is today* (963 → 953px), and Fluid Keys' Sound
pane drops from 629 to 583. The threshold sits at 8 so the 7-natural groups stay
whole.

**4. The rail broke at 1.5, in all 17 apps.** On a 1366×768 screen the rail
overflowed its column by up to 300px — and `#rail` scrolls with a **hidden**
scrollbar, so 🔒 Lock, pinned to the bottom, silently became unreachable. Lock is
how you hand the screen to a student. `fitUiScale()` now makes the ceiling
**per-display**: it steps the applied scale down until the rail fits. What the
therapist asked for is stored; what fits is applied; the Setup pane says so in
words rather than appearing to ignore the slider. Storing the *fitted* value
instead would have let one visit on a laptop silently rewrite a room projector's
150% and never restore it.

**Control size is a property of the display, not an app.** Settings persist per
filename (`settings:<file>.html`), so a per-app Control size would have to be set
seventeen times to mean anything — shipping it that way would have been shipping
it broken. It gets its own global `ui-scale` key, read by every app *and* the
launcher (which is a standalone page with no framework, so it reads the key and
zooms). Presets do not capture it: restoring a student's setup must not resize
the room's controls.

**The floor sweep found violations in five apps, not one.** Sampling a single app
missed them; the sweep runs every app × every pane, opening the Fine-tune drawer
too, since a violation hidden in a drawer is still a violation. All of them were
inline `style.cssText` in app files and in the shared song picker (`songs.js`) —
raw 12–13px text at 0.4–0.5 alpha. They now use the `.hint` class. The launcher
was the worst single offender and is the first screen a therapist meets: 13px
card blurbs at 0.55 alpha, a 10px badge, a 0.35 footer.

**Verified** (headless Edge, all 17 apps): 20 pages load with 0 errors and 0
warnings; the Setup pane opens in every app with Control size and Reset present;
scale 0.8/1.0/1.5 produce 45/56/84px chips and 3.0 clamps to 1.5; Voice caps to
4 + expander with the current value always visible, expands to 12, and picking an
expanded chip still works; tapping a toggle's *label* flips it (the whole row is
the target now, not just the 64×36 switch in a 48px row of dead space); every
pane in every app meets the contrast and target floors; the rail clips in 0/17
apps at both 1920×1080 and 1366×768, at both 1.0 and 1.5.

**Not fixed, deliberately:** panes still scroll — 7 of 85 at 1920×1080/100%, more
at 1.5. The guide's answer is paging buttons (*More ⌄* / *Back up ⌃*), which is
Phase 4 work. What Phase 1 did instead was make the scrollbar **usable**: 14px
and visible, rather than the 12px grey Windows overlay sitting on top of the
content. Play-surface typography (e.g. Chord Strummer's roman numerals) was left
alone — the floors govern the *interface*, and restyling an activity's visual
design is not a token pass.

### Phase 2 — switch & XAC access ❌ REMOVED (user decision, 2026-08-24)

> **Built, verified, then dropped.** The user's call after seeing it working: the
> apps are too different for one switch model to feel right across them, and the
> same for the Xbox controller. The work lives on the `phase-2-switch-access`
> branch — merged nowhere, and built on by nothing. `phase-3-stage` branches from
> `phase-1-ui-tokens` instead, which contains no switch code.
>
> **Superseded by [`PHASE-3-STAGE.md`](PHASE-3-STAGE.md)** — the rail-and-strip
> rework (part **d** of §2's table), brought forward at the user's request
> because it is the change that makes the interface feel like one thing rather
> than panels floating over an activity.
>
> The spec below is kept only as a record of what was tried.

The parking lot (`APPS.md:373`) already names this. Sensium built it; port it.

- `framework.js` gains `switchInput` / `switchMode` / `scanMs` in
  `SHARED_DEFAULTS`, the seven-key map (Space·Enter·Tab → centre, arrows →
  edges), the synthetic-tap path, and the scan timer.
- A ~60-line gamepad poller lifted from `trigger.js:255–310`, polling only once a
  pad connects.
- Apps declare `Anim.switchTargets()` / `switchActivate(i)` / `switchHighlight(i)`.
  **The framework owns the modes; the app owns the targets** — an app never
  implements scanning, so every future app gets both modes free.
- Wire it in: the **note grid** (Fluid Keys and every Keys-mode app), **Drum
  Pads**, **Song Grid**. Everything else keeps tap-at-a-point.
- Two controls **in the Setup pane Phase 1 built**, worded as Sensium words them
  (`shell.js:87`) — the jargon is the barrier, not the feature:

  > **A switch press** → *Taps the middle* · *Picks what it lands on* ·
  > *Plays the next one*
  > **Scan speed** — 400–3000 ms

  Never *Direct · Scan · Next* on screen. Those are the mode names in code.

**Explicitly not scanned:** Big Switch Songs is already one target — `direct` is
correct there and a cursor would be noise. Fluid Paint, Flock, Slime and Game of
Life have no discrete targets; they keep tap-at-a-point.

**Acceptance:** with one switch and no touch, a student can reach *every* note in
the grid in `scan`, and play a run in `next`; the cursor is visible from across a
dim room; a held switch is one press; locking the session does not stop the scan.

### Phase 3 — presets: safeguarding & resilience ❌ CANCELLED (user, 2026-08-30)

**"Not worth it." Do not re-propose it.** What it would have bought, and what was
verified at the time so the cost of dropping it is known:

- **Initials only.** The placeholder and hint already say initials (shipped in 3c);
  only *enforcing* it was outstanding. The safeguarding rule is carried by the
  wording, not by validation.
- **Undo, not silent loss.** `✕` on a preset row still deletes irrecoverably.
- **Split the saved blob.** Settings are keyed **per app file**
  (`settings:<file>.html`, `framework.js:38`; presets the same), and only
  `ui-scale` and `fullscreen` are global — so a student's access settings
  (`padOn`, `padButton`, `padSpeed`, `padDead`, `padAuto`, the dwell keys) must be
  set up **separately in each of the 17 apps**. The cheap alternative — store those
  seven keys globally, the way `ui-scale` already is, which is additive and needs
  no migration — was offered and also declined.

**Partly answered elsewhere, and better.** Phase 6's launch links mean a room PC
can put a *fully configured activity* on the projector without anyone dialling it
in, which was most of what the blob split was for. It deliberately does **not**
carry access settings — those stay on the machine, untouched by a launch.

### Phase 3b/3c — the solid-chrome stage (part **d**, brought forward) ✅ UAT passed 2026-08-25

Designed and built as [`PHASE-3-STAGE.md`](PHASE-3-STAGE.md); its “As built”
section carries the measurements. The rail and the settings strip are solid
columns now and the play surface is what is left, so **part d below is done** —
what §2's table called the expensive, 17-app half turned out to be 18 one-line
re-parents, because `#stage` carries a transform and becomes the containing
block for the apps' own `position:fixed` DOM.

Testing changed the model, twice. The first cut (**3b**) let the activity
**re-lay-out** around the chrome, which cleared the painted field on every
settings visit and every lock. It now (**3c**) **scales** instead: nothing is
ever resized, so nothing is ever lost, and the whole activity stays visible
beside the strip. See `PHASE-3-STAGE.md` -> “What UAT changed”. Checklists:
`UAT-PHASE-3C.md` (passed), `UAT-PHASE-3B.md` (superseded).

**The shrink-vs-stretch question is settled: keep uniform scaling.** Not on
looks - on correctness. A stretched activity has a *different geometry* from
the one the student gets on Lock, so a therapist would be tuning note zones,
cells and circles against a shape that is never delivered. The empty bands cost
nothing by comparison, and only a therapist ever sees them: during play the
strip is closed (0.931, 55px of band) or locked (1.000, none). The honest way
to reduce them is to narrow the **460px** strip - a width chosen when it was a
floating card, not a full-height column - which would take the activity from
57% to about 64%. That needs Phase 1's pane-fit measurements redone at the new
width, so it is a piece of work, not a one-line change. Recorded, not done.

### Phase 4 — what is left of the rework (part c) ✅ done — UAT passed 2026-08-26

**Part c** — kill the Fine-tune drawer — was the only part left. Designed and
built as [`PHASE-4C-FINETUNE.md`](PHASE-4C-FINETUNE.md); checklist
`UAT-PHASE-4C.md`.

Three things this paragraph had wrong, all found by reading the code and then
measuring it:

- **There were two drawers, not one.** The Sound pane built its own directly
  (`makeDrawer`), holding the three sound macros, in 11 apps. Both shared a
  single `fineTuneOpen` boolean, so opening one opened the other.
- **"One control per row" was already done** — Phase 1 did it and this plan was
  never updated. `.row`, `.toggle` and `makeChips` are one control each, and the
  only multi-control container (`.swrow`) holds one in all three of its uses.
  Part c was therefore only "remove the drawer".
- **Eight of the twelve apps were rendering an empty drawer** — a labelled
  disclosure opening onto nothing, ever since Performance and Show-performance
  moved to the Setup pane on 2026-08-24. Removing the drawer removed that, and
  flattening is what makes the fault *visible to a sweep* in future: two
  headings in a row can be detected, an empty `<details>` cannot.

The risk was rated "medium" here. It is **low**: it touches the settings strip
only — not the input path, not `#surface` geometry, not `localStorage`. No
`SETTINGS` key is added, changed or removed, so there is no migration and a
v1.0.0 preset loads unchanged (tested, not assumed).

**Part d is done** (Phase 3b above) — this paragraph deferred it, and the
reasoning was sound but the estimate was wrong: it feared “changing the canvas
dimensions every app lays out against”, and that turned out to cost 18 one-line
re-parents plus one real bug in the framework's own input path. Still deferred
from it: the three modal dialogs the guide would remove (the framework colour
picker at `framework.js:837`, and the pad editors in `drums.html` and
`sampler.html` — all three deliberately left on the body, see PHASE-3-STAGE §4),
and the emoji in the rail chrome.

A half-done UI rework is worse than none. If the freeze arrives mid-part, stop at
the last phase that passed UAT.

---

### Launcher tidy (fix branch, 2026-08-26) ✅ UAT passed 2026-08-26

`index.html` and one string in `framework.js`. The launcher does not load the
framework, so none of the design-doc triggers apply to it.

- **Three apps delisted** — Beat Builder, Conductor, Fluid Paint. The user's call:
  not developed enough to put in front of a student. **The files are still in the
  repo and still load clean**; only the tiles are gone, so relisting one is a
  single line in `SECTIONS`.
- **Removed:** the page title, the intro paragraph, the three section strap-lines,
  the Live badge and the footer. The badge only ever read "Live" — every app has a
  `file:`, so it carried no information. The `soon` branch stays in the render for
  an app listed before it is built.
- **Blurbs cut to one short line**, tiles re-sized.

Measured headless, every case **5 / 4 / 5 tiles, one row per section, no scroll**:

| case | tile |
|---|---|
| 1280×800 | 234 × 145 |
| 1920×1080 | 251 × 145 |
| 1366×768 | 251 × 145 |
| 1920×1080 @ Control size 1.5 | 350 × 217 |
| 1280×800 @ Control size 0.8 | 201 × 117 |

**The grid cap, not the tile size, was the real fault.** At `max-width:1100px` a
five-app section came out four across and orphaned the fifth on a row of its own.
1320px with a 220px floor gives five columns from 1280 wide up, and drops to four
on a narrower screen rather than shrinking the tiles.

**Also in this branch:** the preset name box invited a full student name
(`e.g. "Alex — 5 notes, calm"`). It now shows initials and says so underneath.
That is the placeholder and the hint only — *enforcing* initials, undo-instead-of-
delete and splitting the saved blob are still Phase 3.

### Panel hierarchy: `.sectn` was doing two jobs (2026-08-26)

**Trigger met** (`framework.js` + `framework.css`, seen by all 17 apps), and the
doc is this section rather than a `PHASE-*.md`: the change is one CSS class and
seven class assignments, and the decision was settled by looking at a screenshot
faster than a doc could have argued it. Recorded after the fact, deliberately.

**The report was "chip titles too big and bold".** The cause was not the size.
`makeChips` labelled every chip group with `.sectn` — the *section heading* class,
`--font-xl` (24px) at weight 700 in full `--ink`. So "Scale", "Register" and
"Voice", each labelling one control, rendered exactly as loudly as "Effects" and
"Shape the sound", which group several. The Notes pane was seven 24px bold
headings in a column and nothing to scan by. Every other control label —
`.toggle label`, `.rowhead label` — is `--font-m` dim; chips were the only
control whose label outshouted its own control.

**The rule now:** `.sectn` **groups** several controls; `.ctlh` **labels** one.

| | class | size / weight | ink |
|---|---|---|---|
| groups several controls | `.sectn` | `--font-xl` / 700 | `--ink` |
| labels one control | `.ctlh` | `--font-m` / 600 | `--ink-dim` |

Phase 1's rule is not broken by this: *a heading is never smaller than the thing
it heads*. `--font-m` **is** the chip size, so the label matches its chips rather
than sitting under them.

Moved to `.ctlh`: every `makeChips` label, plus `Paint colours`, `Background` and
`Style` in the framework, and three the app files built themselves —
`Backing track (from this computer)` (drums), `Pad colours` (sampler) and `Scene`
(soundscape). Those three were found by the sweep, not by reading: a rule that
lives in one class still leaves whatever an app built by hand.

**Two labels also lost text that the pane already showed:**

- `How many octaves (higher on screen = higher pitch)` → `How many octaves`. It
  wrapped to two lines, and the control directly above it reads
  "Up / down means… **Octaves**".
- `Note letters on screen` → `Note letters`.

The slider labels that carry a *direction* (`Brightness (dark → bright)`,
`Attack (soft → crisp)`, `Ring (short → long)`) were left alone — that
parenthetical says which way to drag, which is not something the pane shows
anywhere else.

**Verified:** 21 pages load clean; a sweep of **17 apps × 5 panes × Control size
1.0 and 1.5 = 170 pane renders** with no clipping and no overflow, and no `.sectn`
left heading a lone chip row.
### `sound-test.html` — an engine bench brought over from Sensium (2026-08-26)

A tuning and artefact-hunting bench for the audio engine, carried across from the
user's Sensium project. Off the launcher, like `fx_lab.html`.

**Nothing in `framework.js` changed.** The bench is one new file.

**Why it was cheap:** the two engines are siblings and the **voice data model is
identical** — `{label, oct, gain, pluck, filter{type,base,track,q},
lfo{rate,depth}, fm{...}, oscs[{type,ratio,gain,detune,decayTo}]}` is exactly our
`VOICES` table. So the voice editor and the Export block work on our real voices
with no translation.

**The one real gap was the trigger API.** Sensium's `sound.js` is note-based
(`Sound.hold(note)`); ours is coordinate-based (`startVoice(x, y)`) because it is
driven by a finger on a surface. The adapter maps a note index to the centre of
that note's band — `(i + 0.5) / NOTES.length`, which `colIndex()`'s
`floor(x * n)` lands mid-zone — and holds `y` at `0.5`, where `yLoudness` and
`yFilterPos` are both neutral, so what is heard is the voice and not the gesture.

| bench | framework.js |
|---|---|
| `Sound.hold(n)` | `startVoice(x, y)` |
| `handle.strike(n)` | `retuneVoice(vid, x, y)` |
| `handle.release()` | `stopVoice(vid)` |
| `Sound.play(n)` | `pluckNote(x, y, 1)` |
| `Sound.voices()` | `VOICES` — same shape |

**It reaches the engine without the app.** `framework.js` injects `#shell` at
script load and cannot be stopped from doing so, but `boot()` is what populates
it. The bench supplies the smallest `Anim` that lets `initSettings()` run, calls
`buildScale()`, hides `#shell` in CSS, and never calls `boot()` — so no rail, no
render loop, no WebGL context. Settings persist under `settings:sound-test.html`,
so nothing set on the bench can leak into an app.

**Three mismatches resolved toward our engine, not the bench's UI:** "brightness"
is our `tone`; glide is our three named settings (`GLIDE_TIMES`) rather than a
seconds slider, because a continuous slider would test a control no app can
produce; Chorus and Mute were added because we have them. `Sound.onPlay` was
dropped rather than stubbed — we have no such hook and a fake one would mislead.

**What it does NOT test: input.** A note index straight to an x coordinate skips
`toLocal` and `toSim`. Two of this project's real bugs lived exactly there, and a
clean bench run says nothing about them.

**Verified** (headless Edge, `file://`): loads clean; `#shell` hidden and `boot()`
never ran; 5 note buttons carrying the right Boomwhacker colours; hold → strike →
release measured on the framework's own `voices` map — **held stays 1 across a
strike while the pitch moves 261.6 → 349.2 Hz**, which is the proof that a zone
crossing retunes rather than starting a second voice; a real pointer press and
release; the editor building for all 12 voices including the FM one; the export
parsing as JS; all four scriptable stress buttons running clean; and the 16-voice
cap holding under 30 simultaneous holds.

**The bench was clipped, not scrollable, on the first pass.** `framework.css`
opens with `html,body{width:100%;height:100%;overflow:hidden}` — exactly right for
an activity that must never scroll under a student's hand, and wrong for any other
page that loads it. Everything below the fold was **unreachable**, not merely out
of view. Any future page that loads `framework.css` without being an activity has
to undo that rule; the bench does it in one line and says why.

Laid out in two columns after that, asymmetric on purpose: the **left column is
what sets the page height**, so the controls get the extra width and wrap less,
while the voice editor — the one block with no upper bound, since it grows with the
partial count — is capped at `calc(100vh - 96px)` and scrolls inside itself. That
is the trade worth naming: the block you consult occasionally is allowed to
scroll so that the controls you reach for constantly never do.

Measured page height against viewport: **1280×800, 1366×768, 1600×900 and
1920×1080 all fit with no page scroll**. Below ~1100px it drops to one column and
scrolls, which is the right answer for a bench on a narrow window.

**Open, logged not done:** extracting a genuine `sound.js` that both the framework
and the bench load. That is the right long-term shape and it is a refactor of the
file all 17 apps depend on — not something to start in an install week.

### Panes and type — order, the chip cap, and the sizes that ignored Control size (2026-08-26)

**Trigger met** (`framework.js` + `framework.css`, all 17 apps). Scope decision:
the user asked for it on Fluid Keys and chose **all apps** when the trade was put
to them — the panes are framework-built, so one change keeps every app
consistent, and per-app divergence is what killed Phase 2.

#### The Notes pane

New order, and it reads as the questions a therapist asks in sequence:

`Number of keys` → `Register` → `Scale` → `Up / down means…` → `Starting note`
*(with `Glide between notes` after the Y-axis row in Flow mode, where it lives)*.

**"How many octaves" is gone as a row.** It only ever appeared when the row above
it said Octaves, and it restated it — "(higher on screen = higher pitch)" — to
justify the space. The two are one row now:

`▦ 2 octaves | ▦ 3 octaves | Loudness | Brightness | Nothing`

**Two settings keys, one row — state cardinality, deliberately.** `yAxis`
(`octaves|loud|bright|none`) and `octaveRows` (`2|3`) are both still stored, so
**a v1.0.0 preset loads unchanged and there is no migration**. An octave chip
writes both; any other chip leaves `octaveRows` alone, so the row count a
therapist chose is still there when they come back to Octaves. Verified:
"Loudness" after "3 octaves" leaves `octaveRows` at 3.

The pane is also no longer rebuilt when the Y-axis changes — nothing appears or
disappears any more, so `refreshMusic()` is enough and a therapist keeps their
scroll position mid-choice.

**`Number of keys` / `Number of notes` follows the mode.** "Keys" is only true in
Keys mode; in Flow the student paints a continuous field. The pane already
rebuilds on a mode switch, so this costs nothing.

#### The chip cap is gone

`CHIP_CAP=8, CHIP_SHOW=4` collapsed a long group to four options plus an
"All N ⌄" expander. Removed: an expander is one more thing to find before you
can choose, and voice is the most-used control on the Sound pane.

**Two groups were capped, not one.** Voice (12) and **Voice Visuals' Style (9
`VISMODES`)** — the second was missed when this was planned and found by the
pane sweep, not by reading. The 2026-08-24 comment claiming the cap kept every
pane inside 1080 was **already untrue** before this change: the Sound pane
measured **1316 with the cap in place**.

Measured, 1920×1080, Control size 1.0, before → after:

| pane | tallest before | tallest after | |
|---|---|---|---|
| Notes | 1080 | 1080 | — |
| Sound | **1316** | **1228** | **−88** |
| Visuals | 1518 | 1510 | −8 |

Panes taller than the strip (they scroll): **10 → 11 of 51**. The one that
flipped is **Voice Visuals → Visuals, 1080 → 1130**, from its nine styles now
showing whole. The strip has `overflow-y:auto`, so nothing is unreachable — and
the Sound pane, which is the one this was about, came out 88px *shorter* because
the effect toggles paired up and `.sectn` came down.

**Each half of a pair needed its own surface.** `.toggle` is `space-between`, so
pairing two to a row put each switch **12px from the *next* label and 82px from
the one it belongs to** — and the eye pairs by proximity, so Reverb's switch read
as Echo's. Spacing alone could not fix it; a pill per half draws the boundary.

#### Type

`.sectn` → `--font-l` (20px), still weight 700. With control labels at
`--font-m` after the `.ctlh` split, a 24px heading was shouting.

**Six sizes in `framework.css` ignored Control size entirely.** Measured at 1.0
vs 1.5 they did not move, while the pane behind them went 17 → 25.5:

| | before | now |
|---|---|---|
| `#lockHint` | 13px fixed | `--font-s`, 15 → 22.5 |
| `#clrDlg` | 14px fixed | `--font-m`, 17 → 25.5 |
| `#clrDlg .ttl` | 16px fixed | `--font-l`, 20 → 30 |
| `.dlgx` font | 16px fixed | `--font-m`, 17 → 25.5 |
| `.dlgx` box | **44px** | `--target`, 64 → 96 |
| `#dpDlg`, `#smDlg`, `#smRecBtn` | 14/15px fixed | `--font-m` |

`#lockHint` was the worst: the message telling a therapist *how to unlock* was
pinned at 13px however large they had set the controls. `.dlgx` was also below
the 64px target floor Phase 1 established.

**Two were left alone, on purpose — and this is the distinction that matters.**
`#stats` and `#editPill` are appended to **`#surface`**, not the body. The surface
already carries `fitSurface()`'s transform, so they scale with the *activity*;
putting `--ui-scale` on them would scale them twice. The token-block rule governs
the **chrome**. Surface furniture belongs to the activity's coordinate space,
which is why the band labels beside them are in `vmin`. The same test sorts the
app overlays: `#dpRecPill`, `#smToast`, `#ssEdit` and `#vvGate` are all on
`stageEl` and keep their fixed sizes; only `#dpDlg`, `#smDlg` and `#smRecBtn`,
which are on `document.body`, were tokenised.

**Verified:** 21 pages load clean; **17 apps × 5 panes × Control size 1.0 and
1.5 = 170 pane renders** with nothing overflowing the strip; the merged Y-axis
row writing both keys and preserving `octaveRows`; the mode-aware label in both
modes; all 12 voices with no expander; four effect toggles in two rows of two;
and every tokenised size scaling ×1.5 while the two surface ones correctly do not.

#### Strummer, and where the developer's controls go

**Strummer takes over both panes** (`Anim.buildInstrument` / `Anim.buildSound`),
so the framework reorder did not reach it — which is the cost of a takeover, and
worth noting now that two apps' panes have drifted apart in one day. Brought back
into line by hand:

- **Chords**: `Number of strings` → `Register` → `Starting note` →
  `Chord buttons offered` → `Strum when a chord is chosen`. Same running order as
  the framework's Notes pane — how many, how high, where it starts, then what is
  offered — and "Number of strings" rather than "How many strings" to match
  "Number of keys".
- **The six chord toggles pair two to a row.** Six near-empty rows for six
  two-character labels ("C — I") pushed `Strum when a chord is chosen` off the
  pane. The safety net is unchanged and re-tested: turning every chord off leaves
  the last one on, so a student is never given a chord bar with no buttons.
- **Sound** now has the framework's shape: the instrument row first
  (`Strings sound`, which is Strummer's Voice), then `Effects` with the four
  toggles paired and Volume under them, then `Shape the sound`. Its shaping
  sliders keep their own settings keys and ranges — they are not the framework
  macros — but take its labels and its arrow: `Brightness (soft → bright)`,
  `Ring (short → long)`, where they read `(soft ↔ bright)` and `Ring time`.

**`This computer` moved to the bottom of Setup.** Performance and Show
performance are a developer's controls, not a therapist's, and they sat *second*
— above Reset, and directly under the one control on that pane (Control size)
that is genuinely set for every display. Setup now reads `This screen` →
`Start over` → `This computer`.

Panes taller than the strip: **38 → 37 of 170**, Strummer's Sound pane having
shortened when its effects paired up.

#### Sweep Chimes — the musical content was on the wrong tab

Compared against Fluid Keys, which is now the reference. The fault was not
cosmetic: **`Scale`, `Starting note` and `Register` were on the Sound tab.**
Those are *which notes exist*, and in every other app they live on the Notes tab
while Sound owns *what they sound like*. The app's own comment gave it away — the
Sound builder was labelled "tuning + the framework effects/volume".

- **Chimes** is now `Number of chimes` → `Register` → `Scale` → `Starting note`,
  the framework's running order, then a **`The chimes`** section for the physical
  setup: Material, Hanging from, Knocking sounds, One-touch sweep, Breeze.
- **Material stays on Chimes**, not in Sound's Voice slot. It sets the bars'
  *shade* as well as their timbre, so it describes the object. Strummer's
  "Strings sound" is purely timbral, which is why that one does sit in Sound.
- **Sound** is now Effects (paired) → Volume → Shape the sound. No Voice row:
  `noVoices` is true because the material is the voice.

#### Shape the sound now reaches an app that synthesises its own voice

Sweep Chimes builds every strike from `MATERIALS[…].partials` and used **none**
of `toneMul()` / `attackTime()` / `ringMul()`. Adding the three sliders without
wiring them would have put three dead controls on the pane — worse than their
absence, because a therapist would move them and hear nothing.

**No new settings keys.** It reuses `tone`, `attack` and `ring`, which
`SHARED_DEFAULTS` already stores for every app, so there is no migration and a
preset carries the shaping across apps.

| macro | where it lands in `chimeStrike` | at the 0.5 default |
|---|---|---|
| Brightness (`tone`) | multiplies the **upper** partials only, so the chime brightens without getting louder | `toneMul()` = 1 |
| Attack (`attack`) | scales the 5 ms strike ramp by `attackTime()/0.02` | ratio = 1 → 5 ms, as tuned |
| Ring (`ring`) | scales each partial's decay | clamped `ringMul()` = 1 |

**Every mapping is neutral at 0.5, so no existing setup sounds different** — and
because these were never exposed here, every stored Sweep Chimes setting has them
at 0.5 (checked: `Anim.defaults` overrides none of the three).

**Ring is clamped to ×0.25–×3, not the engine's ×⅛–×8.** Metal already rings
6–8 s; ×8 would leave close to a minute of oscillators alive per bar on a sweep.
The oscillator stop is also capped at 14 s of decay rather than `maxDec*3`.

**Measured at the AudioParam** (wrapping `linearRampToValueAtTime` /
`setTargetAtTime` once, grouping ramps by their scheduled time so a bar's upper
partials are not confused with the next bar's fundamental):

| | default | at 1.0 | at 0.0 |
|---|---|---|---|
| upper/fundamental | 0.663 | **1.641** | **0.317** |
| longest decay | 1.89 s | **5.67 s** | **0.47 s** |

#### Sweep Chimes, second pass — one control per tab, by what it *does*

The user redistributed the rest. Four of their six moves went in as asked; two
did not, and the code is why.

| control | to | |
|---|---|---|
| the rail tab `🎐 Chimes` | **`🎵 Notes`** | it now holds only note controls, so it uses the framework's own label |
| `Material (look + sound)` | **Sound**, as the voice row | agreed — see below |
| `Hanging from` | **Visuals** | agreed |
| `One-touch sweep` | **Setup → Access** | agreed |
| `Breeze strength` | **stayed in Sound** | it makes sound |
| `Knocking sounds` | **stayed in Sound** | it gates sound |

**Material moved, and my earlier reasoning was wrong.** I had kept it on the
Notes tab because it sets the bars' shade as well as their timbre. The table is
**three sound properties (`type`, `partials`, `knock`) to one visual (`shade`)** —
it is the same control as Fluid Keys' `Voice` and Strummer's `Strings sound`, and
it belongs in the same slot. The label keeps "(look + sound)" so the change in
appearance is not a surprise.

**Breeze is not a visual.** The gust block in `frame()` calls `chimeStrike()`
directly — the comment is explicit: *"like real wind chimes, the wind always has
a voice"*. It is **the only control that makes this app play with nobody touching
it**, which in a sensory room is exactly the thing a therapist needs to find
where they look for sound. **Knocking sounds** is likewise a sound gate: the bars
collide either way, and its own comment says it "only gates the contact SOUNDS".
Both sit under a **`When the chimes move`** section on Sound.

**The Sound tab now follows the framework's spine in the framework's order** —
voice row, Effects, Volume, Shape the sound — with the app's own section last,
which is what Fluid Keys does with `Anim.sectionLabel` on Visuals.

#### A new framework hook: `Anim.setupExtras` → Setup → `Access`

One-touch is neither a sound nor a look: it lets a student who cannot hold and
drag a sweep play the whole run from one tap. That is an **access** setting, and
it belongs to the *student*, not to the display or the machine — so it sits in
neither "This screen" nor "This computer".

`Anim.setupExtras(el)` mirrors `Anim.soundExtras`: **the app supplies the
controls, the framework supplies the heading**, so the section reads identically
in every app that has one, and apps without it see no change at all (checked —
Fluid Keys' Setup is still exactly `This screen` → `Start over` →
`This computer`). Setup is where Phase 2's switch access was designed to land
before it was dropped, so this is the slot being reopened rather than invented.

Setup order with an app that uses it: `This screen` → **`Access`** →
`Start over` → `This computer`.

#### The audit: `Scale`, `Starting note` and `Register` were on **Sound** in seven apps

The user reported it on Song Grid — "the sound menu is a mixture of notes and
sounds" — which is the third app they had found by eye, so the whole set was
swept instead: every pane of every app dumped and each control classified as
*which notes* / *what it sounds like* / *what it looks like*.

**It was one mistake, copy-pasted.** Six apps carried a byte-identical
`Anim.soundExtras` block — `song_grid`, `beat_builder`, `big_switch`, `bubbles`,
`conductor`, `echo_bird` — and `soundExtras` renders at the *top of the Sound
pane*. `soundscape` had the same fault through a `buildSound` takeover.

**In Bubbles and Echo Bird it had split the tuning across two tabs**: the note
*count* on Notes, the scale, root and register on Sound.

**Fixed with one helper, `appendTuning(el, onChange, opts)`**, rather than seven
hand-written blocks — the order and the labels cannot drift apart again, which is
exactly how they drifted in the first place. `opts.scales` takes an app's reduced
table (`SG_SCALES`), `opts.scale:false` drops the Scale row for an app that has
no scale to offer (Soundscape tunes a drone), `opts.label` renames the heading
and `opts.heading:false` drops it.

Placed **immediately after each app's own note-defining controls**, so the
primary choice — the song, the bird game, the scene — stays at the top of its
tab, and the tuning joins the note count where an app already had one.

**Two more, found by the same sweep:**

- **Drums' `Backing track`** was on the *Notes* tab. It is audio playback, so it
  moved to Sound. Its two rebuild callbacks still said `buildInstrumentPanel()`
  and had to become `buildSoundPanel()` — moving the markup alone would have left
  a control that rebuilt the pane it was no longer on.
- **Soundscape's Sound tab** now follows the framework spine: Effects (paired),
  Volume, then a `Winding down` section for its own wind-down slider, which had
  been the first thing on the pane.

**Six flags were checked and dismissed**, and it is worth recording why so the
sweep is not re-run against them:

| flagged | actually |
|---|---|
| `beat_builder` → `Sounds` on Notes | picks which *rows* the grid has (kick+snare, four drums, three notes) — note content, correctly placed |
| `flock` / `life` / `slime` → `Speed` | animation speed, not tempo |
| `fluid_sensory` → `Key look`, `song_grid` → `Key colours` | appearance of the keys |

**Verified:** 21 pages load clean; 170 pane renders with nothing overflowing the
strip; and the audit re-run shows **no musical content left on any Sound or
Visuals pane**.

**Noted, not moved:** Conductor's `Motion sensitivity` and `Seconds of stillness`,
and Voice Visuals' `Sensitivity` and `Extra boost`, are *input* settings rather
than note or sound ones. `Anim.setupExtras` → `Access` now exists as a home for
exactly that, but moving them is a judgement call for the user, not a tidy-up.

**Still open:** `Sampler` and `Voice Visuals` take over panes and were swept
clean, but neither has been read line by line.

**Agreed separately and now built as Phase 4h below:** fullscreen **on Lock**. It
belongs on **Lock**, not the rail — the rail already cannot fit its own buttons at
a short window, and Phase 1 recorded it breaking at 1.5 on 1366×768. Lock is
already the one-tap "hand it to the student" gesture. It needed its own lifecycle
work: silent degradation if the browser refuses, and `fullscreenchange` handling
so Esc/F11 cannot desync it from the lock state. Not to be confused with Phase 4f
below, which shipped fullscreen as a *setting* and is a different thing.

### Phase 4h — fullscreen on Lock ✅ UAT passed, shipped in `v1.7.0` (2026-08-30)

Design: [`PHASE-4H-FULLSCREEN-ON-LOCK.md`](PHASE-4H-FULLSCREEN-ON-LOCK.md).
`framework.js` only — no app changed, no CSS, **no new stored key**.

**The lock borrows fullscreen, and a borrowed fullscreen is never written down.**
The naive version — Lock calls `enterFullscreen()` — rewrites the room's display
setting, because `onFullscreenChange` writes the `fullscreen` key from whatever
the browser is doing. Measured, not predicted: the key moved `null → "1" → "0"`
across an enter/exit pair, in a windowed browser *and* in an already-fullscreen
one. Phase 4f put that key outside `SETTINGS` precisely so no student action could
reshape the room's screen; a lock writing it breaks the same rule from the other
end.

So the lock takes a **loan**, and only when the preference is off — if it is
already on, fullscreen is the therapist's and the unlock leaves it alone. Two
per-document booleans, neither persisted: a loan that outlived the page would be
indistinguishable from the therapist's own setting on the next load.

**What it costs, and the honest limit of it.** Entering fullscreen from a
*windowed* browser is a real viewport change, and `sizeCanvas()` has no pointer
guard — it reassigns `canvas.width`, which clears a 2D canvas by definition, then
calls `Anim.resize`. Measured across 1280×800 → 1920×1080: **Life, Conductor,
Bubbles, Fluid Paint and Slime lose the student's work**; Flock, Soundscape,
Strummer and the rest survive because they repaint from live state every frame.

**So "locking never loses what a student has drawn" is now conditional**, and the
condition is the one that matters: it still holds for every settings visit, and it
holds in the room, where `Music Room.cmd` has the window fullscreen already.
Measured directly rather than inferred — Life's grid held at 17200 lit pixels
through a lock, with the canvas, the viewport and the window state all unmoved.
The feature only *does* anything from a windowed browser, which is the case it
exists to fix (someone opened Edge instead of using the shortcut), and there the
lock precedes the drawing.

**Two harness faults worth carrying**, because each nearly read as a verdict on
the feature: an init script cannot assign to `document.documentElement` (it does
not exist yet), so a "refusal" test silently tested nothing; and `null` is not
`"0"` — assert on what the framework *reads*, not on the stored string.

Gate: 10/10 acceptance checks, and 21/21 pages clean in Edge and in Firefox.

### Phase 4f — fullscreen as a property of the screen ✅ shipped in `v1.3.0`

Design: [`PHASE-4F-FULLSCREEN.md`](PHASE-4F-FULLSCREEN.md).

**This entry was missing from the plan until 2026-08-30** — the phase shipped in
`v1.3.0` and was recorded only in its own design doc, which is exactly the drift
`CLAUDE.md` names this file as the cure for.

A switch on `Setup → This screen`, with its own key like `ui-scale`: **fullscreen
belongs to the display, not the student**, so no preset carries it and `Reset all
settings` never clears it. The switch renders `document.fullscreenElement` rather
than the stored flag, so Esc and F11 just turn it off instead of desyncing it. A
fresh page load starts windowed — a gesture-less request is refused — and the
preference re-applies on the first tap in the new app.

**Two black-screen faults were found later** and fixed on the 5b/5c branch,
shipped in `v1.6.0` (`PHASE-4F` §16–17):

- Fullscreen was requested on the tap that **navigated away**. ⌂ Home is an
  `<a href>`, so the gesture that left the page asked for fullscreen on an
  unloading document. **The diagnosis is the reusable part:** "the whole screen
  goes black *including the browser menu*" can only be fullscreen, because a page
  cannot black out browser chrome.
- The one-shot re-apply was armed on `window` rather than `stageEl`.

**The Fullscreen API cannot span navigation at all** — it is per-document. Only a
window state survives, which is what `Music Room.cmd` (F11-equivalent via
`--start-fullscreen`) is for. `--kiosk` is a trap: Edge runs it InPrivate and
discards every preset.

### Phase 4e — the app tab: `Song · Notes · Sound` ✅ done — UAT passed 2026-08-26

Design: [`PHASE-4E-APP-TAB.md`](PHASE-4E-APP-TAB.md). Checklist:
`UAT-PANES-TYPE.md` §K.

The user's correction to the tuning audit, and it was right. Moving the tuning
to a tab that already held app content needed a `## Tuning` heading Fluid Keys
does not have — a new inconsistency in place of an old one. **One tab was doing
two jobs.**

Now: `Anim.buildApp` gives an app its own first tab, so **Notes means exactly one
thing in every app**. `Anim.appLabel` names it. Sweep Chimes had already proved
the shape by accident — once its app content moved out, its Notes tab became
pure tuning and read like Fluid Keys.

**No `SETTINGS` key added, changed or removed.** `currentQuickMode` is not
persisted, so nothing can be saved pointing at a pane a later build lacks.

**Measured:** every app reaches Control size 1.00 at 1920×1080; 21 pages load
clean; **184 pane renders** at Control size 1.0 and 1.5 with nothing overflowing.
Eight apps carry six tabs, eight carry five, and Voice Visuals four.

The rail's hidden scrollbar went with it: `#rail` was `overflow-y:auto` with
`scrollbar-width:none`, so a short window swallowed Setup and Lock with no
affordance at all. Survivable at five tiers, not at six.

### Phase 5 — a reach area: put the activity where the student can reach it ✅ built as Phase 7

**Raised by the user 2026-08-25, after seeing Phase 3c working. Not designed,
not scheduled - deliberately parked until 3c passes UAT.** Recorded here
because it is the first idea in this project that arrived *because* of an
implementation rather than in spite of one, and it should not be lost.

> **Asked for again 2026-08-31 and built the same day** as
> [`PHASE-7-REACH-AREA.md`](PHASE-7-REACH-AREA.md) — the phase numbering follows
> the order things were built, not the order they were thought of. Everything
> below is the ORIGINAL note and is left exactly as it was written; every
> question it raises is answered in the design doc, and the answers to two of
> them went the other way from what this note assumed. See the Phase 7 record
> below for those.

**The problem.** On a big projector the activity fills a wall. A student in a
wheelchair can comfortably reach one part of that wall - often low, often to
one side - and everything outside it is unusable. Today the only answer is to
move the projector.

**The user's first thought** was to lock the menu and blank part of the screen.
That is the weaker form of the same idea: blanking wastes the projector *and*
crops the activity, so the student loses the parts they cannot reach.

**The better form, which Phase 3c accidentally built the machinery for.**
`fitSurface()` already computes exactly three numbers - a scale `k` and an
offset `tx, ty` - and currently hardcodes them to “the biggest that fits,
centred”. A **reach area** is those same three numbers, set to a rectangle a
therapist has drawn on the wall. The whole activity is then mapped into it: not
cropped, not redesigned, just smaller and where the student can get to it.

**Why this is worth more than it looks.** It needs **no per-app work at all**.
That is precisely why Phase 2 (switch access) failed and was removed: it needed
`switchTargets()` / `switchActivate()` in every app, so each of the 17 had to
opt in and each one felt different. A reach area is a framework-level
transform. All 17 apps get it, identically, for free.

**Questions a design session has to settle before any code** - the shape of
this is not obvious and `SR1/CLAUDE.md` names most of these as triggers:

- **Whose property is it?** Control size is a property of the **display** and
  lives in its own global key for that reason. A reach area is a property of
  the **student**, so it belongs in a preset - and the two then compose. State
  the cardinality explicitly before writing either.
- **It has to survive Lock**, which is the opposite of every assumption in
  3c: today Lock means “collapse the chrome and fill the screen at 1:1”, and
  locked is exactly when a student is using it. Lock and reach area both want
  to own the geometry.
- **How is it set?** Dragging a rectangle on the projected image, watching the
  student, is the obvious therapist gesture - and it must be settable from the
  room, not from a settings field.
- **Lifecycle**: added, changed, replaced, removed; what happens when the
  student changes mid-session, when the display resolution changes, and when
  two students share a session and their reach areas conflict.
- **A floor.** It must not be possible to shrink it to nothing, put it off
  screen, or leave a room with an unusable setup nobody can find their way out
  of.

Related: the same argument applies to a student using their own device, which
is already a first-class route in the wider project.

---

## 3. Lifecycle of a switch target

Required by the design discipline in `SR1/CLAUDE.md`: this introduces an
identifier — a target index — so its whole life gets written down before code.

**Cardinality.** One app has **0..n** targets. One index activates **exactly
one** thing. `switchMode` and `scanMs` are **one per display**, not per student —
the same open scope question Sensium recorded for `uiScale`
(`PHASE-E-SOUND.md:529`) and did not resolve. Named here so it is not drifted
into: if a room ever has two students with different access needs on one screen,
this is the setting that will need a scope.

| Event | Behaviour |
|---|---|
| **Added** — targets grow mid-session (note count 5 → 8, a pad added in Beat Builder) | `scanIndex` stays valid; the highlight is recomputed on the next tick. No reset. |
| **Changed** — targets shrink (8 → 3) | `scanIndex % n` keeps it in range. The cursor may jump; that is correct, and better than pointing off the end. |
| **Removed** — `n` reaches 0 | `switchPress()` returns false and the press falls back to a tap at the fixed point. The app is never left with a dead switch. |
| **Duplicated** — a switch is held, or two switches fire together | A held switch is **one** press (`e.repeat` guard). Two *different* switches are two presses — that is a real double-activation and should behave like one. |
| **Replaced** — the app changes what index `i` *means* (Song Grid advances a song, Beat Builder reorders steps) | **Targets are positional, not identities.** An app that reorders or repopulates its targets must call the framework's `resetScan()`, or the cursor silently lands on a different note than the one it was pointing at. This is the case most likely to be forgotten. |
| **Conflict** — a therapist touches the screen while a scan is running | Both are allowed. A demonstration by touch must not kill the student's cursor. |
| **Conflict** — the session locks while scanning | The scan keeps running. Locking hides the therapist's chrome; it does not remove the student's only input. |

---

## 4. To measure, not assume

- **Does Chrome share `localStorage` across `file://` pages in the same folder?**
  Phase 3's cross-app carry depends on it entirely. If it does not, the
  shell/app split is still worth doing — it makes the record honest — but
  "Jamie's access settings follow him into every app" needs a different
  mechanism, probably export/import of a settings file, matching the song-pack
  pattern already in `APPS.md:60`. **Measure before designing round it.**
- **Does the room have an XAC, and which ports have switches in them?** The
  gamepad poller reports button indices; nothing in software can know which
  physical switch is in which port. Sensium solved this with press-it-to-learn-it
  (`trigger.js:311`) — worth copying only if the room's switches are on an XAC
  rather than presenting as a keyboard.
- **The scan cursor's contrast on the actual projector.** It is drawn on canvas,
  not styled by CSS, so Phase 1 does not cover it. Check it in the room.

---

### Phase 4d/4e — what the day actually produced

One session, 2026-08-26, all of it UAT-passed by the user in one pass. In order:

1. **Launcher tidy** — title, intro, strap-lines, footer and the Live badge gone;
   three apps delisted; tiles re-sized. The 1100px grid cap, not the tile size,
   was what made the first attempt look wrong.
2. **The preset name box** stopped inviting a full student name.
3. **`sound-test.html`** — the Sensium engine bench wired onto this project's
   engine through an adapter; `framework.css`'s `html,body{overflow:hidden}` was
   *clipping* it, not scrolling it.
4. **`.sectn` split into `.sectn` + `.ctlh`** — a heading groups controls, a label
   names one.
5. **Six un-tokenised font sizes** that ignored Control size entirely, `#lockHint`
   worst among them.
6. **The Notes pane reordered**, the octave count folded into the Y-axis row, the
   chip cap removed, the effect toggles paired.
7. **Strummer and Sweep Chimes** brought into line; `Shape the sound` *wired* into
   the chimes rather than merely displayed.
8. **The tuning audit** — `Scale`/`Starting note`/`Register` were on the **Sound**
   tab in seven apps, from one copy-pasted `soundExtras` block.
9. **Phase 4e** — the app tab, so `Notes` means one thing everywhere.

**The thread running through all of it:** the user found three separate apps by
eye before the whole set was swept. Every one of the systematic faults was found
by *dumping every pane of every app and classifying each control*, not by
reading. Two hooks now exist so those faults cannot recur silently —
`appendTuning()` and `Anim.buildApp` — and both are asserted in the sweep.

## 5. The freeze

**Done, 2026-08-25.** Phases **0 → 1 → 3b/3c** are merged to `main` and tagged
**`v1.0.0`** - that tag is what gets copied to the USB stick, with days to spare
before the install. (Phase 2 was removed by the user; 3b/3c took its slot.)
Phase 3 — presets — and part c of Phase 4 land only if they pass UAT before the
freeze; otherwise they wait. Phase 5 is not for this install.
Nothing risky goes in after the tag.

**Part c passed UAT on 2026-08-26** and is merged and tagged **`v1.1.0`**.
It went first, ahead of
Phase 3, on a deliberate swap: reading the code and measuring it showed part c
to be the cheaper *and* the safer of the two — it cannot touch a saved preset,
where Phase 3 changes what is stored per student and a bad migration costs a
therapist their setups. Phase 3 takes the days that are left.

Each phase ends the way `SR1/CLAUDE.md` requires: my gates, then a numbered UAT
checklist for the user to run, then their explicit pass before it merges. The tag
goes on after the last passed UAT — not after the last commit.

---

## 6. Fixes after the freeze

### `fix-bubbles-goal-gate` — 2026-08-26

**Reported by the user:** both of Music Bubbles' little goals — *Fill the
rainbow* and *Pop the colour* — stopped counting after the first celebration.

**One root cause behind both.** `celebrating` is a countdown in seconds, but the
scoring gate tested it as a boolean:

```js
if(celebrating>0) celebrating-=dt;              // frame loop
if(SETTINGS.game!=='off' && !celebrating){ … }  // the gate
```

The countdown only runs while it is positive, so the last subtraction overshoots
and it settles on a small negative float — `-0.0010` in the measurement below —
and the `>0` guard then stops it there forever. `!(-0.0010)` is `false`, so the
gate shut on the first celebration and never opened again. Both modes share that
one gate, which is why both symptoms appeared together.

**Fixed** by clamping the countdown and comparing it as the number it is:

```js
if(celebrating>0) celebrating=Math.max(0,celebrating-dt);
if(SETTINGS.game!=='off' && celebrating<=0){ … }
```

Belt and braces on purpose — either line alone would fix it, and the pair means a
future float cannot reopen the hole.

**Measured, not assumed.** An instrumented copy of the page driven headless:

| | before | after |
|---|---|---|
| Fill the rainbow, goal 3, ~150 pops | 1 celebration, then 179 pops gated off with `celeb=-0.0010` | 26 celebrations; every gated pop shows a *positive* countdown |
| Pop the colour, goal 2, 168 pops | — | 10 celebrations, target rotating 3·2·1·2·0·3·1·3·0·1, never repeating |

All 21 pages still load clean.

**The same shape swept across the suite** — every `-= dt` countdown and every
flag that gates input. `sweep_chimes` (`b.cool`, `b.kc`), `echo_bird` and
`song_grid` (`wait`), `fluid_paint` (`ambT`) and the particle lives in
`soundscape`/`voice_visuals` all compare `>0` or `<=0` and are safe;
`song_grid` and `big_switch` use real booleans cleared in the timeout that ends
the celebration; `sampler`'s `micPending` clears on both the `.then` and the
`.catch`. Bubbles was the only instance.

**Not the same fault, though it looks like it.** `big_switch.html` sets
`finished=!SETTINGS.loopSong` when a song ends, so with *Start again when
finished* off the switch is deliberately inert until ⏮ is pressed. That is by
design, and it is the one other place in the suite where a successful finish
stops the activity.

### `fix-trail-fade-curve` — 2026-08-27

**Reported by the user:** faint marks left on screen by the agents in Flock,
*"very obvious with higher glow and trail size"*.

**It was not residue, and the first three hypotheses were wrong.** Worth
recording, because each is the sort of thing that is easy to assert and wrong:

1. *Rounding stall* — that `old*(1-a)` rounds back to `old` at low values and
   sticks. **Measured false:** the fade reaches pure `rgb(0,0,0)` at every alpha,
   in 86 frames at the slowest.
2. *GPU-dependent rounding* — that a real GPU rounds where the software
   rasteriser floors. **Measured false:** headless, headed and GPU-forced runs
   all report the same ANGLE/NVIDIA renderer and all reach black.
3. *Leaked `ctx.filter` or composite op from the glow renderer.* **False** — both
   are reset, and a stamped mark clears under every style.

The decisive test was stamping a **neutral grey** block on the canvas — a colour
the themes never draw, so live agents cannot be mistaken for it — and watching it
while the app ran normally. It always vanished: 1.1 s at Trail length 20, 2.1 s
at 60. **Nothing is stuck.** The user confirmed independently that pressing Clear
fixes it, which is the same conclusion from the other end.

**The actual fault: the slider was linear in alpha, and trail time goes as
1/alpha.** So the top of the slider did far more than the bottom, measured as the
time for a stamped mark to vanish:

| Trail length | 10 | 20 | 30 | 40 | 50 | 55 | **60** |
|---|---|---|---|---|---|---|---|
| before | 0.10 s | 0.08 s | 0.13 s | 0.22 s | 0.36 s | 0.54 s | **1.45 s** |
| after | 0.08 s | 0.08 s | 0.16 s | 0.23 s | 0.33 s | 0.39 s | **0.47 s** |

At 1.45 s the screen holds a faint copy of the entire flock path at once. With a
high Glow size the live agents are small, so that faint copy is what you see —
and on a dark projector a pixel value of 5–15 out of 255 is plainly visible.

**Fixed** by reading the slider as a duration: a geometric map on the fade time
constant, `tau = 0.0054 * (0.11/0.0054)^(trailLen/60)`, with
`alpha = 1 - exp(-dt/tau)`. It reproduces the old feel everywhere below the top
(within a frame or two, see the table) and shortens only the end that smeared.

**And it fixed a second bug nobody had reported.** The old fade was counted in
*frames*, so trail length in seconds depended on the frame rate — and
`quality:auto` drops a loaded room PC to 30 fps:

| Trail length 60 | 60 fps | 30 fps |
|---|---|---|
| before | 1.43 s | **2.87 s** |
| after | 0.47 s | 0.53 s |

That is very likely why the user first described it as happening *sometimes*.

**Checked across the suite, and it does not generalise.** The other two apps that
fade trails the same way top out well below Flock's, so neither shows the fault:
`life.html` reaches 0.67 s at Ghost Trail 20 — and its `1/(1+trail*0.5)` curve is
already hyperbolic in alpha, which is to say **already linear in duration**, the
thing Flock had to be changed to. `conductor.html` reaches 0.92 s at Persistence 1
and does share Flock's linear-in-alpha shape, but with a low enough ceiling not to
smear, and it is delisted from the launcher. `fluid_sensory.html`'s persistence is
a WebGL dissipation term, a different mechanism entirely.

**Left open, deliberately:** `life` and `conductor` are still frame-*counted*, so
their trails still lengthen when the frame rate drops. Not the reported fault and
not visible at their ceilings; offered to the user rather than changed unasked.

#### The second half of it — the fade never actually arrives

**The curve fix above was necessary and not sufficient.** The user came back with
the observation that settled it: *"it is as if when a trail goes over the canvas
the track left behind is a different colour to the canvas — a slightly different
black. Once the whole of the screen is painted this colour there are no more
artefacts."*

That is not a decaying trail. That is a **permanent two-tone**, and it is exactly
what a stall looks like from the far side.

**Measured on the real page, after 12 s: 376,302 pixels at exactly `rgb(3,3,3)`,
against an untouched canvas of `rgb(0,0,0)`.** A fading trail spreads across many
values; a third of a million pixels at one value is a floor.

**Why.** Compositing is 8-bit and an accelerated canvas **rounds**. Once a channel
is low enough that `old*alpha < 0.5`, `old*(1-alpha)` rounds straight back to
`old` and stops there for good. At the longest trail that floor is 3.

**Why it hid through three rounds of testing, which is the part worth remembering:**

> **`getImageData` drops the canvas off the GPU.** The software path *floors*
> instead of rounding, so every probe that read pixels while the fade was running
> was measuring a canvas that no longer had the bug.

Both earlier "the fade reaches pure black" results came from tiny scratch
canvases, which Chrome never accelerates at all. The stamped-mark test read
pixels every 25 ms and so de-accelerated the canvas within one frame of starting.
This also explains the one anomaly nobody could place at the time: a census at
12 s showed the `rgb(3,3,3)` plateau and the same census at 42 s showed
`rgb(0,0,0)` — the first readback had switched the canvas to the CPU path, and it
drained normally from then on. **Measure this class of thing with exactly one
readback, at the very end.**

**Fixed** with a `color-burn` pass against `rgb(254,254,254)`, which subtracts
about one level across the range — nothing against the exponential where ink is
bright, decisive in the last few levels where it stalled — then a `lighten` clamp
at the background, because burn heads for 0 rather than for the background. Both
skipped where the background is already black.

| after 20 s of painting | dominant near-black value |
|---|---|
| curve fix only | **374,874 px at `rgb(3,3,3)`** |
| with the burn | **455,351 px at `rgb(0,0,0)`** |

60 fps in both: two extra full-canvas fills cost nothing on the GPU.

**Swept all 17 apps for the same two-tone**, one readback each, at the end:

- **Clean:** Big Switch, Bubbles, Conductor, Drums, Echo Bird, **Flock** (fixed),
  Life, Sampler, Song Grid, Strummer, Sweep Chimes, Voice Visuals.
- **WebGL, different mechanism entirely:** Fluid Paint, Fluid Sensory, Slime.
- **`soundscape.html` — looked at properly on the user's instruction, and it
  does NOT have Flock's artefact.** The first sweep called it "a real stall",
  which was the crude sweep over-reading a legitimately dark app. Corrected below.
- **`beat_builder.html` — a false positive.** It repaints the background
  **opaquely** every frame, so it cannot accumulate anything; the `rgb(7,7,7)`
  the sweep found is a live band of its radial beat-pulse gradient. Delisted
  anyway.

**Worth consolidating later:** if Soundscape does get the same treatment, the
burn-then-clamp belongs in one shared helper rather than in three app files. That
touches `framework.js`, so it needs a design doc first and is deliberately not
done here.

#### Soundscape, looked at properly — 2026-08-27

The sweep flagged it; the user asked for it to be looked at; **it does not have
Flock's fault**, and the reason is structural rather than lucky.

**Flock's artefact was a *split*** — a painted region at `rgb(3,3,3)` against an
untouched region at `rgb(0,0,0)`. What made it visible was the boundary between
the two, not the stall itself.

**Soundscape has no untouched region to split against.** `drawColBg` repaints
*every pixel* every frame with a per-column vertical gradient, so the whole
canvas converges on the wash rather than some of it converging and the rest
sitting at background. Measured, with particles off so only the wash is acting on
a stamped white mark, left for 30 s:

| `colWash` | the mark | same column, no mark | |
|---|---|---|---|
| bold | rgb(8,8,2) | rgb(8,13,8) | tinted gradient, no clean reference |
| soft | rgb(2,2,2) | rgb(8,8,2) | as above |
| **off** | **rgb(2,2,2)** | **rgb(2,2,2)** | **MATCH — no split** |

`colWash: off` is the mode that behaves exactly like Flock's fade — a plain
alpha-0.18 wash to the background over the whole canvas — and it is precisely the
one that comes out **uniform**. And a screenshot after 25 s of rain shows the
columns reading as the tinted washes they are meant to be, with no ghosting.

> **CORRECTED 2026-08-31 — the two lines above the table were wrong, and the
> conclusion drawn from them was wrong.** The user reported a ghost image on the
> Soundscape canvas. There is one, in `bold` and `soft`, and it had been here all
> along.
>
> **The measurement was the fault.** "The mark" and "same column, no mark" are
> two DIFFERENT points, and under a tinted per-column gradient two different
> points legitimately differ — so the table's own note, *"tinted gradient, no
> clean reference"*, was the finding, not a caveat to it. It was read as "cannot
> tell, therefore fine". **Measure the SAME point in two separate runs of the
> page** — one that stamps a white block over it, one that does not — each with
> a single readback at the end. Then there is a clean reference in every mode.
>
> Re-measured that way over 576 points across the stamped band, 25 s after:
>
> | `colWash` | points still differing | worst |
> |---|---|---|
> | bold | **568 / 576** | 5 levels |
> | soft | **110 / 576** | 5 levels |
> | off | 0 / 576 | 0 |
>
> **And the reasoning that the tinted modes must not get the burn was wrong too.**
> A burn does not fight the wash as long as what it is clamped back up to is the
> wash itself rather than the background: fade toward the tint, burn one level to
> guarantee it keeps moving, then `lighten` at the same tint so it cannot go past.
> Now 0/576 in all three modes. Fixed in `soundscape.html`; `colWash: off` also
> got the exactness that was offered here and never taken.
>
> **The rule:** a probe that cannot produce a clean reference has not shown the
> thing is fine — it has shown the probe is wrong. See
> [[canvas-fade-never-arrives]] and `.claude/skills/verify/SKILL.md`.

### Phase 6 — launch parameters ✅ UAT passed, shipped in `v1.8.0` (2026-08-31)

Design: [`PHASE-6-LAUNCH-PARAMETERS.md`](PHASE-6-LAUNCH-PARAMETERS.md).

The sensory room has **one PC** running the equipment control software and driving
the touchscreen projector. It could already launch Edge fullscreen; it had no way
to say **what the activity should be like**. Now a link does:

```
fluid_sensory.html?s=noteCount:5,voice:synth,reverb:1&lock=1
```

**This is a port of the user's own earlier implementation** in
`Coding/MusicTherapy/music-room`, which was a good design and is reproduced rather
than replaced: `?query` and `#hash` both read (some launchers mangle one), `s=`
lists **only what differs from the app's defaults** so links stay short and stay
correct when a default changes, values coerced by the type of the matching default,
junk ignored rather than allowed to break the app, and a boot toast confirming the
link was read so a misconfigured launcher announces itself instead of looking like
the app "just opened wrong".

**Three things changed, all because the framework grew since it was written:**

1. **`uiScale` survives a launch.** Menu size did not exist then; a reset would
   snap the room's menu size back to 100% on every launch.
2. **The student's access keys survive too** — `padOn`, `padButton`, `padSpeed`,
   `padDead`, `padAuto`, the four dwell keys, `bigPointer`, `bind`. A launch that
   reset them would silently turn off a switch or a dwell.
3. **A `Start locked` toggle in the copy dialog.** The old `launchLink()` ended in
   a hard-coded `lock=1`, so *every* link was locked and the only way to get an
   unlocked one was to delete `&lock=1` from the URL by hand. Hand-editing a URL
   inside room control configuration is where a typo survives until a student is
   sitting in front of it.

**A link neither carries nor accepts the display and access keys, in either
direction** — the user's instruction, and the tests independently forced it:
`bind` is an object and stringified into a link as `[object Object]`, and a link
carrying `padOn:1` would push one student's access setup onto everyone launched
with it. `encodeSettings` now refuses object-valued settings outright.

**Fullscreen is deliberately absent and cannot be added.** No URL can go fullscreen
at load — the API needs transient activation — which is the whole reason
`Music Room.cmd` uses `--start-fullscreen`, a *window* state. The control software
already launches Edge that way.

Verified 14/14: a link beats whatever the last session left; keys the link does not
name reset to the app's defaults; menu size and access settings survive; `lock=0`
opens an app that was saved locked; `lock=1` alone locks without resetting; junk is
ignored and announced; the `#hash` form works; and a link copied from the pane
round-trips. 21/21 pages clean in Edge and Firefox.

**One test lesson:** the chimes sweep check went 6/7 during this work and it was
**not** a regression — `main` and the branch both produced 32–40 oscillators,
because a synthetic "brisk" sweep is not reliably brisk and a lingering step
re-rings a bar past its 120 ms cooldown, which is correct. The assertion was too
tight and now allows the measured, correct range. **Compare against `main` before
believing a test that starts failing.**

### The per-element canvas audit — closed, nothing to fix — 2026-08-31

The item that had been open since Life's glow was fixed: **which other apps spend
heavily on a per-element canvas effect, and does any wire `setQuality` to a
dominant visual cost** (the combination that made Life's frame rate hunt).

**Answer: none. Life was the only one, and it is already fixed.**

| app | mean ms/frame | worst case measured |
|---|---|---|
| `life` | **3.6** | cellSize 6, speed 20, glow 10, trail 10 — 57,600 cells, 60 fps held |
| `sweep_chimes` | **0.55** | 15 chimes, metal, breeze 1, struck continuously |
| `flock` | 1.2 | agents/glow/trail maxed |
| `soundscape` | 0.24 | motion on |
| `bubbles` | 0.14 | density, size and speed maxed |
| `strummer`, `conductor`, `song_grid` | < 0.1 | — |

One frame at 60 fps is 16.7 ms. The worst app uses **a fifth** of it.

**The hypothesis I started with was wrong, and the correction is the useful part.**
`sweep_chimes` looked like Life's fault exactly: inside its per-bar loop it sets
`ctx.shadowBlur` on the bar fill, builds a `createRadialGradient` halo *and* a
`createLinearGradient` for the shading — up to 45 per-element operations a frame
at 15 chimes — and both glows are gated on `activeQuality()!=='low'`, which is
the wiring that makes a frame rate hunt. Measured under sustained striking it
costs **0.55 ms**, of which the glow is **15%**. Auto-quality did not oscillate.

> **`ctx.shadowBlur` per element is dangerous because of the element COUNT, not
> the technique.** Life's grid was thousands of cells; a chime rack is fifteen
> bars. The rule to carry is "how many elements", not "does it use shadowBlur".

**Two measurement traps, both of which I fell into first:**

1. **A decaying effect must be measured while it is still lit.** The first run put
   chimes at 0.29 ms — but the window started 400 ms after the sweep, and `b.glow`
   had decayed, so it measured dark bars. This is the same shape as the recorded
   warning that "a sweep at DEFAULT settings misses this class"; here it was a
   sweep at the wrong *moment* rather than the wrong setting.
2. **A "worst case" has to come from the real slider range.** My first Life config
   set `speed: 1` — near the *minimum*, on a slider that goes to 20 — while
   calling itself worst case. `cellSize` min 6 and `speed` max 20 are what a
   therapist can actually pick, and those are what the table above uses.

**What is NOT covered, and needs the room machine.** The three WebGL apps —
`slime`, `fluid_paint`, `fluid_sensory` — cannot be assessed headless: Playwright
runs them on **swiftshader**, so their frame rates measure a software rasteriser
rather than the room's GPU, and the `Anim.frame` timer would not see the GPU work
in any case. Their cost is a question for the install, not for this bench. The
same caveat applies to every number above in a weaker form: these are one
developer machine, not the room's.

### Phase 4i — the first splat belongs to `onDown` ✅ UAT passed, shipped in `v1.7.2` (2026-08-30)

Design: [`PHASE-4I-DOWN-EVENT-SPLAT.md`](PHASE-4I-DOWN-EVENT-SPLAT.md).

**Reported by the user: "the mouse dwell doesn't seem to work on the bubbles."**
Measured, it was **both dwell routes in both** `bubbles.html` and
`sweep_chimes.html` — mouse *and* gamepad, i.e. exactly the two students dwell
exists for. `fluid_sensory.html` as a control worked throughout.

**A dwell press is synthesised.** `pollMouseDwell` fires
`onDown('mouse', x, y)` directly and **dispatches no DOM `mousedown`**; every pad
press is the same. Both apps had moved their tap handling into their own
`canvas.addEventListener('mousedown', …)` and then ignored the loop's initial
splat so a tap would not fire twice — between them, a synthetic press had
nowhere to land. A moving gamepad pointer only *seemed* to work because travel
makes ordinary drag splats; park the stick, which is the point of dwell, and
nothing happened.

**This was my own misjudgement, and the reasoning is the part worth keeping.**
Phase 4h declined to fix this in the framework because "only two apps need
down-event handling". But a DOM listener is unreachable for **any** synthesised
pointer, so the app-level workaround does not merely fail to help the access
paths — it **closes** them. Chimes' dwell worked before 4h and shipped broken in
`v1.7.1`; Bubbles had been broken since dwell landed in 5c.

> **A workaround that listens for a *device* rather than for the framework's own
> event silently excludes every student who does not use that device.**

**The fix moves the initial splat from the render loop into `onDown`**, passing
the same `{velScale:0}` (plus the Keys-mode `subtle` radius, which is the easy
thing to drop). `p.moved` keeps its meaning and is set where delivery happens.
**No new state, no new key, and it deletes more than it adds**: both apps lose
their bespoke listeners, and Bubbles loses the hand-rolled coordinate maths that
had been a separate bug. Every press now reaches `Anim.splat` whatever produced
it — finger, mouse, dwell or stick.

**Verified:** the press arrives once in bubbles, chimes and life on all three
routes (mouse dwell, pad dwell, sub-frame tap). `fluid_sensory` correctly gets
none, because Keys mode with `paintKeys:'off'` means `paintMode()==='off'` — the
loop applied that identical check before, so it is unchanged. Keys-mode `subtle`
still carries `radius 0.06` on the tap and `full` still carries no override.
Everything from 4h holds: 7/7 chimes, 6/6 bubbles, repeated clicking 10/10 at
every rate and height. 21/21 clean in Edge and Firefox.

**The method note, again:** sound was a bad observable — bubbles only sings if a
bubble is under the point and a chime only rings if the point is on a bar, which
made the first probe read as flaky per-app. **Measure the mechanism the fix
changes** (did a `velScale===0` splat arrive), not a downstream effect that
depends on where things happen to be.

### Sweep Chimes missed taps ✅ UAT passed, shipped in `v1.7.1` — 2026-08-30

**Reported by the user from testing:** "the chimes sometimes do not respond to
touch even though they are clearly being hit." Two causes, both measured.

**1. A press shorter than one frame produced no chime at all.** The framework
calls `Anim.splat` only from the render loop, and a new pointer's **first** splat
lands on the frame *after* it went down (the `!p.moved` branch in `loop()`). So a
press that starts and ends between two frames is never seen. Sweep Chimes does
**all** its hit detection in `splat`, and — being `mode:'flow'` with
`noVoices:true` — `onDown` starts no voice and fires no `onCell`, so nothing else
was listening.

| tap held | splats | result |
|---|---|---|
| sub-frame | 0 | silent |
| 8 ms | 0 | silent |
| 16 ms + | 1 | rang |

At 60 fps that window is 16.7 ms, which a finger rarely fits inside — **but this
app draws halos and ripples, and at 20–30 fps on a room projector the window is
33–50 ms, which an ordinary confident strike fits easily.** A percussive app is
exactly the one where the press is shortest.

**2. Repeat hits on the same bar were swallowed above ~8 per second.**
`strike()` sets `b.cool=0.12`. Measured with knocks and breeze off, so one strike
is exactly four oscillators: at ~90 ms spacing only **3 of 6** strikes rang; at
130 ms and slower, 6 of 6. The cooldown is not wrong in itself — it is what stops
one *sweep* firing dozens of strikes on a bar as the interpolated steps cross it
— but it could not tell a sweep from a deliberate second tap.

**The fix is one listener, and it answers both.** A `mousedown`/`touchstart`
handler strikes at that exact point with `fresh=true`, bypassing `b.cool` because
a new press is a new strike by definition; `splat` then skips the loop's
tap-splat (`opts.velScale===0`) so nothing rings twice. The per-bar hit loop is
shared as `hitBars()`. **`bubbles.html` had already hit this and fixed itself the
same way** (`bubbles.html:292`) — the bug class was known and never generalised.

**Deliberately NOT fixed in the framework.** Making `onDown` fire the first splat
would fix every app at once, but it is the pointer-to-note path `CLAUDE.md`
singles out as having hosted two invisible bugs, and only two apps ever needed it.
The limitation is recorded here instead. **Life also paints via `splat`**, so a
sub-frame tap there seeds no cell; cosmetic, not percussive, left alone.

**3. And the one the user actually meant — the bar swings out from under the
finger.** The first two were real and measured, but neither was the reported
symptom. The user re-reported precisely: *"when I click repeatedly on a chime
several presses are not recognised."* Testing **that gesture** rather than
trusting the earlier numbers showed the fix had changed nothing: `main` and the
fixed branch both missed 2–3 of 10 rapid clicks, and the pattern was
**non-monotonic** — all 10 rang at a 0 ms gap, misses at 30–100 ms, all 10 again
at 150 ms. No cooldown can make that shape.

Varying the height of the click found it:

| where the bar is clicked | rang |
|---|---|
| 20% down (near the pivot) | 10/10 |
| 30% down | 9/10 |
| 45% down | 6/10 |
| 60% down (near the bottom) | 5/10 |
| **45% down, bars reset to vertical between clicks** | **10/10** |

The control line is the proof. **A struck bar swings, the hit test followed only
its current angle, and the next tap fell into the gap it left** — while the chime
is still visibly there, swinging in its slot. The further from the pivot, the
bigger the displacement and the more presses vanish. **An instrument that gets
harder to play the more you play it**, and invisible, because the failure only
appears after a success.

**Fix: a bar is hit where it IS, and also where it HANGS.** `hitBars` now accepts
a point on the swung bar *or* inside the vertical slot the bar rests in. Slots
cannot overlap — the tolerance is `barW/2+brushR` ≈ 0.35 × spacing against
centres one spacing apart — and rest is `th=0` in both layouts, since the arc
moves each *pivot* while every bar still hangs straight down from its own.
**Accepted cost, the user's call:** tapping the empty slot of a bar that has
swung aside still rings it, which slightly loosens the "cause-and-effect you can
see" goal in `APPS.md`. Chosen because a student aims at a chime, not at a
swinging line.

**Method note, and it is the lesson.** Findings 1 and 2 came from counting
oscillators under synthetic gestures; finding 3 came from reproducing **the
gesture the user described**. The first two were true and neither was the bug.
**Drive the reported gesture before believing a measurement of a different one.**

**Verified after all three:** 7/7 — one tap = exactly one strike (no
double-fire), a sub-frame tap rings, a brisk sweep still rings 8 bars exactly
once each, one-touch survives a sub-frame press, and with the strip open the
*same* bar rings (262 Hz scaled and unscaled). **Repeated clicking is now 10/10
at every rate tested (0–150 ms) and at every height** — was 5–9/10. A slow
lingering drag still rings some bars twice: correct, and **measured identical on
main (13 strikes both)**. 21/21 clean in Edge and Firefox.

**Found on the way, in another app — see the bubbles entry below.**

### bubbles.html: its own tap fix was wrong while the surface is scaled ✅ fixed and UAT passed, `v1.7.1` — 2026-08-30

Found by checking whether the chimes bug generalised. `bubbles.html:296` converts
a **touch** to canvas pixels with `(t.clientX - r.left) * (canvas.width /
canvas.clientWidth)`. That mixes two spaces: the offset is in **rendered** pixels
(the rect is the transformed one) while the factor is the **layout**→canvas ratio.
`#surface` is scaled whenever the settings strip is open, so the result is short
by exactly the scale factor.

**Measured with the strip open (scale 0.572): 549 px where 960 px is correct — out
by 411 px on a 1280 px canvas, a third of the screen.** The mouse path is fine
(`e.offsetX` is already in the element's own space); it is the **touch** path that
is wrong, which is the one the room uses.

`toLocal()` exists precisely for this — it divides by the **rendered** rect — and
is what the chimes fix goes through. **Map a touch before anything moves.** Both
paths now go through it, so mouse and touch cannot drift apart again.

**The user's own report belongs beside this: "the bubbles have always worked
fine."** That is consistent, not contradictory. The **mouse** path was always
correct (`e.offsetX` is already element-local), and the fault needed **touch AND
an open settings pane together** — a setup-time combination, not a playing one.
A latent fault nobody had hit, not a regression, and worth saying plainly rather
than letting a measurement imply the user had been mistaken.

Verified by wrapping `toLocal` to read the point the app's own handler computed:
with the strip open at scale 0.572 it now uses **960 px, where the old formula
used 549 px**. The harness needed a lesson of its own — a synthetic `touchstart`
with **no matching `touchend`** leaves a pointer down, and `fitSurface()` bails
while any pointer is down, so the surface never re-scaled and the test quietly
measured the unscaled case and reported a 66 px error instead of 411 px.

### The Setup pane reordered, and ↺ Defaults is a preset ✅ UAT passed, shipped in `v1.7.0` — 2026-08-30

**Trigger met** (`framework.js`, seen by all 17 apps), and the doc is this section
rather than a `PHASE-*.md`, the same call the `.sectn` change got: it is a
reordering of appends in one function plus one new row, with no behaviour change
and no stored state, and it is judged by looking at the pane.

**The user's question settled it: "Defaults is actually a preset, is it not?"**
It is, and the code says so — `applyPreset({})` *is* the old Reset:

```js
applyPreset(name)                          Reset all settings
  SETTINGS = {...DEFAULTS, ...Anim, p}       SETTINGS = {...DEFAULTS, ...Anim}
  migrateBind(); applyAllSettings()          migrateBind(); applyAllSettings()
                                             padReleaseAll(); mouseDwellRelease()
                                             if(Anim.reset) Anim.reset()
```

The two release calls turn out to be belt and braces — `pollPads` already
releases when `padOn` goes false (`framework.js:1127`) and the mouse dwell
releases itself — so **the only real difference is `Anim.reset()`**.

So it moved into the preset list as **↺ Defaults**, first row. It had been on
the Presets pane once before and was moved off because *"Reset all settings"*
under a heading saying `Saved presets` read as "wipe my students' setups" — a
real objection, and one that dissolves the moment the control is **named after
the thing it loads** rather than after the act of destroying something. The
location was never the problem.

**It keeps the canvas clear**, unlike its sibling rows, for a checked reason:
twelve apps hide the 🧹 Clear rail button, and **Conductor** accumulates a baton
trail with no other way to wipe it. *Defaults* meaning "as if you had just opened
the app" also makes the odd-one-out behaviour sayable in four words.
**Tap-twice** on that row only — it is the only one that destroys anything.

**Pane order is now `Fullscreen · Access · Menu size · Performance · Show
performance`**, mostly by who owns the setting (student → display → machine).
*Amended 2026-08-31: `Reach area` joined between Access and Menu size in v1.9.0,
which keeps that same ordering — it is the student's, like Access.*
**Fullscreen breaks the grouping deliberately** and goes first: it belongs with
Menu size by ownership, and used to sit there, but the user reports reaching for
it often when setting a machine up, and the pane opens on its first control.
Burying a control that gets used to keep a grouping tidy is the wrong trade —
recorded here so it is not silently "fixed" back.

Verified: 40/40 checks across five apps, including the three that take over
panes, reading what the panes actually *say* rather than trusting the source.
21/21 pages clean in Edge and Firefox.

### Phase 4g — the Setup pane tidied, and two more stalls — 2026-08-27

**The user's spec, taken literally:** drop the `This screen` heading, rename
*Control size* to **Menu size**, remove the explanation under it, remove the
explanation under Fullscreen, and shorten the Reset button.

The pane now opens on its first control:

> Menu size 100% · Fullscreen · **Start over** · ↺ Reset all settings ·
> **This computer** · Performance · Show performance

**Two things were kept that the spec would have removed, and this is the one
judgement call in the phase.** Both hints carried a **failure message** as well
as an explanation, and only the explanations were asked for:

- **Menu size** must still say when the size asked for does not fit the screen,
  or the slider looks broken. Verified: asked 1.5 on a 700-tall window, fitted
  1.05, hint shown — *"Bigger than 105% does not fit on this screen…"*
- **Fullscreen** must still say when the browser refused, or the switch looks
  dead. Verified with a stubbed rejection: hint shown.

Both are `display:none` in the ordinary case, so the pane reads exactly as asked
and speaks only when something is wrong. **No fail states** is a non-negotiable;
a silent dead control is one.

**`uiScale` and the `ui-scale` key are untouched.** The rename is the label only
— renaming the key would silently discard every display's saved size. The phase
records and UAT sheets above still say *Control size* because that is what it was
called when they were written; they are the record and are left alone.

**Verified:** 18/18 files show no `This screen` heading, a `Menu size` slider,
`↺ Reset all settings`, and both hints hidden. 21/21 pages load clean.

#### And the same canvas stall in two more apps

Sweeping for Flock's stall at each app's **default** was not enough — the fault
appears at the top of the slider, not at the default.

- **`life.html` — it did have it.** At Ghost Trail 20 a stamped mark settled at
  `rgb(5,5,5)` against a background of `rgb(0,0,0)`; the earlier sweep called Life
  clean because it tested the default of 3, where the floor is 1 and invisible.
  Fixed with the same burn-then-clamp.
- **`life.html` was also frame-counted**, as flagged. Ghost Trail 20 lasted 0.67 s
  at 60 fps and **1.33 s at 30 fps**; now 0.67 s and 0.77 s. Its
  `1/(1+trail*0.5)` curve is already linear in duration and is kept exactly —
  `a60` reproduces the old alpha at 60 fps, so nothing changes there and only the
  dropped-frame-rate case is corrected.
- **`soundscape.html`, `colWash: off` only.** `rgb(2,2,2)` → `rgb(0,0,0)`. The
  tinted branches deliberately do **not** get the burn pass: it would fight the
  colour wash they exist to produce.
- **`conductor.html` left alone on the user's instruction.**

**The lesson:** a sweep at default settings will miss this class of fault
entirely. Test the extreme of the slider, because that is where the alpha is
small and the stall floor is high.

#### Life's glow — 5 fps in the room, and it was never mine

Reported during Phase 4g UAT: Life at Ghost Trail 20 and Glow 20 ran at **5 fps**.
The first job was to find out whether the burn pass had done it. **It had not** —
2 fps of 36, about 6%. The cost was `ctx.shadowBlur`, set **per cell**, with every
cell drawn **twice**, once for the halo and once for the crisp core. It scales
with cells × blur radius, so the *small*-cell end of the slider is the worst:

| full screen of cells, 3700×1900 | before | after |
|---|---|---|
| Glow 20, Cell 50 | 36 fps | 60 fps |
| Glow 20, Cell 14 (Stardust) | 14 fps | 60 fps |
| Glow 20, Cell 8 | **8 fps** | **60 fps** |

**Fixed with the pattern `flock.html` already uses:** every cell once into an
offscreen buffer, then **one** blurred composite of the whole buffer, then the
crisp cores on top. One filter operation per frame instead of one per cell.
`screen` rather than `lighter`, because adjacent cells are the normal case in
Life and additive blending would blow them out to white.

Two details the change needed:

- **A `bleed` of one pixel when filling the glow buffer.** Cells are drawn a pixel
  inside their square so a grid reads as cells; the old per-cell shadow happened
  to fill those seams, and the single-pass halo does not. The interior seams are
  still very slightly more visible than before — raised with the user rather than
  hidden.
- **`activeQuality()` now scales the glow**, and the radius is capped at 60 px.

That second one is the actual answer to the report, and it is worth stating
plainly: **`setQuality` only tuned the audio budget, so nothing the framework did
could rescue the frame rate.** The room PC was sitting at 5 fps with the stats
line already reading `quality: low (auto)`. Now: full glow while there is
headroom, halved at medium, **off at low**. The user's steer, verbatim — *"glow
is not that important and it doesn't need to be strong... consistent frame rate
is the most important thing."*

**The general lesson, and it is not only about Life:** an app that does not wire
`Anim.setQuality` to its *visual* cost cannot be rescued by auto-quality, however
hard the framework tries. Worth auditing the rest against this.

#### ...and the fix for that made it hunt. Correcting the record.

Tying glow to `activeQuality()` was **wrong**, and the user saw exactly why:
*"framerate drops and then glow disappears, framerate increases and then it
reappears and the frame rate drops."*

**The thing being measured was also the thing doing the controlling.** Glow was a
large part of the frame cost, `autoPerf` watched the frame rate, and glow answered
to `autoPerf` — a loop with no hysteresis, so it hunted. **A loop that hunts is
worse than either of the states it hunts between.** The coupling is gone, not
damped: `setQuality` is back to audio only, with a note saying why.

**The general rule this earns:** *anything auto-quality scales must not be a large
part of what auto-quality is measuring.*

So the halo had to become cheap enough never to drive the frame rate at all. It
is now drawn into a buffer at a third linear resolution and capped at 640 px on
the long side, blurred once at that size, and scaled back up — so it costs the
same on a 4K wall as on a laptop. Measured as the frame-time difference between
Glow 20 and Glow 0 on an identical frozen board, which is a ratio this machine's
speed does not change:

| glow cost, 3700×1900 | Cell 14 | Cell 8 (a full board is tens of thousands of cells) |
|---|---|---|
| original, `shadowBlur` per cell | **43–49 ms/frame** | **91–93 ms/frame** |
| single full-size buffer | 0.0–0.2 ms | 5.1–5.9 ms |
| **now, budgeted small buffer** | **~0.0 ms** | **5.4 ms** |

**One approach was tried and rejected, and it is worth recording because it looks
obviously right.** Blooming *from the frame already drawn* — shrink the canvas,
blur it, screen it back — would make the cost independent of cell count entirely.
It measured 0.00 ms at every cell size. **It also blew the screen out to solid
white within seconds.** The bloom is written into the canvas, which is then the
source for the next frame's bloom: positive feedback. **Bloom-from-frame is
incompatible with a canvas that persists between frames**, which is exactly what
a ghost trail is.

**Left honest:** this machine holds 60 fps in every configuration, before and
after, so the hunting could not be reproduced here — only removed structurally. If
the room PC still cannot hold a frame rate with glow up, the user has already said
they would rather drop glow than lose the frame rate, and that is one line.

#### Trimming the two sliders — 2026-08-27

With the glow fixed, the user's verdict: *"there isn't much difference between
high and low trail and glow, so let's just trim the max value down on both."*
Both ran 0–20; both now run **0–10**. The measurements agree that the top half
was buying almost nothing:

| | 0 → 10 | 10 → 20 |
|---|---|---|
| Ghost Trail, time for ink to clear | 0 → **0.42 s** | 0.42 → 0.67 s |
| Glow, at Cell Size 50 | 0 → 50 px of blur | **capped at 60 px past ~12 — identical** |

`Stardust` carried `glow:14` and is now `glow:10`, still the strongest preset.

**The lifecycle case that had to be handled:** a preset or a saved blob from
before the trim still holds up to 20, and a value past a slider's max *renders at
that value while the slider shows its end* — a control that looks broken and
stuck. `render()` clamps both, so an old preset lands on the new top of the range.
Verified: a stored 20 comes back as 10, and the slider agrees.

---

### Phase 7 — a reach area — ✅ UAT passed 2026-08-31

Designed as [`PHASE-7-REACH-AREA.md`](PHASE-7-REACH-AREA.md), which the change
triggered three ways at once: `framework.js`, `fitSurface()`, and what is stored
per student.

The whole feature is **four numbers changed in one function**. `fitSurface()`
already computed a scale and an offset and hardcoded them to "biggest that fits,
centred"; `reachSize` scales the first and `reachX/reachY` place the second. At
the defaults the arithmetic is identical to what it replaced — **measured: 57/57
transforms byte-identical to `main` across the 19 framework apps**, with the
chrome open, closed and locked.

**Nothing else had to change, and that is the point.** Input followed for free,
because `toLocal()` goes through `getBoundingClientRect()` — the form Phase 3c
chose so it would survive the surface being scaled. The gamepad cursor followed
for free, because it lives in canvas layout coordinates, behind the transform.
No app was touched. Compare Phase 2, removed because it needed a hook in all 17.

**Two of the questions the Phase 5 note raised were answered the other way:**

- **"It has to survive Lock"** — it does, and *Lock gave way*. The
  non-negotiable in `CLAUDE.md` now reads "locked is pixel-perfect **at the
  default reach area**". A smaller activity a student can reach beats a crisper
  one they cannot. Nothing else may claim that exception.
- **"Whose property is it?"** — the **session's**, which is neither answer the
  note offered. It lives in `SETTINGS` and rides in a preset like the access
  settings, but unlike every one of them it is **reset on every page load**. See
  below: that was the second answer, and the first one was a fault. (Global like
  `ui-scale` was never on: storing access settings globally was offered to the
  user twice and declined twice, § "Split the saved blob" above.)

**The one change the UAT asked for: the surround goes black.** Phase 3c paints
the space beside a scaled activity a step off the app's background, so its edge
is visible without a line round it. Under a reach area that space is **most of a
wall**, and the user's call from the projector was that lighting it is light
spilled into the room for nothing. The two cases want opposite things and **the
difference is who is looking** — the therapist with the chrome open wants the
edge cue, the student on the wall wants the rest of it dark.

Wired into `fitSurface()` rather than into the controls that change `reachSize`,
which is the more interesting half: that function already reads the setting, so
no call site can forget to repaint. The first cut *did* wire it to the slider and
to Fill the screen, and a screenshot taken through neither showed exactly the
stale surround that approach invites. **A derived visual belongs where the value
is read, not at every place it is written.**

**The fault the user found after the UAT, and the most instructive thing in the
phase.** They asked: *one therapist adjusts the screen size and location, the
next launches a link for a different student — is the reach area all wrong?* It
was. The three keys had been put in `LAUNCH_KEEP` on the argument that a reach
area is "as much a fact about a student's body as `padDead` is", so a launch link
could neither set it nor clear it, and a stale one survived into the next
student's locked session.

**Two things that analogy got wrong, and both generalise:**

1. **A setting that describes a PERSON and one that describes their POSITION
   TODAY are different kinds of thing.** `padOn` is true of a student next week;
   a rectangle round the part of a wall someone could reach on Tuesday is true of
   nobody by Wednesday. It is the only setting in the blob of that kind, and it
   was filed with the ones it superficially resembled.
2. **Check which way the failure falls before deciding what to protect.**
   `LAUNCH_KEEP` exists because resetting a switch leaves a student unable to
   play. Resetting a reach area leaves a full-wall activity — the pre-feature
   normal, which anyone can at least see. Forgetting one costs ten seconds;
   inheriting one costs a student the session, silently, and the student it is
   wrong for is often the one who cannot report it.

Fixed: the keys came off `LAUNCH_KEEP`, and `initSettings()` resets them on every
load before the link is read. **Inheriting one by accident is now impossible**,
while a link that names one gets it (and the boot toast says `· reach area 35%`),
a preset restores one, and `🔗 Copy launch link` carries one. That last part
turns the fault into the feature the room PC actually wanted: a therapist sets a
student up once and the control software reproduces it, wall position included.

**The design-doc lesson underneath it: the lifecycle section had no row for "a
new session begins".** It had added, changed, replaced, removed, conflict,
display-changed and chrome-changed — and the missing row is exactly where the
fault was. `CLAUDE.md` names replacement and duplication as the two that get
forgotten; **"inherited by the next user of a shared machine" belongs on that
list**, for anything that runs on a room PC.

**Found on the way, and fixed here.** The comment above `LAUNCH_KEEP` claimed
*"a link that NAMES one of these still sets it"*. `applySettingsParam()` has
never done that — it declines the key outright. The probe believed the comment
and failed. The behaviour is right and the comment was wrong; the comment is
corrected. Worth noting as a class: **a comment can be wrong for months in a
file with no tests, and only a probe that acts on it will say so.**

---

### Phase 5a/5b/5c — access: a stick, a keyboard, and the Access pane — 2026-08-27/28

Three branches, one subject: **the ways into an activity other than a finger on
glass.** Each has its own design doc; this is the record of where they landed
and what is still open.

| | what it added | doc |
|---|---|---|
| **5a** ✅ | a gamepad stick drives a pointer in canvas layout coordinates, so every app plays without knowing a gamepad exists | `PHASE-5A-GAMEPAD-POINTER.md` |
| **5b** ✅ | a key fires a named rail action — a key says WHEN, never WHERE | `PHASE-5B-HUB-KEYS.md` |
| **5c** ✅ UAT-passed | the pane those two had outgrown: three tabs, dwell, and controller buttons doing actions | `PHASE-5C-ACCESS-PANE.md` |

**Why 5c existed at all.** 5a and 5b each appended their controls to one flat
list. The result was a long scroll that was wordy, said **nothing about the
mouse** — and silence reads as "not supported" — and left a dozen controller
buttons able to do nothing but play. The fix is `Controller · Mouse · Buttons`,
**tabs and not a mode switch**: a therapist on the mouse and a student on the
stick is the normal case, so every device stays live whichever tab is showing.

**The one idea worth carrying forward** is that *pressing without a click* is
**two settings, not one**, because it serves two different students:

- **Pushing the stick plays** — for a student who cannot aim; any sound is a good
  outcome, and every cell crossed on the way sounds.
- **Dwell** — for a student who *can* aim but cannot press; travel is **silent**,
  and arriving and holding still is the press.

They are not substitutes, and **dwell is per device** (`dwellPad` / `dwellMouse`).
One shared dwell would mean switching it on for the student's stick also made the
therapist's own mouse fire every time they paused over the activity.

**The rule that makes buttons-as-actions unambiguous:** a button bound to an
action **stops playing**; every unbound button still plays. That keeps 5a's
friendly failure — a student pressing anything still gets a note — and the
Controller tab says live which buttons went quiet, because nothing else would
explain it.

**State.** `bind = { '<railId>': {type:'key'|'pad', code} }` replaces 5b's
`keyMap`, keyed by **action** now that one action has one trigger of either kind.
It defaults to `null`, which is what distinguishes a fresh profile (seed X →
Clear, Y → the app's main action) from one a therapist has deliberately emptied
with ✕ (honoured, never re-seeded). All of it is per **student** and rides in a
preset, unlike Menu size and Fullscreen which belong to the display.

**A modal owns the screen** (UAT round 2, 2026-08-30). The pad pointer injects
coordinates rather than reading events, so it was walking straight through the
three body-level modals: it played notes behind the colour picker in every app
that has one, and **retargeted the Drums and Sampler pad editors onto a different
pad while the therapist was in them**. The rule is the same split the session lock
already uses — **a modal stops the pointer (WHERE), never the buttons (WHEN)** —
and it *suspends* rather than releases, so a student slow to aim resumes where they
were instead of at the centre. Making the pointer *drive* a dialog was considered
and rejected: it would need DOM hit-testing, focus and dismissal in every app's
own dialog, which is the shape that killed Phase 2. `PHASE-5C-ACCESS-PANE.md` §11.7.

**Verified by driving the pages**: 21/21 clean in Edge *and* Firefox, 84 behaviour
checks with a faked standard-mapping gamepad, and 108 layout measurements at Menu
size 0.8/1.0/1.5 on two screen sizes. `PHASE-5C-ACCESS-PANE.md` §12 lists them.

**Closed at UAT, 2026-08-30:**

- **The XAC has been tested on real hardware, and works.** From 5a onwards every
  doc carried the same named gap: the pad path was driven through a faked
  `navigator.getGamepads`, the same surface a real controller arrives on but not a
  real one, and no machine without the hardware could settle it. The user settled
  it. Nothing in the pad path is assumed any more. **Its ports arrive by name**
  (`A`, `Left trigger`) — it reports the standard mapping — so a therapist can read
  a port off the pane and write it on a label, which is what §15 of `PHASE-5A` was
  built for and could only hope was true.
- **The system arrow's hiding rule keeps the build's version, not §6's literal
  one** — `PHASE-5C-ACCESS-PANE.md` §11.5. It hides the arrow once the mouse has
  been *abandoned* for 2.5 s rather than whenever any ring is in play, because the
  literal reading leaves a therapist with no pointer at all over the activity while
  a student's stick drives. Carried as an open question through two UAT rounds and
  accepted at the third.

**Still open:**

- **Phase 2's switch access stays removed.** Nothing here needs any of the 17
  apps to cooperate, which is the whole reason it survived where Phase 2 did not.
