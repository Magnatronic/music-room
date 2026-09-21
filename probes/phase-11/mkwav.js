// Test signals for the Phase 11 probes. 48 kHz, 16-bit mono PCM — the format
// Chromium's --use-file-for-fake-audio-capture accepts.
const fs=require('fs'), SR=48000;
function wav(name,samples){
  const n=samples.length, b=Buffer.alloc(44+n*2);
  b.write('RIFF',0); b.writeUInt32LE(36+n*2,4); b.write('WAVE',8);
  b.write('fmt ',12); b.writeUInt32LE(16,16); b.writeUInt16LE(1,20); b.writeUInt16LE(1,22);
  b.writeUInt32LE(SR,24); b.writeUInt32LE(SR*2,28); b.writeUInt16LE(2,32); b.writeUInt16LE(16,34);
  b.write('data',36); b.writeUInt32LE(n*2,40);
  for(let i=0;i<n;i++) b.writeInt16LE(Math.max(-32767,Math.min(32767,Math.round(samples[i]*32767))),44+i*2);
  fs.writeFileSync('wav/'+name+'.wav',b);
  let s=0; for(const v of samples) s+=v*v;
  console.log(name.padEnd(16), (samples.length/SR).toFixed(1)+'s', (20*Math.log10(Math.sqrt(s/n)+1e-12)).toFixed(1)+' dBFS RMS');
}
function rng(s){let x=s>>>0;return()=>{x=(x*1664525+1013904223)>>>0;return x/4294967296;};}
// a glottal-ish voice: 20 harmonics, 1/n, through nothing. Loud enough to be well
// above any floor the app will measure.
function voice(f0,secs,rmsDb,seed=3,snr=Infinity){
  const n=Math.round(SR*secs), b=new Float32Array(n), r=rng(seed);
  const ph=[]; for(let h=1;h<=20;h++) ph.push(r()*Math.PI*2);
  for(let i=0;i<n;i++){ let s=0;
    for(let h=1;h<=20&&h*f0<SR/2;h++) s+=Math.sin(2*Math.PI*h*f0*i/SR+ph[h-1])/h;
    b[i]=s; }
  norm(b,rmsDb);
  if(isFinite(snr)){ const a=Math.pow(10,(rmsDb-snr)/20)*1.73;
    for(let i=0;i<n;i++) b[i]+=a*(r()*2-1); }
  return b;
}
function norm(b,rmsDb){ let s=0; for(const v of b) s+=v*v;
  const cur=Math.sqrt(s/b.length), want=Math.pow(10,rmsDb/20), k=want/(cur||1);
  for(let i=0;i<b.length;i++) b[i]*=k; return b; }
function noise(secs,rmsDb,seed,hp){ const n=Math.round(SR*secs), b=new Float32Array(n), r=rng(seed);
  let prev=0;
  for(let i=0;i<n;i++){ const w=r()*2-1; b[i]=hp?(w-prev):w; prev=w; }
  return norm(b,rmsDb); }
const sil=s=>new Float32Array(Math.round(SR*s));
const cat=(...xs)=>{ const n=xs.reduce((a,x)=>a+x.length,0), o=new Float32Array(n);
  let p=0; for(const x of xs){ o.set(x,p); p+=x.length; } return o; };

// every file starts with 1.5 s of quiet room so the floor can seed
const room=()=>noise(1.5,-58,99);
wav('silence',    cat(room(),sil(14)));
wav('noise-45',   cat(noise(16,-45,5)));
// a room so loud the ceiling clamp bites and no setting can recover the range
wav('noise-22',   cat(noise(16,-22,6)));
wav('tone-110',   cat(room(),voice(110,10,-26)));
wav('tone-220',   cat(room(),voice(220,10,-26)));
wav('tone-350',   cat(room(),voice(350,10,-26)));
wav('tone-700',   cat(room(),voice(700,10,-26)));
wav('tone-900',   cat(room(),voice(900,10,-26)));
wav('tone-1150',  cat(room(),voice(1150,10,-26)));
wav('tone-noisy', cat(room(),voice(220,10,-26,7,12)));   // 220 Hz at 12 dB SNR
wav('shhh',       cat(room(),noise(10,-26,11,true)));
// a −55 → −10 dBFS ramp: the level must keep rising the whole way
{ const n=SR*12, b=new Float32Array(n), r=rng(21);
  const pre=room();
  for(let i=0;i<n;i++){ const db=-55+45*(i/n); let s=0;
    for(let h=1;h<=20&&h*200<SR/2;h++) s+=Math.sin(2*Math.PI*h*200*i/SR)/h;
    b[i]=s*Math.pow(10,db/20)*1.9; }
  wav('ramp',cat(pre,b)); }
