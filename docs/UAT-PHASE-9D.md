# UAT — Phases 9c/9d/9e: everything you have reported so far

Branch `phase-9b-midi-apps`. Nothing is on `main` until you pass this.

**This supersedes `UAT-PHASE-9B.md` for anything it covers.** 9b's sections A, B
and D still stand and are worth running; its section C describes behaviour that
has since changed, and its section E is repeated here as §10.

**MIDI Weather is deleted.** Not delisted — the file is gone, at your request.
**Five MIDI apps now, 27 pages, 20 on the launcher.** It is recoverable from git
history (`git show 1be7176:midi_weather.html`) if you ever want it back.

> That also retires the photosensitivity fix, which was Weather's alone. The
> forked, rate-limited lightning went in and was measured before you asked for
> the app to go; nothing else in the suite has a full-screen flash. **If any
> other app ever grows one, it needs the same treatment.**

**Two apps changed name since 9b.** Creatures is now **Drift** (`✨`), and
Mirror's *Trace* look is now *Wave*.

---

## 1. The two things you spotted first

| # | Do this | Expect |
|---|---|---|
| 1.1 | Big Chords and Mirror → Visuals | The slider says **Persistence** *and so does the sentence under it*. The slider was renamed a round ago; the prose was not, which is what you caught |
| 1.2 | Big Chords: turn Persistence up, draw with one look, then **switch look** | The old look's picture **clears**. It used to stay underneath, which is what looked like two things being drawn at once |
| 1.3 | Do it again, switching between all four looks | Clean each time. Never two looks on screen together |

---

## 2. Big Chords — Arcs is gone 👆

| # | Do this | Expect |
|---|---|---|
| 2.1 | First tab → **Look** | **▮ Towers · 🪟 Panes · 🎆 Bloom · ✦ Sparks**. No Arcs |
| 2.2 | Play chords on **✦ Sparks** | A **rising cluster of small points** per note of the chord — small actors rather than a fourth big shape, which is what you said works better |
| 2.3 | Its three sliders — How many / How far they rise / Spread | Each does something distinct |
| 2.4 | **Is Sparks the right replacement?** | Tell me. It is the one I had least to go on |

---

## 3. The colours with Persistence on

You asked whether darker, bolder palettes were needed and said you were not sure.
**They were needed, and here is why:** every existing palette ramp ends at
250–255 in all three channels, so the top of the range was literally painting in
white — which is most of why a kept picture drifts pale as it builds.

| # | Do this | Expect |
|---|---|---|
| 3.1 | Visuals → **Palette** in any MIDI app | Two new ones at the end: **💎 Jewel** and **🌑 Deep** |
| 3.2 | Chords or Mirror: Persistence up, then build a picture on **Jewel** | It stays **saturated** as it builds instead of going pale |
| 3.3 | Compare against 🌊 Ocean or 🔥 Fire with Persistence up | Those still lighten — they run to white by design, and I have left them alone |
| 3.4 | Your call | If Jewel and Deep are right, I can also stop the *other* ramps at 90% instead of white. I did not do that unasked — it changes every app's look |

---

## 4. Loop Garden 👆

| # | Do this | Expect |
|---|---|---|
| 4.1 | **🎗️ Ribbon**: play a run up the keyboard, hard then soft | Height is now **how hard you played**, the same as every other app. It used to be the note's place in a range that was still settling underneath it, which is what made it look random. **The pitch is still there — it is the colour** |
| 4.2 | Ribbon's third slider | **Lean**, which tilts the whole ribbon. Height only squashed the timeline and fought Size and Glow |
| 4.3 | **🎡 Wheel** or **🌼 Bloom**, with **The track** up | The sweeping arm now reaches the **edge of the screen**, not the rim of the wheel |
| 4.4 | Visuals → **The sweep leaves a wake** | Your streaks idea. The arm drags a fading wake behind it. Works in Wheel, Bloom and Ribbon. At 0 it is off |
| 4.5 | Is the wake better as a per-look thing? | It is app-level so every look keeps exactly three sliders. Say if you would rather it were per-look |

