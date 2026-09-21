# UAT - Phase 3c: the chrome takes its own space, the activity is scaled

> **PASSED 2026-08-25.** All steps pass; the shading reads clearly enough to
> see the boundary. The shrink-vs-stretch question was settled in favour of
> uniform scaling - see IMPROVEMENT-PLAN.md, Phase 3b/3c.

**Branch:** `phase-3c-scale-surface` - **Commits:** `689755e` `931e1a7` `ac83386`
`d90eed9` `ab37a59` `e85fee4` `2f180d0`

Supersedes `UAT-PHASE-3B.md`, which described three behaviours that no longer
exist. Everything you reported before testing is in here.

The settings panel no longer floats over the activity. The rail and the
settings strip are solid columns, and the activity gets what is left - but it
is **scaled to fit**, not re-laid-out. Nothing it has drawn is ever lost, and
you always see all of it.

Allow about 25 minutes. Nothing merges until you pass it.

---

## What changed since you last looked

| You said | What it does now |
|---|---|
| the screen clears on close, and again on lock | **Nothing ever clears.** The activity is scaled, never resized, so no app is ever told to reset. |
| Flock looks like the panel is on top and nothing resizes | It did resize - it just does not clear, so you could not see it. Now nothing resizes anywhere. |
| one tap gives two clicks | Fixed twice: the touch is mapped before anything moves, and now nothing moves under a live touch at all. |
| it needs a border so the boundary is clear | It had one; you were right that it was distracting. The space beside the activity is a step off your background colour instead. |
| it closes when I click the screen, which is frustrating | The strip stays open until you tap its rail icon. |

---

## 1. The shape of the thing

1. Open **Fluid Keys**. **Expect:** a solid rail down the left edge, full
   height, flush to the edge, no longer faded until touched.
2. Tap **Sound**. **Expect:** a second solid column, and the activity **shrinks**
   **and stays entirely visible** to the right of it - not cropped, not covered.
3. **Expect:** the space above and below the activity is a slightly different
   shade from the activity itself, so you can see where it ends.
4. Tap **Sound** again. **Expect:** the strip closes and the activity grows back.

## 2. The loop this is all for

1. Tap **Sound**, change **Voice** to Bell.
2. Play on the activity. **Expect:** it sounds like Bell, **and the strip stays**
   **open**.
3. Change Voice again, play again, change again. **Expect:** you can go round
   that loop as many times as you like without the strip ever closing.
4. Tap **Visuals**. **Expect:** the strip stays open and switches to Visuals.
5. Tap **Visuals** again. **Expect:** now it closes.

## 3. One tap, one note

1. With the strip open, tap once on the activity.
   **Expect:** exactly one note - the one under your finger.
2. Try it in several places, and in **Drum Pads** and **Song Grid** too.
   **Expect:** the pad you touched is the pad that fires, once.
3. Press and drag slowly across the note zones.
   **Expect:** notes change as you cross from one zone to the next, and nothing
   jumps or moves under your finger.

> One thing that is correct and might look wrong: if you tap **exactly** on the
> line between two note zones and your finger moves a hair, you get both notes.
> That is the instrument working - you crossed a boundary - and it did that
> before any of this.

## 4. Nothing is ever lost - the one you asked for

1. Open **Fluid Paint**. Paint something with a good long stroke.
2. Tap **Sound**. **Expect:** the painting is **still there**, smaller, whole.
3. Adjust something, paint some more, close the strip.
   **Expect:** still there, back at full size.
4. Tap **Lock**. **Expect:** still there, now filling the whole screen.
5. Repeat in **Game of Life** (draw some cells), **Slime** and **Fluid Keys**.

## 5. Lock is the hand-over

1. Tap **Lock**. **Expect:** both columns vanish, the activity fills the screen
   edge to edge, and the shading beside it is gone because there is none.
2. Play in the locked app. **Expect:** touches land where you put them, right
   to the far left edge where the rail used to be, and it should look
   **exactly as sharp as it always did** - this state is drawn at full size,
   not scaled.
3. Hold the top-left corner 3 seconds. **Expect:** unlocked, columns back.

## 6. Each app's own furniture is inside the activity

Open each and check the named thing sits **inside the activity**, scaling with
it - with the strip closed and again with **Sound** open:

| App | Look at |
|---|---|
| **Beat Builder** | the step grid |
| **Big Switch Songs** | the big letter, and the progress bar along the top |
| **Chord Strummer** | the chord bar along the bottom |
| **Soundscape Mixer** | the mixer strip along the bottom; tap a channel and check its editor pops up **over its own channel** |
| **Echo Bird** | the bird and its ring at the top, and the notes it throws |
| **Drum Pads** | play a pattern so the layer strip appears, centred |
| **Sampler Pads** | record a pad - the toast should be over the activity |
| **Voice Visuals** | the microphone gate |

## 7. The dialogs still cover everything

1. **Drum Pads** -> edit -> tap a pad. **Expect:** the editor covers the whole
   screen **including the rail** - deliberate, so a tap behind it cannot do
   something else.
2. Same in **Sampler Pads**, and the colour picker in **Visuals -> Background**.
3. While you are in **Background**, pick a **light** colour and check the space
   beside the activity goes slightly *darker* rather than lighter. It follows
   whatever you choose.

## 8. Control size, on the actual screen

1. **Setup -> Control size**, drag to the maximum.
   **Expect:** the rail and strip grow, the activity gets smaller, and it is
   still clearly the largest thing on screen.
2. **Expect:** nothing overlaps or clips, and Lock is still reachable at the
   bottom of the rail.
3. Drag it back to where you want it.

## 9. A quick pass over the rest

**Bubbles**, **Sweep Chimes**, **Conductor**, **Flock**, **Slime**, **Game of**
**Life**, **Fluid Paint**, **Voice Visuals**, and the **launcher**.

---

## The two judgements I want from you

1. **Is the shrinking acceptable?** With the strip open the activity is about
   57% at 1280 wide, 71% at 1920. You see all of it, but it is smaller, and
   there is empty space above and below it. If the empty space bothers you more
   than the shrinking does, the alternative is stretching to fill instead - no
   bands, but circles become ovals, which Bubbles would show plainly.
2. **Is the shading enough to see the edge?** It is 12% off your background.
   Easy to make stronger or softer - it is one number.

## What I verified myself, so you do not have to

- All **20 pages** load from `file://` with 0 errors, 0 console errors, 0
  failed requests.
- **Nothing is ever resized**: layout and backing store stay 1280x800 whether
  the chrome is open, closed or locked. Scale is 0.931 with the rail, 0.572
  with the strip, and **exactly 1.000 locked**.
- **The painting survives**: Game of Life ink 192 -> 192 -> 192 through opening
  the strip and locking.
- Touches land under the finger at every scale, in three apps.
- The strip survives three taps and a drag on the activity, switches on another
  rail icon, and closes on its own.
- A Control size change **with a finger down** defers until release, so nothing
  moves under a hand.
- Every app-owned element sits inside the activity at 1280x800 and 1366x768.
- 60 fps in the WebGL apps, up from 57.

What I cannot test: how it reads **on the room screen from where a therapist
stands**, and the two judgements above.