// six claps only 0.25 s apart - the UAT case where the second was swallowed by
// the first one's release
{ const parts=[room()]; const r=rng(41);
  for(let c=0;c<6;c++){ const d=Math.round(SR*0.1), k=new Float32Array(d);
    for(let i=0;i<d;i++) k[i]=(r()*2-1)*Math.exp(-i/(SR*0.018));
    norm(k,-20); parts.push(k, sil(0.25-0.1)); }
  parts.push(sil(4));
  wav('claps-fast',cat(...parts)); }
// seven claps 1.5 s apart — the Ripples gate from 2026-08-31
{ const parts=[room()]; const r=rng(33);
  for(let c=0;c<7;c++){ const d=Math.round(SR*0.12), k=new Float32Array(d);
    for(let i=0;i<d;i++) k[i]=(r()*2-1)*Math.exp(-i/(SR*0.02));
    norm(k,-20); parts.push(k, sil(1.5-0.12)); }
  wav('claps',cat(...parts)); }

// ── Phase 11b: the room-floor drift ─────────────────────────────────────────
// The user reports "listening to the room says it is noisy but it isn't", and
// "ripples works well for a few claps but then seems to not recognise". The
// hypothesis is one fault: trackFloor() lets micFloorDb climb 1 dB/s toward the
// minimum of the last 3 seconds, and if a real person in front of a real
// microphone never leaves a whole second at the true room floor, that minimum
// sits above it and the floor climbs after it. A climbing floor raises the gate,
// shrinks `level`, and shrinks availDb() into the noisy-room warning.
//
// So these signals are LIVE rooms, not silent ones: a person is present between
// the claps. `clapReverb` gives each clap a T60 tail like a small hard room.
function clapReverb(rmsDb,t60,secs,seed){
  const n=Math.round(SR*secs), b=new Float32Array(n), r=rng(seed);
  // 12 ms of transient, then an exponential decay envelope on filtered noise
  const k=Math.log(1e-3)/(t60*SR);           // -60 dB in t60 seconds
  for(let i=0;i<n;i++) b[i]=(r()*2-1)*(i<SR*0.012 ? 1 : Math.exp(k*(i-SR*0.012)));
  return norm(b,rmsDb);
}
// n claps `gap` apart over a room that also holds a person: `presenceDb` is the
// breathing/rustle between claps, which is what a 1-second minimum actually sees.
function clapTrain(n,gap,roomDb,presenceDb,clapDb,t60,seed){
  const parts=[noise(1.5,roomDb,seed)];
  for(let c=0;c<n;c++){
    const tail=clapReverb(clapDb,t60,Math.min(gap,1.2),seed+c);
    const restN=Math.round(SR*(gap-Math.min(gap,1.2)));
    parts.push(tail);
    if(restN>0) parts.push(noise(restN/SR,presenceDb,seed+100+c));
  }
  parts.push(noise(6,roomDb,seed+999));
  const o=cat(...parts);
  // the presence floor runs UNDER everything, the way a person in the room does
  const bed=noise(o.length/SR,presenceDb,seed+7);
  for(let i=0;i<o.length;i++) o[i]+=bed[i];
  return o;
}
// 25 claps, 1.5 s apart, in a room with a person in it. 45 s — long enough for a
// 1 dB/s drift to be unmissable, and the run stops well before the file does.
wav('claps-live',  clapTrain(25,1.5,-58,-48,-20,0.35,71));
// the same train with NOBODY there: only the -58 room between claps. If the
// floor drifts here too, the cause is the claps; if only in claps-live, it is
// the presence bed. Separating those is the whole point of having both.
wav('claps-dead',  clapTrain(25,1.5,-58,-58,-20,0.35,73));
// A QUIET room, held for 45 s with nothing happening at all. The floor must not
// wander and the warning must not appear. This is the user's report in its
// simplest form.
wav('quiet-45',    cat(noise(60,-58,81)));
// the same, at levels a real room might actually sit at. The noisy-room warning
// fires when availDb()<15, i.e. whenever the measured floor lands above -27 dBFS.
wav('room-50',     cat(noise(60,-50,82)));
wav('room-42',     cat(noise(60,-42,83)));
wav('room-34',     cat(noise(60,-34,84)));
wav('room-28',     cat(noise(60,-28,85)));

