'use strict';
/* Shared song library for Song Grid, Big-Switch Songs, and future apps.
   Movable-do: notes = [[columnIndex, beats], ...]; span = grid columns needed;
   column 0 is the starting note (do), so everything transposes with the
   framework's Starting note / Register / Scale controls. All public domain. */
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
// Phrase boundaries: a held note (>= 2 beats) ends a phrase — reliable for this
// folk-song set. Used by Big-Switch's "each press plays a phrase" mode.
window.songPhrases = function(song){
  const phrases=[]; let cur=[];
  for(const n of song.notes){ cur.push(n); if(n[1]>=2){ phrases.push(cur); cur=[]; } }
  if(cur.length) phrases.push(cur);
  return phrases;
};
