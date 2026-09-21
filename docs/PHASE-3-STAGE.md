# Phase 3 — solid chrome, and a play surface that resizes

**Status: BUILT and UAT-passed 2026-08-25**, shipped as Phase 3b/3c — see
`IMPROVEMENT-PLAN.md` §"Phase 3b/3c" and the "What UAT changed" section below.
Written as a design on 2026-08-24; this line read *"not yet built"* until
2026-08-30, long after it shipped.

Replaces the deferred "part d" of `IMPROVEMENT-PLAN.md` §2, brought forward at
the user's request. **Phase 2 (switch / XAC access) is removed** — see §7.

---

## 1. What changes

**Today** the chrome floats. `#ui` is `position:fixed` over a canvas that fills
the viewport, and opening a settings pane drops a 460px translucent panel *on top
of the activity*. The rail sits at 50% opacity over the art until touched.

**After**, the rail and the settings strip are solid columns in a row, and the
play surface is what is left. Nothing ever covers the activity.

```
            NOW                                  AFTER
  ┌──────────────────────────┐        ┌────┬──────────────────┐
  │▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░│        │    │                  │
  │▓rail  ┌──────────┐░░░░░░░│        │rail│    activity      │
  │▓▓▓▓   │  panel   │░░░░░░░│        │ ▣  │                  │
  │▓▓▓▓   │ (floats) │░░░░░░░│        │ ▣  │                  │
  │▓▓▓▓   └──────────┘░░░░░░░│        │ ▣  │                  │
  └──────────────────────────┘        └────┴──────────────────┘
   canvas is the whole viewport         canvas is the remainder

        STRIP OPEN                          LOCKED (student)
  ┌────┬────────┬────────────┐        ┌───────────────────────┐
  │rail│ strip  │  activity  │        │                       │
  │ ▣  │ Sound  │ (narrower) │        │       activity        │
  │ ▣  │ ▭ ▭ ▭  │            │        │     (full screen)     │
  └────┴────────┴────────────┘        └───────────────────────┘
```

**Settled with the user, 2026-08-24:** the rail **always takes its width**. Lock
is the full-screen path — it already hides all chrome, and it matches what
therapists do anyway: set it up, lock it, hand it over. The rejected alternative
was a rail that auto-hides when untouched; that would reflow the activity under a
student's hand mid-play, which is worse than losing 88px during setup.

## 2. The mechanism — why this is affordable

Two facts make the difference between a rewrite and a contained change.

**Input needs no work at all.** `toSim()` (`framework.js:702`) already divides by
`canvas.clientWidth/Height`, and the touch handlers already use
`canvas.getBoundingClientRect()`. Inset the canvas in CSS and every pointer maps
correctly with **zero** changes to the input path. This was the part that looked
most dangerous and it is free.

**A `#stage` wrapper re-anchors the apps' own DOM.** Eleven apps append
`position:fixed` elements to `document.body` — progress bars, Strummer's chord
bar, Soundscape's mixer strip, Echo Bird's bird — all anchored to the *viewport*.
Inset the canvas and they would sit under the rail.

The lever: **an element with a `transform` (or `contain:paint`) becomes the
containing block for its `position:fixed` descendants.** So a `#stage` that wraps
the canvas and carries `transform:translateZ(0)` makes `inset:0` mean "fill the
stage" and `top:0;left:0` mean "the stage's corner" — for free, in the app's
existing CSS.

That turns rewriting eleven apps' layout into **19 one-line edits**:
`document.body.appendChild(x)` → `stage.appendChild(x)`. Mechanical, greppable,
verifiable.

### New DOM shape

```
body
 ├─ #shell            fixed, inset:0, display:flex          ← new
 │   ├─ #rail         solid column, --rail-w
 │   ├─ #strip        solid column, 0 or --strip-w          ← was #panel (overlay)
 │   └─ #stage        flex:1, transform:translateZ(0)       ← new
 │        ├─ canvas
 │        ├─ #bands
 │        └─ …app-owned fixed DOM re-parented here
 ├─ #unlockZone, #lockHint, #stats
 └─ modals: #clrOv, #dpOv, #smOv                            ← stay on body, see §4
```

## 3. Lifecycle

Required by the design discipline in `SR1/CLAUDE.md`. The thing being modelled is
**the stage's size**, and every event that changes it.

