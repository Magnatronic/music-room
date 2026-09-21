# UAT — Phase 10: presets you can carry off the machine

Branch `phase-10-preset-backup`. Nothing is on `main` until you pass this.

**Why this exists.** IT asked where presets and recorded samples are kept. They
are in this browser profile's `localStorage` and nowhere else — no server, no
network. The Sampler could already export its recordings to a `.json`; **presets
could not be exported at all**, so *clear browsing data* or a reimaged PC took
every therapist's saved setup with no way to have kept a copy.

**Where to find it.** Any app → **⭐ Presets** → scroll to **Backup** at the
bottom. It is at the bottom because it is a once-a-term job, not a daily one.

---

## A. Saving

| # | Do this | Expect |
|---|---|---|
| A1 | Save a preset or two in **Drums**, and another in a different app | They appear in each app's Presets list as usual |
| A2 | Presets → **💾 Save all presets to a file** | A **Save as dialog** opens, with `music-room-presets-2026-09-03.json` filled in. **You choose the folder** — put it on the room's USB stick if that suits |
| A2b | **Cancel** that dialog | *"Nothing was saved."* Cancelling must not save the file anyway |
| A2c | Do it again and save it somewhere | It reports the name you chose |
| A3 | Read the line it shows afterwards | It says how many presets, from how many apps |
| A3b | In **Firefox**, press it | Firefox has no Save-as dialog for this, so it goes to the downloads folder instead. Same file either way |
| A4 | Open the file in Notepad | Readable JSON. **You should see the presets from *both* apps** — it saves every app's, not just the one you pressed it in |
| A5 | Look at what is *not* in it | No recordings, no current settings, and **no menu size** — the file must not carry the display's control size between machines |
| A6 | Press it with no presets saved anywhere | It says there are none yet, and downloads nothing |

---

## B. Loading it back

| # | Do this | Expect |
|---|---|---|
| B1 | On the same machine, press **📂 Load presets from a file** and choose the file you just saved | It says everything was **already here**, and the list is unchanged |
| B2 | Press it again with the same file | Same again. Importing twice must never pile up duplicates |
| B3 | Delete one preset with ✕, then import the file again | Just that one comes back |
| B4 | Save a preset called exactly what one in the file is called, but with **different settings**, then import | **Both survive.** Yours is untouched; the one from the file arrives as `name (2)` |
| B5 | Check B4's original still loads *your* settings | It does. An import never overwrites |
| B6 | Have a preset on the machine that is **not** in the file, and import | It is still there. **An import can only add — it never deletes** |

---

## C. Between machines — the point of the whole thing 🖥️

| # | Do this | Expect |
|---|---|---|
| C1 | Copy the `.json` to a second computer (or a different Windows login, or a different browser — each has its own store) | |
| C2 | Open any app there → Presets → **📂 Load presets from a file** | The presets appear, **for every app they came from** — check at least two apps |
| C3 | Load one and play | It applies exactly as it did on the first machine |
| C4 | Check the menu size on the second machine | **Unchanged.** Presets never carry the display's control size |

---

## D. Bad files must not break anything

| # | Do this | Expect |
|---|---|---|
| D1 | Make a text file with junk in it, rename it `.json`, and import it | *"That file is not a preset file. Nothing was changed."* and your presets are untouched |
| D2 | Import some other `.json` — a Sampler kit file will do | *"…not a Music Room preset file."* Nothing changes |
| D3 | Import a very large file (any big `.json`) | Refused for size, before it tries to read it. The page does not hang |
| D4 | After each of D1–D3 | **Every preset you had is still there** |

---

## E. The bit to show IT

| # | Do this | Expect |
|---|---|---|
| E1 | Read the grey text under the Backup buttons | It says it saves every app's presets, that loading only adds, that the file has preset names in it so **initials only**, and that Sampler recordings are saved separately |
| E2 | Confirm with IT where the file lands | The browser's downloads folder. **On a managed PC that may be redirected to OneDrive and synced** — which is the one new thing this feature does that `localStorage` never did |
| E3 | Decide the routine | My suggestion: export at the end of each term and after adding presets for a new student, and keep the file wherever IT backs up |

---

## F. What I checked, and what I could not

**Checked, driving the real pages:**

- All nine acceptance criteria in `PHASE-10-PRESET-BACKUP.md` §7, including
  the Save-as dialog being used where it exists, cancelling saving nothing, and
  a browser without the API still downloading — and that `file://` really is a
  secure context where `showSaveFilePicker` opens in Edge and Chrome but does
  not exist in Firefox. Also:
  export from Drums contains **both** `drums.html` and `sampler.html` presets;
  the file has no `uiScale`, no `locked`, no `settings:` and no `kit:`;
  a clashing name arrives as `(2)` with the original keeping its own settings;
  a machine-only preset survives an import;
  importing the same file twice adds nothing;
  malformed, foreign and future-versioned files are each refused with a message
  and leave storage exactly as it was;
  an imported preset appears in the list and applies its settings when loaded.
- **27/27 pages load clean** in Edge and Firefox.

**Not checked, and only you can:**

- **A second physical machine** (§C). I tested a fresh profile, not another PC.
- **Whether the wording on the pane is right for the people who will use it.**
- **Whether "one file for every app" is the right call.** It is deliberate — the
  failure being insured against is "this machine lost everything", and per-app
  export would mean twenty-three files somebody has to remember to make — but
  the button does sit on a per-app pane, so say if it surprises you.
- **Whether `name (2)` is the right answer to a clash**, rather than asking. I
  chose never to overwrite, because two therapists on a shared PC can each have
  an "AM — calm" meaning different students.
