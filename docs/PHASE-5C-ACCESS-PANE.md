# Phase 5c — The Access pane, and pressing without a click

**Status:** **UAT-PASSED 2026-08-30**, on real hardware. Built 2026-08-28. Round 1
returned four faults, all in dwell — §11.1, §11.1a, §11.1b. Round 2 returned one:
the pad pointer kept playing behind an open modal — §11.7. Round 3 passed, and the
**Xbox Adaptive Controller was tested on real hardware and works** — the one thing
open since 5a. §11.5's departure from §6 stands, accepted at round 3.
Written 2026-08-28. §11 records where the build differs from the design.
**Trigger:** touches `framework.js` and `framework.css`, which all 17 apps see.

**Supersedes parts of `PHASE-5A-GAMEPAD-POINTER.md` and `PHASE-5B-HUB-KEYS.md`.**
Those records stay as written; where this contradicts them, this wins, and §9
lists exactly what changed.

**The shape was settled against a clickable prototype**, not on paper:
**`prototypes/access-pane.html`** — kept in the repo rather than left in a
scratch folder, because it is the argument for this design and not merely a
sketch of it.

It links the real `framework.css`, drives a real gamepad if one is plugged in,
and has fake pad buttons for when one is not. **Every decision below was made by
clicking it and changing it**, over five rounds — and all four substantive
changes came from the user doing exactly that. It is not part of the suite: not
on the launcher, loaded by nothing, safe to delete once this is built.

---

## 1. Why the pane needed reworking at all

Phase 5a and 5b each added their controls to one flat list, and the result was a
long scroll with three problems the user named:

1. **It was wordy.** Explanatory hints under nearly every row.
2. **The mouse was invisible.** A mouse needs no setting, so the pane said nothing
   about it \u2014 and **silence reads as "not supported"**.
3. **Controller buttons could not do anything but play.** A dozen buttons idle
   while actions were keyboard-only.

## 2. The shape: three tabs

**`Controller` \u00b7 `Mouse` \u00b7 `Buttons`**, each with one honest job.

| tab | holds |
|---|---|
| **Controller** | Stick moves a pointer \u00b7 Which button plays \u00b7 Pushing the stick plays \u00b7 Pointer speed \u00b7 Ignore small movements \u00b7 **Dwell** |
| **Mouse** | *"already moves and clicks here \u2014 nothing to switch on"* \u00b7 **Dwell** \u00b7 Big pointer |
| **Buttons** | one row per rail action, set by a key **or** a controller button |

**They are tabs, not a mode switch.** Every device stays live whichever tab is
showing. A therapist on the mouse and a student on the stick is the normal case,
not a conflict.

### They must LOOK like tabs

The first prototype used a plain chip group and the user's first note was that
*"there is nothing to link the settings below to the change in chips above"*.
Correct: in this framework a chip group means **pick a value**, so nothing tied it
to the panel underneath.

Fix: the panel gets a border and background, and the active chip **sits flush on
top of it** \u2014 same fill, bottom corners squared off, `margin-bottom:-1px` \u2014 so
chip and panel read as one object.

### Why a Mouse tab, when a mouse needs no settings

**Because the tab's existence is the answer.** The tab opens with

> *A mouse, head-pointer or eye-gaze already moves and clicks here. Nothing to
> switch on.*

That single line is most of the tab's value. Movement and clicking have worked
since the framework was written \u2014 `mousedown`/`mousemove` is what the input layer
takes \u2014 but nothing said so.

## 3. Pressing without a click: two different students

This is the heart of the phase and it took two corrections from the user to get
right.

| | for a student who | what it does |
|---|---|---|
| **Pushing the stick plays** | **cannot aim** precisely; any sound is a good outcome | the note sounds **the whole time the stick is pushed** |
| **Dwell** | **can aim** accurately but cannot press | move **quietly**, arrive, hold still, and *then* it presses |

**They are not substitutes, and I twice claimed they were.** The distinction is
that *"pushing the stick plays"* offers **no way to travel silently** \u2014 every cell
crossed on the way sounds. In Song Grid or Big Switch, where the task is hitting
the *right* cell, that is the opposite of what is wanted. The user's words:

> *"a student may be able to move a stick accurately but not click"*

So **dwell belongs to the controller as well as the mouse.**

### Dwell is PER DEVICE, not one shared setting

The user asked whether dwell could be on for the controller and off for the
mouse. It must be, and the reason is who is holding what:

> **The therapist works the mouse while the student works the controller.** The
> framework keeps both pointers alive at once deliberately. One shared dwell
> would mean switching it on for the student's stick also made the therapist's
> **own mouse** fire every time they paused over the activity.

So: `dwellPad` / `dwellPadMs` and `dwellMouse` / `dwellMouseMs`. Two people, two
devices, two setups. This also removed the clumsy *"the same setting as on the
other tab"* note an earlier round needed.

### Dwell and "pushing the stick plays" conflict

With the stick already playing as it moves, the pointer is **down the whole way
and released the instant it stops** \u2014 which is exactly the moment dwell waits
for. They would fight: release, dwell re-presses, forever.

So when *Pushing the stick plays* is on, the Controller tab shows dwell as a
line, not a toggle:

> *Not used while "Pushing the stick plays" is on \u2014 that already presses.*

**Never a toggle that silently does nothing.**

### Dwell is never on for touch

A hand resting on the glass would fire it constantly. Touch is excluded by
construction, not by a setting.

## 4. Controller buttons can do actions

Phase 5b bound **keys** to rail actions. Now a row's **Set** listens for a key
**or** a controller button, and stores whichever comes first. One control, either
device.

**The conflict this creates, and the rule that resolves it:** the default is *any
button plays*. Bind Right trigger to Clear and it would both play a note **and**
clear. So:

> **A button bound to an action stops playing. Every unbound button still plays.**

That keeps the friendly failure from Phase 5a alive \u2014 a student pressing anything
still gets a note \u2014 while making the bindings unambiguous. It is surfaced in the
Controller tab, live:

> *All except X and Y, which have jobs on Buttons.*

**That line is load-bearing.** Without it nobody knows why X went quiet.

## 5. Defaults, so it works out of the box

The user's choice, from four options:

| button | action |
|---|---|
| **X** | Clear |
| **Y** | the app's main action (Play / Pause / Restart) |
| everything else | plays a note |

**Only where the app actually has that action** \u2014 an app with no Clear gets no X
binding. A therapist can rebind or clear any of them with the **\u2715** chip, so the
defaults are undoable per action rather than all-or-nothing.

## 6. The two cursors

**A web page cannot move the Windows cursor.** So when the stick drives, the
Windows arrow stays where it was while our ring moves \u2014 two pointers on screen,
which is already true today and is confusing on a projector.

- `#surface` gets `cursor:none` while a drawn cursor is in play, so over the
  activity there is **exactly one** visible pointer.
- **Never over the rail or the panel.** The therapist needs a real arrow to hit
  controls.
- **Big pointer** (Mouse tab) draws the same high-contrast ring for the mouse.
  Not on by default: a large ring trailing a therapist's mouse during setup would
  be irritating. It is for a student who needs to see where they are, and it is
  **required** when mouse dwell is on, because the ring is what shows the
  countdown filling.
- **No ring for touch.** The finger is the pointer.

## 7. Wording settled at the prototype

| rejected | chosen | why |
|---|---|---|
| "Use a controller" | **Stick moves a pointer** | buttons now do actions with the pointer off; the old name would be a lie |
| "Moving is pressing" / "Auto press when move" | **Pushing the stick plays** | says the effect, not the mechanism; same verb as the row above |
| "Which button clicks" | **Which button plays** | both modes make sound; *plays* is the suite's word, *clicks* is computer language |
| "Resting still presses" | **Dwell** | the user's own term, and the one the access world uses |

**And the prose was cut hard.** The grouping explains what the paragraphs used to.
Only two hints survive in the device tabs: the *"All except X and Y"* line, and
the Mouse tab's opening line. Both carry information nothing else does.

## 8. State cardinality

All per **student**, so they ride in a preset \u2014 unlike Menu size and Fullscreen,
which belong to the display.