| Event | Behaviour |
|---|---|
| **Strip opens** (a rail group is tapped) | Stage narrows by `--strip-w`. `Anim.resize(w,h)` fires. The activity reflows — this is the point of the change, and it happens while a *therapist* is driving, not a student. |
| **Strip closes** (same group tapped again, or the play surface is touched) | Stage widens back. The existing "touching the play surface closes any open panel" behaviour (`onDown`) is kept, so handing over is still one tap. |
| **Lock** | Chrome collapses to zero width; stage fills the viewport. |
| **Unlock** | Chrome returns; stage narrows. |
| **Control size changes** | Rail and strip widths are `--ui-scale`-derived, so the stage resizes. Already handled by the resize path. |
| **Window resizes** | As now. The existing DPR/`Anim.resize` path keys off `canvas.clientWidth`, which is now the stage's width. |
| **Two size changes at once** (e.g. lock while the strip is open) | Lock wins and closes the strip first — one resize, not two. |
| **An app adds fixed DOM after boot** | It must be appended to the stage, not the body. A framework helper (`stageEl`) is exported so apps have one obvious thing to reach for. |
| **A modal opens** | Stays on `body`, covering everything including the rail. See §4. |

**Cardinality.** One stage per page. One strip, showing **one** group at a time
(unchanged). The rail is the only always-present chrome.

## 4. The three judgement calls

- **Modals stay on the body.** Drums' and Sampler's pad editors (`#dpOv`,
  `#smOv`) and the framework colour picker (`#clrOv`) cover the viewport. A modal
  that covers only the play surface, while the rail stays live behind it, is
  worse than one that covers everything — it invites a tap that does something
  else. (Removing modals altogether is a later phase.)
- **Toasts and pills go on the stage** (`#dpRecPill`, `#smToast`): they report on
  the activity, so they belong over it, where the person is looking.
- **`vh`/`vw` stay viewport-relative** even inside the stage. Beat Builder's
  `#bbGrid{left:4vw;right:4vw}` and Echo Bird's `#ebBird{top:1.5vh}` will be
  slightly off inside a narrower stage — *off, not broken*. Fix per app with `%`
  where it shows. **Sizes** in `vh` (font-size, dimensions) are fine and stay.

## 5. Inventory — what actually gets touched

| | Count | Work |
|---|---|---|
| `document.body.appendChild` → stage | **19** across 11 apps | mechanical one-liners |
| `window.innerWidth` read directly | **2** (`drums.html:379`, `soundscape.html:634`) | use the stage's width |
| Apps with `vh`/`vw` **positions** near an edge | ~3 (beat_builder, echo_bird, soundscape) | check, convert to `%` if visibly off |
| Modals left on body | **3** | no change |
| `framework.css` | — | `#shell`/`#stage`/`#strip` layout; `#panel` overlay rules removed |
| `framework.js` | — | injected HTML restructured; `showPanel`/`closePanel` become strip open/close; `applyLock` collapses chrome |

## 6. Risks, and what must be verified

1. **WebGL.** `setupGL()` and the DPR sizing read `canvas.clientWidth`; the
   canvas now changes size more often (every strip open/close). Context-loss
   recovery lives in that path. **Verify:** the four WebGL apps (Fluid Paint,
   Flock, Slime, Fluid Sensory) survive repeated strip toggling.
2. **`transform` on the stage creates a compositing layer.** Could affect canvas
   crispness or performance. `contain:paint` is the alternative and does the same
   job without the layer. **Measure both**, pick on evidence.
3. **Reflow under a hand.** Opening the strip mid-play resizes the activity. Some
   apps rebuild state on `resize()` — Big Switch calls `this.reset()`. **Verify:**
   no app loses a student's work (a Beat Builder pattern, a Sampler recording)
   when the strip opens.
4. **The 1366×768 case.** Rail + strip at Control size 150% could leave very
   little activity. `fitUiScale()` already clamps for rail height; this adds a
   **width** constraint. **Measure**, and extend the fit if needed.
5. **`#bands`** is `position:fixed; inset:0` — must land inside the stage and
   cover exactly the play surface.

## 7. Phase 2 (switch / XAC) is removed

Built and verified on `phase-2-switch-access`, merged nowhere, **dropped at the
user's decision**: the apps are too different for one switch model to feel right
across them, and the same for the controller. The branch is parked so the work is
recoverable, and nothing in this phase builds on it. `phase-3-stage` branches from
`phase-1-ui-tokens`, which contains no switch code.

## 8. Build order

1. `#shell`/`#stage`/`#strip` in CSS + the injected HTML; canvas and `#bands`
   into the stage. **Nothing else.** Verify all 20 pages, input mapping, WebGL.
2. `#panel` → `#strip`: open/close, lock collapses chrome. Verify the lifecycle
   table.
3. The 19 re-parents + 2 `innerWidth` reads, app by app, verifying each.
4. The `vh`/`vw` edge cases, only where visibly off.
5. Sweep: floors, scale 0.8/1.0/1.5 at 1920 and 1366, full baseline.

