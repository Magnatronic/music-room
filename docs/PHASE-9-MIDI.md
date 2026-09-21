# Phase 9 — MIDI: a physical way in

**Status: SHIPPED. Six apps on the launcher under "Plug in an instrument"** —
`midi_light.html` (Phase 9, v1.12.0) and, from Phase 9b (§10), Big Chords,
Loop Garden, Creatures, Mirror and Weather. **Five of them share `midi.js`;
MIDI Light predates it and duplicates it** (§9c). Two
prototypes remain for reference: `prototypes/midi-bench.html` (what is plugged
in, and what is it saying) and `prototypes/midi-aurora.html` (the first playable
style).

**Built:** Aurora, Fireworks, Ripples, Bloom, Constellation, Splash, Static
swell — each with its own three parameters on the Visuals pane. **Cut:** Ribbon.
It made a tune visible, which was the argument for it, and the user did not like
it; an idea that is interesting on paper and unloved on screen is not a feature.

### What the build changed about this document

- **One range PER CHANNEL, not one for the app.** §6 asked whether two *devices*
  should share a range. The real case arrived first and is sharper: one
  controller's pads and keys are separate instruments on separate channels, and
  sharing a range crushes the pads into the bottom column of the keyboard's span.
  That is what "the pads seem different" was.
- **Colour is derived when a mark is DRAWN**, not when its note arrived. An
  auto-range only knows what it has seen, so a run played upwards makes every
  note the new maximum and all land on the top column. Pitch cannot be
  recomputed — a sounding note must not change key under a player's hand.
- **The range must settle when the note ARRIVES**, not at the next frame, for the
  same reason.
- **Persistence is a separate layer, and it must composite `source-over`.** An
  additive layer that is never cleared climbs to white and stays there.
- **A sustain-first style still has to answer a tap**, or a student who only taps
  is looking at a blank screen.
- **The Notes pane must not offer *Up / down means…***. This app puts the
  velocity on y, so that row would let a therapist silently break it.

---

## 1. What it is for

**Both the student and the therapist play it.** Not because two-at-once is new — the
framework has taken five simultaneous touches since Phase 0, so they can already share
Fluid Keys or Drum Pads. What is different here is that the two are at **different
surfaces**: one at the instrument and one at the screen, so neither has to reach across
the other, and a student who cannot reach the screen at all can still play. The therapist
plays a phrase; the student answers on the pads; the screen belongs to both.

But the reason it earns a place is narrower and more useful than "MIDI is fun":

> **A MIDI instrument is another route in.**
>
> A drum pad is a large physical target with resistance and a rebound. A weighted
> key gives feedback that glass never will. For a student who cannot organise a
> touch on a flat screen — who slides, who leans, who needs to feel where the
> edge of a thing is — a pad may be reachable when the projector is not. That
> puts MIDI alongside the gamepad pointer and the reach area as an access route,
> not alongside Drum Pads as another instrument.

That framing decides the arguments later in this document. When "what looks best"
and "what a student can reach" disagree, reach wins, exactly as it does in
`PHASE-7-REACH-AREA.md`.

### What it is NOT for

- **Not a performance tool.** No sequencer, no recording, no tempo sync, no
  MIDI clock. `0xF8` and friends are read and thrown away.
- **Not a General MIDI player.** The room's sound is the framework's voices;
  the instrument sends gestures, not timbres.
- **Not device-specific.** Nothing may be tuned for one controller. See §2.

### The prototype bench, and what became of it

Six throwaways went into `prototypes/`, none on the launcher, all sharing
`prototypes/midi-core.js` — the connect/dedupe/one-port/auto-range/scale-snap
plumbing, so each file was only its idea. **A shipped app must never load that
file.**

Five were kept and built as framework apps in **Phase 9b** (below). **Pulse was
discarded** and its file deleted: a beat to play along with is the one idea here
that a student can be *behind*, and softening that into "never scored" left an
app that mostly ticked.

