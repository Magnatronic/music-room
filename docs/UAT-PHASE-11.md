# UAT — Phase 11: listening properly (Voice Visuals)

> ## ROUND 3 — start here (2026-09-05)
>
> Eleven reports. **Four were faults and are fixed below (§T1–T5).** One — "Ripples
> stops recognising" — turned out to be a fault somewhere other than where it
> looked, and §T2 says where. **The other six are judgements about how the styles
> look and are NOT in this build**; §T7 lists them and says why they are coming
> one at a time instead.
>
> **Two of my own theories were measured and found wrong** before any code was
> written, which is worth knowing because both sounded right: the room floor does
> not drift, and the microphone does not stop hearing claps.
>
> About 12 minutes. §T1 and §T2 are the ones I most need your eyes on.

---

## T1. The room is not noisy any more — and tell me the number

**This is the report I most need a number back on.** The warning was not
detecting a noisy room at all. It was detecting that the *input* clamped.

`FLOOR_MAX` was −25 dBFS, so three rooms I measured at −24, −20 and −16 dBFS all
came back as the **same** floor. At −16 that is 9 dB wrong: the gate sits open on
the room alone, and the level averages 0.35 with nobody making a sound. A hot
microphone and a noisy room need **opposite** advice — and the old message said
*"move the microphone closer to the student"*, which makes a hot input worse.

1. Open the **🎤 Voice** tab, turn the microphone on, and be quiet.
2. **Read me the whole line.** It says *"Hearing −xx dB · room floor −xx dB ·
   range xx dB"*. **The room floor number is the one I cannot see from here.**
3. **Expected in a quiet room:** a floor around −50 to −60 dB, range 28 dB, and
   **no warning underneath**.
4. If a warning does appear, it should now be one of two, and they say different
   things:
   - *"The microphone is running hot…"* — points at the Windows sound settings.
     This is the one you will get if your floor reads above −30.
   - *"This room is noisy…"* — the old message, now only shown when it is true.
5. If you get the hot-microphone one: turn the microphone's level down in
   Windows, tap **🎧 Listen to the room**, and tell me whether the floor moves
   and the warning clears.

**What I could not test:** which of the two your room actually is. That is what
step 2 answers.

## T2b. Ripples, round four — the gate is gone and the ring follows the sound

Your four observations. Three were faults; the fourth I could answer by measuring
rather than arguing.

**"Is there any benefit to Rings no closer together than?" — no, and it is
deleted.** I drove the sounds it was written for. Rings per second:

| signal | gate 1.33 s | gate 0.20 s | gate 0.07 s |
|--------|-------------|-------------|-------------|
| raspberry, a burst every 71 ms | 0.06 | 0.06 | 0.06 |
| babble, a syllable every 250 ms | 0.08 | 0.08 | 0.08 |
| one sustained hum | 0.07 | 0.07 | 0.07 |
| **deliberate claps 0.6 s apart** | **0.53** | **1.60** | **1.60** |

It changed **nothing** on any sound it was meant to tame — the transient test
already holds all three to one ring each. The only thing it affected was
deliberate clapping. So it is not "pin it low", it is **gone**, and the slider
slot goes to **Centre glow**, which was your suggestion.

**"The first ring comes out slower" — real, and worse than that.** The ring took
its size from the smoothed display level rather than from the sound that fired
it, so *identical* claps drew different rings depending on the gap before them:

| claps | first ring | the rest |
|-------|-----------|----------|
| 0.6 s apart | 0.46 | 0.71 |
| 0.8 s apart | 0.46 | 0.61 |
| 1.2 s apart | 0.46 | 0.51 |

— while the actual loudness read 1.00 every single time. And the same numbers
show something you have not mentioned but will now see: **loudness barely moved
the ring at all**, because the strength never left 0.46–0.73. It spans the full
range now: across claps from very quiet to loud the spread is 0.40 where it used
to be 0.05.

1. **💧 Ripples. Clap once after silence, then clap steadily.** Expected: the
   first ring is the same as the rest.