| key | |
|---|---|
| `padOn` | stick drives a pointer |
| `padButton` | learned play button, or `null` = any |
| `padSpeed`, `padDead` | pointer feel |
| `padAuto` | pushing the stick plays |
| `dwellPad`, `dwellPadMs` | controller dwell |
| `dwellMouse`, `dwellMouseMs` | mouse dwell |
| `bigPointer` | draw the ring for the mouse |
| `keyMap` | **replaced** \u2014 see below |

**`keyMap` changes shape.** Phase 5b stored `{ key: railId }`. A binding can now
be a key *or* a pad button, so it becomes:

```js
SETTINGS.bind = { '<railId>': { type:'key'|'pad', code: '<key>'|<index> } }
```

Keyed by **action**, which is the right way round now that one action has one
trigger and the trigger can be either kind. **Migration:** a stored `keyMap` is
read once and folded into `bind`; an unknown rail id stays inert, which is what a
Drums preset loaded in Flock looks like.

## 9. What this changes from 5a and 5b

- **5a's** *"Use a controller"* is renamed, and its Access rows move into tabs.
  Its pointer, learn step, disconnect-release and "any button plays" all stand.
- **5b's** *"Buttons and keys"* becomes the **Buttons** tab, and gains controller
  buttons as triggers. Its `e.repeat` guard, 250 ms macro guard, focus rule and
  fire-while-locked all stand.
- **5b's `keyMap` is migrated to `bind`** (§8).

## 10. Acceptance criteria

1. Nothing plugged in and no bindings: all 17 apps behave as today, and **21
   pages load clean in Edge *and* Firefox**.
2. Three tabs, the active one visibly attached to its panel, at Menu size 1.0
   and 1.5 with no overflow.
3. Switching tab changes nothing but the view \u2014 a controller still drives while
   the Mouse tab is showing.
4. **Buttons**: a row set by a key fires; a row set by a pad button fires; the
   pad button used **no longer plays a note**, and the *"All except\u2026"* line names
   it.
5. Defaults present on a fresh profile: X clears, Y does the app's main action,
   only where the app has them. **\u2715** clears one.
6. **Controller dwell**: hold the stick still for the set time and it presses;
   the mouse does **not** press while resting.
7. **Mouse dwell**: the reverse. Neither affects touch.
8. Turning on *Pushing the stick plays* replaces the Controller dwell toggle with
   the explanatory line.
9. The Windows cursor is hidden over `#surface` and present over the rail/panel.
10. Everything survives a preset save/load and is absent from the display's keys.
11. A stored `keyMap` from 5b still works after migration.

---

## 11. What the build settled that the design left open

Four things could not be decided on paper, and one is a deliberate departure
from §6. All were verified by driving the pages — see §12.

### 11.1 What dwell DOES when it fires — a CLICK, corrected 2026-08-30

The design said dwell "presses" and stopped there. **The first build made it a
press-and-hold released by the next movement, and the user's UAT rejected that:**

> *"dwell click is a long press that doesn't end until the next movement … it's
> also possible to move slowly and the circle remains full after a dwell click"*

Both symptoms are one fault. A press with no life of its own is a note that never
ends unless the student moves — and a student who needs dwell is exactly the one
who may not move again for a while. The ring, drawn solid while down, then sat
filled where it had gone off.

**A dwell is now a click.** It presses, holds for `DWELL_CLICK_MS` (250 ms — long
enough for the envelope to open and be heard, short enough to be one note), and
**lets go on its own with nothing having to move**. Moving before that ends it
early, so it still never glides into the next cell.

**One click per arrival.** Only movement re-arms it, so resting on a note does not
machine-gun it, and the ring goes quiet after firing instead of sitting full.

### 11.1a When the count starts — corrected 2026-08-30

> *"The dwell timer starts when moving with the mouse but should only start when
> you stop."*

Correct, and the cause was the jitter allowance. It was **2% of the shorter side**
— 14–21px on the screens this runs on — which is wider than an ordinary slow mouse
move, so the timer was never reset and the ring filled *while the hand was still
moving*. It is a jitter allowance for a head-pointer or eye-gaze, not a movement
threshold, so it is now **6px, absolute** (`DWELL_JITTER_PX`): anything a hand does
deliberately restarts the count.

