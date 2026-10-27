'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const C=require('../src/live-core.js'),R=path.resolve(__dirname,'..'),out=path.join(R,'examples');
const make=(title,notes,extra={})=>C.validateChart({id:'v4-'+title.toLowerCase().replace(/[^a-z0-9]+/g,'-'),title,difficulty:'NORMAL',bpm:120,source:'manual',offset:0,notes:notes.map((n,i)=>({id:'v4-note-'+i,x:.2+(i%6)*.12,y:.36+(i%2)*.18,type:'tap',...n})),...extra});
const chart=make('Controle V4 - sections et accords',[
 {time:1,lane:0},{time:1.5,lane:1},{time:2,lane:2},{time:2.5,lane:3},
 {time:3,lane:0},{time:3,lane:1},{time:4,lane:2},{time:4,lane:3},
 {time:5,lane:4,type:'slide'},{time:5.5,lane:5,type:'slide'},
 {time:6,lane:5,type:'chain'},{time:6.25,lane:5,type:'chain'},
 {time:6.5,lane:5,type:'chain'},{time:7,lane:0,type:'hold',duration:.75}
],{sections:[{id:'unit',label:'Symboles simples',from:.5,to:2.9},{id:'chord',label:'Accords doubles',from:2.9,to:4.5},{id:'slide',label:'Slides et chaine',from:4.5,to:7},{id:'hold',label:'Maintien',from:7,to:8}]});
const intro=make('Neon Promise - apprentissage V4',Array.from({length:24},(_,i)=>({time:2+i*.5,lane:i%4})),{difficulty:'EASY',sections:[{id:'intro',label:'Prise en main',from:1.5,to:8},{id:'repeat',label:'Deuxieme passage',from:8,to:14.5}]});
const wav=fs.readFileSync(path.join(out,'CONTROLE_120_BPM.wav'));
const cat=C.validateCatalog({format:'DIVA-PULSE-CHART-CATALOG',version:1,title:'DIVA PULSE — exemples originaux V4, sans musique',entries:[
 {id:'control-v4',title:'CONTROLE_120_BPM',artist:'DIVA PULSE',author:'DIVA PULSE',edition:'Exercice original V4',duration:8,audioHash:'sha256:'+crypto.createHash('sha256').update(wav).digest('hex'),charts:[chart]},
 {id:'neon-v4',title:'Neon Promise',artist:'DIVA PULSE',author:'DIVA PULSE',edition:'Exercice original V4',demoId:'neon-promise',charts:[intro]}
]});
fs.writeFileSync(path.join(out,'CATALOGUE_ORIGINAL_V4.pulsecharts'),JSON.stringify(cat,null,2));
fs.writeFileSync(path.join(out,'CONTROLE_SECTIONS_V4.pulse.json'),JSON.stringify(chart,null,2));
console.log('Catalog V4:',cat.entries.length,'entries;',chart.notes.length,'control notes; SHA-256 verified from bundled WAV.');
