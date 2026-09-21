# Phase 5a — The driven pointer: a gamepad becomes a finger

**Status:** BUILT, and **UAT-passed on the Xbox controller** 2026-08-27.
**The XAC was tested on real hardware and works** — confirmed by the user
2026-08-30, alongside the Phase 5c UAT. From 2026-08-27 to that date this doc
recorded the XAC as *assumed, not tested*: the open question was whether an XAC's
switch ports arrive as the standard button indices this reads them as. They do,
and **its ports show by name** (`A`, `Left trigger`), not as numbers — so §15's
fallback to numbers is a genuine fallback rather than the XAC's normal case.
The learn step (§5) was built so that the answer did not have to be known in
advance, and it still is the route a therapist uses to find out which switch is
in which port. Written 2026-08-27.
**Trigger:** touches `framework.js`, which all 17 apps see, **and creates
pointers** — the area `CLAUDE.md` names as the place two separate bugs have
already lived, both invisible until someone tapped the screen and listened.

Scope agreed with the user: **the Xbox controller and the XAC only.** The
Adaptive Hub (keyboard, named actions), dwell, the Optima as a mouse, scanning and
the micro:bits are all out of this phase. See `ACCESSIBILITY-OPTIONS.md`.

---

## 1. What this is, and who it is for

A stick moves a visible cursor over the activity. A button is a press. The
activity cannot tell the difference between that and a finger.

It serves the student who can steer but cannot reach the screen — and, because
**the XAC is a hub**, it serves rather more than one controller:

| plugged in | what the browser sees |
|---|---|
| Xbox controller | one gamepad: sticks + buttons |
| XAC with switches in its 3.5 mm ports | one gamepad: the switches arrive as **button indices** |
| XAC with a joystick in its USB port | one gamepad: that joystick is the **stick** |
| both at once | two gamepads |

**One implementation, one API, the whole agreed scope.** `navigator.getGamepads()`
is confirmed callable on `file://` with four slots (`ACCESSIBILITY-OPTIONS.md` §4).

## 2. The decision that keeps this safe

> **The virtual cursor lives in canvas LAYOUT coordinates — exactly where a
> finger's touch has already been converted to — and is fed through the existing
> `onDown` / `onMove` / `onUp`.**

Precisely: a real touch arrives in *client* pixels and `toLocal(cx,cy)` converts
it, through the canvas's bounding rect, into layout coordinates that survive the
surface being scaled. `onDown(id, cx, cy)` takes **those**, and `toSim` divides
them by `canvas.clientWidth`.

So the gamepad cursor is simply held in that same layout space from the start. It
does not need `toLocal` at all, because it was never on a screen to begin with —
and the gamepad path therefore introduces **no new mapping code whatsoever**.
Every conversion after that point is the one already exercised by every touch in
every app.

The alternative — keeping the cursor in sim space and adding parallel entry points
— means a second mapping. That is precisely how the two recorded bugs happened.
**Not doing that is the main design content of this phase.**

Consequences that follow for free, none of which need code:

- Keys mode already turns a pointer into a note: `onDown` computes
  `colIndex`/`rowIndex`, fires `flashCell`, `Anim.onCell`, `startVoice`. A gamepad
  pointer **plays notes without any app knowing it exists.**
- Flow mode already turns pointer movement into `Anim.splat`.
- `Anim.noVoices` apps (Drums, Big Switch) keep working, because they are
  dispatched from the same place.

## 3. State cardinality

**One virtual pointer per connected gamepad.** Its `Pointer.id` is `gp0`…`gp3`,
which cannot collide with touch identifiers or the string `mouse`.

- The framework already supports five independent pointers; gamepad pointers sit
  in the same `pointers` array and **coexist with real touches**. A therapist
  can demonstrate with a finger while the student holds the stick.
- Two gamepads give two cursors. That is a feature (two students, or a therapist
  on the second pad), not a case to suppress.
- **One stick, not two.** The left stick drives; the right is ignored in this
  phase. A second stick per pad would need a second cursor per pad and there is no
  request for it.

Settings are **per student**, so they live in `SETTINGS` and therefore in a
preset — unlike Menu size and Fullscreen, which belong to the display.

## 4. Lifecycle

