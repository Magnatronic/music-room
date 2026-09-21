# UAT — Phase 9b: the five MIDI prototypes become apps

Branch `phase-9b-midi-apps`. Nothing is on `main` until you pass this.

**What changed.** Loop Garden, Creatures, Mirror, Weather and Big Chords are now
real apps rather than bench prototypes: same rail, same tabs, same words as MIDI
Light, and each with four looks and three parameters per look. Pulse is gone.
The five new ones share a new file, `midi.js`; MIDI Light keeps its own copy.

**Section E is new** — it is the connect fault you hit, now fixed in both files.

**Where to start.** Open `index.html` → **Plug in an instrument**. There are six
tiles now. Plug the MPK in before you open one; the permission prompt still
appears every time.

**If you have no instrument to hand**, every check below marked 👆 works with a
finger or a mouse on the screen alone — that is the point of them.

---

## A. The launcher and the shape of the menus

| # | Do this | Expect |
|---|---|---|
| A1 | Open `index.html` | **Plug in an instrument** lists six: MIDI Light, Big Chords, Loop Garden, Creatures, Mirror, Weather |
| A2 | Open each of the five new ones in turn | Each loads to a black screen with the rail on the left. No error, no flash of anything |
| A3 | In each, open the first tab (🌱 Loop / 🐟 Pond / 💬 Turns / 🌤️ Sky / 🎹 Chords) | Top of the pane is a **🔌 Connect to MIDI** button and one line of status — the same block, in the same place, in all five |
| A4 | Press Connect and allow | The button **disappears** and is replaced by `✓ <your device>` and what it saw (🎹 keys / 🥁 pads / 🎛️ knobs) |
| A5 | Open **Notes** in each | Register, Scale, Starting note, How many notes — and **no "Up / down means…" row** anywhere. That row is deliberately absent: these apps put how hard you played on the up/down axis |
| A6 | Open **Sound** in each | The ordinary voice row, Effects, Volume, Shape the sound — nothing app-specific has leaked in |
| A7 | Open **Visuals** in each | Palette, Brightness, Size, then a heading naming the **current look** and exactly three sliders under it |
| A8 | Change the look on the first tab, then go back to Visuals | The heading and the three sliders have **changed to that look's own**. Move one, switch look, switch back — your value is still there |
| A9 | Anywhere you see a control you think does not belong on that app | **Tell me.** Making every menu item relevant was the brief |

---

## B. Touch lands where you touch 👆

This is the one I most want you to be hard on. **No instrument needed.**

| # | Do this | Expect |
|---|---|---|
| B1 | Loop Garden, shape **🎡 Wheel**: touch near the top-left of the circle | A seed appears **exactly under your finger** — not near it, not offset |
| B2 | Keep touching at points around the circle | You are laying out a pattern by hand. Each seed sounds again as the moving hand sweeps past it — so **where you touched decided when it plays** |
| B3 | Try the same in **🪐 Orbit**, **🌼 Bloom**, **🎗️ Ribbon** | Under the finger in every one. In Ribbon the timeline runs left→right instead |
| B4 | Creatures: touch anywhere | A creature hatches **at the finger** and then swims off |
| B5 | Creatures → Visuals → **How much they move** → all the way down to *still* | New ones stay exactly where you put them |
| B6 | Mirror: touch anywhere | The mark appears at the finger and drifts **upward** (yours). Do a few, stop, and it answers below the line |
| B7 | Weather: touch anywhere | The bloom is at the finger. Touch fast and hard-ish and watch the sky darken |
| B8 | Big Chords: touch low, then high on the screen | The tower **stands on your finger** — its base is where you touched, and it grows upward |
| B9 | Repeat B1–B8 with the **menu strip open** and again with **Setup → Reach area → Size** at about 50% | Still under the finger in both. This is where it has gone wrong before |

---

## C. Each app does its own thing