2. **Clap gently, then hard.** Expected: a small slow ring and a big fast one —
   this should be a much bigger difference than before.
3. **Clap as fast as you like.** Expected: a ring every time, no exceptions.

**Wave speed is now 0.2–1.00** (was 0.4–2.00), default 1.00, so the default is
the ceiling and the slider only calms it. *If you had a preset saved at ×2.00, it
now behaves as ×1.00 — the slider used to show a clamped number while the drawing
used the stored one, which is fixed for every style's sliders, not just this one.*

4. **✨ Visuals → 💧 Ripples.** Expected three sliders: **Centre glow**, **Wave
   speed** (max ×1.00), **Wave thickness**.
5. **Centre glow.** Hum quietly — too soft to make a ring at all. Expected: the
   middle opens up visibly. It used to move by a twentieth of the screen at that
   loudness and now moves about four times as far. **This is the one I most want
   your judgement on** — it is the whole response for a student who cannot make a
   sharp sound, and I have only seen it respond to synthetic noise.
6. A ring is now born at the **edge** of the glow rather than inside it, so it
   reads as thrown off the pulse. Say if you prefer it starting from a point.

## T2a. Ripples, every second clap — FOUND, and it is a slider

**You found this, and the half of your sentence I would have ignored is what
found it.** "The centre pulses" localises the fault exactly: the centre glow is
drawn straight off the loudness and passes none of the gates a ring passes, so a
pulse with no ring means the microphone heard it and something downstream threw
it away.

It is the **Wave rate** slider on ✨ Visuals. 24 claps 0.6 s apart:

| Wave rate | ring gate | onsets heard | **rings drawn** |
|-----------|-----------|--------------|-----------------|
| ×1.00 *(default)* | 0.20 s | 24 | **24** |
| ×0.40 | 0.50 s | 24 | **24** |
| **×0.30** | **0.67 s** | **24** | **12** |
| **×0.20** | **1.00 s** | **24** | **12** |
| ×0.15 | 1.33 s | 24 | 8 |

Every clap is heard the whole way down. The gate discards every other one.
**Round 2 is where that value came from** — I widened this slider's slow end for
"a student whose sounds run into one another" and told you to try it.

1. **✨ Visuals → 💧 Ripples. Read me what the slider says.** It is now called
   **"Rings no closer together than"** and shows **seconds** — `0.67 s` — instead
   of `×0.30`, which told you nothing about what it was doing.
2. Set it to about **0.20 s** (or tap **↺ Reset this style**). Clap steadily.
   **Expected: a ring for every clap.**
3. Then drag it slowly toward `1.33 s` and clap. **Expected: you can now see
   yourself asking for fewer rings**, which is the whole point of the change.

**I have not changed the default or the range** — suppressing rings is what the
slow end is *for*, and you asked for it. What changed is that it says so.

*(Also fixed underneath: a shut gate used to swallow the clap's transient as well
as its ring. Onsets and rings now agree.)*

**§T2 below is left as I wrote it, wrong, because the mistake is worth seeing:**
I closed this report on a count of onsets, and an onset is not a ring.

## T2. Ripples — and the fault was not where either of us thought

**The microphone was never missing your claps.** I put an onset counter in the
page and drove it with recorded clap trains:

| claps | spacing | onsets fired |
|-------|---------|--------------|
| 40 | 0.5 s apart | **40 of 40** |
| 7 | 1.5 s apart | 7 of 7 |
| 6 | 0.25 s apart | 6 of 6 |

*(A first probe reported 27 of 40 and matched your description exactly. It was
wrong — it counted the length of the live rings list, which falls as rings expire,
so an arriving ring and a departing one cancelled out. It nearly bought a rewrite
of the listening code.)*

**What was actually happening is §T3 *and* §T2a.** After ten seconds of clapping,
90% of the Ripples screen was holding a permanent ghost of every ring ever drawn.
But the rings were **not** all being made — see §T2a. The table above counts
transients detected, not rings drawn, and there is a second gate between them
that I did not measure.

