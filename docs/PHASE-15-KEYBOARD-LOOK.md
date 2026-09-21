# Phase 15 — the keyboard look

**Status: a PLAN, no code written.** It touches `framework.js`/`framework.css`
and what is stored per student, so the doc comes first.

The request: keep **Boomwhacker as the default**, add **mono / high contrast**,
and maybe **bold** and **muted** variants — for the apps that show a keyboard.

---

## 1. Which apps this is actually about — three

The first version of this plan said thirteen. That counted apps in note *mode*.
The user's correction — *"some apps, whilst they have notes, don't actually
display a keyboard as they are more about the effects"* — is right, and it is
measurable: count the keys each app puts on screen at rest.

| app | keys drawn | is a key a NOTE? | |
|-----|-----------|------------------|---|
| **Song Grid** | 6 | yes | Boomwhacker belongs here |
| **Echo Bird** | 5 | yes | Boomwhacker belongs here |
| **Fluid Sensory** | 5 | yes | on the launcher as *"🎹 Fluid Keys — paint with sound on a playable canvas"* |
| Soundscape | 8, all at zero opacity | yes | *lines only* — the grid is not seen |
| Drums | 4 | **no** | pads. **Already opted out** — its own colour per drum, its own icons |
| Sampler | 6 | **no** | pads holding recordings. **Still coloured by pitch class** |
| everything else (17 apps) | **0** | — | effects; the notes are heard, not shown |

That last group includes all five MIDI apps, Big Switch, Sound Match, Bubbles,
Strummer and Sweep Chimes. **Nothing in this phase should touch any of them.**

**The user's second correction — "drums and sampler don't really need
Boomwhacker as they are not note related" — is right, and half of it is already
true.** Drums overrides `Anim.bandColor` and `Anim.bandLabel` to colour each pad
by its drum and label it with an icon. Sampler does not: it is `noVoices:true`
with the comment *"recordings ARE the sound"*, and yet `colorMode:'note'`, so a
pad holding a recorded dog bark is coloured as though it were a C. That is a
mismatch rather than a preference, and it is small: **Sampler needs what Drums
already has.**

So the keyboards this phase is really about are **three** — Song Grid, Echo Bird
and Fluid Sensory — plus Soundscape's unseen grid. None of them overrides the
framework's colour, so **all of the work lands in `framework.js` and none of it
needs an app to cooperate.**

*A suspicion recorded because it was wrong:* Fluid Sensory declares no `mode` at
all and inherits the framework's `mode:'notes'`, which looked like an accidental
keyboard in a painting app. It is not — the launcher calls it "Fluid Keys" and a
playable canvas is the whole point. Checked before it reached the plan as a
finding.

---

## 2. The problem is the opacity, not the palette

Keys are drawn at `rgba(var(--c), 0.18 + row*0.04)` over the background. Two
separate measurements, and neither points at the colours.

**Against the background** — WCAG asks 3:1 for a large graphical element:

| C | D | E | F | G | A | B |
|---|---|---|---|---|---|---|
| 1.12:1 | 1.23:1 | 1.38:1 | 1.23:1 | 1.22:1 | 1.12:1 | 1.18:1 |

**Between neighbouring keys** — what tells one key from the next:

| C–D | D–E | E–F | **F–G** | G–A | A–B |
|-----|-----|-----|---------|-----|-----|
| 1.10:1 | 1.13:1 | 1.12:1 | **1.01:1** | 1.08:1 | 1.06:1 |

### Song Grid already has four alternative palettes, and none of them helps

`song_grid.html` has carried a `keyTheme` setting for some time — **prism**,
**pastel** (Boomwhacker lightened toward white), **ocean** and **mono** (a
greyscale ramp), falling through to framework Boomwhacker by default. It is very
nearly the feature being asked for, already built, in one app. Measured at the
resting tint:

| theme | worst key vs background | worst neighbour pair |
|-------|------------------------|---------------------|
| boomwhacker | 1.12:1 | 1.01:1 |
| prism | 1.11:1 | 1.00:1 |
| pastel | 1.28:1 | 1.01:1 |
| ocean | 1.07:1 | 1.03:1 |
| **mono** | **1.22:1** | **1.04:1** |

**Even `mono` — a light-to-dark greyscale ramp, which is what "high contrast"
sounds like — is 1.22:1.** That is the finding that reframes the whole request.

### Why: the alpha is a ceiling no palette can pass

Every key is multiplied by 0.18 over black before anyone sees it:

| alpha | worst key vs background | worst neighbour |
|-------|------------------------|-----------------|
| **0.18 (today)** | 1.12:1 | 1.01:1 |
| 0.45 | 1.54:1 | 1.05:1 |
| 0.75 | 2.46:1 | 1.07:1 |
| **0.90** | **3.13:1** | 1.08:1 |
| 1.00 | 3.66:1 | 1.08:1 |

Boomwhacker needs **alpha ≈0.90** to clear 3:1 — essentially opaque keys. This
is the same shape as Waves' hard clamp and Lava's 8-bit fade: **a structural
ceiling, where tuning the wrong parameter can never reach the target.**

And the second column never moves. **Neighbour contrast is 1.01 → 1.08 across
the entire range**, because the hues have similar luminance. No opacity, and no
choice of palette that keeps the Boomwhacker association, separates F green from
G teal.