**Acceptance:** no chrome overlaps the activity in any app; opening a group
narrows the play surface and closing it hands the width back; Lock gives the full
screen; every app's own DOM sits inside the play surface; all 20 pages load clean;
nothing breaks at Control size 150% on 1366×768.

---

## As built

Five build steps, three commits, and every claim below was measured in headless
Edge over all 20 pages rather than reasoned about.

### The three affordances the design counted on all held

1. **Nothing had to be notified about a resize.** `sizeCanvas()` already runs
   *every frame* and compares `canvas.clientWidth` against the backing store, so
   `Anim.resize` fires on the next frame for a strip open, a lock, or a Control
   size change alike. The lifecycle table needed no code of its own.
2. **Input needed no work**, as predicted: `onDown` reads `e.offsetX` and the
   touch path reads `getBoundingClientRect()`, both canvas-relative.
3. **The `transform` lever works.** `#bands` is `position:fixed;inset:0` and
   lands exactly on the stage, untouched — which is what let 18 app-owned
   elements be re-parented as one-line changes.

### The fault that measurement found

`onDown` **closed the open panel before it mapped the touch**. `cx/cy` are
measured against the narrow canvas, closing the strip widens it *synchronously*,
and `toSim` then divided the old offset by the new width. The first touch after
any settings visit landed up to 44% of the screen away and played the wrong
note. It is a one-line reorder — map first, then close — and it could only ever
have existed once the canvas started changing size. Verified after the fix:
0.25,0.25 of the stage maps to 0.25,0.25 with the strip open, closed and locked,
in three apps.

### The second fault, found by the user in UAT: one tap, two notes

Reported as *“there seems to be 2 clicks when a click on the screen. One at the
edge of the open settings panel and another beneath the panel as it disappears”*
— and reproduced exactly: with the strip open, a tap plus the 2px jitter any
real finger makes fired **two note events**, `col 2` then `col 3`, the second one
drawn well to the left of where the finger was.

The cause is the reflow happening **under the hand**. The press closed the strip,
the canvas widened synchronously, and the finger — which had not moved — was now
over a different note zone. `onMove` compared the new column against the stored
one, concluded the touch had crossed into a new zone, and articulated again. The
first fix (map before closing) had made the *first* note right; it could not help
the second, because by then the geometry really had changed.

**The strip now closes on the last finger UP, not on the press.** The whole
gesture then happens in one geometry — correct note, no second articulation, no
visual jump — and the activity reflows only when nothing is on it, which is what
§1 said it wanted in the first place. “Touch the play surface to hand over” is
unchanged to look at: a tap still dismisses the strip.

Verified: one note per tap; the strip stays open while a finger is down, through
a whole drag, and while a second finger is still down after the first lifts; and
it closes on the release in every one of those cases.

> This is the same fault as the first one, one level up, and it is worth naming:
> **a resize that happens while a touch is live is its own hazard**, separate
> from mapping the touch correctly. Anything else that changes the stage's size
> mid-gesture would do the same.

### The risks in §6, answered with numbers

| | Verdict |
|---|---|
| **1. WebGL** | Four WebGL apps survive five strip open/close cycles, `glLost` false, 0 console errors. |
| **2. `transform` vs `contain:paint`** | **No measurable difference** — five apps, three-second samples under a continuous drag: 56.6–57.2 fps either way, identical backing stores. Kept `transform:translateZ(0)` because the tie goes to the one every browser supports; these pages run from a USB stick. |
| **3. Work lost on reflow** | A Beat Builder pattern survives (steps `kick:3,snare:3` before, during and after), and so does the settings blob. **But the painted field does not** — see below. The related hazard, a reflow under a live touch, is the second fault above. |
| **4. 1366×768 at 150%** | **No width clamp needed.** `fitUiScale`'s existing *height* clamp already reduces 1.5 to 1.00–1.20 on a 768-high screen, so the worst play surface measured is **708px of 1366 — 52%**, with the strip open. At 1920×1080 the worst is 1098 of 1920 (57%). |
| **5. `#bands`** | Lands on the stage exactly, in all seven apps that show it. |

### Open, and the user's call: a settings visit clears the painted field

The design asked whether a reflow loses *a student's work*, and named a Beat
Builder pattern and a Sampler recording. Those survive, because they are app
state. What does not survive is **the canvas itself**: six apps route
`resize(w,h){ this.reset(); }`, so opening the strip — and closing it — wipes
what is on screen.

Measured: **Fluid Paint**'s stage screenshot collapses 148,859 → 3,499 bytes,
and **Game of Life** goes from 249 sampled lit pixels to 0. Bubbles likewise.
Slime and Fluid Sensory could not be read this way — they are sims that keep
moving, so the measurement cannot separate “cleared” from “immediately refilled”.
The apps that redraw everything each frame (Drums, Song Grid, Soundscape,
Conductor, Echo Bird, Big Switch) show nothing at all.

