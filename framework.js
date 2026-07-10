'use strict';
/* Music Room framework — THE shared file for every app.
   Settings + persistence, colour system + Boomwhacker note grid, audio engine,
   5-touch input, menu panels, presets, session lock, lifecycle/render loop.
   Each app supplies an Anim object (see template.html) and calls boot().
   Loaded via <script src> so it works from file:// (offline / USB stick).
   The app supplies an `Anim` object with:
     themes, defaults, schema, sectionLabel, init(canvas), resize(w,h),
     splat(x,y,dx,dy,color,opts), frame(dt), reset()
   plus optional hooks: styles, railButtons, setQuality, buildInstrument,
   buildVisuals, soundExtras, onCell, lockMode, hideRail, paneLabels, bandColor.
   Coordinates passed to splat() are normalised 0..1 with y pointing UP.
*/
// The framework owns its DOM: inject it before any element lookups below.
document.body.insertAdjacentHTML("afterbegin", "<canvas id=\"c\"></canvas>\n<div id=\"bands\" class=\"hidden\"></div>\n<div id=\"unlockZone\"></div>\n<div id=\"lockHint\">Controls locked — press and hold the top-left corner for 3 seconds to unlock</div>\n<div id=\"stats\"></div>\n\n<div id=\"ui\">\n  <div id=\"rail\">\n    <a href=\"index.html\" id=\"homeBtn\" class=\"btn\" title=\"Home\">⌂</a>\n    <button class=\"bbar\" id=\"btnInstrument\" data-mode=\"instrument\">🎵 Notes</button>\n    <button class=\"bbar\" id=\"btnSound\"      data-mode=\"sound\">🎛️ Sound</button>\n    <button class=\"bbar\" id=\"btnVisuals\"    data-mode=\"visuals\">✨ Visuals</button>\n    <button class=\"bbar\" id=\"btnPresets\"    data-mode=\"presets\">⭐ Presets</button>\n    <div class=\"qsep\"></div>\n    <div id=\"railExtra\"></div>\n  </div>\n  <div id=\"panel\">\n    <div class=\"pane\" id=\"paneInstrument\">\n      <div id=\"instrumentContent\"></div>\n    </div>\n    <div class=\"pane\" id=\"paneSound\">\n      <div id=\"soundControls\"></div>\n    </div>\n    <div class=\"pane\" id=\"paneVisuals\">\n      <div id=\"visualsContent\"></div>\n    </div>\n    <div class=\"pane\" id=\"panePresets\">\n      <div id=\"presetsContent\"></div>\n    </div>\n  </div>\n</div>");


const canvas   = document.getElementById('c');
const ui        = document.getElementById('ui');
const panel     = document.getElementById('panel');
const railExtra = document.getElementById('railExtra');

const STORE_KEY = 'settings:' + location.pathname.split('/').pop();

// Settings shared by every animation (the animation adds its own via Anim.defaults)
const SHARED_DEFAULTS = {
  volume:0.30, bg:'#000000', lockedColor:null, colorMode:'note',
  voice:'pure', scale:'major', reverb:false, echo:false, chorus:false, mute:false,
  tone:0.5, attack:0.5, ring:0.5,   // sound macros; 0.5 = the engine's original values
  mode:'notes', rootNote:'C', octave:'4', noteCount:5,
  showLabels:true, yAxis:'none', octaveRows:'2', zoneLook:'tint', paint:true, glide:'gentle',
  paintKeys:'subtle', pressFx:'bloom',
  locked:false, quality:'auto', showStats:false,
};

let SETTINGS = {}, currentTheme = '', colorIdx = 0;
let bgRGB = [0,0,0];
let currentQuickMode = null;

function initSettings(){
  SETTINGS = Object.assign({}, SHARED_DEFAULTS, Anim.defaults||{});
  try { SETTINGS = Object.assign(SETTINGS, JSON.parse(localStorage.getItem(STORE_KEY)||'{}')); } catch(e){}
  const themeKeys = Object.keys(Anim.themes);
  currentTheme = themeKeys.includes(SETTINGS.theme) ? SETTINGS.theme : themeKeys[0];
  // Saved settings may hold a retired press effect (smoke/pixel/ripple/press)
  if(SETTINGS.pressFx && !PRESSFX_OPTS[SETTINGS.pressFx]) SETTINGS.pressFx='bloom';
  // Retired voices: Retro's territory folded into Synth, Pluck's into Kalimba
  if(SETTINGS.voice==='retro') SETTINGS.voice='synth';
  if(SETTINGS.voice==='pluck') SETTINGS.voice='kalimba';
  bgRGB = hexToRGB(SETTINGS.bg);
  perfLevel = (SETTINGS.quality && SETTINGS.quality!=='auto') ? SETTINGS.quality : 'high';
}

// What painting does in the current mode. Keys mode has its own three-way
// setting: full-screen trails smear across the zone grid and visually dissolve
// the keys, so 'subtle' (a small, contained bloom at the fingertip) is the
// default there; Flow keeps the simple on/off flag that motion styles use.
// Apps that lock their mode (drums, voice visuals, …) keep the legacy flag —
// their splats were designed for their fixed mode.
const SUBTLE_PAINT={radius:0.06, vel:0.25};   // small blob, barely swirls
function paintMode(){
  if(SETTINGS.mode==='notes' && !Anim.lockMode) return SETTINGS.paintKeys||'full';
  return SETTINGS.paint===false ? 'off' : 'full';
}

// ── Performance / quality (auto-scaling + manual override) ──────────────────────
const QUALITY = { auto:{label:'Auto'}, high:{label:'High'}, med:{label:'Medium'}, low:{label:'Low'} };
const PERF_ORDER = ['low','med','high'];
let perfLevel = 'high', qCooldown = 0;
function activeQuality(){ return perfLevel; }
function setPerf(level){ if(level===perfLevel) return; perfLevel=level; if(Anim.setQuality) Anim.setQuality(level); }
function autoPerf(fps){
  if(qCooldown>0){ qCooldown--; return; }
  const i=PERF_ORDER.indexOf(perfLevel);
  if(fps<42 && i>0){ setPerf(PERF_ORDER[i-1]); qCooldown=4; }
  else if(fps>56 && i<2){ setPerf(PERF_ORDER[i+1]); qCooldown=8; }
}
function updateStats(fps){
  const el=document.getElementById('stats'); if(!el) return;
  const touches=pointers.filter(p=>p.down).length;
  let audio='';
  if(audioCtx){
    const gr=limiter?limiter.reduction:0;
    const fx=[SETTINGS.reverb&&'reverb',SETTINGS.echo&&'echo',SETTINGS.chorus&&'chorus'].filter(Boolean).join('+');
    audio='   voices: '+soundingVoices+'   limiter: '+(gr<-0.05?gr.toFixed(1)+' dB':'idle')+(fx?'   fx: '+fx:'');
  }
  // with paint off the sim rightly sleeps during play too, but saying so while
  // the user is touching reads as a malfunction — only report it when idle
  const sim = (touches>0 || Date.now()<simWakeUntil) ? '' : '   sim: sleeping';
  el.textContent = Math.round(fps)+' fps   quality: '+perfLevel+(SETTINGS.quality==='auto'?' (auto)':'')+'   touches: '+touches+audio+sim;
}
function applyStats(){ const el=document.getElementById('stats'); if(el) el.style.display = SETTINGS.showStats?'block':'none'; }
function saveSettings(){ pokeSim(); try{ localStorage.setItem(STORE_KEY, JSON.stringify(SETTINGS)); }catch(e){} }

function hexToRGB(h){
  h=h.replace('#','');
  return [parseInt(h.substr(0,2),16)/255, parseInt(h.substr(2,2),16)/255, parseInt(h.substr(4,2),16)/255];
}
function applyBg(){ bgRGB = hexToRGB(SETTINGS.bg); }

// ── Colour ────────────────────────────────────────────────────────────────────
const VIVID = 1.25;
// Paint colour when not using per-note colours: a single locked colour, or the theme rotation.
function pickColor(){
  let c;
  if (SETTINGS.colorMode==='single' && SETTINGS.lockedColor) c = SETTINGS.lockedColor;
  else { const cols = Anim.themes[currentTheme].colors; c = cols[colorIdx++ % cols.length]; }
  return [c[0]*VIVID, c[1]*VIVID, c[2]*VIVID];
}

const STANDARD_SWATCHES = [
  [1,0.12,0.12],[1,0.50,0.0],[1,0.90,0.05],[0.12,0.85,0.12],
  [0.0,0.80,1.0],[0.15,0.35,1.0],[0.65,0.15,1.0],[1,1,1],
];

// ── Notes mode: Boomwhacker note colours + band overlay ─────────────────────────
// Matches the colour-coding of Boomwhackers / deskbells that music therapists use:
// C=red D=orange E=yellow F=green G=teal A=purple B=pink (keyed by pitch class 0–11).
const BOOMWHACKER={0:[226,28,28],2:[245,125,23],4:[245,209,23],5:[59,181,74],7:[28,169,169],9:[125,79,181],11:[224,90,156]};
function bandRGB255(i){
  if(Anim.bandColor){ const c=Anim.bandColor(i); if(c) return c; }   // app palette override
  const pc=NOTES[i]?NOTES[i].pc:0;
  if(BOOMWHACKER[pc]) return BOOMWHACKER[pc];
  const base=BOOMWHACKER[(pc+11)%12]||[200,200,200];   // sharps/flats: darkened colour of the natural below
  return base.map(v=>Math.round(v*0.7));
}
function bandColor01(i){ const c=bandRGB255(i); return [c[0]/255*1.25,c[1]/255*1.25,c[2]/255*1.25]; }

