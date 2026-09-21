# Phase 7 — a reach area: put the activity where the student can reach it

**Status:** designed and built 2026-08-31, **UAT-passed 2026-08-31** with one
change asked for from the projector: the surround goes **black** under a reach
area (§5.2).
**Trigger:** three at once. It touches `framework.js`, which all 17 apps see; it
changes `fitSurface()`, which is part of how a pointer becomes a note; and it
adds keys to what is stored per student. `CLAUDE.md` names each of those
separately as a reason to write this before any code.

Raised by the user on **2026-08-25** after seeing the scaled stage working,
parked on purpose as Phase 5 of `IMPROVEMENT-PLAN.md`, and asked for again on
**2026-08-31**: *"scale the canvas and move the position — the touch projector
is very large and reducing the size would help an individual access it."*

---

## 1. What this is, and who it is for

On a projector the activity fills a wall. A student in a wheelchair can reach
one part of that wall — often low, often to one side — and the rest of it might
as well not be there. Today the only answers are to move the projector or to
move the student.

A **reach area** shrinks the whole activity and puts it inside a rectangle the
student can actually reach. Nothing is cropped and nothing is re-designed: the
activity is *mapped into* the rectangle, so every note, every pad and every
corner is still there, just smaller and somewhere else.

The user's first instinct in August was to lock the menu and blank part of the
screen. That is the weaker form of the same idea, and it is worth saying why:
blanking wastes the projector **and** crops the activity, so the student loses
the parts they cannot reach instead of gaining them.

---

## 2. Why it is small: the machinery already exists

`fitSurface()` (`framework.js:2718`) already computes **exactly the three
numbers this needs** — a scale `k` and an offset `tx, ty` — and hardcodes them
to "the biggest that fits, centred". A reach area is those same three numbers
with a different answer.

Two things then follow for free:

- **Input needs no work.** Every pointer goes through `toLocal()`
  (`framework.js:1073`), which converts client coordinates via
  `canvas.getBoundingClientRect()` — the *on-screen* rect — and divides by the
  layout size. That form was written in Phase 3c precisely so it would survive
  the surface being scaled, and it survives being offset for the same reason.
  There are only two `getBoundingClientRect()` calls in the whole framework and
  both are already correct.
- **No app has to cooperate.** All 17 get it identically. This is the whole
  argument for building it: Phase 2's switch access needed `switchTargets()` in
  every app, each one felt different, and it was removed. **An accessibility
  feature that lives in the framework's geometry survives; one that needs every
  app to cooperate does not.**

The driven pointer is unaffected. The gamepad cursor lives in **canvas layout
coordinates** (`framework.js:1126`), which is the space behind the transform —
so a stick still traverses the whole activity at whatever size it is drawn.

---

## 3. The transform

Let `r` be the stage slot's rect, `w × h` the surface's layout size (always
`100vw × 100vh`), and `kFit = min(r.w/w, r.h/h)` — today's answer.

```
k  = kFit * reachSize
tx = reachX * r.width  - w*k/2        // reachX,reachY place the CENTRE
ty = reachY * r.height - h*k/2
tx = clamp(tx, 0, r.width  - w*k)     // never off the slot
ty = clamp(ty, 0, r.height - h*k)
```

**At the defaults `reachSize = 1, reachX = reachY = 0.5` this is arithmetically
identical to today's `tx = (r.width - w*k)/2`.** An install that never touches
the feature gets the same transform string it got before, so `lastFit` caches
the same way and nothing re-renders.

**Aspect ratio is preserved.** `k` is a single scalar, never a pair. The
rectangle is a *bounding box*, not a stretch: Song Grid's cells stay square and
the sensory apps' circles stay circles.

**The centre, not the corner, is what is stored.** Changing the size then grows
and shrinks the activity about the point the therapist aimed at, which is the
gesture that matches "make it smaller, right there". Storing a corner would
make every size change also a move.

### 3.1 Relative to the stage slot, not the viewport

The truer thing would be a rectangle fixed on the *wall*, unmoved by a settings
pane opening. It is rejected because `#stage` is a flex sibling of the rail and
the strip with `overflow:hidden`, so viewport-relative placement means either
clipping the activity or restructuring the shell into an overlay — a large
change to the one file all 17 apps depend on.

