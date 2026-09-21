# Phase 4i — the first splat belongs to `onDown`, not to the next frame

**Status:** ✅ UAT passed 2026-08-30, merged, shipped in `v1.7.2`.
**Trigger met, explicitly:** this changes `onDown` — named in `CLAUDE.md` as part of
"how a pointer becomes a note", the path that has already hosted two invisible
bugs. Doc first, no exceptions.

---

## 1. The fault

**Mouse dwell and gamepad dwell do nothing in Sweep Chimes and Music Bubbles.**
Reported by the user as "the mouse dwell doesn't seem to work on the bubbles";
measured, it is both dwell routes in both apps.

| app | mouse dwell | pad dwell |
|---|---|---|
| `bubbles.html` | **silent** | **silent** |
| `sweep_chimes.html` | **silent** | **silent** |
| `fluid_sensory.html` (control) | works | works |

Those are the two students dwell exists for — one who can aim but not press, on
the mouse and on the stick. A moving gamepad pointer *appears* to work only
because travel produces ordinary drag splats; park it and hold still, which is
the entire point of dwell, and nothing happens.

### Why

A dwell press is **synthesised**. `pollMouseDwell` fires it as

```js
getAudio(); onDown('mouse', mouseSt.x, mouseSt.y); pokeSim();
```

— a direct call. **No DOM `mousedown` is ever dispatched**, and the same is true
of every pad press. Both apps had moved their tap handling into their own
`canvas.addEventListener('mousedown', …)`, and both then ignored the loop's
initial splat (`opts.velScale===0`) so a tap would not ring twice. Between the
two, a synthetic press had nowhere left to land.

### The reasoning error that caused it

Phase 4h's chimes fix chose *not* to change the framework, on the grounds that
only two apps needed down-event handling so it was not worth touching the
pointer-to-note path. **That trade was misjudged.** A DOM listener is unreachable
for *any* synthesised pointer — dwell, the gamepad, and anything added later — so
the app-level workaround does not merely fail to help the access paths, it
**closes** them. Sweep Chimes' dwell worked before that fix and shipped broken in
`v1.7.1`; Bubbles has been broken since dwell landed in 5c.

**The general form, worth more than the fix:** a workaround that listens for a
*device* rather than for the framework's own event silently excludes every
student who does not use that device.

---

## 2. The change

Move the initial splat from the render loop into `onDown`.

```js
// onDown, after p.color is known
const pm=paintMode();
if(pm!=='off'){
  const subtle = pm==='subtle' ? {radius:SUBTLE_PAINT.radius} : null;
  Anim.splat(s.x,s.y,0,0,p.color,Object.assign({velScale:0},subtle));
}
p.moved=true;
```

and the loop keeps only the movement branch:

```js
for(const p of pointers){
  if(p.down){
    const mdx=p.x-p.px, mdy=p.y-p.py, dist=Math.hypot(mdx,mdy);
    if(pm!=='off' && dist>0.00001){ …interpolated steps, unchanged… }
    p.px=p.x; p.py=p.y; p.dx*=0.85; p.dy*=0.85;
  }
}
```

**`p.moved` keeps its exact meaning** — "the initial splat has been delivered" —
and is now set where the delivery happens. **No new state, no new key.** It is
read nowhere but the loop (`framework.js:2567–2568` before this change).

**Every press now reaches `Anim.splat`, whatever produced it**: a finger, a
mouse, a dwell, a gamepad. That is the whole point, and it is why this is the
framework's job rather than each app's.

### What it lets the apps delete

Both bespoke listeners go, and with them the hand-rolled coordinate maths that
had already caused a separate bug in Bubbles:

- `bubbles.html` — drops its `mousedown`/`touchstart` pair and its `dpr()` helper,
  and stops ignoring the initial splat. The precise tap point now arrives from
  `onDown`, which went through `toLocal` like all framework input.
- `sweep_chimes.html` — drops the same pair. `splat` treats `velScale===0` as a
  **fresh press**, which is what bypasses the 0.12 s per-bar cooldown, and
  one-touch sweep triggers from it.

**This change removes more code than it adds**, in both apps and in the loop.

---

## 3. Lifecycle — the initial splat

| case | behaviour |
|---|---|
| **Added** — a finger lands | One splat, immediately, at the down coordinates. `p.moved=true`. |
| **Added** — two fingers land in the same frame | Two `onDown` calls, one splat each. Pointers are independent; nothing is shared. |
| **Added** — a press shorter than one frame | **Now delivered.** This is Phase 4h's sub-frame fix, obtained for every app instead of two. |
| **Added** — a dwell press | Delivered. `pollMouseDwell` calls `onDown`, so it takes the same path as a finger. This is the reported bug. |
| **Added** — a pad press (button, `padAuto`, or pad dwell) | Delivered, same route. |
| **Changed** — the pointer moves | Loop's interpolation branch, **unchanged**, still capped by `perfLevel`. |
| **Removed** — the pointer lifts | `onUp` unchanged. The initial splat has already happened, so a lift can no longer cancel it. |
| **Duplicated** — a dwell presses then releases itself 250 ms later | One splat at the press. The release fires no splat and never did. Only *movement* re-arms a dwell, so resting does not repeat. |
| **Replaced** — a gamepad slot is reused by a different pad | `padRelease` then a fresh `onDown`: one splat for the new pointer, none inherited. |
| **Conflict** — paint mode is `off` | No splat, exactly as before. Unchanged behaviour, and see §5. |
| **Conflict** — Keys mode with `paintKeys:'subtle'` | `onDown` must pass the **same** `{radius:SUBTLE_PAINT.radius}` the loop passed, or a Keys-mode tap paints a full-size blob where it used to paint a small one. |
| **Conflict** — an app whose `splat` has audible side effects | It now fires one frame earlier. That is the fix, not a side effect. |

---

## 4. What must not change

- **Interpolation**, its `cap`, and `velScale` division across steps.
- **`toSim` before anything moves.** `onDown` already maps first (`const s=toSim(cx,cy)`)
  and the splat uses `s`, not raw client coordinates.
- **`fitSurface` bailing while a pointer is down.**
- The **note** path: `startVoice`, `onCell`, `flashCell` are untouched and still
  fire before the splat.

---

## 5. Known limit, deliberately not widened

When paint mode is `off` the framework still sends no splat, so an app that uses
`splat` as its only interaction is silent in that mode. **Not reachable today**:
the `Paint trails` toggle (`framework.js:1600`) is not on either app's Visuals
pane, and presets are per-app-file so nothing can carry `paint:false` in. Recorded
because the next pane edit could expose it, and the failure would be total and
silent.

---

## 6. Acceptance

1. Mouse dwell rings a chime and pops a bubble.
2. Pad dwell does the same — the parked-stick case, not just a moving pointer.
3. A sub-frame tap still rings (Phase 4h's fix survives).
4. One tap is still exactly one strike — no double-fire now both routes are gone.
5. A brisk sweep still rings 8 bars exactly once each; repeated clicking still 10/10.
6. One-touch sweep still plays the run from a tap, including a sub-frame one.
7. Keys-mode `subtle` paint is still a small blob on tap, not a full-size one.
8. Bubbles pops where it is touched, strip open and closed.
9. All 21 pages load clean in Edge and Firefox.
