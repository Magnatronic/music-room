# UAT — Phase 12, third look: Fireworks

> After travelling Waves was rejected, this one is deliberately a change of
> **amount, not meaning** — the explosions get bigger and there is a new
> `Particle size` slider. Nothing about what Fireworks *is* has changed.
>
> **Nothing outside the Fireworks style changed.** Lava is exactly as you passed
> it; Waves is the oscilloscope you asked to keep.
>
> About 5 minutes.

---

## T1. The explosions are bigger, and the slider can go much further

**The slider was the fault, not the explosion.** `Burst size` scaled how *many*
particles you got linearly, but how *fast* they were thrown by a square root — so
its whole range only moved a burst's reach by a factor of 1.75, and **no setting
made a firework that filled the screen**.

Reach at 0.9 seconds after the bang, as a fraction of the screen's short side:

| `Burst size` | before | now |
|---|---|---|
| minimum | 0.180 | 0.179 |
| **default** | **0.245** | **0.340** |
| maximum | 0.315 | **0.571** |

1. Open `voice_visuals.html`, **🎤 Voice** tab, microphone on.
2. Style → **🎆 Fireworks**.
3. Clap, or make a sharp sound. Watch one burst.
4. Open the app's own pane and take **Burst size** to the top. Clap again.

**Expected:** at the default a burst is clearly wider than before; at the top it
reaches well past the edges of the screen.

**And the bottom of the slider still gives you the old smaller burst** — that is
deliberate. It is the thing travelling Waves could not offer, and part of why
that one had to be dropped whole instead of dialled back.

---

## T2. Particle size

New slider, 0.4 to 3, affecting both the rising embers and the burst.

1. **Particle size** to the bottom, then to the top, making sounds at each.

**Expected:** fine sparks at the bottom, fat glowing dots at the top. Nothing
else about the burst changes — same count, same reach.

---

## T3. The rest of Fireworks is untouched

1. Hum quietly and watch the rising embers along the bottom.
2. Sweep **Embers** and **Fall speed** end to end.
3. Tap the screen.

**Expected:** unchanged — quiet sounds still send embers up across the skyline,
`Fall speed` still governs the shower, and a tap is still worth a shout.

---

## T4. The other eight styles

1. Click through **Mandala, Lava, Waves, Flow, Pixels, LEDs, Ripples,
   Starfield**, playing into each.

**Expected:** exactly what you have already passed.

---

## What I verified, and one thing I got wrong

- **Verified:** burst reach at three slider settings, measured on the page at a
  known age after each bang, against the shipped build measured the same way;
  27/27 pages load clean; 9/9 styles played into; 9/9 drawn and swept with no
  microphone, including the new slider.
- **I told you the old explosions were "a 62-pixel puff" and that was my probe,
  not your app.** It was wrong three separate ways — it measured the *previous*
  burst's survivors, it mixed percentiles taken from different frames, and it
  split bursts on every frame rather than on the moment one starts, so every
  figure was about a third of the truth. The old explosions reached 0.245, not
  0.077. What found it was making the probe print the age it actually measured
  instead of the age it asked for.
- **A mechanism I built on that bad number has been deleted**, not left in: I
  blamed the reach on gravity starting too early and faded it in over the first
  0.4 s. Re-measured properly it changed nothing — 0.314 with it, 0.318 without.
- **Not verified:** whether the new default is the right size for the room. T1 is
  that question, and both ends of the slider are yours.

## Still open from §12.6 — four looks

Whether the Fireworks *fall* is interesting; a stronger Mandala at full loudness;
a bolder Flow; LEDs against WLED's repertoire; a Starfield that moves *through*
space.
