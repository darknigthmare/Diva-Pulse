'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const D=require('../src/director-core.js'),E=require('../src/director-edit.js');
function scene(){return D.normalizeDirector({duration:40,count:2,slots:[{clips:[{id:'original',start:1,end:3},{start:8,end:10}]},{clips:[{start:2,end:4}]}],cameraTrack:[{time:1,yaw:35},{time:8,yaw:70}],lightTrack:[{time:2,intensity:.5}]});}
const selection=['clip:0:0','clip:1:0','camera:0','light:0'];
test('V29 enumerate typed selections across clips camera and light',()=>assert.equal(E.all(scene()).length,6));
test('V29 copy preserves relative times, lanes and original object ownership',()=>{const s=scene(),b=E.copy(s,selection);assert.equal(b.anchor,1);assert.equal(b.entries.length,4);b.entries[0].value.start=99;assert.equal(s.slots[0].clips[0].start,1);});
test('V29 mixed group movement preserves intervals and tracks',()=>{const s=scene(),out=E.move(s,selection,3);assert.equal(out.slots[0].clips[0].start,4);assert.equal(out.slots[0].clips[0].end,6);assert.equal(out.slots[1].clips[0].start,5);assert.equal(out.cameraTrack[0].time,4);assert.equal(out.lightTrack[0].time,5);assert.equal(s.cameraTrack[0].time,1);});
test('V29 clipboard paste anchors first selected event at cursor',()=>{const s=scene(),b=E.copy(s,selection),saved=JSON.stringify(b),out=E.paste(s,b,12);assert.equal(out.slots[0].clips[2].start,12);assert.equal(out.slots[1].clips[1].start,13);assert.equal(out.cameraTrack[2].time,12);assert.equal(out.lightTrack[1].time,13);assert.equal(out.slots[0].clips[2].id,'');assert.equal(JSON.stringify(b),saved);});
test('V29 group deletion handles descending indexes without deleting neighbors',()=>{const s=scene(),o=E.remove(s,['clip:0:0','clip:0:1','camera:1']);assert.equal(o.slots[0].clips.length,0);assert.equal(o.slots[1].clips.length,1);assert.equal(o.cameraTrack[0].yaw,35);assert.equal(o.cameraTrack.length,1);assert.equal(s.slots[0].clips.length,2);});
for(const [name,fn] of [
 ['negative movement',s=>E.move(s,selection,-2)],
 ['clip collision',s=>E.move(s,['clip:0:0'],7)],
 ['key collision',s=>E.move(s,['camera:0'],7)],
 ['end overflow',s=>E.move(s,selection,39)],
 ['non-finite delta',s=>E.move(s,selection,NaN)],
 ['empty selection',s=>E.copy(s,[])],
 ['duplicate selection',s=>E.copy(s,['camera:0','camera:0'])],
 ['stale selection',s=>E.move(s,['clip:0:99'],1)],
 ['invalid track',s=>E.copy(s,['form:0'])],
 ['invalid lane',s=>E.copy(s,['clip:8:0'])],
 ['missing paste',s=>E.paste(s,null,12)],
 ['collision paste',s=>E.paste(s,E.copy(s,selection),1)],
 ['paste overflow',s=>E.paste(s,E.copy(s,selection),39)],
 ['paste negative cursor',s=>E.paste(s,E.copy(s,selection),-1)],
 ['paste infinite cursor',s=>E.paste(s,E.copy(s,selection),Infinity)],
 ['unknown clipboard version',s=>E.paste(s,{...E.copy(s,selection),version:99},12)],
 ['removed dancer',s=>E.paste({...s,count:1,slots:s.slots.slice(0,1)},E.copy(s,['clip:1:0']),12)]
])test('V29 atomic refusal: '+name,()=>{const s=scene(),snapshot=JSON.stringify(s);assert.throws(()=>fn(s));assert.equal(JSON.stringify(s),snapshot);});
test('V29 snapping uses current tempo and origin',()=>{assert.equal(E.snap(1.18,120,1,0),1);assert.equal(E.snap(1.18,120,.5,.1),1.1);assert.equal(E.snap(3.3,120,4,0),4);assert.equal(E.snap(1.18,120,0),1.18);});
test('V29 snapping rejects invalid BPM and NaN',()=>{assert.throws(()=>E.snap(2,0));assert.throws(()=>E.snap(NaN));assert.throws(()=>E.snap(2,120,-1));});
function owner(){return {id:'a',title:'Test',duration:40,charts:[{id:'chart',notes:[]}],scene:{mmd:{id:'pack',assetIds:[]}}};}
test('V29 publication stages song and tombstone in a single transaction',()=>{const s=owner(),before=JSON.stringify(s),rows=E.publication(s,scene(),'pack',123);assert.deepEqual(rows.map(r=>r[0]),['songs','settings']);assert.equal(rows[1][1].director,null);assert.equal(rows[1][1].status,'applied');assert.equal(rows[1][1].id,'director-draft:a');assert.equal(JSON.stringify(s),before);assert.deepEqual(rows[0][1].charts,s.charts);});
test('V29 publication refuses stale pack ownership',()=>assert.throws(()=>E.publication(owner(),scene(),'wrong')));
test('V29 publication refuses missing asset before saving anything',()=>{const d=scene();d.slots[0].clips[0].motionAssetId='absent';assert.throws(()=>E.publication(owner(),d,'pack'));});
test('V29 applying valid edit never changes saved charts',()=>{const s=owner(),d=E.move(scene(),selection,3),rows=E.publication(s,d,'pack');assert.deepEqual(rows[0][1].charts,s.charts);assert.notEqual(rows[0][1].charts,s.charts);});