It is rejected cheaply, because **locked, the slot *is* the viewport.** Locked
is the only state a student ever plays in. So slot-relative is exactly right
where it matters, and merely behaves like today (the activity shifts as the
chrome opens) while a therapist is dialling it in.

---

## 4. It contradicts what Lock means, and Lock gives way

`CLAUDE.md` states **"Locked is pixel-perfect. Chrome collapsed means scale
exactly 1. A student never sees a resampled image."** A reach area is the
deliberate exception, agreed with the user on 2026-08-31, and the rule now
reads:

> **Locked is pixel-perfect at the default reach area.** Chrome collapsed with
> `reachSize = 1` means scale exactly 1. A reach area is the one thing that may
> scale a locked session, because a smaller activity a student can reach beats a
> crisper one they cannot.

Nothing in `applyLock()` changes. Collapsing the chrome hands the rail's and the
strip's width back to the slot; `fitSurface()` recomputes from the larger `r`
on the next frame and honours the same three fractions. The reach area survives
lock because it was never expressed in pixels.

The resampling cost is real and small: the canvas backing store is still sized
from `canvas.clientWidth * dpr` (`sizeCanvas()`), which is the unchanged layout
width, so a reach area **downsamples** a full-resolution image rather than
magnifying a small one.

---

## 5. How it is set: a size slider and a drag

Three number fields would be simple to build and wrong to use. The therapist is
standing next to a student looking at a wall, not at a laptop, and "X = 0.72"
is not a thing anyone can aim.

- **Size** — one slider, 25 %–100 %, on `Setup → Reach area`.
- **Place it** — a toggle. While it is on, dragging **on the activity moves it**
  instead of playing. Mouse or touch, whichever the room has; a therapist across
  the room from a projector drags with the mouse and watches the wall.
- **Fill the screen** — one button, always visible, back to 100 % centred.

While Place it is on, a dashed rectangle is drawn **on the stage slot, not on
the surface** — an outline inside the surface would be scaled down with
everything else and at 30 % would be a third of a pixel wide.

### 5.1 Why the drag is a separate overlay

Place mode puts `#placeOv` — a plain `position:absolute; inset:0` child of
`#stage` — above the surface. It swallows the drag entirely, so:

- **no note can sound while placing.** The framework's pointer path is never
  entered, rather than entered and then suppressed; there is no state to get
  stuck in and nothing for `onUp` to miss.
- **the drag arrives in slot pixels**, the same space `fitSurface()` works in,
  so the delta is `dx / r.width` with no inverse transform anywhere.
- **`fitSurface()` is free to run during the drag.** It bails while
  `pointers.length` is non-zero — the non-negotiable that stops a re-scale under
  a hand — and a place drag deliberately registers no framework pointer, so the
  activity follows the finger live. This is safe for the reason the guard
  exists: that guard protects a *student's* touch from being moved out from
  under it mid-note, and in place mode there is no note.

The overlay is torn down whenever the toggle goes off, the Setup pane closes, a
preset is applied, or the session locks. Place mode is not a setting and never
rides in a preset — it is where the therapist is, not something about the
student. Same rule as `accessTab`.

### 5.2 The surround goes black under a reach area

Added after the UAT, on the user's judgement from the projector itself. Phase 3c
paints the space beside a scaled activity a **step off the app's own background**
(`surroundOf()`, a 12 % mix toward the opposite end), so the activity's edge is
visible without a line drawn round it. Under a reach area that space is **most of
a wall**, and lighting it a soft grey is light spilled into a sensory room for no
purpose.

The two cases want opposite things, and **the difference is who is looking**:

| | who sees it | what it should be |
|---|---|---|
| no reach area | the therapist, while the chrome is open | a step off the background — the edge cue Phase 3c measured |
| a reach area | the **student**, and it is a wall | **black** |

`reachSize < 1` is the switch. Crossing 100 % on the slider visibly turns the
rest of the wall off, which is a fair description of what a reach area does.

