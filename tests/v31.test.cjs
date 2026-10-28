'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
require('../src/core.js');require('../src/creator.js');require('../src/precision-core.js');require('../src/motion-sync.js');
const D=require('../src/director-core.js'),E=require('../src/director-workflow.js'),Audio=require('../src/director-audio.js');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
function scene(){return D.normalizeDirector({duration:40,count:3,slots:[{clips:[{id:'a',start:1,end:7,motionStart:2,rate:1.5}]},{clips:[{start:2,end:8}]},{clips:[]}],cameraTrack:[{time:1}],lightTrack:[{time:2}],formations:[{time:1.5,positions:[[0,0,0],[1,0,0],[-1,0,0]]}]});}
const group=['clip:0:0','clip:1:0','camera:0','light:0','formation:0'];
test('V31 groups enumerate formation keys',()=>assert.equal(E.all(scene()).length,5));
test('V31 mixed group movement shifts formations but preserves positions',()=>{const d=scene(),out=E.move(d,group,4);near(out.formations[0].time,5.5);assert.deepEqual(out.formations[0].positions,d.formations[0].positions);near(out.cameraTrack[0].time,5)});
test('V31 mixed copy-paste and deletion include formations',()=>{const d=scene(),out=E.paste(d,E.copy(d,group),12);near(out.formations[1].time,12.5);assert.equal(E.remove(out,['formation:1']).formations.length,1);assert.equal(d.formations.length,1)});
test('V31 duplicate formation times reject whole mixed paste',()=>{const d=scene();d.formations.push({...d.formations[0],time:12.5});const before=JSON.stringify(d);assert.throws(()=>E.paste(d,E.copy(d,group),12));assert.equal(JSON.stringify(d),before)});
test('V31 drag uses clicked element offset not group origin',()=>{const d=scene(),o=E.drag(d,group,'clip:1:0',4);near(o.slots[0].clips[0].start,3);near(o.formations[0].time,3.5)});
test('V31 drag snaps entire group and preserves subbeat differences',()=>{const d=scene(),o=E.drag(d,group,'clip:1:0',4.11,{bpm:120},1);near(o.slots[0].clips[0].start,3);near(o.formations[0].time,3.5)});
test('V31 drag across unselected event has stable visual delta despite sorting',()=>{const d=scene();d.slots[0].clips.push({start:9,end:10});const o=E.drag(d,['clip:0:0'],'clip:0:0',11);near(E.dragDelta(d,['clip:0:0'],'clip:0:0',11),10);near(o.slots[0].clips[1].start,11)});
for(const [label,target] of [['negative',-2],['past end',39],['non-finite',NaN]])test('V31 drag refusal '+label+' is immutable',()=>{const d=scene(),before=JSON.stringify(d);assert.throws(()=>E.drag(d,group,'clip:0:0',target));assert.equal(JSON.stringify(d),before)});
test('V31 drag requires anchor to be selected',()=>assert.throws(()=>E.drag(scene(),['camera:0'],'clip:0:0',3)));
test('V31 merge reverses a split without changing sampled source time',()=>{const d=scene(),s=E.split(d,['clip:0:0'],3),o=E.merge(s,['clip:0:1','clip:0:0']);assert.equal(o.slots[0].clips.length,1);assert.deepEqual(o.slots[0].clips,d.slots[0].clips)});
test('V31 multi-lane merge is atomic and accepts independently split clips',()=>{const s=E.split(scene(),['clip:0:0','clip:1:0'],4),o=E.merge(s,['clip:0:0','clip:0:1','clip:1:1','clip:1:0']);assert.equal(o.slots[0].clips.length,1);assert.equal(o.slots[1].clips.length,1)});
for(const [name,mutate] of [
 ['source mismatch',d=>d.slots[0].clips[1].motionStart+=.2],
 ['rate mismatch',d=>d.slots[0].clips[1].rate=2],
 ['gap',d=>d.slots[0].clips[1].start+=.1],
 ['intermediate blend',d=>d.slots[0].clips[1].transition=.1],
 ['different camera flag',d=>d.slots[0].clips[1].camera=true],
 ['unknown extension',d=>d.slots[0].clips[1].futureRootMode='other']
])test('V31 merge rejects '+name+' without mutation',()=>{const d=E.split(scene(),['clip:0:0'],3);mutate(d);const before=JSON.stringify(d);assert.throws(()=>E.merge(d,['clip:0:0','clip:0:1']));assert.equal(JSON.stringify(d),before)});
test('V31 merge rejects lone clip, non-clip key and nonadjacent selection',()=>{assert.throws(()=>E.merge(scene(),['clip:0:0']));assert.throws(()=>E.merge(scene(),['camera:0']));const d=E.split(E.split(scene(),['clip:0:0'],3),['clip:0:1'],5);assert.throws(()=>E.merge(d,['clip:0:0','clip:0:2']))});
test('V31 synchronized split retains source samples through tempo changes',()=>{const d=scene();d.rhythm={bpm:120,tempoMap:[{time:0,bpm:120},{time:2,bpm:180},{time:4,bpm:60}]};d.slots[0].clips[0].sourceBpm=90;const o=E.split(d,['clip:0:0'],3);for(const t of [3,3.5,4,5,6.99])near(PulseMotionSync.sourceTime(d.slots[0].clips[0],t,d.rhythm).local,PulseMotionSync.sourceTime(o.slots[0].clips[1],t,d.rhythm).local);const m=E.merge(o,['clip:0:0','clip:0:1']);near(m.slots[0].clips[0].end,7)});
test('V31 synchronized clip without rhythm follows existing natural clock',()=>{const d=scene();d.slots[0].clips[0].sourceBpm=120;const o=E.split(d,['clip:0:0'],3);near(o.slots[0].clips[1].motionStart,5)});
test('V31 beat-loop phase is explicitly refused not approximated',()=>{const d=scene();Object.assign(d.slots[0].clips[0],{sourceBpm:120,loopBeats:4});assert.throws(()=>E.split(d,['clip:0:0'],3),/boucle/)});
test('V31 same-model transfer preserves lane offsets and does not mutate clipboard',()=>{const d=scene(),copy=E.copyForTransfer(d,['clip:0:0','clip:1:0','camera:0'],[{id:'same'}]),before=JSON.stringify(copy),o=E.pasteTo(d,copy,12,1,[{id:'same'}]);near(o.slots[1].clips[1].start,12);near(o.slots[2].clips[0].start,13);near(o.cameraTrack[1].time,12);assert.equal(JSON.stringify(copy),before)});
for(const [label,target,models] of [['different model',1,[{id:'a'},{id:'b'}]],['unknown model',1,[]],['overflow',3,[{id:'a'}]]])test('V31 transfer refuses '+label,()=>{const d=scene(),b=JSON.stringify(d);assert.throws(()=>E.pasteTo(d,E.copy(d,['clip:0:0']),12,target,models));assert.equal(JSON.stringify(d),b)});
test('V31 native original-lane paste remains compatible',()=>{const d=scene(),b=E.copy(d,['clip:0:0']);assert.deepEqual(E.pasteTo(d,b,12,null),E.paste(d,b,12))});
test('V31 audition and merge shortcuts leave typing untouched',()=>{assert.equal(E.shortcut({key:' '}),'dPlay');assert.equal(E.shortcut({key:'m'}),'dMerge');assert.equal(E.shortcut({key:' '},true),null)});
function fixture(){const sources=[],gain={gain:{value:0,setTargetAtTime(v){this.value=v}},connect(){},disconnect(){this.disconnected=true}};const ctx={currentTime:0,destination:{},createGain:()=>gain,createBufferSource(){const s={playbackRate:{value:1},connect(){},disconnect(){this.disconnected=true},start(t,p){this.offset=p;this.started=t},stop(t){this.stopAt=t}};sources.push(s);return s}};return {a:new Audio(ctx,{duration:40},30),ctx,sources,gain};}
test('V31 audition follows audio clock not UI ticks',()=>{const {a,ctx}=fixture();a.play(3);ctx.currentTime=2;near(a.time,5);a.pause();ctx.currentTime=9;near(a.time,5)});
test('V31 audition uses source loop points and modulo cursor',()=>{const {a,ctx,sources}=fixture();a.setLoop(2,4,true);a.play(3);assert.equal(sources[0].loop,true);near(sources[0].loopStart,2);near(sources[0].loopEnd,4);ctx.currentTime=5.5;near(a.time,2.5);a.pause();near(a.time,2.5)});
test('V31 rate change preserves cursor and detaches outgoing source',()=>{const {a,ctx,sources}=fixture();a.play(1);ctx.currentTime=2;a.setRate(.5);near(a.time,3);assert.equal(sources[0].disconnected,true);ctx.currentTime=4;near(a.time,4)});
test('V31 native ended callback cannot stop a replacement source',()=>{const {a,sources}=fixture();a.play(0);const oldEnd=sources[0].onended;a.seek(4);oldEnd();assert.equal(a.playing,true);near(a.time,4)});
test('V31 natural end stops cursor at shorter declared duration',()=>{const {a,ctx,sources}=fixture();a.play(2);near(sources[0].stopAt,28);ctx.currentTime=29;sources[0].onended();near(a.time,30);assert.equal(a.playing,false)});
test('V31 seek when paused is silent and seek to end never starts audio',()=>{const {a,sources}=fixture();a.seek(3);assert.equal(sources.length,0);assert.equal(a.play(30),false);assert.equal(sources.length,0)});
test('V31 loop activation outside range starts at A',()=>{const {a}=fixture();a.play(10);a.setLoop(2,4,true);near(a.time,2)});
test('V31 disabling loop preserves current modulo cursor',()=>{const {a,ctx}=fixture();a.setLoop(2,4,true);a.play(3);ctx.currentTime=5.5;a.setLoop(0,0,false);near(a.time,2.5);ctx.currentTime=6.5;near(a.time,3.5)});
test('V31 disposal disconnects only its own nodes and is idempotent',()=>{const {a,sources,gain}=fixture();a.play();a.dispose();a.dispose();assert.equal(a.disposed,true);assert.equal(gain.disconnected,true);assert.equal(sources[0].disconnected,true);assert.throws(()=>a.play());assert.throws(()=>a.seek(1))});
for(const [name,fn] of [['NaN seek',a=>a.seek(NaN)],['negative seek',a=>a.seek(-1)],['rate zero',a=>a.setRate(0)],['huge rate',a=>a.setRate(3)],['loop overflow',a=>a.setLoop(2,31,true)],['loop reversed',a=>a.setLoop(4,2,true)],['tiny loop',a=>a.setLoop(2,2.01,true)],['volume NaN',a=>a.setVolume(NaN)]])test('V31 invalid audio '+name+' leaves live playback unchanged',()=>{const {a}=fixture();a.play(5);const source=a.source;assert.throws(()=>fn(a));assert.equal(a.source,source);assert.equal(a.playing,true);near(a.time,5)});

test('V31 stale clipboard model proof cannot be reinterpreted after changing source model',()=>{const d=scene();d.slots[0].modelAssetId='old';d.slots[2].modelAssetId='new';const copy=E.copyForTransfer(d,['clip:0:0']);d.slots[0].modelAssetId='new';assert.throws(()=>E.pasteTo(d,copy,12,2),/Modèles/)});
