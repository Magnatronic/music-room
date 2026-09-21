# Phase 9d — what the UAT found, traced to causes

Your Phase 9b UAT, item by item. Nothing here is built yet: this is the research
you asked for, and §9 is the order I recommend. **Twenty-six items. Nineteen are
defects with an exact cause; five are your taste and need your steer; one is a
safety issue I want to treat separately.**

You said some of it might apply to all the apps. It does — more than you knew.
**Six causes account for nineteen of the twenty-six symptoms**, and each of the
six is in shared code or in all five apps at once. That is the real finding, and
it is why this is worth doing as one phase rather than twenty-six patches.

---

## 1. The six causes

### C1 — everything is drawn additively, so everything sums to white

All five new apps draw their marks inside
`globalCompositeOperation='lighter'`. Additive light *is* white: three
overlapping marks at 0.4 each make 1.2 in every channel, which clips to white.
Nothing in any of the five limits how many marks can overlap.

This is one cause behind three separate things you reported:

- Chords, "press multiple times and the light gets bright white";
- Loop Garden, "MIXING settings often make it too bright WHITE";
- Weather, "the stars get washed out very quickly" (partly — see C6);

and it is latent in Mirror and Creatures, which you did not happen to stack up.

**Where it does not apply:** MIDI Light, which is the only MIDI app with a
per-style `blend` (`midi_light.html:675`) and can already choose not to be
additive. That it alone has the escape is not a coincidence — it is the one that
had a full phase of your testing.

**The fix is not "turn the brightness down".** That trades the blowout for a dim
app. Two real options, §5.

### C2 — none of the five can hold a picture, and none can let one linger

`grep persist` finds nothing in any of the five. Each one clears the whole canvas
every frame and redraws its live objects (`fillRect` at the top of each `frame`).
MIDI Light is the only MIDI app with persistence.

So your Chords note — "there is no persistence in visuals" — applies to **all
five**, and your linger idea ("a picture that disappears without permanence") is
the missing middle: right now the only choices are *gone the instant the object
dies* or nothing.

Note the deliberate reason for the clearing, in every app's header comment: an
alpha fade toward the background **does not converge** on an accelerated canvas
and leaves a permanent ghost. That is a real fault we hit on Soundscape and it is
recorded in `[[canvas-fade-never-arrives]]` and APPS.md. **So linger cannot be
built the obvious way** — see §6, which is the one part of this that needs care
rather than typing.

### C3 — four of the six apps are five times quieter than the other two

| App | How it makes sound | Level |
|---|---|---|
| Big Chords | `startVoice(x, force)` | up to **1.0** |
| MIDI Light | `startVoice(x, force)` | up to **1.0** |
| Loop Garden | `pluck(col, 0.10+0.14·force)` | up to 0.24 |
| Mirror | `pluck(col, 0.09+0.12·force)` | up to 0.21 |
| Creatures | `pluck(col, 0.09+0.11·force)` | up to **0.20** |
| Weather | `pluck(col, 0.07+0.12·force)` | up to 0.19 |

`pluck` passes its argument to `pluckNote` as `gainMul` (`framework.js:1043`,
`peak = V.gain · gainMul · yLoudness(y)`), so those numbers are direct
multipliers on a voice's nominal level.

You noticed it on Creatures, which is the quietest of the four — but **Creatures
is not the odd one out; Chords and MIDI Light are.** The four pluck apps are
consistent with each other and about 5× below the two that hold voices. Fixing
Creatures alone would just move the inconsistency.

### C4 — 🔇 Silence means three different things, and in three apps it does nothing

| App | What the button does | Honest? |
|---|---|---|
| Big Chords | `allOff()` + `MIDIIN.silence()` — stops held chords | yes |
| Mirror | `hush()` + `silence()` — cancels the pending reply | yes |
| **Loop Garden** | `MIDIIN.silence()` only | **no** |
| **Creatures** | `MIDIIN.silence()` only | **no** |
| **Weather** | `MIDIIN.silence()` only | **no** |

`MIDIIN.silence()` stops *sustained framework voices*. Loop, Creatures and
Weather never start one — they only fire one-shot plucks, which are already
decaying. So in those three the button is a no-op you can hear nothing from, and
in Loop Garden it is worse than a no-op: **the loop keeps going round and
re-plucking every seed a fraction of a second later.** Its tooltip says "Stop
every sounding note".

That is the answer to "I'm not sure what the silence does on any of the midi
apps": in half of them, nothing.

### C5 — the stuck note in Chords, and why you could not reproduce it

Found it, and it is a real defect in `midi.js`.

