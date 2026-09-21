# Pane grouping — a proposal to review, not a spec

**Status:** **the sweep is NOT being done** — see "What was decided" below. The
goals fail state it uncovered *has* been fixed. Prototype: `prototypes/panel-groups.html`.

## What was decided — 2026-08-30

The user asked whether this was worth doing at all. Recommendation, agreed:

- **Fix the Bubbles goals fail state** — done, and it was never really a UI change.
- **The schema `group:` field** for the five visual apps — optional, not done.
- **Drop the 17-pane sweep.** The panes were already sorted in Phase 4d/4e, when
  the tuning-on-the-wrong-tab faults were fixed and the tabs got their meanings.
  What is left is therapist-facing polish, it costs vertical space on panes that
  already scroll (a box is ~26–30px at 100% menu size, ~45px at 150%), and four
  boxes around eight controls is fragmenting rather than grouping.
- **Spend the time on the per-element canvas audit instead**, before the room
  install.

**What would reopen it:** therapists actually getting lost in these panes —
hunting for a control, or setting the wrong one. That is the user's observation to
make, not something a probe can find.

The rest of this document is kept as the worked proposal, so reopening it costs
nothing.

You asked whether I need to be told what groups with what, or whether I can work
it out. I can — this is every control of every pane, read out of the code and
sorted. **But you should review it rather than write it**, because a group is a
claim about what a therapist thinks of as *one thing*, and that is your knowledge,
not the code's. Reviewing a list is much cheaper than writing one.

---

## The rules I applied

1. **A group box is a rounded rect holding everything that belongs to one
   heading.** One control on its own does not get a box — a box around a single
   chip row is noise.
2. **A tab holds only what is contextual to that mode.** Anything shared lives
   *outside* the tabs, in its own group.
3. **Tabs only where every tab has something of its own.** An empty tab panel is
   worse than no tabs. Bubbles looked like a counter-example until the user
   pointed out that Little goals is a Free pop setting — see below.
4. **Nothing moves between panes.** This is grouping only. `Notes` stays Register,
   Scale, Starting note, note count; the tabs keep their meanings.

---

## Where tabs actually earn their place

I checked which controls are gated on a mode. **Only two panes gate anything**:

| app | gate | what is behind it |
|---|---|---|
| `bubbles` | `inSong()` | the song picker, and the importer |
| `conductor` | `inTrace()` | the importer |

Everywhere else the mode chips change what the *activity* does, not what the pane
offers — so a tab would frame nothing. **That is the finding: grouping helps every
pane; tabs help two.**

### Bubbles — resolved, and it found a bug

My first pass said Free pop had nothing of its own, so its tab would be empty.
**The user's question settled it: "the little goals are part of free pop, are they
not?"** They are — and the code proves it rather than merely agreeing.

In song mode a bubble's note comes from the song (`b.idx = notes[p][0]`,
`bubbles.html`), but `pickTarget()` chooses the target colour uniformly from *all*
note columns. **So `Song bubbles` + `Pop the colour` can set a target the song
never plays: a goal that can never be completed, the meter never fills and the
celebration never comes.** That is a fail state, and "no fail states" is a
non-negotiable. `Fill the rainbow` is milder but still wrong there — it adds a
second progress meter and a second celebration beside the song's own.

**So `Little goals` and `Pops to fill the meter` are Free pop settings**, gated on
`!inSong()` exactly as `Number of notes` already is. Both tabs then have something
behind them and the rule works on this pane after all.

**This is a behaviour change, not just a layout one** — it removes a control from
song mode — so it needs saying out loud rather than arriving inside a UI tidy-up.

---

## The proposed groups

Group names are suggestions; the split is the thing to check. Controls not listed
stay where they are, ungrouped.

### Bubbles — `bubbles.html`
| group | controls |
|---|---|
| **Free pop** *(tab)* | Little goals · Pops to fill the meter |
| **Song bubbles** *(tab)* | Song · Add your own song |
| **Drift** *(outside the tabs)* | Drift · Drift speed |
| **The bubbles** *(outside the tabs)* | Bubble size · How many bubbles |

Note **Drift speed is a drift setting but size and count are not** — your sketch
grouped "drift and below", which would bundle three unrelated things.

### Song Grid — `song_grid.html`
| group | controls |
|---|---|
| **The song** | Song · Add your own song |
| **How it plays** | How it plays · Speed · Repeat when finished |
| **The next note** *(Visuals)* | Spotlight the next note · Next-note pulse |

### Big Switch — `big_switch.html`
| group | controls |
|---|---|
| **The song** | Song · Add your own song |
| **How it plays** | Each press plays… · Phrase speed · Start again when finished |

### Echo Bird — `echo_bird.html`
| group | controls |
|---|---|
| **The game** | Bird game · Calls come from |
| **The song** | Song · Add your own song |
| **How it plays** | Notes per call · Bird speed |