1. Style **💧 Ripples**. Clap steadily for **twenty seconds**, about two a second.
2. **Expected: a ring for every clap, all the way through**, and a screen that
   goes back to black between them instead of silting up.
3. Now stop, and watch for ten seconds. **Expected: it clears completely.**
4. **If it still stops responding after a few claps, say so plainly** — that
   means the listening path is at fault after all and I have been looking in the
   wrong place. It is the one outcome that would send me back to the start.

## T3. The ghosting — every style, and it was arithmetic

Your screenshot was right and it was never going to be fixed by tuning a number.
Each style painted the background over the canvas at a low alpha every frame,
which on an 8-bit canvas is `dst = dst × (1 − fade)` with rounding — so a pixel
stops moving as soon as `dst × fade` drops below a half, and **sits there for
ever**. No fade below 0.5 can reach zero, and 0.5 erases the trail it exists to
draw. There was no number to pick.

Measured off screenshots, dim-but-not-black pixels ten seconds after the last
sound, before → after:

| style | before | after |
|-------|--------|-------|
| Ripples | 6.96% → **90.49%** | 6.97% → **6.58%** |
| LEDs | 10.24% → 20.48% | 11.51% → 10.99% |
| Waves | 7.16% → 19.90% | 9.70% → 9.17% |
| Flow | 6.58% → 17.40% | 6.60% → 6.44% |
| Fireworks | 6.55% → 10.91% | 6.55% → 6.31% |

The frame is now **cleared**, not faded. Flow and Fireworks were the two whose
trails *were* the leftover ink, so they now carry their own path and draw it.

1. Every style: make sounds for a while, stop, wait ten seconds.
2. **Expected: the screen returns to plain background. No grey haze anywhere.**
3. **Flow and Fireworks are the two to look at hardest** — their trails were
   rebuilt, not just cleared. Fireworks should still have comet tails; Flow
   should still have ribbons.
4. **If Flow's ribbons now look too short or too thin**, say which — *Trail
   length* on the Visuals tab drives them directly now, and I would rather change
   the default than have you find the slider.

## T4. A tap is worth a shout

You were right, and it was every style, not just Fireworks. A tap was quietly
weaker than the loudest voice everywhere:

| style | a tap gave | a full-loudness voice gave |
|-------|-----------|---------------------------|
| Fireworks | 18 particles at 0.30 × screen | 80 at 0.72 × screen |
| Ripples | strength 0.55 | 1.0 |
| Mandala | 0.7 | 1.0 |
| Lava | 0.6 | 1.0 |
| Starfield | one star | a whole scatter |

All of them now use the same expression the voice uses at full loudness.

1. In each style, **shout, then tap the screen.** Expected: the two produce the
   same size of event.
2. **Starfield's tap has changed shape**, not just size: it used to plant a
   single star, and now it scatters like a shout does — some of which settles
   into stars. Tell me if you preferred the single star.

## T5. The straight line across Waves

The trace was hard-clamped, so it pinned flat at exactly the line in your
screenshot. It bit far earlier than the code claimed, because the ceiling it was
scaled against is an **average** level but it was being applied to **instantaneous**
samples, and a waveform's peaks run 3–6× its average. Measured, the level at
which the line went flat:

| room | a sine | a voice | a clap |
|------|--------|---------|--------|
| quiet | 0.93 | 0.75 | 0.61 |
| hot | 0.89 | 0.55 | **0.23** |

So in a hot room a clap drew a flat line at under a quarter of full loudness.

1. Style **〰️ Waves**. Make loud sounds, clap, shout.
2. **Expected: no straight horizontal cut anywhere.** The peaks round over
   instead of flattening.
3. Check the trace still reaches a satisfying height when you are loud — the fix
   trades the flat top for a slightly softer approach to the edges.

## T6. Regressions

1. Every one of the nine styles: select it, make a sound, and **drag on it**.
2. Nothing from the speakers, ever.
3. Old presets still load; **🔗 Launch links** still work.
4. Turn the microphone on and off a few times.

