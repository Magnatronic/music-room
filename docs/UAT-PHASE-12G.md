# UAT — Phase 12: Starfield round three, and the LED wall

> Branch `phase-12-starfield`. Supersedes `UAT-PHASE-12F.md`.
> About 6 minutes.

---

## A. Starfield

### A1. The flight no longer steers with your pitch

You said the up-and-down movement was too quick, possibly disorientating, and
that sometimes part of the screen went blank. **The blank was a fault, not a
speed problem.** Every star is born as an offset *from the vanishing point*, so
moving that point moves the whole field's origin — and the area it has just left
has no stars in it until enough new ones are born to refill it, which never
catches up. Slowing it down could not have fixed that; only holding it still.

**The vanishing point is the centre of the screen now.** Pitch keeps its height
through the **voice band**, which still lights the stars at your pitch height.

1. Slide your voice from low to high and back.

**Expected:** the field flies straight at you and does not tilt or shift. A band
of stars brightens higher or lower with your pitch. **No blank region, ever.**

### A2. You can see the dust now

It was emitted at 16/s, at a star's size, and born far away — small and dim, in a
field that had just gained 300 stars to hide it among. It is now **three times
the rate, twice the size, at full brightness, and born close to you**.

1. Hold a note.

**Expected:** coloured dust sweeping past, clearly distinct from the white-ish
stars. It is the one thing on screen that is purely *your* sound.

### A3. The theme is visible

Stars were drawn **white** and only took the palette where the voice band lit
them, so changing theme moved almost nothing. Each star now has its own place in
the palette.

1. Change **Theme** on the Visuals pane a few times.

**Expected:** the whole sky changes character, not just the lit band.

---

## B. The LED wall — your design

**The six patterns are gone.** You were right: six unrelated effects behind a
slider is a menu, not a style. What I built copied WLED's *shape* — a chooser —
when what this room needed was one wall of LEDs running one thing well.

**The whole screen is a grid of LEDs now.** Every LED belongs to exactly one
concentric rectangle — its **ring** — and the chase runs around the outer
rectangle *and every rectangle inside it*, working toward the centre. Each ring
also carries one frequency band, low at the edge and high at the middle, so your
voice lights the wall from the outside in. A sharp sound sends a wave running
inward across the rings.

1. Style → **💡 LEDs**. Watch it at rest, then hum, then clap.

**Expected:** a full screen of LEDs; hotspots travelling around every rectangle;
your voice lighting rings from the edge inward; a clap sending a wave to the
centre.

2. The menu has four controls now, all acting on that one idea. Sweep each:

| control | what to expect |
|---|---|
| `LED size` | bigger LEDs, fewer of them — and back to a fine mesh |
| `Chase speed` | how fast the hotspots travel (your loudness adds to it) |
| **`Spiral`** | **at 0 the rings pulse together; at 2 they trail into a spiral** |
| `Sound spread` | how strongly each ring's own frequency band lights it |

**`Spiral` is the one to play with** — it is the difference between a breathing
target and a whirlpool.

3. `Pattern` and `Equalizer height` are **gone** from the menu, because the
   things they selected are gone.

---

## What I verified

- **Frame rate, because a full-screen grid is ~1,100 dots redrawn every frame**
  and that is exactly what quietly halves the rate on a room PC. At 1920×1080:
  60.1 fps at the default LED size, **59.9 at the smallest the slider allows**
  (the real worst case, taken from the slider's own range), 60.2 at the largest —
  against 60.0 for Starfield and Mandala. Headless is a software rasteriser, so
  read that as "nothing pathological", not as a measurement of your GPU.
- 27/27 pages load clean; 8/8 styles played into; 8/8 drawn and swept with no
  microphone, with the menus showing the new controls.
- **Not verified:** whether a still centre makes the flight less interesting, and
  whether the wall wants a calmer default. Both are yours.

## Still open from §12.6 — one look

Whether the Fireworks *fall* is interesting.
