# UAT — Phase 12: the Voice Visuals looks, one at a time

> ✅ **PASSED by the user on 2026-09-05** after three rounds — "all works good".
> Merged as `v1.16.0`. The checklist is kept as the record of what was tested.

> **First look: Lava's jitter.** §12.6 listed seven visual reports and said they
> would be built one at a time and shown, not handed over as a checklist of
> guesses. This is the first, and it is the one §12.6 predicted was **a fault
> dressed as a judgement** — it was.
>
> **Nothing else in the app changed.** No other style, no listening code, no
> settings. If something outside Lava looks different, that is a finding.
>
> **ROUND 2 (2026-09-05).** Your two reports were both real, and the first found
> a fault in my *measurement* as well as in the build: the metric I used measures
> how far the radius moves in 200 ms, which scores a smooth ramp and a
> jump-then-flat identically. It was blind to the shape of a rise — which is
> exactly what you were describing. §T1 is rewritten and §T6 is new.
>
> **ROUND 3 (2026-09-05).** "Still jerky with short sharp noises, especially the
> initial noise… it is when the voice texture is high I think." That second
> sentence found it, and it was **never in the blob's size at all** — it was the
> wax's *edge*, which follows how voiced the sound is, and that signal was
> smoothed nowhere. §T7 is new and is the one to test first.
>
> Worth saying plainly: every measurement I have in this app passed the build you
> just rejected, because they all measure the radius the code computes and you
> were watching the edge the screen draws. Three rounds, three times the
> measurement had to be fixed before the code.
>
> About 8 minutes. **T3 is still the one I need your judgement on** — it is a
> trade-off I have now made against your comfort twice, and the numbers for
> reversing it are ready.

---

## T1. Lava stops twitching — and now *grows* smoothly too

The blob radius was following the same 30 ms attack Mandala and the LEDs use to
flash on a syllable. Measured on the radius as it was actually drawn, a blob
changed size by **20.2% of itself inside 200 ms** on a babbling child, and
reversed direction **27 times a second** on a raspberry.

**Round 2:** you said it still grew jerkily. It did, for a reason I had not
measured. An exponential rise **moves fastest on its very first frame** and then
creeps — and the gain I added to keep a clap's swell big is steepest exactly
where a rise begins, so a fix for the *size* of the response had steepened the
*start* of it.

Pure linear growth, which is what you suggested, was built and measured first. It
beat the old rise on clapping and **lost** to it on speech, because a constant
rate makes small rises move at full speed too. The rise now takes whichever of
the two moves less each frame, which beats both on every signal:

| build | biggest single frame, clapping | share of a rise done in its first 100 ms |
|---|---|---|
| original | 12.71% | 94% |
| what you tested | 3.08% | 44% |
| pure linear | 2.19% | 38% |
| **now** | **1.84%** | **30%** |

1. Open `voice_visuals.html`, **🎤 Voice** tab, microphone on.
2. Style → **🫧 Lava**.
3. Talk at it normally for half a minute — sentences, not a single note.
4. Then blow a raspberry, and hold it for a few seconds.
5. Clap once and watch a single blob **grow** — the way it gets there, not just
   how big it gets.

**Expected:** the blobs swell and subside like wax — a slow bulge that takes
about a third of a second to arrive and a second or so to settle. On the
raspberry they should hold a steady swollen size, **not** buzz.

**Expected of the growth:** an even swell at a steady speed, with no snap at the
instant the sound is detected.

**Before round 1:** the blobs vibrated in size. **Before round 2:** they lurched
at the start of a growth and then crept.

---

## T2. It still answers instantly — in light

This is the half of the fix that matters most and is easiest to miss, because
the point of it is that **nothing** changed. Brightness still follows the fast
signal; only size was slowed. Light has no mass, wax does.

1. Still in Lava. Make a short, sharp sound — one clap, one "ha".

**Expected:** a blob **brightens immediately**, on the sound, and then swells
after it. The glow is the instant part; the size is the slow part.

**A finding if:** the brightening also feels delayed.

---

## T3. A clap's swell — the judgement I made for you

**Read this one before testing it.** Slowing the size costs the size of a clap's
response, because a 0.35 s attack cannot reach a clap's peak before the clap is
over. Measured, old → new:

| build | peak swell | time to reach it |
|---|---|---|
| original | +46% | 109 ms |
| what you tested | +25% | 317 ms |
| **now** | **+18%** | **349 ms** |

**Round 2 made this worse, deliberately.** Smoothing the *start* of a rise costs
the *size* of it — they are the same dial seen from two ends. You have asked
twice for smoother, so I spent it on smoothness twice. If the swell now looks
too small, that is the report I need.

Most of that loss is bought back by a gain that **saturates**, so a sustained
shout still reaches exactly the size it always did — only the transient is
lifted. But 320 ms is 320 ms.

**The worry is contingency**: a student who makes a sound and sees the screen
answer a third of a second later may not connect the two, where at 109 ms they
could not miss it.