| | idea | what it is for | now |
|---|---|---|---|
| `midi-loop.html` | **Loop Garden** — a note joins a wheel of time and comes round again, fading a little each pass | the piece keeps playing when you stop | `midi_loop.html` |
| `midi-creatures.html` | **Creatures** — a note hatches something that swims and sings its own note | joint attention: a sound you can point at | `midi_creatures.html` |
| `midi-mirror.html` | **Mirror** — it waits, then answers with your rhythm and different notes | turn-taking without a memory demand | `midi_mirror.html` |
| ~~`midi-weather.html`~~ | ~~**Weather**~~ — **REMOVED 2026-09-01 at the user's request**: they did not like it. Built, shipped into Phase 9b, polished in 9d, then cut. The file is deleted; it is recoverable from git history if it is ever wanted back | — | — |
| `midi-chords.html` | **Big Chords** — one finger, a whole chord; velocity decides how big | the smallest act, the biggest result | `midi_chords.html` |
| `midi-pulse.html` | **Pulse** — a beat to play along with | rhythmic entrainment | **discarded** |

---

## 2. The non-negotiable: it works with anything

**We do not know, and will not know, what will be in the room.** A therapist may
arrive with a borrowed 25-key controller, an eight-pad box, a wind controller or
something nobody in this project has heard of. So:

> **No behaviour may depend on identifying the device.**

A MIDI port offers a name, a manufacturer, an id and a state. **There is no field
that says "drum pad".** Any classification is therefore a guess, and this app is
built so that a wrong guess costs nothing — see §4, which removes the need for
the guess almost entirely.

Three failures this rules out, all of which the prototypes hit before the rule
was written down:

| Tempting | Why it fails |
|---|---|
| Map the eight pads by name | "USB MIDI Device" is a real product name |
| Assume 88 keys and lay the screen out for them | Eight pads on notes 36–43 land in a thumbnail at the far left |
| Assume channel 10 means drums | True for the Akai, not a standard anyone is obliged to follow |

### And the corollary: ANY KEY, never THAT key

The room does not know the instrument, so it also does not know **where the keys
are** — how many octaves, where middle C sits under a hand, whether the pads are
above or below. The note range can be learned by listening. The layout cannot.

> **No activity may ask a student to press a PARTICULAR key.**

That rules out a whole family of ideas that sound good on paper — showing a
picture of a keyboard, lighting the next note of a song for the student to find,
asking for a phrase to be echoed back at pitch. Each needs a screen-to-keyboard
map this app can never have, and each fails on the first borrowed controller.

What survives is everything where **any key will do**:

- **the app supplies the pitch and the student supplies the timing** — any key
  plays the next note of a song, which is Big Switch Songs' model and is
  guaranteed to succeed on any instrument ever plugged in;
- **rhythm rather than pitch** — echo a rhythm back on any keys at all;
- **direction rather than position** — lower on the instrument is lower on the
  screen, which needs only the range, and the range IS learned.

---

## 3. Three layers, so a new style is an afternoon

```
MIDI in ──▶ THE READER ──▶ hit / hold / release / control ──▶ A STYLE ──▶ screen
                │                                                  │
          auto-range, scale-snap,                        knows nothing about MIDI
          de-duplicate, panic
```

**The reader** is the only part that knows MIDI exists. It turns any message into
a small neutral vocabulary:

| Event | Carries |
|---|---|
| `hit(pos, colour, force, id)` | `pos` 0..1 across the screen, `colour` from the pitch class, `force` from velocity |
| `hold(id)` / `release(id, heldFor)` | the note is still down / how long it was down |
| `control(slot, value)` | a learned knob, 0..1 |

**A style** consumes only those. It cannot be broken by an unusual instrument
because it never sees one. This is Voice Visuals' architecture with MIDI in place
of the microphone, and that app already carries nine styles off one input.

---

## 4. The rule that removes the guessing

> **A note's own LENGTH decides whether it is an impact or a sustain — not the
> device it came from.**

