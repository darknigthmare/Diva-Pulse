const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),vm=require('vm');
global.PulseCore=require('../src/core.js');global.PulseFace=require('../src/face-core.js');const A=require('../src/audio-match.js'),D=require('../src/face-drafts.js'),C=global.PulseCore;
const R=path.resolve(__dirname,'../examples/v26');
function wav(file){const b=fs.readFileSync(path.join(R,file));return Float32Array.from({length:(b.length-44)/2},(_,i)=>b.readInt16LE(44+i*2)/32768);}
const pcm=wav('ECHOS_ORIGINAL.wav'),fp=A.analyze([pcm]);
const seed=()=>({songId:'songA',updated:123456,cursor:1,baseSignature:'source',track:{mode:'manual',duration:19,keys:[{time:0,open:0},{time:1,open:.8},{time:2,open:0}],sourceKind:'manual'}});
test('Acoustic descriptor matches identical PCM deterministically',()=>assert.deepEqual(A.analyze([pcm]),fp));
test('Acoustic descriptor survives gain changes',()=>assert.ok(A.compare(fp,A.analyze([pcm.map(x=>x*.41)])).candidate));
test('Acoustic descriptor survives polarity inversion',()=>assert.ok(A.compare(fp,A.analyze([pcm.map(x=>-x)])).candidate));
test('Opposed stereo channels do not cancel the fingerprint',()=>assert.ok(A.compare(fp,A.analyze([pcm,pcm.map(x=>-x)])).candidate));
test('Real MP3 encode/decode is proposed but never certified identical',()=>{const b=fs.readFileSync(path.join(R,'REENCODE_DECODE.f32')),x=new Float32Array(b.buffer,b.byteOffset,b.length/4),m=A.compare(fp,A.analyze([x]));assert.ok(m.candidate);assert.equal(m.identityVerified,false);assert.equal(m.offset,0);});
test('Positive half-second source offset is detected with correct sign',()=>{const m=A.compare(fp,A.analyze([wav('ECHOS_DECALE_500MS.wav')]));assert.ok(m.candidate);assert.equal(m.offset,.5);});
test('Negative half-second source offset is detected with correct sign',()=>{const m=A.compare(A.analyze([wav('ECHOS_DECALE_500MS.wav')]),fp);assert.ok(m.candidate);assert.equal(m.offset,-.5);});
test('Different composition at the same BPM is not proposed',()=>assert.equal(A.compare(fp,A.analyze([wav('AUTRE_MUSIQUE.wav')])).candidate,false));
test('Pure silence is not proposed',()=>assert.equal(A.compare(fp,A.analyze([new Float32Array(pcm.length)])).candidate,false));
test('Short excerpt below eight seconds is not a candidate',()=>{const s=A.analyze([pcm.slice(0,11025*7)]);assert.equal(A.compare(s,s).candidate,false);});
test('Large duration mismatch is not proposed',()=>{const s=A.analyze([pcm.slice(0,11025*10)]);assert.equal(A.compare(fp,s).candidate,false);});
test('Different order of phrases is not a candidate',()=>{const split=11025*9,s=new Float32Array(pcm.length);s.set(pcm.slice(split));s.set(pcm.slice(0,split),pcm.length-split);assert.equal(A.compare(fp,A.analyze([s])).candidate,false);});
for(const [label,change] of [
 ['missing',()=>null],['version',p=>({...p,version:27})],['duration',p=>({...p,duration:NaN})],['rate',p=>({...p,rate:100})],['bands',p=>({...p,bands:3})],['energy length',p=>({...p,energy:p.energy.slice(1)})],['spectrum length',p=>({...p,spectrum:[]})],['energy value',p=>({...p,energy:p.energy.map((x,i)=>i?x:256)})],['fractional value',p=>({...p,spectrum:p.spectrum.map((x,i)=>i?x:.1)})]
])test('Reject acoustic '+label,()=>assert.throws(()=>A.validate(change(fp))));
test('Analyze refuses invalid sample rates',()=>assert.throws(()=>A.analyze([pcm],44100)));
test('Analyze refuses NaN PCM',()=>{const c=pcm.slice();c[4]=NaN;assert.throws(()=>A.analyze([c]));});
test('Worker source is self contained',()=>{let result;const context={Float32Array,Float64Array,Int8Array,postMessage:x=>result=x};vm.createContext(context);vm.runInContext(A.workerSource(),context);context.onmessage({data:{action:'analyze',channels:[pcm],sampleRate:A.RATE}});assert.ok(result.ok);assert.deepEqual(Array.from(result.result.energy),fp.energy);});
const chart=C.validateChart({id:'chartA',title:'Test',bpm:120,difficulty:'NORMAL',source:'manual',notes:[{id:'one',time:2,lane:0,type:'tap',x:.3,y:.4,duration:0}],offset:.05});
const source={id:'sourceA',audioHash:'source-sha',charts:[chart]},target={id:'targetB',audioHash:'target-sha',charts:[],duration:19,scene:{manual:'preserve'}};
test('Copy appends new chart ID and never modifies either original object',()=>{const s=structuredClone(source),t=structuredClone(target),copy=A.copyCharts(s,t,['chartA'],.5);assert.deepEqual(s,source);assert.deepEqual(t,target);assert.notEqual(copy.charts[0].id,chart.id);assert.deepEqual(copy.charts[0].notes,chart.notes);assert.equal(copy.charts[0].offset,.55);assert.deepEqual(copy.scene,target.scene);});
test('Copy stores honest provenance and source signature',()=>{const c=A.copyCharts(source,target,['chartA'],0).charts[0];assert.equal(c.source,'acoustic-copy');assert.equal(c.provenance.identityVerified,false);assert.equal(c.provenance.sourceSignature,C.chartSignature(chart));});
for(const [label,args]of [['self',[source,source,['chartA'],0]],['none',[source,target,[],0]],['duplicate',[source,target,['chartA','chartA'],0]],['unknown',[source,target,['missing'],0]],['NaN',[source,target,['chartA'],NaN]],['huge',[source,target,['chartA'],3]],['outside',[source,{...target,duration:2},['chartA'],.2]],['full',[source,{...target,charts:Array(50).fill(chart)},['chartA'],0]]])test('Copy rejects '+label+' without partial changes',()=>assert.throws(()=>A.copyCharts(...args)));
test('Draft normalization preserves valid track and is immutable',()=>{const r=seed(),v=D.validate(r);assert.equal(v.id,'face-draft:songA');v.track.keys[0].open=.4;assert.equal(r.track.keys[0].open,0);});
for(const [label,change]of [['owner',r=>({...r,songId:''})],['date',r=>({...r,updated:Infinity})],['cursor',r=>({...r,cursor:-1})],['duration',r=>({...r,cursor:20})],['track',r=>({...r,track:{mode:'audio',duration:19}})]])test('Draft rejects '+label,()=>assert.throws(()=>D.validate(change(seed()))));
test('Draft merge favors latest memory state and isolates owners',()=>{const old=seed(),latest={...seed(),updated:99e3,track:{...seed().track,gain:2}},fresh={...latest,updated:999999};const got=D.merge([old],[fresh,{...old,songId:'absent'}],[{id:'songA'}]);assert.equal(got.length,1);assert.equal(got[0].track.gain,2);});
test('Draft merge ignores committed/discarded tombstones',()=>assert.equal(D.merge([{...seed(),discarded:true}],[],[{id:'songA'}]).length,0));
test('Draft restoration remaps owner and guide',()=>{const r=seed();r.track.sourceAsset='voice';r.track.sourceKind='voice-guide';const c=D.remap([r],new Map([['songA','copy']]),new Map([['voice','voice-copy']]))[0];assert.equal(c.id,'face-draft:copy');assert.equal(c.track.sourceAsset,'voice-copy');assert.equal(r.track.sourceAsset,'voice');});
test('Draft missing owner refuses entire restoration',()=>assert.throws(()=>D.remap([seed()],new Map(),new Map())));
test('Draft missing guide refuses restoration',()=>{const s=seed();s.track.sourceAsset='missing';assert.throws(()=>D.remap([s],new Map([['songA','copy']]),new Map()));});

const Q=require('../src/quality.js');test('Acoustic import preference rejects non-boolean backup values',()=>assert.throws(()=>Q.preferences({audioMatchImport:'yes'},{strict:true})));
test('Acoustic preference accepts false opt-out',()=>assert.equal(Q.preferences({audioMatchImport:false},{strict:true}).value.audioMatchImport,false));
