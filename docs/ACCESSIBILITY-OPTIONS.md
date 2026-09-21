# Accessible interaction — options, not a plan

**Written 2026-08-26, at the user's request.** This was an options paper for a
decision, not a design doc for a build.

> **The decisions were taken and the work is shipped — `v1.6.0`, 2026-08-30.**
> This document is kept for the reasoning behind the choices, not as a live list.
> What was picked, in order, exactly as §12 and the recommended order proposed:
> **a driven pointer from the gamepad** (Phase 5a, `PHASE-5A-GAMEPAD-POINTER.md`),
> **the Hub as a keyboard doing named actions** (Phase 5b, `PHASE-5B-HUB-KEYS.md`),
> and **dwell, plus the pane to hold all of it** (Phase 5c,
> `PHASE-5C-ACCESS-PANE.md`). **Scanning was not built.**
>
> The paper's central finding held up: **two interaction shapes, not seventeen** —
> so accessible input became framework geometry and never needed a per-app
> `switchTargets()`. That is the whole reason this survived where Phase 2 did not.
>
> The "plug each thing in and press each switch" step §8 recommends **was done**,
> on 2026-08-30: a real XAC reports the standard mapping and its ports arrive by
> name. See `IMPROVEMENT-PLAN.md`.

The question: **how does a student who uses a joystick, an XAC, a switch or a
mouse — and who may not be able to click — actually play these apps?** Settings
are not the problem. The interaction is.

---

## 1. The thing that killed this last time

Switch access was built, verified, and then dropped. The record says why:

> Switch access was built and dropped because it needed `switchTargets()` in all
> 17 apps and each one felt different. Anything that needs every app to cooperate
> will go the same way.
> — `CLAUDE.md`, Non-negotiables

Your framing this time contains the same assumption: *"the interactions will
sometimes be specific to the actual app."* That is the sentence that produced
`switchTargets()`. So before proposing anything I tested it against the code.

**It is not true.** There are two interaction shapes in this suite, not seventeen.

## 2. What the 17 apps actually ask for

| shape | what it needs | apps |
|---|---|---|
| **A position and a press** — `Anim.splat(x,y,dx,dy)` | a point on the surface, 0..1, y up | **all 17** |
| **A discrete cell** — `Anim.onCell(col,row)` | which band or grid cell | **6**: Big Switch, Drums, Echo Bird, Sampler, Song Grid, Soundscape |

Both are already **framework-owned**. `buildBands()` builds the bands, the
framework owns `data-cell`, and it is the framework — not the app — that decides
a touch has landed on a cell and calls `Anim.onCell`.

And both funnel through one place:

```
device  →  pointers[]  →  toSim(x,y)  →  onDown / onMove / onUp
                                              ↓
                                    Anim.splat  /  Anim.onCell
```

**Anything that can synthesise a pointer gets all 17 apps for free.** That is the
whole architectural argument, and it is why this can be framework geometry rather
than seventeen hooks. It is the same insight as `[[reach-area-idea]]`.

## 3. "Cannot click" is three different students

Lumping them together is what makes this feel app-specific. Separated, each has a
clean answer:

| | the student | what fails | what they need |
|---|---|---|---|
| **(a)** | can move a stick / mouse / head, **cannot press** reliably | the click | a press that is not a click — dwell, or deflection-as-press |
| **(b)** | can press a switch, **cannot aim** | the pointing | something else does the aiming — scanning |
| **(c)** | can do **one thing, once, unreliably** | timing and repetition | the activity comes to them |

Every option below says which of (a), (b), (c) it serves. That is the spine of
the decision.

## 4. Measured, so the options are not speculative

Checked on the real pages, 2026-08-26, Edge, `file://`:

| | |
|---|---|
| `window.isSecureContext` on `file://` | **true** |
| `navigator.getGamepads()` | **callable, 4 slots** |
| Pointer capture / pointer lock | available |
| `navigator.hid`, `navigator.serial` | present |

