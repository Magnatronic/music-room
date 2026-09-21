# Phase 9c — the connect that never answers

**Trigger.** This changes `midi.js`, which five apps read, and CLAUDE.md puts
that file on the same footing as `framework.js`. It also changes the sixth MIDI
app, which duplicates the same code (§2). Hence a doc, small though the change
is.

## 1. What happened

2026-09-01, during Phase 9b UAT. The MIDI apps stopped connecting to the MPK.
The pane sat on **"Asking for permission…"** and stayed there. A PC restart
fixed it; no code changed.

That message is set by `connect()` *immediately before* calling
`requestMIDIAccess`, and cleared only when the promise settles:

```js
status='Asking for permission…'; refresh();
navigator.requestMIDIAccess({sysex:false}).then(a=>{ … })
  .catch(()=>{ status='Permission refused. Press Connect and choose Allow.'; refresh(); });
```

So the promise **never settled** — not resolved, not rejected. The `.catch()`
never ran either. There is no timeout, so the app waits for ever.

Three faults, in the order they hurt:

1. **The app has a state it never leaves**, which the non-negotiable "no fail
   states" does not allow. Every other route in this file ends somewhere.
2. **The message reads as normal progress.** Nothing on screen separates
   "waiting two seconds for you to press Allow" from "wedged since Tuesday", so
   a therapist has no reason to suspect anything and no idea what to try.
3. **Pressing Connect again starts a second request** that also hangs, and
   changes nothing on screen. The one thing a person naturally does is the one
   thing that gives them no information.

And one fault next to it, which did *not* bite here but would have misled:
**the `.catch()` asserts a cause it does not know.** Every rejection is reported
as a refused permission, so an OS-level failure tells the therapist to press
Connect and choose Allow — a loop that cannot succeed.

## 2. It is in two files, not one

`midi.js` is shared by five apps — Loop Garden, Creatures, Mirror, Weather, Big
Chords. **MIDI Light is older than `midi.js` and carries its own copy** of
`connect()`/`bind()` (`midi_light.html:126-143`), identical line for line here.
It is on `main` as v1.12.0 and is the one the user has played longest.

Both are fixed. Four docs said all six shared `midi.js` — CLAUDE.md, APPS.md,
PHASE-9-MIDI.md and IMPROVEMENT-PLAN.md — and all four are corrected to five,
with MIDI Light named as the duplicate, so the next person does not fix one file
and believe they have fixed six. That belief is what this phase nearly shipped.

**Migrating MIDI Light onto `midi.js` was considered and not done here.** It
means re-verifying a shipped v1.12.0 app in a branch whose job is a ten-line
fix, and the duplicate is small and now documented. The right moment is the next
phase that touches the reader for its own reasons — noted in PHASE-9-MIDI.md.

Not affected, checked: nothing else in the repo calls `requestMIDIAccess`.

> **CORRECTED 2026-09-04 — the sentence that stood here was wrong.** It said the
> microphone path "uses `getUserMedia`, which rejects rather than hangs when a
> device is unavailable, and already reports its own error." Measured while
> chasing a Phase 11 UAT report that the microphone "hangs for quite a while":
> of three consecutive launches, `getUserMedia` resolved once at **4.2 s** and
> **twice did not settle at all** inside six seconds — neither resolving nor
> rejecting, so the `.catch()` never ran. It is the same never-settling promise
> as `requestMIDIAccess`, and Voice Visuals had the same state it never leaves.
>
> The claim was reasoned, not measured, and it was reasoned in a doc whose whole
> subject is a promise that does not settle. **A file was declared "not affected"
> by the exact fault being fixed, on the strength of an assumption about an API.**
> Voice Visuals now carries this phase's escalating-wait pattern —
> `PHASE-11-LISTENING.md` §11.

## 3. The thing we cannot know

**A pending promise looks identical in both cases.** While the Chrome permission
prompt is open and unanswered, `requestMIDIAccess` is pending. While Windows'
MIDI service is wedged, `requestMIDIAccess` is pending. Same observable state,
and `navigator.permissions.query({name:'midi'})` does not separate them either —
it reports `prompt` for both.