A tapped pad is 20 ms. A held chord is two seconds. That is directly observable,
per note, with no knowledge of the instrument, and it adapts to the player as
well as the device: a student who stabs at a keyboard gets impacts, which is
what a stab should feel like.

So the drum/keys distinction that Phase 9 needs is **free and always correct**,
and device classification is demoted to what it is good at:

- a **hint** shown on screen ("🎹 keys · 🥁 pads · 🎛️ knobs"), so a therapist can
  see the room understood the instrument;
- an **override**, for the one time in twenty it is wrong;
- **never** a gate on behaviour.

### The other two things the reader must get right

**Auto-range.** The screen maps the range actually being played, from a rolling
window of recent notes, so it contracts as well as widens. Eight pads spread
across the whole wall; an 88-key piano does too; a device swapped mid-session is
followed within a few notes. It **snaps** while it is still learning (under ~24
notes) and eases afterwards — easing from the starting guess made the first thing
anyone played slide around for three seconds, which is the worst possible first
impression for a thing whose whole claim is that you plug it in and it works.

**Scale-snap.** The incoming note picks a **degree of the therapist's scale**, not
a pitch. This is the same promise the rest of the suite makes — a student cannot
play a wrong note — and it means a drum pad, which has no musical pitch at all,
makes music rather than a low cluster. An **As played** option exists for a
therapist who wants the instrument's own tuning.

**And it costs no framework change.** Because a snapped note IS a scale degree,
and the framework's notes are scale degrees, a MIDI note maps straight onto a
column: `pluckNote((col + 0.5) / NOTES.length, 0.5, force)`. The Sound tab's
voice, effects, volume and Shape-the-sound macros all apply for free — the same
route Sound Match uses.

---

## 5. The styles

Named for what they **reward**, because that is how a therapist chooses one. Every
style handles both a short note and a held one; the family says which it is
*about*.

### Impact — the hit is the event
*A pad, a stab, a student who needs to see that they did that.*

| | |
|---|---|
| **🎆 Fireworks** | A burst at the note, then embers that fall and fade. Velocity is the size of the burst. Held notes keep a fountain going. The loudest possible "you did that". |
| **💧 Ripples** | Rings spreading from each hit, crossing and interfering. Drum hits are what this is for. Cleared and redrawn each frame, so no rings can build up as artefacts. |
| **🎨 Splash** | Each note throws paint that **stays**. Over a session the screen becomes a painting the student made — something to look at at the end, and to keep. The only style with a memory. |

### Melody — the shape of the playing is the event
*Keys, a therapist playing a phrase, a student watching a tune happen.*

| | |
|---|---|
| **🎗️ Ribbon** | One continuous line drawn left to right, its height following the note and its thickness the velocity. **A tune becomes a shape you can see.** The strongest idea here: it makes melody visible rather than notes, and it is the one a therapist can point at. |
| **✨ Constellation** | Each note is a star; notes played close together are joined by lines. A chord is a shape, a phrase is a path. The picture persists a while, then fades. |
| **🌈 Aurora** | Columns of light, pitch across the screen, velocity the height. Polyphony reads as chords of light. Built already, and the safe default. |

### Sustain — holding is the event
*Drones, regulation, wind-down.*

| | |
|---|---|
| **🌫️ Static swell** | A field of specks whose density follows what is held. Chosen deliberately: **static has no gradient, so it cannot band or ghost**, which is the fault that took four attempts to remove from Soundscape. |
| **🫧 Bloom** | Soft circles that open on a note and keep breathing while it is held, overlapping in their own colours. The calm end of the list. |

**Build first: Aurora (done), Fireworks, Ribbon, Static swell** — one from each
family, and Ribbon because it is the idea that does not exist anywhere else in the
suite. The rest are cheap once the reader is right.

### What the knobs do

Not a visual. **The therapist tunes the room from a physical box while the student
is at the screen** — no reaching past them, no menu, no taking the picture away.