**The gamepad route works offline from a USB stick.** That was the one fact that
could have killed options 1 and 6 before they started, and it does not.

*Note this narrows, but does not cancel, `[[own-device-access]]`. A gamepad or an
XAC plugged into the room PC is fine on `file://`. A student's **own** device
reaching this over a network still needs https, and that is a different problem.*

---

## 5. The options

### Option 1 — A driven pointer (joystick / XAC → a visible cursor)

**Serves (a).** The stick moves a high-contrast cursor over the activity; the
activity sees an ordinary pointer.

Three ways to press, and they are not exclusive:

- **A button** on the XAC — simplest, but needs a press.
- **Deflection is the press** — the pointer is *down* whenever the stick is off
  centre, and lifts when it returns. **Genuinely clickless.** For a paint or
  swarm app this is close to ideal: push the stick and you are drawing.
- **Dwell** — see Option 2.

**Per-app cost: none.** It feeds `pointers` exactly like a finger.
**Risk:** a cursor can vanish against a busy scene. It has to be framework-drawn
on `#surface` (so it scales with the activity) and high-contrast by construction.

### Option 2 — Dwell ("hold still" instead of "click")

**Serves (a).** Hold the pointer still for *N* ms and it presses. Works for a
mouse, a head-mouse, an eye-gaze pointer and Option 1's cursor alike.

**Per-app cost: none** — it manufactures a normal pointer-down.
**Composes with everything.** It is the cheapest thing on this list and helps the
most people.
**Risk:** accidental activation. Needs a visible countdown ring at the cursor so
the student can see it coming and move away. Dwell time belongs in `Setup → Access`.

*You have already seen this shape work: the held-press pull just built into Flock
is the same idea — resting counts as an input rather than as nothing.*

### Option 3 — Scanning, over framework geometry rather than app-declared targets

**Serves (b).** A highlight steps through targets; a switch selects.

**This is the feature that died — and this is the version that survives it.** The
difference is where the targets come from. Last time each app had to declare them.
It does not have to:

- **Scan the note bands.** The framework already builds them and already knows
  where they are. Every app with a Notes tab gets scanning with no app code.
- **Scan an N×M grid over the surface**, and select = `splat` at that cell's
  centre. Works in **every** app including the sensory ones, because a point on
  the surface is the one thing all 17 already accept.

One switch (auto-scan on a timer) or two (one steps, one selects).

**Per-app cost: none, by construction.** If any part of this starts needing an
app to describe itself, that is the signal to stop — it is the old failure
returning.
**Risk:** a grid over a swarm is arbitrary. But it is *predictable*, which is the
point, and at 2×2 it degrades gracefully into "four big regions".

### Option 4 — Reach area — ✅ SHIPPED as v1.9.0, 2026-08-31

**Serves (a)** where the student's usable range is a corner of the screen rather
than the whole of it. Map the full activity into a rectangle they can actually
reach — the therapist drags it into place once.

**Built as `PHASE-7-REACH-AREA.md`.** Two things this note predicted, and one it
got wrong:

- **"Per-app cost: none"** — correct, and it is the whole argument. Four numbers
  changed in `fitSurface()` and **no app file was touched**.
- **"It gets a design doc before a single line"** — it did, on three separate
  triggers at once.
- **"It is a transform at `toSim`"** — wrong, and pleasantly so. It never went
  near `toSim` or `toLocal`: the transform sits on `#surface`, and `toLocal()`
  already reads the **on-screen** rect, a form Phase 3c chose so it would survive
  the surface being scaled. Input followed for free. **The feared blast radius was
  not there, because an earlier phase had already paid for it.**

### Option 5 — The activity comes to them

**Serves (c).** The activity plays gently by itself and the student's input
*modulates* rather than *initiates*. Nothing to aim at, nothing to miss, no
timing to hit. Any input is a contribution.

Some of this already exists — Soundscape, Echo Bird's *"any reply is great"*,
Bubbles' free pop.

