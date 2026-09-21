# Phase 6 — launch parameters: the room PC opens an app already set up and locked

**Status:** ✅ UAT passed 2026-08-31, merged, shipped in `v1.8.0`.
**Trigger met:** `framework.js`, and it changes **how a session starts** and what
is written to `localStorage` at boot. Doc first.

---

## 1. What this is for

The sensory room has **one PC**. It runs the equipment control software and drives
a touchscreen projector. The therapist chooses a few options on the PC — *5 keys,
synth, lines only, reverb* — and launches. The activity appears on the projector
**already set up and already locked**, ready for the student. The menu is still
there for anyone who unlocks it.

The control software can already launch Edge fullscreen. What it cannot do is say
*what the activity should be like*. This adds that.

**Scope, from the user, 2026-08-31:** same PC, so nothing has to travel between
machines. **No presets and no student settings in the launcher** — a link carries
the activity's own setup and nothing else.

---

## 2. This is a port, not an invention

The user built this before, in `Coding/MusicTherapy/music-room`. It is a good
design and it is reproduced here rather than replaced. What it does:

- reads **both `?query` and `#hash`** — "some launchers mangle one or the other";
- `s=key:value,key:value` carries the setup, listing **only what differs from the
  app's defaults**, so links stay short *and* stay correct when a default changes
  later;
- coerces each value using the type of the matching default — `octave` and
  `octaveRows` are strings that look numeric, and guessing would break them;
- **ignores junk rather than breaking**;
- `lock=1` opens it locked;
- shows a **toast at boot** confirming the link was read, so a misconfigured
  launcher announces itself instead of looking like the app "just opened wrong";
- puts a **`🔗 Copy launch link`** button on the Presets pane, which copies to the
  clipboard *and* leaves the text on screen, because the machine you configure the
  launcher on is usually not the machine the app is running on.

### The one thing it got wrong, and why it matters

`launchLink()` ends with a hard-coded `'lock=1'`. **Every link it produces is
locked**, and the only way to get an unlocked one is to delete `&lock=1` from the
URL text by hand — which the dialog instructs. Hand-editing a URL inside room
control configuration is where a typo survives unnoticed until a student is in
front of it.

**So the copy dialog gets a `Start locked` toggle**, on by default, rewriting the
link live. You copy what you want and never touch the URL.

---

## 3. Two things the port must protect, which did not exist when it was written

`?s=` **resets to the app's defaults before applying the link**. That is the point
— the link is the source of truth, so nothing the last session left behind can
leak into a launch. But `SETTINGS` has grown two kinds of key since:

| key(s) | why a launch must not reset it |
|---|---|
| `uiScale` | **Menu size belongs to the display.** A reset would snap the room's menu size back to 100% on every launch. Same rule that keeps Fullscreen out of presets (`PHASE-4F` §5). |
| `padOn`, `padButton`, `padSpeed`, `padDead`, `padAuto`, `dwellPad`, `dwellPadMs`, `dwellMouse`, `dwellMouseMs`, `bigPointer`, `bind` | **These are about the student's body, not the activity.** A launch that reset them would silently turn off a student's switch or dwell — the exact failure class found twice this week. |

**Corrected during the build, and it is the sharper rule.** The first draft said
these keys were still settable by a link that named them. Running the tests showed
that was wrong on two counts. `bind` is an **object**, and `encodeSettings` had no
representation for one — a link built after `migrateBind()` seeds the X/Y defaults
came out carrying `bind:[object Object]`, which decodes back to nothing. And more
importantly: a link that *carried* `padOn:1` would push one student's access setup
onto everyone launched with it, which is precisely what "no student settings in the
launcher" rules out.

**So a link neither carries nor accepts these keys, in either direction.** They are
excluded from `settingsDiff()` and declined by `applySettingsParam()`. A link is
the activity's setup and nothing else. `encodeSettings` also refuses any
object-valued setting outright, so no future key can silently stringify itself into
a link.

**`bind` needs `migrateBind()` after any reset**, or `bind:null` never gets its
X/Y defaults laid down. Preserving `bind` mostly avoids this, but the call stays
so a link that *does* set `bind` behaves like every other path.

### 3.1 A THIRD kind of key arrived, and it is deliberately not on that list

`reachSize` / `reachX` / `reachY` (Phase 7, 2026-08-31) look like the second row
of the table above and are not. **They were put on `LAUNCH_KEEP` and taken off
again**, and the reasoning is recorded here so nobody restores them thinking the
omission was an oversight:

- **The keys above describe a PERSON.** `padOn` is true of a student next week. A
  reach area describes **where their chair is today** — a rectangle round the part
  of a wall someone could get to on Tuesday is true of nobody by Wednesday.
