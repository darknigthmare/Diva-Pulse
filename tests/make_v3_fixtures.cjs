'use strict';
// Regenerate the MIDI and replay from the checked-in, original JSON test chart.
const fs=require('node:fs'),path=require('node:path'),C=require('../src/creator');
const dir=path.join(__dirname,'../examples');
const c=C.validateChart(JSON.parse(fs.readFileSync(path.join(dir,'CONTROLE_TEMPO_VARIABLE_V3.json'),'utf8')));
fs.writeFileSync(path.join(dir,'CONTROLE_TEMPO_VARIABLE_V3.mid'),C.exportMIDI(c));
const inputs=c.notes.flatMap(n=>[{time:n.time,lane:n.lane,down:true},{time:n.time+(n.duration||.06),lane:n.lane,down:false}]).sort((a,b)=>a.time-b.time);
fs.writeFileSync(path.join(dir,'CONTROLE_REPLAY_V3.pulsereplay'),JSON.stringify({format:'DIVA-PULSE-REPLAY',version:1,engine:C.VERSION,title:c.title,chart:c,inputs,endTime:8,noFail:false},null,2));
console.log('Fixtures V3 regenerated. Audio fixture remains separate.');