`end(id, silent)` (`midi.js:219`) calls `hooks.onRelease` **only when `silent` is
false**. But `start()` begins with `end(id, true)` (`midi.js:208`) — a silent end
— to clear a note id that is already live.

Big Chords is the only app that **holds its own voice ids** (`sounding`, a Map
keyed by note id) and releases them in `onRelease`. So whenever `start()` retires
a live id silently, Chords is never told, and that chord's voices are **never
stopped**. They play until the engine steals them. That is your "the note goes on
seemingly forever".

**Why it was hard to reproduce.** It needs a second note-on for an id that is
still live. For an instrument that is a lost note-off — rare. But for a **touch**
the id is `'touch/'+round(x·1000)+'/'+round(y·1000)` (`midi.js:301`), so
**pressing the same spot twice within 320 ms produces the same id** and orphans
the first chord. That is exactly "if I press multiple times" — you reproduced it
by pressing repeatedly in one place, which is also why it came with the white
blowout in the same sentence. Both are what repeated presses in one spot do.

**Where it does not apply:** Creatures also wires `onRelease`, but only to stop a
creature growing, so it leaks nothing audible. No other app holds voices. It is
one app's symptom and shared code's fault.

### C6 — Weather's sea multiplies absolute time by a rate that keeps changing

`midi_weather.html:261`:

```js
const t = x/W*6.3*(1.4+k*0.5) + performance.now()/1000*(0.8+0.9*energy)*(1+k*0.35);
```

The wave's phase is *absolute time × a speed that depends on `energy`*. Change
the speed and you retroactively rewrite the entire history, so the wave **jumps**
— and the jump is proportional to how long the page has been open:

| Page open | One note (velocity 0.7) jumps the wave by |
|---|---|
| 5 s | 0.7 rad — 0.1 of a cycle |
| 30 s | 4.3 rad — 0.7 of a cycle |
| 60 s | 8.5 rad — **1.4 whole cycles** |
| 5 min | 42.6 rad — 6.8 cycles |
| 10 min | 85.2 rad — **13.6 cycles** |

And `energy` decays *continuously* at 0.22/s, so after a minute the wave carries
about **12 rad/s of spurious drift** on top of the ~1 rad/s it should have.

So "Sea is very jerky when it is supposed to be wavy" is not a look that needs
tuning — it is a phase bug, it gets worse the longer a session runs, and a
therapist who has had the app open for ten minutes sees something much worse than
I would see in a thirty-second check. **This is why it survived my testing.**

The fix is to accumulate phase (`wavePhase += dt·rate`) instead of multiplying
absolute time.

**Where it does not apply:** I checked every `performance.now()` in all six MIDI
apps. Only this line multiplies absolute time by a varying rate. MIDI Light's
`now/700` (`midi_light.html:405`) has a constant rate and is fine.

---

## 2. Big Chords

| # | What you said | Verdict |
|---|---|---|
| 2.1 | No persistence in Visuals | **Confirmed — and true of all five** (C2) |
| 2.2 | Press multiple times → bright white | **Confirmed** (C1) |
| 2.3 | The note goes on seemingly forever | **Confirmed, with an exact cause** (C5). Reproduction: press the *same spot* twice inside 320 ms |
| 2.4 | A linger would be good | Gap — worth building (C2, §6) |
| 2.5 | Not sure what Silence does | It is one of the two apps where it genuinely works (C4) |

---

## 3. Loop Garden

