# Phase 16 — a long press must not open a menu

**Status:** ✅ **UAT-PASSED on the touch projector, 2026-09-06** — "all works". Shipped in `v1.20.0`.
**Trigger:** `framework.js`, which all 20 room apps load. Design doc first, per `CLAUDE.md`.

## 1. The report

> "When on the touch projector the hold-to-right-click kept popping up. Any way of
> stopping this as it is an Edge thing. It is turned off in Windows." …
> "It happened when selecting menu items."

A finger resting on a control for a moment brings up the browser's context menu,
over the top of the thing the therapist was trying to press.

## 2. Why the Windows setting did not fix it

Windows has a pen-and-touch gesture called **Press and hold**, which draws the
ring and synthesises a right-click. That is the one the user turned off, and
turning it off was reasonable.

**Chromium does not use it.** Edge synthesises `contextmenu` from a long touch
press *itself*, in the renderer, from its own gesture recogniser — so it is
unaffected by the Windows setting, by mouse settings, and by anything a therapist
can reach in the OS. It is a **web page's** event, and a web page can decline it.
That is why the fix is in this repo rather than in a setting or a policy: a policy
would also have to be re-applied on every machine the USB stick is carried to,
which is precisely the thing this project refuses to depend on.

`touch-action:none` — already on `canvas` — is not it either. That governs
scrolling, panning and pinch. The long-press menu is not a scroll.

## 3. Why this app collides with it harder than most

**Holding is our vocabulary.** A sustained note is a held finger. Unlocking is a
deliberate three-second hold in the top-left corner. A student with a motor
impairment does not press briskly — a long press is often the only press they
have. An interface built for people who dwell cannot also treat dwelling as a
request for a menu.

And the report is about the **menu items**, not the activity: the rail buttons,
the chips, the toggles and the sliders. So this cannot be a rule about the canvas.
It has to be the whole document.

## 4. What is built

One listener, at the document, in the capture phase:

```js
document.addEventListener('contextmenu', e => { …preventDefault… }, {capture:true});
```

`framework.js` already prevents `dragstart` at the document exactly this way
(line ~1296), for the same reason — a browser gesture that means nothing here and
interrupts one that does. This is the second row of that table, not a new idea.

**`index.html` needs its own copy, and this is the `midi_light` lesson again.**
The launcher does not load `framework.js` — it never has — so a fix that lives
only in the framework leaves the long press popping menus **on the first screen a
therapist touches**, which is the one place the report is most likely to have come
from. Two files, not one. `fx_lab.html` also skips the framework and does not get
it: it is a bench, it is in `bench/`, and it never goes in the room.

## 5. The exception, enumerated

A context menu is suppressed **everywhere except a field you can type in or copy
out of**:

| target | menu | why |
|---|---|---|
| the activity, the rail, chips, toggles, buttons | **suppressed** | nothing on it applies; this is the whole report |
| `input[type=range]` — every slider | **suppressed** | a slider is a control, not text |
| `input[type=text]` — the preset name | allowed | a therapist types initials here on a laptop |
| `textarea` — the launch-link box (`PHASE-6`) | allowed | it is `readOnly` and **exists to be copied out of**; right-click → Copy is the action it is for |
| `[contenteditable]` | allowed | none today; the rule should not have to be revisited if one appears |

The exception is by **field type, not by tag**, because `input` covers both the
sliders and the one text box, and they want opposite answers.

## 6. Lifecycle

**There is no state, and that is deliberate.**

- **Added / changed / removed:** it is behaviour, not data. Nothing is written,
  nothing is read.
- **Stored per student:** nothing. No key, no cardinality.
- **Inherited by the next person to use the machine:** **nothing** — the row that
  is always forgotten, and the honest answer here is that there is nothing to
  inherit. Contrast `PHASE-7-REACH-AREA.md`, where this row was the whole fault.
- **Two of them conflict:** an app that added its own `contextmenu` handler would
  see this one first (capture phase). None does; if one ever does, it can call
  `stopPropagation()`.
- **Not a setting.** A switch for "let the browser show its menu" would be one more
  thing on a pane, meaningful to nobody in the room, and answerable wrongly. If a
  developer needs the menu, they have F12 and `bench/`.

## 7. What was verified, and what could not be

**Verified here** (`probes/phase-16/menu.js`), by dispatching a real `contextmenu`
event at each target and reading `defaultPrevented` — across all 21 room pages:

- the canvas, the rail buttons, the tab buttons and the panel controls: prevented
- a slider: prevented
- the preset-name input and the launch-link textarea: **not** prevented
- the launcher's own tiles, which `framework.js` never sees: prevented

**Could NOT be verified here:** that Edge's *touch long press* is what raises this
event on the projector. Headless Chromium does not run the touch gesture recogniser
that turns a held finger into `contextmenu`, so the path from *finger* to *event*
is out of reach of this harness — the same limit `CLAUDE.md` records for
compositing faults. What is verified is that **the event is refused wherever it
comes from**, which is the only part of the chain this code owns.

**So the projector test is the user's, and it is the one that counts:** hold a
finger on a menu item for two seconds. See §8 of the UAT checklist.
