# Phase 4f — Fullscreen, as a property of the screen

**Status: UAT-passed and shipped in `v1.3.0`.** Written and built 2026-08-26.
Two faults were found later and fixed on the Phase 5b/5c branch, shipped in
`v1.6.0`: fullscreen was being requested on the tap that *navigated away* (⌂ Home
is an `<a href>`, so the gesture asked for fullscreen on an unloading document),
and the one-shot re-apply was armed on `window` instead of `stageEl`. Both are
written up in **§16 and §17** below, along with why `Music Room.cmd` exists at all.
Note that **fullscreen-on-Lock is a different, still-unbuilt thing** — see
`IMPROVEMENT-PLAN.md`.
**Trigger:** touches `framework.js` and `framework.css`, which all 17 apps see.

---

## 1. What this is for

A room PC running an activity on a projector or a wall screen shows the browser's
tab strip, address bar and taskbar above the activity. None of it means anything
to a student, and on a short throw it eats a real fraction of the picture. The
therapist wants the activity to fill the glass.

F11 already does this. The point of building it is that **F11 is a keyboard on a
machine that often has no keyboard within reach**, and that a therapist setting up
a room should not have to know a function key.

## 2. Where it goes, and why not where it was going to go

**`Setup → This screen`, directly under Control size.** Framework-level, so all 17
apps get it from one place.

> **Updated 2026-08-27.** The `This screen` heading was removed and *Control size*
> renamed *Menu size* when the pane was tidied. Fullscreen still sits directly
> under it, and its explanatory hint went too — the refusal message in §7 stays.
> Everything else in this document is unchanged.

This **supersedes the earlier decision** recorded in the session notes, which put
fullscreen on the **Lock** button — locking the session would also go fullscreen.
The user chose the Setup pane on 2026-08-26. The reasons the Setup pane is the
better home, now that both have been laid out:

- **It is the same kind of thing as Control size.** Both are answers to "what is
  this screen like?", set once when the room is set up, by a therapist, and true
  for every app on that machine. They belong in the same section because they are
  the same category of setting.
- **Lock couples two unrelated ideas.** Lock means *a student is using this now*.
  Fullscreen means *this display has furniture I do not want*. A room with a
  20-inch desk monitor might want lock without fullscreen; a projector being set
  up wants fullscreen without lock.
- **Esc and F11 desync a Lock-coupled design and cannot desync this one.** If
  fullscreen rides on Lock, a student or a passing hand pressing Esc leaves the
  session locked but no longer fullscreen, and the two ideas have drifted apart
  with nothing to reconcile them. Here, the toggle *reports the browser* (§5), so
  Esc simply flips the toggle back and the pane stays honest.
- **It costs no rail tier.** The rail is already six tiers in eight apps, which is
  what killed the rail as a home for this in the first place.

The Lock option is not lost. If the room later wants one-tap operation, the
follow-up is a second toggle — *Go fullscreen on Lock* — that reads this same
stored preference. That is deliberately **not** in this phase.

## 3. State cardinality

**One boolean, per display, per browser profile.** Its own `localStorage` key,
exactly as Control size has one.

| | key | scope |
|---|---|---|
| Control size | `ui-scale` | the display |
| **Fullscreen** | **`fullscreen`** | **the display** |
| everything else | `STORE_KEY` (per app) | this app on this machine |
| a student's setup | `PRESET_KEY` | one named student |

It is **not** a member of `SETTINGS`, and this is the whole point rather than an
implementation detail:

- **A preset must not carry it.** `buildPresetsPanel` already strips `uiScale`
  from a saved snapshot, with the comment *"A preset is a STUDENT's setup.
  Control size is the display's."* Fullscreen is the display's for the same
  reason. Loading Jamie's preset must not change the shape of the room's screen.
- **"Reset all settings to defaults" must not clear it.** That button does
  `SETTINGS = Object.assign({}, SHARED_DEFAULTS, Anim.defaults||{})`. A therapist
  resetting an app they have muddled should not be thrown out of fullscreen.
- **It must cross apps.** Going from Bubbles to Flock through the launcher is a
  fresh page load with a different `STORE_KEY`. The display's shape has not
  changed, so the preference has to live outside the per-app blob.