| # | What you said | Verdict |
|---|---|---|
| 3.1 | Orbit: large spread leaves the outer rings unused | **Confirmed, and it is an inconsistency, not a look.** The guide rings are drawn at `R·r·spread()` with **no clamp** (`midi_loop.html:213`), but a seed's radius is `R·min(1.08, ring·spread())` (`place()`). At spread 1.4 the outermost ring is drawn at 1.48 R and **nothing can ever reach past 1.08 R.** The rings promise space the seeds are forbidden to use |
| 3.2 | What is the difference between Bloom and Wheel? | **Fair — there is almost none.** Both are `ring:true` and share `place()` exactly, so the *layout is identical*. Only the mark differs: Wheel is a radial glow plus a core dot, Bloom is n petals that are also radial gradients plus the same core dot. At low `Opening` they are indistinguishable. Two of your four looks are one look |
| 3.3 | "A note lasts" seems to do nothing | **Confirmed in effect.** `loopMem` is a number of *passes*: `s.life -= 1/mem()`. At the default 12 s loop, "Fades fast" (4) takes **48 seconds** to remove a seed and "Fades" (10) takes **two minutes**. The control works; its effect is minutes away, so nobody will ever see it |
| 3.4 | "Once round takes" should go down to 4 s; maybe a slider | Agreed, and cheap. Currently chips at 8/12/20/32 |
| 3.5 | Might be nice to click all over the canvas | **It already accepts clicks anywhere — but lies about where.** Outside the wheel, `ring` clamps to 1.08 so the seed snaps to the rim, *not* under your finger. The UAT told you a seed lands exactly under your finger; that is only true inside the circle |
| 3.6 | Mixing settings makes it too white | **Confirmed** (C1) |
| 3.7 | Not sure when notes get replayed on Orbit — I thought at the top, but it seems inconsistent | **Confirmed, and you were right about the top.** A seed sounds when `s.at` crosses `phase`. Orbit draws it at angle `-π/2 + (s.at + spin)·2π`, and `spin` advances at exactly the same rate as `phase`, so at the moment it sounds the angle is `-π/2 + 2·phase·2π` — **anywhere on the circle**, depending only on when in the loop you are. It coincides with the top marker exactly twice per loop. The sign is wrong: it should be `s.at − phase`, which puts a seed at the top precisely when it sounds |

3.7 is the one I would fix first in this app. There is a marker drawn at the top
saying "here is now", and the notes ignore it.

---

## 4. Creatures

| # | What you said | Verdict |
|---|---|---|
| 4.1 | Very quiet compared to the other MIDI apps | **Confirmed — it is the quietest, but all four pluck apps are quiet** (C3) |
| 4.2 | Animals look naff; prefer stars, particles, strands; could reuse Flock | **Your call, and I agree.** Worth knowing: two of the four looks are already abstract — ✨ Sparks (motes) and 🐛 Wiggle (segments) — but the app is *framed* as animals: it is called Pond, its tab is 🐟, and it opens on Fish. The framing is doing more damage than the art. Reusing Flock is a good instinct: boids give the drifting-together behaviour the pond is reaching for, and it is already written and tested |

---

## 5. Mirror

| # | What you said | Verdict |
|---|---|---|
| 5.1 | It is not mirroring exactly the same locations | **Confirmed — it never mirrors position at all.** Your mark goes where your finger went (`PX(ev)`, `1−ev.fy`). The reply's mark goes at `colX(r.col)` and **`y = 0.5` always** (`midi_mirror.html:148`) — the transposed note's column, at mid-height. There is no positional relationship between a mark and its answer |
| 5.2 | The colours of the two should be identical | **Confirmed, and it is one word.** Your mark takes `ev.hue`; the reply takes **`Math.random()`** (`midi_mirror.html:149`). The answer is given a random hue on purpose-by-accident |
| 5.3 | Is permanence worth it, to build up a mirrored picture? | Yes — and it is the app where it earns the most, because the picture *is* the conversation. Needs C2 |
| 5.4 | I'm not really sure how it answers. It is confusing | **Follows from 5.1 and 5.2.** The reply is musically principled (up / invert / shadow / back / tail, all in scale degrees) but visually unrelated to what you played — different place, different colour. There is nothing on screen to learn the rule from. Fixing 5.1 and 5.2 may fix this on its own |
| 5.5 | Connected wave lines moving would be better than trace | Your call — and it fits: a phrase is a sequence, and a line through the marks in order *is* the phrase. It also makes the mirroring legible, which is 5.4 |

Mirror is the app where the smallest changes buy the most: two of its four
problems are a wrong `y` and a stray `Math.random()`.

---

## 6. Weather

| # | What you said | Verdict |
|---|---|---|
| 6.1 | The moon is in a weird place | **Confirmed.** It is not in the sky at all — the mood symbol is drawn as a status badge in the **bottom-right corner** (`textAlign='right'`, `textBaseline='bottom'`, `midi_weather.html:305`). A moon in the bottom-right corner is exactly as odd as it looks |
| 6.2 | Rain looks like straws | **Confirmed.** Each drop is a straight segment 2–7% of the screen high at a **uniform** alpha and width, with a slant of at most 0.06. No taper, no depth, no speed variation. Straws is the right word |
| 6.3 | Lightning should be forks; it washes out the screen and is maybe dangerous | **Confirmed, and see §7 — I want to treat this as a safety item.** There is no fork geometry at all: it is `fillRect(0,0,W,H)` over the whole screen, additively |
| 6.4 | Stars wash out very quickly on multiple keys, in all skies | **Confirmed and measured.** `clear = max(0, 1 − energy·1.5)`, so stars are **completely gone at energy 0.667** — that is **5 notes at velocity 0.7, or 7 gentle ones.** In every sky, since the star layer is shared |
| 6.5 | Sea is jerky when it should be wavy | **Confirmed, quantified, and it gets worse with time** (C6) |
| 6.6 | Spray doesn't look like spray | **Confirmed.** Spray is not particles: it is 28 dots at **fresh random positions every frame** (`midi_weather.html:268`). Nothing persists or moves, so it is white noise flicker. Real spray needs particles with velocity and a life |

