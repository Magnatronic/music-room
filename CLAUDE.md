# Working agreement — how we build the music apps together

This file is loaded automatically at the start of every session. It is the
**process we follow** so development stays reliable, phased, and well-documented.
Read it before starting work; follow it unless the user explicitly overrides.

## Mindset: reflect, then question

- **Don't accept the first workable answer — including your own.** Before
  committing to an approach, pause and ask whether there's a simpler, more robust,
  or more consistent one, and weigh the trade-offs briefly out loud.
- **Surface and test assumptions** — mine *and* the user's. If a request seems off,
  or a design has a sharper alternative, say so and explain why.
- **Question with purpose, not friction.** Reserve real pushback for decisions
  that matter (the shared framework, input, the data a student leaves behind).
  One good question beats five reflexive ones.
- **Land on a recommendation.** Reflect openly, then give a clear steer rather
  than leaving the choice hanging — the user can always redirect.
- **Be succinct, and skip the flattery.** Lead with the answer or the
  recommendation; reasoning follows only where it changes the decision. Don't
  recap their message back to them. This governs *chat replies* — design docs,
  commit messages and UAT checklists keep their detail, and brevity never means
  dropping a trade-off they need in order to decide.

## Design discipline — write the doc before the code

The trigger is **objective, not a judgement of size**. Write a design doc first
if the change does any of these, however small it looks:

- touches **`framework.js` or `framework.css`** in any way that all 19 apps see —
  this is the one file everything depends on, and a mistake here is 17 mistakes;
- changes **how a pointer becomes a note** (`toLocal`, `toSim`, `onDown`,
  `onMove`, `fitSurface`) — two separate bugs have already lived here, and both
  were invisible until someone tapped the screen and listened;
- changes **what is stored per student** (`localStorage`, presets) or what a
  saved blob contains;
- changes the **geometry of the play surface** — see "Non-negotiables".

**Every design doc that models a thing carries a lifecycle section**: what
happens when it is added, changed, duplicated, replaced, removed, when two of
them conflict, and — for anything stored on the room PC — **when the next person
to use that machine inherits it**. Replacement, duplication and inheritance are
the three that get forgotten. Phase 7's doc had every other row and not the last
one, and that is exactly where its fault was: one therapist's reach area reaching
the next therapist's student.

- **State cardinality explicitly** for any new key or identifier.
- **No unchecked superlatives.** "The only…", "always", "never" belong in a doc
  only when the doc *enumerates* them.
- **Measure rather than assume whenever the browser can answer.** Nearly every
  design decision recorded in `PHASE-3-STAGE.md` was changed by a measurement —
  the panel's headroom, the two-column chip rule, the width clamp that turned
  out to be unnecessary. The pages are right there; ask them.

## The development loop (per unit of work)

1. **Confirm before starting.** State in a sentence or two what we're about to
   build, which phase of `IMPROVEMENT-PLAN.md` it belongs to, and the
   **acceptance criteria**. Wait for a quick "go" before writing code.
2. **Branch.** `phase-<x>-<slug>` or `fix-<slug>` off `main`. `main` always stays
   working.
3. **Build in small steps**, matching the existing patterns.
4. **Test — my gates.** See below. Never commit red.
5. **Update docs as we go** (not at the end).
6. **Commit to the feature branch** — atomic, described. Never commit feature
   work straight to `main`.
7. **Hand off for the user to test — then STOP.** Write a short **UAT checklist**:
   concrete numbered steps and the expected result for each, that the user runs
   themselves. Wait for their explicit pass. My own testing never substitutes for
   their sign-off. If they find a problem, fix on the branch and hand back an
   updated checklist.
8. **Merge & tag — only after the user's UAT passes.**

## Testing gates (must pass before commit/merge)

There is **no build step and no unit-test suite** — these are static `file://`
pages. Verification means *driving the real pages*:

- **A page that loads clean is not an app that works.** A fault inside a
  style's own draw code cannot throw until a note is played AND that look is
  selected — `rise is not defined` sat in Big Chords' Sparks through a clean
  27/27 load gate. **Click every chip on an app's own pane and play into each**;
  it is the cheapest gate there is and it is the one that finds this class.
- **All 27 pages load clean** from `file://`: 0 `pageerror`, 0 `console.error`,
  0 failed requests. This is the baseline `UAT-PHASE-0.md` established, and any
  error appearing later is one we introduced.
- **Drive the actual behaviour** with Playwright — see
  `.claude/skills/verify/SKILL.md` for the handle and the gotchas. **Drive the
  gesture a person would**: a synthesised `onDown()` is not a click, and a whole
  suite of them once passed on an app no mouse could play.
- **Count what the student sees, not what the code does.** A counter placed on an
  internal event proves that event and nothing downstream of it. Voice Visuals'
  "40 onsets from 40 claps" closed a report that was still true — a second gate
  between the onset and the ring was discarding every other one, and the
  measurement was structurally incapable of seeing it. If the report is "no ring
  appears", **count rings**. Two visible behaviours that disagree localise a fault
  faster than any amount of reading: the user found that one by noticing the
  centre glow pulse while no ring came.