**It is read as a preference and rendered as a fact.** The stored boolean records
what the therapist asked for. What the toggle *shows* is `!!document.fullscreenElement`
— see §5.

## 4. Lifecycle

| event | behaviour |
|---|---|
| **added** | Toggle switched on. Request fullscreen inside that click. On success write `fullscreen=1`. On rejection, snap the toggle back and show the hint in §7. |
| **changed** | There are only two states; "changed" is the toggle, or Esc/F11 outside it. Both routes land on `fullscreenchange`, which re-renders the toggle and rewrites the key. |
| **duplicated** | Not possible — one key per profile, no name, no list. Two tabs of two different apps share the key; each tab's own fullscreen state is the browser's, and each tab's toggle reports its own tab honestly. The key records the last thing asked for on this machine. |
| **replaced** | A second display, or the same PC on a different monitor, replaces the meaning of the key without replacing the key. This is already true of `ui-scale` and is accepted for the same reason: the room PC drives one screen. |
| **removed** | Toggle switched off, or Esc/F11. `document.exitFullscreen()`, write `fullscreen=0`. Clearing site data removes the key; absent reads as **off**, which is today's behaviour. |
| **two of them conflict** | The stored preference says on, the browser says off (a fresh load, or a refused request). **The browser wins for what is displayed; the preference survives for what is re-applied.** §6. |

## 5. The toggle reports the browser, not the flag

The single rule that keeps this honest:

```
toggle rendered state  ==  !!document.fullscreenElement      (never the stored key)
```

with a `fullscreenchange` listener that re-renders the toggle and writes the key.

This is what makes Esc and F11 non-problems rather than desync bugs. A student
who finds Escape leaves fullscreen; the toggle is already showing off the next
time anyone looks at the pane, and no reconciliation logic is needed anywhere.

It is the same principle as Control size's readout, which shows `uiScaleFit` —
what is actually on screen — rather than `SETTINGS.uiScale`, what was asked for.
That pattern is already in `buildSetupPanel` and its comment says why: *"The
readout shows what is ON SCREEN, which is not always what was asked for. Saying
so beats a slider that appears to have been ignored."*

## 6. What a stored preference can and cannot do — measured

**Measured 2026-08-26**, Edge, `file://`, `flock.html`:

| | result |
|---|---|
| `requestFullscreen()` inside a click handler | **granted** |
| `document.fullscreenEnabled` | `true` |
| `requestFullscreen()` with no user gesture | granted *in the automated window* — **not trusted**, see below |

The last row is the one the design turns on, and **the automated browser cannot
settle it.** A Playwright-driven window reports transient activation differently
from a real one, and the same run returned a scrambled `fullscreenchange`
sequence for Escape. The spec requires transient activation, and the honest
assumption is that **a real browser refuses a gesture-less request.**

So the design must not promise what it cannot deliver:

- **A fresh page load does not enter fullscreen by itself.** Opening Flock from
  the launcher starts windowed even with the preference on. Nothing in the design
  claims otherwise, and no code tries it on `DOMContentLoaded` and swallows a
  rejection — that is how a feature becomes folklore.
- **The preference re-applies on the first user gesture after load**, via a
  one-shot listener on the shell that fires once and removes itself. The
  therapist's first tap anywhere — the rail, the Setup tab, the activity — is
  that gesture. If it is refused, it is refused silently and the toggle already
  shows the truth.
- **Navigating between apps therefore costs one tap**, not a trip to Setup. That
  is the honest cost of the feature and it should be written into the UAT so the
  user judges it on what it does, not on what it was hoped to do.

*If it turns out a real Edge does grant a gesture-less request from `file://`,
the one-shot listener is simply never reached, and nothing else changes. Verify
this by hand in the room — it is precisely the kind of thing `IMPROVEMENT-PLAN`
§4 says to measure rather than assume.*

## 7. No fail states

Per the non-negotiable: every app must work with nothing optional present.

- `document.fullscreenEnabled === false`, or the promise rejects: **the toggle
  snaps back to off and a `.hint` appears** — *"This browser would not allow
  fullscreen. F11 does the same thing."* Never an error, never a dead toggle that
  looks on but is not.
