# UAT — Phase 14: Big Switch

> Branch `phase-14-big-switch`. Nothing outside Big Switch changed.
> About 6 minutes.

---

## T1. The song draws itself

Every press now drops its note on screen — **across** by how far through the tune
it is, **up** by its pitch — so the melody draws its own shape as you play it.

This replaces the 6 px progress bar at the very top of the screen, which a
student looking at the middle never saw. Now the picture reaching the right-hand
edge **is** the song finishing.

1. Open `big_switch.html`. Press the screen a dozen times.

**Expected:** a trail of coloured dots marching left to right, rising and falling
with the tune, joined by a faint line. Measured: ink on screen goes 0.25% to
2.49% over twelve presses. (It was 5.46% before the giant letter went off by
default — most of that ink was the letter, which is rather the point.)

2. Keep going to the end.

**Expected:** the celebration plays — and **does not add dots**. The flourish is
the app playing, not you, so it stays out of your picture.

3. Turn **Draw the tune as it plays** off on the ✨ Visuals tab (it sits with
   the other two picture switches; I had briefly duplicated it onto the Song tab
   as well, which was sloppy — it is in one place now).

**Expected:** back to just the colour wash.

---

## T2. At rest, something invites a press

The screen used to be black between presses, in the app whose whole interaction
is *press*.

1. Open it and leave it alone for five seconds.

**Expected:** a slow breathing circle appears in the middle after a second or so.

2. Press, and watch what happens to the circle.

**Expected:** it goes while the colour wash is up, and comes back once you have
been still for a moment. It should never compete with a note you just played.

---

## T3. Patterns — you asked whether anything plays well besides songs

**They suit this app better than songs do**, and the reason is worth a sentence:
here *you* supply the rhythm, one press at a time. A song is half pitch and half
rhythm, so pressing through Twinkle at your own pace loses half of what makes it
Twinkle — and stopping after eight presses leaves you mid-phrase, on a note that
wants to go somewhere. A pattern depends only on the **order of the pitches**,
which survives any pace, and has no wrong place to stop.

On the 🔘 Song tab, **What it plays** now lists five patterns above the songs:

| | what it sounds like |
|---|---|
| ↗ **Climbing** | walks up the scale — builds, then arrives |
| ↘ **Falling** | walks down — settling |
| 🔔 **Chimes** | an arpeggio: only chord tones, so nothing can clash |
| 〰️ **Wandering** | pentatonic — **the scale that cannot sound wrong** |
| 🎪 **Bouncing** | low, high, low, high — playful and predictable |

1. Try each, a dozen presses.

**Expected:** each draws a different, recognisable shape — a staircase, a zigzag,
a wander — and none of them ever lands on a note that sounds like a mistake.

**Verified rather than asserted:** I recovered the pitch of every note actually
played and checked it against the name — Chimes only ever plays chord tones,
Wandering only ever pentatonic degrees.

---

## T4. One press, the whole tune — your suggestion

A third option under **Each press plays…**, beside *One note* and *A whole
phrase*.

1. Set **Each press plays… → The whole tune**. Press once.

**Expected:** the entire tune plays itself in its own rhythm, drawing the whole
picture as it goes, and finishes with the celebration.

2. Press again while it is playing.

**Expected:** nothing. That is deliberate — for the student this mode is for,
"I pressed and the music is happening" has to stay true, and a second press
cutting the first one off would teach the opposite. Tell me if you would rather
it restarted.

3. Check the speed slider.

**Expected:** **Tune speed** appears in this mode and **Phrase speed** in phrase
mode; in *One note* there is no speed slider at all, because there you set the
rhythm and it would govern nothing.

---

## T4b. Changing a setting starts again cleanly

You said it "tries to continue and it gets confused". It did: a phrase, a whole
tune and the flourish all queue their notes on timers, and changing the song
reset the counters while leaving those timers to fire — so the old tune played
on into the new one. The granularity chips were worse, resetting two counters and
leaving the picture and the note count alone.

1. Set **The whole tune**, press once, and while it is playing pick a different
   tune.
