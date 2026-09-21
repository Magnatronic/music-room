# Phase 5b — Named actions on the keyboard (the Adaptive Hub)

**Status: UAT-passed 2026-08-30 and shipped in `v1.6.0`**, merged alongside Phase
5c. Written and built 2026-08-27. **Superseded in part by `PHASE-5C-ACCESS-PANE.md`**:
5b's `keyMap` became 5c's `bind`, keyed by action rather than by key and covering
controller buttons as well as keys, and it is migrated once on load.
**Trigger:** touches `framework.js`, which all 17 apps see.

Follows Phase 5a. Agreed with the user: **the Hub stays a keyboard**, because its
buttons are mappable in Microsoft Accessory Center and that makes it the flexible
device, while the XAC and controller are the gamepad.

---

## 1. What a key can and cannot be

**A key says *now*, not *where*.** It has no position, so it cannot play an
activity — that is the gamepad's job (Phase 5a). What it can carry is **meaning**:
*play*, *clear*, *again*, *record*.

So the division of labour agreed in `ACCESSIBILITY-OPTIONS.md` §12:

> **Gamepad = where and when.  Keyboard = named actions.**

## 2. Which actions? The ones already on the rail

Every app already has its named actions, and they are its **rail buttons**:

| app | rail buttons |
|---|---|
| framework, in most apps | `mode`, `clear` |
| Drums | `dpedit`, `dprec`, `dpplay`, `dpundo` |
| Song Grid | `sgplay` |
| Echo Bird | `ebplay`, `ebagain` |
| Life | `play` |
| Beat Builder | `bbplay`, `bbrewind` |
| Soundscape | `ssmoon` |
| … | … |

**So a key binds to a rail button id, and nothing has to be invented or
declared.** `allRailButtons()` already returns exactly what this app offers, and
`desc.onClick()` already does the thing. **No app cooperates, which is the whole
point** — the rule in `CLAUDE.md` is that anything needing all 17 apps to
cooperate dies the way `switchTargets()` died.

The hook is not new either: rail buttons have carried an optional `desc.key`
since they were written. **Exactly one app uses it** (`life.html`, space for
play/pause), so it is a real path that has been exercised once. It stays
supported as a fallback; the therapist's binding wins.

## 3. State cardinality

**One map, per app, per student:** `SETTINGS.keyMap = { '<key>': '<railId>' }`.

- `SETTINGS` is keyed per filename, so each app has its own map — which is right,
  because each app has different actions. Setting up Drums does not disturb
  Song Grid.
- It rides in a **preset**, because it is the student's, not the display's.
- **One key, one action.** Binding a key that is already bound moves it; a key is
  not a list. Binding is idempotent.
- An id in the map that this app does not have is simply inert — that is what
  happens when a preset made for Drums is loaded in Flock, and it must not error.

## 4. Lifecycle

| event | behaviour |
|---|---|
| **added** | Therapist picks an action, presses a key, it is stored. |
| **changed** | Learning again for the same action replaces its key. Learning a key already used by another action **moves** it — no duplicates. |
| **duplicated** | Prevented by the above; the map is keyed by key, so it cannot hold two. |
| **replaced** | A preset load replaces the whole map at once. |
| **removed** | A clear control per action. Removing the last binding leaves `{}`, which behaves exactly as today. |
| **conflict** | A bound key that is also a legacy `desc.key` on another button: **the therapist's binding wins**, because it was set deliberately and the legacy one is a default. |

## 5. The five problems this has to solve

These were named in `ACCESSIBILITY-OPTIONS.md` §12 before any code was written.

**1. Focus — a live failure today, not a theoretical one.** The handler is

```js
if(e.target!==document.body) return;
```

Type a preset name, leave the caret in the box, and the student's next Hub press
**types a letter into it** instead of doing anything. In a room that will happen.

The rule is inverted: fire **unless** the target genuinely wants text —
`input`, `textarea`, `contenteditable`. Everything else, including a focused
button after a click, passes through.