Knob numbers differ per device, so they are **learned in the order they are
turned**: the first knob touched becomes Brightness, the second Trail, the third
Density, and a label appears on screen the first time each is learned, so it
documents itself. Works with any controller and needs no setup.

---

## 6. Lifecycle

The rows that get forgotten are replacement, two-at-once, and inheritance. Phase 7
shipped a fault by omitting exactly the last one.

| Event | What must happen |
|---|---|
| **A device arrives** mid-session | Bound and named quietly. No modal, nothing interrupted; a student mid-note is not stopped. |
| **A device is unplugged** mid-note | **Its held notes are released.** Otherwise a drone continues with nothing to stop it, in a room, with no cable attached. |
| **A device is replaced** | The auto-range and the learned knob map **reset**. Otherwise a 25-key controller inherits an 88-key layout and plays into a fifth of the screen. |
| **Two devices at once** | Both play. **Each keeps its own range**, so the therapist's keyboard and the student's pads both use the whole screen rather than the pads being crushed into a corner of the keyboard's span. *(Open question — see §9.)* |
| **One instrument, several ports** | The Akai MPK mini IV presents **four**. All are bound, because there is no way to know which carries the keys, and an identical note within 15 ms is treated as one press. |
| **A device that never sends note-off** | Every note times out. Nothing may sound for ever because a device forgot. |
| **A note-on repeated without a note-off** | Retrigger, do not stack a second voice on the same key. |
| **`All notes off` (CC 120/123)** | Always obeyed. |
| **The session locks** | Playing continues — Lock hides the chrome, it does not stop the instrument. |
| **Idle sleep** | Held notes are released before the loop sleeps. |
| **The next person to use this machine** | **Inherits nothing.** The range and the knob map describe what was plugged in today, exactly as a reach area describes where a chair is today. They are not saved. The style, the scale and the voice ARE settings and do persist. |

---

## 7. What the therapist sees

Standard rail, standard panes. This app adds:

- **`🎹 MIDI` tab** — Connect; the device and what it looks like; the style
  picker; the override for the hint; a **Silence** button.
- **Notes tab** — unchanged. It is the scale the snapping targets.
- **Sound tab** — unchanged. It is the voice every note plays.
- **Visuals tab** — the current style's own two or three controls, and nothing
  that the style cannot honour.

**Connect is a button, not something that happens at load.** Web MIDI needs a
permission, and the prompt appears on **every** connect because a `file://` origin
does not persist it. That is the same bargain Voice Visuals already makes for the
microphone and the room lives with it — but a prompt that appears on its own, with
a student already at the screen, is a prompt nobody reads.

---

## 8. Acceptance criteria

1. All pages load clean from `file://`: 0 `pageerror`, 0 `console.error`, 0 failed
   requests.
2. **Eight pads on notes 36–43 spread across the whole screen**, and an 88-key
   range does too, with nothing configured.
3. A chromatic run played into a pentatonic scale produces only pentatonic
   degrees; **As played** leaves it alone.
4. A note held for two seconds and a note tapped for 20 ms produce visibly
   different events **in every style**.
5. Unplugging the instrument mid-note leaves nothing sounding.
6. A note-on with no note-off times out.
7. One press arriving from two ports of the same instrument makes one event.
8. MIDI clock and active sensing produce nothing.
9. Playable with no MIDI at all — the computer keyboard row drives it, so the app
   is never a dead screen.
10. Locked, it still plays; at the default reach area, still pixel-perfect.

---

## 9. Open questions

1. **Two devices: one range or two?** Recommendation above is two. The cost is
   that the same note from two instruments lands in different places, which may
   read as a bug rather than a feature when both are keyboards.
2. **Does `Splash` keep its painting across a Deal/Clear?** If the picture is the
   point, clearing it needs to be deliberate — and possibly worth saving.
3. **Should velocity be soft-able?** A student who can only hit hard, or only
   softly, gets one size of everything. A "flatten velocity" access setting would
   sit with the other per-student input settings in `Setup → Access`.
