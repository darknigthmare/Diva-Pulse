/* Six original practice lessons. Synthesized here; no recordings or official charts. */
(function(root){
'use strict';
const C=root.PulseCore||(typeof require==='function'?require('./core.js'):null);
const LESSONS=[
 {id:'pulse',title:'01 · Trouver la pulsation',difficulty:'EASY',hint:'Frappe × lorsque la note rejoint sa cible. Écoute la pulsation régulière.',goal:'90 % de précision, sans MISS ni WRONG.'},
 {id:'alternation',title:'02 · Les quatre symboles',difficulty:'NORMAL',hint:'Alterner △, □, × et ○. Garde les yeux sur les prochaines cibles, pas sur le clavier.',goal:'90 % de précision, sans MISS ni WRONG.'},
 {id:'chords',title:'03 · Les accords',difficulty:'HARD',hint:'Les cibles reliées se frappent ensemble. Deux mains ou des raccourcis d’accords conviennent.',goal:'90 % de précision, sans MISS ni WRONG.'},
 {id:'holds',title:'04 · Tenir le HOLD',difficulty:'HARD',hint:'Maintiens la première touche pendant que tu frappes les autres symboles. Relâcher coupe seulement le bonus.',goal:'90 %, aucun MISS/WRONG et au moins 1 600 points de bonus HOLD.',holdGoal:1600},
 {id:'slides',title:'05 · Slides et chaînes',difficulty:'HARD',hint:'Frappe la tête de chaîne, puis conserve la direction jusqu’au bout. Relâche avant la chaîne suivante.',goal:'90 % de précision, sans MISS ni WRONG.'},
 {id:'finale',title:'06 · Premier concert',difficulty:'EXTREME',hint:'Combine alternances, doubles frappes, slides et maintiens. La régularité compte davantage que la vitesse.',goal:'90 % de précision, sans MISS ni WRONG.'}
];
function academyChart(lesson) {
 const notes=[],add=(time,lane,type='tap',duration=0)=>{const i=notes.length;notes.push({id:`a-${lesson.id}-${i}`,time,lane,type,duration,x:.17+(i%7)*.105,y:.32+.25*((Math.floor(i/7))%2),angle:(i%2?1:-1)*55,distance:.7,approach:1.6});};
 for(let i=0;i<56;i++){
  const t=2+i*.5;
  if(lesson.id==='pulse'){if(i%2===0)add(t,2);}
  else if(lesson.id==='alternation')add(t,i%4);
  else if(lesson.id==='chords'){if(i%2===0){const pair=[[0,1],[2,3],[0,2],[1,3]][(i/2)%4];for(const lane of pair)add(t,lane);}}
  else if(lesson.id==='holds'){if(i%8===0)add(t,0,'hold',1.5);else if([2,4,6].includes(i%8))add(t,1+(i/2)%3);}
  else if(lesson.id==='slides'){if(i%4===0){const lane=4+(Math.floor(i/4)%2);add(t,lane,'slide');for(let k=1;k<4;k++)add(t+k*.25,lane,'chain',.25);}}
  else if(lesson.id==='finale'){if(i%8===0){add(t,0);add(t,1);}else if(i%8===4)add(t,4+(Math.floor(i/8)%2),'slide');else if(i%8===2)add(t,2,'hold',.6);else add(t,i%2?3:1);}
 }
 return C.validateChart({id:`academy-v5-${lesson.id}`,title:lesson.title,difficulty:lesson.difficulty,bpm:120,notes,source:'academy',meterMap:[{beat:0,numerator:4,denominator:4}],sections:[{id:'lesson',label:lesson.title,from:2,to:30}],academyLesson:lesson.id});
}
function academyAudio(sampleRate=22050) {
 const samples=new Float32Array(sampleRate*32),random=C.rng(535),scale=[220,261.6256,329.6276,293.6648,220,391.9954,329.6276,293.6648];
 const tone=(time,duration,hz,amp,kind)=>{const from=Math.round(time*sampleRate),n=Math.round(duration*sampleRate);for(let i=0;i<n&&from+i<samples.length;i++){const t=i/sampleRate,env=Math.min(1,t/.008)*Math.exp(-t/(duration*.27));let v;if(kind==='kick')v=Math.sin(2*Math.PI*(44*t+85*.022*(1-Math.exp(-t/.022))));else if(kind==='hat')v=(random()*2-1)*Math.exp(-t*60);else v=Math.sin(2*Math.PI*hz*t)+.18*Math.sin(2*Math.PI*hz*2*t);samples[from+i]+=v*env*amp;}};
 for(let i=0;i<56;i++){const t=2+i*.5;tone(t,.26,0,.38,'kick');tone(t,.35,scale[i%8],.13,'tone');tone(t+.25,.075,0,.07,'hat');if(i%4===0)tone(t,1.3,scale[Math.floor(i/4)%8]/2,.12,'tone');}
 const bytes=new ArrayBuffer(44+samples.length*2),view=new DataView(bytes),str=(at,s)=>[...s].forEach((c,i)=>view.setUint8(at+i,c.charCodeAt(0)));
 str(0,'RIFF');view.setUint32(4,bytes.byteLength-8,true);str(8,'WAVE');str(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,sampleRate,true);view.setUint32(28,sampleRate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);str(36,'data');view.setUint32(40,samples.length*2,true);for(let i=0;i<samples.length;i++)view.setInt16(44+i*2,Math.round(Math.max(-1,Math.min(1,samples[i]))*32767),true);
 return {samples,sampleRate,bytes};
}
function lessonPassed(lesson,result,rate=1){return rate>=1&&result.total>0&&result.accuracy>=90&&result.counts.MISS===0&&result.counts.WRONG===0&&(result.holdBonus||0)>=(lesson.holdGoal||0);}
function mergeAcademyProgress(current={},incoming={}) {
 const out=structuredClone(current);
 if(!incoming||typeof incoming!=='object'||Array.isArray(incoming))throw Error('Progression de l’académie invalide.');
 for(const lesson of LESSONS){const v=incoming[lesson.id];if(v===undefined)continue;
  if(!v||!Number.isFinite(v.accuracy)||v.accuracy<0||v.accuracy>100||!Number.isInteger(v.attempts)||v.attempts<0||v.attempts>1000000||typeof v.completed!=='boolean')throw Error('Résultat d’académie invalide.');
  const old=out[lesson.id]||{accuracy:0,completed:false,attempts:0};out[lesson.id]={accuracy:Math.max(old.accuracy||0,v.accuracy),completed:!!old.completed||v.completed,attempts:Math.max(old.attempts||0,v.attempts)};
 }
 return out;
}
Object.assign(C,{LESSONS,academyChart,academyAudio,lessonPassed,mergeAcademyProgress});
function install(app){
 const $=id=>document.getElementById(id),S=PulseServices;
 app.v5State={id:'v5-state',academy:{}};app.activeLesson=null;
 $('catalogButton').parentElement.insertAdjacentHTML('beforeend','<button id="academyButton" class="academy-entry">◇ Académie · 6 leçons</button>');
 const init=app.init.bind(app);app.init=async()=>{await init();const saved=await app.store.get('settings','v5-state');if(saved)try{app.v5State.academy=mergeAcademyProgress({},saved.academy||{});}catch(e){app.toast('Progression conservée sur disque mais non chargée : '+e.message,true);}document.documentElement.dataset.academyReady='true';};
 app.installAcademy=async function(){const existing=this.songs.find(s=>s.academyVersion===1);if(existing)return existing;
  const data=academyAudio(),blob=new Blob([data.bytes],{type:'audio/wav'}),hash=await S.fingerprint(blob),id=C.uid(),audioId=C.uid();const song={id,title:'L’ATELIER DU RYTHME',artist:'DIVA PULSE · instrumental original',duration:32,bpm:120,accent:'#ebbc82',audioAsset:audioId,audioHash:hash,charts:LESSONS.map(academyChart),scene:this.cleanSceneV3({stage:'arena',cast:['miku'],camera:'wide',dance:'step'}),lyrics:[],favorite:false,academyVersion:1};
  await this.store.atomic([['assets',{id:audioId,kind:'audio',name:'ATELIER_DU_RYTHME_120BPM.wav',blob,hash}],['songs',song]]);this.songs.push(song);this.renderLibrary();return song;
 };
 app.academyDialog=function(){this.openModal(`<div class="eyebrow">ACADÉMIE / CRÉATIONS ORIGINALES</div><h2>TES PREMIERS CONCERTS.</h2><p>Six leçons sur un instrumental de 120 BPM. Elles sont toutes accessibles. Les médailles se valident à 100 % de vitesse ; les ralentis restent disponibles dans l’entraînement.</p><div class="academy-grid">${LESSONS.map(l=>{const p=this.v5State.academy[l.id];return `<article class="lesson-card"><div class="lesson-medal">${p?.completed?'◆':'◇'}</div><h3>${l.title}</h3><p>${l.hint}</p><small>${l.goal}</small><div class="lesson-best">${p?`Meilleure précision : ${p.accuracy.toFixed(2)} % · ${p.attempts} tentative(s)`:'Pas encore jouée'}</div><button class="secondary" data-lesson="${l.id}">JOUER LA LEÇON</button></article>`;}).join('')}</div><p class="muted">Les leçons sont ajoutées à ta bibliothèque au premier lancement. Aucun média officiel n’est utilisé.</p>`);
  document.querySelectorAll('[data-lesson]').forEach(b=>b.onclick=()=>this.run(async()=>{const lesson=LESSONS.find(l=>l.id===b.dataset.lesson),song=await this.installAcademy();await this.selectSong(song.id);this.selectedChartId=`academy-v5-${lesson.id}`;this.difficulty=lesson.difficulty;this.activeLesson=lesson;this.closeModal();await this.startGame('practice',{from:2,to:30,rate:1,loop:false,academy:lesson.id,countClicks:true,preservePitch:false});},'Préparation de la leçon…'));
 };
 $('academyButton').onclick=()=>app.academyDialog();
 const start=app.startGame.bind(app);app.startGame=async function(mode,practice){if(!practice?.academy)this.activeLesson=null;return start(mode,practice);};
 const finish=app.finish.bind(app);app.finish=async function(){if(this.finishing)return;const lesson=this.activeLesson,mode=this.mode;await finish();if(!lesson||mode!=='practice'||this.gameChart?.id!==`academy-v5-${lesson.id}`||!this.lastResult)return;
  const result=this.lastResult,old=this.v5State.academy[lesson.id]||{accuracy:0,completed:false,attempts:0},passed=lessonPassed(lesson,result,this.practice.rate),next={...this.v5State,academy:{...this.v5State.academy,[lesson.id]:{accuracy:Math.max(old.accuracy,result.accuracy),completed:old.completed||passed,attempts:Math.min(1000000,old.attempts+1)}}};
  let saved=true;try{await this.store.put('settings',next);this.v5State=next;}catch(e){saved=false;this.toast('Progression non sauvegardée : '+e.message,true);}
  const box=document.createElement('div');box.className='academy-result';box.innerHTML=`<h3>${passed?'◆ LEÇON VALIDÉE':'◇ CONTINUE À T’ENTRAÎNER'}</h3><p>${lesson.title} · ${passed?'Objectif atteint.':lesson.goal}</p><small>${saved?(this.store.persistent?'Progression enregistrée localement.':'Progression temporaire : exporter le pack avant fermeture.'):'Progression non sauvegardée.'}</small><button id="backAcademy">Retour à l’académie</button>`;$('performanceStats').append(box);$('backAcademy').onclick=async()=>{await this.showView('library');this.academyDialog();};
 };
}
root.PulseAcademy=install;
if(typeof module!=='undefined'&&module.exports)module.exports=C;
})(globalThis);