const bandsEl=document.getElementById('bands');
function buildBands(){
  bandsEl.innerHTML='';
  const show = SETTINGS.mode==='notes' && SETTINGS.zoneLook!=='off';
  bandsEl.classList.toggle('hidden',!show);
  if(!show) return;
  const rows=gridRowCount(), cols=NOTES.length, linesOnly=SETTINGS.zoneLook==='lines';
  bandsEl.style.gridTemplateColumns='repeat('+cols+',1fr)';
  bandsEl.style.gridTemplateRows='repeat('+rows+',1fr)';
  // DOM order is top row first; row index 0 is the BOTTOM row (lowest octave).
  for(let r=rows-1;r>=0;r--){
    for(let c=0;c<cols;c++){
      const d=document.createElement('div'); d.className='band'+(rows>1?' cell':'');
      d.dataset.cell=c+'-'+r;
      d.style.setProperty('--c',bandRGB255(c).join(','));
      // 'Lines only' keeps the fill transparent; touches still flash in the zone colour.
      // Resting tint must READ as coloured keys (the Boomwhacker association is the
      // point) — 0.05 was invisible on most displays, so keys looked black until held.
      d.style.setProperty('--a', linesOnly ? '0' : (0.18+r*0.04).toFixed(3));
      if(c<cols-1) d.style.borderRight='1px solid rgba(255,255,255,0.10)';
      if(r>0)      d.style.borderBottom='1px solid rgba(255,255,255,0.10)';
      if(SETTINGS.showLabels){
        const l=document.createElement('div'); l.className='lbl';
        l.textContent = Anim.bandLabel ? Anim.bandLabel(c) : NOTES[c].label;   // e.g. drum icons
        d.appendChild(l);
      }
      bandsEl.appendChild(d);
    }
  }
}
function flashCell(c,r){
  const d=bandsEl.querySelector('[data-cell="'+c+'-'+r+'"]'); if(!d) return;
  d.classList.add('flash');
  clearTimeout(d._ft); d._ft=setTimeout(()=>d.classList.remove('flash'),220);
}
// Press effect inside a cell, driven by SETTINGS.pressFx ('bloom'|'glow'|'pop'|
// 'none'; apps opt in by putting pressFx in their defaults and exposing the
// chips). Styles live in framework.css. Contained by design — the reward
// happens exactly where the student is looking, nothing competes with the grid.
// Three distinct options for different sensory needs: bloom (brightness + a
// little motion, default), glow (colour only, no motion), pop (motion only,
// no brightness change).
const PRESSFX_SELF={bloom:450,pop:250};   // cell-class effects + removal delay
function fxCell(c,r){
  let style=SETTINGS.pressFx||'none';
  if(!PRESSFX_OPTS[style]) style='bloom';   // retired effect in saved settings
  if(style==='none') return;
  const d=bandsEl.querySelector('[data-cell="'+c+'-'+(r||0)+'"]'); if(!d) return;
  if(PRESSFX_SELF[style]){
    d.classList.remove(style); void d.offsetWidth;   // restart the animation
    d.classList.add(style);
    clearTimeout(d._bt); d._bt=setTimeout(()=>d.classList.remove(style),PRESSFX_SELF[style]);
    return;
  }
  if(d.querySelectorAll('.fx').length>2) return;   // cap overlay pile-up on fast swipes
  const o=document.createElement('div'); o.className='fx fx-'+style;
  o.style.setProperty('--c', bandRGB255(c).join(','));
  d.appendChild(o);
  o.addEventListener('animationend',()=>o.remove());
  setTimeout(()=>{ if(o.parentNode) o.remove(); },1600);   // safety net
}
const PRESSFX_OPTS={
  bloom:{label:'🌟 Bloom'}, glow:{label:'✨ Glow'}, pop:{label:'🎈 Pop'}, none:{label:'Off'},
};
// Zones stay lit for as long as a touch is holding them (instrument-key feedback).
function updateHeldCells(){
  bandsEl.querySelectorAll('.band.held').forEach(d=>d.classList.remove('held'));
  if(SETTINGS.mode!=='notes') return;
  for(const p of pointers){
    if(!p.down) continue;
    const d=bandsEl.querySelector('[data-cell="'+p.col+'-'+p.row+'"]');
    if(d) d.classList.add('held');
  }
}

// ── Audio engine ───────────────────────────────────────────────────────────────
let audioCtx=null, masterGain=null, polyGain=null, convolver=null, reverbWet=null, echoWet=null, chorusWet=null, limiter=null;
// Effect sends are physically disconnected while the effect is off — the reverb
// convolver in particular (3.8 s stereo impulse) costs real audio-thread CPU even
// when its output gain is zero, which showed up as glitches on modest machines.
let fxBusA=null, fxBusB=null, chDelayN=null, ecDelayN=null, revConn=false, echoConn=false, chorConn=false;
let soundingVoices=0; // live oscillator sets incl. fading tails (stats + diagnostics)