**It is driven from `fitSurface()`, not from the controls that change the
setting.** That is the whole point of putting it there: `fitSurface()` is already
the one function that reads `reachSize`, so no call site can forget to repaint
and leave a stale surround behind. It fires once per crossing, not per frame, and
starts from `null` so the first frame syncs whatever order boot ran in. The first
cut did wire it to the slider and to Fill the screen, and a screenshot taken
through neither of them showed exactly the stale grey that approach invites.

---

## 6. Cardinality and storage

| key | scope | survives a page load | rides in a preset | in a launch link |
|---|---|---|---|---|
| `reachSize` | one per **app file**, for this **session** | **no** | yes | yes |
| `reachX` | one per **app file**, for this **session** | **no** | yes | yes |
| `reachY` | one per **app file**, for this **session** | **no** | yes | yes |

### 6.1 A reach area never survives a page load

**Added after the UAT, and it corrects this section's first answer.** The user
raised the case: one therapist sets a reach area and leaves; the next therapist
launches a link for a different student, and that student gets a quarter-size
activity in a corner, **locked**, with no menu and no explanation.

The first cut put the three keys in `LAUNCH_KEEP` on the argument that a reach
area is "as much a fact about a student's body as `padDead` is". **That analogy
is wrong twice over:**

- **`padOn` describes a student; a reach area describes where their chair is
  today.** One is true of the same person next week. The other is true of nobody
  by Wednesday. It is the only setting in the blob of that kind.
- **The failure directions are not symmetric.** A launch that resets a switch
  leaves a student unable to play — silent, and the reason `LAUNCH_KEEP` exists.
  A launch that resets a reach area leaves a full-wall activity, which is what
  every session looked like before this feature existed and which anyone can at
  least see. **Forgetting one costs a therapist ten seconds. Inheriting one costs
  a student the session** — and the student it is wrong for is very often the
  student who cannot say so.

So the three keys came **off** `LAUNCH_KEEP`, and `initSettings()` resets them to
`1, 0.5, 0.5` on every load, before the link is read. **Inheriting a reach area
by accident is now impossible.** Nothing that *asks* for one loses it:

| how a session begins | what it gets |
|---|---|
| the app opened fresh | full screen |
| `?s=voice:synth&lock=1` — a link that says nothing about it | full screen |
| `?s=reachSize:0.35,reachX:0.9&lock=1` | **that reach area**, and the boot toast says `· reach area 35%` |
| a preset loaded | the preset's reach area |

**This makes the launch link the way to give a student their reach area**, which
is the room PC's whole job. `🔗 Copy launch link` now carries it, so a therapist
sets a student up once, copies the link, and the control software reproduces it —
including where on the wall the activity goes.

The cost, stated plainly: **a reload loses a reach area you have not saved.** That
is the right way round. Redoing it is one drag; the alternative is a screen a
student cannot use and cannot report.

**Three scalars, not one object**, because a value that is one number per key can
be read, clamped and compared without a shape to get wrong — and because
`encodeSettings()` refuses outright to put an object anywhere near a link
(`String({})` is `"[object Object]"`, which decodes back to nothing).

They go in `SHARED_DEFAULTS`, so they are keyed `settings:<file>.html` like
every other student setting, and the preset snapshot's
`Object.assign({},SETTINGS)` picks them up with no preset code changed at all.

**They are deliberately NOT in `LAUNCH_KEEP`** — see §6.1 for why that was the
second answer and not the first.

Found while getting there, and fixed on this branch: the comment above
`LAUNCH_KEEP` claimed *"a link that NAMES one of these still sets it"*.
`applySettingsParam()` has never done that — it declines the key outright. This
phase's probe believed the comment and failed, which is how it was found. The
behaviour is right and the **comment** was wrong. Worth noting as a class: a
comment can be wrong for months in a file with no tests, and only a probe that
acts on it will say so.

**Not a global key like `ui-scale`.** Storing the access settings globally so
they need setting once rather than seventeen times was offered to the user twice
and declined twice (`IMPROVEMENT-PLAN.md:369`). This follows the settled
decision rather than reopening it for one setting. The consequence is honest and
should be said out loud: **switching app mid-session loses the reach area**, the
same way it already loses the dwell and the stick setup, and the answer is the
same as it is for those — a preset, or a launch link that names it.

---

## 7. Lifecycle