- **A guard is a hypothesis until it is driven with the case it names.** A rate
  limit, refractory or threshold added for a student you have imagined rather than
  seen must be tested against a generated version of that case *before* it ships.
  Ripples' ring gate was added for "a student whose sounds run into one another",
  given a slider and a widened range, and survived four UAT rounds — then measured
  inert on a raspberry, a babble and a sustained hum alike, while suppressing only
  deliberate clapping. **A control whose only measurable effect is to discard what
  a student meant to do is not a control.** Delete it rather than tune it.
- **The harness cannot see a compositing fault at all** — it is a software
  rasteriser, so a GPU artifact is invisible rather than merely mismeasured, and
  a detector written for one will pass on the broken build. When a reported
  fault cannot be reproduced here, **delete the mechanism rather than patch
  around it**, and say plainly that the fix is unverified.
- **A browser refresh picks up every change.** No rebuild, no restart.
- State plainly what was verified and how; if something couldn't be tested, say so.
- **User sign-off gates `main`.** Hand them a UAT checklist and wait.

## Docs-as-you-go

Whenever a change lands, update in the same branch:

- **`IMPROVEMENT-PLAN.md`** — the phase record and what is still open.
- **`APPS.md`** — the per-app reference. It is the accurate one; `README.md` has
  drifted from it before.
- **`README.md`** — the framework description.
- A **design doc** (`PHASE-*.md`) for anything that met the trigger above.

A phase isn't done until its docs are updated.

## Commits

- Small and atomic; imperative subject; body explains the *why* when non-obvious.
- Only commit/push/tag/branch when the user asks, or as step 6/7 of an agreed phase.
- End commit messages with a trailer naming the model that did the work —
  usually `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.

## Project cheatsheet

- **Run it:** open any `.html` from `file://`. No server, no build, no install —
  the whole thing must work from a USB stick with no network.
- **THE TOP LEVEL IS THE ROOM BUILD, and nothing else is** (2026-09-06). Copy
  every loose file at the top level plus `assets/` onto the machine and that is
  the whole thing: `index.html`, the **20** activity files the launcher lists,
  `framework.js`, `framework.css`, `midi.js`, `songs.js`, `assets/`,
  `Music Room.cmd` and `LICENSE` (plain MIT, so GitHub detects it; it sits at
  the top so the notice travels with every copy). The OpenMoji icons in
  `assets/` are CC BY-SA 4.0, not MIT — their notice is in that file's own
  header and in the README, and must not be appended to `LICENSE`, which
  stops GitHub recognising it. `CLAUDE.md` is the one visible file up there that is not part of it,
  because Claude Code loads it from the project root and it cannot move; the
  two dotfiles, `.gitignore` and `.nojekyll` (which stops GitHub Pages running
  `docs/` through Jekyll), are repository plumbing and need not be copied.
  Everything a therapist does not need lives one folder down:

  | folder | what is in it |
  |---|---|
  | `docs/` | every `.md` — the plan, `APPS.md`, the `PHASE-*` design docs, the `UAT-*` checklists |
  | `archive/` | Beat Builder, Conductor and Fluid Paint, delisted 2026-08-26, plus the history bundle |
  | `bench/` | `template.html` (the start of a new app) and the two harnesses, `fx_lab.html` and `sound-test.html` |
  | `probes/`, `prototypes/` | the measurement scripts and the throwaway UI prototypes |

  **A page that moved down a folder had to have its includes repointed** at
  `../framework.js` and friends, and had to be given back its Home link — the
  framework writes `<a href="index.html">`, which from a subfolder is a page that
  is not there. That fix is IN THOSE FIVE PAGES, deliberately, and not in
  `framework.js`: the moved pages caused it, and `framework.js` is loaded by all
  20 apps that go in the room. **MIDI Weather was DELETED on 2026-09-01** at the
  user's request — the file is gone, not archived, and lives only in git history.
  `fx_lab` and `index` do **not** load the framework.
- **Every design doc and checklist this file names is in `docs/`.** They are
  referenced throughout by bare filename (`PHASE-7-REACH-AREA.md`), because the
  name is what identifies them; the folder is where they are.
- **`midi.js` is a second shared file**, loaded with `<script src>` AFTER
  `framework.js` by **four** of the five MIDI apps, the way `songs.js` is shared
  by four song apps. It is the MIDI reader and the menu blocks those apps have in
  common; it never draws. A change in it is four changes — treat it the way the
  design-doc trigger treats `framework.js`.
  **`midi_light.html` is the sixth and does NOT load it**: it predates the file
  and carries its own copy of `connect`/`bind`/`onMidi`. So a fault in the reader
  is **two** edits, not one, and a fix to `midi.js` alone leaves the app that has
  been played longest still broken. Phase 9c was exactly that near-miss.
- **`framework.js`** is the shared everything: settings and persistence, the
  scale/note engine with Boomwhacker colours, the 12-voice audio engine, 5-touch
  input, the settings strip, presets, session lock, idle sleep, DPR sizing, the
  reach area, WebGL context-loss recovery, and the render loop.