*(Verified here: 27/27 pages load clean and all 9 styles draw, drag and sweep
their sliders with no errors. One fault was caught by that gate during this
round — Flow threw on the first frame after a touch — which is why it is run.)*

## T7. What is NOT in this build, and why

Six of your eleven are judgements about how a style looks, and §11.6 last round
is the precedent for how those go wrong when I guess at seven of them at once.
Still open, in the order I would take them:

1. **Fireworks** — bigger explosions; the slider set to particle **size** rather
   than burst size; whether the fall is interesting at all.
2. **Lava** — the jitter. You are right that it is not lava-lamp-like: the blob
   radius follows a 30 ms attack on its frequency band, and wax does not move in
   30 ms. This one I am confident about.
3. **Starfield** — moving *through* space rather than looking at it.
4. **LEDs** — against WLED's actual repertoire.
5. **Waves** — travelling horizontally. I think you are right and it would read
   better than an oscilloscope.
6. **Flow** — bolder and more dynamic. Half-done already: its ribbons are drawn
   from a real path now rather than being leftover ink, which is what makes
   "bolder" possible at all.
7. **Mandala** — a stronger, wider effect at full loudness.

**Tell me which of these to do first** and I will build it and show you, rather
than hand you seven guesses.

---

> ## ROUND 2 (2026-09-04) — superseded by round 3 above, still worth a pass
>
> Everything you reported is fixed or answered. **Run §R1–R7 below first**; the
> original round-1 checklist is still underneath and worth a pass, but the menu
> has moved so its step numbers 8 and 9 are stale where they name Setup.
>
> **The menu moved.** The microphone — switch, meter, readout, Sensitivity,
> Range, Voice range — is now on the **🎤 Voice** tab (what was the Sound
> tab). `Setup → Access` has nothing of ours on it any more.

---

## R1. Two claps close together

1. Style **💧 Ripples**. Clap **twice, fast** — about a quarter of a second apart.
2. **Expected: two rings.** Before, the second clap was swallowed.
3. Now clap six times quickly. Expected: six rings.
4. Style **🎆 Fireworks**, same claps. Expected: an explosion for each.
5. Clap **seven times, 1.5 s apart**. Expected: exactly seven rings — the
   behaviour you signed off on 31 August, which this must not have broken.
6. Now **hold** a loud note for four seconds. Expected: **one** explosion at the
   start, not a stream of them — it is a transient, not a level.

**This was two faults, not one, and the second only appeared once the first was
fixed.** The transient was being read off the 350 ms release envelope, so a
second clap during that decay had almost no gap left to jump — six claps 0.25 s
apart gave **1 ring**. With that fixed, Fireworks gave six bursts and Ripples
still gave **two**, because Ripples has a gate of its own that allowed one ring
per 0.55 s whatever the sound did. That default is now 0.2 s, with the slider's
range widened at the *slow* end instead — which is the end it was always
described for, "a student whose sounds run into one another".

Now measured in the page: **6 rings, 6 explosions** from six claps 0.25 s apart,
and seven claps 1.5 s apart still give seven. A single clap needs exactly the
same loudness as before — 0.50 at every frame rate.

## R2. The starting wait, and the wedged microphone you photographed

**Your screenshot was the escalated message working exactly as designed** — and a
microphone that genuinely would not open. Two things came out of it.

**The wedge is not the app.** On my machine the same day, `getUserMedia` called
straight from the page resolved in **33 ms** and the app went live in under a
second — after I cleared stale browser processes. Before that, 36 consecutive
attempts opened it zero times, with no code change in between. It is the
environmental audio-device stall this project already has on record, which last
time cleared with a PC restart.

**But the screenshot showed a real gap that IS the app's.** Once that message
appeared, tapping only re-showed it: reloading the page was the only way out of a
state the app had put you in. Now a tap **after** the ten-second message abandons
the dead attempt and starts a fresh one, and the message says so. Before ten
seconds it still refuses, because stacking requests tells nobody anything.