### C1. Loop Garden — it keeps going when you stop
1. Play four or five notes and take your hands off.
2. They should keep coming round, **a little quieter each pass**.
3. First tab → **A note lasts** → *Fades fast* / *Never fades*. Hear the difference.
4. **Once round takes** → 8 seconds vs 32 seconds.
5. Visuals → **The track** → drag to 0. The rings and the sweeping hand vanish; the notes still come round.
6. 🧹 **Empty** on the rail clears the wheel.

### C2. Creatures — a note becomes a thing
1. Play a note. Something hatches and then **sings on its own, in its own time**.
2. Play five or six. They drift out of step; it turns into a texture with nobody playing.
3. **Hold a key down.** Yours grows while you hold it, and when it sings it sings **lower**.
4. Try all four looks: 🐟 Fish, 🎐 Jelly, ✨ Sparks, 🐛 Wiggle.
5. **How long they live** → *Short lives* vs *Forever*.
6. 🧹 **Empty** clears the pond, and everything goes quiet.

### C3. Mirror — a turn, not a test
1. Play a short phrase and stop. It waits, then **answers**.
2. It should keep your **rhythm** and change the notes. It should never sound like a right-or-wrong repeat.
3. Try all five of **How it answers**: a little higher, upside down, carries on, backwards, a quiet shadow.
4. **Before it answers** → *Answers quickly* vs *Waits a long time*.
5. Yours appear above the line, its own below with a ring round them.
6. Visuals → **Say whose turn it is** off. The captions go; the two halves still tell you.
7. Play *while it is answering*. It should ignore you until it has finished, then take you.

### C4. Weather — the reward for stopping
1. Play hard and fast for ten seconds. The sky should build to a storm.
2. **Stop.** Watch it blow over on its own. That is the whole app.
3. **When you stop** → *Settles slowly* vs *Settles very fast*.
4. All four skies: ⛈️ Storm, ❄️ Snow, 🔥 Embers, 🌊 Sea.
5. Play *gently and slowly*: stars, not rain.
6. Visuals → **How much the sky changes** to 0. The background stops moving; the rain and stars still answer.
7. 🕊️ **Settle** on the rail brings it straight back to calm.

### C5. Big Chords — one finger, a whole chord
1. Press one key **gently** — one note. Press one key **hard** — a full chord.
2. It should be in tune with itself every single time, wherever you press.
3. Change **Scale** on the Notes tab (Major → Minor → Pentatonic). Still in tune, in the new key.
4. **How big the chord is** → *Always 3* / *Always 4* / *Always 5* / *Single notes*, for a student who cannot vary how hard they press.
5. Press at the **very top** of the keyboard. You should get a *different* chord, not the same one as the note below it.
6. All four looks: ▮ Towers, 🪟 Panes, 🎆 Bloom, 🌈 Arcs.
7. **Look hard at Towers for dark lines between the slabs.** There were some; they should be gone.

---

## D. The things a room needs

| # | Do this | Expect |
|---|---|---|
| D1 | In each app, play a handful of notes then press 🔇 **Silence** | Everything stops at once |
| D2 | Hold a chord in Big Chords and **unplug the instrument** | Nothing keeps sounding |
| D3 | Plug it back in without reloading | It is noticed; play and it works |
| D4 | Lock the session (🔒) in each app and play | Still plays; the rail is gone |
| D5 | Open two of them in two windows and play both | Both work. Neither steals the instrument from the other |
| D6 | **Setup → ↺ Reset all settings** in one of them | Back to defaults; the others are untouched (settings are per app) |
| D7 | Save a **Preset** in one, change everything, load it back | Everything comes back, including the look and its three sliders |
| D8 | Leave one running for a few minutes with nothing played | It goes quiet and stays quiet. Nothing sounds for ever |

---

## E. When the instrument will not connect (Phase 9c — the fault you hit)