- The key is unreadable (private mode, storage disabled): every read is already
  wrapped in `try/catch` returning a default, matching `readUiScale`. Absent
  reads as off.
- No `fullscreenchange` support at all: the toggle still works for the session,
  it simply never self-corrects. Nothing breaks.

## 8. The one real cost — this fires `Anim.resize`

**Entering or leaving fullscreen changes the size of the picture, and six apps
clear and re-seed themselves when that happens. Whatever is on screen is lost.**

The chain is not avoidable and should not be worked around:

```
fullscreen ⇄ windowed
  → 100vw/100vh resolve differently
  → canvas.clientWidth/Height change
  → sizeCanvas() sees canvas.width !== w
  → Anim.resize(w,h)
  → the re-seeding apps spawn afresh
```

This does **not** violate *"the activity is scaled, never re-laid-out."* That
rule is about the chrome opening and the session locking, neither of which
changes the window. A real window resize has always fired `Anim.resize`; this is
one more way to cause a real window resize, and the existing note in the session
record already says a painting is lost on a window resize but never on a settings
visit or a lock.

What follows from it:

- **Fullscreen is a set-up action, not a mid-session control.** It is switched
  before a student starts. The pane says so in its hint: *"Set this before an
  activity starts — changing it clears what is on screen."*
- **It is not going on the rail**, where it would sit under a student's hand next
  to the thing they are drawing on. Another reason the Setup pane is right.
- **Do not "fix" it by suppressing `Anim.resize`.** Suppressing it would leave
  the canvas backing store the wrong size for the new window — a resampled,
  wrongly-mapped activity, which breaks *"locked is pixel-perfect"* and the
  touch mapping with it.

## 9. Locked stays pixel-perfect

Worth stating because it is the rule most likely to be assumed broken.

`fitSurface()` derives its scale `k` from the stage against the surface, and the
surface is always `100vw x 100vh`. Locked means the chrome is collapsed, so the
stage *is* the whole window, so `k` is exactly 1 — in fullscreen exactly as in a
window. **Fullscreen changes how big the window is, not the ratio between the
surface and the stage.** A locked session is pixel-perfect either way, and a
student never sees a resampled image.

## 10. Acceptance criteria

1. `Setup → This screen` shows **Fullscreen** under Control size, in all 17 apps.
2. Switching it on fills the screen; switching it off restores the window.
3. Pressing **Esc** or **F11** leaves fullscreen and the toggle shows off next
   time the pane is opened — no desync, no reconciliation.
4. Saving a preset while fullscreen, then loading it on a windowed machine, does
   **not** change the screen. `fullscreen` is absent from the saved snapshot.
5. **Reset all settings to defaults** does not leave fullscreen.
6. The preference survives navigating to another app, and re-applies on the first
   tap there.
7. A refused request snaps the toggle back and shows the hint. No console error.
8. At `--ui-scale` 1.5 the new row does not push the Setup pane's controls off
   the bottom.
9. 21/21 pages load clean.

## 11. Explicitly not in this phase

- **Fullscreen on Lock.** §2. A follow-up toggle if the room wants it.
- **Kiosk mode / hiding the cursor.** Different problem, different risk.
- **Auto-fullscreen on load without a gesture.** §6 — not promised, not attempted.

---

## 12. What was built, and what the measurements said

Built in `framework.js` on 2026-08-26. `makeToggle` was split into
`makeToggleRaw(label,isOn,onToggle)` so a switch whose state does **not** live in
`SETTINGS` looks and behaves identically to every other switch on the pane.

Every acceptance criterion in §10, driven on the real pages:

| # | criterion | result |
|---|---|---|
| 1 | the row, under Control size, in every app | **18/18** files carry it (17 apps + `template.html`) |
| 2 | on fills the screen, off restores it | `fullscreenElement` and the stored key both follow the switch |
| 3 | leaving fullscreen outside the toggle does not desync | switch reads off, key reads `0` |
| 4 | a preset does not carry it | `fullscreen` absent from the snapshot; `SETTINGS` has no such key |
| 5 | Reset all settings does not clear it | key still `1` afterwards |
| 6 | survives navigating to another app | key `1`, re-apply armed, first tap entered fullscreen and disarmed |
| 7 | a refused request snaps back | switch off, key `0`, hint shown, **no console error** |
| 8 | fits at Control size 1.5 | 0 px overflow at 1280×800, 1366×768 and 1920×1080 |
| 9 | clean load | 21/21 |

