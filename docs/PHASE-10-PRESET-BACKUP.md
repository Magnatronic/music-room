# Phase 10 — presets you can carry off the machine

**Trigger.** Two of them: this touches `framework.js`, which all 23 activity
pages load, and it changes **what a saved blob contains**. Either alone would
need a doc.

## 1. Why

IT asked where presets and recorded samples are kept. The answer is browser
`localStorage` for the `file://` origin — `presets:<page>.html` for presets,
`kit:sampler.html` for recordings — under the Windows user's own browser profile
(`%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\Local Storage\leveldb`, and the
Chrome equivalent).

That answer exposed a gap. **The Sampler can already export and import its kit as
a `.json` file. Presets cannot be exported at all.** So:

- *Clear browsing data → Cookies and other site data* deletes every therapist's
  saved setup, and an overnight cleanup policy does that silently;
- a reimaged machine takes them with it;
- a preset made on one room's PC cannot be moved to another's;
- there is no way to have kept a copy, so none of the above is recoverable.

Recordings survive all of that, because the Sampler has a file. Presets do not.

## 2. One file for every app, not one per app

**Export writes every app's presets into a single file.** The button lives on the
Presets pane, which is per-app, so this needs saying plainly on the pane — but
per-app export would be the wrong tool for the job it exists to do. The failure
being insured against is *"this machine lost everything"*, and the answer to that
cannot be twenty-three separate files that someone has to remember to make.

**What is NOT in it, and why:**

- **`settings:*`** — the current setup of each app. It is whatever was last
  touched, it changes constantly, and it is re-derivable by loading a preset. A
  backup of it would restore somebody's half-finished fiddling.
- **`kit:sampler.html`** — the recordings. They are base64 audio and would dwarf
  the presets in a file people are meant to open and eyeball. The Sampler's own
  export already covers them, and the pane says so.
- **`ui-scale` and `fullscreen`** — properties of the *display*, not of a
  student. `uiScale` is already stripped from a preset when it is saved, for
  exactly this reason: loading Jamie's preset must not resize the room's
  controls. A backup that carried them across machines would undo that.

## 3. The file

```json
{
  "format": "music-room-presets",
  "version": 1,
  "saved": "2026-09-03",
  "presets": {
    "drums.html":   { "AM — 5 notes, calm": { "...settings..." } },
    "sampler.html": { "JT — quiet kit":     { "...settings..." } }
  }
}
```

`format` and `version` are there so a file from the future can be refused rather
than half-read. Anything without the right `format` string is rejected with a
message; a `version` above what this build knows is refused the same way.

**The name of a preset is the only free text in the file**, and the pane asks for
initials, never a full name. The export hint repeats that, because a file leaves
the machine in a way `localStorage` does not — it lands in the browser's
downloads folder, which on a managed PC may be redirected to OneDrive and
synced. That is the one genuinely new privacy surface this feature creates and
it is stated on the pane, not just here.

## 3a. Where the file goes — a real Save as

**The browser is asked for a proper "Save as" dialog where it has one**, so the
file can go straight onto the USB stick the room runs from rather than into
Downloads to be hunted for later.

**Measured rather than assumed**, since `file://` restricts plenty of APIs:
`isSecureContext` is **true** on `file://`, and `showSaveFilePicker` **exists and
opens** in Edge and Chrome — a headless call fails with `AbortError`, which is a
dismissed dialog, not `SecurityError`. **Firefox does not have the API at all**
(`typeof` is `undefined`, and its `file://` origin reports as `null`), so it
takes the download instead. Both paths end with the same file.

It has to be called **before any `await`**, or the click that opened it has
stopped counting as the user gesture the API requires.

**Cancelling is not a failure.** `AbortError` and `NotAllowedError` report
"Nothing was saved" and change nothing — they must not fall through to a silent
download, or cancelling would save the file anyway. Any *other* error does fall
back to the download, so the feature cannot be lost to an unexpected refusal.

**Import needs none of this**: `<input type="file">` already opens a dialog the
therapist can browse anywhere with, in every browser.

## 4. Import is a MERGE, and never deletes

The rule: **an import can only ever add.** Nothing a therapist has on this
machine is removed or overwritten by opening a file.

| The file has | The machine has | What happens |
|---|---|---|
| a preset | nothing by that name | **added** |
| a preset | the same name, **identical** settings | **skipped** — it is already here |
| a preset | the same name, **different** settings | **added as `name (2)`** — both kept |
| a preset | the same name, and `(2)` is taken | `(3)`, and so on |
| nothing | a preset | **left alone.** Import never deletes |
| an app not in this build | — | kept in `localStorage` under its own key, harmless, and it will be there if that app ever returns |

**Why not overwrite.** A room PC is shared. Two therapists can each have a preset
called "AM — calm" meaning two different students with the same initials, and
silently replacing one with the other is the worst thing this feature could do.
Suffixing is ugly and obvious, which is the right trade: the therapist sees two
rows and can delete the one they do not want. Deleting is already one tap.

**Why skipping identical presets matters.** It makes importing the same file
twice a no-op. Somebody *will* do that, and without it they would get "AM — calm
(2)", "(3)", "(4)" and conclude the feature is broken.

## 5. Lifecycle

| Event | What happens |
|---|---|
| **added** | a new preset appears in the list, sorted with the rest |
| **changed** | a preset is not edited in place; saving over a name replaces it, as it always did. Import never changes one |
| **duplicated** | importing the same file twice adds nothing the second time (§4) |
| **replaced** | there is no "replace all". The only way to lose a preset is the ✕ on its row |
| **removed** | ✕ deletes one, as before. Export takes a copy of what exists at that moment; deleting afterwards does not reach into the file |
| **two conflict** | the incoming one is suffixed; both survive (§4) |
| **inherited by the next person on this machine** | **the imported presets are simply there**, exactly as saved ones are. This is the row that matters: an import is not a session, it is a permanent change to the shared machine. The pane says how many were added so nobody is surprised, and the therapist can delete what is not theirs |
| **the file itself, afterwards** | it sits in the downloads folder until somebody removes it, and it carries initials. §3 |

## 6. What could go wrong with a file

- **Not JSON** → caught, message, nothing changes.
- **JSON but not ours** (no `format`) → refused, message, nothing changes.
- **A newer `version`** → refused rather than half-applied.
- **Right shape, junk inside** — a preset value that is not an object is skipped
  rather than stored, so a bad file cannot put something unloadable into the
  list.
- **Enormous file** → refused above a sane size before parsing, so a mis-picked
  20 MB file cannot lock the page up.
- **`localStorage` full** → `storePresets` already swallows the failure; the
  import reports how many it could not keep rather than claiming success.

Nothing in the file is executed. It is parsed, shape-checked, and copied.

## 7. Acceptance

1. Export from any app writes one `.json` holding **every** app's presets.
2. Re-importing that file immediately changes nothing (idempotent).
3. A preset whose name matches but whose settings differ arrives as `name (2)`,
   and the original is untouched.
4. Import never deletes: a preset on the machine but not in the file survives.
5. A malformed file, a foreign file and an over-large file are each refused with
   a message, and leave `localStorage` exactly as it was.
6. Presets imported for an app are visible on that app's Presets pane and load
   correctly.
7. `uiScale`, `locked`, `settings:*` and `kit:*` are absent from the file.
8. The Save-as dialog is used where the browser has one, is handed the file and
   the suggested name, and reports the name the user chose; cancelling saves
   nothing; a browser without the API still downloads.
9. All 27 pages still load clean in Edge and Firefox.