---

## 5. Drift — fourth pass 👆

All four of your points taken. **Embers was the important one**: you said it was
not markedly different and might be a better murmuration, and you were right —
a faint tail with a bright head is the same picture a streak makes.

| # | Do this | Expect |
|---|---|---|
| 5.1 | **🜁 Murmuration** | The streak tails should no longer **flicker**. The steering changed each agent's velocity every frame and the speed cap clipped it; the picture now uses a lagged copy of the velocity, the physics does not |
| 5.2 | Move **Togetherness** across its range | It should now visibly gather and scatter them. It only drove cohesion before, while separation went on holding them apart |
| 5.3 | Move **How many** | Reaches 40, and the swarm **widens** with it instead of piling into the same space |
| 5.4 | **🔥 Embers** | Barely flocks now: rises harder, **flickers**, and dims as it climbs. Should read as sparks off a fire, not as birds |
| 5.5 | **🪰 Fireflies** with **Size** at the bottom of its range | Still **visible**. The mark had a floor of 0.7 pixels, so most of that slider's travel was below the point where anything could be seen |
| 5.6 | Fireflies' **Blink** and **Wander** | Both have more range than before |
| 5.7 | **✳ Threads** | Crisper. It drew a line between *every* pair within reach — dozens of soft lines crossing, which is the blur in your screenshot. Nearest three each now, thin and nearly opaque |
| 5.8 | Visuals → **Persistence** | Here now, with 🧽 Wipe. **Linger is not** — you were right that it was pointless in Drift, and worse than pointless: it was on the pane and the app never read it. "How long they live" on the first tab is this app's lifetime control |
| 5.9 | **Where is it now?** | Fourth pass. If one of the four is close and the others are not, say which and I will build outward from it |

---

## 6. Mirror — the extra ring 👆

You were right, and it is one reply style.

| # | Do this | Expect |
|---|---|---|
| 6.1 | First tab → **How it answers** → **Carries on (+1 of its own)** | The chip now says so. That style adds a note of its own, so its answer has **one more mark** than you played — that is the extra ring |
| 6.2 | Try the other four — a little higher / upside down / backwards / a quiet shadow | **Note for note.** No extra mark in any of them |
| 6.3 | On "Carries on", watch where the extra one lands | Clearly **past the end** of the phrase now, rather than beside it, so it reads as an addition |
| 6.4 | If you would rather it did not exist | Say so and I will drop the extra note — it is two lines |

---

## 6b. MIDI Light — Fireworks, and reaching the floor 👆

| # | Do this | Expect |
|---|---|---|
| 6b.1 | MIDI Light → **🎆 Fireworks**. Click high on the screen | One explosion, **where you clicked**. No second smaller one below it |
| 6b.2 | Hold a key down | The fountain comes **from the burst**, not from a point halfway down. It used to spawn at half the height |
| 6b.3 | Play as softly as you can, in any MIDI app | It should reach the **bottom of the screen**. The curve raised quiet notes on top of a floor, so the bottom quarter was unreachable however softly you played |
| 6b.4 | Play as hard as you can | Still at the top |
| 6b.5 | Sweep the whole velocity range | Tell me if the middle now feels wrong — I changed the shape of the curve, not just its ends |

---

## 6c. Big Chords — the glow 👆

| # | Do this | Expect |
|---|---|---|
| 6c.1 | **🪟 Panes** with **Glow** up | It no longer washes the pane out with a huge circle. Panes was taking its glow radius off a width that reaches 92% of the screen |
| 6c.2 | The **Glow** slider itself | Runs 0–1.6 now, not 0.2–3, and **0 means none** |
| 6c.3 | Move **Size** on Towers and Panes | It now does something on both. On Panes it did **nothing at all**, which is why you could not tell what it did |
| 6c.4 | Turn Persistence up and build a picture | The glow no longer smears the whole thing pale |
| 6c.5 | Still too dominant? | Say so — the cap is one number per look |