4. **Is the permission prompt acceptable long-term?** An Edge policy could
   pre-grant MIDI for `file://` on the room PC. Not tested; it touches machine
   policy and is the user's call.

---

## 10. Phase 9b — the five become apps

Shipped 2026-09-01. The prototypes were standalone pages on their own synth; the
five kept ones are now framework apps with the same menu grammar as MIDI Light.
`prototypes/midi-core.js` stays where it is, for the bench only.

### `midi.js` — the second shared file

Six apps were about to carry six copies of the reader, and six wordings of the
same three menu rows. So the plumbing moved into **`midi.js`**, a top-level file
loaded with `<script src>` **after** `framework.js`, exactly the way `songs.js`
is shared by four song apps. That precedent is the whole justification: it is not
a new mechanism, it is the existing one used a second time.

It carries the reader (one port per device, one range per channel, the timeouts
and the panic paths), the translation (a note is a column; `stepBy` moves by
scale degrees), the shared menu blocks (Connect, `Notes played`, palette, the
Notes pane), and `PX`/`PY`. **It never draws.**

**A change in `midi.js` is five changes — and usually a sixth edit next to
it.** It joins `framework.js` under the design-doc trigger in `CLAUDE.md`.
MIDI Light was already shipped when this file was written and was deliberately
not migrated, so it holds its own copy of the same reader. That saved a
re-verification then and cost a near-miss later: Phase 9c fixed a hang in
`connect()` and had to fix it twice. **If a future phase touches the reader
again, migrating MIDI Light onto `midi.js` is the cheaper end of the trade.**

### Lifecycle — what happens to a MIDI app's stored state

| event | what happens |
|---|---|
| a look/style/shape/sky is added | its parameters come from the table's defaults; nothing stored changes |
| one is renamed or removed | `SETTINGS.sp[<gone>]` is simply never read again; `pv()` falls back to the current look's defaults, so nothing breaks and nothing is silently wrong |
| a parameter is added to a look | `pv()` returns its default until the therapist moves it |
| two apps disagree about a shared key | they cannot: `SETTINGS` is per filename (`settings:<file>.html`) |
| a preset saved before a look existed is loaded | the look falls back to the app's default; the preset's other keys apply |
| **the next person to use the room PC** | they inherit the last therapist's look, parameters and palette, the same as every other app — and, as everywhere, `Setup → ↺ Reset all settings` clears it. Nothing here is per-student, so nothing here needs the reach area's treatment |

### The one rule that had to be re-learned per app

**A touch lands where it is touched.** Every app takes the framework's point and
paints on it, and each had its own way of getting that wrong:

- **Loop Garden** inverted the wheel in the 0..1 the framework hands over. The
  wheel is round *on the screen*, so a fraction of the width is not a fraction of
  the height, and the seed landed a tenth of a screen from the finger. Inverting
  in pixels fixed it.
- **Big Chords** grew its tower from the foot of the screen. It now stands ON the
  point.
- **Mirror** stepped every mark a little off the middle line so it would not
  start on it — including the ones a finger had already placed.
- **Creatures** and **Weather** were right first time, because `PX`/`PY` in
  `midi.js` do the work.

Measured in Edge at 1440×900 against the point clicked, the light lands within
0.000–0.008 of it on both axes in all five.

### Measuring it took three attempts, and the first two lied

The centroid of the whole canvas said Mirror was 17% out. It was not: these apps
paint chrome that appears only *once something has been played* — a wash over
half the screen, a "your turn" caption, a track ring — and every one of those is
bigger and brighter than the mark. Raising the threshold moved the error to the
caption. Two touches and a difference removed the chrome but caught the first
mark drifting between snapshots. What finally works is **one touch on a still
screen** — movement off, caption off — differenced against the frame before it.

Which is the rule already in `.claude/skills/verify/SKILL.md`, met for a third
time: *a probe that cannot produce a clean reference has not shown the thing is
fine, it has shown the probe is wrong.*
