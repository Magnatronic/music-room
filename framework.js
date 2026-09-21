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
   buildVisuals, buildApp, appLabel, setupExtras, soundExtras, onCell, lockMode,
   hideRail, paneLabels, bandColor.
   Coordinates passed to splat() are normalised 0..1 with y pointing UP.
*/
// The framework owns its DOM: inject it before any element lookups below.
// Shape: #shell is a flex row of #rail, #strip and #stage. #stage is only a
// slot; the activity lives in #surface, which is always the size of the whole
// screen and is SCALED DOWN to fit whatever the chrome leaves. See fitSurface().
// #unlockZone and #lockHint stay on the body on purpose - they belong to the
// locked state, when there is no chrome and the surface is at 1:1.
document.body.insertAdjacentHTML("afterbegin", "<div id=\"shell\">\n  <div id=\"rail\">\n    <a href=\"index.html\" id=\"homeBtn\" class=\"btn\" title=\"Home\">⌂</a>\n    <div id=\"tabs\">\n      <button class=\"bbar tab\" id=\"btnApp\" data-mode=\"app\"><span class=\"bic\">\ud83c\udf9b\ufe0f</span><span class=\"blb\">App</span></button>\n      <button class=\"bbar tab\" id=\"btnInstrument\" data-mode=\"instrument\"><span class=\"bic\">🎵</span><span class=\"blb\">Notes</span></button>\n      <button class=\"bbar tab\" id=\"btnSound\" data-mode=\"sound\"><span class=\"bic\">🎛️</span><span class=\"blb\">Sound</span></button>\n      <button class=\"bbar tab\" id=\"btnVisuals\" data-mode=\"visuals\"><span class=\"bic\">✨</span><span class=\"blb\">Visuals</span></button>\n      <button class=\"bbar tab\" id=\"btnPresets\" data-mode=\"presets\"><span class=\"bic\">⭐</span><span class=\"blb\">Presets</span></button>\n      <button class=\"bbar tab\" id=\"btnSetup\" data-mode=\"setup\"><span class=\"bic\">⚙️</span><span class=\"blb\">Setup</span></button>\n    </div>\n    <div id=\"railExtra\"></div>\n    <div id=\"railSpring\"></div>\n    <button class=\"railbtn\" id=\"lockBtn\" title=\"Lock controls (hold top-left corner 3s to unlock)\"><span class=\"bic\">🔒</span><span class=\"blb\">Lock</span></button>\n  </div>\n  <div id=\"strip\">\n    <div class=\"pane\" id=\"paneApp\">\n      <div id=\"appContent\"></div>\n    </div>\n    <div class=\"pane\" id=\"paneInstrument\">\n      <div id=\"instrumentContent\"></div>\n    </div>\n    <div class=\"pane\" id=\"paneSound\">\n      <div id=\"soundControls\"></div>\n    </div>\n    <div class=\"pane\" id=\"paneVisuals\">\n      <div id=\"visualsContent\"></div>\n    </div>\n    <div class=\"pane\" id=\"panePresets\">\n      <div id=\"presetsContent\"></div>\n    </div>\n    <div class=\"pane\" id=\"paneSetup\">\n      <div id=\"setupContent\"></div>\n    </div>\n  </div>\n  <div id=\"stage\">\n    <div id=\"surface\">\n      <canvas id=\"c\"></canvas>\n      <div id=\"bands\" class=\"hidden\"></div>\n      <div id=\"stats\"></div>\n    </div>\n  </div>\n</div>\n<div id=\"unlockZone\"></div>\n<div id=\"lockHint\">Controls locked — press and hold the top-left corner for 3 seconds to unlock</div>");


const canvas   = document.getElementById('c');
const shell     = document.getElementById('shell');
const strip     = document.getElementById('strip');
const stageSlot = document.getElementById('stage');
const railExtra = document.getElementById('railExtra');
// THE play surface, and the anchor an app appends its own fixed-position DOM to.
// It is always the size of the whole screen and never changes size while the
// chrome opens and closes; fitSurface() scales it down instead. It carries the
// transform, so a child's position:fixed resolves against the surface rather
// than the viewport - which keeps an app's progress bar or mixer strip on the
// activity, and scales it along with everything else. An app creating fixed
// DOM after boot must append it HERE, not to document.body.
const stageEl   = document.getElementById('surface');

const STORE_KEY = 'settings:' + location.pathname.split('/').pop();

// ── Launch parameters: the room PC opens an app already set up and locked ─────
// PHASE-6-LAUNCH-PARAMETERS.md. The room has ONE PC running the equipment
// control software and driving the projector; it can already launch Edge
// fullscreen, but it had no way to say what the activity should be LIKE.
//
// Both ?query and #hash are read, because some launchers mangle one or the other.
// A link carries the activity's own setup and nothing else - no presets, no
// student settings.
const LAUNCH = (function(){
  try{
    const q=(location.search||'').slice(1), h=(location.hash||'').slice(1);
    return new URLSearchParams(q + (q&&h?'&':'') + h);
  }catch(e){ return new URLSearchParams(''); }
})();
let launchNote = '';   // shown as a toast at boot, confirming the link was read

// Settings a launch must NEVER reset by omission. `s=` deliberately starts from
// the app's defaults so a link is the source of truth and nothing the last
// session left behind can leak in - but two kinds of key are not the activity's
// to reset:
//
//   uiScale   belongs to the DISPLAY. Resetting it would snap the room's menu
//             size back to 100% on every single launch.
//   the rest  belong to the STUDENT'S BODY. A launch that reset them would
//             silently turn off a switch or a dwell, which is the failure class
//             this project keeps finding.
//
// A link cannot set one of these AT ALL - naming it is declined by
// applySettingsParam(), not merely ignored by omission. This comment used to
// claim the opposite ("a link that NAMES one of these still sets it"), which the
// code has never done; found 2026-08-31 by a Phase 7 probe that believed it and
// failed. The behaviour is the right one and it is the comment that was wrong:
// what is on the machine about a student's body outranks what a launcher says.
const LAUNCH_KEEP = ['uiScale',
  'padOn','padButton','padSpeed','padDead','padAuto',
  'dwellPad','dwellPadMs','dwellMouse','dwellMouseMs','bigPointer','bind'];
// reachSize/reachX/reachY were briefly on this list and were TAKEN OFF, because
// the analogy that put them there does not hold. padOn describes a student and
// is true of them every session; a reach area describes where their chair is
// today. And the failure directions are opposite: a launch that resets a switch
// leaves someone unable to play, while a launch that resets a reach area leaves
// a full-wall activity, which is what every session looked like before the
// feature existed. Being on this list is what would let one therapist's reach
// area reach the next therapist's student. See initSettings() and
// PHASE-7-REACH-AREA.md §6.

function baseDefaults(){ return Object.assign({}, SHARED_DEFAULTS, Anim.defaults||{}); }