---

## 7. The lightning, separately — this one is a safety question

I am flagging this louder than you raised it, because I think you spotted
something real and then filed it under "looks bad".

The lightning is a **full-screen white flash**: `fillRect(0,0,W,H)` at up to
`0.5 · BR()` alpha, drawn additively over the whole canvas. It triggers whenever
`energy > 0.72` and a note arrives above velocity 0.7, and it decays at 2.2/s —
so **sustained hard playing can retrigger it roughly twice a second**, and there
is no rate limit anywhere.

Full-field luminance flashes in the 3 Hz region are the classic
photosensitive-seizure trigger, and this is a suite built for a music therapy
room where you will not always know a student's history. A student banging the
keyboard hard is not an edge case here — it is the exact behaviour the storm sky
is designed to reward.

**I do not think this should wait for the rest of the phase, and I would not
merge Phase 9b to `main` with it in.** The cheap immediate fix is to cap the
flash well below full-field, keep it off the whole screen, and rate-limit
retriggering to no more than one flash per second or so. Making it a fork (which
is what you asked for) helps for the same reason: a branching bolt lights part of
the sky rather than all of it.

Your call, but if you want only one thing done before you are next in the room,
make it this.

---

## 8. What needs your steer

Everything else I can decide. These five I cannot:

1. **The white problem (C1) — which way?**
   - **(a) Soft-clip: swap `lighter` for `screen`.** `screen` is
     `1−(1−a)(1−b)` — it approaches white but never overshoots, so overlaps stay
     coloured far longer and stacking degrades gracefully instead of clipping.
     One-line change per app, no per-look decisions, keeps the glow feel.
   - **(b) Per-look `blend`, the way MIDI Light does it**, so each look
     chooses. More control, but it makes twenty new decisions and every one is a
     thing that can be set wrong.
   - **My recommendation: (a) for all five now**, and (b) later only if a
     specific look wants it. It fixes three of your reports at once and cannot
     be set wrong by a therapist.

2. **Linger and permanence (C2).** The obvious build — fade the canvas toward the
   background each frame — is the one thing we know does not work: it never
   converges and leaves a ghost. Two that do:
   - **(a) Per-object linger.** Objects keep living with a decaying alpha after
     they are "done". No canvas trickery, works with any blend, and a "how long
     things linger" slider is one control. Does not build a *picture* — nothing
     accumulates.
   - **(b) MIDI Light's approach: a persistence layer** that snapshots what was
     actually drawn onto a second canvas. That is what "build up a mirrored
     picture" needs (5.3), and it is proven code in this repo.
   - **My recommendation: (a) everywhere, plus (b) in Mirror and Chords**, which
     are the two where you asked for a picture. Doing (b) in all five is a lot of
     surface for apps where nobody asked.

3. **Creatures' direction (4.2).** Abstract how far? I would drop the pond
   framing entirely — rename the app and its tab, default to Sparks, replace Fish
   with a Flock-derived boid look and Wiggle with strands/filaments. That is a
   bigger change than the rest of this phase and it is genuinely your taste, so
   tell me how far to go.

4. **Mirror's wave lines (5.5).** Replace the trace, or add it as a fifth look
   alongside? I would replace it — 5.4 says the current one is not reading, and
   another option does not fix a confusing default.

5. **Loop's "Once round takes" (3.4).** Slider 4–32 s, or keep chips and add 4 s
   and 6 s? Chips are what every other timing control in the suite uses, so I
   lean chips — but a slider is what you asked about, and this is the one control
   where a therapist may want to match a student's tempo exactly.

---

## 9. The order I recommend

**First, on its own, today:** §7, the lightning. Cap it, take it off the full
screen, rate-limit it. It is small, and it is the only item with a safety edge.

**Then the shared causes**, because each is one edit that fixes several apps:

1. **C5** — `end()` must tell an app to release even on a silent end. Fixes the
   Chords stuck note. It is a `midi.js` change, so it needs its own short design
   doc under the usual trigger, and it wants care: "silent" should stop meaning
   "skip cleanup" without starting to mean "fire a musical answer".