| event | behaviour |
|---|---|
| **added** | `gamepadconnected`, or first seen while polling. Cursor appears at the centre of the surface, **not down**. Nothing is pressed by arriving. |
| **changed** | A different button is learned (§5), or sensitivity moves. Takes effect on the next frame; a press in flight is not disturbed. |
| **duplicated** | Two identical controllers is the ordinary case, not an error. They are distinguished by gamepad **index**, never by id string — two XACs report the same id. |
| **replaced** | Unplug the XAC, plug in the Xbox controller. The slot may be reused, so a pad whose index reappears with a different id is treated as **removed then added**: its pointer is released first. |
| **removed** | `gamepaddisconnected`, or the slot goes null while polling. **The pointer must be released, not abandoned** — see below. |
| **two conflict** | Two pads, plus touches, all at once. They are independent pointers; the framework already mixes them. Polyphony is capped by the existing voice limiter, not here. |

**The removal case is the one that matters, and it is a safety issue rather than
a tidiness one.** `fitSurface()` deliberately refuses to re-scale while any
pointer is down. A gamepad pointer left `down` by a disconnect — a flat battery, a
kicked cable, a switch taped down and then unplugged — would **freeze the chrome
from ever resizing again**, and hold a voice on. So:

- on disconnect, and on a slot going null, call the same release path as `onUp`;
- if a pad reports no new input for a long interval **and** is reported
  disconnected, release. Not on silence alone: a student resting on a held switch
  is silence, and releasing under them would be wrong.

## 5. Which button? Press it to learn it

**Nothing in software can know which physical switch is in which XAC port.** The
API reports button indices; the room has a switch taped to a wheelchair tray. The
earlier switch-access work reached the same conclusion (`IMPROVEMENT-PLAN` §4).

So `Setup → Access` gets a **learn** control: *"Press the switch you want to use"*.
The next button-down on any pad is stored as that student's press button. Stored
as an index, per student, in the preset.

- **No default that guesses.** Absent a learned button, **every** button presses.
  That is the friendly failure: a student pressing anything gets a note, rather
  than a student pressing the wrong thing getting silence and being thought
  unable.
- Learning again replaces it. There is one press button, not a list.

## 6. Settings, and where they live

All in `Setup → Access`, all per student:

| setting | what it does | default |
|---|---|---|
| **Use a controller** | master switch for this whole feature | **off** |
| **Press button** | learned (§5); blank means "any button" | blank |
| **Pointer speed** | cursor travel in **fractions of the surface per second**, so it means the same on every screen | 0.6 /s |
| **Dead zone** | stick movement below this is ignored, for a student whose hand rests on it | 0.25 |

**Speed is expressed in surface-fractions, not pixels.** A pixels-per-second
setting would mean something different on the room projector and on a laptop, and
the therapist would have to re-tune it per display — the same mistake `ui-scale`
exists to avoid.

## 7. Against the non-negotiables

- **No fail states.** Master switch defaults **off**. With no pad connected,
  nothing polls, nothing draws, and every app behaves exactly as it does today.
  A page opened with no gamepad support at all must be indistinguishable from now.
- **Nothing re-scales while a pointer is down.** Honoured by construction — the
  gamepad pointer is a pointer, so `fitSurface` already refuses. §4 covers the
  disconnect case that would otherwise weaponise this.
- **Map a touch before anything moves.** Honoured by §2: there is no second map.
- **Locked is pixel-perfect.** Untouched; this adds no layout.
- **The activity is scaled, never re-laid-out.** The cursor is drawn on
  `#surface`, so it scales with the activity and lands where the student sees it.
  Appending it to `document.body` would leave it in screen space while the
  activity moved underneath — the exact trap `CLAUDE.md` names about `stageEl`.

## 8. The cursor

Framework-drawn, on `#surface`, sized from the token block so it scales with
Menu size like everything else. High contrast by construction — a ring with both
a light and a dark stroke reads on any background, where a single colour will
vanish against some app's palette. It is not an app's job to make it visible.

Hidden when the master switch is off, when no pad is connected, and while the
session lock is engaged **only if** the pointer is not in use — a student mid-play
must not lose their cursor because the chrome collapsed.

## 9. Polling, and the idle sleep

The Gamepad API must be polled; there are no movement events. The render loop
already runs every frame via `requestAnimationFrame`, so polling goes there —
**outside** the `simAwake` guard, because a student picking up the stick after the
12 s sleep has to be able to wake it. Any stick movement past the dead zone, or
any button, calls `pokeSim()`.

Cost is one `navigator.getGamepads()` per frame and a short loop over four slots.
To be **measured, not assumed** — if it registers at all on the frame budget, it
drops to every second frame, which is still far below the reaction time of any
switch.

## 10. How this gets verified without the hardware

I do not have an XAC, and the room does. So:

- **`navigator.getGamepads` is stubbed in the page** to report a synthetic pad
  with scriptable axes and buttons. That exercises every line of the new code —
  cursor motion, dead zone, press, release, connect, disconnect, two pads at once
  — against the real `onDown`/`onMove`/`onUp` and a real app. It proves the
  *logic*.
- **It cannot prove the mapping from a physical switch to a button index**, and
  nothing on this machine can. That is the user's UAT, and §5's learn step exists
  precisely because that mapping is unknowable in advance.
- The clean-load gate (21 pages) and a pane sweep at Menu size 1.0 and 1.5 apply
  as usual.

## 11. Acceptance criteria

1. With no gamepad connected, all 17 apps behave exactly as they do today, and
   21 pages load clean.
2. **Use a controller** off ⇒ no cursor, no polling effect, whatever is plugged in.
3. On: the left stick moves a visible cursor; it stops at the edges of the surface.
4. The learned press button starts a note in Keys mode and paints in Flow mode —
   in an app with `onCell` (Song Grid) and one without (Flock).
5. Releasing the button stops the note. No stuck voices.
6. **Disconnecting the pad mid-press releases the pointer**, and the chrome can
   re-scale afterwards.
7. Dead zone: a stick resting off-centre below the threshold does not drift.
8. Speed means the same fraction of the surface per second at 1280×800 and
   1920×1080.
9. Two pads give two independent cursors; a finger still works alongside.
10. Settings survive a preset save/load, and are absent from the display's keys.
11. At Menu size 1.5 the new Access rows do not push the Setup pane off the
    bottom.

## 12. Not in this phase

- **The Adaptive Hub / named actions on the keyboard.** Agreed as the next phase.
- **Dwell**, the Optima as a mouse, scanning, reach area, the micro:bits.
- **The right stick, triggers, and rumble.** Rumble is interesting for a student
  who needs feedback they can feel, and is deliberately deferred rather than
  forgotten.
- **Any per-app cooperation whatsoever.** If this phase ever needs an app to
  describe itself, that is the signal to stop: it is `switchTargets()` returning.

---

## 13. Built — what the measurements said

Driven against the real `onDown`/`onMove`/`onUp` and real apps, with
`navigator.getGamepads` stubbed by a scriptable fake pad.

| # | criterion | result |
|---|---|---|
| 1 | nothing plugged in changes nothing | 0 pointers, 0 cursors, **21/21 pages clean** |
| 2 | master switch off ⇒ inert with a pad present | 0 pointers, 0 cursors |
| 3 | stick moves a cursor, stops at the edge | centre 640 → 1112 in 1 s → clamped at 1280 |
| 4 | press plays — Flow **and** `onCell` | Flock: pointer `gp0`, 1 voice. Song Grid: down, **col 3** |
| 5 | release stops it | pointer gone |
| 6 | **disconnect mid-press releases** | held 1 → down 0, state null |
| 7 | dead zone | stick at 0.2 against a 0.25 zone: **no drift** |
| 8 | speed is resolution-independent | **0.60 of the shorter side per second** at 1280×800, 1920×1080 and 1366×768 |
| 9 | two pads and a finger together | 3 pointers `gp0` `gp1` `mouse`, all down, two cursors apart |
| 10 | a preset carries it; the display's keys do not | `padOn` ✓ `padButton` ✓ — `uiScale` ✗ `fullscreen` ✗ |
| 11 | fits at Menu size 1.5 with the rows open | **0 px overflow** at 1280×800, 1366×768, 1920×1080 |

The learn step was exercised too: button 11 learned, a *different* button then
does nothing, and the learned one presses.

**What this did not prove, and could not.** Which physical switch is in which XAC
port, and whether a real XAC reports its switch ports as the button indices this
assumes. No machine without the hardware could answer that — it was the user's
UAT, and §5's learn step exists precisely because the answer was unknowable in
advance. **Settled on real hardware 2026-08-30: it works.** Which switch is in
which port remains something only the learn step can tell you, by design — that
is a fact about physical ports, not a gap in the code.

---

## 14. The pane, reworked after first use — 2026-08-27

The controller worked on the first try; the **pane** was the weak part. Four
things, of which the second is the only one that changes whether a therapist can
set a student up unaided.

**1. Two full-width buttons became two chips.** *Learn the switch* and *Any
button* were equal-weight slabs that read as alternatives while being different
kinds of thing — one entered a mode, one cleared a value. But the underlying
state genuinely **is** a two-way choice, "any button" or "this one", which is what
`makeChips` exists for and what every other choice in the suite looks like. New
furniture had been invented where the framework already had the right shape. The
group also **shows** the learned button (`Button 9`) instead of narrating it in a
sentence underneath, and it halves the height.

