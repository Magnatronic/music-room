# UAT — Phase 12, fifth look: a Starfield that moves through space

> Branch `phase-12-starfield`, off `main`. Nothing outside the Starfield style
> changed.
>
> **Built with the Waves rejection in mind.** That one changed what a style meant
> and gave you no way to turn it down, so it had to be dropped whole. This one
> has a **`Travel speed` slider that reaches 0, and at 0 it is exactly the still
> sky you have today.** If the flight is wrong, turn it off — nothing is lost.
>
> About 5 minutes. **T2 is the one that decides whether this stays.**

---

## T1. You are flying

Every star now has a depth. It sweeps outward from a vanishing point, accelerates
as it comes past you, and a new one appears in the distance behind it. Loudness
is the throttle.

Measured, in stars passing the camera per second:

| setting | stars past / s |
|---|---|
| `Travel speed` 0 | **0.0** |
| travel 1, silence | 8.6 |
| travel 1, a loud hum | **142.9** |
| travel 2, a loud hum | **285.7** |

1. Open `voice_visuals.html`, **🎤 Voice** tab, microphone on.
2. Style → **⭐ Starfield**.
3. Be quiet for ten seconds.
4. Then hold a note, and get louder.

**Expected:** in silence the sky drifts slowly toward you — calm, not still. As
you get louder you surge forward. Stop, and it settles back to a drift.

---

## T2. Turn it off and the old sky comes back

**This is the test that matters.** Waves was dropped because there was no way to
have the old behaviour; here there is.

1. Open the app's own pane, **Travel speed** → all the way down (0).
2. Make sounds.

**Expected:** exactly the Starfield you have now — a still twinkling sky, the
voice lighting a band at its pitch height, sparks rising, bursts settling into
stars. Measured: 0.0 stars pass the camera per second, and the picture changes no
more than it does in silence.

**If you prefer it off, say so and I will make 0 the default** rather than
removing anything.

---

## T3. The horizon follows your voice

The point you fly toward sits at the **pitch height**, so a rising voice lifts
the horizon.

1. Slide your voice from low to high and back.

**Expected:** the point everything streams away from drifts up and down smoothly.
It should **not** jump. (It is a followed value, not a set one — that is exactly
the fault you found in Lava, so it was built that way from the start here.)

---

## T4. What a shout leaves behind still works

1. Clap or shout a few times.

**Expected:** unchanged — a burst scatters, slows to a stop, and about a third of
it becomes stars. Those stars now **fly with everything else** rather than
hanging still in a moving field, and they should not jump at the moment they are
created.

2. Sweep **Stars**, **Twinkle**, **Voice band** and **Rising sparks**.

**Expected:** all as before.

---

## T5. The other eight styles

1. Click through **Mandala, Lava, Waves, Flow, Pixels, LEDs, Ripples,
   Fireworks**, playing into each.

**Expected:** exactly what you have already passed. (This branch is off `main`,
so Flow is still here and Fireworks and Mandala are `main`'s versions — those
changes are on their own branches.)

---

## What I verified, and what I got wrong

- **Verified:** the flight rate at four settings, counted on the page; that
  `Travel speed` 0 is measurably identical to a still sky; that the picture
  itself moves (0.17% → 2.18% of pixels changing per 0.35 s); 27/27 pages load
  clean; 9/9 styles played into; 9/9 drawn and swept with no microphone.
- **I wrote a claim into the code and then measured it false.** While looking at
  Flow I reported that Starfield's sky gets emptier on a bigger screen (51.1% →
  35.7%) and said depth scaling fixed it. Neither part held: that figure counted
  every non-black pixel, which here is mostly the nebula haze, placed at random
  and varying more between runs than between screen sizes. Counting only pixels
  bright enough to be a star, the falloff is 0.84 before and 0.82 after —
  unchanged. What depth scaling *did* do is double the star ink at both sizes.
  Both the code comment and the phase record now say so.
- **Not verified:** whether flying suits a student who is calmed by a still sky.
  That is T2, and the slider is there precisely because I cannot answer it.

## Still open from §12.6 — two looks

Whether the Fireworks *fall* is interesting; LEDs against WLED's repertoire.
