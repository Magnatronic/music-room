# UAT — Phase 1: legibility, touch targets, and the Setup pane

> **Partly superseded (2026-08-26).** The `Fine-tune` drawer went in Phase 4c and the
> "All 12 ⌄" chip expander went in Phase 4d, so steps mentioning either no longer
> describe the build. Kept as the record of what was tested on 2026-08-24.

**Branch:** `phase-1-ui-tokens` · **Commit:** `cc610b6`

This is the first phase you will *see*. It changes how every panel looks in all
17 apps, adds a fifth rail tab, and introduces one **Control size** dial for the
whole room. No app's activity or sound changed.

Allow about 20 minutes. If anything fails, tell me and I'll fix it on the branch
and hand you an updated checklist. Nothing merges until you pass it.

> **Do this on the actual room screen if you can.** Every number below was
> measured in a headless browser at 1920×1080 and 1366×768. What I cannot
> measure is whether it is *readable from where a therapist stands*, and that is
> the whole point of the phase.

---

## 1. The launcher

1. Open `index.html`.
   **Expect:** the app blurbs under each title are noticeably bigger and
   brighter than before, and the group descriptions ("Open-ended music-making…")
   are readable at a glance rather than faint grey.
2. **Expect:** the LIVE badges on the cards are legible, not tiny caps.

## 2. The panel, in one app

1. Open **Fluid Keys**. Tap **Sound** in the left rail.
2. **Expect:** section headings ("Voice", "Effects") are large, white and
   clearly bigger than the chips beneath them. Previously they were the smallest,
   faintest text on screen.
3. **Expect:** the **Voice** group shows **4 voices plus a dashed "All 12 ⌄"**
   chip, not twelve chips.
4. Tap **All 12 ⌄**. **Expect:** all twelve appear, the dashed chip disappears,
   and picking one changes the sound.
5. Find a toggle (Reverb, Echo, Mute). Tap **the words**, not the switch.
   **Expect:** it flips. Previously only the switch itself worked.
6. Drag the **Volume** slider. **Expect:** it is easy to grab — the whole row
   height responds, not just the small circle.

## 3. Control size — the main event

1. Still in Fluid Keys, tap **Setup** (the new ⚙️ tab, last in the rail).
2. **Expect:** a **Control size** slider reading a percentage, with an
   explanation under it, then Performance, Show performance, and Reset.
3. Drag Control size up. **Expect:** the rail, tabs, chips, sliders and text all
   grow together, live.
4. **On the room screen, note what the readout says at maximum.**
   - If it reads **150%**, the screen is tall enough for the full range.
   - If it stops lower (e.g. **100%**) and the text underneath explains that
     bigger does not fit, that is correct and deliberate — a taller rail would
     push 🔒 Lock off the bottom where you could not reach it. **Tell me which
     one happened**, and what the screen's resolution is.
5. Go back to the app list and open a **different** app (say Drum Pads).
   **Expect:** it is already at the size you set. You set it once, not 17 times.
6. Open `index.html`. **Expect:** the launcher is at that size too.

## 4. It did not break anything

1. Open **Drum Pads** and play some pads. **Expect:** unchanged.
2. Open **Song Grid**, pick a song, play a few notes. **Expect:** unchanged.
3. Open **Sampler Pads** and open a pad editor. **Expect:** the dialog text is
   readable; nothing overlaps.
4. Open **Soundscape** and move a few sliders. **Expect:** unchanged.
5. In any app, tap 🔒 **Lock**, then hold the top-left corner 3 s to unlock.
   **Expect:** works as before. **Check Lock is reachable at your Control
   size** — this is the thing step 3.4 protects.

## 5. Presets still behave

1. In Fluid Keys, set a few things, save a preset, load it back.
   **Expect:** it restores as before.
2. **Expect:** loading a preset does **not** change your Control size. That is
   deliberate — it belongs to the screen, not to a student.
3. In **Setup**, press **Reset all settings to defaults**.
   **Expect:** the app resets, and Control size is **not** reset — it would
   otherwise shrink the controls in the other sixteen apps.

> The Reset button moved here from the Presets pane, where "Start over" sat under
> a list of students' saved setups and read as "delete the presets". It does not
> delete presets, and never did.

---

## What I verified, and how

All in headless Edge across all 17 apps:

- 20 pages load with **0 errors, 0 warnings**.
- The Setup pane opens in every app with Control size and Reset present.
- Control size 0.8 / 1.0 / 1.5 produces 45 / 56 / 84px chips; 3.0 clamps to 1.5.
- Voice caps to 4 + expander with the current value always visible, expands to
  12, and picking an expanded chip still works.
- Tapping a toggle's label flips it; rows are 56px.
- **Every pane in every app** meets the contrast and target floors — the sweep
  opens the Fine-tune drawer too.
- The rail clips in **0 of 17** apps at 1920×1080 and 1366×768, at 100% and 150%.
- Asking for 150% on a 1366×768 screen applies 100%, stores 150%, and restores
  the full 150% on a 1920×1080 screen.

## What I could not verify

- **Whether it is actually readable from where you stand.** That is the point of
  the phase and only the room can answer it. If anything is still too small or
  too faint, say which and I will raise that token — they are all in one block.
- **Touch.** I drove a mouse. Five-finger play is unchanged code, but you have
  the glass.
- **Your screen's resolution**, which decides whether the full 150% is available
  (step 3.4).

## Known and deliberate

- **Long panes still scroll** — 7 of 85 pane-views at 1920×1080/100%. The proper
  fix is *More ⌄* / *Back up ⌃* paging buttons, which is a later phase. What
  changed now is that the scrollbar is wide and visible instead of a thin grey
  overlay on the content.
- **Play-surface text was left alone** (e.g. Chord Strummer's roman numerals).
  The floors govern the interface; restyling an activity is not a token pass.
- **The rail is still emoji + a drawer still exists.** Both go in Phase 4.

---

## After you pass

Phase 1 merges and I start **Phase 2 — switch and Xbox Adaptive Controller
access**, whose two controls land in the Setup pane you just met.