### Drum Pads — `drums.html`
| group | controls |
|---|---|
| **Pad layout** | Pads in one row · Pads in a grid |
| **Backing track** | Backing track (from this computer) · Backing volume |
| **Effects** *(exists as a heading already)* | Reverb · Echo · Mute · Volume |
| **On screen** *(Visuals)* | Drum icons on pads · Show hits during playback · Layer timeline |

### Sampler Pads — `sampler.html`
| group | controls |
|---|---|
| **Pad layout** | Pads in one row · Pads in a grid |
| **Effects** | Reverb · Echo · Mute · Volume |
| **Pad colours** *(Visuals)* | Pad colours · Pad colour strength · Icons on pads |

### Sweep Chimes — `sweep_chimes.html`
| group | controls |
|---|---|
| **Effects** | Reverb · Echo · Chorus · Mute · Volume |
| **Shape the sound** | Brightness · Attack · Ring |
| **When the chimes move** | Knocking sounds · Breeze strength |
| **The sweep** *(Visuals)* | Sweep trail · Touch ripples |

### Chord Strummer — `strummer.html`
| group | controls |
|---|---|
| **Chord buttons offered** | the chord toggles · Strum when a chord is chosen |
| **Effects** | Reverb · Echo · Chorus · Mute · Volume |
| **Shape the sound** | Brightness · Ring · Louder with faster sweeps |

### Soundscape — `soundscape.html`
| group | controls |
|---|---|
| **Effects** | Reverb · Echo · Mute · Volume |
| **Winding down** | Wind-down time |
| **On screen** *(Visuals)* | Slider colours · Moving pictures · Icons under the sliders |

### Voice Visuals — `voice_visuals.html`
| group | controls |
|---|---|
| **The picture** | Style · Visual intensity · Colour |
| **The microphone** *(Setup → Access)* | Sensitivity · Extra boost |

### Conductor — `conductor.html` *(delisted)*
| group | controls |
|---|---|
| *(tab or chips)* | What to conduct → Path to trace, Add your own song |
| **Movement** | Motion sensitivity · Seconds of stillness |
| **The trail** *(Visuals)* | Baton trail · Trail persistence |

Movement is the pair you already flagged as *input* settings that belong in
`Setup → Access`. Grouping them does not settle that; it just stops them floating.

### Beat Builder — `beat_builder.html` *(delisted)*
| group | controls |
|---|---|
| **The loop** | Steps in the loop · Tempo (BPM) · Swing (shuffle feel) |

---

## The five schema apps — and why they gain most

`life`, `flock`, `slime`, `fluid_paint` and `fluid_sensory` declare their controls
as a flat `schema` array, which the framework renders as **one undifferentiated
run under a single heading** (`framework.js:1640`). They are the longest, least
structured panes in the product.

| app | proposed groups |
|---|---|
| **Game of Life** | **The grid**: Speed · Cell Size — **Your touch**: Brush Size · Shape — **Look**: Colour Mode · Ghost Trail · Glow — **Sound**: Birth Notes |
| **Flock** | **The swarm**: Agents · Speed — **How they flock**: Cohesion · Separation · Alignment — **Your touch**: Touch pull · Repel — **Look**: Trail length · Glow size |
| **Slime** | **The mould**: Speed · Trail Width — **Your touch**: Touch Rays · Touch Size · Repel — **Look**: Brightness · Colour |
| **Fluid Paint** | **The paint**: Brush size · Flow force — **Look**: Trail persistence · Swirl · Glow · 3D shading — **On its own**: Ambient drift |
| **Fluid Keys** | **The paint**: Brush size · Flow force · Trail persistence |

**This is the cheap half of the build.** Add an optional `group:'The grid'` to a
schema item, and have the renderer box consecutive items that share one — five
apps grouped by editing five arrays, with no per-app pane code at all.

---

## What I would build, if you agree

1. **`.gbox` in `framework.css`** — the generalised `.tabpanel`, rounded, with the
   colour you pick from the prototype. Plus a `group` field in the schema renderer.
2. **The five schema apps**, by adding `group:` to their arrays.
3. **The hand-built panes**, in the order above.
4. **Tabs in Bubbles and Conductor only**, once you have chosen the Bubbles route.

Each step is independently testable, and step 2 is most of the visible gain.

## Open questions for you

1. ~~**Bubbles**: tabs or not?~~ **Settled — tabs.** `Little goals` is a Free pop
   setting, which fills the tab and fixes a real fail state at the same time.
2. ~~**Panel colour**~~ **Settled — white 5%**, "Darker still".
3. **Group names**: I have written what I think a therapist would call each set.
   These are guesses about your vocabulary and are the most likely thing to be
   wrong.
