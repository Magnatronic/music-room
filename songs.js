'use strict';
/* Shared song library for Song Grid, Big-Switch Songs, Echo Bird, and future apps.
   Movable-do: notes = [[columnIndex, beats], ...]; span = grid columns needed;
   column 0 is the starting note (do), so everything transposes with the
   framework's Starting note / Register / Scale controls. All public domain.

   Also home of the CUSTOM SONG system: therapists paste ABC notation (or a
   Boomwhacker-style letter line) into makeSongImportUI(); parseABC() converts
   it to the movable-do format above, and the result is stored in localStorage
   under ONE shared key so a song imported in any app appears in every app. */
window.MUSIC_SONGS = {
  twinkle: {label:'✨ Twinkle Twinkle', span:6, bpm:100, notes:[
    [0,1],[0,1],[4,1],[4,1],[5,1],[5,1],[4,2],[3,1],[3,1],[2,1],[2,1],[1,1],[1,1],[0,2],
    [4,1],[4,1],[3,1],[3,1],[2,1],[2,1],[1,2],[4,1],[4,1],[3,1],[3,1],[2,1],[2,1],[1,2],
    [0,1],[0,1],[4,1],[4,1],[5,1],[5,1],[4,2],[3,1],[3,1],[2,1],[2,1],[1,1],[1,1],[0,2]]},
  mary: {label:'🐑 Mary Had a Little Lamb', span:5, bpm:110, notes:[
    [2,1],[1,1],[0,1],[1,1],[2,1],[2,1],[2,2],[1,1],[1,1],[1,2],[2,1],[4,1],[4,2],
    [2,1],[1,1],[0,1],[1,1],[2,1],[2,1],[2,1],[2,1],[1,1],[1,1],[2,1],[1,1],[0,4]]},
  hotcross: {label:'🥐 Hot Cross Buns', span:3, bpm:100, notes:[
    [2,1],[1,1],[0,2],[2,1],[1,1],[0,2],
    [0,0.5],[0,0.5],[0,0.5],[0,0.5],[1,0.5],[1,0.5],[1,0.5],[1,0.5],[2,1],[1,1],[0,2]]},
  ode: {label:'🎻 Ode to Joy', span:5, bpm:110, notes:[
    [2,1],[2,1],[3,1],[4,1],[4,1],[3,1],[2,1],[1,1],[0,1],[0,1],[1,1],[2,1],[2,1.5],[1,0.5],[1,2],
    [2,1],[2,1],[3,1],[4,1],[4,1],[3,1],[2,1],[1,1],[0,1],[0,1],[1,1],[2,1],[1,1.5],[0,0.5],[0,2]]},
  row: {label:'🚣 Row Your Boat', span:8, bpm:84, notes:[
    [0,1],[0,1],[0,0.7],[1,0.3],[2,1],[2,0.7],[1,0.3],[2,0.7],[3,0.3],[4,2],
    [7,0.33],[7,0.33],[7,0.34],[4,0.33],[4,0.33],[4,0.34],
    [2,0.33],[2,0.33],[2,0.34],[0,0.33],[0,0.33],[0,0.34],
    [4,0.7],[3,0.3],[2,0.7],[1,0.3],[0,2]]},
  london: {label:'🌉 London Bridge', span:6, bpm:105, notes:[
    [4,1.5],[5,0.5],[4,1],[3,1],[2,1],[3,1],[4,2],[1,1],[2,1],[3,2],[2,1],[3,1],[4,2],
    [4,1.5],[5,0.5],[4,1],[3,1],[2,1],[3,1],[4,2],[1,2],[4,2],[2,1],[0,3]]},
};
// Phrase boundaries: a held note (>= 2 beats) ends a phrase — reliable for the
// built-in folk-song set. Imported songs sometimes have no held notes at all,
// which would make one giant phrase; those fall back to ~8-beat (two-bar) chunks.
// Used by Big-Switch's "each press plays a phrase" mode and Echo Bird's calls.
window.songPhrases = function(song){
  let phrases=[], cur=[];
  for(const n of song.notes){ cur.push(n); if(n[1]>=2){ phrases.push(cur); cur=[]; } }
  if(cur.length) phrases.push(cur);
  if(phrases.length<2 && song.notes.length>10){
    phrases=[]; cur=[]; let acc=0;
    for(const n of song.notes){ cur.push(n); acc+=n[1]; if(acc>=8){ phrases.push(cur); cur=[]; acc=0; } }
    if(cur.length) phrases.push(cur);
  }
  return phrases;
};

