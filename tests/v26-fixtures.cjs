const fs=require('fs'),path=require('path'),C=require('../src/core.js');const dir=path.resolve(__dirname,'../examples/v26');fs.mkdirSync(dir,{recursive:true});
const music=C.synthDemo({...C.DEMOS[0],id:'v26-original-control',title:'ECHOS DE CONTROLE',bpm:120,bars:8},11025);
function wav(samples){const b=Buffer.alloc(44+samples.length*2);b.write('RIFF',0);b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(11025,24);b.writeUInt32LE(22050,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(samples.length*2,40);samples.forEach((v,i)=>b.writeInt16LE(Math.round(Math.max(-1,Math.min(1,v))*32767),44+i*2));return b;}
fs.writeFileSync(path.join(dir,'ECHOS_ORIGINAL.wav'),wav(music.samples));
fs.writeFileSync(path.join(dir,'ECHOS_GAIN90.wav'),wav(music.samples.map(v=>v*.9)));
const shifted=new Float32Array(music.samples.length+5513);shifted.set(music.samples.map(v=>v*.62),5513);fs.writeFileSync(path.join(dir,'ECHOS_DECALE_500MS.wav'),wav(shifted));
const other=C.synthDemo({...C.DEMOS[1],id:'v26-different-control',bpm:120,bars:8,key:68,style:2},11025);fs.writeFileSync(path.join(dir,'AUTRE_MUSIQUE.wav'),wav(other.samples));
console.log(dir,music.duration);
