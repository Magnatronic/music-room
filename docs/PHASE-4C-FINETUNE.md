# Phase 4c — remove the Fine-tune drawer

**Status: UAT-passed 2026-08-26** and merged; the branch is gone. Designed and
built 2026-08-25. See §11 "As built".
**Trigger:** touches `framework.js` and `framework.css`, which all 17 apps see.
**Belongs to:** `IMPROVEMENT-PLAN.md` §2 part **c** — the last part of the rework.

---

## 1. What the drawer is — corrected scope

The plan describes *the* Fine-tune drawer, in the Visuals panel. **There are two,
and they share one piece of state.**

| | Built by | Contents | Never empty? |
|---|---|---|---|
| **Visuals** | `appendFineTune` (`framework.js:1029`), called from `buildVisualsPanel`'s two branches (`framework.js:1043`, `framework.js:1066`) and from 12 apps' own `buildVisuals` | paint trails, paint colours, press FX, background colour, or an app's `Anim.schema` | **no** — see §3 |
| **Sound** | `makeDrawer` directly (`framework.js:1143`) | "Shape the sound" — Brightness, Attack, Ring | yes, always 3 sliders |

Both are built by `makeDrawer` (`framework.js:1013`) and both read and write the
same module-scope boolean.

### State cardinality

- **`fineTuneOpen` (`framework.js:1012`): exactly one, per page load, shared by
  both drawers.** Opening Fine-tune in the Sound pane opens it in the Visuals
  pane at that pane's next rebuild, and the reverse. It is session-only — never
  written to `localStorage`, never captured by a preset. After this phase:
  **zero.**
- **`details.finetune` elements: 0 or 1 per pane render, never more.** No app
  calls `makeDrawer` or `appendFineTune` twice, and no app calls `makeDrawer`
  directly. After this phase: **zero, in every pane, in every app.**
- **Persisted keys added, changed or removed: none.** This phase touches no
  `SETTINGS` key, no preset blob, and no `localStorage` entry. There is nothing
  to migrate, so a v1.0.0 preset loads unchanged.

---

## 2. What was measured

Headless Edge, `file://`, viewport **1920×1080**, all 17 activities, at
`--ui-scale` **1.0** and **1.5**. Scripts in the session scratchpad
(`measure-finetune.js`, `measure-sound.js`); 0 `pageerror` and 0 `console.error`
across both sweeps.

Columns: **today** = pane height with the drawer shut, which is what a therapist
first sees. **open** = with it opened. **flat** = the height after this phase.
**strip** = `#strip` client height, i.e. what fits without scrolling.

### Visuals pane

| app | mode | scale | today | open | flat | drawer rows |
|---|---|---|---|---|---|---|
| beat_builder | flow | 1.0 / 1.5 | 147 / 213 | 147 / 213 | 69 / 97 | **0** |
| big_switch | notes | 1.0 / 1.5 | 209 / 306 | 209 / 306 | 131 / 190 | **0** |
| bubbles | flow | 1.0 / 1.5 | 209 / 306 | 209 / 306 | 131 / 190 | **0** |
| conductor | flow | 1.0 / 1.5 | 352 / 520 | 352 / 520 | 302 / 446 | **0** |
| soundscape | notes | 1.0 / 1.5 | 377 / 558 | 377 / 558 | 327 / 484 | **0** |
| strummer | flow | 1.0 / 1.5 | 209 / 306 | 209 / 306 | 131 / 190 | **0** |
| sweep_chimes | flow | 1.0 / 1.5 | 333 / 492 | 333 / 492 | 255 / 376 | **0** |
| voice_visuals | flow | 1.0 / 1.5 | 1081 / 1612 | 1081 / 1612 | 1031 / 1538 | **0** |
| drums | notes | 1.0 / 1.5 | 333 / 492 | 449 / 666 | 399 / 592 | 1 |
| echo_bird | notes | 1.0 / 1.5 | 209 / 306 | 325 / 480 | 275 / 406 | 1 |
| sampler | notes | 1.0 / 1.5 | 478 / 709 | 594 / 883 | 544 / 809 | 1 |
| song_grid | notes | 1.0 / 1.5 | 679 / 1011 | 795 / 1185 | 745 / 1111 | 1 |
| fluid_sensory | notes | 1.0 / 1.5 | 241 / 360 | 549 / 822 | 499 / 748 | 3 |
| fluid_sensory | flow | 1.0 / 1.5 | 559 / 837 | 980 / 1467 | 930 / 1393 | 5 |
| slime | flow | 1.0 / 1.5 | 495 / 741 | 1275 / 1908 | 1225 / 1834 | 9 |
| fluid_paint | either | 1.0 / 1.5 | 559 / 837 | 1302 / 1949 | 1252 / 1875 | 9 |
| life | flow | 1.0 / 1.5 | 559 / 837 | 1489 / 2230 | 1439 / 2156 | 10 |
| flock | flow | 1.0 / 1.5 | 559 / 837 | 1537 / 2300 | 1487 / 2226 | 11 |