2. Press a few times in **One note**, then switch to **A whole phrase**.
3. Press ⏮ in the middle of a whole tune.

**Expected in all three:** everything stops at once, the picture clears, the
progress bar goes back to zero, and the next press starts the new choice from the
beginning.

**Measured:** 0 notes and 0 marks survive each of those, and four presses
afterwards still give four notes — a reset that left the app dead would be worse
than the bug.

---

## T5. The picture always reads left to right

You photographed a whole-phrase press stacking every note of the phrase into a
vertical line at the right-hand edge. The cause: the x came from the *granularity*
counter, and in phrase mode that counter advances the instant you press while the
notes play on timers afterwards — so all of them took the position for *after*
the phrase had finished.

It now comes from a count of notes actually drawn, which means the same thing in
all three modes and cannot go backwards.

1. **Each press plays… → A whole phrase.** Try **↗ Climbing**, then **Twinkle**.

**Expected:** the same staircase and the same contour you get in *One note* mode
— marching left to right — not a stack at the edge.

2. Try a few more combinations of tune and granularity.

**Verified:** all **24 combinations** (five patterns and three songs times three
granularities) draw from 0.000 to about 0.94 with no step backwards.

---

## T5b. The screen flash is capped — a safety change

You asked whether the flashing could be triggering. **Measured before I changed
anything:** one flash changes the screen's relative luminance by 0.037, which is
*below* the 0.10 that defines a flash — but the **rate** was 6 per second
pressing quickly, 10 for a whole tune and 10 for the flourish, against a general
limit of **three per second**. The flourish being worst was my fault; I had sped
it up.

It is now one flash per 340 ms at most. Measured after: **3 / 2 / 0 per second**,
with **14, 32 and 32 notes still played** — nothing you do is discarded, only the
screen-sized flash of it.

1. Press as fast as you can.

**Expected:** every press still sounds and still drops its dot, but the
whole-screen colour changes no more than about three times a second.

2. Play a tune to the end and watch the flourish.

**Expected:** the dots light up one by one — **no full-screen flashing at all**
during the flourish.

3. On the ✨ Visuals tab, turn **Flash the screen on each note** off.

**Expected:** no colour wash at all; the dots and the sound carry everything.
That switch is there for a student who is photosensitive or simply overwhelmed by
it.

---

## T6. The giant letter is off, and the flourish plays your tune

1. Open the app fresh and press.

**Expected:** no giant letter. It is 38vh of text across the middle and it
dominated the picture; the toggle was always on the ✨ Visuals tab, only the
default changed. Turn it back on there if you want it.

2. Play a tune to the end.

**Expected:** the flourish walks **your** dots, lighting each as it sounds —
a playback of what you made, rather than the unrelated scale run it used to be.

---

## About the progress bar

**I could not reproduce it stopping short.** Measured at the end of a tune it
reads exactly 100% in all three modes — note, phrase and whole-tune.

There is one way it can genuinely *look* short, and it is worth knowing: the bar
lives inside the activity, which is scaled to fit, so **with the menu open or the
reach area reduced it ends where the activity ends, not at the screen edge.**

Two things changed anyway: it is 10px tall instead of 6, and the dots now span
the same width the bar does — they were inset 6%–94% while the bar ran 0–100%, so
the picture and the bar disagreed about where "the end" was. If you still see it
stop short, tell me whether the menu was open at the time.

---

## What I verified

- Every pattern **chosen through the panel and pressed into**, with the pitches
  played checked against what each name claims. 5/5.
- The picture accumulates (0.25% to 2.49% ink); the breath appears at rest
  (0.25% to 0.80%); one press gives 1 / 6 / 24 notes for the three
  granularities.
- 27/27 pages load clean; Voice Visuals still 8/8.
- **The stacked column of dots was found in a screenshot, not by a check.** The
  finishing flourish was adding marks at `done()/total() = 1`, piling them on the
  right-hand edge. Every check was green while it did so.
- **Not verified:** whether five patterns is the right five, and whether the
  breath is too subtle in a bright room. Both are yours.