This is the one that made you restart the PC. The pane sat on **"Asking for
permission…"** and never moved: `requestMIDIAccess` never answered, and with no
timeout the app waited for ever while showing a message that reads as normal.

Fixed in **both** places — `midi.js` (the five new apps) *and* `midi_light.html`,
which has its own copy of the same code and would otherwise still hang.

**You cannot easily make it hang on purpose**, so most of this is reading what it
now says rather than reproducing the fault. Check it in **MIDI Light** and in one
of the five, because they are two separate pieces of code.

| # | Do this | Expect |
|---|---|---|
| E1 | Open MIDI Light, first tab, press **🔌 Connect to MIDI** and *don't* answer the prompt yet | The line reads **"Asking for permission — choose Allow on the prompt at the top of the window."** It now tells you where the prompt is |
| E2 | Still without answering, wait **ten seconds** | The line changes by itself to **"Still waiting. If no prompt appeared, the instrument or Windows may be stuck: unplug the instrument and plug it in again. If that does not help, restart the PC."** |
| E3 | Now press **Allow** | It connects normally — `✓ MPK mini …`. The waiting text goes. A slow answer must not break it |
| E4 | Repeat E1–E3 in **one of the five new apps** (Loop Garden will do) | Identical wording, identical behaviour. Two files, one set of words |
| E5 | Press Connect, and while the prompt is still up press **Connect again** | The escalated "still waiting…" text appears **immediately** rather than at ten seconds. Pressing it a third time does nothing worse |
| E6 | Press Connect and **refuse** the prompt (Block) | **"Permission refused. Press Connect and choose Allow."** — and only for an actual refusal |
| E7 | Throughout all of the above, touch the screen | The activity still plays. Waiting for MIDI never freezes the picture |
| E8 | If the fault ever comes back | The message should now tell you what to try. **Tell me what it said** — the wording is the whole fix, and if it did not help you it is wrong |

**What I could not test:** the real hang. It has not recurred since your restart,
and it cannot be provoked on demand — I faked a request that never answers, which
exercises our side of it but is not the same as Windows actually wedging. So E1–E2
prove the app now escalates; only the fault recurring proves the advice is right.

---

## F. What I checked myself, and what I could not

**Checked, driving the real pages in Edge:**

- 28/28 pages load clean from `file://` — 0 page errors, 0 console errors, 0 failed requests, in **Edge and Firefox**.
- **Phase 9c, all six apps**: with `requestMIDIAccess` stubbed to never answer,
  each shows the asking message, escalates at 10 s, stays responsive to touch,
  and starts no second request on a second press. A non-permission rejection
  reports its own error rather than claiming a refusal; `NotAllowedError` still
  says refused; an ordinary connect is unchanged. Nothing is persisted.
- Every app: panes contain what they should and nothing else; a faked two-port
  controller's notes arrive, sound, and draw in all four looks.
- **The touch measurement**: the light lands within 0.000–0.008 of the point
  clicked, on both axes, in all five. (This took three tries — the first two
  measurements were reading the apps' own captions and washes rather than the
  mark. Recorded in `PHASE-9-MIDI.md` §10.)
- **Nothing sounds for ever**: five notes held and released, then a note-on with
  no note-off followed by All Notes Off — voice count back to 0 in all five.
  Creatures keeps singing after a release *by design*; emptying the pond takes it
  to 0, which is how I distinguished that from a stuck note.

**Not checked, and only you can:**

- **Any of it on your real MPK**, which is where the last round's two-ports fault
  came from. Everything above used a fake controller.
- **How any of it looks on the room's projector**, and whether four looks per app
  is genuinely four useful ones or two good ones and two also-rans. Tell me which
  ones to cut.
- **Whether the parameter ranges are right.** They are my guesses. If a slider
  does too little at one end or is unusable at the other, say which.
- **Whether Mirror's replies actually sound like replies** on a real instrument,
  and whether four seconds is long enough to wait for a student who is slow to
  finish a phrase.