---

## 6d. Loop Garden — the wake, and painting with it 👆

You were right that it did nothing. It was broken **twice**: it lived inside the
track block at a tenth of the track's alpha, so with *The track* down it did not
exist; and it was eighteen rays from the centre, 66 pixels apart at the rim.

| # | Do this | Expect |
|---|---|---|
| 6d.1 | Visuals → **The sweep leaves a wake** up, with **The track** at 0 | A **coloured** wake behind the sweep. It works whether or not the track is shown |
| 6d.2 | Now turn **Persistence** up — it is on **all four shapes** | The sweep **paints**. Leave it a couple of minutes and it draws itself a picture |
| 6d.3 | Watch what it paints | Arcs and rings rather than a flat wash — the wake fades to nothing at the hub on purpose, because a flat fill filled the screen evenly in ten seconds |
| 6d.4 | **🧽 Wipe** on the rail | Clears the picture |
| 6d.5 | Try it in Ribbon | Vertical streaks instead of arcs |
| 6d.6 | Is this the art you were after? | Measured: 6% of the canvas painted after a second, 14% after six, at Persistence 70% |

---

## 6e. Big Chords — Sparks 👆

| # | Do this | Expect |
|---|---|---|
| 6e.1 | Play a chord on **✦ Sparks** | The sparks **radiate from the point**, in all directions, rather than spreading sideways |
| 6e.2 | Watch one burst all the way out | Fast at first and then **easing off smoothly** — no sudden change of pace. The old motion had a growth ramp that ended after a fifth of a second and handed over to something growing at a constant rate, which is exactly the seam you saw |
| 6e.3 | Its three sliders | How many · How far they rise · Spread |

---

## 6f. Loop Garden — painting the notes, not the machinery 👆

| # | Do this | Expect |
|---|---|---|
| 6f.1 | Turn **Persistence** up and let it sweep with **nothing played** | **Nothing is painted.** The rings and the moving hand are drawn after the picture and can never build into it. Measured: 0.02% of the canvas after five seconds |
| 6f.2 | Now play some notes and watch | Each note **smears back along the loop** as the sweep passes over it. That is the whole picture — 12.9% of the canvas once six notes are down |
| 6f.3 | Leave it a few minutes | It builds and then settles. The smears are at the notes' own places in the loop, so the picture is a record of what was played rather than something that grows for ever |
| 6f.4 | Look for **The sweep leaves a wake** | **Gone.** You were right that it was the wrong idea — the picture was of the machinery rather than of the playing |
| 6f.5 | Switch between shapes | The picture **clears**. That is your "easier to just clear it" — the four layouts have nothing to do with each other |
| 6f.6 | With Persistence at 0 | No smear at all. It only exists when it is painting |

---

## 6g. Mirror — the line can run either way 👆

Your mid-flight request.

| # | Do this | Expect |
|---|---|---|
| 6g.1 | First tab → **Which way the line runs** | **— Across** or **❘ Down** |
| 6g.2 | Switch to **Down** and play | The line is vertical, yours go to one side and its answers to the other, and the mirroring works the same way |
| 6g.3 | Try all four looks on **Down** | All four work. **▮ Bars** is the only one with a direction of its own — it should stand away from the line, not stay upright |
| 6g.4 | Touch near the line and near the edges in both | The answer still lands at the mirror of your touch |

---

## 6h. The menu prose

| # | Do this | Expect |
|---|---|---|
| 6h.1 | Open every pane in all five apps | The descriptions are **shorter**. The longest was 397 characters |
| 6h.2 | Anywhere still too wordy, or now too terse | Tell me which pane — I cut them by judgement, not to a rule |

---

## 6i. The grey middle — fixed, and the reason it took three goes

**You were right to send the second screenshot.** My first answer named the
cause correctly and then fixed the wrong thing.