**2. Nothing said whether a controller was connected — the real gap.** The pane
looked identical with an XAC plugged in and with nothing at all, so the first
question in setting a student up was the one it could not answer.

There is now a live line, **first in the section and shown even when the feature
is switched off** (a therapist confirms the controller is seen *before* turning
anything on): a dot that lights green when a pad is present, the controller's
reported name, and **the button number as each one is pressed**.

That last part is not decoration. **It is the only feedback that exists for which
physical switch is in which XAC port** — the one thing no amount of testing on
this machine can establish (§10). Press a switch, read the number. It is
`IMPROVEMENT-PLAN` §4's *press-it-to-learn-it*, made visible rather than implied.

**3. `0.60` and `0.25` became `Medium` and `25%`.** Raw decimals are the code's
units leaking into a therapist's pane; Menu size has shown `100%` through the
slider's `fmt` since it was written, for exactly this reason.

**4. The reset stopped competing with the action.** *Any button* was a full-width
slab equal in weight to the thing you came to do. The chip group dissolves the
problem rather than solving it.

Also: the `●` glyph earned nothing and went, and a chip that is **waiting** for a
press now pulses and reads `Press it now…` rather than looking like a chip that
has already been chosen — with the animation dropped under
`prefers-reduced-motion`.

**Verified:** the line reads *"No controller found"* with nothing attached and
goes green with the pad's name the moment one appears, **with the master switch
still off**; a press shows `button 6 pressed` without any learning in progress;
learning shows the listening state and then `Button 9`; *Any button* clears it
back to `null`; unplugging returns the line to *"No controller found"*. Every
earlier criterion still passes, the pane still overflows by **0 px** at Menu size
1.5 on three screen sizes, and 21/21 pages load clean.

---

## 15. Named buttons, and moving as the press — 2026-08-27

Both from the user after driving a real controller.

### "xinput" and "Button 3" meant nothing

**The Gamepad API defines a standard layout**, and a pad reporting
`mapping:'standard'` is promising that these indices are these controls. So the
pane says **`A`** and **`Left trigger`** rather than `Button 0` and `Button 6`.
A pad that does *not* report the standard mapping keeps the numbers, because
there the index is genuinely all we know.

**This matters most on the XAC**, whose ports arrive as ordinary Xbox buttons: it
turns *"which port did I just press"* into something a therapist can read off and
write on a label.

**Confirmed on a real XAC, 2026-08-30.** It reports the standard mapping and its
ports come through **by name**. This was the one thing written here on faith — the
fallback to numbers existed precisely because it might not — and it is now the
tested path rather than the hoped-for one.

The stored value stays an **index** — stable, and what the API actually gives us.
Only the display became a name.

Controller names got the same treatment. Chrome reports things like `xinput`,
`Xbox 360 Controller (XInput STANDARD GAMEPAD)` and
`045e-02ea-Microsoft X-Box One S pad`; the parentheticals and hex prefixes are for
machines. They now read `Controller 1`, `Xbox 360 Controller` and
`Microsoft X-Box One S pad`.

### Moving is pressing

> *"as soon as there is movement there is a press held down, for students who
> cannot press a button"*

This is Option 1's **deflection-as-press** from `ACCESSIBILITY-OPTIONS.md` — the
genuinely clickless route, and the one that needs nothing of the student but to
push. New toggle, **Moving is pressing**, off by default.

Three details it needed, none of them obvious:

1. **Keyed on deflection, not on the cursor actually moving.** At the edge of the
   surface the cursor stops while the stick is still pushed. Keying on movement
   would silently lift the note there — the student is still pushing and the sound
   stops. Verified: held at x=1280 of 1280, still down.
2. **The press lands *before* the move within a frame.** Otherwise a note starts
   at the far end of that frame's travel rather than where the cursor already was.
   Verified: cursor at 811, press registered at 828, not at the frame's end.
3. **A button still works alongside it.** Either source presses, so turning this
   on takes nothing away — a student who can sometimes press still can.

The dead zone matters much more with this on, since a hand resting on a pushed
stick is now a held note. The hint says so at the point of use.

**Verified:** with the toggle off, deflection does not press. With it on: pushing
presses, centring releases, the far edge stays down, the dead zone is still
respected, and a button alone still works. Every earlier criterion still passes,
the pane overflows by **0 px** at Menu size 1.5 on three screen sizes with all the
rows open, and 21/21 pages load clean.