It is measured from an **anchor**, not from the last sample. A creep too slow to
trip on any single move still adds up and trips, which is what stops a slow drag
quietly completing a dwell. Verified: 40 steps of 8px over ~1.9 s with the dwell
set to 1.5 s never fills the ring past a third and never fires.

**The controller uses stick DEFLECTION, not cursor movement.** At the edge of the
surface the cursor stops dead while the stick is still pushed, and firing a dwell
press there would be exactly wrong. That half was right in the first build and the
user confirmed the controller works; only the click/hold change above touched it.

### 11.1b The range — raised 2026-08-30

`Hold for` ran 0.3–2.5 s. The user asked for a higher ceiling: a student who needs
dwell at all may need several seconds to settle, and a range that stops short of
what they need is a control that cannot do its job. It now runs **0.4–6.0 s**, and
the default moves from 0.9 s to **1.2 s**. A stored value from the first build is
inside the new range, so nothing has to be clamped.

### 11.2 A dwell must not fire before anyone has touched anything

A controller connected with dwell already on would otherwise sound a note at the
centre of the screen on its own, a few seconds after the page loaded. Both
devices carry an `everMoved` flag: **dwell cannot arm until the device has been
moved once.**

### 11.3 "Only where the app has that action" — found by NAME, not by declaration

X → Clear is the rail id `clear`, which only five apps have (`hideRail:['clear']`
removes it from the other twelve). Y → the main action is **the first rail action
whose name matches Play / Pause / Restart**, read through the same label → title
→ id fallback the Buttons rows use. No app declares anything, which is the
principle the phase rests on. Measured across all 17:

| gets X → Clear | fluid_sensory, fluid_paint, flock, slime, life |
| gets Y → main | drums (Play), song_grid (Play), big_switch (Restart), echo_bird (Play), beat_builder (Play), conductor (Restart), life (Play) |
| gets neither | strummer, sweep_chimes, sampler (Edit), bubbles, soundscape (Wind down), voice_visuals (Mic) |

Drums is the case worth naming: its rail is `Edit, Record, Play, Undo`, and Y
lands on **Play**, not on the first button.

### 11.4 `bind:null` is what "never set up" means

§8 said `keyMap` is *replaced*, but not how a fresh profile is told apart from
one where the therapist has cleared every row with ✕. `bind` defaults to **null**,
not `{}`: null seeds the X/Y defaults, `{}` is honoured and never re-seeded. So
**✕ is undoable per action and it sticks** — a cleared X does not come back on
the next reload. `migrateBind()` runs on load, on **every preset load** and on
**Reset**, because each of those three can hand the framework a 5b-shaped blob.

### 11.5 DEPARTURE from §6 — the arrow does not vanish while the pad drives

§6 says `#surface` gets `cursor:none` "while a drawn cursor is in play". Taken
literally that hides the therapist's arrow over the activity whenever a student's
stick is driving, **even though nothing is drawn in its place for the mouse** —
they would be left with no visible pointer at all on the half of the screen they
most need to point at.

The complaint §6 exists to fix is sharper than that: on a projector, the bad half
is an **abandoned** arrow, sitting where it was left while a ring moves. So:

- **A mouse ring is drawn** (`bigPointer` or `dwellMouse`) → the arrow goes at
  once. Something is drawn in its place; that is the whole rule.
- **Only a pad cursor is in play** → the arrow goes after **2.5 s of the mouse
  not moving**, and comes back the instant it does. The abandoned arrow
  disappears; the therapist's arrow never does.
- **Never over the rail or the panel** in either case — those are siblings of
  `#surface`, so the rule cannot reach them by construction.

**This is the one place the build overrides an agreed design, and it is the
user's call to reverse.** Reverting is one line: drop the `Date.now()-mouseMovedAt`
term from `hide` in `pollMouseDwell`.

### 11.6 Two smaller judgements

- **The "All except…" line is only shown when "Any button" is selected.** With
  one chosen play button there is nothing to except — only that button was
  playing anyway, and the line would be answering a question nobody asked.