1. Clap once, hard. Watch one blob.
2. Do it again while thinking about a student who is just working out that the
   screen is answering *them*.

**Expected:** the swell still clearly reads as caused by the clap, arriving
about a third of a second after it, on top of an instant brightening.

**Tell me if it reads as too slow, or the swell as too small.** Two one-line
dials go the other way: a shorter attack (a bigger swell, sooner, at some of the
smoothness back), or a straight multiplier on the swell (same timing, bigger
bulge, every movement proportionally larger). This is a dial, not a rebuild.

---

## T7. Short sharp noises, with Voice texture up

**Test this one first — it is your last report and it was the real one.**

The blob's *edge* is drawn from how voiced the sound is: a clear tone gives firm
wax, breath and hiss give a soft diffuse one. That signal is raw confidence from
the pitch detector, replaced whole several times a second and **smoothed
nowhere** — so a short sharp noise crossed from "voiced" to "unvoiced" and back
inside a few frames, and the wax's visible edge went with it. Measured on a
babbling child, it swung its **entire range between two frames**, and the edge
you see moved **82% in one frame** while the blob's actual radius moved 0.64%.

That is why `Voice texture` predicted it: at 0 the whole term is switched off.
And why the *initial* noise was worst: silence to sound is the biggest crossing
there is.

1. Style → **🫧 Lava**, open the app's pane, put **Voice texture** at maximum.
2. From silence, make one short sharp noise — a "t", a "k", a tut, a clap.
3. Do it again a few times, then say a short sentence with hard consonants.

**Expected:** the wax's edge softens and firms *gradually*. No snap on the first
noise, and no flicker between syllables.

4. Now hold a long "shhh" for three or four seconds.

**Expected:** unchanged from before — the wax goes properly soft and diffuse. The
feature still arrives, it just takes about half a second to get there.

5. Put **Voice texture** back to 0 and repeat step 2.

**Expected:** also unchanged — at 0 this term does nothing at all, as before.

**The same signal draws Mandala's spokes**, so it had the same fault. Play into
**Mandala** with hard consonants and the spoke width should now change smoothly
rather than twitching.

---

## T6. The blobs stop teleporting when a sound lands

Your second report, and it was **not the wax at all** — it was a separate line
that multiplies every blob's drift speed by up to 2.5x off the *instant*
loudness. Measured: a clap moved that multiplier **41.3% in a single frame**, and
took every blob from rest to full speed in **66 ms, all together**. That is
exactly "they jump around instantly into different locations". It runs off the
same slow signal the size does now — worst frame 2.35%.

1. Be quiet and watch the blobs drift.
2. Clap, or say something loud.

**Expected:** the blobs *speed up* — they accelerate over a second or so, then
coast back down. They should not all dart at the instant of the sound.

**Still instant, and meant to be:** tapping a blob knocks it away like a snooker
ball on the frame you touch it. A tap is a deliberate act; a sound in the room is
not.

---

## T4. Nothing else about Lava moved

1. Still in Lava, open the app's own pane and sweep **Blobs**, **Size** and
   **Voice texture** end to end.
2. Tap and drag on the blobs.
3. Be silent for ten seconds.

**Expected:** the three sliders behave as before; a tap still knocks a blob away
like a snooker ball **immediately** (the strike was not slowed — only the size
and the sound-driven drift); in silence the blobs settle back to their resting
size and speed.

---

## T5. The other eight styles are untouched

1. Click through **Mandala, Waves, Flow, Pixels, LEDs, Ripples, Fireworks,
   Starfield**, playing into each.

**Expected:** exactly what you signed off in Phase 11. The band followers were
deliberately not changed — the LEDs and Mandala are *supposed* to flash on the
syllable, and this fix is Lava's alone.

---

## What I verified here, and what I could not

- **Verified:** 27/27 pages load clean; all 9 styles played into with a real
  signal; all 9 drawn, dragged and slider-swept with no microphone; the radius
  A/B'd old against new by the same probe on the radius **as drawn**, not
  rebuilt from the bands.
- **Verified in round 3:** the radius the eye actually reads, `0.6·e·R`, per
  frame — 82.32% → 3.16% worst frame on a babbling child — and that the texture
  feature still reaches its old values at rest (a hiss 0.000, a voiced tone
  1.000, before and after).
- **Verified in round 2:** the *shape* of a rise, on the drawn radius, against
  three earlier builds — and brightness measured before being deliberately left
  alone (9.6% in a frame on a clap, 1.9% on a raspberry: a flash, not a
  flicker).
- **Not verified:** how 349 ms feels to a student in the room. That is T3, and
  it is why T3 is in this checklist rather than in my own notes.

## Still open from §12.6 — the remaining six

Fireworks size and a particle-size slider; whether the Fireworks fall is
interesting; a stronger Mandala at full loudness; Waves travelling horizontally;
a bolder Flow; LEDs against WLED's repertoire; a Starfield that moves *through*
space. **Say which one you want next** — they keep coming one at a time.