### Sound pane

`drums`, `sampler`, `soundscape`, `strummer`, `sweep_chimes` and `voice_visuals`
take the pane over with `Anim.buildSound` and have no drawer. The other **11**
all get the same one:

| | today | open | flat |
|---|---|---|---|
| **1.0** | 632–1044 | 977–1389 | 899–1311 |
| **1.5** | 850–1564 | 1366–2080 | 1250–1964 |

### Four things the measurement settled

1. **Eight of the twelve apps render an empty drawer.** `bodyChildren === 0`,
   body height 0. A **64px** (1.0) / **96px** (1.5) row labelled "Fine-tune"
   that opens onto nothing. This is regression damage: those apps' only
   Fine-tune contents were Performance and Show-performance, moved to the Setup
   pane on 2026-08-24 (`framework.js:1031`), and nothing replaced them. Named:
   `beat_builder`, `big_switch`, `bubbles`, `conductor`, `soundscape`,
   `strummer`, `sweep_chimes`, `voice_visuals`.
2. **Flattened is shorter than opened, in every row of both tables.** The
   summary and the drawer's own margin come out and nothing goes back in
   (§4). Worst case `flock` at 1.5: 2300 → 2226.
3. **The drawer is not what keeps a pane on screen.** At 1.5 the Sound pane
   already overflows 1080 *with the drawer shut* in 6 apps (1564 vs 1080), and
   `voice_visuals`' Visuals pane overflows at 1.0 (1081 vs 1080) with no drawer
   content at all. Scrolling the strip is the existing, Phase-1-widened
   mechanism (`framework.css:164`, 14px thumb), not a new cost this phase
   introduces.
4. **1.5 fits the rail on a 1080 screen** — `uiScaleFit` returned 1.50 for the
   asked 1.50 in all 17 apps. The worst-case column is a real configuration, not
   a hypothetical one.

---

## 3. "One control per row" is already done

Phase 1 did this half and the plan was not updated. `makeSlider` → `.row`,
`makeToggle` → `.toggle`, `makeChips` → its own wrapper: one control each. The
only multi-control container is `.swrow` (`framework.css:305`) and its three
uses each hold exactly one control — `framework.js:943` (the one-colour picker),
`framework.js:996` (background colour), `voice_visuals.html:909`.

**Part c is therefore only "remove the drawer".** No row layout changes.

---

## 4. The decision: flatten in place, add no heading

My first instinct was to replace each `<summary>Fine-tune</summary>` with an
always-open `.sectn` heading, to keep the grouping while losing the hiding.
**The measurement killed that.** Every group inside both drawers already carries
its own `.sectn`:

- Visuals / Keys — `Paint trails`, `Paint colours`, `When a key is pressed`
- Visuals / Flow — `Anim.sectionLabel || 'Controls'` (`Brush & Flow`, `Life`,
  `Flock`, `Simulation`)
- Sound — `Shape the sound` (`framework.js:1144`)

A "Fine-tune" heading above those would be a heading whose only children are
headings. The one control with no heading of its own is **background colour**
(`appendBgControl`, `framework.js:995`), which today relies on the drawer for
context; it gets a `.sectn` of its own reading **`Background`**.

So: **delete the `<details>`, append its children where it stood.** Every group
keeps the heading it already has, and `.sectn` is legible now — Phase 1 took it
from 11px uppercase at 0.35α to `--font-xl` at weight 700, full ink
(`framework.css:174`). The pane becomes navigable by heading, which is what that
Phase 1 change was for.

### Resulting order — everyday first, set-once below

| pane | above | below |
|---|---|---|
| Visuals / Keys | Key look, Note letters on screen | Paint trails, Paint colours, When a key is pressed, Background |
| Visuals / Flow | Paint trails, Paint colours, Style | *(app section)*, Background |
| Sound | Voice, Effects, Volume | Shape the sound |

Nothing moves *up* past an everyday control. A therapist who wants only "Paint
colours" scrolls no further than today; a therapist who wants "Ring" is one
scroll instead of one tap plus one scroll.

---

## 5. Lifecycle — a settings group's placement in a pane