- **Added.** Defaults are `1, 0.5, 0.5`, which is today's behaviour exactly. An
  existing saved blob has none of the three keys; `SHARED_DEFAULTS` supplies
  them on load, so every install upgrades silently and nothing migrates.
- **A new session.** Every page load starts at `1, 0.5, 0.5` whatever is stored,
  unless a launch link or a preset says otherwise — §6.1. This is the lifecycle
  row the first draft did not have, and its absence was the fault.
- **Changed.** Size and position are independent. Size grows and shrinks about
  the stored centre; the clamp then pulls the rectangle back inside the slot, so
  enlarging a corner-placed activity walks its centre toward the middle rather
  than pushing half of it off screen.
- **Replaced.** Loading a preset overwrites all three. A preset saved *before*
  this phase existed carries none of the keys — and because `applyPreset`
  rebuilds `SETTINGS` from `SHARED_DEFAULTS` rather than merging into the live
  one, an old preset **resets the reach area to 100 % centred**. Checked in the
  code rather than assumed, because it is exactly the difference between "the
  last student's reach area silently persists into the next student's preset"
  and "it does not". It does not, and that is the safer of the two.
- **Removed.** There is no "off". `reachSize = 1` centred *is* off, and it is
  one button away.
- **Two of them in conflict.** Two students in one session is two presets, and
  the second load wins, as it already does for every other setting.
- **The display changes.** All three are fractions of the slot, so a resolution
  change, a rotation, or plugging in a different projector re-derives the
  rectangle in the new geometry with nothing stored to become stale.
- **The chrome opens or closes.** `r` changes, the fractions do not, the
  activity is re-placed within the new slot. No app is told anything; nothing is
  re-laid-out; nothing a student has painted is lost.

---

## 8. The floor: a room must not be left unusable

Four independent guards, because the failure this must not have is a student who
cannot reach the activity and cannot say so.

1. **`reachSize` is clamped to 0.25–1.** Clamped on read as well as write, the
   way `uiScale` is, so a hand-edited or launch-supplied value cannot get past
   it. A quarter of a 1920-wide projection is still 480 px wide.
2. **It can never be off screen.** The `tx, ty` clamp is applied on every frame
   in `fitSurface()`, not once when it is set, so it is also true after a
   resolution change.
3. **The unlock corner is untouched.** `#unlockZone` is on the **body**, outside
   `#surface` and outside the transform — the top-left of the *screen*,
   whatever the reach area is doing. The three-second hold out of a locked
   session works exactly as before.
4. **Fill the screen** is a permanent button on the Setup pane, not hidden
   behind Place it, and `↺ Defaults` resets it too.

---

## 9. What is deliberately not in this phase

- **Per-app-independent storage.** §6. Declined twice already.
- **A rotation.** A reach area is an axis-aligned rectangle. A wheelchair tray
  at an angle is a real thing, and a rotated transform would need its own
  measurement against the "map first, act second" rule in `toLocal`.
- **Two reach areas.** One activity, one rectangle. Two students side by side at
  one projector is a different feature.
- **Anything on the launcher.** `index.html` does not load the framework.

---

## 10. Acceptance

1. All 21 pages load clean from `file://` — 0 `pageerror`, 0 `console.error`,
   0 failed requests.
2. At the defaults, the transform string is identical to the one produced before
   this change, in an app with the chrome open and with it closed.
3. With a reach area set, a tap inside the activity plays **the note under the
   finger** — verified against a grid app where the answer is checkable, at more
   than one size and more than one position.
4. A tap outside the activity plays nothing.
5. The reach area survives Lock, and survives the chrome opening and closing,
   without the activity being re-laid-out or anything painted being lost.
6. Size cannot go below 25 %, and no size or position puts any part of the
   activity off the slot.
7. Place it moves the activity and sounds no note; switching it off returns the
   drag to playing.
8. A preset saves and restores all three; `↺ Defaults` returns to 100 % centred.
9. **The handover.** A reach area left on the machine by one session never
   reaches the next: not through a launch link that does not mention it, and not
   through the app simply being opened again.
10. A launch link that **does** name one gets it, the boot toast says so, and a
   link value is still held to the 25 % floor.
11. `🔗 Copy launch link` carries a reach area, and that link round-trips.
