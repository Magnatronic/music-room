# UAT — Phase 5c, round 3: a modal owns the screen

> **PASSED 2026-08-30**, and **the Xbox Adaptive Controller was tested on real
> hardware and works** — the one thing that had been open since Phase 5a and could
> never be settled from this desk. §11.5's arrow rule, carried as an open question
> through all three rounds, stands as built. Merged to `main` and tagged.

Branch: **`phase-5c-access-pane`** · design: `PHASE-5C-ACCESS-PANE.md` §11.7

**Where we are.** Round 1 found four faults, all in dwell — fixed, and your round 2
reply ("all works except…") passed them. Round 2 found one: with an overlay open,
the student's pointer carried on driving the activity behind it. That is what this
round is about. Section E re-checks the dwell behaviour because the same code was
touched; section F is the "nothing else moved" sweep.

Nothing merges to `main` until you have run this. If a step fails, stop there and
say which number.

**Before you start:** plug the controller in — most of this needs it. Sections B
and F do not.

---

## What changed since you last looked

**A modal stops the pointer; it does not stop the buttons.**

- The stick's ring **suspends** while any dialog is open — the note lifts, the ring
  goes, and it comes back **where you left it**, not re-centred.
- **Bound keys and buttons keep working**, the same way they already do while the
  session is locked. A dialog stops *where* a student is pointing, never *when*
  they play.
- Your instinct not to put the cursor on the overlay is what was built. Making the
  ring drive a dialog would need hit-testing, focus and a way to dismiss inside
  every app's own dialog — the shape that killed Phase 2's switch access. §11.7
  records the rejection.

---

## A. Drums — the pad editor (5 min) · *needs the controller*

| # | Do this | Expect |
|---|---|---|
| 1 | Open **Drums**. `Setup → Access → Controller`, **Stick moves a pointer** on, **Pushing the stick plays** on | The ring appears and playing works as before |
| 2 | Drive the ring to somewhere **obvious and off-centre** — say the bottom-left pad — and let the stick go | The ring sits there |
| 3 | Rail **✏️ Edit**, then tap a pad with the mouse to open its editor | The editor dialog opens over everything |
| 4 | Now **push the stick hard** in any direction, and press the button | **The ring is gone, and nothing happens.** No note, and — the thing you reported — **the dialog stays on the pad you opened.** It must not swap to another pad |
| 5 | Close the dialog (✕ or click the dark surround) | The ring comes back **exactly where you left it in step 2** — *not* re-centred. This is the bit worth watching |
| 6 | Push the stick | It plays again from there, as normal |
| 7 | With the dialog open again, press a **bound** button (Y is on Play out of the box) | **It still works.** A dialog must not mute the student |

## B. The colour picker — every app (3 min) · *needs the controller*

This is the one that was **not** just a Drums problem.

| # | Do this | Expect |
|---|---|---|
| 8 | Open **Life** (or Flock, or Song Grid). Stick pointer on, **Pushing the stick plays** on. Play a bit | Notes, as normal |
| 9 | `Visuals → Background colour` | The colour dialog opens |
| 10 | Push the stick around hard for a few seconds | **Silence, and no ring.** Before this fix it played the whole time |
| 11 | Pick a colour, or close the dialog | The background changes; the ring returns where it was and plays again |
| 12 | Repeat 9–11 in a **second** app | Same. It is a framework rule, not a per-app patch |

## C. Sampler (2 min) · *needs the controller*

| # | Do this | Expect |
|---|---|---|
| 13 | Open **Sampler**, stick pointer on. Rail **✏️ Edit**, tap a pad to open its editor | The editor opens |
| 14 | Push the stick and press | Nothing behind it, and the editor stays on the pad you opened |
| 15 | Type in the pad's **name** box while a key is bound to an action | The letters go in the box. Your bound key does **not** fire its action |

## D. The therapist's own pointer (2 min)

| # | Do this | Expect |
|---|---|---|
| 16 | With any dialog open, move the **mouse** over it | The Windows arrow is there and everything in the dialog clicks normally. It is never hidden over a dialog |
| 17 | `Mouse` tab → **Dwell** on. Open the colour dialog and rest the mouse **over the dialog** for 3 s | **Nothing fires.** The mouse dwell already stopped itself over a dialog; this is confirming it still does |

## E. Dwell still behaves (4 min) · *the round-1 fixes, re-checked*

The dwell code was touched again, so please re-run these four.

| # | Do this | Expect |
|---|---|---|
| 18 | `Controller` tab, **Pushing the stick plays** off, **Dwell** on, `Hold for` ≈ **1.0 s**. Drive the ring across the screen without stopping | **Silence the whole way**, and the ring does **not** fill while you are moving |
| 19 | Let the stick centre and leave it | The ring fills like a clock, a note sounds — and **the note ends on its own** with nothing having to move |
| 20 | Keep resting there without moving | It does **not** fire again, and the ring does not sit full. Only moving re-arms it |
| 21 | `Mouse` tab → **Dwell** on. Move the mouse **very slowly** across the activity — slower than you would ever normally move | The ring never fills and nothing fires. A slow creep must not quietly complete a dwell |
| 22 | Set `Hold for` to its maximum | **6.0 s** |

## F. Nothing else moved (3 min) · *no controller needed*

| # | Do this | Expect |
|---|---|---|
| 23 | Open 3 or 4 apps and play with a finger and the mouse as normal | Exactly as before |
| 24 | Open the colour dialog and the Drums editor with **no controller plugged in at all** | Both behave exactly as they always have. Nothing about the change shows up when there is no controller |
| 25 | Save a preset with a distinctive access setup, change everything, load it back | Every access setting returns, bindings included |
| 26 | `Reset all settings` | X → Clear and Y → Play are back, nothing left sounding |

---

## Decided at round 3 — the system arrow's hiding rule

**§11.5, carried as an open question through all three rounds.** The design said
hide the arrow whenever a ring is in play; the build hides it only once the mouse
has actually been **abandoned** for 2½ seconds, because the literal version leaves
you with *no* pointer over the activity while a student's stick drives.
**Passed at round 3, so the build's version stands** and the plan records it as
decided rather than as drift.

## What I could not test from here — now settled

**A real Xbox Adaptive Controller.** Everything here was driven through a faked
gamepad arriving on the same browser API a real one uses. **The user tested the
real XAC on 2026-08-30 and it works**, closing the gap every doc from 5a onwards
had carried.

## What I did verify, by driving the real pages

- **Load gate — 21/21 pages clean in Edge *and* Firefox**: 0 `pageerror`,
  0 `console.error`, 0 failed requests.
- **22 checks on the new rule**: the Drums editor not retargeting under a driven
  stick; the pointer neither drifting nor pressing behind it; the ring hidden; the
  arrow kept over the modal; the position **resuming off-centre rather than
  re-centring**; no note stranded at +5 s and no pointer left down; the colour
  modal silent under a pushed stick in `life`, `song_grid` **and** `flock`; a bound
  button still firing while a modal is up; and a button *held* across the modal's
  life not re-firing when it closes.
- **12 regression checks** that the no-modal path is untouched: stick moves and
  plays, ring drawn, note lifted on release, controller dwell travelling silent and
  letting go on its own, mouse dwell firing.
- Two of those started red and were **my tests, not the code** — one was reading the
  mouse ring instead of the pad ring, the other was counting the wake-up note's own
  release tail as sound. Both are recorded here rather than quietly fixed.
