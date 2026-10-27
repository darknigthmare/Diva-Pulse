/* Original V5 training media and charts; no external or official assets. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const C=require('../src/core.js');require('../src/creator.js');require('../src/live-core.js');require('../src/precision-core.js');require('../src/academy.js');
const out=path.resolve(__dirname,'../examples/v5');fs.mkdirSync(out,{recursive:true});
const write=(name,data)=>fs.writeFileSync(path.join(out,name),data);
const json=(name,data)=>write(name,JSON.stringify(data,null,2)+'\n');
const hash=data=>'sha256:'+crypto.createHash('sha256').update(data).digest('hex');
const academy=C.academyAudio();const wav=Buffer.from(academy.bytes);write('ATELIER_DU_RYTHME_120BPM.wav',wav);
const charts=C.LESSONS.map(C.academyChart);for(const c of charts)json(c.id+'.pulse.json',c);
const meter=[{beat:0,numerator:3,denominator:4},{beat:12,numerator:7,denominator:8,groups:[2,2,3]},{beat:26,numerator:6,denominator:8}];
let c=C.validateChart({id:'v5-mesures-mixtes',title:'ATELIER DES MESURES',source:'manual',difficulty:'NORMAL',bpm:120,offset:2,meterMap:meter,notes:[],sections:[{id:'3-4',label:'3/4',from:2,to:8},{id:'7-8',label:'7/8 · 2+2+3',from:8,to:15},{id:'6-8',label:'6/8 · 3+3',from:15,to:26}]});
const clicks=C.metricClicks(c,0,23.75);let notes=[];
clicks.forEach((g,i)=>{if(g.accent||g.strong)notes.push({id:'mix-'+i,time:g.time,lane:g.strong?2:i%4,type:'tap',x:.19+(i%6)*.115,y:g.strong?.37:.61,approach:1.7,angle:i%2?45:-45,distance:.8});});
c=C.validateChart({...c,notes});json('MESURES_MIXTES_V5.pulse.json',c);write('MESURES_MIXTES_V5.mid',C.exportMIDI(c));
const sr=22050,samples=new Float32Array(sr*28);
for(const g of clicks){const at=Math.round((g.time+2)*sr),hz=g.strong?1760:g.accent?1174.66:880,duration=g.strong?.16:.08;for(let j=0;j<duration*sr&&at+j<samples.length;j++){const t=j/sr;samples[at+j]+=(g.strong?.4:g.accent?.28:.13)*Math.sin(2*Math.PI*hz*t)*Math.exp(-t*35)*Math.min(1,t*1000);}}
const bytes=Buffer.alloc(44+samples.length*2);bytes.write('RIFF');bytes.writeUInt32LE(bytes.length-8,4);bytes.write('WAVEfmt ',8);bytes.writeUInt32LE(16,16);bytes.writeUInt16LE(1,20);bytes.writeUInt16LE(1,22);bytes.writeUInt32LE(sr,24);bytes.writeUInt32LE(sr*2,28);bytes.writeUInt16LE(2,32);bytes.writeUInt16LE(16,34);bytes.write('data',36);bytes.writeUInt32LE(samples.length*2,40);samples.forEach((v,i)=>bytes.writeInt16LE(Math.round(Math.max(-1,Math.min(1,v))*32767),44+i*2));write('ATELIER_DES_MESURES.wav',bytes);
const catalogue={format:'DIVA-PULSE-CHART-CATALOG',version:1,title:'V5 — Ateliers originaux',entries:[{id:'v5-academie-originale',title:'ATELIER_DU_RYTHME_120BPM',artist:'DIVA PULSE',author:'DIVA PULSE',edition:'Six leçons originales V5',duration:32,audioHash:hash(wav),charts},{id:'v5-mesures-originales',title:'ATELIER_DES_MESURES',artist:'DIVA PULSE',author:'DIVA PULSE',edition:'Exercice original 3/4, 7/8, 6/8',duration:28,audioHash:hash(bytes),charts:[c]}]};
C.validateCatalog(catalogue);json('CATALOGUE_ATELIERS_V5.pulsecharts',catalogue);
console.log('V5 fixtures validated:',charts.length+1,'charts, two original WAV files, one native/standard MIDI, one SHA-256 catalogue.');