- **Taking a button that already has a job moves it, in both directions.**
  Binding an action to the button currently set as *Which button plays* resets
  that back to "Any button"; learning a play button that already has an action
  clears the action. One physical button, one job — the rule 5b already used for
  keys, applied to the play button as well.

### 11.7 A modal owns the screen — corrected 2026-08-30 (UAT round 2)

> *"All works except when there is an overlay pane e.g. edit in drums. the cursor
> moves around behind on the drums canvas. I'm not sure we want to overcomplicate
> and have the cursor on the overlay pane."*

**The instinct is right, and there is a second fault underneath it.**

**The pointer cannot drive a dialog, and should not be made to.** `pollPads` calls
`onDown(id, x, y)` straight into the note engine in canvas layout coordinates; it
never dispatches a DOM event. That is what lets it work in all 17 apps without any
of them knowing a gamepad exists, and it is also why it can click nothing — not the
rail, not a settings pane, not an app's editor. Giving it DOM reach is not a tweak
but a second mechanism: hit-testing, focus, sliders, scrolling inside a card, and a
way to dismiss — and every app's dialog would have to cooperate. That is precisely
the shape that killed Phase 2's switch access. **Rejected.**

**What is wrong is not that the pointer misses the dialog, but that it keeps
operating the activity behind it.** Measured, not assumed:

| what | measured |
|---|---|
| Drums editor open on Pad 2, stick pushed right, press | the dialog **retargeted to Pad 4** — the student swapped the pane the therapist was working in |
| The framework's own colour modal (`clrOv`) in `life` and `song_grid` | notes sounded behind it, `soundingVoices` 1 → 2 |
| The therapist's mouse dwell, same modals | already correct — `mouseSt.over` goes false |

So this is **not a Drums problem**. `clrOv` is reached from `Background colour` on
the Visuals pane, which is most of the suite. And the mouse half already gets it
right for free, because its dwell is gated on `canvas` `mouseenter`/`mouseleave`;
only the pad pointer, which injects coordinates rather than reading events, walks
through. Both dialogs carry a comment saying they sit on the body *so that a tap
behind them cannot do something else*. The stick is a tap behind them.

#### The rule

**A modal stops the pointer; it does not stop the buttons.**

- **The pointer is WHERE**, and while a modal is up the modal owns the screen.
- **A button is WHEN** — the student's own voice, on their own device. It already
  survives the session lock (§4, `fireAction`), for the same reason: a therapist
  opening a colour picker should not mute the student any more than locking the
  chrome does. The keyboard half needs nothing: `keydown` already returns early on
  `INPUT`, `TEXTAREA` and `contenteditable`, which is what keeps the Sampler
  dialog's label field safe.

`pollPads` already gathers button edges and fires bound actions **before** the
`padOn` gate, so the split falls exactly where the loop is already divided. The
gate is one added branch, not a restructure.

#### Suspend, not release

`padRelease()` nulls `padSt[i]`, so the pointer would come back **at the centre of
the canvas** when the modal closed. For a student who takes a long time to aim —
the student dwell exists for — losing their aim because a therapist opened a picker
is a real cost. So a modal **suspends**: the note is lifted, the ring hidden, and
the dwell counters zeroed so nothing fires the instant the modal closes, but the
position survives and the pointer resumes where it was left.

`padPrev` is deliberately **not** cleared. It is refreshed every frame above the
gate, so clearing it would make a button still held across the modal's life read as
a fresh rising edge and fire its action on close.

#### Lifecycle of a modal

| | |
|---|---|
| **opened** | every live pad pointer suspends: note up, ring hidden, counters zeroed, position kept |
| **closed** | the pointer resumes at its old position; a stick still deflected presses again at once, and a dwell restarts its count from zero |
| **two open at once** | the rule is a **count, not an identity** — `clrOv` (z-70) can sit over an app editor (z-60), and the pointer stays suspended until the last one goes |
| **removed while the pointer is down** | cannot strand a voice: suspending calls `onUp` first, and `fitSurface()` is then free to re-scale, which it refuses to do while a pointer is down |
| **an app adds a new one** | it opts in with `class="modal"`; forgetting the class degrades to today's behaviour, which is the safe direction to fail |
| **replaced** | a dialog that rebuilds its own card (`buildDlgBody`) never removes the overlay, so the suspension holds across a rebuild |