const VOICES = {
  pure:  {label:'Pure',  oct:0,  gain:0.12, filter:{type:'lowpass', base:1300, track:1600}, lfo:{rate:5,depth:0.007},
    oscs:[{type:'sine'}]},
  warm:  {label:'Warm',  oct:0,  gain:0.13, filter:{type:'lowpass', base:780,  track:1100}, lfo:{rate:4,depth:0.005},
    oscs:[{type:'triangle'},{type:'sine',detune:7,gain:0.6},{type:'sine',detune:-7,gain:0.6}]},
  bell:  {label:'Bell',  oct:0,  gain:0.12, filter:{type:'lowpass', base:4500, track:2000}, lfo:{rate:0,depth:0},
    oscs:[{type:'sine'},{type:'sine',ratio:2.76,gain:0.5,decayTo:0.04},{type:'sine',ratio:5.4,gain:0.25,decayTo:0.02}]},
  glass: {label:'Glass', oct:0,  gain:0.13, filter:{type:'highpass',base:350,  track:250},  lfo:{rate:7,depth:0.012},
    oscs:[{type:'sine'},{type:'sine',ratio:3.0,gain:0.45,decayTo:0.35},{type:'sine',ratio:4.2,gain:0.22,decayTo:0.25}]},
  deep:  {label:'Deep',  oct:-1, gain:0.18, filter:{type:'lowpass', base:700,  track:900},  lfo:{rate:2,depth:0.005},
    oscs:[{type:'sine'},{type:'sine',ratio:2,gain:0.55},{type:'sine',ratio:3,gain:0.2}]},
  // Layered-harmonics pluck: string-like spectrum (higher partials decay faster)
  // through the proven pluck path. A Karplus-Strong delay-line version was tried
  // and cut — WebAudio's linearly-interpolated DelayNode flutters and the loop
  // filter detunes; don't reintroduce it without an AudioWorklet.
  harp:  {label:'Harp',  oct:0,  gain:0.16, filter:{type:'lowpass', base:2800, track:1600}, lfo:{rate:0,depth:0}, pluck:1.5,
    oscs:[{type:'triangle'},{type:'sine',gain:0.5},{type:'sine',ratio:2,gain:0.45,decayTo:0.15},
          {type:'sine',ratio:3,gain:0.22,decayTo:0.08},{type:'sine',ratio:4,gain:0.10,decayTo:0.05}]},
  // 2-op FM: modulator at fm.ratio×freq, depth in units of the carrier frequency,
  // decaying to fm.decayTo over fm.decay seconds — the classic tine attack.
  epiano:{label:'E-Piano', oct:0, gain:0.15, fm:{ratio:14, depth:2.4, decayTo:0.08, decay:0.16},
    filter:{type:'lowpass', base:2200, track:1600}, lfo:{rate:0,depth:0},
    oscs:[{type:'sine'},{type:'sine',ratio:2,gain:0.12,decayTo:0.3}]},
  musicbox:{label:'Music box', oct:1, gain:0.15, filter:{type:'lowpass', base:5200, track:1500}, lfo:{rate:0,depth:0}, pluck:1.3,
    oscs:[{type:'sine'},{type:'sine',ratio:4.06,gain:0.22,decayTo:0.05},{type:'sine',ratio:9.7,gain:0.08,decayTo:0.02}]},
  // Modal synthesis: the inharmonic partial ratios of the real instruments
  // (marimba's famous ~3.9× first overtone) with fast per-partial decay.
  marimba:{label:'Marimba', oct:0, gain:0.20, filter:{type:'lowpass', base:2600, track:1800}, lfo:{rate:0,depth:0}, pluck:0.8,
    oscs:[{type:'sine'},{type:'sine',ratio:3.93,gain:0.38,decayTo:0.03},{type:'sine',ratio:9.2,gain:0.12,decayTo:0.01}]},
  kalimba:{label:'Kalimba', oct:0, gain:0.20, filter:{type:'lowpass', base:2000, track:1400}, lfo:{rate:0,depth:0}, pluck:1.1,
    oscs:[{type:'sine'},{type:'sine',ratio:5.1,gain:0.20,decayTo:0.02},{type:'triangle',gain:0.10,decayTo:0.1}]},
  synth: {label:'Synth', oct:0,  gain:0.10, filter:{type:'lowpass', base:600,  track:2800, q:7}, lfo:{rate:0,depth:0},
    oscs:[{type:'sawtooth'},{type:'sawtooth',detune:11,gain:0.7},{type:'sawtooth',detune:-11,gain:0.7}]},
  pad:   {label:'Pad',   oct:-1, gain:0.11, filter:{type:'lowpass', base:500,  track:1400, q:2}, lfo:{rate:3,depth:0.006},
    oscs:[{type:'sawtooth',detune:6,gain:0.6},{type:'sawtooth',detune:-6,gain:0.6},{type:'sine',ratio:2,gain:0.3}]},
};
const SCALES = {
  major: {label:'Major (do-re-mi)', steps:[0,2,4,5,7,9,11]},
  penta: {label:'Pentatonic', steps:[0,2,4,7,9]},
  minor: {label:'Minor',      steps:[0,2,3,5,7,8,10]},
  whole: {label:'Whole-tone', steps:[0,2,4,6,8,10]},
};
const SHARP_NAMES=['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
const FLAT_NAMES =['C','D♭','D','E♭','E','F','G♭','G','A♭','A','B♭','B'];
const ROOT_PC={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
// Spell accidentals the way the key signature does: F major has a B♭ (not A♯);
// D/G/C/F minor are flat keys too. Everything else selectable here uses sharps.
function noteNames(){
  if(SETTINGS.scale==='minor') return ['D','G','C','F'].includes(SETTINGS.rootNote)?FLAT_NAMES:SHARP_NAMES;
  return SETTINGS.rootNote==='F'?FLAT_NAMES:SHARP_NAMES;
}
function noteFreq(midi){ return 440*Math.pow(2,(midi-69)/12); }
// One pitch mapping everywhere: X picks one of noteCount notes from the chosen
// root/octave. The vertical axis is owned by ONE setting (yAxis): 'octaves' turns
// the screen into rows (drawn as a grid in Notes mode, invisible in Flow);
// otherwise there is a single row and Y can mean loudness, brightness, or nothing.
let NOTES=[];
function buildScale(){
  const steps=(SCALES[SETTINGS.scale]||SCALES.major).steps;
  const rootPc=ROOT_PC[SETTINGS.rootNote]!==undefined?ROOT_PC[SETTINGS.rootNote]:0;
  const octv=parseInt(SETTINGS.octave,10)||4;
  const baseMidi=12*(octv+1)+rootPc;             // e.g. C4 = 60
  NOTES=[];
  const names=noteNames();
  const count=Math.max(2,Math.min(12,Math.round(SETTINGS.noteCount)||5));
  for(let i=0;i<count;i++){
    const midi=baseMidi+steps[i%steps.length]+12*Math.floor(i/steps.length);
    NOTES.push({freq:noteFreq(midi), pc:midi%12, label:names[midi%12]});
  }
}
function gridRowCount(){
  return SETTINGS.yAxis==='octaves' ? (parseInt(SETTINGS.octaveRows,10)||2) : 1;
}
function colIndex(x){ return Math.max(0,Math.min(NOTES.length-1,Math.floor(x*NOTES.length))); }
function rowIndex(y){ const r=gridRowCount(); return Math.max(0,Math.min(r-1,Math.floor(y*r))); }
// Octave for a finger height. Keys mode: the row's exact octave (discrete grid).
// Flow mode: continuous — pitch slides smoothly between octaves as the finger
// rises, in tune at each row's centre (the same heights as the Keys grid) and
// held there through the top/bottom quarter so resting is never between octaves.
function octaveShift(y){
  const r=gridRowCount(); if(r<=1) return 0;
  const t=Math.max(0,Math.min(1,y===undefined?0:y));
  if(SETTINGS.mode!=='flow') return rowIndex(t);
  return Math.max(0,Math.min(r-1, t*r-0.5));
}
function freqForX(x,y){
  if(!NOTES.length) return 110;
  return NOTES[colIndex(x)].freq * Math.pow(2,octaveShift(y));
}
// What vertical movement does WITHIN a note/voice ('none'|'loud'|'bright').
// When yAxis is 'octaves', Y selects the octave row instead, so within-cell Y does nothing.
function yAxisMode(){ return SETTINGS.yAxis==='octaves' ? 'none' : SETTINGS.yAxis; }
function yFilterPos(y){ return yAxisMode()==='bright' ? y : 0.5; }
function yLoudness(y){  return yAxisMode()==='loud'   ? 0.30+0.70*y : 1; }
// Sound macros (Sound pane → Fine-tune): three high-level sliders mapped across
// every voice, so a therapist can shape a sound without a synth editor. Each maps
// exponentially around 1× at the 0.5 default (the engine's long-standing values).
function macro(key){ const v=SETTINGS[key]; return v==null?0.5:v; }
function toneMul(){   return Math.pow(2,(macro('tone')-0.5)*2); }          // filter ×0.5..×2
function attackTime(){return 0.02*Math.pow(10,(0.5-macro('attack'))*2); }  // 2 ms..200 ms
function ringMul(){   return Math.pow(8,(macro('ring')-0.5)*2); }          // decays ×⅛..×8
function filtFreq(V,y){ return (V.filter.base+yFilterPos(y)*V.filter.track)*toneMul(); }

function makeImpulse(ac,dur,decay){
  const len=Math.floor(ac.sampleRate*dur), buf=ac.createBuffer(2,len,ac.sampleRate);
  for(let ch=0;ch<2;ch++){const d=buf.getChannelData(ch);
    for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/len,decay);}
  return buf;
}
function getAudio(){
  if(!audioCtx){
    // 'balanced' buffers glitch far less than 'interactive' on modest/throttled
    // machines (audio-thread underruns were audible as clicks during fast swipes);
    // the extra ~20-30 ms of latency is imperceptible for this use.
    const ac=audioCtx=new(window.AudioContext||window.webkitAudioContext)({latencyHint:'balanced'});
    masterGain=ac.createGain(); masterGain.gain.value=SETTINGS.mute?0:SETTINGS.volume;
    // Auto-mixer: eases the whole mix down as simultaneous voices stack up
    // (multiple fingers / palm contacts), so the sum never drives the limiter.
    polyGain=ac.createGain();
    masterGain.connect(polyGain);
    // Chorus (send connected on demand in applyChorus)
    const chDelay=chDelayN=ac.createDelay(); chDelay.delayTime.value=0.026;
    const chLfo=ac.createOscillator(); chLfo.frequency.value=0.6;
    const chDepth=ac.createGain(); chDepth.gain.value=0.004;
    chLfo.connect(chDepth); chDepth.connect(chDelay.delayTime); chLfo.start();
    chorusWet=ac.createGain(); chorusWet.gain.value=SETTINGS.chorus?0.6:0;
    const busA=fxBusA=ac.createGain();
    polyGain.connect(busA);
    chDelay.connect(chorusWet); chorusWet.connect(busA);
    // Echo (send connected on demand in applyEcho)
    const ecDelay=ecDelayN=ac.createDelay(); ecDelay.delayTime.value=0.33;
    const ecFb=ac.createGain(); ecFb.gain.value=0.32;   // 0.42 gave long dub-style repeat trains
    ecDelay.connect(ecFb); ecFb.connect(ecDelay);
    echoWet=ac.createGain(); echoWet.gain.value=SETTINGS.echo?0.5:0;
    const busB=fxBusB=ac.createGain();
    busA.connect(busB);
    ecDelay.connect(echoWet); echoWet.connect(busB);
    // Limiter — soft knee and moderate ratio: it should catch peaks gracefully,
    // not clamp them (a 20:1 hard knee audibly distorted low notes when several
    // voice tails summed during fast swipes).
    limiter=ac.createDynamicsCompressor();
    limiter.threshold.value=-9; limiter.knee.value=12; limiter.ratio.value=8;
    limiter.attack.value=0.004; limiter.release.value=0.25;
    limiter.connect(ac.destination);
    // Reverb (send connected on demand in applyReverb)
    convolver=ac.createConvolver(); convolver.buffer=makeImpulse(ac,3.8,2.0);
    reverbWet=ac.createGain(); reverbWet.gain.value=SETTINGS.reverb?0.9:0;
    busB.connect(limiter);
    convolver.connect(reverbWet); reverbWet.connect(limiter);
    applyReverb(); applyEcho(); applyChorus();
  }
  if(audioCtx.state==='suspended') audioCtx.resume();
  return audioCtx;
}
function applyVolume(){ if(masterGain) masterGain.gain.setTargetAtTime(SETTINGS.mute?0:SETTINGS.volume, audioCtx.currentTime, 0.05); }
// Fade the wet gain, and attach/detach the effect's input so an idle effect costs
// zero processing. Detach waits for the fade so switching off doesn't clip a tail.
function gateSend(on,wet,level,src,dst,getConn,setConn){
  wet.gain.setTargetAtTime(on?level:0, audioCtx.currentTime, 0.1);
  if(on && !getConn()){ src.connect(dst); setConn(true); }
  else if(!on && getConn()){
    setConn(false);
    setTimeout(()=>{ if(!getConn()){ try{src.disconnect(dst);}catch(e){} } },800);
  }
}
function applyReverb(){ if(reverbWet) gateSend(!!SETTINGS.reverb,reverbWet,0.9,fxBusB,convolver,()=>revConn,v=>revConn=v); }
function applyEcho(){   if(echoWet)   gateSend(!!SETTINGS.echo,  echoWet,  0.5,fxBusA,ecDelayN, ()=>echoConn,v=>echoConn=v); }
function applyChorus(){ if(chorusWet) gateSend(!!SETTINGS.chorus,chorusWet,0.6,polyGain,chDelayN,()=>chorConn,v=>chorConn=v); }
// 1 voice = full level; the curve only bites from the 3rd simultaneous voice on.
function updatePolyGain(){
  if(!polyGain||!audioCtx) return;
  const g=Math.min(1, 1.4/Math.sqrt(Math.max(1,soundingVoices)));
  polyGain.gain.setTargetAtTime(g, audioCtx.currentTime, 0.12);
}

let voiceSeq=0; const voices={}; const MAX_VOICES=16;
function startVoice(x,y){
  try{
    if(Object.keys(voices).length>=MAX_VOICES) return 0;
    const ac=getAudio(), vid=++voiceSeq, V=VOICES[SETTINGS.voice]||VOICES.pure;
    // +12 ms scheduling headroom: an event stamped exactly at currentTime can land
    // in a render quantum that has already been processed, truncating the attack
    // ramp into a step (an audible click, worst under CPU load).
    const freq=freqForX(x,y)*Math.pow(2,V.oct), t=ac.currentTime+0.012;
    const gain=ac.createGain(); gain.gain.value=0.0001;
    const vol=ac.createGain(); vol.gain.value=yLoudness(y);
    const pan=ac.createStereoPanner(); pan.pan.value=(x*2-1)*0.6;
    const filt=ac.createBiquadFilter(); filt.type=V.filter.type; filt.frequency.value=filtFreq(V,y);
    if(V.filter.q) filt.Q.value=V.filter.q;
    filt.connect(gain); gain.connect(vol); vol.connect(pan); pan.connect(masterGain);
    const nodes=[];
    for(const o of V.oscs){
      const ratio=o.ratio||1;
      const osc=ac.createOscillator(); osc.type=o.type||'sine'; osc.frequency.value=freq*ratio;
      if(o.detune) osc.detune.value=o.detune;
      const g=ac.createGain(); g.gain.setValueAtTime(o.gain!==undefined?o.gain:1, t);
      if(o.decayTo!==undefined) g.gain.setTargetAtTime((o.gain!==undefined?o.gain:1)*o.decayTo, t, 0.5);
      osc.connect(g); g.connect(filt); osc.start(t);
      nodes.push({osc,ratio,g,base:(o.gain!==undefined?o.gain:1),decayTo:o.decayTo});
    }
    if(V.fm){
      // 2-op FM: modulator drives the FIRST osc's frequency; depth scales with
      // the note frequency and decays like a struck tine (re-fired on retune).
      const mod=ac.createOscillator(); mod.type='sine'; mod.frequency.value=freq*V.fm.ratio;
      const mg=ac.createGain();
      mg.gain.setValueAtTime(freq*V.fm.depth, t);
      mg.gain.setTargetAtTime(freq*V.fm.depth*V.fm.decayTo, t, V.fm.decay);
      mod.connect(mg); mg.connect(nodes[0].osc.frequency); mod.start(t);
      nodes.push({osc:mod, ratio:V.fm.ratio, g:mg, base:0, mod:true});
    }
    let lfo=null;
    if(V.lfo.rate>0){
      lfo=ac.createOscillator(); const lfoG=ac.createGain();
      lfo.frequency.value=V.lfo.rate; lfoG.gain.value=freq*V.lfo.depth;
      lfo.connect(lfoG); nodes.forEach(n=>{if(!n.mod)lfoG.connect(n.osc.frequency);}); lfo.start();
    }
    gain.gain.setValueAtTime(0.0001,t);
    gain.gain.linearRampToValueAtTime(V.gain,t+attackTime());
    if(V.pluck) gain.gain.exponentialRampToValueAtTime(0.0008, t+attackTime()+V.pluck*ringMul());
    voices[vid]={nodes,lfo,gain,vol,pan,filt,freq,V};
    soundingVoices++; updatePolyGain();
    return vid;
  }catch(e){ return 0; }
}
// How long the voice takes to travel to a new note in Flow mode. It always LANDS
// exactly on scale notes (accurate at rest); glide only shapes the journey between
// them. Keys mode retunes near-instantly with an articulation dip (retuneVoice),
// so it stays crisp regardless.
const GLIDE_TIMES={off:0.02,gentle:0.10,smooth:0.25};
function moveVoice(vid,x,y,speed){
  const v=voices[vid]; if(!v) return;
  try{
    const now=getAudio().currentTime, V=v.V;
    const f=freqForX(x,y)*Math.pow(2,V.oct);
    if(Math.abs(f-v.freq)>0.5){  // retune only when the target pitch actually moved
      v.freq=f;
      const tc = SETTINGS.mode==='flow' ? (GLIDE_TIMES[SETTINGS.glide]||0.02) : 0.02;
      v.nodes.forEach(n=>n.osc.frequency.setTargetAtTime(f*n.ratio,now,tc));
    }
    v.pan.pan.setTargetAtTime((x*2-1)*0.6,now,0.08);
    if(yAxisMode()==='bright') v.filt.frequency.setTargetAtTime((V.filter.base+y*V.filter.track)*toneMul(),now,0.08);
    if(yAxisMode()==='loud')   v.vol.gain.setTargetAtTime(yLoudness(y),now,0.08);
  }catch(e){}
}
// Keys-mode zone crossing: retune the SAME voice with a quick articulation dip,
// instead of stopping one voice and starting another. Two overlapping notes a few
// tens of Hz apart beat against each other — a low squelch — no matter how the
// crossfade is shaped (long fades = occasional flutter, short fades = a thump
// every time). A single retuned oscillator cannot beat against itself; Flow mode
// retunes and was always squelch-free. Returns false if the voice is gone.
function retuneVoice(vid,x,y){
  const v=voices[vid]; if(!v) return false;
  try{
    const ac=getAudio(), now=ac.currentTime+0.012, V=v.V;   // scheduling headroom, see startVoice
    const f=freqForX(x,y)*Math.pow(2,V.oct);
    v.freq=f;
    // Anchor before ramping: linear/exponential ramps interpolate from the LAST
    // timeline event — for a held note that's its attack from seconds ago, so an
    // un-anchored ramp JUMPS the value instantly (a hard click on every crossing).
    // cancelAndHoldAtTime alone does NOT anchor when no future events exist.
    const hold=p=>{
      if(p.cancelAndHoldAtTime) p.cancelAndHoldAtTime(now); else p.cancelScheduledValues(now);
      p.setValueAtTime(p.value,now);
    };
    v.nodes.forEach(n=>{
      n.osc.frequency.setTargetAtTime(f*n.ratio,now,0.005);
      if(n.mod){ // re-strike the FM tine: depth rescales with the new frequency
        hold(n.g.gain);
        n.g.gain.linearRampToValueAtTime(f*V.fm.depth,now+0.008);
        n.g.gain.setTargetAtTime(f*V.fm.depth*V.fm.decayTo,now+0.008,V.fm.decay);
      } else if(n.decayTo!==undefined){ // re-strike decaying partials (bell/glass sparkle)
        hold(n.g.gain);
        n.g.gain.linearRampToValueAtTime(n.base,now+0.008);
        n.g.gain.setTargetAtTime(n.base*n.decayTo,now+0.008,0.5);
      }
    });
    const g=v.gain.gain; hold(g);
    if(V.pluck){ // re-fire the pluck envelope so glissandos strike each note
      g.linearRampToValueAtTime(V.gain,now+0.012);
      g.exponentialRampToValueAtTime(0.0008,now+0.012+V.pluck*ringMul());
    } else {     // brief dip so each zone still reads as its own note
      // 45% over 20 ms is deep enough to articulate but shallow/slow enough not
      // to read as a click when a fast swipe fires it several times a second
      g.linearRampToValueAtTime(V.gain*0.45,now+0.02);
      g.linearRampToValueAtTime(V.gain,now+0.08);
    }
    v.pan.pan.setTargetAtTime((x*2-1)*0.6,now,0.08);
    if(yAxisMode()==='bright') v.filt.frequency.setTargetAtTime((V.filter.base+y*V.filter.track)*toneMul(),now,0.08);
    if(yAxisMode()==='loud')   v.vol.gain.setTargetAtTime(yLoudness(y),now,0.08);
    return true;
  }catch(e){ return false; }
}
// Only called when a note truly ends (finger lift / settings change) — zone
// crossings retune the voice instead (see retuneVoice). The fade runs to ~7 time
// constants (<0.1% level) so the hard oscillator stop never clicks.
function stopVoice(vid){
  const v=voices[vid]; if(!v) return;
  delete voices[vid];
  try{
    const ac=getAudio(), t=ac.currentTime+0.012;   // scheduling headroom, see startVoice
    const rel=0.25*ringMul();   // Ring macro scales the release tail
    // cancelAndHoldAtTime freezes the envelope where it is; the fallback's
    // cancel+setValue can snap a mid-attack ramp back to ~0 (an audible click).
    if(v.gain.gain.cancelAndHoldAtTime) v.gain.gain.cancelAndHoldAtTime(t);
    else { v.gain.gain.cancelScheduledValues(t); v.gain.gain.setValueAtTime(v.gain.gain.value,t); }
    v.gain.gain.setTargetAtTime(0,t,rel);
    const stopAt=t+rel*7;
    v.nodes.forEach(n=>{try{n.osc.stop(stopAt);}catch(e){}});
    if(v.lfo){try{v.lfo.stop(stopAt);}catch(e){}}
    v.nodes[0].osc.onended=()=>{soundingVoices=Math.max(0,soundingVoices-1);updatePolyGain();try{v.gain.disconnect();v.vol.disconnect();v.pan.disconnect();v.filt.disconnect();}catch(e){}};
  }catch(e){}
}
// One-shot note with its own attack-decay envelope, for discrete animation sounds
// (e.g. Life's birth notes). gainMul<1 keeps them below the sustained touch voices.
// Fire-and-forget: routes like a touch voice and cleans itself up when it ends.
function pluckNote(x,y,gainMul){
  try{
    const ac=getAudio(); if(!ac||!masterGain) return;
    const V=VOICES[SETTINGS.voice]||VOICES.pure;
    const freq=freqForX(x,y)*Math.pow(2,V.oct), t=ac.currentTime+0.012;   // scheduling headroom
    const peak=V.gain*(gainMul!=null?gainMul:1)*yLoudness(y);
    const decay=0.7*ringMul();   // Ring macro scales the one-shot decay too
    const gain=ac.createGain(); gain.gain.value=0.0001;
    const pan=ac.createStereoPanner(); pan.pan.value=(x*2-1)*0.6;
    const filt=ac.createBiquadFilter(); filt.type=V.filter.type; filt.frequency.value=filtFreq(V,y);
    if(V.filter.q) filt.Q.value=V.filter.q;
    filt.connect(gain); gain.connect(pan); pan.connect(masterGain);
    const oscs=[];
    for(const o of V.oscs){
      const ratio=o.ratio||1;
      const osc=ac.createOscillator(); osc.type=o.type||'sine'; osc.frequency.value=freq*ratio;
      if(o.detune) osc.detune.value=o.detune;
      const g=ac.createGain(); g.gain.value=(o.gain!==undefined?o.gain:1);
      osc.connect(g); g.connect(filt); osc.start(t); osc.stop(t+decay+0.35);
      oscs.push(osc);
    }
    gain.gain.setValueAtTime(0.0001,t);
    gain.gain.linearRampToValueAtTime(peak,t+0.012);
    gain.gain.exponentialRampToValueAtTime(0.0008,t+decay);
    soundingVoices++; updatePolyGain();
    oscs[0].onended=()=>{soundingVoices=Math.max(0,soundingVoices-1);updatePolyGain();try{gain.disconnect();pan.disconnect();filt.disconnect();}catch(e){}};
  }catch(e){}
}

// ── Input (up to 5 independent touches + mouse fallback) ───────────────────────
class Pointer {
  constructor(id){ this.id=id; this.x=0; this.y=0; this.px=0; this.py=0;
    this.dx=0; this.dy=0; this.down=false; this.moved=false; this.color=[1,1,1]; this.voice=0;
    this.col=-1; this.row=-1; }
}
const pointers = [];
function getPointer(id){ let p=pointers.find(p=>p.id===id); if(!p){p=new Pointer(id); pointers.push(p);} return p; }
function toSim(x,y){ return { x: x/canvas.clientWidth, y: 1-y/canvas.clientHeight }; }

function pointerColor(col){
  if(SETTINGS.colorMode==='note') return bandColor01(col);
  return pickColor();
}
function onDown(id, cx, cy){
  const p=getPointer(id), s=toSim(cx,cy);
  p.x=s.x; p.y=s.y; p.px=s.x; p.py=s.y; p.dx=0; p.dy=0;
  p.down=true; p.moved=false;
  p.col=colIndex(s.x); p.row=rowIndex(s.y);
  p.color=pointerColor(p.col);
  if(p.voice) stopVoice(p.voice);
  // Apps with their own sounds (drums, big-switch) set Anim.noVoices=true and
  // play in onCell instead of using the pitched voice engine.
  p.voice = Anim.noVoices ? 0 : startVoice(s.x,s.y);
  // Apps with onCell fire their own press effect (drums, song grid, …);
  // for the generic path the framework fires it so Keys mode gets fxCell.
  if(SETTINGS.mode==='notes'){ flashCell(p.col,p.row); updateHeldCells(); if(Anim.onCell) Anim.onCell(p.col,p.row); else fxCell(p.col,p.row); }
}
function onMove(id, cx, cy){
  const p=pointers.find(p=>p.id===id);
  if(!p || !p.down) return;
  const s=toSim(cx,cy);
  p.dx=s.x-p.x; p.dy=s.y-p.y; p.x=s.x; p.y=s.y;
  const c=colIndex(s.x), r=rowIndex(s.y);
  if(SETTINGS.mode==='notes'){
    if(c!==p.col || r!==p.row){   // crossed into a new note zone: retune + articulate
      p.col=c; p.row=r; p.color=pointerColor(c);
      if(!Anim.noVoices && !retuneVoice(p.voice,s.x,s.y)) p.voice=startVoice(s.x,s.y);
      flashCell(c,r); updateHeldCells();
      if(Anim.onCell) Anim.onCell(c,r); else fxCell(c,r);
      return;
    }
  } else if(c!==p.col){
    // Flow: the sustained voice retunes in moveVoice; just keep the paint colour
    // tracking the note column when note colours are on.
    p.col=c; p.row=r;
    if(SETTINGS.colorMode==='note') p.color=pointerColor(c);
  }
  moveVoice(p.voice, s.x, s.y, Math.hypot(p.dx,p.dy));
}
function onUp(id){
  const i=pointers.findIndex(p=>p.id===id); if(i<0) return;
  const p=pointers[i]; p.down=false; stopVoice(p.voice); p.voice=0;
  pointers.splice(i,1);
  updateHeldCells();
}
canvas.addEventListener('mousedown',e=>{ onDown('mouse',e.offsetX,e.offsetY); });
canvas.addEventListener('mousemove',e=>{ onMove('mouse',e.offsetX,e.offsetY); });
window.addEventListener('mouseup',()=>{ onUp('mouse'); });
canvas.addEventListener('touchstart',e=>{ e.preventDefault(); const r=canvas.getBoundingClientRect();
  for(const t of e.changedTouches) onDown(t.identifier,t.clientX-r.left,t.clientY-r.top); },{passive:false});
canvas.addEventListener('touchmove',e=>{ e.preventDefault(); const r=canvas.getBoundingClientRect();
  for(const t of e.changedTouches) onMove(t.identifier,t.clientX-r.left,t.clientY-r.top); },{passive:false});
canvas.addEventListener('touchend',e=>{ for(const t of e.changedTouches) onUp(t.identifier); },{passive:false});
canvas.addEventListener('touchcancel',e=>{ for(const t of e.changedTouches) onUp(t.identifier); },{passive:false});

// ── Settings panel UI ──────────────────────────────────────────────────────────
function rgbCss(c){ return `rgb(${Math.round(Math.min(c[0],1)*255)},${Math.round(Math.min(c[1],1)*255)},${Math.round(Math.min(c[2],1)*255)})`; }

function setTheme(name){
  currentTheme=name; SETTINGS.theme=name;
  saveSettings();
  if(currentQuickMode==='visuals') buildVisualsPanel();
}

function getCurrentStyleKey(){
  if(!Anim.styles) return null;
  for(const k in Anim.styles){
    const s=Anim.styles[k]; let match=true;
    for(const key in s){ if(key==='label') continue; if(SETTINGS[key]!==s[key]){match=false;break;} }
    if(match) return k;
  }
  return null;
}

function applyStyle(key){
  const s=Anim.styles&&Anim.styles[key]; if(!s) return;
  for(const k in s){ if(k!=='label') SETTINGS[k]=s[k]; }
  saveSettings();
  if(currentQuickMode==='visuals') buildVisualsPanel();
}

function makeSlider(item){
  const row=document.createElement('div'); row.className='row';
  const head=document.createElement('div'); head.className='rowhead';
  const lab=document.createElement('label'); lab.textContent=item.label;
  const val=document.createElement('span'); val.className='val';
  head.appendChild(lab); head.appendChild(val);
  const inp=document.createElement('input');
  inp.type='range'; inp.min=item.min; inp.max=item.max; inp.step=item.step; inp.value=SETTINGS[item.key];
  val.textContent=Number(SETTINGS[item.key]).toFixed(item.dp);
  inp.addEventListener('input',()=>{
    const v=parseFloat(inp.value); SETTINGS[item.key]=v; val.textContent=v.toFixed(item.dp);
    if(item.key==='volume') applyVolume();
    saveSettings();
    if(item.onChange) item.onChange();
  });
  row.appendChild(head); row.appendChild(inp);
  return row;
}
function makeToggle(label,key,onChange){
  const row=document.createElement('div'); row.className='toggle';
  const lab=document.createElement('label'); lab.textContent=label;
  const sw=document.createElement('div'); sw.className='switch'+(SETTINGS[key]?' on':'');
  sw.addEventListener('click',e=>{ e.stopPropagation(); getAudio();
    SETTINGS[key]=!SETTINGS[key]; sw.classList.toggle('on',SETTINGS[key]); saveSettings(); if(onChange) onChange(); });
  row.appendChild(lab); row.appendChild(sw);
  return row;
}
function makeChips(label,key,map,onChange){
  const wrap=document.createElement('div');
  const sec=document.createElement('div'); sec.className='sectn'; sec.textContent=label; wrap.appendChild(sec);
  const chips=document.createElement('div'); chips.className='chips';
  for(const k in map){
    const c=document.createElement('div'); c.className='chip'+(SETTINGS[key]===k?' active':'');
    c.textContent=map[k].label;
    c.addEventListener('click',e=>{ e.stopPropagation(); getAudio();
      SETTINGS[key]=k; saveSettings();
      chips.querySelectorAll('.chip').forEach(x=>x.classList.remove('active')); c.classList.add('active');
      if(onChange) onChange(); });
    chips.appendChild(c);
  }
  wrap.appendChild(chips); return wrap;
}

// ── Visuals panel: mode-aware — Keys shows zone/key feedback, Flow shows paint ──
const COLORMODE_OPTS={note:{label:'🌈 Note colours'},theme:{label:'🎨 Theme'},single:{label:'⬤ One colour'}};
const PAINTKEYS_OPTS={off:{label:'Off'},subtle:{label:'✨ Subtle'},full:{label:'🌊 Full trails'}};
function appendColorControls(el){
  el.appendChild(makeChips('Paint colours','colorMode',COLORMODE_OPTS,()=>{
    if(SETTINGS.colorMode==='single'&&!SETTINGS.lockedColor){ SETTINGS.lockedColor=[1,1,1]; saveSettings(); }
    buildVisualsPanel();
  }));
  if(SETTINGS.colorMode==='theme'){
    const chips=document.createElement('div'); chips.className='chips';
    for(const k in Anim.themes){
      const c=document.createElement('div'); c.className='chip'+(k===currentTheme?' active':'');
      c.textContent=Anim.themes[k].label||k;
      c.addEventListener('click',e=>{ e.stopPropagation(); getAudio(); setTheme(k); });
      chips.appendChild(c);
    }
    el.appendChild(chips);
  } else if(SETTINGS.colorMode==='single'){
    const row=document.createElement('div'); row.className='swrow';
    const lk=SETTINGS.lockedColor;
    STANDARD_SWATCHES.forEach(c=>{
      const sw=document.createElement('div'); sw.className='swatch'; sw.style.background=rgbCss(c);
      if(lk) sw.classList.toggle('active',Math.abs(c[0]-lk[0])<0.05&&Math.abs(c[1]-lk[1])<0.05&&Math.abs(c[2]-lk[2])<0.05);
      sw.addEventListener('click',e=>{ e.stopPropagation(); getAudio();
        SETTINGS.lockedColor=c.slice(); saveSettings(); buildVisualsPanel(); });
      row.appendChild(sw);
    });
    const pk=document.createElement('label'); pk.className='picker'; pk.title='Pick a custom colour';
    if(lk && !row.querySelector('.swatch.active')) pk.classList.add('active');
    const inp=document.createElement('input'); inp.type='color';
    inp.value=lk?'#'+lk.map(v=>('0'+Math.round(Math.min(v,1)*255).toString(16)).slice(-2)).join(''):'#ffffff';
    inp.addEventListener('input',e=>{ e.stopPropagation(); getAudio();
      SETTINGS.lockedColor=hexToRGB(inp.value); saveSettings(); });
    pk.addEventListener('click',e=>e.stopPropagation());
    pk.appendChild(inp); row.appendChild(pk);
    el.appendChild(row);
  }
}
function appendBgControl(el){
  const bgRow=document.createElement('div'); bgRow.className='swrow';
  const bgpk=document.createElement('label'); bgpk.className='bbar bgpick'; bgpk.title='Background colour';
  bgpk.textContent='Background colour';
  const bgInp=document.createElement('input'); bgInp.type='color'; bgInp.value=SETTINGS.bg;
  bgInp.addEventListener('input',e=>{ e.stopPropagation(); SETTINGS.bg=bgInp.value; saveSettings(); applyBg(); });
  bgpk.addEventListener('click',e=>e.stopPropagation());
  bgpk.appendChild(bgInp); bgRow.appendChild(bgpk); el.appendChild(bgRow);
}
// Collapsed "Fine-tune" group at the bottom of every Visuals panel: set-once
// controls (app sliders, background, performance diagnostics) stay one tap away
// without crowding the everyday panel. Apps with their own buildVisuals call
// appendFineTune(el) — optionally with a builder for their own advanced rows.
// Open state is remembered for the session only, so panel rebuilds (chip taps
// re-run buildVisualsPanel) don't snap it shut while someone is in it.
let fineTuneOpen=false;
function makeDrawer(el, build){
  const det=document.createElement('details'); det.className='finetune'; det.open=fineTuneOpen;
  const sum=document.createElement('summary'); sum.textContent='Fine-tune';
  sum.addEventListener('click',e=>e.stopPropagation());
  det.addEventListener('toggle',()=>{ fineTuneOpen=det.open; });
  det.appendChild(sum);
  const body=document.createElement('div');
  build(body);
  det.appendChild(body);
  el.appendChild(det);
}
function appendFineTune(el, build){
  makeDrawer(el, body=>{
    if(build) build(body);
    body.appendChild(makeChips('Performance','quality',QUALITY,()=>{ if(SETTINGS.quality!=='auto') setPerf(SETTINGS.quality); }));
    body.appendChild(makeToggle('Show performance','showStats',applyStats));
  });
}
function buildVisualsPanel(){
  const el=document.getElementById('visualsContent'); el.innerHTML='';
  // An app can take over the Visuals panel (e.g. Song Grid's reward styles);
  // QUALITY/setPerf/applyStats/applyBg and the make* helpers are in scope for it.
  if(Anim.buildVisuals){ Anim.buildVisuals(el); return; }
  if(SETTINGS.mode==='notes' && !Anim.lockMode){
    // Keys mode: the grid is the instrument — feedback stays contained in the
    // cells (zone look, press effect) and paint is an explicit choice.
    el.appendChild(makeChips('Paint trails','paintKeys',PAINTKEYS_OPTS,()=>{ refreshRailButtons(); buildVisualsPanel(); }));
    if(SETTINGS.paintKeys!=='off') appendColorControls(el);
    el.appendChild(makeChips('Zone look','zoneLook',ZONE_OPTS,()=>{ buildBands(); buildVisualsPanel(); }));
    if(SETTINGS.zoneLook!=='off')
      el.appendChild(makeToggle('Note letters on screen','showLabels',buildBands));
    el.appendChild(makeChips('When a key is pressed','pressFx',PRESSFX_OPTS));
    appendFineTune(el, ft=>appendBgControl(ft));
  } else {
    // Flow mode: painting IS the app — colours and styles stay up top, the
    // per-app sliders tuck into Fine-tune.
    el.appendChild(makeToggle('Paint trails','paint',buildVisualsPanel));
    if(SETTINGS.paint!==false) appendColorControls(el);
    if(Anim.styles){
      const h=document.createElement('div'); h.className='sectn'; h.textContent='Style'; el.appendChild(h);
      const chips=document.createElement('div'); chips.className='chips';
      const activeKey=getCurrentStyleKey();
      for(const k in Anim.styles){
        const c=document.createElement('div'); c.className='chip'+(k===activeKey?' active':'');
        c.textContent=Anim.styles[k].label||k;
        c.addEventListener('click',e=>{ e.stopPropagation(); getAudio(); applyStyle(k); });
        chips.appendChild(c);
      }
      el.appendChild(chips);
    }
    appendFineTune(el, ft=>{
      // Animation-specific sliders/toggles
      if((Anim.schema||[]).length){
        const h2=document.createElement('div'); h2.className='sectn'; h2.textContent=Anim.sectionLabel||'Controls'; ft.appendChild(h2);
        Anim.schema.forEach(it=>{
          if(it.type==='toggle') ft.appendChild(makeToggle(it.label,it.key));
          else if(it.type==='preset-chips') ft.appendChild(makeChips(it.label,it.key,it.options));
          else ft.appendChild(makeSlider(it));
        });
      }
      appendBgControl(ft);
    });
  }
}

// ── Notes panel: which notes the student can play, and how they're laid out ─────
const OCT_OPTS={'3':{label:'Low'},'4':{label:'Middle'},'5':{label:'High'}};
const YAXIS_OPTS={octaves:{label:'▦ Octaves'},loud:{label:'Loudness'},bright:{label:'Brightness'},none:{label:'Nothing'}};
const OCTROWS_OPTS={'2':{label:'2 octaves'},'3':{label:'3 octaves'}};
const ZONE_OPTS={tint:{label:'Coloured'},lines:{label:'Lines only'},off:{label:'Invisible'}};
const GLIDE_OPTS={off:{label:'Off (crisp)'},gentle:{label:'Gentle'},smooth:{label:'Smooth'}};
// Starting-note chips, marked when that key contains sharps/flats for the current scale.
function rootOptions(){
  const steps=(SCALES[SETTINGS.scale]||SCALES.major).steps;
  const NATURAL={0:1,2:1,4:1,5:1,7:1,9:1,11:1};
  const opts={};
  for(const r in ROOT_PC){
    const hasAcc=steps.some(s=>!NATURAL[(ROOT_PC[r]+s)%12]);
    let mark='';
    if(hasAcc){
      const flats = SETTINGS.scale==='minor' ? ['D','G','C','F'].includes(r) : r==='F';
      mark = flats ? ' (♭)' : ' (♯)';
    }
    opts[r]={label:r+mark};
  }
  return opts;
}
function refreshMusic(){ buildScale(); buildBands(); refreshRailButtons(); }
function refreshInstrument(){ refreshMusic(); buildInstrumentPanel(); }
function buildInstrumentPanel(){
  const el=document.getElementById('instrumentContent'); el.innerHTML='';
  // An app can take over the Notes panel entirely (e.g. Song Grid's song picker);
  // the framework helpers (makeChips/makeSlider/makeToggle, rootOptions, OCT_OPTS,
  // refreshMusic/refreshInstrument) are all in scope for it to reuse.
  if(Anim.buildInstrument){ Anim.buildInstrument(el); return; }
  // Keys/Flow is switched from the rail 🎹/🌊 button only — the open panel
  // rebuilds itself when it changes, so no duplicate Mode chips here.
  el.appendChild(makeChips('Up / down means…','yAxis',YAXIS_OPTS,refreshInstrument));
  if(SETTINGS.yAxis==='octaves')
    el.appendChild(makeChips('How many octaves (higher on screen = higher pitch)','octaveRows',OCTROWS_OPTS,refreshMusic));
  // Zone look / note letters / press effect are appearance, not musical content —
  // they live in the Keys-mode Visuals panel (buildVisualsPanel).
  if(SETTINGS.mode!=='notes')
    el.appendChild(makeChips('Glide between notes','glide',GLIDE_OPTS));
  el.appendChild(makeChips('Scale','scale',SCALES,refreshInstrument));
  el.appendChild(makeChips('Starting note','rootNote',rootOptions(),refreshMusic));
  el.appendChild(makeChips('Register','octave',OCT_OPTS,refreshMusic));
  // Up to 12: a full octave run plus a few (an octave of major = 8). Zones get
  // narrow up there — meant for the big room screen and able hands, so the slider
  // allows it but the default stays at 5.
  el.appendChild(makeSlider({key:'noteCount',label:'Number of notes',min:2,max:12,step:1,dp:0,onChange:refreshMusic}));
}

// ── Instrument panel (id "sound"): what the notes sound like ────────────────────
function buildSoundPanel(){
  const snd=document.getElementById('soundControls'); snd.innerHTML='';
  if(Anim.buildSound){ Anim.buildSound(snd); return; }   // full takeover (e.g. drums: no Voice)
  if(Anim.soundExtras) Anim.soundExtras(snd);   // app-specific controls (e.g. tuning) on top
  snd.appendChild(makeChips('Voice','voice',VOICES));
  const fx=document.createElement('div'); fx.className='sectn'; fx.textContent='Effects'; snd.appendChild(fx);
  snd.appendChild(makeToggle('Reverb','reverb',applyReverb));
  snd.appendChild(makeToggle('Echo',  'echo',  applyEcho));
  snd.appendChild(makeToggle('Chorus','chorus',applyChorus));
  snd.appendChild(makeToggle('Mute',  'mute',  applyVolume));
  snd.appendChild(makeSlider({key:'volume',label:'Volume',min:0,max:1,step:0.01,dp:2}));
  // Sound macros: three student-safe sliders that shape ANY voice (see toneMul/
  // attackTime/ringMul). New notes pick changes up; nothing can break a sound.
  makeDrawer(snd, ft=>{
    const h=document.createElement('div'); h.className='sectn'; h.textContent='Shape the sound'; ft.appendChild(h);
    ft.appendChild(makeSlider({key:'tone',   label:'Brightness (dark → bright)', min:0,max:1,step:0.05,dp:2}));
    ft.appendChild(makeSlider({key:'attack', label:'Attack (soft → crisp)',      min:0,max:1,step:0.05,dp:2}));
    ft.appendChild(makeSlider({key:'ring',   label:'Ring (short → long)',        min:0,max:1,step:0.05,dp:2}));
  });
}

// ── Named presets (per-student setups, stored locally) ─────────────────────────
const PRESET_KEY = 'presets:' + location.pathname.split('/').pop();
function loadPresets(){ try{ return JSON.parse(localStorage.getItem(PRESET_KEY)||'{}'); }catch(e){ return {}; } }
function storePresets(o){ try{ localStorage.setItem(PRESET_KEY, JSON.stringify(o)); }catch(e){} }
function applyAllSettings(){
  saveSettings();
  const tk=Object.keys(Anim.themes); currentTheme=tk.includes(SETTINGS.theme)?SETTINGS.theme:tk[0];
  buildScale(); buildBands();
  applyVolume(); applyReverb(); applyEcho(); applyChorus(); applyBg(); applyStats();
  if(SETTINGS.quality!=='auto') setPerf(SETTINGS.quality);
  refreshRailButtons();
  if(currentQuickMode && PANE_BUILDERS[currentQuickMode]) PANE_BUILDERS[currentQuickMode]();
}
function applyPreset(name){
  const p=loadPresets()[name]; if(!p) return;
  SETTINGS=Object.assign({}, SHARED_DEFAULTS, Anim.defaults||{}, p);
  SETTINGS.locked=false;   // loading a preset never locks you out
  applyAllSettings();
}
function buildPresetsPanel(){
  const el=document.getElementById('presetsContent'); el.innerHTML='';
  const h=document.createElement('div'); h.className='sectn'; h.textContent='Save current setup'; el.appendChild(h);
  const inp=document.createElement('input'); inp.type='text'; inp.maxLength=48;
  inp.placeholder='Preset name, e.g. "Alex — 5 notes, calm"';
  el.appendChild(inp);
  const save=document.createElement('button'); save.className='btn';
  save.style.cssText='margin-top:10px;width:100%;text-align:center';
  save.textContent='💾 Save preset';
  const doSave=()=>{
    const name=inp.value.trim(); if(!name){ inp.focus(); return; }
    const all=loadPresets();
    const snap=Object.assign({},SETTINGS); delete snap.locked;
    all[name]=snap; storePresets(all);
    inp.value=''; buildPresetsPanel();
  };
  save.addEventListener('click',e=>{ e.stopPropagation(); doSave(); });
  inp.addEventListener('keydown',e=>{ if(e.key==='Enter') doSave(); });
  el.appendChild(save);
  const h2=document.createElement('div'); h2.className='sectn'; h2.textContent='Saved presets'; el.appendChild(h2);
  const all=loadPresets(), names=Object.keys(all).sort((a,b)=>a.localeCompare(b));
  if(!names.length){
    const none=document.createElement('div');
    none.style.cssText='color:rgba(255,255,255,0.4);font-size:13px';
    none.textContent='No presets saved yet.';
    el.appendChild(none);
  }
  names.forEach(name=>{
    const row=document.createElement('div'); row.className='prow';
    const load=document.createElement('button'); load.className='chip pname'; load.textContent=name; load.title='Load this preset';
    load.addEventListener('click',e=>{ e.stopPropagation(); getAudio(); applyPreset(name); buildPresetsPanel(); });
    const del=document.createElement('button'); del.className='chip'; del.textContent='✕'; del.title='Delete preset';
    del.addEventListener('click',e=>{ e.stopPropagation();
      const a=loadPresets(); delete a[name]; storePresets(a); buildPresetsPanel(); });
    row.appendChild(load); row.appendChild(del); el.appendChild(row);
  });
  const h3=document.createElement('div'); h3.className='sectn'; h3.textContent='Start over'; el.appendChild(h3);
  const resetBtn=document.createElement('button'); resetBtn.className='btn';
  resetBtn.style.cssText='width:100%;text-align:center';
  resetBtn.textContent='↺ Reset all settings to defaults';
  resetBtn.addEventListener('click',e=>{ e.stopPropagation();
    SETTINGS=Object.assign({},SHARED_DEFAULTS,Anim.defaults||{});
    applyAllSettings();
    if(Anim.reset) Anim.reset();
  });
  el.appendChild(resetBtn);
}

// ── Session lock: hide every control so a student can only paint & play ────────
function setLocked(v){ SETTINGS.locked=!!v; saveSettings(); applyLock(); }
function applyLock(){
  const locked=!!SETTINGS.locked;
  ui.style.display = locked?'none':'';
  document.getElementById('unlockZone').style.display = locked?'block':'none';
  if(locked){
    currentQuickMode=null;
    closePanel(); updateBarButtons();
    const hint=document.getElementById('lockHint');
    hint.classList.add('show');
    clearTimeout(hint._ht); hint._ht=setTimeout(()=>hint.classList.remove('show'),4500);
  }
}
(function(){
  const z=document.getElementById('unlockZone'); let t=null;
  const start=e=>{ e.preventDefault(); e.stopPropagation();
    z.style.background='rgba(255,255,255,0.10)';
    clearTimeout(t); t=setTimeout(()=>{ z.style.background=''; setLocked(false); },3000); };
  const cancel=()=>{ clearTimeout(t); t=null; z.style.background=''; };
  z.addEventListener('mousedown',start);
  z.addEventListener('touchstart',start,{passive:false});
  z.addEventListener('mouseup',cancel); z.addEventListener('mouseleave',cancel);
  z.addEventListener('touchend',cancel); z.addEventListener('touchcancel',cancel);
})();

// ── Menu bar ───────────────────────────────────────────────────────────────────
// The 'open' class on #ui keeps the rail at full opacity while a panel is open.
function closePanel(){ ui.classList.remove('open'); panel.classList.remove('open'); document.querySelectorAll('.pane').forEach(p=>p.classList.remove('active')); }
const PANE_BUILDERS={instrument:buildInstrumentPanel,sound:buildSoundPanel,visuals:buildVisualsPanel,presets:buildPresetsPanel};
const PANE_IDS={instrument:'paneInstrument',sound:'paneSound',visuals:'paneVisuals',presets:'panePresets'};
function showPanel(name){
  const id=PANE_IDS[name]||'paneInstrument';
  document.querySelectorAll('.pane').forEach(p=>p.classList.toggle('active',p.id===id));
  panel.classList.add('open'); ui.classList.add('open');
}
function updateBarButtons(){
  document.querySelectorAll('.bbar[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===currentQuickMode));
}

// ── Rail buttons: framework-level (mode toggle, lock) + animation-provided ───────
// Anim.railButtons: [{ id, icon():str, title():str, active():bool, show():bool, key:str, onClick() }]
const FRAME_RAIL=[
  { id:'mode',
    icon:()=>SETTINGS.mode==='notes'?'🎹':'🌊',
    title:()=>SETTINGS.mode==='notes'?'Keys mode — tap for free Flow':'Flow mode — tap for Keys zones',
    onClick(){
      SETTINGS.mode = SETTINGS.mode==='notes' ? 'flow' : 'notes';
      saveSettings(); buildScale(); buildBands();
      if(currentQuickMode==='instrument') buildInstrumentPanel();
      else if(currentQuickMode==='visuals') buildVisualsPanel();
    }},
  { id:'clear', icon:()=>'🧹', title:()=>'Clear the painting',
    show:()=>paintMode()!=='off',   // nothing to clear when the mode isn't painting
    onClick(){ if(Anim.reset) Anim.reset(); }},
  { id:'lock', icon:()=>'🔒', title:()=>'Lock controls (hold top-left corner 3s to unlock)',
    onClick(){ setLocked(true); }},
];
// Apps that only make sense as a note grid set Anim.lockMode='notes' — the
// Keys/Flow rail toggle is hidden and SETTINGS.mode stays as their defaults set it.
// Anim.hideRail=['clear',...] hides other framework rail buttons that don't apply.
function allRailButtons(){
  const hide=new Set(Anim.hideRail||[]); if(Anim.lockMode) hide.add('mode');
  return FRAME_RAIL.filter(b=>!hide.has(b.id)).concat(Anim.railButtons||[]);
}
function buildRailButtons(){
  railExtra.innerHTML='';
  allRailButtons().forEach(desc=>{
    const b=document.createElement('button'); b.className='btn'; b.dataset.rail=desc.id;
    b.addEventListener('click',e=>{ e.stopPropagation(); getAudio(); pokeSim(); desc.onClick(); refreshRailButtons(); });
    railExtra.appendChild(b);
  });
  refreshRailButtons();
}
function refreshRailButtons(){
  allRailButtons().forEach(desc=>{
    const b=railExtra.querySelector('[data-rail="'+desc.id+'"]'); if(!b) return;
    if(desc.icon)   b.textContent=desc.icon();
    if(desc.title)  b.title=desc.title();
    if(desc.active) b.classList.toggle('active',!!desc.active());
    if(desc.show)   b.style.display = desc.show() ? '' : 'none';
  });
}
window.addEventListener('keydown',e=>{
  if(e.target!==document.body) return;
  const desc=allRailButtons().find(d=>d.key&&d.key===e.key);
  if(!desc) return;
  e.preventDefault(); getAudio(); desc.onClick(); refreshRailButtons();
});
function showQuickMode(mode){
  if(currentQuickMode===mode){ currentQuickMode=null; closePanel(); updateBarButtons(); return; }
  currentQuickMode=mode; updateBarButtons(); closePanel();
  if(PANE_BUILDERS[mode]){ PANE_BUILDERS[mode](); showPanel(mode); }
}

document.querySelectorAll('.bbar[data-mode]').forEach(btn=>{
  btn.addEventListener('click',e=>{ e.stopPropagation(); getAudio(); showQuickMode(btn.dataset.mode); });
});
panel.addEventListener('mousedown',e=>e.stopPropagation());
panel.addEventListener('touchstart',e=>e.stopPropagation(),{passive:false});

// ── Lifecycle / render loop ──────────────────────────────────────────────────────
let glLost=false, lastTime=Date.now(), fpsAccum=0, fpsFrames=0;
// The sim sleeps 12 s after the last touch or visual change (the last frame stays
// on screen) instead of simulating an unchanging field forever — the page runs all
// day in the sensory room and the constant GPU/CPU load cooks laptops.
let simWakeUntil=Date.now()+12000;
function pokeSim(){ simWakeUntil=Date.now()+12000; }
function sizeCanvas(){
  const dpr=Math.min(window.devicePixelRatio||1,2);
  const w=Math.round(canvas.clientWidth*dpr), h=Math.round(canvas.clientHeight*dpr);
  if(canvas.width!==w || canvas.height!==h){ canvas.width=w; canvas.height=h; if(Anim.resize) Anim.resize(w,h); pokeSim(); }
}
function setupGL(){
  const dpr=Math.min(window.devicePixelRatio||1,2);
  canvas.width=Math.round(canvas.clientWidth*dpr)||canvas.width;
  canvas.height=Math.round(canvas.clientHeight*dpr)||canvas.height;
  if(Anim.init) Anim.init(canvas);
  if(Anim.resize) Anim.resize(canvas.width,canvas.height);
}
function loop(){
  if(glLost){ requestAnimationFrame(loop); return; }
  sizeCanvas();
  const now=Date.now(), rawDt=(now-lastTime)/1000; lastTime=now;
  const dt=Math.min(rawDt,0.033);  // cap at ~30fps equivalent; prevents physics explosion without causing slow-motion
  // painting touches keep the sim awake; non-painting touches don't need it
  const pm=paintMode();
  if(pm!=='off' && pointers.some(p=>p.down)) simWakeUntil=now+12000;
  const simAwake = now<simWakeUntil;
  fpsAccum+=rawDt; fpsFrames++;    // use real elapsed time so FPS counter reflects actual frame rate
  if(fpsAccum>=1){ const fps=fpsFrames/fpsAccum; fpsAccum=0; fpsFrames=0;
    if(SETTINGS.quality==='auto' && simAwake) autoPerf(fps);
    if(SETTINGS.showStats) updateStats(fps); }
  const cap = perfLevel==='low'?4 : perfLevel==='med'?6 : 10;
  // Subtle (Keys mode): a small blob at the fingertip with hardly any velocity,
  // so the reward stays where the touch is instead of smearing across the grid.
  const subtle = pm==='subtle' ? {radius:SUBTLE_PAINT.radius} : null;
  for(const p of pointers){
    if(p.down){
      const mdx=p.x-p.px, mdy=p.y-p.py, dist=Math.hypot(mdx,mdy);
      if(pm==='off'){ p.moved=true; }   // sound + zone lights only, no paint
      else if(!p.moved){ Anim.splat(p.x,p.y,0,0,p.color,Object.assign({velScale:0},subtle)); p.moved=true; }
      else if(dist>0.00001){
        const steps=Math.min(Math.max(1,Math.ceil(dist/0.012)),cap);
        const vs=(subtle?SUBTLE_PAINT.vel:1)/steps;
        for(let i=1;i<=steps;i++){ const t=i/steps; Anim.splat(p.px+mdx*t,p.py+mdy*t,p.dx,p.dy,p.color,Object.assign({velScale:vs},subtle)); }
      }
      p.px=p.x; p.py=p.y; p.dx*=0.85; p.dy*=0.85;
    }
  }
  if(simAwake) Anim.frame(dt);   // asleep: the last rendered frame stays on screen
  requestAnimationFrame(loop);
}
function boot(){
  initSettings();
  buildScale();
  buildBands();
  buildRailButtons();
  // Apps can rename the menu tabs to match their concepts, e.g. {instrument:'🎵 Songs'}
  if(Anim.paneLabels) for(const k in Anim.paneLabels){
    const b=document.querySelector('.bbar[data-mode="'+k+'"]'); if(b) b.textContent=Anim.paneLabels[k];
  }
  setTheme(currentTheme);
  applyBg();
  applyStats();
  applyLock();
  setupGL();
  canvas.addEventListener('webglcontextlost', e=>{ e.preventDefault(); glLost=true; }, false);
  canvas.addEventListener('webglcontextrestored', ()=>{ glLost=false; setupGL(); }, false);
  loop();
}