**This is the one that genuinely varies per app, and therefore the one to be most
careful with.** Kept generic it is a framework timer that synthesises pointers at
a slow rate; let it become "each app decides what its idle behaviour is" and it
is `switchTargets()` wearing a hat. **My advice: defer it, and if it happens,
build it as the timer.**

### Option 6 — Switch-as-keyboard, as the baseline

**Serves (b) and (c), today, for nothing.** Most classroom switches present as a
**keyboard** (Space / Enter) or as a plain mouse click. That needs no API, no
gamepad, no permissions, and no secure context.

**This should be the floor everything else stands on**, and it is worth
confirming before anything clever is built: it may cover more of the room than
expected.

---

## 6. The shape of the whole thing: two independent axes

The reason this stays framework-only is that these are not seventeen features.
They are two choices:

| **where the input comes from** | **how it decides where to point** |
|---|---|
| touch | direct (it already knows) |
| mouse / head-mouse | **dwell** (Option 2) |
| joystick / XAC stick (Option 1) | **scan** (Option 3) |
| switch — keyboard or gamepad (Option 6) | **reach-mapped** (Option 4) |

Pick one from each column. Every combination produces a pointer, and every app
already handles a pointer. **Nothing in the grid asks an app a question.**

---

## 7. What I would do, in order

1. **Identify what each device sends** (§8) — briefly, because the Hub is
   mappable and the Optima's mode is a configuration, so both are choices rather
   than facts to discover.
2. **The pair: Optima steers, Hub presses** (§8). Cheapest complete route, and
   half of it already works.
3. **Option 2 — dwell**, which makes the Optima usable *without* the Hub. Cheapest real feature, serves the most students,
   framework-only, composes with everything, and it is the direct answer to
   *"might not be able to click"*.
3. **Option 1 — the driven pointer.** Biggest single gain, confirmed viable
   offline, and dwell (2) already gives it a press.
4. **Option 3 — scanning over framework geometry.** The careful resurrection.
   Only after 1 and 2 are proven, and only if the grid rule holds.
5. **Option 4 — reach area.** ✅ **Shipped as v1.9.0, 2026-08-31** — and it turned
   out not to touch `toSim` at all. See the option above.
6. **Option 5 — defer.**

Settings land in **`Setup → Access`**, which already exists as the slot and was
built for exactly this. They are per-student, so they belong in a preset — unlike
Menu size and Fullscreen, which are the display's.

**The reach area is the exception on both counts, and it is instructive.** It got
its **own section** rather than a fourth Access tab, because those three tabs name
a *device* a student uses and this is about their arm and the room. And it is
per-**session**, not per-student: it is reset on every page load, because a shared
room PC would otherwise hand one therapist's rectangle to the next therapist's
student. `PHASE-7-REACH-AREA.md` §6.1.

**Non-negotiable throughout:** *no fail states*. Every one of these must be
absent-by-default and silently inert when the device is not plugged in. An app
with no controller present must behave exactly as it does today.

---

## 8. Answered, 2026-08-27 — the room's devices

- **Xbox controller**
- **XAC (Xbox Adaptive Controller)** with switches plugged into it
- **Optima joystick**
- **Microsoft Adaptive Hub**
- **Several micro:bits**
- **No switches that present as a keyboard**

**Corrected the same day, by the user:** the **Microsoft Adaptive Hub presents as
a Bluetooth keyboard**. So Option 6 is not dead — I had read "no switches
presenting as a keyboard" as covering every device, and it does not.

**And the Hub's buttons are mappable**, in Microsoft Accessory Center. What it
presents as is therefore partly *a choice we make*, not a fixed property of the
hardware — which is the most useful single fact in this list, because it means one
device can be made to fit whatever the framework finds easiest to listen to.

### What the inventory does to the plan

**Options 1 and 2 stop being nice-to-haves and become the whole route.** Three of
the five devices — Xbox, XAC, Adaptive Hub — are gamepads, and one implementation
of the driven pointer serves all three. `navigator.getGamepads()` is confirmed
working on `file://` (§4).