// ── Phase 11b, measurement 1b: A HOT MICROPHONE, not a noisy room ───────────
// The drift hypothesis was measured and is FALSE - the floor moved 0.1 dB over
// 40 s of live clapping. But the sweep showed the noisy-room warning needs a
// measured floor above -27 dBFS, which a -28 dBFS room does not reach. So the
// user's warning means their microphone reads the room hot, and these are the
// levels where that starts to bite. A hot input is NOT what the warning's advice
// is about, which is the second half of the finding.
wav('room-24',     cat(noise(60,-24,86)));
wav('room-20',     cat(noise(60,-20,87)));
wav('room-16',     cat(noise(60,-16,88)));
// claps into a hot room: the gate, the level and the ring count where the
// warning is actually firing. Claps at -6 dBFS, on the edge of clipping, which
// is where a microphone this hot puts a clap.
wav('claps-hot',   clapTrain(25,1.5,-30,-26,-6,0.35,91));
// and the same claps into a normal room, as the control
wav('claps-norm',  clapTrain(25,1.5,-58,-48,-20,0.35,93));

// ── Phase 11b: enthusiastic clapping ────────────────────────────────────────
// 25 claps at 1.5 s gave 25 rings in both a normal and a hot room, so the
// user's "works for a few claps then stops" is NOT that pattern. This is the
// pattern a person actually falls into: keeping it up, and faster.
wav('claps-keep',  clapTrain(40,0.5,-58,-48,-20,0.35,95));
wav('claps-keep-hot', clapTrain(40,0.5,-30,-26,-6,0.35,97));
// and a train that ACCELERATES, which is what a person clapping along does
{ const parts=[noise(1.5,-58,101)]; let gap=1.4;
  for(let c=0;c<40;c++){
    const tail=clapReverb(-20,0.35,Math.min(gap,1.2),101+c);
    parts.push(tail);
    const restN=Math.round(SR*Math.max(0,gap-Math.min(gap,1.2)));
    if(restN>0) parts.push(noise(restN/SR,-48,201+c));
    gap=Math.max(0.28,gap*0.94);
  }
  parts.push(noise(6,-58,999));
  const o=cat(...parts), bed=noise(o.length/SR,-48,303);
  for(let i=0;i<o.length;i++) o[i]+=bed[i];
  wav('claps-accel',o); }


// ── Phase 11b: "it misses the ring every second clap" ───────────────────────
// The user's report, and the discriminator they handed over: the CENTRE GLOW
// pulses on every clap while the RING appears on every other one. The glow runs
// off `level` and passes neither of the two gates the ring passes, so the fault
// is between the transient being detected and the ring being drawn.
//
// A person clapping steadily claps somewhere around 0.4-0.9 s. These sweep that
// band so a 2:1 pattern, if it depends on the spacing, has to show itself.
for (const gap of [0.4,0.5,0.6,0.7,0.8,0.9,1.2]) {
  wav('clapgap-'+String(gap).replace('.','p'),
      clapTrain(24,gap,-58,-48,-20,0.35,120+Math.round(gap*10)));
}