1. Turn the microphone on and **time it**.
2. **Expected:** "Choose Allow on the prompt at the top of the window", then
   "Listening to the room…" for about a second, then it works.
3. **If it wedges again:** wait for "Still waiting…", then **tap it**. Expected:
   it starts over — you should get either the microphone or the same message
   again, not a dead button.
4. If two or three fresh attempts all wedge, the message's advice is the honest
   advice: unplug the microphone, and if that fails restart the PC. **Tell me how
   long it took and whether tapping again recovered it** — that is the one thing
   I cannot see from here.

The part I *did* own, the room measurement, went from a possible five seconds to
**1.0 s** measured.

## R2b. The old starting wait (superseded by R2)

1. Turn the microphone on and **time it**.
2. **Expected:** "Choose Allow on the prompt at the top of the window", then
   "Listening to the room…" for about a second, then it works.
3. **If it sits on "Starting…" for ten seconds**, the message should change by
   itself to "Still waiting…" with advice about unplugging and restarting.
4. While it is waiting, **tap the button again**. Expected: it does not start a
   second attempt, it jumps straight to that "Still waiting" advice.

**What I could not fix:** on my machine `getUserMedia` took **4.2 seconds** once
and never answered at all twice. That is the operating system opening the device
and nothing in the app can speed it up. What changed is that the app now tells
you what it is waiting for instead of looking dead — and the part I *did* own,
the room measurement, went from a possible five seconds to **1.0 s**.

If your wait is long and the ten-second message appears, that is the app working
correctly and the machine being slow. Tell me how long it took.

## R3. The firework glow is gone

Style **🎆 Fireworks**, make loud sounds.
**Expected:** bursts of sparks and no green banded disc behind them. I deleted
the mechanism rather than tuning it — a gradient that wide bands on this kind of
canvas and cannot be fixed, which this project already found once in Soundscape.

**If the bursts now look too thin without it**, say so: the answer is more or
brighter sparks, not the glow coming back.

## R4. Starfield

Style **⭐ Starfield**.

1. **Hold** a note. Expected: sparks drift up the screen for as long as you make
   sound. Before, a held note only brightened a band and nothing moved.
2. Make a **loud** sound. Expected: a burst that **slows to a stop** and leaves
   some of itself behind as new coloured stars — the sky fills up over a session.
3. Expected: shooting stars more often (the cap was 3 at once, now 6).
4. **✨ Visuals → Rising sparks** turns the drifting off if it is too busy.

**This one is a judgement and I have only seen it respond to synthetic noise.**
If it is still boring, tell me which of the three parts is not carrying its
weight and I will take a different run at it.

## R5. Range

**🎤 Voice tab.** The slider is now **Range** and shows the actual range in
decibels — the same number the readout above it prints — instead of "+8 dB".

1. Drag it and watch the readout. Expected: the two numbers agree.
2. Change Sensitivity. Expected: the Range number jumps to that chip's value.

## R6. The menu move

1. **🎤 Voice tab** should hold: the microphone switch, Listen to the room,
   the meter, the readout, Sensitivity, Range, Voice range.
2. **Setup → Access** should be back to controller, dwell and reach area only.
3. Check nothing got lost in the move.

This contradicts a rule in `CLAUDE.md` that puts per-student input settings on
Setup. I think you are right and the rule is wrong for this app: for an app whose
only sound is the one coming in, the microphone *is* the Sound tab. If you would
rather it went back, it is one move.

## R7. Regressions

1. Every one of the nine styles: click it, make a sound, drag on it.
2. Nothing from the speakers, ever.
3. Old presets still load. **🔗 Launch links** still work.

---


**Branch:** `phase-11-listening` (not merged). Round-1 checklist below; §R1–R7 above supersede it where they disagree.
**File to open:** `voice_visuals.html` — refresh is enough, there is no build.
**Time:** about 15 minutes. Steps 1–4 are the ones that matter; 5–9 are the
things I could not test and 10–12 are regressions.

