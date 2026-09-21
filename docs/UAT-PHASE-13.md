# UAT — Phase 13: Echo Bird takes turns properly

> Branch `phase-13-echo-bird`. Nothing outside Echo Bird changed.
> About 6 minutes. **T1 is a fault I measured; T3 is your idea.**

---

## T1. The bird stops talking over the student

**This was a real fault, not a preference.** In *Any reply is great*, the
student's turn ended on a **note count** — they got exactly as many notes as the
bird had just played, and then the bird judged and took its turn back. Measured
on the app before the fix:

| call length | notes the student got | bird took over |
|---|---|---|
| 1 | **1** | note 2 |
| 3 | 3 | note 4 |
| 5 | 5 | note 6 |

The one-note case is the worst of it, and it is the setting most likely to be
used with the students who most need room to answer.

**The turn ends on silence now.** The bird still waits *forever* for the first
note — it only starts counting once the student has begun.

1. Open `echo_bird.html`. **Bird game → 💬 Any reply is great.** Press ▶.
2. Let the bird call, then play a long, rambling answer — a dozen notes.

**Expected:** you are never interrupted. The bird waits until you stop.

3. Stop playing and count.

**Expected:** the bird answers about **2.5 seconds** after your last note.
Measured 1.06 / 2.51 / 4.03 s at settings of 1 / 2.5 / 4.

---

## T2. Wait for me

A new slider on the 🦜 Bird tab, in seconds.

1. Set **Wait for me** to 1 s. Play a few notes, stop, count.
2. Set it to 8 s and do it again — pausing mid-phrase to think.

**Expected:** at 1 s the bird comes back quickly; at 8 s you can take a long
pause in the middle of your answer and it still waits. **This is the control for
a student who needs thinking time**, so tell me if the range is wrong — it is
one line either way.

---

## T3. 🪞 The bird copies me — your idea

**This is the half of call-and-response the app was missing.** Being imitated is
the *accessible* side of the interaction: a student who cannot copy a call can
still notice that the bird just played *their* tune back. The app can now talk
*with* students it could previously only talk *at*.

1. **Bird game → 🪞 The bird copies me.** Press ▶ (or just play — the first
   touch is your turn, not a wake-up).
2. Play a short phrase with a deliberate rhythm — two quick notes, a gap, then
   two more. Stop.

**Expected:** the bird plays **your** notes back, in **your** rhythm. Not
straightened out to its own tempo. Measured: notes in order, gaps within 6.8% of
what you played.

3. Play a very long phrase — twenty notes.

**Expected:** it hands back the last dozen, not all twenty. A minute of parroting
would steal the session.

4. Press 🔁.

**Expected:** it plays *your* phrase again. The button says "Play my phrase
again" in this mode.

5. Check the menu.

**Expected:** `Calls come from`, `Notes per call` and `Bird speed` are **hidden**
in this mode — the bird makes no calls, and a slider that governs nothing is
worse than no slider.

---

## T4. Copycat is untouched

1. **Bird game → 🎯 Copy the call.** Play along with the halos.

**Expected:** exactly as before — the halo waits, stray notes still sound and are
never wrong, and completing the copy still triggers the celebration
*immediately* rather than after a pause. (That one is deliberate: in Copycat,
finishing the copy *is* the end of the turn.)

---

## What I verified

- **Before the fix**, the quota above, on the running app.
- **After:** 8 of 8 notes at every call length in Free mode, never interrupted;
  Copycat's behaviour unchanged; the bird answers within the set wait ±0.06 s.
- **The echo:** notes in order, gaps within 6.8% of the student's own, and the
  probe asserts it is capturing the *bird* rather than accidentally recording the
  student.
- **All three modes selected through the panel and played into**, twice each —
  the gate that exists because a fault in one mode's logic cannot throw until
  that mode is both chosen and used. 3/3 clean, 27/27 pages clean.
- **Not verified:** whether 2.5 s is the right default for your students. That is
  T2, and it is yours.

## Still to come — Big Switch

Its weaknesses are judgements rather than faults: at rest nothing invites a
press, twenty presses leave no trace, and the progress bar is 6 px at the top of
a screen the student is not looking at. The proposal is that **the song builds a
picture** — each press drops its note on screen, coloured and placed by pitch, so
the melody draws itself as it is played.