- **Check which way the failure falls.** This table protects keys whose reset
  leaves a student *unable to play*. Resetting a reach area leaves a **full-wall
  activity**, which is what every session looked like before the feature existed.
  Forgetting one costs a therapist ten seconds. **Inheriting** one costs a student
  the session — a locked corner of a screen, with the student it is wrong for
  often being the one who cannot report it.

So a launch link **carries and accepts** them like any activity setting, and
`initSettings()` additionally resets them on **every** load, link or no link. See
`PHASE-7-REACH-AREA.md` §6.1.

---

## 4. What a link looks like

```
fluid_sensory.html?s=noteCount:5,voice:synth,reverb:1,paintKeys:off&lock=1
```

Encoding: `key:value` pairs joined by `,`; arrays joined by `|`; booleans as
`1`/`0`; `encodeURIComponent` on both halves, which escapes `,` and `:` so those
stay safe as separators.

---

## 5. Fullscreen is deliberately absent

**No URL can put the browser into fullscreen at load.** The Fullscreen API needs
transient activation and refuses without it — established in `PHASE-4F` §16 and
the whole reason `Music Room.cmd` exists: `--start-fullscreen` is a *window*
state, and only a window state survives. The control software already launches
Edge that way, so there is nothing missing from the link.

A `fs=1` that set the stored display preference (so the first touch goes
fullscreen) was considered and **rejected**: redundant when the launcher already
does it, and it would let a link write a display-owned key, which is the boundary
Phases 4f and 4h were careful about.

---

## 6. Lifecycle — a launch

| case | behaviour |
|---|---|
| **Added** — link with `s=` and `lock=1` | Settings reset to defaults, link applied, opens locked. The lock hint shows; the launch toast is deferred behind it. |
| **Added** — link with `lock=1` and no `s=` | Nothing is reset **except the reach area**, which is reset on every load however the page was opened (§3.1). The app otherwise opens with its saved setup, locked. Useful for "just lock it". |
| **Added** — link with `s=` and no `lock` | Setup applied, opens **unlocked**. `lock=0` is the same as omitting it. |
| **Added** — no parameters at all | Exactly today's behaviour. Nothing reads the URL now, so there is nothing to regress. |
| **Changed** — a therapist unlocks and edits | Their edits save normally and outlive the session, until the next launch re-asserts the link. |
| **Duplicated** — the same link launched twice | Identical result both times. That is the property `s=`-resets-first exists for. |
| **Replaced** — a link naming a key that no longer exists | Ignored: unknown keys have no default to coerce against. The toast still confirms the link was read. |
| **Replaced** — a link with a junk value (`noteCount:banana`) | That pair is ignored, the rest applies, and the toast turns into a **warning** so the launcher gets fixed. |
| **Removed** — `lock=0` on an app whose saved state was locked | Opens unlocked. The link wins over the saved flag, in both directions. |
| **Conflict** — a link omits `uiScale` / access keys | They are **preserved**, per §3. Omission is not an instruction. |
| **Conflict** — a link omits the reach area | It is **reset to full screen**, and that is the opposite rule on purpose (§3.1). Here omission *is* an instruction, because the alternative is inheriting the last session's rectangle. |
| **Conflict** — a link names a reach area | It is applied, clamped to the 25% floor, and the boot toast appends `· reach area 35%` so nobody has to guess whether a small activity was meant. |
| **Conflict** — launched locked, and Phase 4h | A launched lock does **not** take the fullscreen loan: `applyLock()` at boot is not `setLocked()`, and a boot-time request would be refused anyway. Correct, and stated so it is not "fixed" later. |

---

## 7. Cardinality and storage

- **No new `localStorage` key.** A launch writes the app's existing
  `settings:<file>.html` blob, exactly as tapping the controls would.
- `LAUNCH` is parsed **once**, at load. Changing the hash afterwards does nothing.
- A launch **persists**. It is the same shape as a therapist setting the controls
  by hand, so unlocking and adjusting behaves normally. The alternative —
  transient settings that vanish on reload — would surprise anyone who unlocks.
- **The reach area is the one exception, added by Phase 7.** It is written to the
  blob like everything else and then overridden on the next load. It is the only
  setting in `SETTINGS` that does not outlive the page, and §3.1 says why.

---

## 8. Acceptance

1. Set an app up by hand, copy the link, open it: identical setup, locked.
2. Same link again after someone else has changed that app: still identical.
3. `Start locked` off produces a link with no `lock=1`, and it opens unlocked.
4. The 3-second corner unlock works on a launched-locked app, and the menu is
   fully there afterwards.
5. Menu size and access settings survive a launch that does not name them.
6. A junk value is ignored, the rest applies, and the screen says so.
7. An app opened with no parameters behaves exactly as before.
8. All 21 pages load clean in Edge and Firefox.