This is **new**: before, opening the panel did not resize the canvas, and on a
fixed room screen a window resize never happens. It is not a bug in the port —
it is the cost of the play surface actually changing size, and no amount of
care in the re-parenting avoids it.

**A generic fix does not exist.** Restoring the old pixels after `Anim.resize`
would work for a 2D canvas, but in Game of Life the *grid* is the state and
`reset()` re-seeds it, so the next frame would paint over the restoration. Real
preservation is per-app, and for the WebGL fluid sims it means resizing their
framebuffers rather than dropping them — four apps, days before a hard install.

**Recommended: accept it for the freeze**, and say so in the UAT so the user
judges it with their eyes rather than discovering it in the room. The mitigating
argument is the one the design already makes: settings are a setup-time action,
and Lock — the full-screen path — is how a session is handed over. If the user
finds it jarring, per-app preservation is the follow-up, and it is a phase of
its own.

---

## What UAT changed - the design was half right

The user tested it and reported three things. Together they showed that §1's
central move - **give the chrome its own width and let the activity re-lay-out**
**around it** - was the wrong half of a good idea.

1. *"In Fluid Keys I drag, and when I stop the panel closes and the screen
   clears. Then when I lock the screen clears."*
2. *"In Flock the settings panel seems to be over the top of it and it doesn't
   resize."* It does resize - it just does not clear, so the resize is
   invisible. **The resize is either destructive or invisible, and never right.**
3. *"When the panel is fully open and I click on the screen it closes back to
   the rail. This will be very frustrating if you are experimenting with the
   settings."*

### The tension the design did not see

Resizing the activity clears a student's work in the free-painting half of the
room. **Not** resizing means the strip covers the activity and staff cannot see
what they are adjusting. §1 chose the first; the old overlay chose the second.
Neither is acceptable, and the doc never noticed it had to choose.

### The answer: scale it, do not re-lay-out it

`#stage` is now only the **slot** the activity is given. The activity is
`#surface`, always `100vw x 100vh`, scaled down to fit the slot by
`fitSurface()`. No layout changes, so `Anim.resize` never fires for a settings
visit or a lock, so **nothing an app has drawn is ever lost** - and because it
is scaled rather than cropped, the whole activity stays visible.

The surface being *screen*-sized rather than *slot*-sized is what makes the
scale exactly **1** when the chrome collapses. The state a student actually
sees - a locked session - is drawn at full size, not resampled.

| | scale | measured |
|---|---|---|
| Locked | **1.000** | slot 1280, surface 1280x800 |
| Rail only | 0.931 | slot 1192, surface 1192x745 |
| Strip open | 0.572 | slot 732, surface 732x458 |

Layout and backing store stay 1280x800 throughout. Game of Life ink: 192 before,
192 with the strip open, 192 locked.

### Three consequences worth naming

- **The input path had to become one path.** `e.offsetX` is pre-transform and
  `clientX - rect.left` is not, and `toSim` divides by the layout width, so once
  an ancestor is scaled the two disagree. Both now go through `toLocal()`.
- **The auto-close is gone**, per report 3. It only ever made sense when the
  panel covered the activity. The strip closes from its rail icon; Lock is the
  hand-over. That deleted the close-on-release fix and promoted the hazard
  behind it: `fitSurface()` refuses to re-scale **while any pointer is down**,
  which covers the rail icon tapped with the other hand, Control size and Lock
  as well.
- **The boundary is tone, not a line.** A drawn border worked and was the wrong
  instrument - in a sensory room the activity should be the brightest thing
  asking for attention, and a white rectangle around it competes with what the
  student is meant to look at. The surround is 12% off the therapist's own
  background, toward white from a dark one and toward black from a light one.

  > **Amended by Phase 7, 2026-08-31: this now holds only when the reach area is
  > 100%.** With one set, the surround is **black**. The reasoning here is intact
  > and still governs its own case - the two cases simply have different viewers.
  > This surround is seen by the *therapist*, while the chrome is open, and the
  > tone step is the edge cue they need. A reach area's surround is seen by the
  > *student* and it is most of a projected wall, where a soft grey is light
  > spilled into a sensory room for nothing. `PHASE-7-REACH-AREA.md` §5.2.

### What is left open for the user

Not whether work is lost - that is solved. Two judgements of feel: whether the
activity being ~57% with the strip open is enough to test against, and whether
12% is the right step for the surround. Both are one number.

**Answered 2026-08-31, and by the projector rather than by argument:** 12% is
right where the therapist sees it and wrong where the student does. Phase 7 splits
the two cases instead of retuning the number.
