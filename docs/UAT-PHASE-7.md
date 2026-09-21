# UAT — Phase 7: the reach area

Branch **`phase-7-reach-area`**. **✅ All steps passed 2026-08-31.** Two things
changed after that pass, both from the user, and **only those two need re-checking**
before it merges:

- **step 10** — the surround is now **black** whenever a reach area is set;
- **step 13** — **a reach area no longer survives a page load**, so one therapist's
  setup can never be inherited by the next therapist's student. This one was a real
  fault and it is the more important re-check.

**What it is:** `Setup → Reach area` shrinks the whole activity and lets you drag
it to where a student can reach. Nothing is cropped — the activity is mapped into
the rectangle, so every note and every corner is still there, just smaller and
somewhere else.

**Best done on the projector**, with the room set up as you would for a session.
A laptop is fine for steps 1–8; steps 9–12 are the ones that want the wall.

---

### 1. Nothing changed until you ask it to

Open any app. It should look **exactly** as it did before — same size, same
position, chrome open and closed.
**Expected:** no visible difference at all. If anything moved, stop here.

### 2. Find it

`⚙️ Setup` → scroll to **Reach area**, between *Access* and *Menu size*.
**Expected:** a **Size** slider reading 100%, a **Place it** switch (off), and a
**🖥️ Fill the screen** button.

### 3. Make it smaller

Drag **Size** down to about 50%.
**Expected:** the activity shrinks smoothly, staying in the middle, and the space
around it goes **black**. Nothing is cut off — count that every note/pad is still
there.

### 4. Move it

Turn **Place it** on.
**Expected:** a dashed outline appears round the activity, everything outside it
dims, and a message says *"Drag the activity to where the student can reach"*.
Now drag the activity to the bottom-left.
**Expected:** it follows the drag live, the outline follows with it, and — the
one that matters — **no notes sound while you drag**.

### 5. Play it where you put it

Turn **Place it** off. Tap the activity where it now sits.
**Expected:** it plays normally again, and **the note you get is the note under
your finger**. Try the far corners of the shrunken activity, not just the middle.

### 6. Try to break the floor

Drag **Size** all the way to the left, and drag the activity hard into a corner
and keep pushing.
**Expected:** Size stops at **25%** and will not go smaller; the activity always
stays fully on screen and never disappears off an edge.

### 7. The way back

**🖥️ Fill the screen**.
**Expected:** straight back to full size, centred, in one press. It should be
reachable without turning Place it on first.

### 8. Lock

Set a reach area you like, then **🔒 Lock**.
**Expected:** the menus vanish, the activity **stays exactly where and how big
you put it**, and playing it still gives the right notes. Hold the top-left
corner of the *screen* for 3 seconds.
**Expected:** it unlocks as it always has — that corner is unaffected by where
the activity is.

### 9. The one it is for

On the projector, with the student in their chair: set a size and drag the
activity into the rectangle they can actually reach. Lock it.
**Expected:** they can reach every part of the activity. **This is the only step
that decides whether the feature is right** — the rest just checks it is not
broken.

### 10. The surround — ✅ answered, and changed

You said black, so it is black. The rule now: **any reach area below 100% paints
the space around the activity black**; at 100% it stays the step off the app's
own background that makes the edge visible with the settings strip open. The two
cases want opposite things and the difference is who is looking — you with the
chrome open, or the student on the wall.

**Re-check, and it is the only thing outstanding:**

1. Drag **Size** down from 100%. The wall around the activity should go **black
   the moment it leaves 100%**, and come back when you drag it to 100% again.
2. **🖥️ Fill the screen** — the surround comes back with it.
3. **Lock** with a reach area set. The wall stays black; only the activity is lit.
4. On a *light* app background (`Visuals` → background), the same: black around,
   the activity untouched.

### 13. The handover — NEW, and the one that mattered

The fault you spotted: therapist A sets a reach area and leaves; therapist B
launches a link for a different student and gets A's corner. **A reach area is now
reset to full screen on every page load**, so that cannot happen — while anything
that *asks* for one still gets it.

