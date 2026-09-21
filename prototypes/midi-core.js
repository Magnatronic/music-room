'use strict';
/* ── midi-core.js ─────────────────────────────────────────────────────────────
   The shared plumbing for the MIDI prototypes, so each one is only its idea.
   Not used by any shipped app — midi_light.html carries its own copy of this
   thinking, because an app must not depend on a file that lives in prototypes/.

   Everything learned the hard way in Phase 9 is in here:

   - ONE PORT PER INSTRUMENT carries the notes. A controller can present several
     (the MPK mini IV presents four) and if two deliver the same press it is
     heard twice — on different channels that becomes two different pitches.
   - ONE RANGE PER CHANNEL, from a rolling window so it contracts as well as
     widens. Pads on notes 36-43 must fill the screen, and so must 88 keys.
   - ANY KEY, NEVER THAT KEY. The range can be learned by listening; the layout
     cannot. Nothing here may ask for a particular key.
   - Every note is pulled onto a degree of the chosen scale, so a wrong note is
     not possible whatever is plugged in.
   - System real-time is ignored, all-notes-off is obeyed, and nothing may sound
     for ever because a device forgot a note-off.
*/

const MIDI = (function(){

  const SCALES = {
    penta:  {label:'Pentatonic', steps:[0,2,4,7,9]},
    major:  {label:'Major',      steps:[0,2,4,5,7,9,11]},
    minor:  {label:'Minor',      steps:[0,2,3,5,7,8,10]},
    lydian: {label:'Bright',     steps:[0,2,4,6,7,9,11]},
    dorian: {label:'Wistful',    steps:[0,2,3,5,7,9,10]},
  };
  const VOICES = {
    bell:    {label:'Bell',      type:'sine',     oscs:[[1,1],[2.76,0.5],[5.4,0.25]], dec:2.4, cut:9000},
    marimba: {label:'Marimba',   type:'sine',     oscs:[[1,1],[3.93,0.38],[9.2,0.12]],dec:0.9, cut:2800},
    glass:   {label:'Glass',     type:'sine',     oscs:[[1,1],[3,0.42],[4.2,0.2]],    dec:2.8, cut:11000},
    warm:    {label:'Warm',      type:'triangle', oscs:[[1,1],[2,0.3],[3,0.12]],      dec:1.9, cut:2200},
    reed:    {label:'Reed',      type:'sawtooth', oscs:[[1,1],[2,0.45]],              dec:1.6, cut:1500},
    music:   {label:'Music box', type:'sine',     oscs:[[1,1],[4.06,0.22],[9.7,0.08]],dec:2.4, cut:6000},
  };
  const BOOM = {0:[226,28,28],2:[245,125,23],4:[245,209,23],5:[59,181,74],
                7:[28,169,169],9:[125,79,181],11:[224,90,156]};
  const noteRGB = pc => BOOM[pc] || (BOOM[(pc+11)%12]||[200,200,200]).map(v=>Math.round(v*0.7));

  let scale='penta', voice='bell';
  let onHit=null, onRelease=null, onControl=null;
  let statusEl=null;

  /* ── Sound ───────────────────────────────────────────────────────────────*/
  let ac=null;
  const audio=()=>{ if(!ac) ac=new (window.AudioContext||window.webkitAudioContext)();
                    if(ac.state==='suspended') ac.resume(); return ac; };
  const sounding=new Set();

  function freq(note){ return 440*Math.pow(2,(note-69)/12); }

  // A one-shot: it decays on its own and needs no release.
  function play(note, opts){
    const o=opts||{}, V=VOICES[o.voice||voice], c=audio(), t=c.currentTime+0.01;
    const f=freq(o.raw ? note : snap(note));
    const g=(o.gain==null?0.14:o.gain);
    const out=c.createGain(), flt=c.createBiquadFilter();
    flt.type='lowpass'; flt.frequency.value=V.cut;
    out.gain.setValueAtTime(0.0001,t);
    out.gain.linearRampToValueAtTime(g,t+(o.attack||0.012));
    const dec=(o.dec||V.dec);
    out.gain.setTargetAtTime(0.0001,t+(o.attack||0.012),dec*0.3);
    out.connect(flt).connect(c.destination);
    const stop=t+dec*2.4+0.3;
    for(const [ratio,amp] of V.oscs){
      const osc=c.createOscillator(), gn=c.createGain();
      osc.type=V.type; osc.frequency.value=f*ratio; gn.gain.value=amp;
      osc.connect(gn).connect(out); osc.start(t); osc.stop(stop);
    }
    return out;
  }

  // A sustained note, released by hand. Returns a handle.
  function hold(note, opts){
    const o=opts||{}, V=VOICES[o.voice||voice], c=audio(), t=c.currentTime+0.01;
    const f=freq(o.raw ? note : snap(note));
    const out=c.createGain(), flt=c.createBiquadFilter();
    flt.type='lowpass'; flt.frequency.value=V.cut;
    out.gain.setValueAtTime(0.0001,t);
    out.gain.linearRampToValueAtTime(o.gain==null?0.13:o.gain, t+(o.attack||0.02));
    out.connect(flt).connect(c.destination);
    const oscs=V.oscs.map(([ratio,amp])=>{
      const osc=c.createOscillator(), gn=c.createGain();
      osc.type=V.type; osc.frequency.value=f*ratio; gn.gain.value=amp;
      osc.connect(gn).connect(out); osc.start(t); return osc;
    });
    const h={out,oscs}; sounding.add(h); return h;
  }
  function release(h){
    if(!h || !sounding.has(h)) return;
    sounding.delete(h);
    const c=audio(), t=c.currentTime;
    try{
      h.out.gain.cancelScheduledValues(t);
      h.out.gain.setValueAtTime(h.out.gain.value,t);
      h.out.gain.setTargetAtTime(0.0001,t,0.22);
      h.oscs.forEach(o=>o.stop(t+2.2));
    }catch(e){}
  }
  function silence(){ [...sounding].forEach(release); }

  /* ── The scale: a wrong note is not possible ────────────────────────────*/
  function snap(note){
    const steps=SCALES[scale].steps, oct=Math.floor(note/12), pc=note%12;
    let best=steps[0], d=99;
    for(const s of steps){ const dd=Math.abs(s-pc); if(dd<d){ d=dd; best=s; } }
    return oct*12+best;
  }
  // A degree of the scale, counted from a low C — useful for building chords
  // and for stepping up and down without leaving the key.
  function degree(note){
    const steps=SCALES[scale].steps, oct=Math.floor(note/12), pc=note%12;
    let bi=0, d=99;
    for(let i=0;i<steps.length;i++){ const dd=Math.abs(steps[i]-pc); if(dd<d){ d=dd; bi=i; } }
    return oct*steps.length+bi;
  }
  function fromDegree(deg){
    const steps=SCALES[scale].steps, n=steps.length;
    return Math.floor(deg/n)*12 + steps[((deg%n)+n)%n];
  }

  /* ── One range per channel, learned by listening ────────────────────────*/
  const ranges={};
  const rangeOf = ch => ranges[ch] || (ranges[ch]={recent:[],lo:48,hi:72});
  function noteX(note, ch){
    const R=rangeOf(ch||0);
    R.recent.push(note); if(R.recent.length>64) R.recent.shift();
    const u=[...new Set(R.recent)];
    let lo=Math.min(...u), hi=Math.max(...u);
    if(u.length<3 || hi-lo<2){ const m=(lo+hi)/2; lo=m-5.5; hi=m+5.5; }
    R.lo=lo; R.hi=hi;
    return x(note,ch);
  }
  function x(note, ch){
    const R=rangeOf(ch||0);
    return Math.max(0,Math.min(1,(note-R.lo)/Math.max(1,R.hi-R.lo)));
  }

  /* ── The instrument ─────────────────────────────────────────────────────*/
  let access=null, connected=false;
  const boundPorts=new Set(), lastHit=new Map(), livePress=new Map();
  const noteSource={}, sourceSeen={};
  const PORTWORD=/\s+(MIDI|DAW|Plugin|Software|Out|In|Port)\b.*$/i;

  function connect(){
    audio();
    if(!navigator.requestMIDIAccess){ say('No Web MIDI in this browser. Use Edge or Chrome.', true); return; }
    navigator.requestMIDIAccess({sysex:false}).then(a=>{
      access=a; connected=true; a.onstatechange=bind; bind();
    }).catch(()=>say('Permission refused. Press Connect and choose Allow.', true));
  }
  function bind(){
    const ins=[...access.inputs.values()];
    ins.forEach(i=>{ if(!boundPorts.has(i.id)){ boundPorts.add(i.id);
      const dev=(i.name||'MIDI').replace(PORTWORD,'').trim()||'MIDI';
      i.onmidimessage = ev => onMessage(ev, i.id, dev); } });
    const names=[...new Set(ins.map(i=>((i.name||'MIDI').replace(PORTWORD,'').trim())||'MIDI'))];
    say(ins.length
      ? '<b>✓ '+names.join(', ')+'</b>'+(ins.length>names.length?' <span style="opacity:.6">('+ins.length+' ports)</span>':'')
      : 'No MIDI inputs. Plug something in — it is noticed without reloading.', !ins.length);
  }
  function say(html, bad){
    if(!statusEl) return;
    statusEl.innerHTML = bad ? '<span style="color:#ff9b9b">'+html+'</span>' : html;
  }

  function onMessage(ev, portId, dev){
    const d=ev.data, st=d[0];
    if(st>=0xF8) return;                                  // clock, active sensing
    const kind=st&0xF0, ch=st&0x0F, n=d[1], v=d[2], key=ch+'/'+n;
    if(kind===0x90 && v>0){
      const now=performance.now();
      const owner=noteSource[dev];
      if(owner && owner!==portId && now-(sourceSeen[dev]||0)<3000) return;
      noteSource[dev]=portId; sourceSeen[dev]=now;
      if(now-(lastHit.get(key)||-1e9)<15) return;
      lastHit.set(key,now);
      hit(key, n, v/127, ch);
    } else if(kind===0x80 || (kind===0x90 && v===0)){
      lift(key);
    } else if(kind===0xB0){
      if(n===120||n===123){ allOff(); return; }
      if(onControl) onControl(n, v/127);
    }
  }

  function hit(key, note, vel, ch){
    lift(key);
    const e={ key, note, vel:Math.max(0.05,vel), ch:ch||0,
              x:noteX(note,ch||0), rgb:noteRGB(snap(note)%12), t:performance.now() };
    livePress.set(key,e);
    if(onHit) onHit(e);
  }
  function lift(key){
    const e=livePress.get(key); if(!e) return;
    livePress.delete(key);
    e.heldFor=(performance.now()-e.t)/1000;
    if(onRelease) onRelease(e);
  }
  function allOff(){ [...livePress.keys()].forEach(lift); silence(); }
  // Nothing may sound for ever because a device forgot a note-off.
  setInterval(()=>{ const now=performance.now();
    for(const [k,e] of [...livePress]) if(now-e.t>30000) lift(k); }, 5000);

  /* ── Playable with no instrument at all ─────────────────────────────────*/
  function fallbacks(canvas){
    if(canvas){
      canvas.addEventListener('pointerdown',ev=>{
        audio();
        const r=canvas.getBoundingClientRect();
        const f=(ev.clientX-r.left)/r.width;
        const R=rangeOf(0), note=Math.round(R.lo+f*(R.hi-R.lo));
        const vel=0.3+0.65*(1-(ev.clientY-r.top)/r.height);
        hit('t'+ev.pointerId, note, vel, 0);
        try{ canvas.setPointerCapture(ev.pointerId); }catch(e){}
      });
      const up=ev=>lift('t'+ev.pointerId);
      canvas.addEventListener('pointerup',up);
      canvas.addEventListener('pointercancel',up);
    }
    addEventListener('keydown',ev=>{
      if(ev.repeat||ev.metaKey||ev.ctrlKey) return;
      const i='awsedftgyhujk'.indexOf(ev.key); if(i<0) return;
      audio(); hit('k'+i, 60+i, 0.85, 0);
    });
    addEventListener('keyup',ev=>{
      const i='awsedftgyhujk'.indexOf(ev.key); if(i>=0) lift('k'+i);
    });
  }

  /* ── A chip row, because every prototype wants two or three ─────────────*/
  function chips(hostSel, map, get, set){
    const el=document.querySelector(hostSel);
    const draw=()=>{
      el.innerHTML='';
      for(const k in map){
        const c=document.createElement('div');
        c.className='chip'+(get()===k?' active':'');
        c.textContent=map[k].label||map[k];
        c.addEventListener('click',()=>{ set(k); draw(); });
        el.appendChild(c);
      }
    };
    draw();
    return draw;
  }

  return {
    SCALES, VOICES, noteRGB,
    init(opts){
      onHit=opts.onHit; onRelease=opts.onRelease; onControl=opts.onControl;
      statusEl=opts.statusEl||null;
      if(opts.connectBtn) opts.connectBtn.addEventListener('click',connect);
      fallbacks(opts.canvas);
      say('Not connected. The permission prompt appears every time — the same as the microphone.');
    },
    connect, play, hold, release, silence, allOff,
    snap, degree, fromDegree, x, noteX, chips,
    get scale(){ return scale; }, setScale(k){ scale=k; },
    get voice(){ return voice; }, setVoice(k){ voice=k; },
    get held(){ return [...livePress.values()]; },
    audio,
  };
})();
