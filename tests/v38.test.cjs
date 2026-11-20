'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
require('../src/core.js');
const C=require('../src/academy.js');
const P=require('../src/progression.js');
const score=(songId,chartId,extra={})=>({songId,chartId,accuracy:96,fullCombo:false,holdBonus:0,...extra});
const session=(songId,difficulty,mode='play')=>({songId,difficulty,mode,accuracy:91,fullCombo:false});
const full=()=>{
 const scores=[];
 for(let i=0;i<10;i++)scores.push(score('song-'+i,'chart-'+i,{accuracy:99,fullCombo:true,holdBonus:700}));
 const sessions=C.DIFFICULTIES.map((d,i)=>session('song-'+i,d));
 const academy={pulse:{completed:true,accuracy:95,attempts:1},holds:{completed:true,accuracy:94,attempts:2},slides:{completed:true,accuracy:93,attempts:2}};
 return {scores,sessions,academy};
};
test('V38 progression starts empty without inventing a record',()=>{
 const state=P.evaluate({});
 assert.equal(state.xp,0);assert.equal(state.level,1);assert.deepEqual(state.unlocked,[]);
 assert.ok(state.objectives.every(o=>!o.done&&o.xp===0));
 assert.equal(state.objectives.length,P.OBJECTIVES.length);
});
test('V38 levels follow the published thresholds',()=>{
 for(const [xp,level] of [[0,1],[149,1],[150,2],[399,2],[400,3],[800,4],[1300,5],[1899,5],[1900,6]])assert.equal(P.levelFor(xp).level,level,xp);
 assert.deepEqual(P.unlockedIds(799),[]);assert.deepEqual(P.unlockedIds(800),['aurora']);assert.deepEqual(P.unlockedIds(1300),['aurora','ember']);
});
test('V38 a first full combo credits each objective once',()=>{
 const input={scores:[score('s','c',{accuracy:97,fullCombo:true})]};
 const a=P.evaluate(input),b=P.evaluate(input);
 assert.deepEqual(a.objectives.filter(o=>o.done).map(o=>o.id),['first-live','first-fc','rank-a']);
 assert.equal(a.xp,450);assert.equal(b.xp,a.xp);
});
test('V38 repeated plays of one chart never forge ten distinct clears',()=>{
 const scores=Array.from({length:10},()=>score('same','same-chart'));
 const state=P.evaluate({scores});
 assert.equal(state.objectives.find(o=>o.id==='ten-clears').done,false);
 assert.equal(state.objectives.find(o=>o.id==='ten-clears').count,1);
});
test('V38 distinct songs, difficulties and academy lessons are counted',()=>{
 const input={scores:[score('a','a1'),score('b','b1'),score('c','c1'),score('d','d1'),score('e','e1')],sessions:C.DIFFICULTIES.map((d,i)=>session('s'+i,d)),academy:{pulse:{completed:true},holds:{completed:true},slides:{completed:true},chords:{completed:false}}};
 const state=P.evaluate(input),ids=state.objectives.filter(o=>o.done).map(o=>o.id);
 for(const id of ['five-pieces','five-tiers','academy-three'])assert.ok(ids.includes(id),id);
 assert.equal(state.objectives.find(o=>o.id==='academy-three').count,3);
});
test('V38 all objectives unlock the final level without changing the input',()=>{
 const input=full(),snapshot=structuredClone(input),state=P.evaluate(input);
 assert.ok(state.objectives.every(o=>o.done),state.objectives.filter(o=>!o.done).map(o=>o.id).join(','));
 assert.equal(state.xp,2250);assert.equal(state.level,6);assert.deepEqual(state.unlocked,['aurora','ember']);
 assert.deepEqual(input,snapshot);
});
test('V38 malformed records are ignored instead of inventing progress',()=>{
 const state=P.evaluate({scores:[null,{songId:'x',accuracy:NaN},{songId:3,accuracy:99},score('ok','ok')],sessions:[null,{songId:'x',mode:'autoplay'}],academy:{bad:'yes',pulse:{completed:'true'}}});
 assert.equal(state.objectives.find(o=>o.id==='first-live').count,1);
 assert.equal(state.objectives.find(o=>o.id==='academy-three').count,0);
});
test('V38 academy exposes eight original lessons with valid playable charts',()=>{
 assert.equal(C.LESSONS.length,8);
 assert.equal(new Set(C.LESSONS.map(l=>l.id)).size,8);
 assert.deepEqual(C.LESSONS.slice(-2).map(l=>l.id),['timing','review']);
 for(const lesson of C.LESSONS){
  const chart=C.academyChart(lesson);
  assert.equal(chart.notes.length>0,true,lesson.id);
  assert.ok(chart.notes.every(n=>Number.isFinite(n.time)&&n.time>=0&&n.lane>=0&&n.lane<=5));
  assert.equal(chart.academyLesson,lesson.id);
 }
 const lesson=C.LESSONS.find(l=>l.id==='review');
 assert.equal(C.lessonPassed(lesson,{total:10,accuracy:95,counts:{MISS:0,WRONG:0},holdBonus:0},1),true);
 assert.equal(C.lessonPassed(lesson,{total:10,accuracy:95,counts:{MISS:1,WRONG:0},holdBonus:0},1),false);
});
test('V38 two new original demos produce five deterministic playable levels',()=>{
 assert.equal(C.DEMOS.length,5);
 assert.equal(new Set(C.DEMOS.map(d=>d.id)).size,5);
 for(const demo of C.DEMOS.slice(-2)){
  for(let level=0;level<5;level++){
   const chart=C.demoChart(demo,level);
   assert.equal(chart.notes.length>0,true,`${demo.id}/${level}`);
   assert.ok(chart.notes.every(n=>n.time>0&&n.time<7200));
  }
  const a=C.synthDemo({...demo,bars:2}),b=C.synthDemo({...demo,bars:2});
  assert.deepEqual(a.samples,b.samples);
  let peak=0;for(const v of a.samples){assert.ok(Number.isFinite(v));peak=Math.max(peak,Math.abs(v));}
  assert.ok(peak>.5&&peak<=.851);
 }
});