// ── Custom songs: shared storage ────────────────────────────────────────────────
// One key for the whole suite (not per-app like settings/presets): a song
// imported in Song Grid should appear in Big Switch and Echo Bird too.
const CUSTOM_SONGS_KEY='music-room:customSongs';
function loadCustomSongs(){ try{ return JSON.parse(localStorage.getItem(CUSTOM_SONGS_KEY)||'{}'); }catch(e){ return {}; } }
function storeCustomSongs(o){ try{ localStorage.setItem(CUSTOM_SONGS_KEY, JSON.stringify(o)); }catch(e){} }
function validSong(s){
  return s && typeof s.label==='string' && Array.isArray(s.notes) && s.notes.length &&
    s.notes.every(n=>Array.isArray(n)&&n.length===2&&n[0]>=0&&n[0]<8&&n[1]>0) &&
    s.span>=1 && s.span<=8 && s.bpm>=30 && s.bpm<=300;
}
(function mergeCustomSongs(){
  const c=loadCustomSongs();
  for(const k in c) if(validSong(c[k])) window.MUSIC_SONGS[k]=c[k];
})();

// ── ABC notation → movable-do ───────────────────────────────────────────────────
// parseABC(text) → { title, notes, span, bpm|null, scaleHint, adjusted, notices[] }
// or { error }. Supports the melody subset: T/K/L/Q headers; notes A-G with
// octave marks and durations; rests; ties; broken rhythm (> <); triplets; bar
// lines; chords (top-of-stack note wins); comments. Repeats play once. Notes
// outside the key's scale snap to the nearest degree (counted, never rejected).
window.parseABC = function(text){
  text=(text||'').replace(/\r/g,'').trim();
  if(!text) return {error:'Paste some notation first.'};
  const LETTER_PC={C:0,D:2,E:4,F:5,G:7,A:9,B:11};

  // Letter-sheet mode: "C C G G A A G2" — the format of Boomwhacker song sheets.
  // Detected when there is no K: header and every token is a bare note letter
  // with an optional #/b and an optional beat count. The last note is taken as
  // "do" (folk tunes overwhelmingly end on the tonic).
  if(!/^K:/m.test(text)){
    const toks=text.replace(/[|,]/g,' ').split(/\s+/).filter(Boolean);
    if(toks.length>1 && toks.every(t=>/^[A-Ga-g][#b♯♭]?\d*(\.\d+)?$/.test(t))){
      const items=toks.map(t=>{
        const m=t.match(/^([A-Ga-g])([#b♯♭])?(\d+(?:\.\d+)?)?$/);
        const acc=m[2]?((m[2]==='#'||m[2]==='♯')?1:-1):0;
        return {pc:((LETTER_PC[m[1].toUpperCase()]+acc)%12+12)%12, beats:m[3]?parseFloat(m[3]):1};
      });
      const tonic=items[items.length-1].pc, steps=[0,2,4,5,7,9,11];
      let adjusted=0;
      const notes=items.map(it=>{
        const off=((it.pc-tonic)%12+12)%12;
        let best=0,bd=99;
        for(let k=0;k<steps.length;k++){ const d=Math.abs(off-steps[k]); if(d<bd){bd=d;best=k;} }
        if(bd>0) adjusted++;
        return [best,it.beats];
      });
      return { title:'', notes, span:Math.max.apply(null,notes.map(n=>n[0]))+1,
        bpm:null, scaleHint:'major', adjusted,
        notices: adjusted?[adjusted+' note'+(adjusted>1?'s':'')+' adjusted to fit the scale']:[] };
    }
  }

  // Fields: standard ABC puts K: last in the header, but pasted tunes are often
  // sloppy, so T/L/Q field lines are honoured wherever they appear.
  let title='', keyStr='C', Lfrac=null, bpm=null;
  const lines=text.split('\n'); let body='';
  let inBody=false;
  for(let raw of lines){
    const line=raw.replace(/(^|[^\\])%.*$/,'$1');
    const m=line.match(/^([A-Za-z]):(.*)$/);
    if(m){
      const f=m[1].toUpperCase(), v=m[2].trim();
      if(f==='T'&&!title) title=v;
      else if(f==='L'){ const lm=v.match(/(\d+)\s*\/\s*(\d+)/); if(lm) Lfrac=(+lm[1])/(+lm[2]); }
      else if(f==='Q'){
        const qm=v.match(/(\d+)\s*\/\s*(\d+)\s*=\s*(\d+)/);
        if(qm) bpm=Math.round((+qm[3])*((+qm[1])/(+qm[2]))*4);   // normalise to quarter-note BPM
        else { const n=v.match(/(?:^|\s|=)(\d{2,3})(?:\s|$)/); if(n) bpm=+n[1]; }
      }
      else if(f==='K'&&!inBody){ keyStr=v; inBody=true; }
      continue;   // any other field line (W: lyrics, M:, X:, …) is skipped whole
    }
    if(!inBody && line.trim()==='') continue;
    if(line.trim()!=='') inBody=true;   // tune body (with no K: header — assume C)
    if(inBody) body+=line+'\n';
  }

  // Key → tonic pitch class, scale flavour, and key-signature accidentals.
  const km=keyStr.match(/^\s*([A-Ga-g])\s*([#♯b♭])?\s*(\w*)/)||[];
  const tonicLetter=(km[1]||'C').toUpperCase();
  const tonicAcc=km[2]?((km[2]==='#'||km[2]==='♯')?1:-1):0;
  const modeStr=(km[3]||'').toLowerCase();
  const minorish=/^(m$|min|aeo|dor|phr)/.test(modeStr);
  const MAJOR_FIFTHS={'C':0,'G':1,'D':2,'A':3,'E':4,'B':5,'F':-1};
  let fifths=(MAJOR_FIFTHS[tonicLetter]||0)+tonicAcc*7;
  if(/^(m$|min|aeo)/.test(modeStr)) fifths-=3;
  else if(/^dor/.test(modeStr)) fifths-=2;
  else if(/^mix/.test(modeStr)) fifths-=1;
  else if(/^phr/.test(modeStr)) fifths-=4;
  else if(/^lyd/.test(modeStr)) fifths+=1;
  const keySig={};
  const SHARP_ORDER='FCGDAEB', FLAT_ORDER='BEADGCF';
  if(fifths>0) for(let k=0;k<Math.min(fifths,7);k++) keySig[SHARP_ORDER[k]]=1;
  if(fifths<0) for(let k=0;k<Math.min(-fifths,7);k++) keySig[FLAT_ORDER[k]]=-1;
  const tonicPc=((LETTER_PC[tonicLetter]+tonicAcc)%12+12)%12;

  const unitBeats=(Lfrac||1/8)*4;   // our beat unit is a quarter note
  const raw=[];                      // {midi, beats}
  let barAcc={}, broken=0, tupN=0, tupF=1, tie=false;

  function readDur(s,i){
    let num=0,hasNum=false;
    while(i<s.length&&s[i]>='0'&&s[i]<='9'){ num=num*10+(+s[i]); i++; hasNum=true; }
    let mult=hasNum?num:1;
    if(s[i]==='/'){
      let sl=0; while(s[i]==='/'){ sl++; i++; }
      let den=0,hasDen=false;
      while(i<s.length&&s[i]>='0'&&s[i]<='9'){ den=den*10+(+s[i]); i++; hasDen=true; }
      mult=mult/(hasDen?den*Math.pow(2,sl-1):Math.pow(2,sl));
    }
    return {mult,i};
  }
  function pushNote(midi,mult){
    let b=unitBeats*mult;
    if(tupN>0){ b*=tupF; tupN--; }
    if(broken&&raw.length){
      if(broken>0){ raw[raw.length-1].beats*=1.5; b*=0.5; }
      else        { raw[raw.length-1].beats*=0.5; b*=1.5; }
    }
    broken=0;
    if(tie&&raw.length&&raw[raw.length-1].midi===midi) raw[raw.length-1].beats+=b;
    else raw.push({midi,beats:b});
    tie=false;
  }
  function accFrom(str){   // '^'|'^^'|'_'|'__'|'=' → semitone shift (null = none given)
    if(!str) return null;
    if(str[0]==='^') return str.length>1?2:1;
    if(str[0]==='_') return str.length>1?-2:-1;
    return 0;   // '=' natural
  }

  const s=body;
  let i=0;
  while(i<s.length){
    const ch=s[i];
    if(ch===' '||ch==='\t'||ch==='\n'||ch==='\\'||ch===')'||ch==='.'||ch==='~'||ch==='*'||ch==='$'||ch==='&'){ i++; continue; }
    if(ch==='|'){ barAcc={}; i++; continue; }
    if(ch===':'||ch===']'){ i++; continue; }
    if(ch==='{'){ const e=s.indexOf('}',i); i=(e<0?s.length:e+1); continue; }
    if(ch==='"'){ const e=s.indexOf('"',i+1); i=(e<0?s.length:e+1); continue; }
    if(ch==='!'){ const e=s.indexOf('!',i+1); i=(e<0?s.length:e+1); continue; }
    if(ch==='>'||ch==='<'){ broken=(ch==='>'?1:-1); while(s[i]===ch) i++; continue; }
    if(ch==='-'){ tie=true; i++; continue; }
    if(ch==='('){
      if(/\d/.test(s[i+1]||'')){
        const n=+s[i+1]; tupN=n; tupF=(n===2?1.5:n===3?2/3:n===4?0.75:2/n); i+=2;
        while(s[i]===':'||/\d/.test(s[i]||'')) i++;   // extended (p:q:r form — take p, skip the rest
        continue;
      }
      i++; continue;   // slur
    }
    if(ch==='['){
      if(/\d/.test(s[i+1]||'')){ i+=2; continue; }                       // volta bracket [1 [2
      if(/^[A-Za-z]:/.test(s.slice(i+1,i+3))){ const e=s.indexOf(']',i); i=(e<0?s.length:e+1); continue; }  // inline field
      const e=s.indexOf(']',i);                                          // chord [CEG] — keep first note
      if(e<0){ i++; continue; }
      const inner=s.slice(i+1,e);
      const cm=inner.match(/([_^=]{1,2})?([A-Ga-g])([,']*)(\d*\/{0,2}\d*)/);
      i=e+1;
      const outer=readDur(s,i); i=outer.i;
      if(cm){
        const upper=cm[2].toUpperCase();
        let oct=(cm[2]===upper)?4:5;
        for(const om of (cm[3]||'')) oct+=(om==="'"?1:-1);
        const explicit=accFrom(cm[1]);
        const key=upper+oct;
        let a; if(explicit!==null){ a=explicit; barAcc[key]=explicit; }
        else if(key in barAcc) a=barAcc[key]; else a=keySig[upper]||0;
        pushNote(12*(oct+1)+LETTER_PC[upper]+a, readDur(cm[4]||'',0).mult*outer.mult);
      }
      continue;
    }
    if(ch==='z'||ch==='x'||ch==='Z'||ch==='X'){
      i++; const d=readDur(s,i); i=d.i;
      const b=(ch==='Z'||ch==='X')?4*d.mult:unitBeats*d.mult;   // Z = whole-bar rest (≈4 beats)
      if(raw.length) raw[raw.length-1].beats+=b;                 // a rest extends the pause after the previous note
      continue;
    }
    let explicit=null;
    if(ch==='^'||ch==='_'||ch==='='){
      let j=i, str=ch; j++;
      if((ch==='^'||ch==='_')&&s[j]===ch){ str+=ch; j++; }
      explicit=accFrom(str); i=j;
    }
    const nc=s[i];
    if(/[A-Ga-g]/.test(nc||'')){
      const upper=nc.toUpperCase();
      let oct=(nc===upper)?4:5; i++;
      while(s[i]==="'"||s[i]===','){ oct+=(s[i]==="'"?1:-1); i++; }
      const d=readDur(s,i); i=d.i;
      const key=upper+oct;
      let a; if(explicit!==null){ a=explicit; barAcc[key]=explicit; }
      else if(key in barAcc) a=barAcc[key]; else a=keySig[upper]||0;
      pushNote(12*(oct+1)+LETTER_PC[upper]+a, d.mult);
      continue;
    }
    i++;   // decorations (uvTHLM…), unknown characters
  }

  if(!raw.length) return {error:'No notes found — check the notation.'};

  // Absolute pitches → scale degrees relative to the tonic (movable-do).
  const steps=minorish?[0,2,3,5,7,8,10]:[0,2,4,5,7,9,11];
  const anchor=60+tonicPc;   // any tonic octave works; degrees get octave-shifted below
  let adjusted=0;
  let degs=raw.map(n=>{
    const rel=n.midi-anchor;
    const oct=Math.floor(rel/12), off=rel-oct*12;
    let best=0,bd=99;
    for(let k=0;k<steps.length;k++){ const dd=Math.abs(off-steps[k]); if(dd<bd){bd=dd;best=k;} }
    if(Math.abs(off-12)<bd){ bd=Math.abs(off-12); best=steps.length; }   // closer to next-octave do
    if(bd>0) adjusted++;
    const deg=(best===steps.length)?(oct+1)*7:oct*7+best;
    return [deg, Math.round(n.beats*100)/100];
  });
  const minDeg=Math.min.apply(null,degs.map(d=>d[0]));
  const shift=-7*Math.floor(minDeg/7);   // whole-octave shift so the lowest note lands in row 0..6
  degs=degs.map(d=>[d[0]+shift,d[1]]);
  const span=Math.max.apply(null,degs.map(d=>d[0]))+1;
  if(span>8) return {error:'This melody spans '+span+' scale notes — the grid fits at most 8. Try a simpler arrangement.'};

  const notices=[];
  if(adjusted) notices.push(adjusted+' note'+(adjusted>1?'s':'')+' adjusted to fit the scale');
  if(/(\|:|:\|)/.test(body)) notices.push('repeats are played once');
  return { title, notes:degs, span, bpm, scaleHint:minorish?'minor':'major', adjusted, notices };
};

// ── Import UI: "Your songs" block for the therapist panel ───────────────────────
// Apps append makeSongImportUI(onLibraryChange) to their Songs pane. It lists
// the therapist's custom songs (with delete + share/export), and folds the
// paste-ABC import form behind a details toggle. onLibraryChange is called
// after any change so the app can rebuild its song chips.
window.makeSongImportUI = function(onLibraryChange){
  const wrap=document.createElement('div');
  const changed=()=>{ if(onLibraryChange) onLibraryChange(); };

  const sec=document.createElement('div'); sec.className='sectn'; sec.textContent='Your songs'; wrap.appendChild(sec);

  const customs=loadCustomSongs();
  const names=Object.keys(customs);
  if(!names.length){
    const none=document.createElement('div');
    none.style.cssText='color:rgba(255,255,255,0.4);font-size:13px;margin-bottom:6px';
    none.textContent='No custom songs yet — add one below.';
    wrap.appendChild(none);
  }
  names.forEach(key=>{
    const row=document.createElement('div'); row.className='prow';
    const nm=document.createElement('div'); nm.className='chip pname'; nm.textContent=customs[key].label;
    const del=document.createElement('button'); del.className='chip'; del.textContent='✕'; del.title='Delete this song';
    del.addEventListener('click',e=>{ e.stopPropagation();
      const all=loadCustomSongs(); delete all[key]; storeCustomSongs(all);
      delete window.MUSIC_SONGS[key];
      changed();
    });
    row.appendChild(nm); row.appendChild(del); wrap.appendChild(row);
  });

  const det=document.createElement('details');
  det.style.cssText='margin:8px 0';
  const sum=document.createElement('summary');
  sum.textContent='➕ Add a song (paste ABC notation)';
  sum.style.cssText='cursor:pointer;color:rgba(255,255,255,0.85);font-size:14px;padding:6px 0';
  sum.addEventListener('click',e=>e.stopPropagation());
  det.appendChild(sum);

  const hint=document.createElement('div');
  hint.style.cssText='color:rgba(255,255,255,0.45);font-size:12px;line-height:1.5;margin:4px 0 8px';
  hint.textContent='Search the web for "(song name) abc notation" and paste it here. '+
    'Plain note letters work too, e.g. "C C G G A A G2" (last note = home note).';
  det.appendChild(hint);

  const ta=document.createElement('textarea');
  ta.placeholder='T:Twinkle Twinkle\nK:C\nL:1/4\nCC GG AA G2 | FF EE DD C2';
  ta.style.cssText='width:100%;min-height:110px;background:rgba(255,255,255,0.07);color:#fff;'+
    'border:1px solid rgba(255,255,255,0.18);border-radius:8px;padding:8px;'+
    'font-family:ui-monospace,Consolas,monospace;font-size:12px;resize:vertical;box-sizing:border-box';
  ta.addEventListener('mousedown',e=>e.stopPropagation());
  ta.addEventListener('touchstart',e=>e.stopPropagation());
  det.appendChild(ta);

  const nameInp=document.createElement('input');
  nameInp.type='text'; nameInp.maxLength=48; nameInp.placeholder='Song name (uses the T: title if blank)';
  det.appendChild(nameInp);

  const bpmRow=document.createElement('div');
  bpmRow.style.cssText='display:flex;align-items:center;gap:8px;margin-top:6px';
  const bpmLab=document.createElement('label');
  bpmLab.textContent='Tempo if none given (BPM)';
  bpmLab.style.cssText='color:rgba(255,255,255,0.6);font-size:13px';
  const bpmInp=document.createElement('input');
  bpmInp.type='number'; bpmInp.min=40; bpmInp.max=240; bpmInp.value=100;
  bpmInp.style.cssText='width:80px';
  bpmRow.appendChild(bpmLab); bpmRow.appendChild(bpmInp); det.appendChild(bpmRow);

  const addBtn=document.createElement('button'); addBtn.className='btn';
  addBtn.style.cssText='margin-top:8px;width:100%;text-align:center';
  addBtn.textContent='🎼 Add song';
  det.appendChild(addBtn);

  const msg=document.createElement('div');
  msg.style.cssText='font-size:13px;line-height:1.4;margin-top:6px;min-height:1em';
  det.appendChild(msg);

  addBtn.addEventListener('click',e=>{
    e.stopPropagation();
    const res=window.parseABC(ta.value);
    if(res.error){ msg.style.color='#ff9d9d'; msg.textContent=res.error; return; }
    const name=(nameInp.value.trim()||res.title||'My song').slice(0,48);
    const bpm=Math.max(40,Math.min(240,res.bpm||parseFloat(bpmInp.value)||100));
    const songObj={ label:'🎼 '+name, span:res.span, bpm, notes:res.notes };
    if(res.scaleHint==='minor') songObj.scaleHint='minor';
    if(!validSong(songObj)){ msg.style.color='#ff9d9d'; msg.textContent='That came out invalid — check the notation.'; return; }
    const key='c'+Date.now().toString(36);
    const all=loadCustomSongs(); all[key]=songObj; storeCustomSongs(all);
    window.MUSIC_SONGS[key]=songObj;
    SETTINGS.song=key; saveSettings();
    msg.style.color='#7dffb0';
    msg.textContent='✅ Added "'+name+'" ('+res.notes.length+' notes, '+bpm+' BPM'+
      (res.bpm?'':' — no tempo in the notation, edit above and re-add if needed')+')'+
      (res.notices.length?'. Note: '+res.notices.join('; ')+'.':'');
    changed();
  });
  wrap.appendChild(det);

  // Share between machines: export all custom songs / add from an exported file.
  const shareRow=document.createElement('div');
  shareRow.style.cssText='display:flex;gap:8px;margin-top:4px';
  if(names.length){
    const exp=document.createElement('button'); exp.className='chip'; exp.textContent='⬇ Save songs to file';
    exp.title='Download your songs as a file you can load on another machine';
    exp.addEventListener('click',e=>{ e.stopPropagation();
      const a=document.createElement('a');
      a.href='data:application/json;charset=utf-8,'+encodeURIComponent(JSON.stringify(loadCustomSongs(),null,1));
      a.download='music-room-songs.json'; a.click();
    });
    shareRow.appendChild(exp);
  }
  const impLab=document.createElement('label'); impLab.className='chip'; impLab.textContent='⬆ Load songs from file';
  impLab.style.cursor='pointer';
  const impInp=document.createElement('input'); impInp.type='file'; impInp.accept='.json,application/json';
  impInp.style.display='none';
  impInp.addEventListener('change',()=>{
    const f=impInp.files&&impInp.files[0]; if(!f) return;
    const rd=new FileReader();
    rd.onload=()=>{
      try{
        const data=JSON.parse(rd.result); const all=loadCustomSongs(); let n=0;
        for(const k in data) if(validSong(data[k])){
          const key=(k in all||k in window.MUSIC_SONGS)?'c'+Date.now().toString(36)+n:k;
          all[key]=data[k]; window.MUSIC_SONGS[key]=data[k]; n++;
        }
        storeCustomSongs(all);
        if(n) changed();
      }catch(err){}
    };
    rd.readAsText(f);
  });
  impLab.addEventListener('click',e=>e.stopPropagation());
  impLab.appendChild(impInp);
  shareRow.appendChild(impLab);
  wrap.appendChild(shareRow);

  return wrap;
};