**One test could not be run as written.** Pressing **Esc** through the automation
closes the window itself, so §10.3 was exercised through `document.exitFullscreen()`
instead — the same `fullscreenchange` path the browser uses for Esc, and the path
the desync protection actually lives on. **The literal Esc and F11 keys are for the
user's UAT to confirm.**

**The gesture question from §6 remains open and does not matter.** The automated
window granted a gesture-less request, which is what §6 said not to trust. The
built code never makes one: it arms a one-shot listener and waits for a real tap.
If a real Edge would have granted it, the listener simply fires a moment earlier.

---

## 16. The black screen — diagnosed 2026-08-28

**Reported:** open Fluid Keys, click ⌂ Home, and *"the whole screen goes black
including the browser menu"* — in Firefox. Then: *"I cleared the settings on the
Fluid Keys page and it now seems to be OK."*

**"Including the browser menu" is the whole diagnosis.** A page cannot black out
the browser's own chrome. Only one thing removes it: **fullscreen**. So this was
never a rendering fault, and the hours spent looking at the launcher were spent in
the wrong place — the launcher was fine in both browsers at every Menu size.

**The path.** §6 arms a one-shot listener that re-applies the fullscreen
preference at the first user gesture, because a page cannot request fullscreen
without one. It was armed on **`window`**. **⌂ Home is an `<a href>`** — so the
very gesture that navigates away fired it, asking for fullscreen on a document
already unloading. The request lands in the gap between two pages, takes the
browser's menus with it, and leaves nothing on screen to escape by.

**Why Reset appeared to fix it, which is the detail that confirms the story.** The
arm is **one-shot per page load**. Opening Setup and pressing *Reset all settings*
spends it harmlessly on a button; by the time Home is clicked there is nothing
left to fire. Reset changes no stored state that could matter here — and
notably **it does not reset Menu size** (`applyAllSettings` re-reads the stored
`ui-scale`, deliberately, because the size belongs to the display). The user
corrected me on that; I had claimed otherwise.

**Fixed by narrowing the target rather than blacklisting links.** The listener now
sits on **`stageEl`**, the activity surface. The intent being waited for is
"someone has started using the activity", and that is a touch on the activity —
not a click on the chrome. No chrome click can reach it, whatever gets added to
the rail later. `pagehide`/`beforeunload` disarm as well.

**Honest about the limit: this cannot be verified in automation, by
construction.** The symptom is the *browser's own menus* disappearing, and an
automated window has no menus to lose. What was verified: a tap on the activity
still re-applies fullscreen, clicking Home no longer requests it at all, and
**21/21 pages load clean in Firefox as well as Edge** — a gate that had run in
Edge only until this bug, which is the other thing this episode changed.

---

## 17. It cannot span navigation, and what to do instead — 2026-08-28

Asked next: can it **stay** fullscreen when Home is clicked? **No, and no code can
make it.** The Fullscreen API is **per document**; the browser drops it whenever a
new page loads. Measured both ways today — `document.fullscreenElement` is `false`
on the launcher after the hop, in Edge and in Firefox alike. The page cannot hold
a state that belongs to the page being replaced.

**What does hold is browser-level fullscreen**, which is a *window* state — F11,
or launching with `--start-fullscreen`. It survives navigation because nothing
about it belongs to the document.

So `Music Room.cmd` was added: it finds Edge in any of the three usual install
locations, and opens `index.html` from its own folder with `--start-fullscreen`,
so it works from a USB stick whatever drive letter it lands on. Verified: the
window opens fullscreen and the title reads **Personal**.

**Deliberately not `--kiosk`, and this is the trap worth recording.** It is the
obvious-looking flag. Tested, and Edge's kiosk mode opens **InPrivate** — the
title said so — which discards `localStorage` when the window closes. **Every
preset, every student's setup, Menu size and the controller settings would be
gone every session.** For this suite that is not a small side effect; it is the
whole point of the storage.

The in-app toggle keeps its place for a single-app session on a laptop, where
there is no navigation to survive.