**2. Macros fire repeatedly.** A Hub button mapped to a macro can send several
keystrokes faster than a hand could. Every action gets a short guard (**250 ms**)
so one intent is one action. Chosen to be shorter than a deliberate double-press
and longer than any macro burst.

**3. Auto-repeat.** Holding a Hub button repeats at the OS's rate. `e.repeat`
is ignored — a held key is one press, not forty.

**4. Lock.** **Keys keep working while the session is locked, deliberately.** A
locked session is exactly when the student is playing, and these are the
student's own actions on the student's own device. Lock exists to stop the
*chrome* being touched, not to disarm the student.

**5. The keys are settings, not constants** (§3), so they match whatever is
mapped in Accessory Center and cannot collide with anything we chose.

## 6. Setup → Access

Under the controller rows: **Buttons and keys** — one row per rail button this app
has, each showing its key or *Set*. Pressing *Set* listens for the next key.

- The key is shown as a person would say it: `Space`, `←`, `A`.
- A **clear** affordance per bound action.
- With no bindings the section still lists the actions, so it is discoverable
  rather than hidden behind knowing to press something.

## 7. Against the non-negotiables

- **No fail states.** An empty map is today's behaviour exactly. An unknown id is
  inert. No keyboard is not a failure — nothing changes.
- **Nothing about pointers, geometry or scaling changes.** This phase adds no
  pointer and no layout to the activity.
- **Never invite a student's full name** — untouched; no new text entry.

## 8. Acceptance criteria

1. With an empty map, all 17 apps behave exactly as today, 21 pages load clean.
2. A key bound to Song Grid's `sgplay` starts the song; the same key does nothing
   in an app without that button.
3. **A caret in the preset-name box does not swallow the key** — typing there
   still types, and the bound key still fires when focus is anywhere else.
4. A held key fires **once**, not repeatedly.
5. Ten keydowns in 50 ms fire the action **once**.
6. Binding a key already used moves it; the map never holds a duplicate.
7. Bindings survive a preset save/load and are absent from the display's keys.
8. Keys still fire while the session is locked.
9. `life.html`'s legacy space-for-play still works with no binding set.
10. At Menu size 1.5 the Setup pane does not overflow.

---

## 9. Built — what the measurements said

| # | criterion | result |
|---|---|---|
| 1 | empty map behaves as today | `keyMap` defaults `{}`; **21/21 pages clean** |
| 2 | a bound key fires its rail button | `p` → `sgplay` fired once |
| 2b | the same key in an app without that button | inert, no error |
| 3 | **a caret in the preset-name box does not swallow it** | typing put `Jam` in the box and fired **0** actions; leaving the box, the key fired again |
| 4 | a held key fires once | held 0.9 s → **1** |
| 5 | a macro burst fires once | ten presses → **1**; after the guard → 2 |
| 6 | binding a used key moves it | `{p: sgplay}` → `{p: clear}`, never both |
| 7 | a preset carries it, the display's keys do not | `keyMap` ✓ — `uiScale` ✗ `fullscreen` ✗ |
| 8 | still fires while locked | 1 |
| 9 | Life's legacy Space still works unbound | `playing` false → true |
| 10 | fits at Menu size 1.5 | **0 px overflow** at 1280×800, 1366×768, 1920×1080 |

**One test failure that was the test's fault, recorded because it nearly became a
code change.** Criterion 4 first reported **0**, not 1. The cause was the 250 ms
macro guard from the previous criterion's press still being in force when the hold
began — the guard working exactly as designed. A 500 ms gap in the probe, and it
reports 1. *Check whether the harness is the thing that is wrong before altering
the thing being measured.*

**Labels come from `label`, then `title`, then the id.** Several rail buttons carry
only a title — Life's play button is icon + title — so the row read `play` before
this. It now reads `Pause`, with the trailing `(Space)` hint stripped, because the
key is already shown in the chip beside it.

