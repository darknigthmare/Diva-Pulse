'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const C = require('../src/core.js');
require('../src/creator.js'); require('../src/precision-core.js');
const D = require('../src/director-core.js'), E = require('../src/director-workflow.js');
const near = (a,b) => assert.ok(Math.abs(a-b)<1e-7, `${a} != ${b}`);
const variable = {bpm:120, tempoMap:[{time:0,bpm:120},{time:3.3,bpm:60}], offset:0, gridOffset:0};
const scene = () => D.normalizeDirector({duration:40,count:2,slots:[{clips:[{id:'a',start:1.13,end:5.13,rate:1.5,motionStart:2,transition:.2}]},{clips:[{start:2.13,end:6.13}]}],cameraTrack:[{time:1.63,yaw:35}],lightTrack:[{time:2.13}]});
test('V30 grid crosses BPM boundary without resetting beat phase',()=>near(E.musicalSnap(3.52,variable,1),3.7));
test('V30 nearest point compares real seconds across tempo change',()=>near(E.musicalSnap(3.31,variable,1),3));
test('V30 grid includes chart offset and grid origin independently',()=>near(E.musicalSnap(3.52,{...variable,offset:.25,gridOffset:.2},1),3.45));
test('V30 actual bars follow 3/4 then 7/8 meter',()=>near(E.musicalSnap(4.6,{bpm:120,meterMap:[{beat:0,numerator:3,denominator:4},{beat:6,numerator:7,denominator:8}]},'bar'),4.75));
test('V30 positive origin does not invent a zero-time off-grid point',()=>near(E.musicalSnap(.01,{bpm:120,offset:.25,gridOffset:.2},1),.45));
test('V30 final grid point stays inside song duration',()=>near(E.musicalSnap(1.19,{bpm:120},1,1.2),1));
test('V30 free mode retains exact cursor including endpoints',()=>{near(E.musicalSnap(0,{},0,1),0);near(E.musicalSnap(1,{},0,1),1)});
test('V30 subdivision handles triplets',()=>near(E.musicalSnap(.36,{bpm:120},1/3),1/3));
for (const [label,time,chart,grid,duration] of [
 ['NaN',NaN,{},1,40],['infinite',Infinity,{},1,40],['negative',-1,{},1,40],
 ['after end',41,{},1,40],['invalid duration',1,{},1,0],['unknown subdivision',1,{},.7,40],
 ['duplicate tempo',1,{bpm:120,tempoMap:[{time:0,bpm:120},{time:0,bpm:60}]},1,40],
 ['bad BPM',1,{bpm:120,tempoMap:[{time:0,bpm:0}]},1,40],
 ['bad meter',1,{meterMap:[{beat:0,numerator:0,denominator:4}]},'bar',40],
 ['bad offset',1,{offset:Infinity},1,40],['no valid grid point',.05,{bpm:120,offset:.25,gridOffset:.2},1,.1]
]) test('V30 rejects '+label,()=>assert.throws(()=>E.musicalSnap(time,chart,grid,duration)));
test('V30 mixed group alignment preserves duration and relative offsets',()=>{const d=scene(),saved=JSON.stringify(d),out=E.align(d,['clip:0:0','clip:1:0','camera:0','light:0'],{bpm:120},1);near(out.slots[0].clips[0].start,1);near(out.slots[0].clips[0].end,5);near(out.slots[1].clips[0].start,2);near(out.cameraTrack[0].time,1.5);near(out.lightTrack[0].time,2);assert.equal(JSON.stringify(d),saved)});
test('V30 whole group alignment refuses collision atomically',()=>{const d=scene();d.cameraTrack=[{time:1.13},{time:1}];const saved=JSON.stringify(d);assert.throws(()=>E.align(d,['camera:1'],{bpm:120},1));assert.equal(JSON.stringify(d),saved)});
test('V30 splitting retains source motion time for every later sample',()=>{const d=scene(),saved=JSON.stringify(d),out=E.split(d,['clip:0:0'],3);assert.equal(out.slots[0].clips.length,2);const [a,b]=out.slots[0].clips;near(a.end,3);near(b.start,3);near(b.end,5.13);assert.equal(b.transition,0);assert.notEqual(a.id,b.id);for(const t of [3,3.1,4,5])near((t-b.start)*b.rate+b.motionStart,(t-d.slots[0].clips[0].start)*d.slots[0].clips[0].rate+d.slots[0].clips[0].motionStart);assert.equal(JSON.stringify(d),saved)});
test('V30 split handles multiple dancers in a single edit',()=>{const out=E.split(scene(),['clip:0:0','clip:1:0'],3);assert.equal(out.slots[0].clips.length,2);assert.equal(out.slots[1].clips.length,2)});
test('V30 split IDs do not collide with existing suffixes',()=>{const d=scene();d.slots[1].clips[0].id='a-split-1';const out=E.split(d,['clip:0:0'],3);assert.equal(out.slots[0].clips[1].id,'a-split-2')});
for(const [label,make,keys,t] of [
 ['mixed keys',scene,['clip:0:0','camera:0'],3],['edge',scene,['clip:0:0'],1.13],
 ['outside one selected clip',scene,['clip:0:0','clip:1:0'],1.5],['active transition',scene,['clip:0:0'],1.2],
 ['source BPM',()=>{const s=scene();s.slots[0].clips[0].sourceBpm=120;return s},['clip:0:0'],3],
 ['stale index',scene,['clip:0:99'],3],['duplicate',scene,['clip:0:0','clip:0:0'],3],['invalid time',scene,['clip:0:0'],NaN]
])test('V30 split rejects '+label+' without partial mutation',()=>{const d=make(),before=JSON.stringify(d);assert.throws(()=>E.split(d,keys,t));assert.equal(JSON.stringify(d),before)});
test('V30 split rejects 513th clip atomically',()=>{const d=scene();d.duration=7200;d.slots[0].clips=Array.from({length:512},(_,i)=>({start:i*10,end:i*10+5}));const before=JSON.stringify(d);assert.throws(()=>E.split(d,['clip:0:0'],2));assert.equal(JSON.stringify(d),before)});
for(const [key,flags,expected] of [['a',{ctrlKey:true},'dSelectAll'],['v',{metaKey:true},'dPaste'],['z',{ctrlKey:true},'dUndo'],['z',{metaKey:true,shiftKey:true},'dRedo'],['y',{ctrlKey:true},'dRedo'],['s',{ctrlKey:true},'dSave'],['Delete',{},'dDeleteSelected'],['s',{},'dSplit'],['g',{},'dAlignSelected'],['ArrowRight',{},'cursorForward']])test('V30 keyboard routes '+key+JSON.stringify(flags),()=>assert.equal(E.shortcut({key,...flags}),expected));
test('V30 keyboard does not hijack typing, composition, repeats or browser shortcuts',()=>{assert.equal(E.shortcut({key:'a',ctrlKey:true},true),null);for(const event of [{key:'s',isComposing:true},{key:'Delete',repeat:true},{key:'a',ctrlKey:true,altKey:true},{key:'w',ctrlKey:true},{key:'s',shiftKey:true}])assert.equal(E.shortcut(event),null)});
test('V30 Director JSON roundtrip retains scene and input ownership',()=>{const d=scene(),raw={format:'DIVA-PULSE-DIRECTOR',version:19,director:d};const out=E.readProject(raw,40,[]);assert.deepEqual(out,d);out.slots[0].clips[0].start=0;assert.equal(d.slots[0].clips[0].start,1.13)});
for(const raw of [null,{}, {format:'DIVA-PULSE-DIRECTOR',version:20,director:{}},{format:'DIVA-PULSE-DIRECTOR',version:19,director:null},{format:'DIVA-PULSE-DIRECTOR',version:19,director:[]}])test('V30 Director JSON rejects unsupported structure '+JSON.stringify(raw),()=>assert.throws(()=>E.readProject(raw,40,[])));
test('V30 Director JSON rejects missing media before any persistence',()=>{const d=scene();d.slots[0].clips[0].motionAssetId='missing';assert.throws(()=>E.readProject({format:'DIVA-PULSE-DIRECTOR',version:19,director:d},40,[]))});
test('V30 musical snapping is idempotent on a deterministic tempo corpus',()=>{for(let i=0;i<300;i++){const chart={bpm:90,tempoMap:[{time:0,bpm:90},{time:3.3,bpm:60+(i%150)}],offset:(i%10)/100,gridOffset:.12};const t=1+(i*37%1800)/100;const a=E.musicalSnap(t,chart,[.25,.5,1,4][i%4],40);near(a,E.musicalSnap(a,chart,[.25,.5,1,4][i%4],40))}});