2. **C1** — `lighter` → `screen` in all five. Fixes 2.2, 3.6, and half of 6.4.
3. **C3** — one level policy across all six apps.
4. **C4** — make 🔇 Silence mean something in Loop, Creatures and Weather, or
   take it off those rails. In Loop it should stop the loop.
5. **C6** — accumulate the sea's phase.

**Then the per-app defects**, cheapest first: Mirror's `Math.random()` hue and
reply `y` (5.1, 5.2), Orbit's spin sign (3.7), Loop's unclamped guide rings
(3.1), the star threshold (6.4), the moon's position (6.1), Loop's loop-length
chips (3.4), the touch clamp outside the wheel (3.5).

**Then the looks**, which is where the time actually goes: rain (6.2), forked
lightning (6.3), spray as particles (6.6), Bloom made genuinely different from
Wheel (3.2), "A note lasts" given a range you can perceive (3.3).

**Then the two big ones, once you have answered §8:** linger and permanence
(C2 — 2.1, 2.4, 5.3), and Creatures' direction (4.2).

**Then Mirror's wave lines** (5.5), which I would do last because 5.1 and 5.2 may
change what it should look like.

---

## 10. What was built — all of it

The user answered "do it all, I trust your recommendations", so §8 went the way
§8 recommended: `screen` for every app rather than a per-look choice; per-object
linger everywhere plus a kept picture in Chords and Mirror only; Creatures taken
right off the animals; Wave replacing Trace rather than joining it; and chips
rather than a slider for the loop length, with 4 s and 6 s added.

**The order was §9's order**, and the lightning went first and alone.

### What is measured, and what is not

| Claim | How it was checked |
|---|---|
| the lightning no longer strobes | canvas luminance sampled every frame through six seconds of continuous hard playing: **0.67 Hz, shortest gap 983 ms, 3.0% of the screen above L=140** at its brightest |
| the stuck chord is gone | three presses on one spot (the exact reproduction), then `soundingVoices` back to **0** |
| stacking no longer clips | fourteen presses in one place: **0.00–0.65%** of the middle blown to white, in all five |
| one level | `level(0)=0.45`, `level(1)=0.95`, against 0.07–0.24 before |
| Silence means something | Loop's button toggles to **Go on**; Weather has no Silence button at all |
| a touch lands under the finger | four points per shape including outside the wheel: **1.1–4.9%** of the screen away |
| the outermost guide ring is reachable | ring found at x=0.85, seed placed on it at x=0.85 |
| Mirror mirrors | tapped (0.24, 0.30) → answered x **0.24**, y 0.79 which mirrors to **0.21**, hue **2°** apart |
| the stars survive | **62–77%** of star points still there after eight hard notes, against an empty sky by the fifth |
| the sea is smooth | a tracked waterline held **100% of frames**, worst jump **0.75%** of screen height |
| every page still loads | **28/28 clean in Edge and Firefox** |

**Not measured, and only the user can judge:** whether Drift's four abstract
looks are better than the animals or merely different; whether Wave reads as a
conversation on a real instrument; whether the rain now looks like rain and the
spray like spray; whether the forked bolt is still exciting enough to be worth
having; and every parameter range, which remains guesswork.

**One measurement is weaker than it looks and is recorded as such.** The sea's
clean reference — the same probe run against a copy with the old formula put
back — proved the point when it was first run (13% of frames tracked against
100%), but it cannot prove it now: the reference reverts only the phase fix and
not the geometry easing that went in beside it, and the residual jump happens to
land near a whole wave cycle, which at a fixed column looks like almost no jump.
The current run therefore shows only that the **new** build is smooth. Said
plainly in `t_sea.js` rather than left to read as a pass.

### Four probes were wrong before any of this was right

Worth recording, because every one of them produced a confident, wrong answer:

1. **"Brightest pixel" finds the furniture** — the half-screen wash and the guide
   rings are brighter than a fading mark.
2. **A frame diff marshalled out of the page and back came back all zeros**, which
   read as a PASS on one assertion and a FAIL on the others. Compute the diff
   inside the page.
3. **A colour read at the centre of a ring look** samples the hole in the middle.
   It reported 45° of hue error that did not exist; on a filled look the same
   two marks are 2° apart.
4. **A star counter that counts bright pixels counts a brightening sky**, and
   reported 500% *more* stars after playing — the exact opposite of the truth.
   Count local maxima, with the rain turned off, after the blooms have gone.

The first probe of the sea, and the first of the lightning, were also wrong.
**Six of the ten measurements in this phase had to be rebuilt before they said
anything true.**
