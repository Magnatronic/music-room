'use strict';
/* ── midi.js — the shared MIDI reader for the MIDI apps ───────────────────────
   Loaded with <script src> AFTER framework.js, the same way songs.js is shared
   by Song Grid, Big Switch, Echo Bird and Bubbles. One file so five apps do not
   carry five copies of plumbing that took a phase to get right.

   Everything in here was learned by getting it wrong first — see
   PHASE-9-MIDI.md and APPS.md:

   - **ONE PORT PER INSTRUMENT carries the notes.** A controller can present
     several (the MPK mini IV presents four) and if two deliver the same press
     it is heard twice; on different channels that becomes two different pitches.
   - **ONE RANGE PER CHANNEL**, from a rolling window so it contracts as well as
     widens. Pads on notes 36-43 must fill the screen, and so must 88 keys.
   - **ANY KEY, NEVER THAT KEY.** The range can be learned by listening; the
     layout cannot. Nothing here may ask for a particular key.
   - **A note picks a DEGREE of the therapist's scale**, and the framework's
     notes ARE degrees, so a note is a column and the whole Sound tab applies
     with no framework change.
   - **Colour is worked out when a mark is DRAWN, pitch when it arrives.** An
     auto-range only knows what it has seen; a sounding note must not change key
     under a player's hand.
   - System real-time is ignored, All Notes Off is obeyed, a device unplugged
     mid-note releases what it held, and nothing sounds for ever.

   The one thing this file does NOT do is draw. Each app owns its own picture.
*/
const MIDIIN = (function(){

  /* ── Palettes, shared so every MIDI app agrees what a note looks like ─────*/
  const PALETTES = {
    notes:  {label:'🎵 Note colours'},
    ocean:  {label:'🌊 Ocean',  ramp:[[20,60,150],[20,140,200],[40,205,205],[150,240,230],[240,255,250]]},
    fire:   {label:'🔥 Fire',   ramp:[[130,10,10],[225,60,20],[255,140,20],[255,215,80],[255,250,215]]},
    forest: {label:'🌿 Forest', ramp:[[20,75,40],[40,145,60],[130,205,70],[220,245,120],[250,255,220]]},
    candy:  {label:'🍬 Candy',  ramp:[[235,60,150],[255,120,190],[165,120,255],[120,200,255],[255,240,185]]},
    white:  {label:'⚪ White',  ramp:[[130,135,150],[185,190,205],[230,235,245],[255,255,255],[255,255,255]]},
    // TWO THAT DO NOT RUN TO WHITE. Every ramp above ends at 250-255 across all
    // three channels, so the top of the range paints in white - which is most of
    // why a kept picture drifts pale as it builds. These stay saturated the whole
    // way up and are the ones to reach for with Persistence turned on.
    jewel:  {label:'💎 Jewel',  ramp:[[70,20,110],[150,25,95],[200,45,55],[210,110,25],[190,170,40]]},
    deep:   {label:'🌑 Deep',   ramp:[[25,40,120],[20,95,140],[20,140,110],[95,150,45],[170,140,30]]},
    // Random gives each PRESS its own hue, held for the life of the mark. Keyed
    // on the note it produced only as many colours as there were notes, and a
    // colour rerolled every frame would strobe.
    random: {label:'🎲 Random', rnd:true},
  };
  function hsl(h,s,l){
    const c=(1-Math.abs(2*l-1))*s, x=c*(1-Math.abs((h/60)%2-1)), m=l-c/2;
    const t=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];
    return [(t[0]+m)*255|0,(t[1]+m)*255|0,(t[2]+m)*255|0];
  }

  /* ── One range per channel ───────────────────────────────────────────────*/
  const ranges={};
  const rangeOf = ch => ranges[ch] || (ranges[ch]={recent:[],lo:48,hi:72,loT:48,hiT:72});
  function noteX(note, ch){
    const R=rangeOf(ch);
    R.recent.push(note); if(R.recent.length>64) R.recent.shift();
    const u=[...new Set(R.recent)];
    R.loT=Math.min(...u); R.hiT=Math.max(...u);
    if(u.length<3 || R.hiT-R.loT<2){ const m=(R.loT+R.hiT)/2; R.loT=m-5.5; R.hiT=m+5.5; }
    // Settled HERE, not at the next frame: the colour and the pitch of a note
    // are decided the moment it arrives.
    if(R.recent.length<24){ R.lo=R.loT; R.hi=R.hiT; }
    return x(note,ch);
  }
  function x(note, ch){
    const R=rangeOf(ch||0);
    return Math.max(0,Math.min(1,(note-R.lo)/Math.max(1,R.hi-R.lo)));
  }
  // Called once a frame by the app, so the range eases rather than jumping.
  function ease(dt){
    for(const k in ranges){
      const R=ranges[k];
      if(R.recent.length<24){ R.lo=R.loT; R.hi=R.hiT; continue; }
      const e=(v,t,tau)=>v+(t-v)*(1-Math.exp(-dt/tau));
      R.lo=e(R.lo,R.loT,R.loT<R.lo?0.12:1.1);
      R.hi=e(R.hi,R.hiT,R.hiT>R.hi?0.12:1.1);
    }
  }

  /* ── A note is a column, so the Sound tab applies ────────────────────────*/
  function columnFor(note, ch){
    const n=Math.max(1,NOTES.length);
    if(SETTINGS.snap==='off'){
      let best=0,d=99;
      for(let i=0;i<n;i++){
        const dd=Math.min((NOTES[i].pc-note%12+12)%12,(note%12-NOTES[i].pc+12)%12);
        if(dd<d){ d=dd; best=i; }
      }
      return best;
    }
    return Math.max(0, Math.min(n-1, Math.round(x(note,ch)*(n-1))));
  }
  const colX = col => (col+0.5)/Math.max(1,NOTES.length);
  // Two ways in, because an app that ANSWERS has a column and no note of its
  // own: a phrase built out of scale degrees never had a MIDI number.
  function ramp(p, t){
    const u=Math.max(0,Math.min(0.999,t))*(p.ramp.length-1);
    const i=Math.floor(u), f=u-i, a=p.ramp[i], b=p.ramp[Math.min(p.ramp.length-1,i+1)];
    return [a[0]+(b[0]-a[0])*f|0, a[1]+(b[1]-a[1])*f|0, a[2]+(b[2]-a[2])*f|0];
  }
  const rndHue = hue => hsl(((hue==null?0.5:hue)*360)%360,
                            0.62+((hue*7)%1)*0.38, 0.52+((hue*13)%1)*0.24);
  // A RAMP TAKES ITS POINT FROM THE HIT, NOT FROM THE PITCH.
  //
  // These used to read the ramp at the note's POSITION, and the mark is drawn at
  // that same position - so a note always painted the same colour in the same
  // place and a phrase played over and over built its picture out of a handful
  // of colours, each pinned to its own stripe of the screen. The user, of MIDI
  // Light: "if you are trying to build up a picture through persistence it is
  // very samey, as they go in the same area."
  //
  // Every caller in all four apps already passes the per-hit `hue`, so there is
  // nothing new to carry; a hit simply reads the palette somewhere else. The
  // mark keeps ONE colour for its whole life - a colour rerolled each frame
  // would strobe. `Note colours` is untouched and stays keyed to the note,
  // because that one IS the Boomwhacker association.
  //
  // This file is shared by four apps and CLAUDE.md treats a change here the way
  // it treats framework.js. All four were driven and measured.
  function colourOf(note, ch, hue){
    const p=PALETTES[SETTINGS.palette]||PALETTES.notes;
    if(p.rnd) return rndHue(hue);
    if(p.ramp) return ramp(p, hue!=null ? hue : x(note,ch));
    return bandRGB255(Math.max(0,Math.min(NOTES.length-1,columnFor(note,ch))));
  }
  function colourOfCol(col, hue){
    const p=PALETTES[SETTINGS.palette]||PALETTES.notes;
    if(p.rnd) return rndHue(hue);
    if(p.ramp) return ramp(p, hue!=null ? hue : col/Math.max(1,NOTES.length-1));
    return bandRGB255(Math.max(0,Math.min(NOTES.length-1,col)));
  }
  // A pitch some number of scale degrees away from a note, without leaving the
  // key — for anything that wants to answer, harmonise or transpose.
  function stepBy(note, ch, steps){
    const n=Math.max(1,NOTES.length);
    return Math.max(0, Math.min(n-1, columnFor(note,ch)+steps));
  }

  /* ── The instrument ──────────────────────────────────────────────────────*/
  let access=null, connected=false, status='';
  // One pending connect attempt per page, and nothing persisted:
  // a failed connect must not be inherited by the next session.
  let pending=false, waitTimer=0;
  const bound=new Set(), lastHit=new Map(), live=new Map();
  const noteSource={}, sourceSeen={};
  const surfaces={keys:false,pads:false,knobs:false};
  const perChan={};
  const PORTWORD=/\s+(MIDI|DAW|Plugin|Software|Out|In|Port)\b.*$/i;
  let hooks={};

  function attach(h){ hooks=h||{}; }
  // A pending requestMIDIAccess looks IDENTICAL whether the permission prompt is
  // sitting there unanswered or Windows' MIDI service is wedged — navigator
  // .permissions says 'prompt' for both. So the wording escalates with time and
  // never concludes; a deadline that declared failure would be wrong every time
  // a therapist read the prompt slowly. See PHASE-9C-MIDI-CONNECT-WAIT.md.
  const ASKING='Asking for permission — choose Allow on the prompt at the top of the window.';
  const STUCK='Still waiting. If no prompt appeared, the instrument or Windows may be stuck: '+
              'unplug the instrument and plug it in again. If that does not help, restart the PC.';
  function stillWaiting(){ if(!pending) return; status=STUCK; refresh(); }
  function settled(){ pending=false; clearTimeout(waitTimer); waitTimer=0; }
  function connect(){
    getAudio();
    if(!navigator.requestMIDIAccess){
      status='This browser has no Web MIDI. Use Edge or Chrome.'; refresh(); return;
    }
    // Pressing Connect again means the first press appeared to do nothing —
    // exactly when the advice is worth reading. No second request; show it now.
    if(pending){ stillWaiting(); return; }
    pending=true; status=ASKING; refresh();
    waitTimer=setTimeout(stillWaiting, 10000);
    navigator.requestMIDIAccess({sysex:false}).then(a=>{
      settled(); access=a; connected=true; a.onstatechange=bind; bind();
    }).catch(err=>{
      settled();
      // Never assert a cause we do not know: only these two mean someone refused.
      const n=(err&&err.name)||'';
      status = (n==='NotAllowedError'||n==='SecurityError')
        ? 'Permission refused. Press Connect and choose Allow.'
        : 'Could not open MIDI ('+(n||'unknown')+'). Unplug the instrument and plug it '+
          'in again, or restart the PC.';
      refresh();
    });
  }
  function bind(e){
    if(e && e.port && e.port.state==='disconnected') silence();
    const ins=[...access.inputs.values()];
    ins.forEach(i=>{ if(!bound.has(i.id)){ bound.add(i.id);
      const dev=(i.name||'MIDI').replace(PORTWORD,'').trim()||'MIDI';
      i.onmidimessage = ev => onMidi(ev, i.id, dev); } });
    if(!ins.length){ for(const k in ranges) delete ranges[k];
                     for(const k in noteSource) delete noteSource[k]; knobs.clear(); }
    status=''; refresh();
  }
  const refresh = () => { if(typeof currentQuickMode!=='undefined' && currentQuickMode==='app') buildAppPanel(); };

  function onMidi(ev, portId, dev){
    const d=ev.data, st=d[0];
    if(st>=0xF8) return;                                  // clock, active sensing
    const kind=st&0xF0, ch=st&0x0F, n=d[1], v=d[2], id=ch+'/'+n;
    if(kind===0x90 && v>0){
      const now=performance.now();
      // The first port of a DEVICE to send a note owns that device's notes. Per
      // device, not globally: two instruments must both still play.
      const owner=noteSource[dev];
      if(owner && owner!==portId && now-(sourceSeen[dev]||0)<3000) return;
      noteSource[dev]=portId; sourceSeen[dev]=now;
      if(now-(lastHit.get(id)||-1e9)<15) return;          // one press, twice
      lastHit.set(id,now); hintOf(ch,n); start(id,n,v/127,ch,null);
    } else if(kind===0x80 || (kind===0x90 && v===0)){ end(id); }
    else if(kind===0xB0){
      if(n===120||n===123){ silence(); return; }
      if(n===64){ sustain=v>=64; if(!sustain) releaseSustained(); return; }
      surfaces.knobs=true; knob(n,v); refresh();
    }
  }
  function hintOf(ch,n){                                  // advisory only
    const p=perChan[ch]=perChan[ch]||{notes:new Set(),hits:0};
    p.notes.add(n); p.hits++;
    const u=[...p.notes].sort((a,b)=>a-b), adj=u.some((y,i)=>i&&y-u[i-1]===1);
    if(ch===9 || (p.hits>6 && u.length<=16 && !adj && u.every(y=>y>=35&&y<=81))) surfaces.pads=true;
    else surfaces.keys=true;
  }

  let sustain=false; const sustained=[];
  function start(id, note, vel, ch, at){
    end(id, true);
    const x01=noteX(note,ch);                             // the range first
    const col=columnFor(note,ch), force=Math.max(0.05,vel);
    const ev={ id, note, ch, col, x:x01, force, hue:Math.random(),
               fx: at? at.x : null, fy: at? at.y : null,
               t0:performance.now(), held:true, voice:0 };
    live.set(id, ev);
    if(hooks.onHit) hooks.onHit(ev);
    if(typeof pokeSim==='function') pokeSim();
    return ev;
  }
  // `silent` means "do not let this read as a musical event" - it must NOT mean
  // "skip cleanup". onRelease is where an app that holds its OWN voice ids stops
  // them, and Big Chords is one: start() retires a live id with end(id,true),
  // so a silent end that skipped onRelease left that chord sounding for ever.
  // Reachable by touch, where the id is the rounded coordinates - pressing the
  // same spot twice inside 320 ms is the same id. Apps get the flag and can
  // decide; every onRelease in the suite is cleanup and wants calling either
  // way. See PHASE-9D-MIDI-POLISH.md C5.
  function end(id, silent){
    const ev=live.get(id); if(!ev) return;
    live.delete(id);
    ev.held=false; ev.heldFor=(performance.now()-ev.t0)/1000;
    if(sustain && !silent){ sustained.push(ev); return; }
    if(ev.voice) stopVoice(ev.voice);
    if(hooks.onRelease) hooks.onRelease(ev, !!silent);
  }
  function releaseSustained(){
    while(sustained.length){ const ev=sustained.pop();
      if(ev.voice) stopVoice(ev.voice); if(hooks.onRelease) hooks.onRelease(ev); }
  }
  function silence(){
    [...live.keys()].forEach(id=>end(id,true));   // each one releases as it goes
    releaseSustained();
    live.clear();
    if(hooks.onSilence) hooks.onSilence();
  }
  setInterval(()=>{ const now=performance.now();
    for(const [id,ev] of [...live]) if(now-ev.t0>30000) end(id); }, 5000);

  /* ── Sound, through the framework's own engine ──────────────────────────
     yAxis is 'loud', so y IS the velocity: a sustained framework voice that
     answers to how hard the key was pressed, with the Sound tab's voice and
     effects applied.                                                        */
  function holdVoice(ev){ ev.voice=startVoice(colX(ev.col), ev.force); return ev.voice; }
  function pluck(col, gain){ pluckNote(colX(col), 0.5, gain); }
  // ONE LEVEL FOR ALL SIX. Big Chords and MIDI Light hold framework voices at
  // full velocity; the other four fired plucks at gainMul 0.07-0.24, which made
  // them about five times quieter than the two that hold. Creatures was the
  // quietest and is where it was noticed, but it was never the odd one out.
  // A pluck is a one-shot against a sustained voice, so it needs to be near
  // full to sit level with one. `soft` is for an echo of a note already played.
  function level(force, soft){ return (0.45+0.5*Math.max(0,Math.min(1,force)))*(soft||1); }

  /* ── Knobs, learned in the order they are turned ────────────────────────*/
  let KNOB=[];
  const knobs=new Map(); let learned='';
  function setKnobs(list){ KNOB=list||[]; }
  function knob(cc,v){
    if(!KNOB.length) return;
    if(!knobs.has(cc)){
      if(knobs.size>=KNOB.length) return;
      knobs.set(cc,knobs.size); learned=KNOB[knobs.get(cc)].label;
      setTimeout(()=>{ learned=''; refresh(); }, 2600);
    }
    SETTINGS[KNOB[knobs.get(cc)].key]=v/127; saveSettings();
    if(typeof currentQuickMode!=='undefined' && currentQuickMode==='visuals') buildVisualsPanel();
  }

  /* ── The standard MIDI block for an app's own tab ───────────────────────
     Every MIDI app shows the same thing in the same place: a Connect button
     only when there is something to fix, then what is plugged in and what it
     looks like.                                                             */
  function devices(){ return access ? [...access.inputs.values()] : []; }
  function deviceNames(){
    return [...new Set(devices().map(i=>((i.name||'MIDI').replace(PORTWORD,'').trim())||'MIDI'))];
  }
  function note(t){ const d=document.createElement('div'); d.className='midinote'; d.textContent=t; return d; }
  function buildConnect(el){
    if(!document.getElementById('midiCss')){
      const st=document.createElement('style'); st.id='midiCss';
      st.textContent='.midinote{font-size:var(--font-s);color:var(--ink-quiet);line-height:1.45;'+
        'margin:calc(-2px * var(--ui-scale)) 0 var(--gap)}';
      document.head.appendChild(st);
    }
    const ins=devices();
    if(!connected || !ins.length){
      const b=document.createElement('button');
      b.className='btn'; b.style.width='100%'; b.style.height='var(--target)';
      b.textContent = connected ? '🔌 Look again' : '🔌 Connect to MIDI';
      b.addEventListener('click', e=>{ e.stopPropagation(); connect(); });
      el.appendChild(b);
    }
    if(!connected) el.appendChild(note(status || 'Not connected. The prompt appears every time, the same as the microphone does.'));
    else if(!ins.length) el.appendChild(note(status || 'No MIDI inputs. Plug something in — it is noticed without reloading.'));
    else {
      const s=Object.keys(surfaces).filter(k=>surfaces[k])
        .map(k=>({keys:'🎹 keys',pads:'🥁 pads',knobs:'🎛️ knobs'})[k]);
      const d=document.createElement('div'); d.className='midinote';
      d.innerHTML='<b>✓ '+deviceNames().join(', ')+'</b>'+
        (ins.length>deviceNames().length?' <span style="opacity:.6">('+ins.length+' ports)</span>':'')+
        (s.length?' — '+s.join(', '):' — play something');
      el.appendChild(d);
    }
    if(learned){ const k=document.createElement('div'); k.className='midinote';
      k.innerHTML='<b>Knob learned → '+learned+'</b>'; el.appendChild(k); }
  }
  // The Notes-played row every MIDI app carries, so the words never drift.
  function snapChips(el){
    el.appendChild(makeChips('Notes played','snap',
      { scale:{label:'Pulled into the scale'}, off:{label:'As played'} }, null));
  }
  function paletteChips(el){
    const pal={}; for(const k in PALETTES) pal[k]={label:PALETTES[k].label};
    el.appendChild(makeChips('Palette','palette',pal,null));
  }
  // Register / Scale / Starting note / how many notes — and NOT the Y-axis row,
  // because these apps put the VELOCITY on y and exposing it would let a
  // therapist silently break the velocity response.
  function buildNotesPane(el, extraNote){
    appendTuning(el, ()=>{ refreshMusic(); }, {label:'Which notes'});
    el.appendChild(makeSlider({key:'noteCount',label:'How many notes',min:3,max:12,step:1,dp:0,
      onChange:refreshMusic}));
    el.appendChild(note(extraNote || 'The notes an instrument is pulled onto. Up/down is how hard you played.'));
  }

  /* ── A touch, landing WHERE IT IS TOUCHED ───────────────────────────────
     A MIDI note has no place of its own, so it takes x from the played range
     and y from how hard it was hit. A touch does have a place, and using the
     velocity for its height put the light where the finger was not.         */
  function touchDown(sx, sy){
    const R=rangeOf(0), n=Math.round(R.lo + sx*(R.hi-R.lo));
    const id='touch/'+Math.round(sx*1000)+'/'+Math.round(sy*1000);
    start(id, n, 0.35+0.6*sy, 0, {x:sx, y:sy});
    return id;
  }
  // The framework hands splat() coordinates with y UP; screens count y DOWN.
  function splatTouch(x, y, opts, holdMs){
    if(!opts || opts.velScale!==0) return null;
    const id=touchDown(x, y);
    setTimeout(()=>end(id), holdMs||320);
    return id;
  }
  // Where a mark belongs: a touch's own place if it has one, else the range and
  // the velocity.
  const PX = ev => ev.fx!=null ? ev.fx : x(ev.note, ev.ch);
  // HOW HARD -> HOW HIGH, and it must reach the FLOOR. `pow(f,0.75)` raised
  // quiet notes (0.1 arrived at 0.18) on top of a 0.10 floor, so the bottom
  // quarter of the screen was unreachable however softly anyone played.
  const heightOf = f => 0.03+0.94*Math.pow(f,1.35);
  const PY = ev => ev.fy!=null ? ev.fy : heightOf(ev.force);

  /* HOW MARKS STACK. `lighter` is addition: three marks at 0.4 make 1.2 and
     clip to white, and nothing in any app limits how many can overlap - which is
     why pressing repeatedly went white in Chords, why mixing settings went white
     in Loop Garden, and half of why Weather's stars washed out. `screen` is
     1-(1-a)(1-b): it approaches white but never overshoots, so overlaps keep
     their colour far longer and stacking degrades instead of clipping. One name
     here rather than a choice per look, because a look set wrong is a therapist's
     problem and this cannot be set wrong. See PHASE-9D-MIDI-POLISH.md C1. */
  const BLEND='screen';

  /* ── HOW LONG A MARK LASTS, and whether a PICTURE is kept ────────────────
     Two different things, and the five new apps had neither.

     LINGER stretches the life of a mark that was always going to go. It is the
     middle setting that was missing: a picture that disappears without becoming
     permanent, which is what a room usually wants.

     PERSISTENCE keeps what was drawn. It is MIDI Light's mechanism, moved here
     unchanged because it is the one that works: a TRANSPARENT live layer is
     drawn each frame and STAMPED onto a keep layer, so a stamp only touches
     pixels a mark actually painted and older marks elsewhere are never washed
     out. Deposited PER SECOND, not per frame, or a mark that lives two seconds
     is laid down 120 times and the picture goes to a flat wash.

     NOT by fading the canvas toward the background: that never converges on an
     accelerated canvas and leaves a ghost of everything ever drawn. See
     APPS.md on Soundscape.                                                  */
  const LINGER  = () => { const v=+SETTINGS.linger; return v>0 ? v : 1; };
  // PERSISTENCE IS ON OR OFF. It was a slider from 0 to 1, and the middle of it
  // fades the kept layer with `destination-out` at a half-life of 2+70p^2
  // seconds. The user, watching it in the room: "persistence is better as a
  // toggle, as when it fades it does not look good. So no persistence or 100%."
  //
  // Reading it as 0 or 1 rather than clamping the stored value means a student
  // whose settings already hold 0.5 snaps to the nearer end instead of being
  // stranded on a setting the panel can no longer show.
  const PERSIST = () => ((+SETTINGS.persist||0) > 0 ? 1 : 0);
  // > 0, NOT >= 0.5, and the difference is a real fault the user found in the
  // room: "if the persistence is turned on when you first load the page it seems
  // not to work until you turn it off and back on again."
  //
  // Persistence was a SLIDER until this phase, so every therapist already using
  // these apps has a FRACTIONAL value saved - 0.3, say. The switch that replaced
  // the slider draws itself from `SETTINGS.persist` as a TRUTHINESS, so 0.3 shows
  // ON; a >= 0.5 threshold gave the drawing code 0. The switch said on, nothing
  // was kept, and toggling it off and on wrote a real `true` that finally worked.
  // Measured across all five apps and eight stored values: 0.2, 0.3 and 0.45 each
  // disagreed, 0.5 and above agreed. See probes/phase-15/agree.js.
  //
  // So the rule is now the SAME rule the switch uses. Any value a therapist had
  // saved at all means they wanted the picture kept, and now they get all of it.
  function makePaint(){
    let keep=null, kctx=null, liveC=null, lctx=null, w=0, h=0;
    function size(W,H){
      if(keep && w===W && h===H) return;
      const old=keep;
      keep=document.createElement('canvas'); keep.width=W; keep.height=H;
      kctx=keep.getContext('2d');
      if(old) try{ kctx.drawImage(old,0,0,W,H); }catch(e){}
      liveC=document.createElement('canvas'); liveC.width=W; liveC.height=H;
      lctx=liveC.getContext('2d');
      w=W; h=H;
    }
    return {
      begin(W,H){ size(W,H); lctx.clearRect(0,0,W,H); return lctx; },
      /* WHY A KEPT PICTURE GOES GREY IN THE MIDDLE, and what to do about it.

         Stamping source-over at a small alpha is an exponential moving average:
         each pixel converges on the MEAN of everything ever drawn there. In the
         middle, where the playing piles up, that is the mean of many different
         hues — and the mean of many hues is neutral, by construction. The marks
         are `screen`-blended, so the inputs there are bright as well, which is
         why the neutral it lands on is a light grey rather than a dark one.
         Measured with repeated clicks in one place: the lit area climbed 36% →
         68% → 88% → 95% while mean luminance went 31 → 67 → 89 → 102 and kept
         going. Nothing was broken; averaging colours is what that looks like.

         So the picture is now allowed to FORGET, which gives it a steady state:
         paint arrives, old paint leaves, and it never fills. The fade is
         `destination-out` on a TRANSPARENT layer, which multiplies the alpha
         down and converges properly — unlike painting the background colour
         over an opaque canvas, which never arrives and leaves a ghost (see
         APPS.md on Soundscape). At the very top of the slider it does not fade
         at all, so "permanent" is still available and is now a deliberate
         choice rather than the only behaviour.

         The other lever is the palette, and it belongs to the therapist: hues
         from one ramp average to a colour in that ramp, so 💎 Jewel or 🌑 Deep
         hold their colour where 🎵 Note colours or 🎲 Random cannot.          */
      stamp(dt){
        const p=PERSIST();
        if(!kctx || p<=0.01) return;
        kctx.save();
        // DEPOSIT HARD. This is the whole of the grey problem: a WEAK deposit
        // makes each pixel a long-run average of everything that ever passed
        // over it, and the average of many hues is grey however slowly you take
        // it. Depositing most of the mark in the two or three frames it is
        // actually over a pixel means the picture holds the colour of the LAST
        // thing that passed, which is a saturated colour. Persistence then means
        // what the word means - how long that lasts - rather than how fast an
        // average builds. Frame-rate independent, so it looks the same at 30fps.
        kctx.globalAlpha=1-Math.exp(-dt*45);
        kctx.globalCompositeOperation='source-over';
        kctx.drawImage(liveC,0,0);
        kctx.restore();
        if(p<0.985){
          const halfLife=2+70*p*p;                       // seconds
          const k=1-Math.pow(0.5, dt/halfLife);
          kctx.save();
          kctx.globalCompositeOperation='destination-out';
          kctx.fillStyle='rgba(0,0,0,'+k.toFixed(5)+')';
          kctx.fillRect(0,0,w,h);
          kctx.restore();
        }
      },
      show(dst){ if(!liveC) return; if(PERSIST()>0.01) dst.drawImage(keep,0,0); dst.drawImage(liveC,0,0); },
      painting(){ return PERSIST()>0.01; },
      clear(){ if(kctx) kctx.clearRect(0,0,w,h); if(lctx) lctx.clearRect(0,0,w,h); },
    };
  }
  // The two controls, worded once so the apps cannot word them differently.
  function lingerSlider(el){
    // "Linger" is the user's word and a better one. Only two apps offer it -
    // Big Chords and Mirror - because they are the two whose marks have no
    // lifetime of their own. Loop Garden and Drift each already name theirs on
    // their first tab, and had this slider on the pane doing NOTHING.
    el.appendChild(makeSlider({key:'linger',label:'Linger',min:0.3,max:4,step:0.1,dp:1,
      fmt:v=>v<0.95?'shorter':v<1.05?'as they are':(Math.round(v*10)/10)+'x longer'}));
  }
  function persistSlider(el, onChange){   // a toggle now; the name is kept so the
                                         // four apps that call it need no edit
    el.appendChild(makeToggle('Persistence','persist',onChange));
  }

  /* ── Defaults every MIDI app needs ──────────────────────────────────────*/
  const DEFAULTS = {
    snap:'scale', palette:'notes', linger:1, persist:0,
    mode:'notes', paint:true, zoneLook:'off', showLabels:false, colorMode:'note',
    yAxis:'loud', noteCount:8, scale:'penta',
  };

  return {
    PALETTES, DEFAULTS,
    attach, connect, silence, setKnobs,
    onMidiForTest(ev, portId, dev){ onMidi(ev, portId, dev); },   // fake ports in tests
    get connected(){ return connected; },
    get live(){ return live; },
    get surfaces(){ return surfaces; },
    x, noteX, ease, columnFor, colX, colourOf, colourOfCol, stepBy, holdVoice, pluck, level,
    BLEND,
    buildConnect, snapChips, paletteChips, buildNotesPane, note,
    LINGER, PERSIST, makePaint, lingerSlider, persistSlider,
    touchDown, splatTouch, PX, PY, heightOf,
  };
})();