// ── A REAL CLAP IS FAR MORE IMPULSIVE THAN THE ONE ABOVE ────────────────────
// `clapReverb` gives 12 ms of full-amplitude noise before the decay starts, and
// that is a plateau, not a clap. A hand clap's energy is over in one or two
// milliseconds. It matters because rawDbfs() takes the RMS of the most recent
// 2048 samples - 43 ms at 48 kHz - so a 2 ms impulse is a small part of the
// window, and how much of it a given frame catches depends on WHERE that frame
// falls. A 12 ms plateau is caught cleanly by any frame; a 2 ms crack is not.
function realClap(rmsDb,t60,secs,seed){
  const n=Math.round(SR*secs), b=new Float32Array(n), r=rng(seed);
  const k=Math.log(1e-3)/(t60*SR), attack=Math.round(SR*0.0015);
  let lp=0;
  for(let i=0;i<n;i++){
    const w=r()*2-1;
    lp+=(w-lp)*0.55;                       // a little colour, still broadband
    const env=i<attack ? i/attack : Math.exp(k*(i-attack));
    b[i]=(w*0.75+lp*0.25)*env;
  }
  return norm(b,rmsDb);
}
function realTrain(n,gap,roomDb,presenceDb,clapDb,t60,seed){
  const parts=[noise(1.5,roomDb,seed)];
  for(let c=0;c<n;c++) parts.push(realClap(clapDb,t60,gap,seed+c));
  parts.push(noise(5,roomDb,seed+999));
  const o=cat(...parts), bed=noise(o.length/SR,presenceDb,seed+7);
  for(let i=0;i<o.length;i++) o[i]+=bed[i];
  return o;
}
// spacings deliberately NOT commensurate with a 60 Hz frame clock, so the phase
// between clap and frame walks through the whole cycle during the run
for (const gap of [0.4,0.5,0.55,0.6,0.66,0.7,0.8]) {
  wav('realclap-'+String(gap).replace('.','p'),
      realTrain(24,gap,-58,-48,-20,0.25,200+Math.round(gap*100)));
}


// ── Is the ring gate earning its slider? ────────────────────────────────────
// The user asks whether "Rings no closer together than" has any benefit at all,
// or should just be pinned as low as it goes. onset() already has its own 0.12 s
// refractory and a transient test, and Fireworks - which has NO second gate -
// was measured giving ONE explosion for a steady 4 s tone. So the question is
// whether any real sound gets past onset() often enough to need a second gate.
// These are the sounds that would: continuous, rattly, full of transients.
//
// a raspberry / vocal fry: noise chopped at ~14 Hz, which is a transient every
// 70 ms - faster than onset()'s own 0.12 s floor
{ const n=Math.round(SR*20), b=new Float32Array(n), r=rng(301);
  const pre=noise(1.5,-58,302);
  for(let i=0;i<n;i++){
    const ph=(i/SR*14)%1;
    b[i]=(r()*2-1)*Math.pow(1-ph,2.2);
  }
  norm(b,-26);
  wav('rattly',cat(pre,b)); }
// a child babbling: syllables every ~250 ms, each with its own onset
{ const parts=[noise(1.5,-58,311)]; const r=rng(312);
  for(let c=0;c<60;c++){
    const d=Math.round(SR*0.18), k=new Float32Array(d);
    const f=180+r()*260;
    for(let i=0;i<d;i++){
      const env=Math.min(1,i/(SR*0.02))*Math.exp(-i/(SR*0.09));
      let v=0; for(let h=1;h<=12;h++) v+=Math.sin(2*Math.PI*h*f*i/SR)/h;
      k[i]=v*env;
    }
    norm(k,-26); parts.push(k, sil(0.07));
  }
  wav('babble',cat(...parts)); }
// and a sustained hum, the control: this must give ONE ring however the gate is set
wav('hum-8',  cat(noise(1.5,-58,321), voice(200,18,-26,5)));


// ── Does loudness actually move the ring now? ───────────────────────────────
// The old `str` never left 0.46..0.73 whatever was played, so a shout and a
// gentle tap drew nearly the same ring. It is the instantaneous level now, and
// this is the signal that checks the claim: five claps a second apart, each
// 6 dB louder than the last.
{ const parts=[noise(1.5,-58,401)];
  for(const db of [-46,-40,-34,-28,-22]){
    parts.push(realClap(db,0.25,1.0,410+Math.abs(db)));
  }
  parts.push(noise(4,-58,402));
  const o=cat(...parts), bed=noise(o.length/SR,-56,403);
  for(let i=0;i<o.length;i++) o[i]+=bed[i];
  wav('clap-ramp',o); }