So the fix **must not declare a cause at a deadline.** A timeout that says
"failed" would be wrong roughly whenever a therapist reads slowly. What time
buys us is not certainty, it is *relevance*: after ten seconds, the advice for
"a prompt you haven't pressed yet" and the advice for "it is stuck" can both be
on screen without either being a lie.

The wording escalates. It never concludes.

| At | Says |
|---|---|
| 0 s | Asking for permission — choose **Allow** on the prompt at the top of the window. |
| 10 s | Still waiting. If no prompt appeared, the instrument or Windows may be stuck: unplug the instrument and plug it in again. If that does not help, restart the PC. |

Ten seconds, because it must clear the time a person spends reading a prompt
they can see, and the second message stays true even when it fires early — it
says *still waiting*, which is a fact, and offers two things to try.

**The restart is named in the message** because it is what actually worked, both
here and for the audio stall. It reads as heavy advice for a music app; it is
the honest advice for this machine.

## 4. What a second press does

Not "nothing", and not "a second request".

A person pressing Connect again is telling us the first press appeared to do
nothing — which is exactly the moment the escalated advice is worth reading. So
a press while a request is pending **starts no second request** and **jumps the
message to the 10-second text immediately**.

A press is therefore never dead, and the promises never stack.

## 5. Lifecycle of a connect attempt

**Cardinality: at most one pending attempt per page** — one `pending` flag and
one timer id, both module-level, neither persisted.

| Event | What happens |
|---|---|
| **started** | `pending=true`, timer armed for 10 s, first message shown |
| **settles, granted** | timer cleared, `pending=false`, status cleared, `bind()` as now |
| **settles, rejected** | timer cleared, `pending=false`, the *real* reason shown (§6) |
| **never settles** | one escalation at 10 s, then it holds — no further timers, no retry loop |
| **pressed again while pending** | no new request; message jumps to the escalated text |
| **pressed again after settling** | an ordinary fresh attempt, timer re-armed |
| **settles late, after escalating** | `.then` clears status normally — the escalated text is replaced by `✓ <device>` |
| **pane rebuilt** (tab switch, `refresh()`) | status is module state, not pane state, so it is redrawn unchanged; the timer belongs to the attempt, not the pane |
| **app left / page closed** | timer dies with the page |
| **two MIDI apps open at once** | separate pages, separate module state — no shared key, nothing to conflict over |
| **inherited on the room PC** | **nothing is written to `localStorage`.** A failed connect leaves no trace, so the next person's session starts clean and tries again. A remembered failure is the worst outcome here: the machine that was wedged yesterday is usually fine today. |

## 6. Reporting a rejection honestly

`NotAllowedError` and `SecurityError` are the two the permission prompt actually
produces, and for those the existing wording is right — someone did refuse.
Anything else is reported as itself:

> Could not open MIDI (`<name>`). Unplug the instrument and plug it in again, or
> restart the PC.

Never "refused" for something nobody refused.

## 7. What is deliberately not done

- **No auto-retry.** A silent retry loop hides the fault it is papering over,
  and a wedged MIDI service does not recover on a timer.
- **No `Promise.race` that abandons the request.** The promise cannot be
  cancelled; racing it only means a late success arrives with nothing listening.
  We keep the `.then` live — a slow-but-working connect still works.
- **No spinner.** Movement reads as progress, and there may be none.
- **No change to `bind()`, the port rules, or anything downstream.** The device
  logic was right; only the waiting was wrong.

## 8. Acceptance

With `requestMIDIAccess` stubbed to a never-settling promise:

1. All six apps show the first message, then the escalated one at 10 s.
2. The page stays responsive throughout; touch still plays the activity.
3. A second Connect press starts no second request and shows the escalated text
   at once.
4. A stubbed rejection with a non-permission error reports that error, not
   "refused"; `NotAllowedError` still says refused.
5. A normal connect is unchanged: status clears to `✓ <device>`.
6. Nothing new appears in `localStorage`.
7. All 28 pages still load clean in Edge and Firefox.