Everything here was verified against **synthetic** sound in a headless browser.
**Nothing was tested with a real microphone in a real room**, which is the whole
point of this checklist. Where a step asks "does it feel right", your answer
overrides my measurement.

---

## Before you start

If you have saved presets for this app, **note what Sensitivity and Extra boost
they used**. `Extra boost` is gone (see step 8) and those presets will land on
the new default — that is expected, not a fault.

---

## 1. It hears you at all

1. Open the app and tap **🎤 Tap to turn on the microphone**.
2. **Expected:** the button changes to **🎧 Listening to the room…** with
   *"One second of quiet, so tiny sounds can be told apart from the room"*, and
   for about a second nothing responds. Then the overlay disappears.
3. Be quiet while it does that. Then make a sound.
4. **Expected:** the Mandala responds immediately.

**If the overlay never goes away**, the app is not getting audio at all — stop
and tell me which browser and what the microphone is.

## 2. The thing this phase is really about: a quiet sound

1. Open the **🎤 Voice** tab. You should see a live line reading something like
   *Hearing −46 dB · room floor −53 dB · range 28 dB*.
2. Set Sensitivity to **🤫 Whisper**.
3. Make the smallest sound you can — a breath, a hum, a click of the tongue.
4. **Expected:** it produces a big visible response, not a flicker.
5. Now make a normal-voice sound, then a loud one.
6. **Expected — and this is the fault being fixed:** the loud one is visibly
   *bigger* than the normal one. Before this branch everything from a firm voice
   upward drew an identical picture.
7. Try **🙂 Talking** and **📣 Singing** and repeat.
   **Expected:** Whisper needs a much smaller range of loudness to fill the
   screen than Singing does. All three used to behave identically in that
   respect.

**This is the step I most want your judgement on.** The three ranges are 18, 28
and 40 dB and those numbers are my choice, not a measurement. If Whisper is not
generous enough for your quietest student, say so and I will widen it.

## 3. A high voice, and the top of the palette

1. Set Visuals → Colour to **🎨 Theme colours**, theme **🌈 Prism**.
2. Hum low, then slide up as high as you can — or better, get a child to squeal.
3. **Expected:** the colour sweeps from the red end all the way to **violet**,
   and the picture rises up the screen.
4. **The old behaviour, for comparison:** anything above about 600 Hz jumped to
   the *bottom* of the palette. A child squealing with delight turned the screen
   dark red.

**Then:** on the 🎤 Voice tab, try **Voice range → 🧒 Child** and repeat with a
child's voice, and **🧑 Adult** with yours.
**Expected:** each one spreads that voice across the whole palette rather than
squashing it into a third of it.

## 4. A hiss now looks like a hiss

1. Style **💠 Mandala**. Sing a steady "aah".
2. Then say a long "shhhhh".
3. **Expected:** the "aah" draws narrow, bright, sharp-edged spokes. The "shhh"
   draws wide, dim, soft ones, and pushes the outer ring further out.
4. **The old behaviour:** a "shhh" kept whatever colour your last vowel had and
   otherwise looked identical.
5. Repeat in **🫧 Lava** — the wax rim should go soft on the hiss and firm on the
   sung note.
6. If you do not like it: **Visuals → Voice texture → 0** turns it off entirely
   and restores exactly the old look. Tell me if you would rather it defaulted
   to off.

---

## 5. The room, which I could not test

1. On the 🎤 Voice tab, watch the *room floor* number.
2. Turn on whatever the room actually has — a fan, the projector, an air
   conditioner.
3. **Expected:** within a few seconds the floor number rises to match, on its
   own, and the visuals stop responding to the room noise.
4. Turn the noise off again.
5. **Expected:** the floor drops back **immediately**, and quiet sounds work
   again.
6. Now tap **🎧 Listen to the room** while it is quiet.
   **Expected:** a second of "Listening to the room…", then the same floor.