**The cause is the deposit rate.** The picture took a few percent of each frame,
so a pixel needed about twenty-six frames under a mark to take its colour — and
a mark is only over it for two or three. Its value was therefore a long-run
**average** of everything that ever passed over it, and the average of many hues
is grey however slowly you take it. In the middle, everything passes.

**The fix is to deposit hard**: most of the mark goes down in the frames it is
actually there, so the picture holds the colour of the *last thing that passed*
rather than a mean. Measured against a copy of the old code, clicking repeatedly
in one place at *kept for ever*:

| | saturation over fifty seconds | brightness |
|---|---|---|
| before | 0.643 → **0.559**, still falling | 50 → 117, still climbing |
| after | ~0.65, **steady** | plateaus at 127 by twelve seconds |

| # | Do this | Expect |
|---|---|---|
| 6i.1 | Drift → 🪰 Fireflies, **Persistence** up, and click repeatedly in one place for a minute or two | It stays **coloured**. This is the check that matters — it is your screenshot, repeated |
| 6i.2 | Do the same in **MIDI Light** with Persistence up | Also fixed. You asked whether it was a problem elsewhere and it was: MIDI Light has its own copy of the same code and had the same fault |
| 6i.3 | Try it in Big Chords, Mirror and Loop Garden | All four use the shared version |
| 6i.4 | Set **Persistence** below the top and leave it a few minutes | It reaches a **steady state** — paint arrives, old paint leaves. At the very top it reads **"kept for ever"** and does not fade |
| 6i.5 | If any of them still muddies | Tell me which app and roughly how long it took. The deposit is one number |

**Two wrong answers went before the right one**, and I would rather you knew:
slowing the deposit only postpones an average, and letting the picture fade
bounds how much paint is on the canvas but does nothing where paint arrives
faster than it leaves — which is exactly the middle.

---

## 6j. Loop — the smear, corrected twice 👆

| # | Do this | Expect |
|---|---|---|
| 6j.1 | Persistence up, play one note, then **watch the arm come round to it** | The smear happens **when the arm goes over it**, not on the click. It was firing on the click because the same flag marks a freshly planted seed |
| 6j.2 | Watch which way it goes | **Forwards**, the way a brush drags paint — the arm pulls it along. It used to trail backwards, into the part of the loop the arm had just left |
| 6j.3 | Same in **Bloom** and **Ribbon** | Same behaviour in all four shapes |

---

## 7. Still true from 9d — the shared fixes 👆

Quick confirmations; these were measured but your eye is the gate.

| # | Do this | Expect |
|---|---|---|
| 7.1 | Big Chords: tap the **same spot** twenty times fast | Bright but **still coloured**, and every chord **stops**. Nothing hangs on |
| 7.2 | Push Brightness, Size and Glow all up in Loop Garden and fill the wheel | Bright, still coloured |
| 7.3 | Play Drift then Big Chords at the same Volume | Comparable loudness |
| 7.4 | Loop Garden: **🔇 Silence** | The loop stops going round; the button becomes **▶️ Go on** |
| 7.5 | Drift: **🔇 Silence** | They stop singing; **▶️ Let them sing** brings them back |
| 7.6 | **🪐 Orbit**: watch a seed pass the top marker | It sounds **exactly** as it passes |
| 7.7 | Touch the far corners in every Loop shape | Lands under your finger |
| 7.8 | Mirror: touch top half, wait | The answer is at the **mirror image**, in the **same colour** |
| 7.9 | Mirror → **〰️ Wave** | One connected curved line per side |

---

## 8. Linger and Persistence

| # | Do this | Expect |
|---|---|---|
| 8.1 | Big Chords → **Linger** | Renamed, your word. At 4x they hang around; at *shorter* they go quickly. Nothing permanent |
| 8.2 | Big Chords / Mirror → **Persistence** up | A picture builds. **🧽 Wipe** on the rail clears it |
| 8.3 | Loop Garden and Drift | No linger slider — they own their lifetimes through *A note lasts* and *How long they live*. Say if you would rather they matched |

