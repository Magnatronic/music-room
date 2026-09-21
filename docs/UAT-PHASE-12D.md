# UAT — Phase 12, fourth look: a stronger Mandala at full loudness

> **This is a separate branch from the Fireworks one** (`phase-12-mandala`, off
> `main`), so the two can be judged independently — Fireworks is still waiting on
> your sign-off. Nothing outside the Mandala style changed here.
>
> About 4 minutes. **T2 is the trade-off I need your judgement on.**

---

## T1. At your loudest, the mandala is now near full size

Like the Fireworks slider, this turned out to be arithmetic rather than taste.
Each spoke is drawn from a **band** value, which is the *average* of its FFT bins
— and a voice puts its energy into a few harmonics, so averaging dilutes it. The
loudest band of a sung note measures 0.69, not 1. The code then compressed what
was left. **At the top of the app's own calibrated loudness the mandala was
drawing at about half the size it is allowed.**

Share of its permitted reach the longest spoke actually uses, at loudness ≈ 1:

| what you make | before | now |
|---|---|---|
| a sung note | 0.59 | **0.82** |
| a babble | 0.65 | **0.85** |
| a clap | 0.40 | **0.67** |
| a hiss | 0.12 | **0.27** |

1. Open `voice_visuals.html`, **🎤 Voice** tab, microphone on.
2. Style → **🌸 Mandala**.
3. Sing a note as loudly as a student comfortably would.

**Expected:** the spokes reach out near the ring, not half way. Nothing about the
*shape* of the pattern changes — the gamma is untouched, so the spectrum draws
the same picture, at a bigger size.

4. Now shout, or clap hard.

**Expected:** it grows further still and the spokes stay *different lengths*.
There should be no moment where a group of them all stop at exactly the same
length and the pattern reads as a circle — that was a real risk here, and it is
the same fault as the flat line across Waves, so it is worth a look.

---

## T2. The cost: quiet sounds look less quiet

**This is the judgement.** Filling the picture at the top compresses its
dynamics. Measured off the same loudness ramp — spoke length as a percentage of
the loudest:

| loudness | before | now |
|---|---|---|
| 0.3–0.4 | 23% | 44% |
| 0.5–0.6 | 32% | 56% |
| 0.7–0.8 | 45% | 69% |
| 0.9–1.0 | 100% | 100% |

1. Make a very quiet sound, then a medium one, then your loudest.

**Expected:** the picture still clearly grows with loudness — but the gap between
quiet and loud is smaller than it was.

**Which way this cuts depends on the student, and you know them:**

- it **helps** a student who cannot get loud — their sound no longer draws a
  nearly invisible pattern;
- it **costs** headroom for a student you are encouraging to get louder, because
  there is less room left to reward them with.

Tell me which matters more and it is a one-line change either way. I tried a
steeper curve to keep the contrast *and* fill the frame; measured, it bought
nothing (40/55/70% against 44/56/69%) and made a hiss worse, so the compression
is inherent rather than a tuning failure.

---

## T3. The rest of the Mandala is untouched

1. Sweep **Detail (bars)**, **Reach**, **Bass glow** and **Voice texture** end to
   end.
2. Touch and drag on the mandala.
3. Play a hiss and then a clear note, watching the spoke edges.

**Expected:** all unchanged. `Reach` still scales the whole thing, touch still
stretches a spoke out to your finger and lights only the touched side, and the
voice-texture behaviour is the one you passed with Lava.

---

## T4. The other eight styles

1. Click through **Lava, Waves, Flow, Pixels, LEDs, Ripples, Fireworks,
   Starfield**, playing into each.

**Expected:** exactly what you have already passed. (Fireworks here is `main`'s
version — the bigger explosions are on the other branch.)

---

## What I verified, and what I got wrong

- **Verified:** the share of permitted reach for six kinds of sound, against the
  shipped build measured the same way; the dynamics across a −55 → −10 dBFS
  ramp; 27/27 pages load clean; 9/9 styles played into; 9/9 drawn and swept with
  no microphone.
- **My instrumentation was wrong first — the fifth time in this phase.** It
  compared a length in pixels against a stored fraction of the screen, so every
  spoke beat the stored value and it recorded the *last* spoke instead of the
  longest. It reported 0.010 where the formula plainly gives 0.272. What caught
  it was checking the reading against the arithmetic it was meant to confirm.
- **Not verified:** whether the compressed dynamics are right for your students.
  That is T2, and it is yours.

## Still open from §12.6 — three looks

Whether the Fireworks *fall* is interesting; a bolder Flow; LEDs against WLED's
repertoire; a Starfield that moves *through* space.