#### Why a class and not a registry

An `openModal()`/`closeModal()` counter is more precise and fails worse: one missed
`closeModal()` leaves the student's pointer **dead forever**, silently. A missing
class leaves it exactly as it is today. Detecting "any unexpected child of `body`"
needs no cooperation at all but would let a browser extension kill the pointer.

There are **three** modals in the whole suite — `clrOv` (framework), `dpOv` (Drums),
`smOv` (Sampler) — the same three CLAUDE.md names as the deliberate exception to
`stageEl`. The class makes that set explicit in the code instead of folklore.

#### What did NOT need changing

The system arrow is already correct over a modal: `body.nocursor` only styles
`#surface`, and a body-level modal is a sibling of `#surface`, so §11.5's rule
cannot reach it by construction — the same sentence that already covers the rail
and the panel. Verified rather than assumed.

## 12. How it was verified

Driven, not read. All three suites are in the session scratchpad and were run
against the real pages from `file://`.

- **Load gate — 21/21 clean in Edge and 21/21 in Firefox**: 0 `pageerror`,
  0 `console.error`, 0 failed requests.
- **Behaviour — 84/84** (41 at the first build, 9 added for the 2026-08-30 dwell
  corrections, and 34 for the §11.7 modal rule: the ring filling only while stopped, the press ending with nothing
  moving, the ring not left full, resting not repeating, movement re-arming, and a
  40-step slow creep past the dwell time firing nothing; then, for the modal rule,
  the Drums editor **not** retargeting under a driven stick, the pointer neither
  drifting nor pressing behind it, the ring hidden, the arrow kept, the position
  resuming off-centre rather than re-centring, no note stranded at +5 s and no
  pointer left down, the colour modal silent under a pushed stick in `life`,
  `song_grid` and `flock`, a bound button **still** firing while a modal is up, a
  button *held* across the modal's life not re-firing on close, and a 12-check
  regression that the no-modal path — stick, ring, controller dwell travelling
  silent and letting go on its own, and mouse dwell — is untouched), with a fake
  standard-mapping gamepad installed before
  page script so the controller half is exercised for real: the seeding table in
  §11.3 across all 17 apps; the three tabs and a controller still driving while
  the Mouse tab shows; a key learned, shown and fired; a pad button learned,
  shown, fired, **not playing a note**, with an unbound button still playing and
  the "All except Left bumper" line naming it; ✕ clearing one binding and it
  staying cleared through a reload; a 5b `keyMap` migrating and its key still
  firing; mouse dwell pressing, releasing on movement, and silent when off;
  controller dwell pressing on rest with **travel silent** and **the therapist's
  resting mouse untouched**; `padAuto` replacing the dwell toggle with the line
  and genuinely not pressing; the ring drawn on `#surface` and the arrow hidden
  only there; a preset carrying all eleven access keys and neither `uiScale` nor
  `locked`; a 5b-era preset migrating on load; Reset re-seeding X and Y and
  leaving no pointer held.
- **Layout — 108/108**, at Menu size **0.8, 1.0 and 1.5** on **1920×1080 and
  1366×768**, for each of the three tabs: tabs on one row (never wrapped), no
  label clipped, no sideways scroll on the tab row, the panel or the page, and
  the active chip flush on the panel to within 3px. At 1.5 on 1366×768 the rail
  fit steps the scale to 1.05, exactly as it already did.
- **The dwell countdown** was confirmed on screen: the ring fills while arming,
  and the fill is cleared the moment it presses so the solid "down" state is not
  drawn over a half-full clock.

**Tested on real hardware 2026-08-30.** Everything above was driven through a
faked `navigator.getGamepads` — the same surface a real controller arrives on, but
not a real one. The gap that left was named in every doc from 5a onwards, and the
user closed it at UAT round 3: **a real Xbox Adaptive Controller was tested and
works.** Nothing in the pad path is assumed any more.