---

## 9. The launcher

| # | Do this | Expect |
|---|---|---|
| 9.1 | Open `index.html` | **Plug in an instrument** lists **five**: MIDI Light, Big Chords, Loop Garden, Drift, Mirror. No Weather |
| 9.2 | Open each | Loads clean, rail on the left |

---

## 10. The connect fault, from Phase 9c

Do this in **MIDI Light** and one of the other four — two separate pieces of code.

| # | Do this | Expect |
|---|---|---|
| 10.1 | Press **🔌 Connect to MIDI**, don't answer the prompt | "Asking for permission — choose Allow on the prompt at the top of the window" |
| 10.2 | Wait **ten seconds** without answering | It changes itself: "Still waiting… unplug the instrument and plug it in again. If that does not help, restart the PC" |
| 10.3 | Press **Allow** | Connects normally. A slow answer must not break it |
| 10.4 | Press Connect twice quickly | The escalated text appears at once; no second request is started |
| 10.5 | If the fault ever returns | **Tell me what the message said.** The wording is the whole fix |

---

## 11. What I checked, and what I could not

**Checked, driving the real pages:**

- **27/27 pages load clean** in Edge **and** Firefox — 0 page errors, 0 console
  errors, 0 failed requests.
- The stuck chord: three presses on one spot, then **zero** sounding voices.
- Stacking: **0.00–0.65%** of the middle blown to white after fourteen presses.
- One level: `level(0)=0.45`, `level(1)=0.95`, against 0.07–0.24 before.
- Touch lands **1.1–4.9%** of the screen from the finger, in every Loop shape,
  including outside the wheel.
- Mirror: tapped (0.24, 0.30) → answered at x **0.24**, y mirroring to **0.21**,
  hue **1°** apart.
- Silence: Loop's button toggles to Go on.
- **Loop paints only the notes**: 0.02% of the canvas after five seconds of the
  sweep with nothing played, 12.9% once six notes are down.
- **Drift's four looks** now put down 43x different amounts of ink between the
  widest and the narrowest — the crudest possible proof they are not one mark.
- **Fireworks**: pressing at screen y 0.25 lights 3.59% of the canvas there and
  0.71% halfway down, where the second source used to be.
- **The floor**: the softest note now sits at 0.046 of the height (was 0.157); a
  hard one still reaches 0.97. A velocity-8 note lands in the bottom fifth.
- **The Chords glow**, against the old code: one chord on Panes with Glow up
  lights **41%** of the canvas, against **100%** before.
- **The Loop wake**: 1.7% of the canvas lit with The track at 0, 0.00% with the
  wake off. With Persistence up: 6% painted after a second, 14% after six.
- **Drift's four looks** put down measurably different amounts of ink (17x
  between the widest and the narrowest), which is the crudest possible proof
  that they are no longer the same mark four ways.

**Not checked, and only you can:**

- **Any of it on the real MPK.**
- **Whether Sparks is the right replacement for Arcs** (§2.4).
- **Whether Drift is finally right** (§5.9) with three looks rather than four.
- **Whether the fade rate is right** (§6i.4) — I can show it reaches a steady
  state; I cannot tell you it settles at a nice-looking one.
- **Whether the Mirror reads well vertically** (§6g), which I have only checked
  for geometry, not for whether it is nicer to play.
- **Whether the Loop wake paints anything worth looking at** (§6d.6). I can
  measure that it paints; I cannot tell you it is good.
- **Whether the velocity curve feels right in the middle** (§6b.5), not just at
  the ends where I measured it.
- **Whether Jewel and Deep are the right answer on colour**, or whether the other
  palettes should stop short of white too (§3.4).
- **Whether the wake belongs per-look rather than app-level** (§4.5).
- **Every parameter range.** Still my guesses.