// Only what differs from the app's defaults goes in a link: short, readable, and
// still correct when a default changes later.
function settingsDiff(){
  const base=baseDefaults(), out={};
  for(const k in SETTINGS){
    if(k==='locked') continue;              // the lock is ?lock=, not a setting
    if(LAUNCH_KEEP.indexOf(k)>=0) continue; // the display's and the student's, not the activity's
    if(JSON.stringify(SETTINGS[k])!==JSON.stringify(base[k])) out[k]=SETTINGS[k];
  }
  return out;
}
// encodeURIComponent escapes both ',' and ':', so those stay safe as separators.
function encodeSettings(o){
  return Object.keys(o).map(k=>{
    const v=o[k];
    // Objects have no representation here and must never be stringified into a
    // link - String({}) is "[object Object]", which decodes back to nothing.
    // `bind` is the one today and it is excluded above; this is the guard for
    // whatever object-shaped setting comes next.
    if(v && typeof v==='object' && !Array.isArray(v)) return null;
    const s = Array.isArray(v) ? v.join('|') : (typeof v==='boolean' ? (v?'1':'0') : String(v));
    return encodeURIComponent(k)+':'+encodeURIComponent(s);
  }).filter(Boolean).join(',');
}
// Values arrive as text; the matching default says what type it should be.
// (octave and octaveRows are strings that look numeric - guessing breaks them.)
// Junk is IGNORED rather than allowed to break the app, and counted so the toast
// can tell the therapist their launcher needs fixing.
function applySettingsParam(str){
  const base=baseDefaults();
  let bad=0;
  String(str).split(',').forEach(pair=>{
    if(!pair) return;
    const i=pair.indexOf(':'); if(i<0){ bad++; return; }
    const k=decodeURIComponent(pair.slice(0,i)), raw=decodeURIComponent(pair.slice(i+1));
    if(k==='locked') return;
    // A link cannot carry the display's menu size or the student's access setup.
    // Declined rather than counted as junk: the key is understood, it is simply
    // not the activity's to set. See LAUNCH_KEEP.
    if(LAUNCH_KEEP.indexOf(k)>=0) return;
    if(!(k in base)){ bad++; return; }   // unknown key: nothing to coerce against
    const d=base[k];
    let v=raw;
    if(typeof d==='number')       v=Number(raw);
    else if(typeof d==='boolean') v=(raw==='1'||raw==='true');
    else if(Array.isArray(d) || (d===null&&raw.indexOf('|')>=0)) v=raw.split('|').map(Number);
    if(typeof d==='number' && !isFinite(v)){ bad++; return; }
    SETTINGS[k]=v;
  });
  return bad;
}
function launchLink(lock){
  const enc=encodeSettings(settingsDiff());
  return location.href.split(/[?#]/)[0] + '?' + (enc?'s='+enc+(lock?'&':''):'') + (lock?'lock=1':'');
}

// Per-app accent colour (matches the home-page tile): context colour for app
// rail buttons (.railbtn.app ring) and sub-menu dialogs (.submenu) via --accent.
const APP_ACCENTS={'fluid_sensory.html':'#7ad7ff','strummer.html':'#e05a9c','drums.html':'#e2641c',
  'sweep_chimes.html':'#8fd3ff','sampler.html':'#c0a0ff','song_grid.html':'#f5d117',
  'big_switch.html':'#3bb54a','echo_bird.html':'#7dffb0','bubbles.html':'#9ee7ff',
  'beat_builder.html':'#ffb36b','conductor.html':'#e8c8ff','soundscape.html':'#1ca9a9',
  'voice_visuals.html':'#8affd0','fluid_paint.html':'#b48cff','flock.html':'#7fa8ff',
  'slime.html':'#9dff57','life.html':'#57ffb0'};
document.documentElement.style.setProperty('--accent', APP_ACCENTS[location.pathname.split('/').pop()]||'#8fb4ff');

// The rail used to fade to 50% and wake on touch, because it sat over the art.
// It is a solid column of its own now and covers nothing, so there is nothing to
// wake: the fade, the .awake class and its listener went with the overlay.

// Settings shared by every animation (the animation adds its own via Anim.defaults)
const SHARED_DEFAULTS = {
  volume:0.30, bg:'#000000', lockedColor:null, colorMode:'note',
  // Controller access. Per STUDENT, so these ride in a preset - unlike Menu
  // size and Fullscreen, which belong to the display. Off by default: an app
  // with nothing plugged in must behave exactly as it did before this existed.
  padOn:false, padButton:null, padSpeed:0.6, padDead:0.25, padAuto:false,
  // Dwell is PER DEVICE, not one shared setting, and the reason is who is
  // holding what: the therapist works the mouse while the student works the
  // controller, and the framework keeps both pointers alive at once on purpose.
  // One shared dwell would mean switching it on for the student's stick also
  // made the therapist's OWN mouse fire every time they paused over the
  // activity. Two people, two devices, two setups. PHASE-5C-ACCESS-PANE.md §3.
  dwellPad:false, dwellPadMs:1200, dwellMouse:false, dwellMouseMs:1200,
  bigPointer:false,
  // rail button id -> { type:'key'|'pad', code } . Keyed by ACTION, which is the
  // right way round now that one action has one trigger and the trigger can be
  // either kind. Per APP (SETTINGS is keyed per filename, and each app has
  // different actions) and per STUDENT, so it rides in a preset.
  //
  // null means "never set up", NOT "deliberately empty" - it is what tells
  // migrateBind() to lay down the X/Y defaults. Clearing every row with ✕
  // leaves {}, which is honoured and never re-seeded. Replaces 5b's keyMap,
  // which is folded in once and dropped.
  bind:null,
  voice:'pure', scale:'major', reverb:false, echo:false, chorus:false, mute:false,
  tone:0.5, attack:0.5, ring:0.5,   // sound macros; 0.5 = the engine's original values
  mode:'notes', rootNote:'C', octave:'4', noteCount:5,
  showLabels:true, yAxis:'none', octaveRows:'2', zoneLook:'tint', paint:true, glide:'gentle',
  paintKeys:'off', pressFx:'none',
  locked:false, quality:'auto', showStats:false,
  // The reach area: the whole activity mapped into a rectangle the student can
  // physically get to, rather than filling a wall most of which they cannot.
  // A size, and the CENTRE it is placed at, both as fractions of the stage slot
  // - so nothing here goes stale when the resolution or the projector changes.
  // 1, 0.5, 0.5 is "biggest that fits, centred", which is what fitSurface() did
  // before this existed. Per STUDENT, so they ride in a preset.
  // See PHASE-7-REACH-AREA.md.
  reachSize:1, reachX:0.5, reachY:0.5,
  // Control size. The apps run on a big touchscreen AND on a projector across a
  // dim room — one wants big targets, the other legibility at distance — so the
  // whole interface scales from one number the therapist sets per display.
  // See the token block at the top of framework.css.
  uiScale:1,
};
// The ceiling is 1.5, not 2.0: the rail scales too, and at 2.0 the chrome alone
// eats most of a 1366-wide screen. Clamping on read as well as write means a
// value saved under a different ceiling can't leave the slider disagreeing with
// what is on screen.
const UI_SCALE_MIN=0.8, UI_SCALE_MAX=1.5;
// The floor on the reach area, and it is a safety floor rather than a taste one:
// the failure this feature must not have is a student left with an activity too
// small or too far off to reach, who cannot say so. A quarter of a 1920-wide
// projection is still 480px across. Clamped on READ as well as on write, like
// Control size, so a hand-edited blob or a launch link cannot get under it.
const REACH_MIN=0.25;
function clampReach(){
  const n=(v,d)=>isFinite(v)?v:d;
  SETTINGS.reachSize=Math.max(REACH_MIN,Math.min(1,n(+SETTINGS.reachSize,1)));
  SETTINGS.reachX=Math.max(0,Math.min(1,n(+SETTINGS.reachX,0.5)));
  SETTINGS.reachY=Math.max(0,Math.min(1,n(+SETTINGS.reachY,0.5)));
}
// Control size is a property of the DISPLAY, not of an app — "the text is too
// small on that projector" is true of all 17 apps at once. Everything else in
// SETTINGS is keyed per filename (settings:<file>.html), so a per-app Control
// size would have to be set seventeen times to mean anything. It gets its own
// global key instead, read by every app and by the launcher.
const UI_SCALE_KEY='ui-scale';
function readUiScale(){
  try{ const v=parseFloat(localStorage.getItem(UI_SCALE_KEY)); if(isFinite(v)) return v; }catch(e){}
  return 1;
}
// Fullscreen is the same KIND of setting as Control size - an answer to "what is
// this screen like?", set once when a room is set up, true for every app on the
// machine - so it gets the same treatment: its own global key, outside SETTINGS.
// Outside SETTINGS is the point, not an implementation detail. A preset is a
// STUDENT's setup and must not reshape the room's screen when it loads, and
// loading ↺ Defaults must not throw a therapist out of fullscreen. (That control
// was called "Reset all settings" until it moved into the preset list, which is
// what it always was — see applyDefaults().)
// See PHASE-4F-FULLSCREEN.md.
const FULLSCREEN_KEY='fullscreen';
function readFullscreenPref(){
  try{ return localStorage.getItem(FULLSCREEN_KEY)==='1'; }catch(e){ return false; }
}
function writeFullscreenPref(v){
  try{ localStorage.setItem(FULLSCREEN_KEY, v?'1':'0'); }catch(e){}
}
function fsSupported(){
  return !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
}
// The BROWSER is the truth for what is on screen. Everything that renders the
// toggle asks this, never the stored key - which is what makes Esc and F11
// harmless instead of a desync to reconcile.
function fsActive(){
  return !!(document.fullscreenElement || document.webkitFullscreenElement);
}
function enterFullscreen(){
  const el=document.documentElement;
  const fn=el.requestFullscreen||el.webkitRequestFullscreen;
  if(!fn) return Promise.reject(new Error('unsupported'));
  try{ return Promise.resolve(fn.call(el)); }catch(e){ return Promise.reject(e); }
}
function exitFullscreen(){
  const fn=document.exitFullscreen||document.webkitExitFullscreen;
  if(!fn) return Promise.resolve();
  try{ return Promise.resolve(fn.call(document)); }catch(e){ return Promise.resolve(); }
}
// ── The lock BORROWS fullscreen, and a borrowed fullscreen is never written down.
// PHASE-4H-FULLSCREEN-ON-LOCK.md. Lock is the "hand it to the student" gesture,
// so it takes the screen; the 3 s unlock hold gives it back. But the stored key
// belongs to the DISPLAY (Phase 4f), so a student's session must not rewrite it -
// measured: a naive enterFullscreen() moved the key null -> "1" -> "0".
//
// Both flags are per-document and deliberately NOT persisted. A loan that
// outlived the page would be indistinguishable from the therapist's own setting
// on the next load, which is the whole fault this avoids.
let fsLockOwned=false;       // the lock turned it on, so unlock must turn it off
let fsLockTransition=false;  // a lock-caused change is in flight: write nothing
// The lock only takes the loan when the preference is OFF. If it is already on,
// fullscreen is the therapist's and the lock is merely doing what they asked, so
// unlock leaves it alone.
function lockTakeFullscreen(){
  if(fsActive() || !fsSupported()) return;
  const ours=!readFullscreenPref();
  fsLockTransition=ours;
  // Never waited on: the session is already locked by the time this runs, and a
  // browser that refuses fullscreen must not cost a student their lock.
  enterFullscreen().then(()=>{ fsLockOwned=ours; })
                   .catch(()=>{ fsLockTransition=false; });
}
// Called from every path that ends a lock - the unlock hold AND applyPreset,
// which clears SETTINGS.locked directly. A path that forgets it orphans the
// loan: fullscreen stays on with nothing left to turn it off.
function lockReleaseFullscreen(){
  if(!fsLockOwned || !fsActive()){ fsLockOwned=false; return; }
  fsLockTransition=true; fsLockOwned=false;
  exitFullscreen();   // needs no transient activation, so the 3 s timer can do it
}
// Esc, F11 and the toggle all land here. Record what actually happened and let
// the pane redraw itself if it is open.
function onFullscreenChange(){
  if(fsLockTransition) fsLockTransition=false;   // borrowed: leave the key alone
  else writeFullscreenPref(fsActive());
  // Whatever ended fullscreen - Esc, F11, the toggle - the loan is over. This is
  // the whole desync guard: no key handler, nothing to reconcile.
  if(!fsActive()) fsLockOwned=false;
  if(currentQuickMode==='setup') buildSetupPanel();
}
document.addEventListener('fullscreenchange',onFullscreenChange);
document.addEventListener('webkitfullscreenchange',onFullscreenChange);

// A stored preference cannot let a FRESH PAGE LOAD go fullscreen: the spec wants
// transient activation, so a gesture-less request is expected to be refused. We
// do not try it on load and swallow the rejection - that is how a feature becomes
// folklore. Re-apply on the therapist's first tap instead, once, then get out of
// the way. Moving between apps therefore costs one tap; that is the honest cost.
let fsPendingApply=false;
function armFullscreenReapply(){
  if(!readFullscreenPref() || !fsSupported() || fsActive()) return;
  fsPendingApply=true;
  const disarm=()=>{
    fsPendingApply=false;
    if(stageEl) stageEl.removeEventListener('pointerdown',go,true);
  };
  const go=()=>{
    if(!fsPendingApply) return;
    disarm();
    if(readFullscreenPref() && !fsActive()) enterFullscreen().catch(()=>{});
  };
  // Listen on the SURFACE, not the window. The intent being waited for is "someone
  // has started using the activity", and that is a touch on the activity - not a
  // click on the chrome, and emphatically not the ⌂ Home link, which is an
  // <a href>: arming on the whole window meant the very gesture that navigates
  // away asked for fullscreen on a document already unloading. A fullscreen
  // request landing in the gap between two pages takes the browser's own menus
  // with it, and there is then nothing on screen to escape by.
  //
  // Narrowing the target rather than blacklisting links kills the whole class:
  // no chrome click can reach it, whatever we add to the rail later.
  if(stageEl) stageEl.addEventListener('pointerdown',go,true);
  // Belt and braces: whatever else happens, stop wanting fullscreen once this
  // page is on its way out.
  window.addEventListener('pagehide',disarm);
  window.addEventListener('beforeunload',disarm);
}

// What the therapist ASKED for is stored; what this screen can actually hold is
// applied. Keeping them apart matters: store the fitted value instead and a
// setting of 150% made on the room projector is silently rewritten to 115% by
// one visit on a laptop, and never comes back.
let uiScaleFit=1;
function applyUiScale(){
  let asked=parseFloat(SETTINGS.uiScale);
  if(!isFinite(asked)) asked=1;
  asked=Math.max(UI_SCALE_MIN,Math.min(UI_SCALE_MAX,asked));
  SETTINGS.uiScale=asked;
  try{ localStorage.setItem(UI_SCALE_KEY,String(asked)); }catch(e){}
  document.documentElement.style.setProperty('--ui-scale',String(asked));
  uiScaleFit=fitUiScale(asked);
}
// The 1.5 ceiling assumes a screen tall enough to hold a rail 1.5x taller. On a
// 768-high screen it is not: measured 2026-08-24, every app's rail overflowed
// its column by up to 300px at 1.5, and #rail scrolls with a HIDDEN scrollbar —
// so 🔒 Lock, pinned to the bottom, silently became unreachable. Lock is how you
// hand the screen to a student, so this is the worst thing to lose.
//
// The ceiling is therefore per-display, not a constant: step down until the rail
// fits. The value is written back to SETTINGS, so the slider shows what is
// actually on screen rather than disagreeing with it.
function fitUiScale(v){
  const rail=document.getElementById('rail');
  if(!rail) return v;                       // pre-injection (never in practice)
  const root=document.documentElement;
  let guard=0;
  while(v>UI_SCALE_MIN && rail.scrollHeight>rail.clientHeight+1 && guard++<20){
    v=Math.round((v-0.05)*100)/100;
    root.style.setProperty('--ui-scale',String(v));
  }
  return v;
}

let SETTINGS = {}, currentTheme = '', colorIdx = 0;
let bgRGB = [0,0,0];
let currentQuickMode = null;

function initSettings(){
  SETTINGS = Object.assign({}, SHARED_DEFAULTS, Anim.defaults||{});
  try { SETTINGS = Object.assign(SETTINGS, JSON.parse(localStorage.getItem(STORE_KEY)||'{}')); } catch(e){}

  // ── A REACH AREA NEVER SURVIVES A PAGE LOAD ──────────────────────────────
  // It is the one saved setting that describes WHERE THE CHAIR IS TODAY, not
  // what a student is like. Everything else in this blob is still true of the
  // same student next week; a rectangle drawn round the part of a wall someone
  // could reach on Tuesday is true of nobody by Wednesday.
  //
  // The user's case, 2026-08-31, and it is the one that decided this: one
  // therapist sets a reach area, leaves, and the next therapist launches a link
  // for a different student. Without this line that student gets a quarter-size
  // activity in a corner, LOCKED, with no menu and no explanation - and the
  // failure is silent, because the student it is wrong for is often the student
  // who cannot say so.
  //
  // The two directions are not symmetric, which is the whole argument:
  // forgetting a reach area costs a full-wall activity, which is what every
  // session had before this feature existed and which anyone can at least see.
  // KEEPING a stale one costs a student a screen they cannot use.
  //
  // A launch link can still carry one deliberately (the three keys are NOT in
  // LAUNCH_KEEP), and a preset still restores one, so nothing that ASKS for a
  // reach area loses it. Only inheriting one by accident is impossible.
  SETTINGS.reachSize=1; SETTINGS.reachX=0.5; SETTINGS.reachY=0.5;

  // ── the launch link, if there is one. PHASE-6-LAUNCH-PARAMETERS.md.
  // s= starts from the app's DEFAULTS, not from what is saved: a link has to
  // land the same way every time, whatever the last session left behind.
  // LAUNCH_KEEP survives that reset - the display's menu size and the student's
  // access setup are not the activity's to throw away.
  const sParam=LAUNCH.get('s');
  if(sParam!==null){
    const keep={};
    for(const k of LAUNCH_KEEP) if(k in SETTINGS) keep[k]=SETTINGS[k];
    SETTINGS = Object.assign({}, SHARED_DEFAULTS, Anim.defaults||{}, keep);
    const bad = applySettingsParam(sParam);
    launchNote = bad
      ? '⚠ Launch link: ' + bad + ' setting' + (bad===1?'':'s') + ' not understood'
      : '⭐ Setup from launch link';
    // Say so when a link shrank the activity. A therapist walking into a room
    // and finding a small activity in a corner should not have to guess whether
    // that was meant - and this is the only way it can now happen.
    if(+SETTINGS.reachSize < 0.9995)
      launchNote += ' · reach area ' + Math.round(SETTINGS.reachSize*100) + '%';
  }
  // lock= wins over the saved flag in BOTH directions, so a link can open an app
  // that was left locked, and lock one that was left open.
  const lk=LAUNCH.get('lock');
  if(lk==='1'||lk==='true')  SETTINGS.locked=true;
  if(lk==='0'||lk==='false') SETTINGS.locked=false;

  const themeKeys = Object.keys(Anim.themes);
  currentTheme = themeKeys.includes(SETTINGS.theme) ? SETTINGS.theme : themeKeys[0];
  // A string lockMode pins the play mode itself — saved settings may hold the
  // other mode from before the app locked it, which would strand the user with
  // no toggle to escape.
  if(typeof Anim.lockMode==='string') SETTINGS.mode=Anim.lockMode;
  // Saved settings may hold a retired press effect (smoke/pixel/ripple/press)
  if(SETTINGS.pressFx && !PRESSFX_OPTS[SETTINGS.pressFx]) SETTINGS.pressFx='bloom';
  // Retired voices: Retro's territory folded into Synth, Pluck's into Kalimba
  if(SETTINGS.voice==='retro') SETTINGS.voice='synth';
  if(SETTINGS.voice==='pluck') SETTINGS.voice='kalimba';
  // fitSurface() clamps on read regardless, so the SCREEN is safe either way.
  // This is so the Setup slider agrees with it: a stored 0.05 would otherwise
  // leave the slider parked at its 25% floor next to a readout saying 5%.
  clampReach();
  // Seeds the X/Y defaults on a fresh profile and folds a 5b keyMap into bind.
  // Safe here: the app's whole Anim object, railButtons included, is defined
  // before it calls boot(), so allRailButtons() already knows this app's actions.
  migrateBind();
  bgRGB = hexToRGB(SETTINGS.bg);
  perfLevel = (SETTINGS.quality && SETTINGS.quality!=='auto') ? SETTINGS.quality : 'high';
  SETTINGS.uiScale = readUiScale();   // the display's size, not this app's copy
  applyUiScale();   // before first paint: the chrome must never resize under a hand
}

// What painting does in the current mode. Keys mode has its own three-way
// setting: trails smear across the zone grid and visually dissolve the keys,
// so Keys defaults to 'off' — the keyboard is the instrument — with 'subtle'
// (a small contained bloom at the fingertip) offered under 'Paint trails'.
// Flow keeps the simple on/off flag that motion styles use.
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
// Where the activity ENDS has to be visible when it is scaled, or it just
// bleeds into the space beside it - both are usually the same black. A drawn
// border did the job and was the wrong instrument: in a sensory room the
// activity should be the brightest thing asking for attention, and a white
// rectangle around it competes with what the student is meant to look at.
// A step in value says the same thing quietly.
//
// Derived from the therapist's own background rather than fixed, or it would
// vanish the moment they picked that colour. Always toward the opposite end,
// so it works from black through to white.
const SURROUND_MIX = 0.12;
function surroundOf(hex){
  const c = hexToRGB(hex);
  const lum = 0.2126*c[0] + 0.7152*c[1] + 0.0722*c[2];
  const towards = lum < 0.5 ? 1 : 0;
  const mix = c.map(v => Math.round(255 * (v + (towards - v) * SURROUND_MIX)));
  return 'rgb(' + mix.join(',') + ')';
}
// An app paints its background into the canvas, so the space beside a scaled
// surface has to be painted here to relate to it at all.
//
// UNLESS A REACH AREA IS SET, and then it goes BLACK. The two cases want
// opposite things and the difference is who is looking:
//
//   no reach area  the surround only shows while the CHROME is open, which is
//                  the therapist's own working state. A step off their
//                  background is what makes the activity's edge visible without
//                  drawing a line round it (Phase 3c).
//   a reach area   the surround is the part of the projector the STUDENT is not
//                  using, and it is a wall. Lighting most of a wall a soft grey
//                  is light spilled into a sensory room for no purpose - and the
//                  activity is small and distinct enough that nothing needs an
//                  edge cue to find it. The user's call from the Phase 7 UAT,
//                  2026-08-31, having looked at it on the actual projector.
//
// The switch is visible: dragging Size off 100% turns the rest of the wall off,
// which is a fair description of what a reach area does.
function applyBg(){
  bgRGB = hexToRGB(SETTINGS.bg);
  const s = isFinite(+SETTINGS.reachSize) ? +SETTINGS.reachSize : 1;
  stageSlot.style.background = s < 0.9995 ? '#000' : surroundOf(SETTINGS.bg);
}

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
// Relative luminance (WCAG), used to decide whether a key needs a dark label or
// a light one. The key label is drawn in the KEY'S OWN COLOUR, which reads only
// because a key is normally dark — on a bright key the letter disappears into
// it, which is exactly what `Bold` does to it.
function relLum(c){
  const f=v=>{ v/=255; return v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055,2.4); };
  return 0.2126*f(c[0])+0.7152*f(c[1])+0.0722*f(c[2]);
}
// BOLD DIMS NOTHING. Two attempts at alternating the brightness are recorded
// here because both were wrong in ways worth remembering.
//
// The first alternated on the COLUMN INDEX, so on an 11-key scale the first C
// was bright and the second C dark - the same note in two colours, which is the
// one thing the Boomwhacker convention cannot survive. The measurement that
// approved it used a six-key scale, where no note appears twice.
//
// The second alternated on the note's DEGREE IN THE SCALE, which fixed that: a C
// was the same red everywhere. But dimming a colour to 0.35 does not make it a
// quieter version of itself, it makes it A DIFFERENT COLOUR: D at full strength
// is hue 28 degrees at 53% lightness and reads as orange, and at 0.35 it is the
// same hue at 18% lightness and reads as BROWN. E goes olive the same way. The
// user asked "are the boomwhacker colours correct? D looks brown rather than
// orange" - the palette was right and the dimming was wrong.
//
// So Bold changes no hue and dims no key. Every key is drawn at full strength,
// which is what lifts it off the background, and neighbouring keys are told
// apart by a DARK SEPARATOR between them rather than by luminance. Colour
// identity is preserved exactly; the separation stops depending on colour at
// all, which is also what makes it work for a colour-blind student.
const bandsEl=document.getElementById('bands');
function buildBands(){
  bandsEl.innerHTML='';
  const show = SETTINGS.mode==='notes' && SETTINGS.zoneLook!=='off';
  bandsEl.classList.toggle('hidden',!show);
  if(!show) return;
  const rows=gridRowCount(), cols=NOTES.length, linesOnly=SETTINGS.zoneLook==='lines';
  const look=SETTINGS.zoneLook;
  bandsEl.style.gridTemplateColumns='repeat('+cols+',1fr)';
  bandsEl.style.gridTemplateRows='repeat('+rows+',1fr)';
  // DOM order is top row first; row index 0 is the BOTTOM row (lowest octave).
  for(let r=rows-1;r>=0;r--){
    for(let c=0;c<cols;c++){
      const d=document.createElement('div'); d.className='band'+(rows>1?' cell':'');
      d.dataset.cell=c+'-'+r;
      // MONO TAKES THE OPPOSITE OF THE BACKGROUND, so it is white keys on a dark
      // screen and dark keys on a light one. Hardcoding white would have made
      // the whole keyboard vanish the moment a therapist set a pale background
      // with the Background control, which they can already do — and it gives
      // the reversed scheme for free rather than as a fourth option.
      const darkRoom = relLum(bgRGB.map(v=>v*255)) < 0.4;
      const monoKey  = darkRoom ? [236,238,242] : [18,20,26];
      const monoPress= darkRoom ? [18,20,26]    : [236,238,242];
      if(look==='mono'){
        d.classList.add('monokey');
        d.style.setProperty('--c', monoKey.join(','));
        // ...and a press INVERTS it: a white key goes black under the finger,
        // a black key goes white. The shipped press is the key's own colour at
        // 0.38, which in mono is a grey that is dimmer than the key itself —
        // pressing made it duller rather than louder.
        d.style.setProperty('--p', monoPress.join(','));
      } else {
        d.style.setProperty('--c', bandRGB255(c).join(','));
      }
      // 'Lines only' keeps the fill transparent; touches still flash in the zone colour.
      // Resting tint must READ as coloured keys (the Boomwhacker association is the
      // point) — 0.05 was invisible on most displays, so keys looked black until held.
      //
      // `tint` is unchanged, to the digit. `bold` alternates strong and dim down
      // the row so neighbouring keys differ in LIGHTNESS rather than only in hue;
      // `soft` is quieter than the shipped keyboard for a student who finds it
      // too much.
      // The row offset is a DEPTH cue: with two or three octaves stacked, the
      // higher rows sit back a little. It belongs in the coloured looks, where
      // the hue carries the note's identity and the lightness is free to say
      // something else — but NOT in Mono, where lightness is the only channel
      // there is and a dimmer row simply reads as a different colour. The user:
      // "octave also seem to be a different colour in mono mode."
      const a = linesOnly ? 0
              : look==='mono'  ? 0.95              // flat: every octave identical
              : look==='muted' ? 0.18 + r*0.04     // the keyboard as it always was
              : 0.95 - r*0.05;                     // Boomwhacker, with the depth cue
      d.style.setProperty('--a', Math.max(0,a).toFixed(3));
      // In `bold` the separator is what tells one key from the next, since no key
      // is dimmed to make room for its neighbour. It is DARK: bold keys are
      // bright, and a dark gap between two bright colours is visible whatever
      // those colours are — a light line would disappear against E's yellow.
      //
      // In `tint` it stays the shipped 1px at 10%. A pixel scan found the edges
      // there ARE detectable (5 of 5, about 1.48:1 on the line), so the shipped
      // keyboard is left exactly as it was rather than nudged on a hunch.
      // In Mono the separator is the OPPOSITE of the key, so it is dark between
      // white keys and light between dark ones. A fixed dark line would have
      // vanished between dark keys the moment the background was set light -
      // the scheme flips but the divider would not have flipped with it.
      const line = look==='muted' ? '1px solid rgba(255,255,255,0.10)'
                 : look==='mono'  ? 'max(3px,0.5vmin) solid rgb('+monoPress.join(',')+')'
                 :                  'max(3px,0.5vmin) solid rgba(0,0,0,0.92)';
      if(c<cols-1) d.style.borderRight=line;
      if(r>0)      d.style.borderBottom=line;
      if(SETTINGS.showLabels){
        const l=document.createElement('div'); l.className='lbl';
        l.textContent = Anim.bandLabel ? Anim.bandLabel(c) : NOTES[c].label;   // e.g. drum icons
        // A LETTER THE COLOUR OF ITS OWN KEY. That is the shipped design and it
        // works while keys are dim, but `Bold` draws a key at 0.95 and the E
        // vanished into the yellow. Found by looking at a screenshot of the new
        // look, not by any of the contrast numbers, which were all about the
        // keys and never about the writing on them.
        //
        // Only `bold` is touched: at the shipped tint the label stays exactly
        // as it was.
        // A letter the colour of its own key reads only while keys are dim. At
        // full strength the E vanished into the yellow, so the label takes black
        // or white from the key's measured luminance instead.
        if(look!=='muted'){
          const rgb = look==='mono' ? monoKey : bandRGB255(c);
          l.style.color = relLum(rgb.map(v=>v*0.95))>0.30 ? 'rgba(0,0,0,0.82)' : '#fff';
          l.style.opacity='1';
        }
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
// Pad-editor apps (Sampler, Drums) share one edit-mode look: body.editmode
// drives pulsing pad outlines + ✏️ badges (framework.css) and a pill that
// stays up until editing ends, so the mode is always visible on screen.
function showEditIndicator(on){
  document.body.classList.toggle('editmode',!!on);
  let p=document.getElementById('editPill');
  if(on&&!p){
    p=document.createElement('div'); p.id='editPill';
    p.textContent='✏️ Editing — tap a pad to change it · tap ✏️ again to finish';
    stageEl.appendChild(p);
  }
  if(!on&&p) p.remove();
}
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
// Sound macros (Sound pane → "Shape the sound"): three high-level sliders across
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
    // Keep the OS output stream alive: some devices (HDMI audio especially)
    // suspend the stream after digital silence and pop when it restarts or
    // stops — heard as a click around short notes. A looping noise floor at
    // -80 dB is far below audibility but keeps the pipe open.
    const ka=ac.createBufferSource(); ka.loop=true;
    const kab=ac.createBuffer(1,ac.sampleRate,ac.sampleRate);
    const kad=kab.getChannelData(0);
    for(let i=0;i<kad.length;i++) kad[i]=(Math.random()*2-1)*1e-4;
    ka.buffer=kab; ka.connect(ac.destination); ka.start();
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
    const art=ac.createGain();   // articulation dips live here, away from the envelope
    const vol=ac.createGain(); vol.gain.value=yLoudness(y);
    const pan=ac.createStereoPanner(); pan.pan.value=(x*2-1)*0.6;
    const filt=ac.createBiquadFilter(); filt.type=V.filter.type; filt.frequency.value=filtFreq(V,y);
    if(V.filter.q) filt.Q.value=V.filter.q;
    filt.connect(gain); gain.connect(art); art.connect(vol); vol.connect(pan); pan.connect(masterGain);
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
    // Pluck decay lives on the articulation node (see restrikePluck) — the
    // envelope gain only ever carries the attack, so nothing needs cancelling.
    if(V.pluck) art.gain.setTargetAtTime(0, t+attackTime(), pluckTc(V));
    voices[vid]={nodes,lfo,gain,art,vol,pan,filt,freq,V,lastStrike:t,strikeDist:0};
    soundingVoices++; updatePolyGain();
    return vid;
  }catch(e){ return 0; }
}
// Struck/plucked voices (Harp, Marimba, …) decay to silence by design, so a
// finger DRAGGING without crossing note zones would go quiet mid-gesture.
// Re-strike the envelope as the pointer travels — distance-based, so a fast
// sweep rolls like a mallet roll / glissando while a resting finger decays
// naturally like the real instrument.
// The whole strike/decay cycle is scheduled with setTargetAtTime on the
// articulation node — a setTarget segment always starts from the value the
// param actually has, so overlapping re-strikes are continuous by construction.
// (The cancel/anchor approach on the envelope gain measurably clicked on fast
// sweeps, whichever way it was anchored.) tc ≈ duration/5: an exponential
// reaches ~0.7% of start level after 5 time constants, matching the old
// exponentialRampToValueAtTime endpoint.
function pluckTc(V){ return Math.max(0.02, V.pluck*ringMul()/5); }
function restrikePluck(v,now){
  const V=v.V;
  v.nodes.forEach(n=>{
    if(n.mod){ // re-strike the FM tine
      n.g.gain.setTargetAtTime(v.freq*V.fm.depth,now,0.006);
      n.g.gain.setTargetAtTime(v.freq*V.fm.depth*V.fm.decayTo,now+0.02,V.fm.decay);
    } else if(n.decayTo!==undefined){ // re-strike decaying partials
      n.g.gain.setTargetAtTime(n.base,now,0.006);
      n.g.gain.setTargetAtTime(n.base*n.decayTo,now+0.02,0.5);
    }
  });
  v.art.gain.setTargetAtTime(1,now,0.004);
  v.art.gain.setTargetAtTime(0,now+0.015,pluckTc(V));
  v.lastStrike=now; v.strikeDist=0;
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
    if(V.pluck){
      // ~every 4.5% of screen travel, min 90 ms apart (no machine-gunning)
      v.strikeDist=(v.strikeDist||0)+(speed||0);
      if(v.strikeDist>0.045 && now-(v.lastStrike||0)>0.09) restrikePluck(v,now+0.012);
    }
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
    // Articulation is scheduled with setTargetAtTime ONLY: a setTarget segment
    // always starts from the value the param actually has at its start time, so
    // overlapping events from a fast sweep stay continuous by construction.
    // Cancel/anchor-based dips on the envelope gain clicked no matter how they
    // were anchored — cancelAndHoldAtTime alone and an explicit stale
    // setValueAtTime both produced hard sample jumps (verified by capture).
    v.nodes.forEach(n=>{
      n.osc.frequency.setTargetAtTime(f*n.ratio,now,0.005);
      if(n.mod){ // re-strike the FM tine: depth rescales with the new frequency
        n.g.gain.setTargetAtTime(f*V.fm.depth,now,0.006);
        n.g.gain.setTargetAtTime(f*V.fm.depth*V.fm.decayTo,now+0.02,V.fm.decay);
      } else if(n.decayTo!==undefined){ // re-strike decaying partials (bell/glass sparkle)
        n.g.gain.setTargetAtTime(n.base,now,0.006);
        n.g.gain.setTargetAtTime(n.base*n.decayTo,now+0.02,0.5);
      }
    });
    if(V.pluck){
      // re-fire the pluck decay so glissandos strike each note (a zone crossing
      // counts as a strike); rate-limited so a fast sweep can't machine-gun it
      if(now-(v.lastArtic||0)>0.1){
        v.art.gain.setTargetAtTime(1,now,0.004);
        v.art.gain.setTargetAtTime(0,now+0.015,pluckTc(V));
        v.lastStrike=now; v.strikeDist=0;
        v.lastArtic=now;
      }
    } else { // brief dip on the articulation node so each zone reads as its own note
      v.art.gain.setTargetAtTime(0.45,now,0.01);
      v.art.gain.setTargetAtTime(1,now+0.03,0.04);
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
    // Ring macro scales the release tail — floored so Ring 0 stays a quick damp,
    // not a click (a ~30 ms tail cuts a Low-register note in about two cycles)
    const rel=Math.max(0.06, 0.25*ringMul());
    // Release on the articulation node, not the envelope gain: art's timeline
    // only ever holds setTargetAtTime events, which start from the value the
    // param actually has — continuous by construction. Cancelling the envelope
    // gain here (any anchor variant) clicks when a quick tap releases while the
    // attack ramp is still in flight (verified by sample capture). The envelope
    // just completes on its own behind the closing art node.
    v.art.gain.setTargetAtTime(0,t,rel);
    const stopAt=t+rel*7;
    v.nodes.forEach(n=>{try{n.osc.stop(stopAt);}catch(e){}});
    if(v.lfo){try{v.lfo.stop(stopAt);}catch(e){}}
    v.nodes[0].osc.onended=()=>{soundingVoices=Math.max(0,soundingVoices-1);updatePolyGain();try{v.gain.disconnect();v.art.disconnect();v.vol.disconnect();v.pan.disconnect();v.filt.disconnect();}catch(e){}};
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
  // Touching the play surface does NOT dismiss the settings strip. It used to,
  // back when the panel covered the activity and a touch on the art meant
  // "get out of the way". The strip has its own column now and covers nothing,
  // so the therapist loop it broke - change a setting, try it, change it again -
  // is the loop this whole rework exists to allow. The strip closes when its
  // rail icon is tapped again, and Lock is still the one-action hand-over.
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
  // The initial splat happens HERE, not on the next frame. PHASE-4I.
  //
  // It used to wait for the render loop, which meant a press that started and
  // ended between two frames produced no splat at all - and, worse, that a
  // SYNTHESISED press was invisible to any app which had worked around that with
  // its own DOM mousedown listener. A dwell and a gamepad press both arrive by
  // calling this function directly; neither dispatches a DOM event. That is how
  // both dwell routes came to do nothing in Sweep Chimes and Bubbles, which are
  // the two apps where splat IS the interaction.
  //
  // Doing it here means every press reaches Anim.splat whatever produced it - a
  // finger, a mouse, a dwell, a stick - and no app needs a device-specific
  // listener to be reachable. `s` is used, not the raw client coordinates: the
  // touch is mapped before anything else happens.
  const pm=paintMode();
  if(pm!=='off'){
    // The SAME opts the loop used to pass. A Keys-mode 'subtle' tap must stay a
    // small blob; dropping the radius here would quietly make it a full-size one.
    const subtle = pm==='subtle' ? {radius:SUBTLE_PAINT.radius} : null;
    Anim.splat(s.x,s.y,0,0,p.color,Object.assign({velScale:0},subtle));
  }
  // "The initial splat has been delivered" - the meaning is unchanged, it is just
  // set where the delivery now happens. Set even when paint is off, exactly as
  // the loop did.
  p.moved=true;
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
// Every pointer arrives as client coordinates and is converted here, once. The
// canvas sits inside a scaled ancestor, so its on-screen rect and its layout
// size differ by the scale factor: e.offsetX and clientX-rect.left are then in
// different units, and toSim divides by the layout width. Going through the
// rect is the only form that survives the surface being scaled.
function toLocal(cx,cy){
  const r=canvas.getBoundingClientRect();
  const kx=r.width?canvas.clientWidth/r.width:1, ky=r.height?canvas.clientHeight/r.height:1;
  return [(cx-r.left)*kx, (cy-r.top)*ky];
}
canvas.addEventListener('mousedown',e=>{ e.preventDefault();
  mouseSt.clickMs=0; mouseSt.stillMs=0; mouseSt.armed=false;   // a real click supersedes a dwell one
  const q=toLocal(e.clientX,e.clientY); onDown('mouse',q[0],q[1]); });
canvas.addEventListener('mousemove',e=>{
  const q=toLocal(e.clientX,e.clientY);
  // Where the mouse is, for the drawn ring and for dwell. Travel is SILENT under
  // dwell - arriving and holding still is the press - so a move that clears the
  // threshold releases a dwell hold instead of gliding it into the next note.
  mouseSt.over=true;
  // Measured from the ANCHOR, not from the last sample, so a creep too slow to
  // trip on any single move still trips once it has added up. Crossing it is
  // what starts the dwell count - so the count only ever runs while stopped -
  // and it is also what re-arms the next click.
  if(Math.hypot(q[0]-mouseSt.ax, q[1]-mouseSt.ay) > DWELL_JITTER_PX){
    mouseSt.ax=q[0]; mouseSt.ay=q[1];
    mouseSt.everMoved=true; mouseSt.stillMs=0; mouseSt.armed=true;
    mouseDwellRelease();   // setting off ends the note; it never glides
  }
  mouseSt.x=q[0]; mouseSt.y=q[1];
  // A mouseup can be swallowed by a native drag (the ⌂ link's ghost image) or a
  // release outside the window, leaving the pointer stuck "down" so the cursor
  // plays without clicking. No button held on a move = the press is over: heal.
  // A dwell hold is exempt: it is down with no button by definition.
  if(!e.buttons){ if(mouseSt.clickMs<=0) onUp('mouse'); return; }
  onMove('mouse',q[0],q[1]); });
canvas.addEventListener('mouseleave',()=>{ mouseSt.over=false; mouseDwellRelease();
  mouseSt.stillMs=0; mouseSt.armed=false; });
// Arriving is a movement: the anchor comes with you, and the count starts from
// wherever the pointer actually came to rest.
canvas.addEventListener('mouseenter',e=>{ mouseSt.over=true;
  const q=toLocal(e.clientX,e.clientY);
  mouseSt.x=mouseSt.ax=q[0]; mouseSt.y=mouseSt.ay=q[1];
  mouseSt.stillMs=0; mouseSt.armed=true; });
// Anywhere on the page, not just the activity: a therapist moving the mouse over
// the rail is still using it, and should get their arrow back over the activity.
window.addEventListener('mousemove',()=>{ mouseMovedAt=Date.now(); });
window.addEventListener('mouseup',()=>{ if(mouseSt.clickMs<=0) onUp('mouse'); });
window.addEventListener('blur',()=>{ while(pointers.length) onUp(pointers[0].id); });
// Nothing in the UI is meant to drag; a native drag hijacks the gesture mid-play.
document.addEventListener('dragstart',e=>e.preventDefault());
// A LONG PRESS MUST NOT OPEN A MENU. On the touch projector, resting a finger on
// a control for a moment brought up the browser's context menu over the top of
// the thing the therapist was pressing - reported against the MENU ITEMS, not the
// activity, which is why this is on the document rather than on the canvas.
//
// Windows' "press and hold" gesture was already turned off and it made no
// difference: Chromium synthesises `contextmenu` from a long touch press in its
// OWN gesture recogniser, so no OS setting and no browser policy reaches it - but
// a web page can simply decline the event. That also keeps the fix on the USB
// stick, where this project needs it, rather than in a setting that would have to
// be re-applied on every machine.
//
// It matters more here than in most apps because HOLDING IS OUR VOCABULARY: a
// sustained note is a held finger, unlocking is a deliberate three-second hold,
// and a student with a motor impairment often has no brisk press to give. An
// interface built for people who dwell cannot treat dwelling as a request for a
// menu. `touch-action:none` on the canvas does not cover this - that governs
// scrolling and pinch, and a long press is not a scroll.
//
// EXCEPT where you can type or copy: the preset name is typed into, and the
// launch-link textarea is read-only and exists to be copied OUT of, so
// right-click -> Copy is the action it is for. By field TYPE and not by tag,
// because `input` covers both that text box and every slider, and the two want
// opposite answers. See PHASE-16-LONG-PRESS-MENU.md.
document.addEventListener('contextmenu',e=>{
  const el = e.target && e.target.closest && e.target.closest('input,textarea,[contenteditable]');
  if(el){
    if(el.tagName==='TEXTAREA' || el.isContentEditable) return;
    if(el.tagName==='INPUT' && /^(text|search|url|email|number|password|tel)$/.test(el.type)) return;
  }
  e.preventDefault();
},{capture:true});

canvas.addEventListener('touchstart',e=>{ e.preventDefault();
  for(const t of e.changedTouches){ const q=toLocal(t.clientX,t.clientY); onDown(t.identifier,q[0],q[1]); } },{passive:false});
canvas.addEventListener('touchmove',e=>{ e.preventDefault();
  for(const t of e.changedTouches){ const q=toLocal(t.clientX,t.clientY); onMove(t.identifier,q[0],q[1]); } },{passive:false});
canvas.addEventListener('touchend',e=>{ for(const t of e.changedTouches) onUp(t.identifier); },{passive:false});
canvas.addEventListener('touchcancel',e=>{ for(const t of e.changedTouches) onUp(t.identifier); },{passive:false});

// ── Controller access: a stick becomes a finger ───────────────────────────────
// The whole design is one decision. The virtual cursor lives in CANVAS LAYOUT
// COORDINATES - the space onDown/onMove/onUp already take, the space toLocal
// produces for a real finger - so this adds no second mapping. Everything after
// that point is the path every touch in every app already exercises: Keys mode
// turns it into a note, Flow mode into a splat, and Anim.noVoices apps keep
// working, none of them aware a gamepad exists. See PHASE-5A-GAMEPAD-POINTER.md.
const PAD_MAX = 4;
const padSt = [];              // per gamepad index: {gid,x,y,down} or null
const padCurEl = [];           // its cursor, lazily made
let padLearnCb = null;         // set while Setup is waiting for a button press
const padPrev = [];            // last frame's pressed buttons, for rising edges
// What the Setup pane reports back. Gathered even when the feature is OFF and
// even when no pointer is being driven, because "is it seeing my controller?" is
// the first question when setting a student up, and the panel could not answer
// it. This is also the only live feedback there is for which physical switch is
// in which XAC port - the one thing that cannot be tested without the hardware.
let padNames = [];             // per index: the controller's reported name
let padStd = [];               // per index: does it report the STANDARD mapping?
let padLastPress = null;       // {pad, btn, at} of the most recent button-down

// The Gamepad API defines a standard layout, and a pad that reports
// mapping:'standard' is promising these indices mean these controls. So we can
// say "A" instead of "button 0" - and on an XAC, whose ports arrive as ordinary
// Xbox buttons, that turns "which port did I just press" into something a
// therapist can read off and write on a label.
const PAD_BTN_NAMES = ['A','B','X','Y','Left bumper','Right bumper',
  'Left trigger','Right trigger','Back','Start','Left stick','Right stick',
  'D-pad up','D-pad down','D-pad left','D-pad right','Guide'];
function padBtnName(i, btn){
  if(!PAD_BTN_NAMES[btn]) return 'Button ' + btn;
  // Nothing connected? There is no evidence either way, and the X and Y the
  // defaults are seeded with ARE standard names - so read them back the same way
  // rather than showing "Button 2" for a label we wrote ourselves.
  if(i==null || i<0 || !padNames[i]) return PAD_BTN_NAMES[btn];
  return padStd[i] ? PAD_BTN_NAMES[btn] : 'Button ' + btn;
}
// Chrome reports ids like "xinput" or "Xbox 360 Controller (XInput STANDARD
// GAMEPAD)". The parenthetical is for machines, and "xinput" is for nobody, so
// strip the first and fall back to a plain count for the second.
function padPrettyName(id, i){
  let n = String(id||'')
    .replace(/\s*\((?:vendor|product|standard gamepad)[^)]*\)/gi,'')
    .replace(/\s*\([^)]*\)\s*$/,'')
    .replace(/^[0-9a-f]{4}[-:][0-9a-f]{4}[-:]\s*/i,'')   // "045e-02ea-Microsoft ..."
    .trim();
  if(/^x?input$/i.test(n) || n.length < 3) n = '';
  return n || ('Controller ' + (i+1));
}

function padsSupported(){ return typeof navigator.getGamepads === 'function'; }
function padPointerId(i){ return 'gp' + i; }

function padCursorFor(i){
  if(!padCurEl[i] && stageEl){
    const d = document.createElement('div');
    d.className = 'padcur';
    stageEl.appendChild(d);     // #surface, never the body: it must scale WITH
    padCurEl[i] = d;            // the activity, or it points at the wrong place
  }
  return padCurEl[i];
}
function padHideCursor(i){ if(padCurEl[i]) padCurEl[i].style.display='none'; }

// A modal owns the screen. The three of them (clrOv here, dpOv in Drums, smOv in
// Sampler) sit on the BODY rather than the stage precisely so a tap behind them
// cannot do something else - and the pad pointer, which injects coordinates
// instead of reading events, was walking straight through: measured 2026-08-30,
// a student's stick retargeted the Drums editor onto a different pad while the
// therapist was in it, and played notes behind the colour picker in every app
// that has one. The mouse half needs nothing; its dwell is gated on the canvas's
// own mouseenter/mouseleave, so it already stops. See PHASE-5C §11.7.
// A class, not a registry: a missed closeModal() would leave the student's
// pointer dead forever, where a missing class is only today's behaviour.
function modalOpen(){ return !!document.querySelector('.modal'); }

// Suspend, not release: padRelease() nulls the state, so the pointer would come
// back at the CENTRE of the canvas when the modal closed. A student who is slow
// to aim should not lose their aim because a therapist opened a picker. The note
// goes up, the ring goes, the dwell counters zero so nothing fires the instant
// the modal closes - and the position survives.
// padPrev is deliberately left alone. It is refreshed above the gate every frame,
// so clearing it would make a button still HELD across the modal read as a fresh
// rising edge and fire its action on close.
function padSuspend(i){
  const st = padSt[i]; if(!st) return;
  if(st.down){ st.down=false; onUp(padPointerId(i)); pokeSim(); }
  st.stillMs=0; st.clickMs=0; st.dwellArmed=false;
  padHideCursor(i);
}

// Release, never abandon. fitSurface() refuses to re-scale while any pointer is
// down, so a gamepad pointer left down by a flat battery or a kicked cable would
// freeze the chrome from ever resizing again, and hold a voice on.
function padRelease(i){
  const st = padSt[i];
  if(st && st.down) onUp(padPointerId(i));
  padSt[i] = null;
  padPrev[i] = null;
  padHideCursor(i);
}
function padForget(i){ padRelease(i); padNames[i] = null; padStd[i] = false; }

function pollPads(dt){
  if(!padsSupported()) return;
  padSyncStatus();
  let list;
  try{ list = navigator.getGamepads(); }catch(e){ return; }
  if(!list) return;
  const enabled = !!SETTINGS.padOn;
  const modal = modalOpen();   // once per frame, not once per pad

  for(let i=0;i<PAD_MAX;i++){
    const gp = list[i];
    if(!gp || !gp.connected){ if(padSt[i] || padNames[i]) padForget(i); continue; }

    padNames[i] = padPrettyName(gp.id, i);
    padStd[i] = gp.mapping === 'standard';

    // Rising edges, gathered whether or not the feature is on: the pane reports
    // them, and learning consumes them.
    const prev = padPrev[i] || (padPrev[i] = []);
    let firstDown = -1;
    if(gp.buttons){
      for(let b=0;b<gp.buttons.length;b++){
        const on = !!(gp.buttons[b] && gp.buttons[b].pressed);
        if(on && !prev[b] && firstDown<0) firstDown = b;
        prev[b] = on;
      }
    }
    if(firstDown>=0){
      padLastPress = { pad:i, btn:firstDown, at:Date.now() };
      if(bindLearnFor){
        const id=bindLearnFor; bindLearnFor=null; setBind(id,'pad',firstDown); buildSetupPanel();
      } else if(padLearnCb){ const cb=padLearnCb; padLearnCb=null; cb(firstDown); }
      else {
        // A bound button does its job whether or not the stick drives a pointer:
        // a controller can be nothing but a row of named actions.
        const id = bindFind('pad', firstDown);
        if(id) fireAction(railButtonById(id));
      }
    }
    if(!enabled){ if(padSt[i]) padRelease(i); continue; }

    // Bound buttons have already fired ABOVE this line, and that is the whole
    // rule: a modal stops the pointer (WHERE), never the buttons (WHEN). A
    // button is the student's own voice and already survives the session lock.
    if(modal){ padSuspend(i); continue; }

    // A slot can be reused by a different controller. Same index + different id
    // is a REPLACEMENT, so release the old pointer before adopting the new pad.
    const gid = (gp.id||'') + '#' + i;
    let st = padSt[i];
    if(!st || st.gid !== gid){
      if(st) padRelease(i);
      st = padSt[i] = { gid, x: canvas.clientWidth/2, y: canvas.clientHeight/2, down:false,
                        stillMs:0, clickMs:0, dwellArmed:false, everMoved:false };
    }
    // window blur releases every pointer; if ours went that way, forget it was down
    if(st.down && !pointers.some(p=>p.id===padPointerId(i))) st.down = false;

    const dead = Math.max(0, Math.min(0.9, SETTINGS.padDead!=null?SETTINGS.padDead:0.25));
    let ax = gp.axes && gp.axes.length>0 ? (gp.axes[0]||0) : 0;
    let ay = gp.axes && gp.axes.length>1 ? (gp.axes[1]||0) : 0;
    const mag = Math.hypot(ax,ay);
    if(mag <= dead){ ax=0; ay=0; }
    else {
      // rescale past the dead zone so movement starts from a standstill rather
      // than jumping to dead-zone speed the moment it is crossed
      const k = ((mag-dead)/(1-dead))/mag; ax*=k; ay*=k;
    }

    const deflected = (ax !== 0 || ay !== 0);

    // No learned button means EVERY button presses. The friendly failure is a
    // student pressing anything and getting a note, not one pressing the wrong
    // thing, getting silence, and being thought unable.
    //
    // EXCEPT a button that has been given a job on the Buttons tab. Right
    // trigger bound to Clear would otherwise play a note AND clear, which is
    // neither of the two things it was asked to do. Every UNBOUND button still
    // plays, so the friendly failure survives - and the Controller tab says
    // which ones went quiet, because nothing else would explain it.
    const bound = padBoundButtons();
    const want = SETTINGS.padButton;
    let pressed = false;
    if(gp.buttons){
      for(let b=0;b<gp.buttons.length;b++){
        const btn = gp.buttons[b];
        if(btn && btn.pressed && bound.indexOf(b)<0 && (want==null || want===b)){ pressed = true; break; }
      }
    }
    // Moving IS the press, for a student who cannot work a button at all. Held
    // while the stick is off centre and released when it comes back, so there is
    // nothing to press and nothing to hold. A button still works alongside it -
    // either source presses - so turning this on takes nothing away.
    //
    // Keyed on DEFLECTION, not on the cursor actually moving: at the edge of the
    // surface the cursor stops while the stick is still pushed, and lifting the
    // note there would be wrong.
    if(SETTINGS.padAuto && deflected) pressed = true;

    // Dwell: for the OTHER student - one who can aim the stick accurately but
    // cannot press anything. Travel is silent; arriving and holding still is the
    // press. That is what makes it a different setting from "pushing the stick
    // plays", which sounds every cell crossed on the way. PHASE-5C §3.
    //
    // Keyed on DEFLECTION, not on the cursor actually moving: at the edge of the
    // surface the cursor stops dead while the stick is still pushed, and firing
    // a dwell press there would be exactly wrong.
    //
    // The two settings would fight - padAuto holds the pointer down all the way
    // and drops it the instant the stick centres, which is the moment dwell
    // waits for - so padAuto wins and the pane says so rather than offering a
    // toggle that does nothing.
    // A dwell is a CLICK: it presses, lets go on its own, and only re-arms once
    // the stick has moved again. Holding until the next movement was the first
    // build and it left a note sounding indefinitely - see DWELL_CLICK_MS.
    if(SETTINGS.dwellPad && !SETTINGS.padAuto){
      if(deflected){
        st.everMoved=true; st.stillMs=0; st.dwellArmed=true;
        if(st.clickMs>0) st.clickMs=0;      // setting off ends the note; it never glides
      }
      // everMoved: without it a pad connected with dwell on would sound a note
      // at the centre of the screen on its own, before anyone touched it.
      else if(st.everMoved && !pressed){
        if(st.clickMs>0) st.clickMs -= dt*1000;
        else if(st.dwellArmed){
          st.stillMs += dt*1000;
          if(st.stillMs >= (SETTINGS.dwellPadMs||1200)){
            st.stillMs=0; st.dwellArmed=false; st.clickMs=DWELL_CLICK_MS;
          }
        }
      }
    } else { st.stillMs=0; st.clickMs=0; st.dwellArmed=false; }

    const wantDown = pressed || st.clickMs>0;

    // The press lands BEFORE the move, so a note starts where the cursor already
    // was and then glides. Pressing after would sound the far end of the frame's
    // travel instead of the near one.
    if(wantDown && !st.down){ st.down=true; getAudio(); onDown(padPointerId(i), st.x, st.y); pokeSim(); }

    let moved = false;
    if(deflected){
      // Speed is a fraction of the SHORTER side per second: isotropic, so a
      // diagonal push travels at the speed a straight one does, and it means the
      // same thing on the room projector as on a laptop.
      const unit = Math.min(canvas.clientWidth, canvas.clientHeight);
      const sp = (SETTINGS.padSpeed!=null?SETTINGS.padSpeed:0.6) * unit * dt;
      const nx = Math.max(0, Math.min(canvas.clientWidth,  st.x + ax*sp));
      const ny = Math.max(0, Math.min(canvas.clientHeight, st.y + ay*sp));
      if(nx!==st.x || ny!==st.y){ st.x=nx; st.y=ny; moved=true; }
    }

    if(!wantDown && st.down){ st.down=false; onUp(padPointerId(i)); pokeSim(); }
    else if(st.down && moved){ onMove(padPointerId(i), st.x, st.y); }
    if(moved) pokeSim();

    const cur = padCursorFor(i);
    if(cur){
      cur.style.display='';
      cur.classList.toggle('down', st.down);
      cur.style.transform = 'translate(' + st.x + 'px,' + st.y + 'px)';
      // The ring is where the dwell countdown is shown. It has to be ON the
      // pointer: a student watching for the moment it presses is looking at the
      // thing they are aiming, not at a panel they may not be able to see.
      ringCountdown(cur, (SETTINGS.dwellPad && !SETTINGS.padAuto && st.dwellArmed && st.clickMs<=0)
        ? st.stillMs/(SETTINGS.dwellPadMs||1200) : 0);
    }
  }
}
function padReleaseAll(){ for(let i=0;i<PAD_MAX;i++) if(padSt[i]) padRelease(i); }

// ── The mouse: a ring, and dwell ─────────────────────────────────────────────
// A mouse needs no setting to work here and never has - mousedown/mousemove is
// what the input layer takes. What it needs is a way to PRESS for someone who
// can aim a head-pointer or eye-gaze at a note and cannot click, and a pointer
// big enough to see from across a room. Neither belongs to the controller, and
// dwell in particular must not be shared with it: see SHARED_DEFAULTS.
const CURSOR_IDLE_MS = 2500;
// A dwell is a CLICK, not a hold. The first build pressed on arrival and stayed
// down until the pointer moved again, which the user found on 2026-08-30: a note
// that never ends on its own, and a ring left sitting solid after it fired. So
// the press has its own short life and then lets go, the way a real click does.
// Long enough for the envelope to open and be heard, short enough to be one note.
const DWELL_CLICK_MS = 250;
// How far the pointer may drift and still count as still. It was 2% of the
// shorter side - 14-21px, wide enough that an ordinary slow mouse move never
// reset the timer, so the ring filled WHILE MOVING. It is a jitter allowance for
// a head-pointer or eye-gaze, not a movement threshold, so it is small and
// absolute: anything a hand does deliberately restarts the count.
const DWELL_JITTER_PX = 6;
// ax/ay is the ANCHOR the drift is measured from, not the last position: drift
// has to accumulate, or a slow enough creep never trips it at all.
const mouseSt = { over:false, x:0, y:0, ax:0, ay:0,
                  stillMs:0, clickMs:0, armed:false, everMoved:false };
let mouseCurEl = null;
let mouseMovedAt = 0;            // for hiding the system arrow when it is abandoned

// A drawn ring stands in for the arrow, so it is only ever wanted when it is
// going to be looked at: the therapist asked for it, or dwell needs somewhere to
// show its countdown.
function mouseRingWanted(){ return !!(SETTINGS.bigPointer || SETTINGS.dwellMouse); }
function mouseCursor(){
  if(!mouseCurEl && stageEl){
    const d=document.createElement('div');
    d.className='padcur big';    // on #surface, so it scales with the activity
    stageEl.appendChild(d);
    mouseCurEl=d;
  }
  return mouseCurEl;
}
// A conic sweep filling the ring. Drawn as an inline background so the .down
// class keeps owning the solid fill - a pressed ring is not a countdown.
function ringCountdown(el, frac){
  if(!el) return;
  const f=Math.max(0,Math.min(1,frac||0));
  const want = f>0.001
    ? 'conic-gradient(rgba(255,255,255,0.55) '+(f*360).toFixed(0)+'deg, rgba(0,0,0,0) 0deg)'
    : '';
  if(el.style.backgroundImage!==want) el.style.backgroundImage=want;
}
function mouseDwellRelease(){
  if(mouseSt.clickMs>0){ mouseSt.clickMs=0; onUp('mouse'); pokeSim(); }
}
// Touch is excluded BY CONSTRUCTION, not by a setting: a hand resting on the
// glass would fire dwell constantly. canvas touchstart calls preventDefault, so
// a touchscreen never synthesises the mouse events this reads - and a finger
// still down is belt and braces for one that does.
function touchDown(){ return pointers.some(p=>typeof p.id==='number'); }
function pollMouseDwell(dt){
  const el=mouseCursor();
  const live = mouseSt.over && mouseRingWanted();
  if(el){
    el.style.display = live ? '' : 'none';
    if(live){
      el.classList.toggle('down', pointers.some(p=>p.id==='mouse'));
      el.style.transform = 'translate(' + mouseSt.x + 'px,' + mouseSt.y + 'px)';
    }
  }
  // A real click, a blur or a mouseup takes the pointer away underneath us.
  if(mouseSt.clickMs>0 && !pointers.some(p=>p.id==='mouse')){ mouseSt.clickMs=0; mouseSt.stillMs=0; }

  const live2 = SETTINGS.dwellMouse && mouseSt.over && mouseSt.everMoved && !touchDown();
  if(!live2){ mouseDwellRelease(); mouseSt.stillMs=0; mouseSt.armed=false; }
  else if(mouseSt.clickMs>0){
    // The press lets go on its own. Nothing has to move for the note to end.
    mouseSt.clickMs -= dt*1000;
    if(mouseSt.clickMs<=0){ mouseSt.clickMs=0; onUp('mouse'); pokeSim(); }
  }
  else if(mouseSt.armed){
    mouseSt.stillMs += dt*1000;
    if(mouseSt.stillMs >= (SETTINGS.dwellMouseMs||1200)){
      // One click per arrival. Only MOVING re-arms it, so resting on a note does
      // not fire it over and over, and the ring goes quiet instead of sitting
      // full where it went off.
      mouseSt.stillMs=0; mouseSt.armed=false; mouseSt.clickMs=DWELL_CLICK_MS;
      getAudio(); onDown('mouse', mouseSt.x, mouseSt.y); pokeSim();
    }
  }
  if(el && live) ringCountdown(el, (live2 && mouseSt.armed && mouseSt.clickMs<=0)
    ? mouseSt.stillMs/(SETTINGS.dwellMouseMs||1200) : 0);

  // Two pointers on one screen is the confusing thing, and on a projector the
  // worse half is an ABANDONED arrow sitting where it was left while a ring
  // moves. So the arrow goes when something is drawn in its place - at once when
  // that something is the mouse's own ring, and after a few seconds of stillness
  // when it is a controller's, which leaves the therapist their arrow the moment
  // they move it. Never over the rail or the panel: those need a real pointer.
  const padLive = padSt.some(s=>!!s);
  const hide = mouseRingWanted() || (padLive && Date.now()-mouseMovedAt > CURSOR_IDLE_MS);
  document.body.classList.toggle('nocursor', hide);
}

// Written into the pane by the poll, and only when it changes: this runs every
// frame, and a textContent write per frame is waste.
let padStatusWas='';
function padStatusLine(){
  const on = padNames.filter(Boolean);
  if(!on.length) return 'No controller found. Plug one in, or switch it on.';
  const p = padLastPress;
  const fresh = p && (Date.now()-p.at) < 1400;
  return on.join(', ') + (fresh ? '  \u2014  ' + padBtnName(p.pad, p.btn) + ' pressed' : '');
}
function padSyncStatus(){
  const el = document.getElementById('padStatus');
  if(!el) return;
  const t = padStatusLine();
  if(t!==padStatusWas){ padStatusWas=t; el.textContent=t; }
  const live = padNames.some(Boolean);
  el.classList.toggle('live', live);
}
window.addEventListener('gamepaddisconnected', e=>{ if(e.gamepad) padRelease(e.gamepad.index); });

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
  // fmt turns a number into what a person reads: "120%" rather than "1.20".
  const show=v=>item.fmt?item.fmt(v):Number(v).toFixed(item.dp);
  val.textContent=show(SETTINGS[item.key]);
  inp.addEventListener('input',()=>{
    const v=parseFloat(inp.value); SETTINGS[item.key]=v; val.textContent=show(v);
    if(item.key==='volume') applyVolume();
    saveSettings();
    if(item.onChange) item.onChange();
  });
  row.appendChild(head); row.appendChild(inp);
  return row;
}
// Lays two toggles side by side. Each keeps its own full-height hit area; only
// the width is halved.
function togglePair(a,b){
  const row=document.createElement('div'); row.className='tgpair';
  row.appendChild(a); row.appendChild(b); return row;
}
// THE WHOLE ROW is the target, not just the switch. A 64x36 switch was the
// only live pixel in a 48px row of otherwise dead space — the label sat right
// there naming the thing and did nothing when pressed.
// Split from makeToggle so a switch whose state does NOT live in SETTINGS
// (Fullscreen, whose truth is the browser) still looks and behaves identically.
function makeToggleRaw(label,isOn,onToggle){
  const row=document.createElement('div'); row.className='toggle';
  const lab=document.createElement('label'); lab.textContent=label;
  const sw=document.createElement('div'); sw.className='switch'+(isOn?' on':'');
  row.addEventListener('click',e=>{ e.stopPropagation(); getAudio(); onToggle(sw); });
  row.appendChild(lab); row.appendChild(sw);
  return row;
}
function makeToggle(label,key,onChange){
  return makeToggleRaw(label,SETTINGS[key],sw=>{
    SETTINGS[key]=!SETTINGS[key]; sw.classList.toggle('on',SETTINGS[key]); saveSettings(); if(onChange) onChange();
  });
}
// Every option in a group is always shown. TWO groups used to collapse to 4 plus
// an "All N" expander: Voice (12 voices) and Voice Visuals' Style (9 VISMODES) -
// the Style one was missed when this was written and found by the pane sweep.
// The 2026-08-24 note claimed capping Voice kept every pane inside a 1080-tall
// screen; by 2026-08-26 that was already untrue - the Sound pane measured 1316
// WITH the cap in place. The user's call, 2026-08-26: an expander is one
// more thing to find before you can choose, and picking a voice is the single
// most-used control on the Sound pane. The rows the cap used to save came back
// from pairing the effect toggles two to a row and dropping .sectn to --font-l.
function makeChips(label,key,map,onChange){
  const wrap=document.createElement('div');
  // A chip group labels ONE control, so it takes .ctlh, not the .sectn that
  // groups several. See framework.css.
  const sec=document.createElement('div'); sec.className='ctlh'; sec.textContent=label; wrap.appendChild(sec);
  const chips=document.createElement('div'); chips.className='chips';
  for(const k of Object.keys(map)){
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
const PAINTKEYS_OPTS={off:{label:'Off'},subtle:{label:'✨ Subtle'},full:{label:'🌊 Full trails'}};
function appendColorControls(el){
  // One flat row: note colours, each palette theme and single-colour are sibling
  // chips — the old two-level selector (mode row, then a theme row) was hard to
  // scan. colorMode/theme stay separate settings underneath.
  const h=document.createElement('div'); h.className='ctlh'; h.textContent='Paint colours'; el.appendChild(h);
  const chips=document.createElement('div'); chips.className='chips';
  const add=(label,active,pick)=>{
    const c=document.createElement('div'); c.className='chip'+(active?' active':'');
    c.textContent=label;
    c.addEventListener('click',e=>{ e.stopPropagation(); getAudio(); pick(); saveSettings(); buildVisualsPanel(); });
    chips.appendChild(c);
  };
  add('🌈 Note colours',SETTINGS.colorMode==='note',()=>{ SETTINGS.colorMode='note'; });
  for(const k in Anim.themes)
    add(Anim.themes[k].label||k, SETTINGS.colorMode==='theme'&&k===currentTheme,
        ()=>{ SETTINGS.colorMode='theme'; setTheme(k); });
  add('⬤ One colour',SETTINGS.colorMode==='single',
      ()=>{ SETTINGS.colorMode='single'; if(!SETTINGS.lockedColor) SETTINGS.lockedColor=[1,1,1]; });
  el.appendChild(chips);
  if(SETTINGS.colorMode==='single'){
    const row=document.createElement('div'); row.className='swrow';
    const lk=SETTINGS.lockedColor;
    STANDARD_SWATCHES.forEach(c=>{
      const sw=document.createElement('div'); sw.className='swatch'; sw.style.background=rgbCss(c);
      if(lk) sw.classList.toggle('active',Math.abs(c[0]-lk[0])<0.05&&Math.abs(c[1]-lk[1])<0.05&&Math.abs(c[2]-lk[2])<0.05);
      sw.addEventListener('click',e=>{ e.stopPropagation(); getAudio();
        SETTINGS.lockedColor=c.slice(); saveSettings(); buildVisualsPanel(); });
      row.appendChild(sw);
    });
    const pk=document.createElement('div'); pk.className='picker'; pk.title='Pick a custom colour';
    if(lk && !row.querySelector('.swatch.active')) pk.classList.add('active');
    pk.addEventListener('click',e=>{ e.stopPropagation(); getAudio();
      const cur=lk?'#'+lk.map(v=>('0'+Math.round(Math.min(v,1)*255).toString(16)).slice(-2)).join(''):'';
      openColorDialog('Custom colour',cur,hex=>{
        SETTINGS.lockedColor=hexToRGB(hex); saveSettings(); buildVisualsPanel(); }); });
    row.appendChild(pk);
    el.appendChild(row);
  }
}
// Our own colour dialog: the native <input type=color> opens an OS picker that
// looks different in every browser and has mouse-scale targets. This is a
// submenu-styled swatch grid at wall-touch size; taps apply live so the colour
// can be judged against the running animation, ✕ (or the backdrop) closes.
const CLR_BASIC=[
  '#000000','#12141c','#2a2d39','#5a5f6e','#c3c8d4','#ffffff',
  '#ff4136','#ff851b','#ffdc00','#2ecc40','#00bcd4','#0074d9',
  '#ff8f88','#ffc04d','#fff176','#7fe08a','#6fd9e8','#63a4ff',
  '#7a1f1f','#7a4a12','#6e6400','#14532a','#0f5e5e','#0b3d70',
  '#b10dc9','#f012be','#ff7fb2','#7c5cff','#3f2b96','#26094a',
];
function openColorDialog(title,cur,onPick){
  const ov=document.createElement('div'); ov.id='clrOv'; ov.className='modal';
  const dlg=document.createElement('div'); dlg.id='clrDlg'; dlg.className='submenu';
  dlg.innerHTML='<div class="dlghead"><span class="ttl"></span><button class="dlgx">✕</button></div><div id="clrGrid"></div>';
  dlg.querySelector('.ttl').textContent=title;
  const grid=dlg.querySelector('#clrGrid');
  let curHex=(cur||'').toLowerCase();
  CLR_BASIC.forEach(hex=>{
    const b=document.createElement('button'); b.className='clrsw'; b.style.background=hex;
    b.classList.toggle('active',hex===curHex);
    b.addEventListener('click',e=>{ e.stopPropagation();
      curHex=hex; onPick(hex);
      grid.querySelectorAll('.clrsw').forEach(x=>x.classList.toggle('active',x===b)); });
    grid.appendChild(b);
  });
  dlg.querySelector('.dlgx').addEventListener('click',()=>ov.remove());
  ov.addEventListener('click',e=>{ if(e.target===ov) ov.remove(); });
  dlg.addEventListener('click',e=>e.stopPropagation());
  // The one framework modal, and it stays on the body rather than the stage: it
  // has to cover the rail too, or a tap behind it does something else.
  ov.appendChild(dlg); document.body.appendChild(ov);
}
function appendBgControl(el){
  // Its own heading since the Fine-tune drawer went (Phase 4c): it was the one
  // control in there with no .sectn of its own, and it relied on the drawer's
  // summary for the "set this once" framing.
  const h=document.createElement('div'); h.className='ctlh'; h.textContent='Background'; el.appendChild(h);
  const bgRow=document.createElement('div'); bgRow.className='swrow';
  const bgpk=document.createElement('div'); bgpk.className='bbar bgpick'; bgpk.title='Background colour';
  bgpk.textContent='Background colour';
  const dot=document.createElement('span'); dot.className='bgdot'; dot.style.background=SETTINGS.bg;
  bgpk.appendChild(dot);
  bgpk.addEventListener('click',e=>{ e.stopPropagation();
    openColorDialog('Background colour',SETTINGS.bg,hex=>{
      SETTINGS.bg=hex; dot.style.background=hex; saveSettings(); applyBg(); }); });
  bgRow.appendChild(bgpk); el.appendChild(bgRow);
}
// The "Fine-tune" drawer that used to sit at the bottom of the Visuals and Sound
// panes was removed in Phase 4c (PHASE-4C-FINETUNE.md). Set-once controls are
// appended where the drawer stood — every group inside it already carried its
// own .sectn heading, so nothing lost its label, and a therapist no longer has
// to open a disclosure to find a setting. Two things it left behind:
//   - Performance and Show-performance had already moved to the Setup pane on
//     2026-08-24, which left EIGHT apps rendering a labelled drawer that opened
//     onto nothing, unnoticed for a day. Take the last control out of a group
//     and its heading has to go too. Flattened, that fault shows up as two
//     .sectn headings in a row and a sweep can see it; inside a <details> it
//     looked like a populated container. UAT-PHASE-4C.md §B is that sweep.
//   - fineTuneOpen, one boolean shared by both drawers, is gone with them.
function buildVisualsPanel(){
  const el=document.getElementById('visualsContent'); el.innerHTML='';
  // An app can take over the Visuals panel (e.g. Song Grid's reward styles);
  // QUALITY/setPerf/applyStats/applyBg and the make* helpers are in scope for it.
  if(Anim.buildVisuals){ Anim.buildVisuals(el); return; }
  if(SETTINGS.mode==='notes' && !Anim.lockMode){
    // Keys mode: the keyboard is the instrument — the everyday controls up top
    // are about how the keys look. Trails and press effects follow below: still
    // set-once extras, off by default, for students who need a bigger visual
    // reward, but no longer behind a disclosure.
    el.appendChild(makeChips('Key look','zoneLook',ZONE_OPTS,()=>{ buildBands(); buildVisualsPanel(); }));
    if(SETTINGS.zoneLook!=='off')
      el.appendChild(makeToggle('Note letters','showLabels',buildBands));
    el.appendChild(makeChips('Paint trails','paintKeys',PAINTKEYS_OPTS,()=>{ refreshRailButtons(); buildVisualsPanel(); }));
    if(SETTINGS.paintKeys!=='off') appendColorControls(el);
    el.appendChild(makeChips('When a key is pressed','pressFx',PRESSFX_OPTS));
    appendBgControl(el);
  } else {
    // Flow mode: painting IS the app — colours and styles stay up top, the
    // per-app sliders follow underneath.
    el.appendChild(makeToggle('Paint trails','paint',buildVisualsPanel));
    if(SETTINGS.paint!==false) appendColorControls(el);
    if(Anim.styles && SETTINGS.paint!==false){
      const h=document.createElement('div'); h.className='ctlh'; h.textContent='Style'; el.appendChild(h);
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
    // Animation-specific sliders/toggles, under the app's own heading
    if((Anim.schema||[]).length){
      const h2=document.createElement('div'); h2.className='sectn'; h2.textContent=Anim.sectionLabel||'Controls'; el.appendChild(h2);
      Anim.schema.forEach(it=>{
        if(it.type==='toggle') el.appendChild(makeToggle(it.label,it.key));
        else if(it.type==='preset-chips') el.appendChild(makeChips(it.label,it.key,it.options));
        else el.appendChild(makeSlider(it));
      });
    }
    appendBgControl(el);
  }
}

// ── Notes panel: which notes the student can play, and how they're laid out ─────
const OCT_OPTS={'3':{label:'Low'},'4':{label:'Middle'},'5':{label:'High'}};
const YAXIS_OPTS={octaves:{label:'▦ Octaves'},loud:{label:'Loudness'},bright:{label:'Brightness'},none:{label:'Nothing'}};
// KEY LOOK — three ways, because that is what the room needs.
//
//   Boomwhacker  the colours of the physical instruments, at full strength
//   Muted        the same colours, quiet, for a student who finds them too much
//   Mono         no colour at all: white keys on black, for contrast
//
// `Lines only` and `Invisible` are gone from the row. Invisible duplicated what
// switching to flow mode already does, and the apps that hide their keyboard
// (Big Switch, MIDI Light, Sound Match) set `zoneLook:'off'` internally and never
// show this row at all - it is guarded by `!Anim.lockMode`. Both values still
// WORK, so nothing those apps rely on has changed; they are simply not offered.
//
// Boomwhacker is drawn at full strength and separated by a DARK gap rather than
// by dimming alternate keys. Two attempts at alternating the brightness are
// recorded here because both were wrong:
//
//   - alternating on the COLUMN INDEX made the first C bright and the second C
//     dark on an 11-key scale. The same note in two colours, which is the one
//     thing the Boomwhacker convention cannot survive.
//   - alternating on the note's DEGREE fixed that, and still failed: dimming a
//     colour to 0.35 does not make a quieter version of it, it makes A DIFFERENT
//     COLOUR. D is hue 28 at 53% lightness and reads as orange; at 0.35 it is the
//     same hue at 18% and reads as BROWN. The user: "D looks brown rather than
//     orange." The palette was right; the dimming was wrong.
//
// So nothing is dimmed to make room for its neighbour. Every key is its own
// colour at full strength - measured 3.39:1 to 12.55:1 against the background,
// where the shipped keyboard was 1.12:1 - and the dark separator does the
// separating, which is also what makes it work for a colour-blind student.
const ZONE_OPTS={tint:{label:'🌈 Boomwhacker'},muted:{label:'🌫 Muted'},mono:{label:'◐ Mono'}};
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
// The tuning group - WHICH NOTES an app plays - always Register, Scale, Starting
// note, in that order, always on the NOTES tab.
//
// Six apps had these three on the SOUND tab instead (song_grid, beat_builder,
// big_switch, bubbles, conductor, echo_bird), all from one copy-pasted
// Anim.soundExtras block; in Bubbles and Echo Bird that split the tuning across
// two tabs, with the note COUNT on Notes and the rest on Sound. One helper means
// the order and the labels cannot drift apart again.
//
// opts.scales lets an app pass its own reduced table (SG_SCALES); opts.label
// renames the heading; opts.heading:false drops it, for a pane that is nothing
// but tuning; opts.scale:false drops the Scale row, for an app that has no
// scale to offer (Soundscape tunes a drone, it does not play a scale).
function appendTuning(el,onChange,opts){
  const o=opts||{};
  if(o.heading!==false){
    const h=document.createElement('div'); h.className='sectn';
    h.textContent=o.label||'Tuning'; el.appendChild(h);
  }
  el.appendChild(makeChips('Register','octave',OCT_OPTS,onChange));
  if(o.scale!==false) el.appendChild(makeChips('Scale','scale',o.scales||SCALES,onChange));
  el.appendChild(makeChips('Starting note','rootNote',rootOptions(),onChange));
}
function refreshInstrument(){ refreshMusic(); buildInstrumentPanel(); }
// "Keys" is only true in Keys mode - in Flow the student paints a continuous
// field and there is nothing to press - so the label follows the mode. The pane
// already rebuilds on a mode switch, so this costs nothing.
function noteCountLabel(){ return SETTINGS.mode==='notes' ? 'Number of keys' : 'Number of notes'; }

// "Up / down means…" and "How many octaves" were two rows for one decision: the
// second only ever appeared when the first said Octaves, and it restated it
// ("higher on screen = higher pitch") to fill the space. They are one row now.
//
// TWO SETTINGS KEYS, ONE ROW - deliberately. yAxis ('octaves'|'loud'|'bright'|
// 'none') and octaveRows ('2'|'3') are both still stored exactly as before, so a
// v1.0.0 preset loads unchanged and there is no migration. Choosing an octave
// chip writes both; choosing any other chip leaves octaveRows alone, so the row
// count a therapist set is still there when they come back to Octaves.
function makeYAxisChips(){
  const wrap=document.createElement('div');
  const sec=document.createElement('div'); sec.className='ctlh';
  sec.textContent='Up / down means…'; wrap.appendChild(sec);
  const chips=document.createElement('div'); chips.className='chips';
  const opts=[
    {label:'▦ 2 octaves', yAxis:'octaves', rows:'2'},
    {label:'▦ 3 octaves', yAxis:'octaves', rows:'3'},
    {label:'Loudness',    yAxis:'loud'},
    {label:'Brightness',  yAxis:'bright'},
    {label:'Nothing',     yAxis:'none'},
  ];
  const isActive=o => o.rows
    ? (SETTINGS.yAxis==='octaves' && String(SETTINGS.octaveRows)===o.rows)
    : SETTINGS.yAxis===o.yAxis;
  for(const o of opts){
    const c=document.createElement('div'); c.className='chip'+(isActive(o)?' active':'');
    c.textContent=o.label;
    c.addEventListener('click',e=>{ e.stopPropagation(); getAudio();
      SETTINGS.yAxis=o.yAxis;
      if(o.rows) SETTINGS.octaveRows=o.rows;
      saveSettings();
      chips.querySelectorAll('.chip').forEach(x=>x.classList.remove('active'));
      c.classList.add('active');
      // Only the scale and the bands depend on this - nothing appears or
      // disappears from the pane any more, so the panel is not rebuilt and a
      // therapist keeps their scroll position mid-choice.
      refreshMusic(); });
    chips.appendChild(c);
  }
  wrap.appendChild(chips); return wrap;
}

// ── The app's own tab ──────────────────────────────────────────────────────
// Present only when the app defines Anim.buildApp. It exists so that the NOTES
// tab can mean exactly one thing in every app: Register, Scale, Starting note,
// and the note count where there is one. Song Grid's songs, Beat Builder's
// steps and Soundscape's mixer are none of those, and putting them on Notes was
// what forced a "## Tuning" heading that Fluid Keys does not have.
// See PHASE-4E-APP-TAB.md.
function buildAppPanel(){
  const el=document.getElementById('appContent'); el.innerHTML='';
  if(Anim.buildApp) Anim.buildApp(el);
}
function buildInstrumentPanel(){
  const el=document.getElementById('instrumentContent'); el.innerHTML='';
  // An app can take over the Notes panel entirely (e.g. Song Grid's song picker);
  // the framework helpers (makeChips/makeSlider/makeToggle, rootOptions, OCT_OPTS,
  // refreshMusic/refreshInstrument) are all in scope for it to reuse.
  if(Anim.buildInstrument){ Anim.buildInstrument(el); return; }
  // Keys/Flow is switched from the rail 🎹/🌊 button only — the open panel
  // rebuilds itself when it changes, so no duplicate Mode chips here.
  //
  // Order set by the user 2026-08-26, and it reads as the questions a therapist
  // actually asks in sequence: how many, how high, which notes, what does moving
  // up and down do, and where does it start. Starting note is last because it is
  // the one most often left alone.
  //
  // Up to 12: a full octave run plus a few (an octave of major = 8). Zones get
  // narrow up there — meant for the big room screen and able hands, so the slider
  // allows it but the default stays at 5.
  el.appendChild(makeSlider({key:'noteCount',label:noteCountLabel(),min:2,max:12,step:1,dp:0,onChange:refreshMusic}));
  el.appendChild(makeChips('Register','octave',OCT_OPTS,refreshMusic));
  el.appendChild(makeChips('Scale','scale',SCALES,refreshInstrument));
  el.appendChild(makeYAxisChips());
  // Zone look / note letters / press effect are appearance, not musical content —
  // they live in the Keys-mode Visuals panel (buildVisualsPanel).
  if(SETTINGS.mode!=='notes')
    el.appendChild(makeChips('Glide between notes','glide',GLIDE_OPTS));
  el.appendChild(makeChips('Starting note','rootNote',rootOptions(),refreshMusic));
}

// ── Instrument panel (id "sound"): what the notes sound like ────────────────────
function buildSoundPanel(){
  const snd=document.getElementById('soundControls'); snd.innerHTML='';
  if(Anim.buildSound){ Anim.buildSound(snd); return; }   // full takeover (e.g. drums: no Voice)
  if(Anim.soundExtras) Anim.soundExtras(snd);   // app-specific controls (e.g. tuning) on top
  snd.appendChild(makeChips('Voice','voice',VOICES));
  const fx=document.createElement('div'); fx.className='sectn'; fx.textContent='Effects'; snd.appendChild(fx);
  // Two to a row: four full-width toggles for four one-word labels was four rows
  // of mostly empty strip, and it pushed Volume and the sound macros under the
  // fold. The whole half-row is still the target - see .tgpair in framework.css.
  snd.appendChild(togglePair(makeToggle('Reverb','reverb',applyReverb),
                             makeToggle('Echo',  'echo',  applyEcho)));
  snd.appendChild(togglePair(makeToggle('Chorus','chorus',applyChorus),
                             makeToggle('Mute',  'mute',  applyVolume)));
  snd.appendChild(makeSlider({key:'volume',label:'Volume',min:0,max:1,step:0.01,dp:2}));
  // Sound macros: three student-safe sliders that shape ANY voice (see toneMul/
  // attackTime/ringMul). New notes pick changes up; nothing can break a sound.
  const h=document.createElement('div'); h.className='sectn'; h.textContent='Shape the sound'; snd.appendChild(h);
  snd.appendChild(makeSlider({key:'tone',   label:'Brightness (dark → bright)', min:0,max:1,step:0.05,dp:2}));
  snd.appendChild(makeSlider({key:'attack', label:'Attack (soft → crisp)',      min:0,max:1,step:0.05,dp:2}));
  snd.appendChild(makeSlider({key:'ring',   label:'Ring (short → long)',        min:0,max:1,step:0.05,dp:2}));
}

// ── Named presets (per-student setups, stored locally) ─────────────────────────
const PRESET_KEY = 'presets:' + location.pathname.split('/').pop();
function loadPresets(){ try{ return JSON.parse(localStorage.getItem(PRESET_KEY)||'{}'); }catch(e){ return {}; } }
function storePresets(o){ try{ localStorage.setItem(PRESET_KEY, JSON.stringify(o)); }catch(e){} }

/* ── Presets you can carry off the machine ───────────────────────────────────
   PHASE-10-PRESET-BACKUP.md. Presets live in this browser profile's
   localStorage and nowhere else, so "clear browsing data" or a reimaged PC took
   every therapist's saved setup with no way to have kept a copy. The Sampler's
   recordings already had a file; presets did not.

   ONE FILE FOR EVERY APP, not one per app. The button sits on a per-app pane, so
   the pane says so - but the failure this insures against is "this machine lost
   everything", and the answer to that cannot be twenty-three separate files
   somebody has to remember to make.

   Settings, recordings, ui-scale and fullscreen are all deliberately OUT of it:
   see the doc. `uiScale` is already stripped when a preset is saved, because
   loading Jamie's preset must not resize the room's controls, and a backup that
   carried it between machines would undo that.                                */
const PRESET_FILE_FORMAT='music-room-presets';
const PRESET_FILE_VERSION=1;
const PRESET_FILE_MAX=8*1024*1024;      // refuse a mis-picked file before parsing
let presetNote='';                      // one line of feedback on the pane

function allPresetStores(){
  const out={};
  try{
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i);
      if(!k || k.indexOf('presets:')!==0) continue;
      const page=k.slice('presets:'.length);
      let v=null; try{ v=JSON.parse(localStorage.getItem(k)||'{}'); }catch(e){ continue; }
      if(v && typeof v==='object' && Object.keys(v).length) out[page]=v;
    }
  }catch(e){}
  return out;
}

function exportPresets(){
  const presets=allPresetStores();
  const apps=Object.keys(presets);
  let n=0; apps.forEach(a=>{ n+=Object.keys(presets[a]).length; });
  if(!n){ presetNote='There are no presets on this computer to save yet.'; buildPresetsPanel(); return; }
  const text=JSON.stringify({
    format:PRESET_FILE_FORMAT, version:PRESET_FILE_VERSION,
    saved:new Date().toISOString().slice(0,10), presets
  },null,1);
  const fname='music-room-presets-'+new Date().toISOString().slice(0,10)+'.json';
  const count=n+(n===1?' preset':' presets')+' from '+apps.length+(apps.length===1?' app':' apps');

  const toDownloads=()=>{
    const blob=new Blob([text],{type:'application/json'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob); a.download=fname; a.click();
    setTimeout(()=>{ try{ URL.revokeObjectURL(a.href); }catch(e){} }, 4000);
    presetNote='Saved '+count+' to your downloads folder.';
    buildPresetsPanel();
  };

  // A REAL "SAVE AS" WHERE THE BROWSER HAS ONE, so a therapist can put the file
  // straight onto the USB stick the room runs from rather than hunting through
  // Downloads for it. Measured rather than assumed: on `file://`,
  // `isSecureContext` is true and showSaveFilePicker OPENS in Edge and Chrome -
  // the failure from a headless run is AbortError, not SecurityError. Firefox
  // does not have the API at all, so it takes the download instead.
  //
  // It must be called before any `await`, or the click that got us here has
  // stopped counting as the user gesture it requires.
  if(typeof window.showSaveFilePicker==='function'){
    let p=null;
    try{
      p=window.showSaveFilePicker({ suggestedName:fname, types:[{
        description:'Music Room presets', accept:{'application/json':['.json']} }] });
    }catch(e){ toDownloads(); return; }
    p.then(h=>h.createWritable().then(w=>w.write(text).then(()=>w.close()).then(()=>{
      presetNote='Saved '+count+' to '+(h.name||fname)+'.';
      buildPresetsPanel();
    }))).catch(err=>{
      // Cancelled is not a failure: say nothing was saved and change nothing.
      if(err && (err.name==='AbortError' || err.name==='NotAllowedError')){
        presetNote='Nothing was saved.'; buildPresetsPanel(); return;
      }
      toDownloads();
    });
    return;
  }
  toDownloads();
}

// A MERGE THAT CAN ONLY ADD. Same name and identical settings is skipped, so
// importing the same file twice does nothing the second time; same name and
// DIFFERENT settings arrives as "name (2)", because a shared room PC can hold
// two therapists' presets with the same initials and silently replacing one
// with the other is the worst thing this could do. Nothing is ever deleted.
function mergePresets(fileData){
  let added=0, skipped=0, renamed=0, failed=0;
  for(const page in fileData){
    const incoming=fileData[page];
    if(!incoming || typeof incoming!=='object') continue;
    const key='presets:'+page;
    let have={};
    try{ have=JSON.parse(localStorage.getItem(key)||'{}'); }catch(e){ have={}; }
    if(!have || typeof have!=='object') have={};
    for(const name in incoming){
      const snap=incoming[name];
      if(!snap || typeof snap!=='object' || Array.isArray(snap)) { failed++; continue; }
      if(Object.prototype.hasOwnProperty.call(have,name)){
        if(JSON.stringify(have[name])===JSON.stringify(snap)){ skipped++; continue; }
        let n=2, alt=name+' ('+n+')';
        while(Object.prototype.hasOwnProperty.call(have,alt) &&
              JSON.stringify(have[alt])!==JSON.stringify(snap)){ n++; alt=name+' ('+n+')'; }
        if(Object.prototype.hasOwnProperty.call(have,alt)){ skipped++; continue; }
        have[alt]=snap; renamed++; added++;
      } else { have[name]=snap; added++; }
    }
    try{ localStorage.setItem(key, JSON.stringify(have)); }
    catch(e){ failed+=added; added=0; }
  }
  return {added, skipped, renamed, failed};
}

function importPresets(){
  const inp=document.createElement('input');
  inp.type='file'; inp.accept='.json,application/json';
  inp.addEventListener('change',()=>{
    const f=inp.files && inp.files[0]; if(!f) return;
    if(f.size>PRESET_FILE_MAX){
      presetNote='⚠ That file is too big to be a preset file. Nothing was changed.';
      buildPresetsPanel(); return;
    }
    const fr=new FileReader();
    fr.onload=()=>{
      let d=null;
      try{ d=JSON.parse(fr.result); }catch(e){
        presetNote='⚠ That file is not a preset file. Nothing was changed.';
        buildPresetsPanel(); return;
      }
      if(!d || d.format!==PRESET_FILE_FORMAT || !d.presets || typeof d.presets!=='object'){
        presetNote='⚠ That file is not a Music Room preset file. Nothing was changed.';
        buildPresetsPanel(); return;
      }
      if(+d.version>PRESET_FILE_VERSION){
        presetNote='⚠ That file was saved by a newer version of the Music Room. Nothing was changed.';
        buildPresetsPanel(); return;
      }
      const r=mergePresets(d.presets);
      const bits=[];
      bits.push(r.added? 'Added '+r.added+(r.added===1?' preset':' presets') : 'Nothing new to add');
      if(r.renamed) bits.push(r.renamed+' had a name already here, so '+
        (r.renamed===1?'it was':'they were')+' added with a number');
      if(r.skipped) bits.push(r.skipped+' already here');
      if(r.failed)  bits.push('⚠ '+r.failed+' could not be kept - storage may be full');
      presetNote=bits.join(' · ')+'.';
      buildPresetsPanel();
    };
    fr.onerror=()=>{ presetNote='⚠ That file could not be read. Nothing was changed.'; buildPresetsPanel(); };
    fr.readAsText(f);
  });
  inp.click();
}
function applyAllSettings(){
  // Every route in - boot, a preset, ↺ Defaults, a launch link - lands here, so
  // this is the one place the reach area has to be normalised. Placing is torn
  // down with it: the therapist was aiming at the setup that has just been
  // replaced, and leaving the overlay up would leave the activity un-tappable.
  clampReach(); setPlacing(false);
  saveSettings();
  const tk=Object.keys(Anim.themes); currentTheme=tk.includes(SETTINGS.theme)?SETTINGS.theme:tk[0];
  buildScale(); buildBands();
  applyVolume(); applyReverb(); applyEcho(); applyChorus(); applyBg(); applyStats();
  // Control size survives a preset load AND a reset: it belongs to the display,
  // so restoring one student's setup — or resetting this one app — must not
  // resize the controls in the other sixteen.
  SETTINGS.uiScale = readUiScale(); applyUiScale();
  if(SETTINGS.quality!=='auto') setPerf(SETTINGS.quality);
  refreshRailButtons();
  if(currentQuickMode && PANE_BUILDERS[currentQuickMode]) PANE_BUILDERS[currentQuickMode]();
}
// Defaults IS a preset - the one you always have. applyPreset({}) is this
// function, and the only real difference is the last line: Defaults clears the
// artwork where a saved preset leaves it alone.
//
// That difference is deliberate. "Defaults" means "as if you had just opened the
// app", and a freshly opened app has an empty canvas. It is also the only way to
// wipe one in the twelve apps that hide the 🧹 Clear rail button - Conductor's
// baton trail accumulates and has no other control.
//
// The two release calls are belt and braces: pollPads already releases when
// padOn goes false, and the mouse dwell releases itself. Kept because a held
// pointer surviving a reset would freeze fitSurface() and hold a voice on, and
// that is not a bug worth re-learning if either poll is ever restructured.
function applyDefaults(){
  SETTINGS=Object.assign({},SHARED_DEFAULTS,Anim.defaults||{});
  // SHARED_DEFAULTS carries locked:false, so this unlocks - and an unlock must
  // close the lock's fullscreen loan, exactly as applyPreset does. PHASE-4H
  // named this the case most likely to be forgotten, and it was: the two landed
  // on separate branches, so neither one's tests could see both halves.
  lockReleaseFullscreen();
  padReleaseAll(); mouseDwellRelease();
  migrateBind();                          // bind:null again, so the X/Y defaults come back
  applyAllSettings();
  if(Anim.reset) Anim.reset();
}
function applyPreset(name){
  const p=loadPresets()[name]; if(!p) return;
  SETTINGS=Object.assign({}, SHARED_DEFAULTS, Anim.defaults||{}, p);
  SETTINGS.locked=false;   // loading a preset never locks you out
  lockReleaseFullscreen(); // ...and must not leave the lock's fullscreen loan open
  // A preset saved before Phase 5c carries a 5b keyMap and no bind at all, so
  // the migration has to run on every load, not once at boot.
  migrateBind();
  applyAllSettings();
}
function buildPresetsPanel(){
  const el=document.getElementById('presetsContent'); el.innerHTML='';
  const h=document.createElement('div'); h.className='sectn'; h.textContent='Save current setup'; el.appendChild(h);
  const inp=document.createElement('input'); inp.type='text'; inp.maxLength=48;
  // INITIALS, never a full name. These land in a shared room PC's localStorage
  // and stay there. The example used to read "Alex", which is exactly the thing
  // it was meant to discourage - staff type what the box shows them.
  inp.placeholder='Initials + setup, e.g. "AM — 5 notes, calm"';
  el.appendChild(inp);
  const nameHint=document.createElement('div'); nameHint.className='hint';
  nameHint.textContent='Initials only, please — never a full name. Presets stay on this computer.';
  el.appendChild(nameHint);
  const save=document.createElement('button'); save.className='btn';
  save.style.cssText='margin-top:10px;width:100%;text-align:center';
  save.textContent='💾 Save preset';
  const doSave=()=>{
    const name=inp.value.trim(); if(!name){ inp.focus(); return; }
    const all=loadPresets();
    // A preset is a STUDENT's setup. Control size is the display's, so it is not
    // captured — loading Jamie's preset must not resize the room's controls.
    const snap=Object.assign({},SETTINGS); delete snap.locked; delete snap.uiScale;
    all[name]=snap; storePresets(all);
    inp.value=''; buildPresetsPanel();
  };
  save.addEventListener('click',e=>{ e.stopPropagation(); doSave(); });
  inp.addEventListener('keydown',e=>{ if(e.key==='Enter') doSave(); });
  el.appendChild(save);

  // ── A launch link carries the setup itself, so nothing has to be saved and
  // there is nothing anyone can delete: the link IS the setup. The room PC's
  // control software holds it. PHASE-6-LAUNCH-PARAMETERS.md.
  const out=document.createElement('div'); out.style.display='none';
  const lnk=document.createElement('button'); lnk.className='btn';
  lnk.style.cssText='margin-top:10px;width:100%;text-align:center';
  lnk.textContent='🔗 Copy launch link';
  lnk.addEventListener('click',e=>{ e.stopPropagation(); showLaunchLink(out); });
  el.appendChild(lnk); el.appendChild(out);
  const h2=document.createElement('div'); h2.className='sectn'; h2.textContent='Saved presets'; el.appendChild(h2);

  // ↺ Defaults, first in the list, because that is what it is - see
  // applyDefaults(). It used to be a button reading "Reset all settings" on the
  // Setup pane, and before that the same button HERE, where it read as "wipe my
  // students' saved setups" and was moved away for it. Naming it after the thing
  // it loads is what fixes that; the location was never the problem.
  //
  // Tap-twice, and only on this row: it is the only one that destroys the
  // artwork. The others just swap settings, which another tap undoes.
  const drow=document.createElement('div'); drow.className='prow';
  const dbtn=document.createElement('button'); dbtn.className='chip pname';
  dbtn.textContent='↺ Defaults';
  dbtn.title='Back to how this app opens - settings and a clear screen';
  let darm=null;
  dbtn.addEventListener('click',e=>{ e.stopPropagation();
    if(darm){ clearTimeout(darm); darm=null; getAudio(); applyDefaults(); buildPresetsPanel(); return; }
    dbtn.textContent='Tap again to reset';
    darm=setTimeout(()=>{ darm=null; dbtn.textContent='↺ Defaults'; },3000);
  });
  drow.appendChild(dbtn); el.appendChild(drow);

  const all=loadPresets(), names=Object.keys(all).sort((a,b)=>a.localeCompare(b));
  if(!names.length){
    const none=document.createElement('div'); none.className='hint';
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

  // ── Backup, at the bottom because it is a once-a-term job, not a daily one
  const h3=document.createElement('div'); h3.className='sectn';
  h3.textContent='Backup'; el.appendChild(h3);

  const outBtn=document.createElement('button'); outBtn.className='btn';
  outBtn.style.cssText='width:100%;text-align:center';
  outBtn.textContent='💾 Save all presets to a file';
  outBtn.title='Every app\u2019s presets, in one file';
  outBtn.addEventListener('click',e=>{ e.stopPropagation(); exportPresets(); });
  el.appendChild(outBtn);

  const inBtn=document.createElement('button'); inBtn.className='btn';
  inBtn.style.cssText='margin-top:10px;width:100%;text-align:center';
  inBtn.textContent='📂 Load presets from a file';
  inBtn.title='Adds them to this computer. Nothing already here is removed';
  inBtn.addEventListener('click',e=>{ e.stopPropagation(); importPresets(); });
  el.appendChild(inBtn);

  if(presetNote){
    const pn=document.createElement('div'); pn.className='hint';
    pn.style.cssText='margin-top:8px';
    pn.textContent=presetNote; el.appendChild(pn);
  }

  const bh=document.createElement('div'); bh.className='hint';
  bh.textContent='Saves EVERY app\u2019s presets, not just this one. Loading a file only '+
    'adds \u2014 nothing already on this computer is removed or overwritten. The file has '+
    'preset names in it, so initials only. Sampler recordings are saved separately, '+
    'on the Sampler\u2019s own pane.';
  el.appendChild(bh);
}

// ── Setup pane: the display and the machine, not the music ─────────────────────
// The fifth pane, added 2026-08-24. Notes/Sound/Visuals/Presets are all about
// what the STUDENT experiences; there was nowhere for the things a therapist
// sets once per room — how big the controls are, how hard the machine works.
// They were buried in the Visuals pane's Fine-tune drawer, which is a strange
// place to look for "the text is too small to read". (That drawer is itself
// gone as of Phase 4c; this pane is where its refugees landed.)
//
// This pane is also where phase 2's switch-access controls land. They have no
// sensible home in the other four, and burying an ACCESS setting in a drawer is
// how a student ends up unable to play.
// ── Setup → Access: three tabs, one honest job each ──────────────────────────
// Controller · Mouse · Buttons. They are TABS, not a mode switch: every device
// stays live whichever one is showing, because a therapist on the mouse and a
// student on the stick is the normal case and not a conflict. The pane's old
// flat list said nothing at all about a mouse, and silence reads as "not
// supported". See PHASE-5C-ACCESS-PANE.md.
//
// The chosen tab is deliberately NOT a setting: it is where the therapist is
// looking, not something about the student, so it never rides in a preset.
let accessTab = null;

function accessHint(el, text){
  const h=document.createElement('div'); h.className='hint'; h.textContent=text;
  el.appendChild(h); return h;
}
function accessCtlh(el, text){
  const h=document.createElement('div'); h.className='ctlh'; h.textContent=text;
  el.appendChild(h); return h;
}
// "X and Y", "X, Y and Z" — the "All except…" line is read aloud as often as it
// is read, and a comma-separated list is not a sentence.
function listWords(a){
  if(a.length<2) return a[0]||'';
  return a.slice(0,-1).join(', ') + ' and ' + a[a.length-1];
}
// The pane's name for a pad button. Uses the FIRST connected controller's
// mapping, and the standard names when nothing is connected: the X and Y we seed
// the defaults with are standard names, so reading them back as "Button 2"
// before anything is plugged in would be our own label we failed to recognise.
function padBtnLabel(btn){ return padBtnName(padNames.findIndex(Boolean), btn); }
function bindChipLabel(b){ return b.type==='pad' ? padBtnLabel(b.code) : keyLabel(b.code); }

// Dwell, for whichever device owns it — two keys per device, never shared.
// For the student who can aim accurately but cannot press: move quietly, arrive,
// hold still, and THEN it presses. That is what makes it a different setting
// from "pushing the stick plays", which sounds every cell crossed on the way.
function buildDwell(el, where){
  const onKey = where==='pad' ? 'dwellPad'   : 'dwellMouse';
  const msKey = where==='pad' ? 'dwellPadMs' : 'dwellMouseMs';
  // Never a toggle that silently does nothing. With the stick already pressing
  // as it moves, dwell has nothing left to wait for, so this says so instead.
  if(where==='pad' && SETTINGS.padAuto){
    accessCtlh(el,'Dwell');
    accessHint(el,'Not used while "Pushing the stick plays" is on — that already presses.');
    return;
  }
  el.appendChild(makeToggle('Dwell',onKey,buildSetupPanel));
  accessHint(el, SETTINGS[onKey]
    ? (where==='pad' ? 'Rest the stick and it plays a note. The mouse is unaffected.'
                     : 'Hold the pointer still and it plays a note. Never on a touchscreen.')
    : 'Plays by holding still, for someone who can aim but cannot press.');
  // The ceiling was 2.5 s and the user asked for more on 2026-08-30. A student
  // who needs dwell at all may need several seconds to settle, and a range that
  // stops short of what they need is a control that cannot do its job.
  if(SETTINGS[onKey]) el.appendChild(makeSlider({key:msKey,label:'Hold for',
    min:400,max:6000,step:100,fmt:v=>(v/1000).toFixed(1)+' s'}));
}

function buildAccessController(el){
  // Renamed from "Use a controller". Buttons do actions now with the pointer
  // switched off, so the old name would be a lie about what turning it off does.
  el.appendChild(makeToggle('Stick moves a pointer','padOn',()=>{ padReleaseAll(); buildSetupPanel(); }));
  if(!SETTINGS.padOn){
    accessHint(el,'The buttons still do their jobs on Buttons — the pointer is a separate thing.');
    return;
  }

  // Two chips, not two buttons. The state really is a two-way choice - any
  // button, or one particular one - and a chip group is what this framework uses
  // for a two-way choice everywhere else. It also SHOWS the learned button
  // instead of narrating it in a sentence underneath.
  accessCtlh(el,'Which button plays');
  const chips=document.createElement('div'); chips.className='chips';

  const anyChip=document.createElement('div');
  anyChip.className='chip'+(SETTINGS.padButton==null&&!padLearnCb?' active':'');
  anyChip.textContent='Any button';
  anyChip.addEventListener('click',e=>{ e.stopPropagation(); getAudio();
    padLearnCb=null; SETTINGS.padButton=null; saveSettings(); buildSetupPanel(); });

  const oneChip=document.createElement('div');
  oneChip.className='chip'+(padLearnCb?' listening':(SETTINGS.padButton!=null?' active':''));
  // The learned value stays an INDEX - stable, and what the API actually gives
  // us. Only the display becomes a name.
  oneChip.textContent = padLearnCb ? 'Press it now…'
                      : (SETTINGS.padButton!=null ? padBtnLabel(SETTINGS.padButton)
                                                  : 'Just one switch…');
  oneChip.addEventListener('click',e=>{ e.stopPropagation(); getAudio();
    bindLearnFor=null;
    padLearnCb = idx=>{
      // One physical button, one job: taking one that already has an action on
      // Buttons removes it from there rather than making it do both.
      const held=bindFind('pad',idx); if(held) clearBind(held);
      SETTINGS.padButton=idx; saveSettings(); buildSetupPanel();
    };
    buildSetupPanel();
  });

  chips.appendChild(anyChip); chips.appendChild(oneChip); el.appendChild(chips);

  // Load-bearing. A button given a job on Buttons stops playing, and without
  // this line nobody knows why X went quiet. Only said when "Any button" is the
  // claim being qualified — with one chosen play button there is nothing to
  // except, because only that button was playing anyway.
  const bnd=padBoundButtons();
  if(SETTINGS.padButton==null && bnd.length){
    accessHint(el,'All except ' + listWords(bnd.map(padBtnLabel)) + ', which '
      + (bnd.length>1?'have jobs':'has a job') + ' on Buttons.');
  }

  // Says the effect, not the mechanism, and uses the same verb as the row above.
  el.appendChild(makeToggle('Pushing the stick plays','padAuto',buildSetupPanel));
  accessHint(el, SETTINGS.padAuto
    ? 'The note sounds the whole time the stick is pushed. Raise "Ignore small movements" if a resting hand keeps it sounding.'
    : 'For a student who cannot press a button: pushing the stick plays, letting go stops.');

  // Numbers a therapist can act on. 0.60 and 0.25 are the code's units leaking
  // into a pane; Menu size already shows "100%" for the same reason.
  const SPEEDS=[[0.3,'Very slow'],[0.5,'Slow'],[0.8,'Medium'],[1.1,'Fast']];
  el.appendChild(makeSlider({key:'padSpeed',label:'Pointer speed',min:0.15,max:1.5,step:0.05,dp:2,
    fmt:v=>{ for(const [t,n] of SPEEDS) if(v<t) return n; return 'Very fast'; }}));
  el.appendChild(makeSlider({key:'padDead',label:'Ignore small movements',min:0,max:0.6,step:0.05,dp:2,
    fmt:v=>v<0.025?'Off':Math.round(v*100)+'%'}));

  buildDwell(el,'pad');
}

// This tab exists mostly to SAY THE MOUSE WORKS: that opening line is most of
// its value. Movement and clicking have worked since the framework was written -
// mousedown/mousemove is what the input layer takes - but nothing said so.
function buildAccessMouse(el){
  accessHint(el,'A mouse, head-pointer or eye-gaze already moves and clicks here. Nothing to switch on.');
  buildDwell(el,'mouse');
  // The ring is what shows the dwell countdown filling, so once mouse dwell is
  // on the ring is not optional. A toggle sitting switched off beside a ring
  // plainly on screen is the same lie as a toggle that does nothing.
  if(SETTINGS.dwellMouse){
    accessCtlh(el,'Big pointer');
    accessHint(el,'On while Dwell is — the ring is what shows the countdown filling.');
  } else {
    el.appendChild(makeToggle('Big pointer','bigPointer'));
    accessHint(el,'A large high-contrast ring instead of the small arrow, for a screen across the room.');
  }
}

// One row per rail button this app has. The actions are not invented here - they
// are what is already on the rail, which is why no app has to cooperate.
function buildAccessButtons(el){
  accessHint(el, bindLearnFor
    ? 'Press a key or a controller button.'
    : 'A key or a controller button for each. A button used here stops playing notes.');

  railActions().forEach(desc=>{
    const row=document.createElement('div'); row.className='toggle keyrow';
    const lab=document.createElement('label'); lab.textContent=railActionName(desc);
    row.appendChild(lab);

    const chips=document.createElement('div'); chips.className='chips';
    const b=bindOf(desc.id), listening = bindLearnFor===desc.id;
    const c=document.createElement('div');
    c.className='chip'+(listening?' listening':(b?' active':''));
    c.textContent = listening ? 'Press a key or button…' : (b ? bindChipLabel(b) : 'Set');
    c.addEventListener('click',ev=>{ ev.stopPropagation(); getAudio();
      // Whichever arrives first - a key or a controller button - wins the row.
      bindLearnFor = listening ? null : desc.id; padLearnCb=null; buildSetupPanel(); });
    chips.appendChild(c);

    if(b && !listening){
      const x=document.createElement('div'); x.className='chip xchip'; x.textContent='✕';
      x.title='Remove this key or button';
      x.addEventListener('click',ev=>{ ev.stopPropagation(); getAudio();
        clearBind(desc.id); buildSetupPanel(); });
      chips.appendChild(x);
    }
    row.appendChild(chips); el.appendChild(row);
  });
}

// Which tabs this app and this browser actually have. Controller appears
// whenever the browser HAS the Gamepad API, not only when something is plugged
// in: a therapist sets a student up before the controller is on the table.
function accessTabs(){
  const t=[];
  if(padsSupported()) t.push(['controller','Controller']);
  t.push(['mouse','Mouse']);
  if(railActions().length) t.push(['buttons','Buttons']);
  return t;
}
function buildAccess(el){
  const tabs=accessTabs();
  if(!tabs.length) return;

  // The live line goes FIRST and OUTSIDE the tabs, and shows whether or not
  // anything is switched on: a therapist confirms the controller is seen before
  // turning anything on, and watches the button name as each switch is pressed.
  // Nothing in software can know which switch is in which XAC port; this is how
  // a person finds out.
  if(padsSupported()){
    const st=document.createElement('div'); st.id='padStatus'; st.className='hint padstat';
    st.textContent=padStatusLine(); el.appendChild(st);
    padStatusWas=st.textContent;
  }

  if(!tabs.some(t=>t[0]===accessTab)) accessTab=tabs[0][0];
  const cw=document.createElement('div'); cw.className='chips tabs';
  tabs.forEach(([k,lab])=>{
    const c=document.createElement('div'); c.className='chip'+(accessTab===k?' active':'');
    c.textContent=lab;
    c.addEventListener('click',e=>{ e.stopPropagation(); getAudio();
      // Leaving a tab abandons whatever it was listening for. Switching the view
      // must never be the thing that binds a key.
      accessTab=k; bindLearnFor=null; padLearnCb=null; buildSetupPanel(); });
    cw.appendChild(c);
  });
  el.appendChild(cw);

  const panel=document.createElement('div'); panel.className='tabpanel'; el.appendChild(panel);
  if(accessTab==='controller')   buildAccessController(panel);
  else if(accessTab==='buttons') buildAccessButtons(panel);
  else                           buildAccessMouse(panel);
}
function buildSetupPanel(){
  const el=document.getElementById('setupContent'); el.innerHTML='';

  // ── Pane order, and why ───────────────────────────────────────────────────
  // Mostly by WHO OWNS the setting: Access is the STUDENT's and rides in a
  // preset; Menu size is this DISPLAY's and never does; Performance and Show
  // performance are the developer's. So: student, display, machine.
  //
  // Fullscreen breaks that on purpose and goes FIRST. It groups with Menu size
  // by ownership - both answer "what is this screen like" - and that is how it
  // used to be ordered. But it is reached for often when a machine is being set
  // up (the user's report from the room, 2026-08-30), and burying a control that
  // gets used to keep a grouping tidy is the wrong trade. The pane opens on its
  // first control, so the thing most likely to be wanted is the thing in view.
  //
  // "Start over" is gone from this pane entirely. Defaults IS a preset, so it
  // lives in the preset list as ↺ Defaults — see applyDefaults().
  //
  // The hint ELEMENTS stay, deliberately: each carried a FAILURE message as well
  // as an explanation, and only the explanations were asked for. Menu size still
  // has to say when the size asked for does not fit this screen, or the slider
  // looks broken; Fullscreen still has to say when the browser refused, or the
  // switch looks dead. Silent in the ordinary case, speaking only when something
  // is wrong. `uiScale` and the `ui-scale` key are unchanged — this is a label.

  // ── Fullscreen ────────────────────────────────────────────────────────────
  // The switch renders fsActive(), never the stored key, so Esc and F11 simply
  // show up here as the toggle already being off. PHASE-4F-FULLSCREEN.md S5.
  const fsHint=document.createElement('div'); fsHint.className='hint';
  // Declared before the row that closes over it: the call inside done() is
  // asynchronous today, and a later hand making it synchronous would otherwise
  // hit the temporal dead zone.
  const setFsHint=()=>{
    fsHint.textContent = fsSupported()
      ? ''
      : 'This browser would not allow fullscreen. F11 does the same thing.';
    fsHint.style.display = fsHint.textContent ? '' : 'none';
  };
  const fsRow=makeToggleRaw('Fullscreen',fsActive(),sw=>{
    if(!fsSupported()){
      sw.classList.remove('on');
      fsHint.textContent='This browser would not allow fullscreen. F11 does the same thing.';
      fsHint.style.display='';
      return;
    }
    const want=!fsActive();
    const done=()=>{ sw.classList.toggle('on',fsActive()); writeFullscreenPref(fsActive()); setFsHint(); };
    (want?enterFullscreen():exitFullscreen()).then(done).catch(()=>{
      sw.classList.remove('on'); writeFullscreenPref(false);
      fsHint.textContent='This browser would not allow fullscreen. F11 does the same thing.';
      fsHint.style.display='';
    });
  });
  setFsHint();
  el.appendChild(fsRow);
  el.appendChild(fsHint);

  // ── Access ────────────────────────────────────────────────────────────────
  // The student's, not the machine's, which is why it is not in "This screen"
  // or "This computer". Phase 2's switch access was designed to land here before
  // it was dropped — see IMPROVEMENT-PLAN Phase 2. Mirrors Anim.soundExtras: the
  // app supplies the controls, the framework the heading, so the section reads
  // the same in every app that has one.
  if(accessTabs().length || Anim.setupExtras){
    const ha=document.createElement('div'); ha.className='sectn'; ha.textContent='Access'; el.appendChild(ha);
    buildAccess(el);
    // OUTSIDE the tabs, deliberately: an app's own access setting belongs to
    // that app, not to one of the three devices the tabs name.
    if(Anim.setupExtras) Anim.setupExtras(el);
  }

  // ── Reach area ────────────────────────────────────────────────────────────
  // Its own section rather than a fourth Access tab: those three tabs name a
  // DEVICE a student uses, and this is about their arm and the room. It sits
  // with Access all the same, because it is the student's and rides in a preset
  // - the pane's order is student, then display, then machine.
  const rh=document.createElement('div'); rh.className='sectn'; rh.textContent='Reach area'; el.appendChild(rh);
  accessHint(el,'Shrink the activity and put it where the student can get to it. Nothing is cut off — the whole activity is still there, just smaller.');
  el.appendChild(makeSlider({key:'reachSize',label:'Size',min:REACH_MIN,max:1,step:0.05,
    fmt:v=>Math.round(v*100)+'%'}));
  // Off whenever the pane is rebuilt: the toggle renders placingOn(), which is
  // the truth, so closing the pane or loading a preset simply shows up here as
  // the switch already being off. Same shape as the Fullscreen switch.
  el.appendChild(makeToggleRaw('Place it',placingOn(),sw=>{
    const want=!placingOn(); setPlacing(want); sw.classList.toggle('on',want); }));
  accessHint(el,'While this is on, dragging the activity moves it and plays nothing. Turn it off to play again.');
  const fill=document.createElement('button'); fill.className='btn';
  fill.style.cssText='margin-top:10px;width:100%;text-align:center';
  // 🖥️ rather than the ⛶ this first carried: ⛶ (U+26F6) has no glyph in the
  // default Windows font stack and rendered as a tofu box on the bench.
  fill.textContent='🖥️ Fill the screen';
  // Always here, never behind Place it. This is the way back for whoever finds
  // the room set up small and in a corner and does not know how it got that way.
  fill.addEventListener('click',e=>{ e.stopPropagation();
    SETTINGS.reachSize=1; SETTINGS.reachX=0.5; SETTINGS.reachY=0.5;
    saveSettings(); pokeSim(); buildSetupPanel(); });
  el.appendChild(fill);

  // ── Menu size ─────────────────────────────────────────────────────────────
  const fmtScale=v=>Math.round(v*100)+'%';
  const hint=document.createElement('div'); hint.className='hint';
  // The readout shows what is ON SCREEN, which is not always what was asked for.
  // Saying so beats a slider that appears to have been ignored.
  const syncScale=()=>{
    scaleRow.querySelector('.val').textContent=fmtScale(uiScaleFit);
    hint.textContent = uiScaleFit < SETTINGS.uiScale - 0.001
      ? 'Bigger than ' + fmtScale(uiScaleFit) + ' does not fit on this screen — the buttons down the left would run off the bottom. Your ' + fmtScale(SETTINGS.uiScale) + ' is remembered for a larger screen.'
      : '';
    hint.style.display = hint.textContent ? '' : 'none';
  };
  const scaleRow=makeSlider({
    key:'uiScale', label:'Menu size', min:UI_SCALE_MIN, max:UI_SCALE_MAX, step:0.05,
    fmt:fmtScale,
    onChange(){ applyUiScale(); syncScale(); },
  });
  el.appendChild(scaleRow);
  el.appendChild(hint);
  syncScale();

  // ── This computer ─────────────────────────────────────────────────────────
  // Last, and deliberately: Performance and Show performance are a developer's
  // controls, not a therapist's.
  const h2=document.createElement('div'); h2.className='sectn'; h2.textContent='This computer'; el.appendChild(h2);
  el.appendChild(makeChips('Performance','quality',QUALITY,()=>{ if(SETTINGS.quality!=='auto') setPerf(SETTINGS.quality); }));
  el.appendChild(makeToggle('Show performance','showStats',applyStats));
}

// The whole setup as one link. Copied to the clipboard AND left on screen, since
// the machine the launcher is configured on is usually not the one the app is
// running on.
//
// The Start locked toggle rewrites the link live. The previous version of this
// hard-coded lock=1 and told you to delete it by hand for an unlocked link -
// hand-editing a URL inside room control configuration is where a typo survives
// until a student is sitting in front of it.
function showLaunchLink(host){
  let lock=true;
  host.innerHTML=''; host.style.display='';

  const row=document.createElement('div'); row.className='row';
  row.appendChild(makeToggleRaw('Start locked', lock, sw=>{
    lock=!lock; sw.classList.toggle('on',lock); render();
  }));
  host.appendChild(row);

  const note=document.createElement('div'); note.className='hint';
  const ta=document.createElement('textarea');
  ta.rows=4; ta.readOnly=true;
  ta.style.cssText='width:100%;margin-top:8px;background:var(--surface);'+
    'border:1px solid var(--line);border-radius:var(--radius);color:var(--ink);'+
    'padding:10px 12px;font:'+ 'var(--font-s)' +'/1.5 monospace;outline:none;resize:vertical';
  ta.addEventListener('click',e=>{ e.stopPropagation(); ta.select(); });

  function render(){
    const url=launchLink(lock), n=Object.keys(settingsDiff()).length;
    ta.value=url;
    note.textContent='This link opens the app with exactly this setup ('+n+' setting'+
      (n===1?'':'s')+' changed from normal)'+(lock?', locked ready to play':', unlocked')+
      '. It needs no saved preset — the setup travels in the link.';
    try{ navigator.clipboard.writeText(url).then(()=>{
      note.textContent='Copied to the clipboard. '+note.textContent; },()=>{}); }catch(e){}
    ta.select();
  }
  host.appendChild(note); host.appendChild(ta);
  render();
}

// Confirm on screen that a launch link was read, so a misconfigured launcher
// shows up immediately rather than looking like the app "just opened wrong".
// A warning stays up much longer, and is the one message worth interrupting a
// locked start for.
function announceLaunch(){
  if(!launchNote) return;
  const bad=launchNote.charAt(0)==='⚠';
  const hint=document.getElementById('lockHint');
  const show=()=>{ hint.textContent=launchNote; hint.classList.add('show');
    clearTimeout(hint._ht); hint._ht=setTimeout(()=>hint.classList.remove('show'), bad?9000:3000); };
  // When it opens locked, the unlock instruction is the more useful message, so
  // it gets the screen first and this follows it. A broken link still speaks -
  // it just waits its turn.
  if(SETTINGS.locked) setTimeout(show,5200); else show();
}

// ── Session lock: hide every control so a student can only paint & play ────────
function setLocked(v){
  const was=!!SETTINGS.locked, hint=document.getElementById('lockHint');
  // applyLock shows the hint when locking; unlocking shows a brief confirmation
  // so therapists know the 3 s hold worked and don't hold twice.
  if(v) hint.textContent='Controls locked — press and hold the top-left corner for 3 seconds to unlock';
  SETTINGS.locked=!!v; saveSettings(); applyLock();
  // After applyLock, never before it: locking must not depend on the browser
  // agreeing to go fullscreen. PHASE-4H-FULLSCREEN-ON-LOCK.md.
  if(v) lockTakeFullscreen(); else lockReleaseFullscreen();
  if(was&&!v){
    hint.textContent='🔓 Unlocked';
    hint.classList.add('show');
    clearTimeout(hint._ht); hint._ht=setTimeout(()=>hint.classList.remove('show'),1800);
  }
}
function applyLock(){
  const locked=!!SETTINGS.locked;
  // Collapsing the two columns hands their width back to the stage; the render
  // loop's sizeCanvas() picks the new width up on the next frame.
  shell.classList.toggle('locked',locked);
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
// Opening is a width change now, not a layer appearing over the art: the strip
// takes its width from the stage, and closing hands it back. Anim.resize follows
// on the next frame through sizeCanvas(), so nothing has to be notified.
// Closing the pane ends placing, always. The overlay swallows every touch on the
// activity, so an overlay left up after the control that switched it on has gone
// is an app that has silently stopped playing. applyLock() closes the panel, so
// locking is covered by this one line too.
function closePanel(){ setPlacing(false); strip.classList.remove('open'); document.querySelectorAll('.pane').forEach(p=>p.classList.remove('active')); }
const PANE_BUILDERS={app:buildAppPanel,instrument:buildInstrumentPanel,sound:buildSoundPanel,visuals:buildVisualsPanel,presets:buildPresetsPanel,setup:buildSetupPanel};
const PANE_IDS={app:'paneApp',instrument:'paneInstrument',sound:'paneSound',visuals:'paneVisuals',presets:'panePresets',setup:'paneSetup'};
function showPanel(name){
  const id=PANE_IDS[name]||'paneInstrument';
  document.querySelectorAll('.pane').forEach(p=>p.classList.toggle('active',p.id===id));
  strip.classList.add('open');
}
function updateBarButtons(){
  document.querySelectorAll('.bbar[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===currentQuickMode));
}

// ── Rail buttons: framework-level (mode toggle, lock) + animation-provided ───────
// Anim.railButtons: [{ id, icon():str, title():str, active():bool, show():bool, key:str, onClick() }]
const FRAME_RAIL=[
  { id:'mode',
    // Rendered as a segmented Keys|Flow block (both choices visible, active one
    // lit) — a lone toggle labelled with the current mode gave no hint that
    // pressing it switches. render/refresh descriptors bypass the plain-button
    // path in buildRailButtons/refreshRailButtons.
    render(){
      const seg=document.createElement('div'); seg.className='railseg';
      [['notes','🎹','Keys','Keys mode — note zones'],
       ['flow', '🌊','Flow','Flow mode — free play']].forEach(([m,ic,lb,ti])=>{
        const b=document.createElement('button'); b.className='segbtn'; b.dataset.mode=m; b.title=ti;
        b.innerHTML='<span class="bic"></span><span class="blb"></span>';
        b.querySelector('.bic').textContent=ic; b.querySelector('.blb').textContent=lb;
        b.addEventListener('click',e=>{ e.stopPropagation(); getAudio(); pokeSim();
          if(SETTINGS.mode===m) return;
          SETTINGS.mode=m; saveSettings(); buildScale(); buildBands();
          if(currentQuickMode==='instrument') buildInstrumentPanel();
          else if(currentQuickMode==='visuals') buildVisualsPanel();
          refreshRailButtons(); });
        seg.appendChild(b);
      });
      return seg;
    },
    refresh(seg){
      seg.querySelectorAll('.segbtn').forEach(b=>b.classList.toggle('active',b.dataset.mode===SETTINGS.mode));
    }},
  { id:'clear', icon:()=>'🧹', label:'Clear', title:()=>'Clear the painting',
    show:()=>paintMode()!=='off',   // nothing to clear when the mode isn't painting
    onClick(){ if(Anim.reset) Anim.reset(); }},
];
// 🔒 is not a FRAME_RAIL button: it is pinned to the rail bottom in the injected
// HTML so it sits in the same place in every app, after any app buttons.
document.getElementById('lockBtn').addEventListener('click',e=>{ e.stopPropagation(); setLocked(true); });
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
    if(desc.render){ const n=desc.render(); n.dataset.rail=desc.id; railExtra.appendChild(n); return; }
    const b=document.createElement('button');
    // app-provided buttons wear the app's accent ring; framework ones stay neutral
    b.className='railbtn'+(FRAME_RAIL.includes(desc)?'':' app');
    b.dataset.rail=desc.id;
    b.innerHTML='<span class="bic"></span><span class="blb"></span>';
    b.addEventListener('click',e=>{ e.stopPropagation(); getAudio(); pokeSim(); desc.onClick(); refreshRailButtons(); });
    railExtra.appendChild(b);
  });
  refreshRailButtons();
}
function refreshRailButtons(){
  allRailButtons().forEach(desc=>{
    const b=railExtra.querySelector('[data-rail="'+desc.id+'"]'); if(!b) return;
    if(desc.refresh){ desc.refresh(b); if(desc.show) b.style.display=desc.show()?'':'none'; return; }
    if(desc.icon)   b.querySelector('.bic').textContent=desc.icon();
    const lb=b.querySelector('.blb');
    const L=desc.label ? (typeof desc.label==='function'?desc.label():desc.label) : '';
    lb.textContent=L; lb.style.display=L?'':'none';
    if(desc.title)  b.title=desc.title();
    if(desc.active) b.classList.toggle('active',!!desc.active());
    if(desc.show)   b.style.display = desc.show() ? '' : 'none';
  });
}
// ── Named actions, from a key OR a controller button ─────────────────────────
// A key says WHEN, never WHERE, so it cannot play an activity - that is the
// gamepad's job. What it carries is meaning, and every app's named actions are
// already sitting on its rail. So a binding points at a rail button id and
// nothing has to be invented or declared by any app. PHASE-5B-HUB-KEYS.md, and
// PHASE-5C-ACCESS-PANE.md §4 for the controller half.
//
// SETTINGS.bind = { '<railId>': {type:'key'|'pad', code:'<key>'|<index>} }
// One action, one trigger, and one physical trigger has exactly one job: taking
// a key or button that is already in use MOVES it rather than doubling it up.
function railActions(){ return allRailButtons().filter(d=>typeof d.onClick==='function'); }
// label, then title, then the id. Several rail buttons carry only a title -
// life's play button is icon + title - and "Play" reads better than "play".
// The trailing hint a title may carry ("Play (Space)") is dropped: the trigger
// is shown in the chip beside it, so saying it twice is noise.
function railActionName(desc){
  const val=f=>typeof f==='function'?f():f;
  return String(val(desc.label) || val(desc.title) || desc.id)
    .replace(/\s*\([^)]*\)\s*$/,'').trim();
}
function bindOf(id){ const b=SETTINGS.bind; return (b && b[id]) || null; }
function bindFind(type,code){
  const b=SETTINGS.bind||{};
  return Object.keys(b).find(k=>b[k] && b[k].type===type && b[k].code===code) || null;
}
// Every pad button named on the Controller tab's "All except…" line, and the set
// pollPads must NOT let play a note.
function padBoundButtons(){
  const b=SETTINGS.bind||{}; const out=[];
  for(const k of Object.keys(b)) if(b[k] && b[k].type==='pad') out.push(b[k].code);
  return out;
}
function setBind(id,type,code){
  const b = SETTINGS.bind || (SETTINGS.bind={});
  const held = bindFind(type,code); if(held) delete b[held];
  // The play button is a job too. Giving X an action when X was also the one
  // button that plays would leave a student with a button that does both.
  if(type==='pad' && SETTINGS.padButton===code) SETTINGS.padButton=null;
  b[id]={type,code};
  saveSettings();
}
function clearBind(id){ const b=SETTINGS.bind; if(b) delete b[id]; saveSettings(); }
// X clears, Y does the app's main action - the user's pick from four options,
// so a controller does something useful before anybody opens Setup. Only where
// the app HAS that action, and found by the name already on the rail rather
// than by anything the 17 apps have to declare.
const PAD_X=2, PAD_Y=3;
function seedBind(){
  const acts=railActions(), out={};
  if(acts.some(d=>d.id==='clear')) out.clear={type:'pad',code:PAD_X};
  const main=acts.find(d=>/^(play|pause|restart)$/i.test(railActionName(d)));
  if(main) out[main.id]={type:'pad',code:PAD_Y};
  return out;
}
// Runs on load AND on every preset load and reset, because each of those can
// hand us a 5b-shaped blob or no bind at all. An id this app does not have stays
// in the map and is simply inert - which is what a Drums preset looks like when
// it is loaded in Flock, and is why it is not deleted.
function migrateBind(){
  if(!SETTINGS.bind || typeof SETTINGS.bind!=='object') SETTINGS.bind = seedBind();
  const km = SETTINGS.keyMap;
  if(km && typeof km==='object'){
    for(const k of Object.keys(km)){
      const id=km[k]; if(!id) continue;
      const held=bindFind('key',k); if(held) delete SETTINGS.bind[held];
      SETTINGS.bind[id]={type:'key',code:k};   // a 5b binding was set on purpose: it wins over the seed
    }
    delete SETTINGS.keyMap;
  }
}
function keyLabel(k){
  if(k===' ') return 'Space';
  const named={ArrowLeft:'\u2190',ArrowRight:'\u2192',ArrowUp:'\u2191',ArrowDown:'\u2193',
    Enter:'Enter',Escape:'Esc',Tab:'Tab',Backspace:'Backspace'};
  if(named[k]) return named[k];
  return k && k.length===1 ? k.toUpperCase() : k;
}
// A Hub button can be mapped to a MACRO, which sends several keystrokes faster
// than a hand could. One intent should be one action: short enough not to swallow
// a deliberate double-press, long enough to absorb a burst.
const KEY_GUARD_MS = 250;
const keyLastFire = {};
// The rail id a Buttons row is waiting on, or null. ONE listener for both kinds:
// whichever arrives first - a key or a controller button - wins the row.
let bindLearnFor = null;

function railButtonById(id){ return allRailButtons().find(d=>d.id===id); }

// Everything a binding fires goes through here, so a key and a controller button
// are the same event by the time an action sees them.
//
// Deliberately NOT gated on the session lock. A locked session is exactly when
// the student is playing, and these are their own actions on their own device;
// lock exists to stop the chrome being touched, not to disarm the student.
function fireAction(desc){
  if(!desc) return false;        // an id this app does not have is simply inert
  const now = Date.now();
  if(now - (keyLastFire[desc.id]||0) < KEY_GUARD_MS) return true;
  keyLastFire[desc.id] = now;
  getAudio(); desc.onClick(); refreshRailButtons();
  return true;
}

window.addEventListener('keydown',e=>{
  // A key held down repeats at the OS's rate. A held switch is one press.
  if(e.repeat) return;

  // Fire UNLESS the target genuinely wants text. The old rule was the other way
  // round - only when the target was the body - which meant a caret left in the
  // preset-name box turned the student's next Hub press into a typed letter.
  const t=e.target;
  if(t && (t.tagName==='INPUT' || t.tagName==='TEXTAREA' || t.isContentEditable)) return;

  if(bindLearnFor){ e.preventDefault();
    const id=bindLearnFor; bindLearnFor=null; setBind(id,'key',e.key); buildSetupPanel(); return; }

  // The therapist's binding wins over a rail button's own default `key`: it was
  // set deliberately, and the default is only a default.
  const id = bindFind('key', e.key);
  let desc = id ? railButtonById(id) : null;
  if(!desc) desc = allRailButtons().find(d=>d.key && d.key===e.key);
  if(!desc) return;

  e.preventDefault(); fireAction(desc);
});
function showQuickMode(mode){
  if(currentQuickMode===mode){ currentQuickMode=null; closePanel(); updateBarButtons(); return; }
  currentQuickMode=mode; updateBarButtons(); closePanel();
  if(PANE_BUILDERS[mode]){ PANE_BUILDERS[mode](); showPanel(mode); }
}

document.querySelectorAll('.bbar[data-mode]').forEach(btn=>{
  btn.addEventListener('click',e=>{ e.stopPropagation(); getAudio(); showQuickMode(btn.dataset.mode); });
});
strip.addEventListener('mousedown',e=>e.stopPropagation());
strip.addEventListener('touchstart',e=>e.stopPropagation(),{passive:false});

// ── Lifecycle / render loop ──────────────────────────────────────────────────────
let glLost=false, lastTime=Date.now(), fpsAccum=0, fpsFrames=0;
// The sim sleeps 12 s after the last touch or visual change (the last frame stays
// on screen) instead of simulating an unchanging field forever — the page runs all
// day in the sensory room and the constant GPU/CPU load cooks laptops.
let simWakeUntil=Date.now()+12000;
function pokeSim(){ simWakeUntil=Date.now()+12000; }
// The activity is never re-laid-out to fit the chrome - it is scaled to fit.
// Resizing the canvas is expensive in a way that has nothing to do with
// performance: six apps clear and re-seed themselves in Anim.resize, so every
// settings visit and every lock would wipe what a student had painted. Scaling
// changes no layout at all, so nothing has to be notified and nothing is lost,
// and the whole activity stays visible instead of hiding behind the strip.
//
// The surface is 100vw x 100vh, so k is 1 when the chrome is collapsed and the
// reach area is 100%: a locked session - the one a student sees - is then
// pixel-perfect, not a scaled image. Anything the chrome takes shows up as a
// smaller, centred activity.
//
// The REACH AREA is the deliberate exception to that, and the only thing
// allowed to scale a locked session: a smaller activity a student can reach
// beats a crisper one they cannot. It is the same three numbers, answered
// differently - reachSize scales k, and reachX/reachY place the centre instead
// of centring it. At 1, 0.5, 0.5 the arithmetic below is identical to the
// (r.width-w*k)/2 it replaces, so an install that never touches the feature
// produces the same transform string and nothing re-renders.
// See PHASE-7-REACH-AREA.md.

// ── Place it: dragging the activity to where the student can reach ────────────
// The therapist is looking at a wall, not at a laptop, so the position is set by
// dragging the thing itself. Three number fields would be simple to build and
// impossible to aim.
//
// The drag is taken by an OVERLAY over the slot, never by the canvas, and that
// one decision settles three problems at once:
//
//   * no note can sound while placing. The framework's pointer path is never
//     entered, rather than entered and then suppressed - there is no half-state
//     for onUp to miss and nothing to get stuck down.
//   * the drag arrives in SLOT pixels, the space fitSurface() already works in,
//     so a delta is dx/r.width and there is no inverse transform anywhere.
//   * fitSurface() keeps running during the drag, so the activity follows the
//     finger live. It bails while pointers.length is non-zero - the rule that
//     stops a re-scale under a student's hand mid-note - and a place drag
//     registers no framework pointer at all. Safe for the reason that rule
//     exists: there is no note to move out from under.
//
// Place mode is NOT a setting. It is where the therapist is, not something about
// the student, so it never rides in a preset - the same rule as accessTab.
let placeOv=null, placeRect=null;
function placingOn(){ return !!placeOv; }
function setPlacing(on){
  if(!on){
    if(placeOv) placeOv.remove();
    placeOv=placeRect=null;
    return;
  }
  if(placeOv) return;
  placeOv=document.createElement('div'); placeOv.id='placeOv';
  placeRect=document.createElement('div'); placeRect.id='placeRect';
  const tip=document.createElement('div'); tip.id='placeTip';
  tip.textContent='Drag the activity to where the student can reach';
  placeOv.appendChild(placeRect); placeOv.appendChild(tip);
  stageSlot.appendChild(placeOv);
  // lastFit is a cache of the transform STRING, and nothing about the transform
  // changed when the overlay appeared - so without this the outline would sit at
  // 0,0 until the therapist moved something.
  lastFit='';

  let drag=null;
  const at=e=>{ const t=e.touches&&e.touches[0]; return t?[t.clientX,t.clientY]:[e.clientX,e.clientY]; };
  const down=e=>{ e.preventDefault();
    const r=stageSlot.getBoundingClientRect(); const p=at(e);
    drag={ x:p[0], y:p[1], w:r.width, h:r.height };
    placeOv.classList.add('dragging'); };
  const move=e=>{ if(!drag) return; e.preventDefault();
    const p=at(e);
    SETTINGS.reachX=Math.max(0,Math.min(1,SETTINGS.reachX+(p[0]-drag.x)/drag.w));
    SETTINGS.reachY=Math.max(0,Math.min(1,SETTINGS.reachY+(p[1]-drag.y)/drag.h));
    drag.x=p[0]; drag.y=p[1];
    // The next frame's fitSurface() moves both the activity and the outline.
    pokeSim(); };
  // Saved on release, not on every sample: a drag is one change, and writing
  // localStorage sixty times a second to record the same gesture is waste.
  const up=()=>{ if(!drag) return; drag=null;
    placeOv.classList.remove('dragging'); saveSettings(); };
  placeOv.addEventListener('mousedown',down);
  placeOv.addEventListener('mousemove',move);
  placeOv.addEventListener('mouseup',up);
  placeOv.addEventListener('mouseleave',up);
  placeOv.addEventListener('touchstart',down,{passive:false});
  placeOv.addEventListener('touchmove',move,{passive:false});
  placeOv.addEventListener('touchend',up);
  placeOv.addEventListener('touchcancel',up);
}
let lastFit='', lastReached=null;
function fitSurface(){
  // Never re-scale under a hand. The coordinates behind the activity do not
  // change when it is scaled, but its position on screen does - so a finger
  // that has not moved ends up over a different part of the activity, and the
  // next move event reads as having crossed into it and plays a second note.
  // Anything that changes the chrome mid-touch would do it: the rail icon
  // being tapped with the other hand, Control size, Lock. Deferring to the
  // frame after the last finger lifts covers all of them at once.
  if(pointers.length) return;
  const r=stageSlot.getBoundingClientRect();
  const w=stageEl.offsetWidth, h=stageEl.offsetHeight;
  if(!w||!h||!r.width||!r.height) return;
  // Clamped on read: a value that arrived from a hand-edited blob or a launch
  // link is honoured as far as the floor and no further.
  const s=Math.max(REACH_MIN,Math.min(1,isFinite(+SETTINGS.reachSize)?+SETTINGS.reachSize:1));
  const cx=Math.max(0,Math.min(1,isFinite(+SETTINGS.reachX)?+SETTINGS.reachX:0.5));
  const cy=Math.max(0,Math.min(1,isFinite(+SETTINGS.reachY)?+SETTINGS.reachY:0.5));
  // The surround is BLACK under a reach area and the app's own step otherwise
  // (see applyBg). Driven from here, not from the controls that change the
  // setting, because this is the one function that already reads reachSize -
  // and a stale surround is exactly the kind of silent wrongness a call site
  // somebody forgets to add would produce. Starts null, so the first frame
  // syncs it whatever order boot ran in; fires once per crossing, not per frame.
  const reached = s < 0.9995;
  if(reached !== lastReached){ lastReached=reached; applyBg(); }
  const k=Math.min(r.width/w, r.height/h)*s;
  const aw=w*k, ah=h*k;
  // Clamped every frame rather than once when it is set, so it is still true
  // after a resolution change, a rotation, or the chrome opening.
  const tx=Math.max(0,Math.min(r.width-aw,  cx*r.width -aw/2));
  const ty=Math.max(0,Math.min(r.height-ah, cy*r.height-ah/2));
  const t='translate('+tx.toFixed(2)+'px,'+ty.toFixed(2)+'px) scale('+k.toFixed(5)+')';
  if(t===lastFit) return;
  lastFit=t; stageEl.style.transform=t;
  // The outline is drawn on the SLOT, not on the surface: inside the surface it
  // would be scaled with everything else, and at 30% a 2px dash is half a pixel.
  if(placeRect){ placeRect.style.left=tx+'px'; placeRect.style.top=ty+'px';
    placeRect.style.width=aw+'px'; placeRect.style.height=ah+'px'; }
}

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
  // Both bail on a cached value unless the geometry actually moved.
  fitSurface();
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
      // The initial splat is onDown's job now (PHASE-4I) - a press that never
      // survived to a frame used to lose it, and a synthesised press could not
      // reach an app that had worked around that with its own DOM listener.
      // What is left here is movement, unchanged.
      if(pm!=='off' && dist>0.00001){
        const steps=Math.min(Math.max(1,Math.ceil(dist/0.012)),cap);
        const vs=(subtle?SUBTLE_PAINT.vel:1)/steps;
        for(let i=1;i<=steps;i++){ const t=i/steps; Anim.splat(p.px+mdx*t,p.py+mdy*t,p.dx,p.dy,p.color,Object.assign({velScale:vs},subtle)); }
      }
      p.px=p.x; p.py=p.y; p.dx*=0.85; p.dy*=0.85;
    }
  }
  // Outside the simAwake guard on purpose: a student picking the stick up
  // after the 12 s sleep has to be able to wake it.
  pollPads(dt);
  pollMouseDwell(dt);
  if(simAwake) Anim.frame(dt);   // asleep: the last rendered frame stays on screen
  requestAnimationFrame(loop);
}
function boot(){
  initSettings();
  armFullscreenReapply();
  buildScale();
  buildBands();
  buildRailButtons();
  // The app tab exists only for apps that define Anim.buildApp. REMOVED, not
  // hidden: a hidden tab still costs a rail tier through fitUiScale(), which is
  // the whole reason six apps stay at five tabs. hideRail:['app'] suppresses it
  // even when the hook is defined — belt and braces for an app that wants the
  // hook for something else.
  {
    const appBtn=document.getElementById('btnApp');
    const wanted=!!Anim.buildApp && !(Anim.hideRail||[]).includes('app');
    if(!wanted){ appBtn.remove(); }
    else{
      const raw=Anim.appLabel;
      if(!raw) console.warn('framework: Anim.buildApp is defined but Anim.appLabel is not — the tab will read "App". See PHASE-4E-APP-TAB.md.');
      const parts=String(raw||'🎛️ App').split(' ');
      if(parts.length>1){ appBtn.querySelector('.bic').textContent=parts[0];
        appBtn.querySelector('.blb').textContent=parts.slice(1).join(' '); }
      else appBtn.querySelector('.blb').textContent=parts[0];
    }
  }
  // Any tab named in hideRail is REMOVED, not hidden — a hidden tab still costs a
  // rail tier through fitUiScale(). Drums, Sampler and Voice Visuals have no
  // scale, root or register to set, so a Notes tab there would be an empty pane:
  // hideRail:['instrument'] drops it and they stay at five tiers.
  (Anim.hideRail||[]).forEach(k=>{
    if(!PANE_IDS[k]) return;                     // not a tab; buildRailButtons handles it
    const b=document.querySelector('.bbar[data-mode="'+k+'"]'); if(b) b.remove();
    const pane=document.getElementById(PANE_IDS[k]); if(pane) pane.remove();
  });
  // Apps can rename the menu tabs to match their concepts, e.g. {instrument:'🎵 Songs'}
  // paneLabels runs AFTER the block above, so paneLabels.app wins over appLabel
  // if an app sets both — see the lifecycle table in PHASE-4E-APP-TAB.md.
  if(Anim.paneLabels) for(const k in Anim.paneLabels){
    const b=document.querySelector('.bbar[data-mode="'+k+'"]'); if(!b) continue;
    // paneLabels values are '<emoji> <Name>' — split into the tab's icon + label
    const parts=String(Anim.paneLabels[k]).split(' ');
    if(parts.length>1){ b.querySelector('.bic').textContent=parts[0];
      b.querySelector('.blb').textContent=parts.slice(1).join(' '); }
    else b.querySelector('.blb').textContent=parts[0];
  }
  setTheme(currentTheme);
  applyBg();
  applyStats();
  applyLock();
  // After applyLock, so a launched-locked start shows the unlock instruction
  // first and the launch toast follows it. PHASE-6-LAUNCH-PARAMETERS.md.
  announceLaunch();
  // The rail's ceiling depends on the window height, so re-fit when it changes —
  // a projector switching resolution, or a window dragged to a smaller screen.
  window.addEventListener('resize',()=>{
    SETTINGS.uiScale=readUiScale();   // re-try the therapist's ASKED-FOR size
    applyUiScale();                   // ...which may fit now, or may step down again
    if(currentQuickMode==='setup') buildSetupPanel();
  });
  applyUiScale();   // the rail exists now, so the fit can actually be measured
  setupGL();
  canvas.addEventListener('webglcontextlost', e=>{ e.preventDefault(); glLost=true; }, false);
  canvas.addEventListener('webglcontextrestored', ()=>{ glLost=false; setupGL(); }, false);
  loop();
}
