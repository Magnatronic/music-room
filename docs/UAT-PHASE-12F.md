# UAT — Phase 12: Starfield round two, and the LEDs

> ⚠️ **SUPERSEDED by `UAT-PHASE-12G.md`, and section B describes a build that no
> longer exists.** The six LED patterns it asks you to click through were
> replaced by the LED wall the next day. Kept as the record of what was tested;
> do not run section B.

> Branch `phase-12-starfield`. It also carries the **Flow deletion**, which is
> merged to `main` now — that is why Flow is gone from the Style menu here.
>
> Two things to look at: the four Starfield fixes you asked for, and the LED
> repertoire. About 8 minutes.

---

## A. Starfield — the four things you reported

### A1. The halo is gone

Your photograph was three `glowDisc` radial gradients a quarter of the screen
across, banding into concentric rings on an 8-bit canvas. **Deleted, not tuned** —
the fourth time this project has answered a banding gradient by removing the
mechanism (Soundscape's glow, the firework afterglow, the frame fade, now this).

1. Style → **⭐ Starfield**, microphone on. Look at an empty part of the screen.

**Expected:** black. No large soft discs, no rings.

### A2. Stars cover the screen

They were seeded in a small disc around the vanishing point, so at the depth
where a star spends most of its life every one sat near the centre — your
photograph is exactly that, and the arithmetic says it could not have been
anything else. **They are born anywhere on screen now.**

Measured on a 16×9 grid: **100% of the width used, 64% of cells lit**.

There are also **more of them** — 300 instead of 140 at high quality, and the
`Stars` slider goes to 2.5.

1. Watch the sky, quiet and then loud.

**Expected:** stars to the edges and into the corners, not a knot in the middle.

### A3. Travel speed cannot be set to 0

It is **0.25 to 2** now.

1. Take **Travel speed** to the bottom.

**Expected:** slow, but still flying. (This overrules what I built yesterday,
where 0 was the point of the slider — that was my answer to Waves being
undialable. Your room, your call.)

### A4. Rising sparks are now **Passing dust**

They drifted *up* from the floor while the rest of the sky flew outward — the
only things in the frame moving the wrong way.

1. Hold a note and watch the coloured particles.

**Expected:** dust flies past you with everything else, from the vanishing point
outward. The slider is renamed but **keeps your saved value** — if you had turned
Rising sparks down, Passing dust is down too.

---

## B. LEDs — the repertoire

**The honest comparison first.** Measured against WLED, this style had three of
its effects — a VU fill, a theatre chase and bidirectional pulses — **all running
at once, with no way to choose between them.** WLED is fundamentally a chooser: a
strip is hardware, an effect is a choice made on it.

There is a **Pattern** slider now, and it names what it selects:

| # | pattern | what your voice does |
|---|---|---|
| **1** | **Strip + EQ** | the look you have today — VU fill, chase, pulses |
| 2 | Meteors | heads with tails; a clap launches one, a held note streams them |
| 3 | Sparkle | a random handful lit, re-rolled on every sharp sound |
| 4 | Fire | flicker hottest at the bottom, height from loudness |
| 5 | Rainbow run | a colour wave around the strip, loudness sets its speed |
| 6 | Breathe | the whole strip together — the calm one |

1. Style → **💡 LEDs**. Work through **Pattern** 1 to 6, making sounds at each:
   a clap, then a held note.

**Expected:** six clearly different looks, all of them answering your voice.
Pattern 1 is the default and is **exactly** what you have today — nothing changes
for a student already set up on it.

2. Take **Equalizer height** to 0.

**Expected:** the centre equalizer disappears and the strip runs alone. (That
slider could not reach 0 before.)

---

## What I verified

- **Starfield:** the halo gone; 100% of screen width covered and 64% of a 16×9
  grid lit; 594 stars past the camera per second on a loud hum against 51 in
  silence; `Travel speed` 0 is refused and behaves as 0.25.
- **LEDs:** every pattern **selected, played into and dragged across** — the gate
  this project exists for, since a fault in one pattern's draw code cannot throw
  until that pattern is both chosen and given a sound. All six clean; **all 15
  pairs are visibly different pictures.**
- **Photographing the patterns against a held hum found a real fault** that the
  error gate could not: Meteors launched only on transients, so a student holding
  a note got an empty strip. They stream on loudness now.
- 27/27 pages load clean; 8/8 styles played into; 8/8 drawn and swept with no
  microphone.
- **A test regression of mine reached `main`:** `gate.js` used `styles.length` in
  a line above the declaration of `styles`, so the style gate threw before
  running. Introduced when the count became dynamic for the Flow deletion, and I
  did not re-run the gate on that branch. Fixed.

## Still open from §12.6 — one look

Whether the Fireworks *fall* is interesting.