The thing this phase models is **where a group of controls sits in a pane**, now
that "inside the drawer" is no longer a place.

| | |
|---|---|
| **Added** | A new group is appended by `buildVisualsPanel` / `buildSoundPanel` / an app's `buildVisuals`, with its own `.sectn` heading. Everyday groups go above the set-once ones; there is no container to choose, only a position. |
| **Changed** | Editing a group's contents is a local edit — no drawer to keep in sync, and no shared open/closed state to preserve across the rebuild. `fineTuneOpen` existed only because a rebuild would otherwise snap the drawer shut mid-edit (`framework.js:1010`); with no drawer, a rebuild is invisible. |
| **Duplicated** | Two groups may legitimately carry the same heading in different panes (`Effects` appears in `buildSoundPanel` and in `soundscape.html`'s `buildSound`). Headings are text, not identifiers; nothing keys off them. Two groups with the same heading **in one pane** is a content bug, not a framework one, and the sweep in §8 lists headings per pane so it is visible. |
| **Replaced** | An app replacing the framework's Visuals pane (`Anim.buildVisuals`, 12 apps) or Sound pane (`Anim.buildSound`, 6 apps) takes on placement itself. After this phase it has one fewer helper to call and no drawer semantics to reproduce. |
| **Removed** | Removing the last control from a group must remove its heading too. **This is the bug being fixed**: Performance moved out on 2026-08-24 and left eight headed-but-empty drawers. The framework cannot enforce it — an app appends its own children — so §8's sweep asserts "no heading with nothing under it" across all 17 apps × 5 panes as a standing gate. **The gate catches the shape this bug takes after this phase, not the shape it took before it**: an empty `<details>` is a container with an empty `<div>` in it, which reads as populated; an empty `.sectn` group is two headings in a row, which does not. Flattening is what makes the bug detectable — that is worth as much as removing the eight drawers. |
| **Conflict** — an app appends to the position the framework also uses | Last writer wins, as today; `buildVisualsPanel` returns early when `Anim.buildVisuals` exists (`framework.js:1035`), so the two never both run. Unchanged by this phase. |

---

## 6. The change, file by file

**`framework.js`**
1. Delete `fineTuneOpen`, `makeDrawer`, `appendFineTune` (lines 1006–1030) and
   the comment block above them.
2. `buildVisualsPanel`, Keys branch (1043–1049): unwrap — append paint trails,
   colour controls, press FX and background directly to `el`.
3. `buildVisualsPanel`, Flow branch (1066–1077): unwrap the same way.
4. `buildSoundPanel` (1143–1149): unwrap; keep the `Shape the sound` heading.
5. `appendBgControl` (995): prepend a `.sectn` reading `Background`.

**`framework.css`**
6. Delete `details.finetune` and its four sub-rules (176–187), comment included.

**The 12 apps** — 12 one-line edits:
7. Delete the bare `appendFineTune(el);` line in the **8** apps listed in §2.4
   (`beat_builder.html:238`, `big_switch.html:131`, `bubbles.html:278`,
   `conductor.html:335`, `soundscape.html:946`, `strummer.html:320`,
   `sweep_chimes.html:432`, `voice_visuals.html:921`).
8. In the **4** with one row (`drums.html:589`, `echo_bird.html:201`,
   `sampler.html:573`, `song_grid.html:165`), replace with the direct
   `el.appendChild(makeChips(…'pressFx'…))`.

**One orphaned word**
9. `voice_visuals.html:866` builds its own heading `'Fine-tune ' + mode label`
   ("Fine-tune Mandala"). With no Fine-tune anywhere else, drop the prefix and
   let it read as the style's name.

---

## 7. Risk

Confined to the settings strip. It does not touch:

- the input path — `toLocal`, `toSim`, `onDown`, `onMove`, `fitSurface`;
- the geometry of `#surface` or anything `Anim.resize` sees;
- `localStorage`, presets, or any saved blob (§1 — no key added, changed or
  removed).

A student never sees the strip: `applyLock()` hides the chrome, and during play
it is either closed or locked. **No raw pixel sizes are introduced** — the
flattened rows use `.sectn`, `.row`, `.toggle` and `.chips` as they stand.

The plan rates part c "medium". On this evidence it is the **lower**-risk of the
two remaining phases: Phase 3 changes what is stored per student, where a bad
migration costs a therapist their saved setups.

---

## 8. Acceptance criteria

1. **No `details.finetune` exists** in any pane of any of the 17 apps, at
   `--ui-scale` 1.0 and 1.5, in both Keys and Flow where the app allows both.
2. **No heading with nothing under it** — every `.sectn` in every app × every
   pane is followed by at least one control before the next heading. Asserted by
   sweep, and it is the gate that would have caught the 2026-08-24 regression.
3. **Every control that was in a drawer is still reachable**, with the same
   label, in the same pane, and changing it still does what it did — checked
   per group, not per app.
4. **All 20 pages load clean** from `file://`: 0 `pageerror`, 0 `console.error`,
   0 failed requests (the `UAT-PHASE-0.md` baseline).
5. **A v1.0.0 preset loads unchanged** and every setting it carries still
   applies — the no-migration claim in §1, tested rather than asserted.
6. **Pane heights match the `flat` column** of §2 within a row's height, at both
   scales.

---

## 9. Docs to update in the same branch

- `APPS.md:51–52` — the "Fine-tune drawer" bullet, and `APPS.md:66` ("the Sound
  pane's Fine-tune drawer").
- `.claude/skills/verify/SKILL.md:40` — "Set-once controls are inside
  `details.finetune` and need the `summary` clicked first" stops being true, and
  a verification skill that clicks a thing that is gone is worse than one that
  says nothing.
- `IMPROVEMENT-PLAN.md:370` — part c's entry, plus §2's table row (its "12 apps
  / medium" estimate, and the fact that the drawer count was two).
- `README.md` — only if it names the drawer.
- `UAT-PHASE-1.md:97` mentions it as well; that is a **record of a past test**
  and stays as written.

---

## 10. Out of scope

Deferred from part d and still deferred: the three modals (`framework.js:837`,
the pad editors in `drums.html` and `sampler.html`) and the emoji in the rail
chrome. Also out: narrowing the 460px strip (`IMPROVEMENT-PLAN.md` §Phase 3b/3c
— it needs Phase 1's pane-fit measurements redone first), and anything in
Phase 3 or Phase 5.

---

## 11. As built — 2026-08-25

Built on `phase-4c-finetune` exactly as designed. Two things the design got
slightly wrong, both recorded rather than quietly corrected.

### The gates, and what they returned

Sweep of **17 apps × 5 panes × 2 scales × both modes = 180 pane renders**, run
once against a `git worktree` at `v1.0.0` with every drawer force-opened, and
once against the branch, then diffed. Scripts in the session scratchpad
(`sweep.js`, `preset.js`).

| # | Criterion | Result |
|---|---|---|
| 1 | No `details.finetune` anywhere | **none in 180 renders** (baseline had 1 in 78 of them) |
| 2 | No heading with nothing under it | **none**, before or after |
| 3 | Every control still reachable, same label, same pane | **PASS** — see below |
| 4 | All 20 pages load clean from `file://` | 0 `pageerror`, 0 `console.error`, 0 failed requests |
| 5 | A v1.0.0 preset loads unchanged | **PASS** — 36-key blob saved on the tag, loaded on the branch, 13/13 tuned settings restored, name intact, `uiScale` correctly *not* restored |
| 6 | Pane heights match §2's `flat` column within a row | **PASS** — worst deviation 80px against a 96px row |

**Criterion 3 in full.** Across all 180 renders exactly **two** distinct labels
disappeared, and both are the point of the phase:

- `Fine-tune` — the drawer summary, 78 renders;
- `§ Fine-tune 💠 Mandala` — `voice_visuals`' own heading, now `§ 💠 Mandala`.

Nothing else was lost. The only thing gained is `§ Background`.

### Where the design's arithmetic was off

§2's `flat` column ran **25–80px short** on the Visuals pane — consistently, and
in one direction. The estimate subtracted the summary and the drawer's spacing
but did not add the margins of the new `Background` heading (`.sectn` is
`22px × --ui-scale` above, `10px` below). The Sound pane, which gains no heading,
came in at **−1px** against the estimate in every app: `flock` 1346 predicted /
1345 actual, `beat_builder` 1964 / 1963.

So the estimator was right about the mechanism and wrong about one term.
Every pane is still shorter than the state it replaces — `flock` at 1.5 went
2300 opened → **2264** flattened.

### `Anim.lockMode` is not always a string

`framework.js:130` reads it as one (`typeof Anim.lockMode==='string'` sets the
mode); `framework.js:1035` reads it as a flag (`!Anim.lockMode` picks the
branch). Apps use **both** forms, so some apps have a `lockMode` that pins the
Visuals pane to the Flow branch without pinning `SETTINGS.mode`. Nothing here
depends on it and nothing was changed, but the two sweeps disagreed on which
apps were mode-locked until this was chased down, and the next person measuring
per-mode behaviour will hit it too.