---

## 3. The change — strength and separation, not new colours

| | what it is | measured |
|---|---|---|
| 🌈 **Boomwhacker** | **default, unchanged** | as today |
| 🔆 **Bold** | the same hues at high opacity, with **alternating lightness** — every other key darker | neighbour pairs **1.01 → 2.31:1**, and **1.85:1 under simulated deuteranopia**. C is still red, D still orange: the link to the physical Boomwhackers survives |
| 🌫 **Muted** | the same hues, softer than today | for sensory sensitivity |
| ◐ **High contrast** | alternating light/dark **plus a visible gap between keys** | separation stops depending on colour at all — it works for every palette, every kind of colour-blindness, and low vision alike |

**Alternating the lightness is the whole trick**, and it is worth stating plainly:
you cannot separate two colours of equal luminance by making them brighter, but
you can by making every other one darker. It costs nothing and keeps the hues.

**One change helps every palette at once**, including Song Grid's four: the line
between keys is `1px rgba(255,255,255,0.10)`, which is invisible. A wider, more
opaque separator makes keys distinct **without any colour maths** — the cheapest
accessibility win here, and it needs no new setting.

### Acceptance criteria

Measured off a screenshot of the running keyboard, not off the numbers going in:

- Boomwhacker renders **byte-identically** to today in all three note apps.
- Bold: worst neighbour pair ≥2:1, and ≥1.5:1 under simulated deuteranopia.
- High contrast: worst neighbour pair ≥4.5:1 with the gap visible at 1280×800.
- Muted: still ≥1.3:1 between neighbours — softer, not invisible.
- Song Grid's own `keyTheme` still works and is not overridden.

---

## 4. Lifecycle

| event | what happens |
|-------|-------------|
| added | `colorMode` gains `bold`, `muted`, `contrast`. `note`/`theme`/`single` keep their exact meanings. |
| changed | keys recolour on the next `buildBands()`; nothing else moves. |
| duplicated | settings are per-file, so two apps can differ. Existing, intended. |
| removed | if a variant is ever dropped, `colorMode` clamps to `note` — the pattern the framework already uses for retired press effects and voices. |
| **inherited** | **the next therapist at that room PC gets the previous one's setting.** No new mechanism — but a high-contrast keyboard could read as a fault to someone who did not choose it. The Setup pane should name the current key colour where they will see it. |

---

## 5. Deliberately not in this phase

- **The palette consolidation.** Four palettes are copy-pasted across sixteen
  declarations and have **not** drifted; there is no fault there today, only the
  conditions for one. It is invisible maintenance work and can wait.
- **Any per-app hook.** The moment this needs something adding to every app it is
  the switch-access story again, and it gets dropped.
- **Redesigning the palettes' colours.** That is a judgement, and judgements get
  built and shown one at a time.

---

## 6. Built — three looks ✅

*"You are complicating this. I just want boomwhacker keys. A muted version and a
lines only / black and white / mono something that works well for contrast."*

`Key look` offers exactly three:

| | what it is | worst key vs background |
|---|---|---|
| 🌈 **Boomwhacker** | the instruments' own colours, **full strength**, separated by a dark gap | **3.39:1** (was 1.12:1) |
| 🌫 **Muted** | the keyboard exactly as it was | 1.12:1 |
| ◐ **Mono** | white keys, black separators, no hue | **16.19:1** |

**`Lines only` and `Invisible` are gone from the row.** Invisible duplicated what
switching to flow mode already does. Both values still *work* — the three apps
that hide their keyboard set `zoneLook:'off'` in their own defaults and never
show this row, which is guarded by `!Anim.lockMode`. Checked before cutting.

**The shadow on the note letters is gone.** With full-strength keys the letter
does not need it; it takes black or white from the key's measured luminance.

### The dimming idea, abandoned — twice wrong

Alternating the brightness separated neighbours beautifully and was wrong both
times it was tried:

1. **On the column index** — the first C bright, the second C dark on an 11-key
   scale. The same note in two colours, which is the one thing the Boomwhacker
   convention cannot survive. *The measurement that approved it used a six-key
   scale, where no note appears twice.*
2. **On the note's degree in the scale** — which fixed that, and still failed.
   Dimming a colour does not make a quieter version of it, **it makes a different
   colour**: D is hue 28° at 53% lightness and reads as orange; at 0.35 it is the
   same hue at 18% and reads as **brown**. *"D looks brown rather than orange."*
   The palette was right the whole time; the dimming was wrong.

Nothing is dimmed now. Every key is its own colour and the **dark separator**
does the separating — which is also what makes it work for a colour-blind
student, since it does not depend on colour at all.

### The palette is correct

Checked against the standard mapping: C 0° red, D 28° orange, E 50° yellow,
F 127° green, G 180° teal, A 267° purple, B 330° pink, all at 39–62% lightness.

---

## 7. Order

0. **The separator between keys.** One line of CSS, helps every palette in every
   app including Song Grid's four, needs no setting and no decision. Do this
   first and it may be most of the win.
1. **Bold** — alternating lightness at high opacity. The one with a number to hit.
2. **High contrast** — alternating light/dark plus the gap.
3. **Muted** — easiest to judge once the others exist.
4. **Sampler's pads stop pretending to be notes** — the same shape as Drums, and
   independent of everything above.

One at a time, shown after each.
