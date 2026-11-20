/* DIVA PULSE V38 — progression locale dérivée. Aucun compte, aucun envoi, aucun double crédit. */
(function(root){
'use strict';
const C=root.PulseCore||(typeof require==='function'?require('./core.js'):null);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const finite=(v,d=0)=>Number.isFinite(v)?v:d;
const LEVELS=Object.freeze([
 {level:1,name:'DÉBUTANT',min:0},
 {level:2,name:'APPRENTI',min:150},
 {level:3,name:'RÉGULIER',min:400},
 {level:4,name:'CONFIRMÉ',min:800},
 {level:5,name:'EXPERT',min:1300},
 {level:6,name:'LÉGENDE',min:1900}
]);
const UNLOCKS=Object.freeze([
 {id:'aurora',label:'AURORA',xp:800},
 {id:'ember',label:'EMBER',xp:1300}
]);
function objective(id,title,hint,xp,target,count){return Object.freeze({id,title,hint,xp,target,count});}
const OBJECTIVES=Object.freeze([
 objective('first-live','Premier concert','Termine une partie en mode Live.',100,1,c=>c.playSessions),
 objective('first-fc','Premier FULL COMBO','Enchaîne toutes les notes sans erreur.',150,1,c=>c.fullCombos),
 objective('rank-a','Rang A','Atteins 90 % de précision sur une partition.',200,1,c=>c.maxAccuracy>=90?1:0),
 objective('five-pieces','Cinq morceaux','Joue cinq morceaux différents.',250,5,c=>c.songs),
 objective('five-tiers','Cinq difficultés','Essaie les cinq niveaux sur au moins un morceau.',300,5,c=>c.difficulties),
 objective('academy-three','Académie','Valide trois leçons de l’académie.',350,3,c=>c.lessons),
 objective('hold-500','Maîtrise du HOLD','Obtiens au moins 500 points de bonus HOLD sur une prise.',400,1,c=>c.holdBonus>=500?1:0),
 objective('ten-clears','Dix partitions','Termine dix partitions distinctes.',500,10,c=>c.chartKeys)
]);
function validScore(raw){
 return raw&&typeof raw==='object'&&typeof raw.songId==='string'&&Number.isFinite(raw.accuracy)&&raw.accuracy>=0&&raw.accuracy<=100;
}
function validSession(raw){
 return raw&&typeof raw==='object'&&typeof raw.songId==='string'&&(raw.mode==='play'||raw.mode==='no-fail');
}
function buildContext(input){
 const scores=(Array.isArray(input?.scores)?input.scores:[]).filter(validScore);
 const sessions=(Array.isArray(input?.sessions)?input.sessions:[]).filter(validSession);
 const academy=input?.academy&&typeof input.academy==='object'&&!Array.isArray(input.academy)?input.academy:{};
 const playSessions=sessions.length+scores.length;
 const fullCombos=scores.filter(r=>r.fullCombo===true).length+sessions.filter(r=>r.fullCombo===true).length;
 const maxAccuracy=scores.reduce((n,r)=>Math.max(n,r.accuracy),0);
 const songs=new Set([...scores.map(r=>r.songId),...sessions.map(r=>r.songId)]).size;
 const difficulties=new Set(sessions.map(r=>r.difficulty).filter(d=>C?.DIFFICULTIES?.includes(d))).size;
 const lessons=Object.values(academy).filter(v=>v&&v.completed===true).length;
 const holdBonus=scores.reduce((n,r)=>Math.max(n,finite(r.holdBonus)),0);
 const chartKeys=new Set(scores.map(r=>r.chartId?r.songId+'/'+r.chartId:r.songId)).size;
 return {scores,sessions,playSessions,fullCombos,maxAccuracy,songs,difficulties,lessons,holdBonus,chartKeys};
}
function levelFor(xp){
 const value=Math.max(0,finite(xp));
 let found=LEVELS[0];
 for(const level of LEVELS)if(value>=level.min)found=level;
 return found;
}
function unlockedIds(xp){
 const value=Math.max(0,finite(xp));
 return UNLOCKS.filter(u=>value>=u.xp).map(u=>u.id);
}
function evaluate(input={}){
 const ctx=buildContext(input);
 const objectives=OBJECTIVES.map(o=>{
  const count=Math.max(0,finite(o.count(ctx)));
  const progress=clamp(count/o.target,0,1);
  const done=count>=o.target;
  return {id:o.id,title:o.title,hint:o.hint,target:o.target,count,maxXp:o.xp,xp:done?o.xp:0,progress,done};
 });
 const xp=objectives.reduce((n,o)=>n+o.xp,0);
 const level=levelFor(xp);
 const next=LEVELS.find(l=>l.min>xp)||null;
 const span=next?next.min-level.min:1;
 return {
  xp,level:level.level,levelName:level.name,
  nextLevelXp:next?next.min:null,
  toNext:next?next.min-xp:0,
  progressToNext:next?clamp((xp-level.min)/span,0,1):1,
  objectives,
  unlocks:UNLOCKS.map(u=>({...u,unlocked:xp>=u.xp})),
  unlocked:unlockedIds(xp)
 };
}
function esc(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function install(app){
 if(!app||app.__progression38)return;
 app.__progression38=true;
 const $=id=>document.getElementById(id);
 const wrap=(name,fn)=>{const previous=app[name].bind(app);app[name]=(...args)=>fn(previous,...args);};
 const compute=()=>root.PulseProgression.evaluate({scores:app.scores,sessions:app.v3State?.sessions,academy:app.v5State?.academy});
 app.progression=compute;
 const ensure=()=>{
  if($('progressionCard'))return;
  const tools=document.querySelector('.library-tools');
  if(!tools)return;
  tools.insertAdjacentHTML('beforeend','<button id="progressionButton" type="button">◆ Progression</button>');
  const card=document.createElement('section');
  card.id='progressionCard';card.className='progression-card';
  card.setAttribute('aria-label','Progression locale');
  tools.after(card);
  $('progressionButton').onclick=()=>app.progressionDialog();
 };
 const render=()=>{
  ensure();
  const card=$('progressionCard'),button=$('progressionButton');
  if(!card||!button)return;
  const p=compute(),next=p.objectives.find(o=>!o.done)||null;
  card.innerHTML=`<div class="progression-head"><span>NIVEAU ${p.level} · ${p.levelName}</span><b>${p.xp} XP</b></div><div class="progression-bar" role="progressbar" aria-label="Progression du niveau" aria-valuemin="0" aria-valuemax="${p.nextLevelXp??p.xp}" aria-valuenow="${p.xp}"><i style="width:${Math.round(p.progressToNext*100)}%"></i></div><p>${next?`Prochain objectif : ${esc(next.title)} · ${Math.floor(next.count)}/${next.target}`:'Tous les objectifs actuels sont atteints.'}</p>`;
  button.textContent=`◆ Progression · ${p.level}`;
 };
 wrap('init',async previous=>{const out=await previous();render();return out;});
 wrap('renderLibrary',previous=>{const out=previous();render();return out;});
 wrap('finish',async previous=>{const out=await previous();render();return out;});
 app.progressionDialog=function(){
  const p=compute();
  const rows=p.objectives.map(o=>`<article class="objective ${o.done?'done':''}"><div><strong>${esc(o.title)}</strong><p>${esc(o.hint)}</p><div class="progression-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${o.target}" aria-valuenow="${Math.floor(o.count)}"><i style="width:${Math.round(o.progress*100)}%"></i></div><small>${Math.floor(o.count)}/${o.target} · ${o.done?`+${o.maxXp} XP`:`${o.maxXp} XP`}</small></div></article>`).join('');
  const unlocks=p.unlocks.map(u=>`<li class="${u.unlocked?'done':''}">${esc(u.label)} · ${u.unlocked?'débloqué':`${u.xp} XP`}</li>`).join('');
  this.openModal(`<div class="eyebrow">PROGRESSION / DONNÉES LOCALES</div><h2>TON PARCOURS.</h2><p>${p.xp} XP · niveau ${p.level} (${esc(p.levelName)}). La progression est recalculée depuis tes records, tes sessions et l’académie. Aucun compte, aucun envoi.</p><div class="progression-objectives">${rows}</div><h3>MODULES À DÉBLOQUER</h3><ul class="progression-unlocks">${unlocks}</ul><p class="muted">Les records des modes assistés restent séparés. Une même partition terminée deux fois ne crédite pas deux fois le même objectif.</p>`);
 };
}
root.PulseProgression={LEVELS,UNLOCKS,OBJECTIVES,evaluate,levelFor,unlockedIds,install};
if(typeof module!=='undefined'&&module.exports)module.exports=root.PulseProgression;
})(globalThis);