1. Set a reach area (say 30%, bottom-left). Leave the app.
2. Open the same app again — fresh, or from the launcher.
   **Expected: full screen, centred.** Not your 30% corner.
3. From the room PC's control software (or just paste a link), launch
   `song_grid.html?s=voice:synth&lock=1` — a link that says nothing about a reach
   area. **Expected: full screen, locked, ready to play.**
4. Now launch one that *does* ask for it:
   `song_grid.html?s=reachSize:0.35,reachX:0.9,reachY:0.8&lock=1`
   **Expected:** the activity is 35% and over on the right, locked — and the boot
   toast reads **"⭐ Setup from launch link · reach area 35%"**, so anyone walking
   in knows the small activity was meant.
5. **The workflow this is really for:** set a student up including their reach
   area, then `⭐ Presets` → **🔗 Copy launch link**. The link now carries the
   reach area, so the control software can reproduce the whole thing — wall
   position included. Paste it and check it lands where you left it.
6. A preset still carries it too (step 11), so a returning student's setup is one
   tap.

**The cost, and say if it is the wrong trade:** a reload loses a reach area you
have not saved to a preset or a link. Redoing it is one drag; the alternative was
a student getting a screen they cannot use and cannot report.

### 11. It travels with the student

`⭐ Presets` → save a preset with the reach area set. Change the size, then load
the preset back.
**Expected:** the reach area comes back with everything else.

Now switch to a **different app**.
**Expected — and this is a known limit, not a bug:** the reach area does **not**
follow. It is stored per app, exactly like the dwell and the controller setup
already are. Tell me if that is a problem in a real session and it becomes the
next phase.

### 12. Starting fresh

`⭐ Presets` → **↺ Defaults**.
**Expected:** back to full screen, centred.

---

## What I verified myself, and how

Driven with Playwright against the real `file://` pages, not read off the code.

| | result |
|---|---|
| All 21 pages load clean — 0 pageerror, 0 console.error, 0 failed requests | **PASS**, in **Edge and Firefox** |
| Transform identical to `main` at the defaults — every framework app, chrome open / closed / locked | **PASS 57/57** across 19 apps |
| A tap lands on the right note — 5 size/position combinations × 3 points, error measured in screen pixels | **PASS**, worst error **under 1.5px** |
| The same fractions of the activity give the same notes shrunk as full-size | **PASS** |
| A tap outside the activity plays nothing | **PASS** |
| Place drag moves it, enters no pointer, sounds no voice; outline tracks the activity to under 1px | **PASS** |
| Placing ends on closing the pane, on locking, and on loading a preset | **PASS** |
| 25% floor, and on-screen clamp even from a value that bypassed the clamp | **PASS** |
| Locked honours the reach area; locked at 100% is still exactly `scale(1)` | **PASS** |
| Preset carries it; a pre-Phase-7 preset resets it to full screen; ↺ Defaults resets it | **PASS** |
| A launch link cannot disturb it, and naming it is declined rather than counted as junk | **PASS** |
| Applies with no per-app work — checked in Drums, Bubbles, Strummer, Sweep Chimes, Big Switch | **PASS** |
| Setup pane at Control size 1.0 and 1.5, nothing overflowing the strip | **PASS 36/36** |
| The surround is black below 100% and the app's own step at 100% — through the slider, through Fill the screen, and with no caller asking for the repaint | **PASS** |
| **The handover:** a reach area left on the machine reaches neither a link that omits it nor a plain re-open | **PASS** |
| A link that names one gets it, the toast says so, and a link value is still held to the 25% floor | **PASS** |
| 🔗 Copy launch link carries a reach area, and that link round-trips | **PASS** |

**47/47 behaviour checks.** Two things the probe got wrong first and are recorded
so the next one does not repeat them: `pointers[].x/.y` are already sim
coordinates, and a sample at exactly 0.5 of a six-column grid sits on a cell
boundary where a float either side changes the answer.

**What I could not test:** whether the rectangle actually lands where a student
can reach it. That is step 9, and only you can run it.