**The Optima is the interesting one.** It is usually configured to emulate a
**mouse**, and if it is, it already moves the framework's pointer today with no
code at all — the framework takes `mousedown`/`mousemove`. The only thing missing
is the press, which is exactly what **Option 2, dwell**, provides. That would make
one device fully usable for the cost of the cheapest item on the list.

**The micro:bits are a wildcard worth keeping in view.** They can be made to look
like almost anything — a USB HID keyboard or mouse with the right firmware, or
talked to directly over `navigator.hid` / `navigator.serial`, both of which are
present on `file://` (§4). That makes them a route to a *custom* switch interface,
or to tilt-and-shake input, without asking any app to cooperate.

### One device that does both — which changes the order again

The user's next point, and it is the one that settles it: **the Xbox controller
has a stick *and* buttons.** So it is not a press looking for an aim, or an aim
looking for a press. It is both halves in one device: **stick steers, button
presses.** No pairing, no dwell, nothing for a therapist to co-ordinate.

And the **XAC is a hub**. Switches go into its 3.5 mm ports, a joystick — the
Optima among them — goes into its USB port, and **the whole assembly presents as a
single Xbox controller**. That is what the XAC is for.

Which means **one implementation, the driven pointer over the Gamepad API, covers
almost the entire inventory**:

| device | covered by the driven pointer? |
|---|---|
| Xbox controller | yes — stick and buttons |
| XAC + switches | yes — switches arrive as button indices |
| XAC + Optima in its USB port | yes — one Xbox controller, stick and all |
| Microsoft Adaptive Hub | yes if set to gamepad; as a keyboard it is the press half |
| Optima straight into the PC | no — it is a mouse then, and needs dwell |
| micro:bits | no — separate route, see below |

**So Option 1 goes first, not third.** It is one piece of code, it serves four of
the five devices, and each of those devices is self-sufficient. The pair below is
still the right answer for an Optima plugged straight into the PC, and dwell is
still the right answer for a student who can steer but not press — but neither is
the first thing to build any more.

### The constraint that still holds: a key is a press, not a point

**A keyboard switch says *now*. It does not say *where*.** That is the whole
difficulty, and it is why "the Hub is a keyboard" does not by itself finish the
job — it solves the press and leaves the aiming completely open.

Which means the cheapest *complete* route is a **pair of devices**, and the room
already has both:

> **The Optima moves the pointer. The Hub presses it.**
>
> If the Optima is in mouse mode it already drives the framework's pointer today,
> with no code at all — `mousedown`/`mousemove` is what the input layer takes. The
> Hub sends a key. All the framework has to add is: **that key becomes a pointer
> press at wherever the pointer currently is.**

That is a handful of lines against `pointers`, it needs nothing from any of the 17
apps, and it gives a student who can steer but not click a complete, clickless
route through every activity. It is by some distance the cheapest complete thing
on this list, and it is cheaper than the driven pointer (Option 1) because half of
it already works.

**One thing to be careful of:** `framework.js` already binds `keydown` globally
for rail-button shortcuts (`allRailButtons()`, keyed on `desc.key`). Any key used
for a press must not collide with those, which argues for making the key a
setting in `Setup → Access` rather than a constant.

**For a student with only one device**, the Hub alone still needs an aiming
method, and that is Option 3 — scanning over framework geometry — which is much
more code than the pair above. Do the pair first.

### The next step, and it is not a build

**None of the above should be built until we know what each device actually
presents as**, because the answer changes which option serves it:

| if it presents as | then it needs |
|---|---|
| a mouse | nothing for movement — only **dwell** for the press |
| a gamepad | the **driven pointer** |
| a keyboard | almost nothing — Option 6 after all, for that device |
| HID / serial only | a small adapter, micro:bit-style |

A therapist cannot be asked to know this, and I cannot guess it. **The proposal is
a one-page identification bench** — off the launcher, like `fx_lab.html` and
`sound-test.html` — that reports, live, what the browser can see: gamepads and
their button and axis indices as they are pressed, pointer and key events with
their sources, and whether WebHID or WebSerial can see the device. Plug each thing
in, press each switch, read off the answer.