**The failure I need you to look for:** a student making sounds that produce
*nothing at all* for more than a few seconds. That would mean the floor is set
too high and is not coming back down. Tell me the numbers on the readout if you
see it.

## 6. Deliberately break it

1. Tap **🎧 Listen to the room** *while you are talking*.
2. **Expected:** the floor jumps up and the app goes deaf to your normal voice.
   This is deliberate — you told it your voice was the room.
3. Stop talking for two seconds.
4. **Expected:** it recovers on its own.

If it does **not** recover, that is a real fault and I need to know.

## 7. A genuinely loud room

Only if you can make the room genuinely noisy.
**Expected:** a yellow line appears — *"This room is noisy — only N dB of range
left…"*. It should not appear in a normally quiet room; a fan alone is not
enough to trigger it.

---

## 8. What has changed in the menu

1. The 🎤 Voice tab no longer has **Extra boost**. It has **Range** in
   decibels (renamed from "Fine trim" in round 2 — see §R5).
2. **Why:** boost multiplied the signal, and loudness is now measured in decibels
   against a measured floor, so a multiplier has no meaning left. Keeping the
   control with a new meaning would have made every existing preset silently
   wrong.
3. **Check:** load an old preset. It should load without error and land on the
   sensitivity chip’s own range. It will *sound* set up differently from before — expected.
4. The 🎤 Voice tab has a new **Voice range** row (Wide / Adult / Child / Auto).
   **🌍 Wide is the default and works for everyone.**

**Auto** follows the student's own voice so they always reach the whole palette,
but the same note gives a different colour in a different session. I made Wide
the default for that reason. Tell me if you would rather it were Auto.

## 9. Things that ride with a student

1. Set Sensitivity, Fine trim and Voice range for a student, save a **⭐ Preset**.
2. Load Defaults, then load the preset back.
   **Expected:** all three come back.
3. Copy a **🔗 launch link**, open it in a new tab.
   **Expected:** all three come back, and no *"setting not understood"* warning.

**Note:** the room floor is deliberately **not** saved anywhere and never travels
in a preset or a link. It is a fact about the room today, not about a student —
saving it is what would let a floor measured on a quiet afternoon leave the next
student unheard.

---

## Regressions — things that must NOT have changed

## 10. Seven claps, seven rings

1. Style **💧 Ripples**. Clap seven times, about 1.5 seconds apart.
2. **Expected:** exactly seven rings, in time with the claps. This was fixed on
   31 August and the onset detector was rewritten on this branch, so it is the
   one most at risk.
3. Also check **🎆 Fireworks** and **⭐ Starfield** — a clap should burst, a
   steady hum should not.

## 11. Every style still works

Click all nine style chips and **make a sound into each one**. Touch and drag on
each one too.
**Expected:** all nine respond, nothing freezes, nothing throws.

I tested exactly this headlessly and all nine passed — but with a synthetic
220 Hz tone, not a voice.

## 12. Nothing comes out of the speakers

At any point in the above, with the volume up: **you should hear nothing at all
from the app.** It only listens. If you hear your own voice, stop immediately and
tell me — that is the one fault in this branch that would matter more than the
rest put together.

---

## What I could not test, so it is entirely on you

- **A real microphone in a real room.** Every number in the design doc came from
  synthetic sound. Synthetic voices are cleaner than a room.
- **Whether any of it looks right.** Especially step 4 — the hiss texture is a
  judgement call and I have only ever seen it respond to white noise.
- **Frame rate.** The onset fix is arithmetic; the harness cannot render at
  144 Hz. If you have a high-refresh display, step 10 on it is worth more than
  anything I ran.
- **The two numbers in `fAnalyser.minDecibels/maxDecibels`** are a starting
  point, marked as unmeasured in the code. If the Mandala looks washed out or
  too sparse on a real voice, that is where to look and I will measure it
  properly.

## If you find a problem

Tell me the step number, what you saw, and — if the 🎤 Voice readout was
open — the three numbers on it. That line is there precisely so a fault report
can carry what the app was hearing.
