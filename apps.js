'use strict';
/* The app list — drives the home-page tiles in index.html.
   Each app: file (null = not built yet), emoji, title, blurb, accent colour.
   Sections tell therapists WHEN to reach for each app: active music-making,
   structured activities, or regulation / wind-down. Most-used first per section. */
const APP_SECTIONS = [
  { title:'Instruments', tag:'Open-ended music-making — every touch plays in key.', items:[
    {file:'fluid_sensory.html', emoji:'🎹', title:'Fluid Keys',      blurb:'Paint with sound — a fluid canvas that is also a playable instrument with note zones and octave grid.', accent:'#7ad7ff'},
    {file:'strummer.html', emoji:'🎸', title:'Chord Strummer',  blurb:'Sweep across the strings to strum — big chord buttons keep every sweep in harmony.', accent:'#e05a9c'},
    {file:'drums.html', emoji:'🥁', title:'Drum Pads',       blurb:'Big colourful percussion zones — kick, snare, shaker — plus a backing track to play along with.', accent:'#e2641c'},
    {file:'sweep_chimes.html', emoji:'🎐', title:'Sweep Chimes',  blurb:'Sweep through hanging chime bars — they swing, knock together and ring in your scale.', accent:'#8fd3ff'},
    {file:'sampler.html', emoji:'📼', title:'Sampler Pads',    blurb:'Record any sound onto a pad — your voice, a shaker, a door — then play it like an instrument.', accent:'#c0a0ff'},
  ]},
  { title:'Songs & Games', tag:'Structured activities with gentle goals — never a fail.', items:[
    {file:'song_grid.html', emoji:'🎵', title:'Song Grid', blurb:'Cells light up to guide a student through real songs, one note at a time, at their own pace.', accent:'#f5d117'},
    {file:'big_switch.html', emoji:'🔘', title:'Big Switch Songs',blurb:'The whole screen is one giant button. Every press plays the next part of the song.', accent:'#3bb54a'},
    {file:'echo_bird.html', emoji:'🦜', title:'Echo Bird',     blurb:'The bird plays a little tune, then waits for your reply — every answer makes it happy.', accent:'#7dffb0'},
    {file:'bubbles.html', emoji:'🫧', title:'Music Bubbles',  blurb:'Pop drifting note bubbles — or follow a song bubble by bubble. Gentle goals, never a fail.', accent:'#9ee7ff'},
  ]},
  { title:'Sensory & Calm', tag:'Mesmerising visuals and soundscapes for regulation and wind-down.', items:[
    {file:'soundscape.html', emoji:'🌧️', title:'Soundscape',      blurb:'Mix rain, waves, birds and soft chords on big sliders into a calming soundscape.', accent:'#1ca9a9'},
    {file:'voice_visuals.html', emoji:'🎤', title:'Voice Visuals',   blurb:'Sing, hum or shout — the microphone turns every sound into light and colour.', accent:'#8affd0'},
    {file:'flock.html', emoji:'🕊️', title:'Flock',           blurb:'A glowing swarm gathers around your fingers — murmurations, fireflies, embers and aurora styles.', accent:'#7fa8ff'},
    {file:'slime.html', emoji:'🍄', title:'Slime Mould',     blurb:'Thousands of tiny explorers weave living networks of light around every touch.', accent:'#9dff57'},
    {file:'life.html', emoji:'🧬', title:'Game of Life',    blurb:'Paint living cells and watch them grow, drift and sing — new cells play soft notes as they are born.', accent:'#57ffb0'},
  ]},
];