That is a couple of hours, it settles every remaining question in this document at
once, and it is the same *press-it-to-learn-it* idea the switch-access work
already used (`IMPROVEMENT-PLAN` §4) — nothing in software can otherwise know
which physical switch is in which port.

### Still open — reviewed 2026-08-30

*(The list has started at 2 since it was written; whatever stood at 1 was struck
before this doc was committed, and I am not going to guess what it said.)*

2. **One student, or a class?** — **Answered by the build, as "both, on different
   keys."** Everything on `Setup → Access` is per **student** and rides in a
   preset; `uiScale` (Menu size) and `fullscreen` belong to the **display** and are
   never carried by one. So a room-wide default and a per-student profile coexist
   without either overwriting the other.
3. **Does the student have their own device** they already drive well? — **still
   open**, and the most valuable of the three. A student's own AAC or eye-gaze
   device is a first-class route, not a fallback.
4. **Which app is the smudge screenshot from?** — **still open**, and trivial.

## 9. Deliberately not proposed

- **A per-app `switchTargets()`, in any form.** It failed once; the code is on
  `phase-2-switch-access` if it is ever wanted for reference.
- **Anything needing a network.** The suite must run from a USB stick.
- **Camera eye-gaze.** Different problem, much larger, and the student's own
  device already does it better.

---

## 12. The Hub as a keyboard — agreed, and why, and what it needs

The user's call, 2026-08-27: the Hub stays a **keyboard**, because keys and macros
are configurable in Microsoft Accessory Center and that makes it the flexible one;
the XAC and controller work together as the gamepad. **I agree**, and the reason is
better than convenience:

1. **They are different channels, so nothing has to arbitrate.** Gamepad buttons
   and keyboard keys never compete for the same index. The XAC and controller own
   the gamepad; the Hub owns the keyboard. No priority rules, no conflict code.
2. **It is configurable without a code change.** Rebinding in Accessory Center
   changes behaviour in the room without a new build on the USB stick. For a suite
   that must run offline from a stick, that is worth a great deal.
3. **The division of labour falls out naturally, and it matches the constraint in
   §8**: a key is a press without a position. So —
   > **Gamepad = *where* and *when*** — the student playing the activity.
   > **Keyboard = *named actions*** — play/pause, clear, next scene, lock.

   A named action needs meaning and no position, which is exactly what a key has
   and exactly what an activity press cannot use. The two halves fit the two
   devices without forcing either.

**The consequence to state plainly:** the Hub alone **cannot play an activity**,
because it can never say *where*. If a student is ever on the Hub only, that needs
scanning (Option 3). Not a problem, but it should not be a surprise later.

### What it needs designed around

1. **Focus is a live failure, not a theoretical one.** The existing handler is
   `if(e.target!==document.body) return;`. Type a preset name, leave the caret in
   the box, and the student's next Hub press **types a letter into it** instead of
   doing anything. That will happen in a room. The handler has to work regardless
   of focus, or dialogs have to blur deliberately on close.
2. **The hook it would build on is almost untested.** Rail buttons have supported
   a `key` since they were written, and **exactly one app uses it** — `life.html`,
   space for Play/Pause. One path, one app, out of seventeen.
3. **Macros are sharp.** A macro that sends several keystrokes fires the action
   several times, faster than a hand could. Every action reached this way has to
   be debounced or idempotent.
4. **Auto-repeat.** Holding a Hub button repeats at the OS's rate. Fine for
   "next", wrong for anything that toggles. Guard on `e.repeat`.
5. **Lock.** When the session is locked, student actions should still fire and
   therapist actions should not. Decide it now rather than discover it.
6. **The keys must be settings, not constants** — in `Setup → Access` — so they
   can match whatever is mapped in Accessory Center and avoid colliding with rail
   shortcuts.