- **An app** is a title, two includes and one `Anim` object (`themes, defaults,
  schema, init, resize, splat, frame, reset`, plus optional hooks). `splat`
  coords are 0..1 with **y up**.
- **The settings tabs mean the same thing in every app.** `Notes` is Register,
  Scale, Starting note and the note count — nothing else, ever. `Sound` is the
  voice row, Effects, Volume, Shape the sound. Anything that is only about *this*
  app goes on its own first tab via `Anim.buildApp` + `Anim.appLabel`; anything
  that is a per-student input setting goes to `Setup → Access` via
  `Anim.setupExtras`. An app with no scale to set names `instrument` in
  `hideRail` and has no Notes tab. See `PHASE-4E-APP-TAB.md`.
  **One deliberate exception, and it is narrow.** Voice Visuals' microphone —
  switch, meter, readout, Sensitivity, Range, Voice range — lives on its **Sound
  tab**, not Setup. The rule exists so a therapist finds things in the same place
  every time, and for an app whose *only* sound is the one coming in, an empty
  Sound tab beside an overloaded Setup tab defeats that more than the move does.
  The test is not "is this an input setting" but **"is this app's input its
  sound?"** — true only for a listen-only app. Anywhere else the rule stands.
  Found by the user in UAT, not by reading; see `PHASE-11-LISTENING.md` §11.5.
  `Setup → Reach area` is framework-wide and belongs to no app — the three Access
  tabs each name a **device**, and the reach area is about a student's arm and the
  room, so it is its own section rather than a fourth tab.
- **The shell:** `#shell` is a flex row of `#rail`, `#strip` and `#stage`.
  `#stage` is only the slot; the activity is **`#surface`**, always
  `100vw x 100vh` and **scaled** to fit by `fitSurface()`. That function owns the
  only three numbers there are — a scale and an offset — so the **reach area**
  (`reachSize/reachX/reachY`) is not a second mechanism, it is those same numbers
  answered differently. See `PHASE-7-REACH-AREA.md`.
- **An app's own DOM must not accept a pointer.** The framework's mouse and touch
  listeners are on **`canvas`**, so anything an app lays over it swallows every
  real click — while the gamepad pointer and the mouse dwell, which call
  `onDown()` directly, carry on working. Give every layer `pointer-events:none`
  and hit-test in `splat()`, where `opts.velScale === 0` is the press and the
  render loop's splats are not. Sound Match shipped past a full test suite
  unplayable by mouse because every test synthesised the press. See `APPS.md`
  §Sound Match and `UAT-PHASE-8.md`.
- **`stageEl` is `#surface`.** An app creating its own `position:fixed` DOM must
  append it there, never to `document.body`. The surface carries the transform,
  so it is the containing block — that is what keeps an app's own furniture on
  the activity and scaling with it. The three modals are the deliberate
  exception and stay on the body: `clrOv` (framework), `dpOv` (Drums), `smOv`
  (Sampler). **A modal on the body must carry `class="modal"`** — that is what
  suspends the gamepad pointer while it is open, since the pointer injects
  coordinates rather than reading DOM events and would otherwise go on playing
  the activity behind it. A new one that forgets the class fails back to that
  old behaviour silently. See `PHASE-5C-ACCESS-PANE.md` §11.7.

## Non-negotiables

- **The activity is scaled, never re-laid-out.** No app is told to resize when
  the chrome opens or the session locks, so nothing a student has drawn is lost.
  Do not "fix" this by resizing the canvas.
- **Nothing re-scales while a pointer is down.** `fitSurface()` bails if any
  pointer is down. Scaling doesn't change the coordinates behind the activity but
  it does move it on screen, so a finger that hasn't moved lands somewhere else
  and the next move event reads as having crossed into it. One tap, two notes.
- **Map a touch before anything moves.** `toSim` divides by the layout width; map
  first, act second.
- **Locked is pixel-perfect at the default reach area.** Chrome collapsed with
  `reachSize` at 100% means scale exactly 1, and a student never sees a resampled
  image. The **reach area** is the one deliberate exception, and the only thing
  allowed to scale a locked session: a smaller activity a student can reach beats
  a crisper one they cannot. Nothing else may claim it. See
  `PHASE-7-REACH-AREA.md` §4.
- **No fail states.** Every app must work offline, with no controller, no
  network, and no optional input present.
- **Never write a raw pixel size for a control.** Everything derives from the
  token block at the top of `framework.css` and scales with `--ui-scale`, the
  therapist's one Menu size per display (0.8–1.5, the `uiScale` key). A layout that breaks at
  1.5 is a broken layout. `--control` (56px) is for controls inside a panel;
  `--target` (64px) is for standalone targets.
- **Accessibility belongs in the framework's geometry, not in per-app hooks.**
  Switch access was built and dropped because it needed `switchTargets()` in all
  17 apps and each one felt different. Anything that needs every app to
  cooperate will go the same way — see `IMPROVEMENT-PLAN.md` Phase 5.
- **Never invite a student's full name** into a shared room PC's `localStorage`.
  Initials only.
