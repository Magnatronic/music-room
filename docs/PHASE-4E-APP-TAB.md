# Phase 4e — the app tab: `Song · Notes · Sound`

**Status: UAT-passed 2026-08-26** and shipped. The only design doc that was
missing a status line; added 2026-08-31 during a docs sweep.

**Trigger:** touches `framework.js` and `framework.css` — a new pane id, a new
rail tab, a new `Anim` hook — which all 17 apps see. Also changes the settings
strip's vocabulary, so it is the kind of change a mistake in costs 17 times.

**Raised by the user, 2026-08-26**, after the tuning audit: *"if we take fluid
keys as the example… on song grid I would have expected to see the menu items
song, sound and notes"* — then, *"song notes and sound. That order."*

---

## 1. The problem, and why the last fix was the wrong shape

The audit moved `Scale`, `Starting note` and `Register` off the Sound tab in
seven apps. Correct as far as it went, but it put them on a tab that **already
had app content**, so they needed a `## Tuning` heading to separate them.

**Fluid Keys has no such heading.** Its Notes tab is nothing but tuning. So the
fix introduced a new inconsistency while removing an old one — the user's word
for it was "confused".

The real fault is that **one tab is doing two jobs**. In Fluid Keys, "Notes"
means *which notes exist*. In Song Grid it meant *which notes exist, plus which
song, plus how it plays, plus your imported songs*. Renaming the tab per app
(`🎵 Songs`, `🎸 Chords`, `🎐 Chimes`) hid that rather than fixing it.

**Sweep Chimes is the accidental proof.** Once its app content was moved out to
Sound, Visuals and Setup, its Notes tab became pure tuning and it now reads
exactly like Fluid Keys. That worked because chime material, hanging and breeze
genuinely *were* sound, look and access. A song is none of those — it has
nowhere to go but a tab of its own.

## 2. The shape

Rail order, top to bottom:

```
⌂ Home
┌──────────┐
│ 🎵 Song  │  ← NEW, and only when the app defines Anim.buildApp
│ 🎼 Notes │  ← Register, Scale, Starting note. Nothing else, in every app.
│ 🎛 Sound │  ← Voice, Effects, Volume, Shape the sound.
│ ✨ Visuals│
│ ⭐ Presets│
│ ⚙ Setup  │  ← This screen · Access · Start over · This computer
└──────────┘
… rail extras, then 🔒 Lock
```

**Notes means one thing in every app.** That is the whole point, and it is the
thing to protect if anything else here has to give.

## 3. What changes in the framework

| | |
|---|---|
| `PANE_IDS` | gains `app: 'paneApp'` |
| `PANE_BUILDERS` | gains `app: buildAppPanel` |
| injected shell | one more `.bbar.tab` **before** `#btnInstrument`, one more `.pane` |
| `Anim.buildApp(el)` | **new hook.** Present ⇒ the tab exists. Absent ⇒ it is removed from the rail entirely, not just hidden |
| `Anim.appLabel` | `'<emoji> <Name>'`, e.g. `'🎵 Song'`. Required when `buildApp` is defined; the framework falls back to `'🎛 App'` and says so in the console rather than rendering a blank tab |

**No `SETTINGS` key is added, changed or removed.** `currentQuickMode` is a
module-level `let`, not persisted, so nothing can be saved pointing at a pane
that a later build does not have. A v1.0.0 preset loads unchanged.

## 4. Lifecycle

| event | what happens |
|---|---|
| **Added** — an app defines `buildApp` | the tab appears at the top of the tab block. Nothing is stored, so no migration. A therapist's muscle memory changes: what was on "Songs" is now split across "Song" and "Notes" |
| **Changed** — `appLabel` edited | tab text changes; nothing stored, nothing to migrate |
| **Duplicated** — two apps both define it | independent by construction; the hook is per-`Anim`, and there is no shared state between apps |
| **Duplicated** — `appLabel` *and* `paneLabels.app` both set | `paneLabels` wins, because it is the existing general mechanism and this would otherwise be a silent contradiction. Asserted in the sweep |
| **Replaced** — content moves from `buildInstrument` to `buildApp` | no stored state moves with it: every control keeps its own `SETTINGS` key, and only the DOM it is appended to changes |
| **Removed** — an app drops `buildApp` | the tab is removed from the rail. If it was the open pane, `currentQuickMode` is stale **within that session only** — the panel is closed on load, and the value is never persisted |
| **Conflict** — `hideRail` names `app` | `hideRail` wins and the tab is hidden even though `buildApp` exists. An app that wants no tab should simply not define the hook; this is the belt-and-braces case |
| **Conflict** — the rail does not fit | `fitUiScale()` already steps `--ui-scale` down until it does, and the Setup pane already explains it. See §5 — this is the real cost |

## 5. The cost, measured

A sixth tier makes the rail taller, and `fitUiScale()` responds by stepping the
therapist's asked-for Control size down until the rail fits. Measured by cloning
a tab into `#tabs` at runtime and reading `uiScaleFit`:

| screen | asked | 5 tabs | **6 tabs** |
|---|---|---|---|
| 1920×1080 | 1.00 | 1.00 | **1.00** |
| 1920×1080 | 1.50 | 1.50 | **1.30** |
| 1600×900 | 1.25 | 1.20 | **1.10** |
| **1366×768** | 1.00 | 1.00 | **0.90** |
| 1280×720 | 1.00 | 0.95 | **0.85** |

**On the room's projector at 1920×1080 the cost is nil at Control size 1.0.**
On 1366×768 it drops below 1.0 — `--control` 56px → 50px, `--target` 64px →
58px, under the floors Phase 1 set. That is a real accessibility cost on a small
screen, not a cosmetic one, and it is the reason §6 matters.

## 6. Three things that go with it

1. **Only apps that need it get the tab.** Six apps have no app content and stay
   at five tabs, paying nothing: Fluid Keys, Fluid Paint, Flock, Slime, Game of
   Life, Sweep Chimes.
2. **The rail's hidden scrollbar is fixed.** `#rail` is `overflow-y:auto` with
   `scrollbar-width:none`, so at a short window Setup and Lock simply vanish with
   no affordance at all. Survivable at five tiers; not at six.
3. **Voice Visuals' "Hearing you now"** (Sensitivity, Extra boost) is microphone
   *input*, not app content. It goes to `Setup → Access` via `Anim.setupExtras`,
   and Voice Visuals keeps five tabs.

## 7. Which apps, and what their tab is called

**Gain a tab (11):**

| app | tab | what moves onto it |
|---|---|---|
| Song Grid | `🎵 Song` | Song, How it plays, Repeat when finished, Your songs |
| Big Switch Songs | `🎵 Song` | Song, Each press plays…, Start again, Your songs |
| Music Bubbles | `🫧 Bubbles` | Bubbles, Song, Little goals, Drift, speed, size, density |
| Echo Bird | `🦜 Bird` | Bird game, Calls come from, Notes per call, Bird speed |
| Conductor | `🪄 Conduct` | What to conduct, Path, Pitch, Guide *(motion settings → Access)* |
| Beat Builder | `🏗 Beat` | Sounds, Steps in the loop, Tempo, Swing, Clear the beat |
| Drum Pads | `🥁 Pads` | Pads in one row / in a grid, and the edit hint |
| Sampler Pads | `📼 Pads` | its pad controls |
| Soundscape | `🌧 Scenes` | Scene, the mixer, Remember the mix |
| Chord Strummer | `🎸 Chords` | Chord buttons offered, Strum when a chord is chosen |
| Voice Visuals | — | *no tab: its content is mic input and goes to Access* |

**Keep five tabs (6):** Fluid Keys, Fluid Paint, Flock, Slime Mould, Game of
Life, Sweep Chimes.

Every one of those apps then gets the same Notes tab: `appendTuning(el, …,
{heading:false})`, plus its note-count slider where it has one.

## 7b. What building it changed

**Three apps have no tuning at all.** Drums, Sampler and Voice Visuals never
touch `scale`, `rootNote` or `octave` — a drum kit has no key. The design above
gave them an app tab and left the Notes tab in place, which would have shipped
**an empty pane** in three apps.

So `hideRail` was generalised: a name in it that matches a `PANE_IDS` key now
**removes that tab and its pane**, exactly as the app tab is removed when
`Anim.buildApp` is absent. Removed, not hidden — a hidden tab still costs a rail
tier through `fitUiScale()`, which is the whole point of the exercise.

Final tab counts, measured:

| tabs | apps |
|---|---|
| **6** | Beat Builder, Big Switch, Bubbles, Conductor, Echo Bird, Song Grid, Soundscape, Strummer |
| **5** | Drums, Sampler *(no Notes)*; Flock, Fluid Keys, Fluid Paint, Life, Slime, Sweep Chimes *(no app tab)* |
| **4** | Voice Visuals — no app tab *and* no Notes tab: its only settings were microphone input, which went to `Setup → Access` |

**Only eight apps pay the sixth-tier cost**, not the eleven the design assumed,
and every one of the seventeen still reaches Control size **1.00** at
1920×1080.

**One bug the migration nearly shipped, twice.** A control moved onto the app
pane that still called `buildInstrumentPanel()` rebuilds a pane it is no longer
on. Caught by asserting no `buildInstrumentPanel` survives in any moved block —
and it still slipped through once as a *bare reference* with no parentheses
(`makeChips(…, buildInstrumentPanel)` in Strummer), which the text replacement
did not match. Both are fixed; the lesson is that the check has to be "does the
identifier appear at all", not "does the call appear".

## 8. Acceptance

- Every app's **Notes** tab contains only Register, Scale, Starting note and (if
  the app has one) the note count. Asserted for all 17.
- The app tab appears **only** where `Anim.buildApp` is defined, and is the
  **first** tab where it appears.
- `hideRail:['app']` hides it even when the hook exists.
- The 21 pages load clean; the 170-render pane sweep shows nothing overflowing
  the strip at Control size 1.0 and 1.5.
- `uiScaleFit` on a 1920×1080 screen is **1.00 at asked 1.00** for every app,
  six tabs or five.
- No `SETTINGS` key added, changed or removed; a preset saved before this change
  loads and behaves identically.
- The rail shows a visible affordance when it overflows.
