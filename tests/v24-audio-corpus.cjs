/* Original annotated synthetic audio. These tests measure timing, NOT musical enjoyment. */
const fs=require('node:fs'),path=require('node:path'),C=require('../src/automap-core.js');
function make(name){const sr=22050,duration=16,pcm=new Float32Array(sr*duration),truth=[];
 for(let t=1,i=0;t<15;i++){
  if(name!=='silence-break'||t<6||t>9)truth.push(t);
  let step=name==='ternary'?1/6:name==='swing'?(i%2?.5/3:1/3):name==='tempo-change'?(t<8?.5:.4):.5;
  t+=step;
 }
 for(let k=0;k<truth.length;k++){const at=Math.round(truth[k]*sr),freq=k%4===0?180:950;for(let j=0;j<sr*.09;j++){const t=j/sr;if(at+j>=pcm.length)break;pcm[at+j]+=.55*Math.sin(2*Math.PI*freq*t)*Math.exp(-t*65);}}
 return {name,sr,duration,pcm,truth};}
function compare(pred,truth,window=.055){const used=new Set();let matched=0,errors=[];for(const x of truth){let bi=-1,bd=window;for(let i=0;i<pred.length;i++){const d=Math.abs(pred[i]-x);if(!used.has(i)&&d<=bd){bi=i;bd=d;}}if(bi>=0){used.add(bi);matched++;errors.push(pred[bi]-x);}}return {matched,expected:truth.length,detected:pred.length,recall:matched/truth.length,precision:matched/Math.max(1,pred.length),meanAbsErrorMs:errors.reduce((s,x)=>s+Math.abs(x),0)/Math.max(1,errors.length)*1000};}
function wave(x){const b=Buffer.alloc(44+x.pcm.length*2);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(x.sr,24);b.writeUInt32LE(x.sr*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(b.length-44,40);x.pcm.forEach((v,i)=>b.writeInt16LE(Math.round(Math.max(-1,Math.min(1,v))*32767),44+i*2));return b;}
function run(){const reports=[];for(const name of ['binary','ternary','swing','tempo-change','silence-break']){const x=make(name),a=C.analyzeMusicPCM(x.pcm,x.sr),f=C.generateChartFamily(a,{seed:24,title:name}),r={name,...compare(a.onsets.map(x=>x.time),x.truth),bpmEstimate:a.bpm,tempoConfidence:a.confidence,notes:f.charts.map(c=>c.notes.length),playability:f.report.ok,warning:'Synthetic impulses, not a corpus of recorded songs or human ratings.'};reports.push(r);}return reports;}
if(require.main===module){const dir=path.resolve(__dirname,'../examples/v24/audio-corpus');fs.mkdirSync(dir,{recursive:true});for(const name of ['binary','ternary','swing','tempo-change','silence-break']){const x=make(name);fs.writeFileSync(path.join(dir,name+'.wav'),wave(x));fs.writeFileSync(path.join(dir,name+'.json'),JSON.stringify({title:name,sampleRate:x.sr,duration:x.duration,onsets:x.truth,source:'Original synthetic diagnostic',toleranceMs:55},null,2));}const report=run();fs.mkdirSync(path.resolve(__dirname,'../qa/v24'),{recursive:true});fs.writeFileSync(path.resolve(__dirname,'../qa/v24/audio-corpus.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));}
module.exports={run,make,compare};
