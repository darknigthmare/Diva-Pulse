/* DIVA PULSE V39 — première visite non bloquante : quatre glyphes, HOLD et CHAIN.
   Aucun minuteur, aucune donnée envoyée. Sans stockage local, la carte revient à
   l'ouverture suivante et aucune erreur n'est levée. */
(function(root){
'use strict';
const KEY='diva-pulse.first-visit.v39';
const CLICKS_TO_FIRST_NOTE=1;
const GLYPHS=Object.freeze([
 Object.freeze({lane:0,symbol:'△',key:'D',label:'Triangle'}),
 Object.freeze({lane:1,symbol:'□',key:'F',label:'Carré'}),
 Object.freeze({lane:2,symbol:'×',key:'J',label:'Croix'}),
 Object.freeze({lane:3,symbol:'○',key:'K',label:'Cercle'})
]);
const RULES=Object.freeze([
 Object.freeze({id:'hold',title:'HOLD',text:'Garde la touche appuyée pour cumuler le bonus, jusqu’à cinq secondes. Relâcher termine le bonus ; ce n’est pas une note longue de Project DIVA F.'}),
 Object.freeze({id:'chain',title:'CHAIN',text:'Enchaîne les notes sans rater. Un MISS remet la série à zéro ; la précision et le rang restent calculés par le moteur de rythme.'})
]);
function storageOf(){try{return root.localStorage||null;}catch{return null;}}
function readState(storage){
 let store=storage;
 if(store===undefined)store=storageOf();
 try{
  const raw=store&&typeof store.getItem==='function'?store.getItem(KEY):null;
  if(!raw)return {seen:false,skipped:false,replays:0,available:!!store};
  const parsed=JSON.parse(raw),state=parsed&&typeof parsed==='object'?parsed:{};
  return {
   seen:state.seen===true,
   skipped:state.skipped===true,
   replays:Number.isInteger(state.replays)&&state.replays>=0?state.replays:0,
   available:true
  };
 }catch{return {seen:false,skipped:false,replays:0,available:false};}
}
function writeState(patch,storage){
 let store=storage;
 if(store===undefined)store=storageOf();
 try{
  if(!store||typeof store.setItem!=='function')return false;
  const current=readState(store),next=Object.assign({},current,patch||{});
  store.setItem(KEY,JSON.stringify({
   seen:next.seen===true,
   skipped:next.skipped===true,
   replays:Number.isInteger(next.replays)&&next.replays>=0?next.replays:0
  }));
  return true;
 }catch{return false;}
}
function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function glyphList(){return GLYPHS.map(g=>`<li><b aria-hidden="true">${g.symbol}</b><span>${esc(g.label)}</span><kbd>${g.key}</kbd></li>`).join('');}
function rulesText(){return RULES.map(r=>`<b>${r.title}</b> ${esc(r.text)}`).join(' ');}
function cardHtml(){
 return `<section id="firstVisitCard" class="first-visit-card" aria-labelledby="firstVisitTitle">
  <div class="first-visit-head"><span class="eyebrow">PREMIÈRE VISITE · SANS MINUTEUR</span><button id="firstVisitSkip" class="subtle" type="button">PASSER</button></div>
  <h2 id="firstVisitTitle">UNE NOTE, PUIS LE RESTE.</h2>
  <p>Quatre glyphes descendent vers quatre cibles : appuie quand les deux coïncident.</p>
  <ul class="first-visit-glyphs" aria-label="Glyphes et touches">${glyphList()}</ul>
  <p class="first-visit-rules"><b>HOLD</b> garde la touche appuyée · <b>CHAIN</b> enchaîne les notes sans rater. Le détail reste dans « Comment jouer ? ».</p>
  <div class="first-visit-actions"><button id="firstVisitStart" class="primary" type="button">JOUER MA PREMIÈRE NOTE ▶</button><button id="firstVisitDetail" type="button">VOIR LE GUIDE</button></div>
 </section>`;
}
function guideHtml(){
 return `<div class="eyebrow">PREMIÈRE VISITE / GUIDE LOCAL</div><h2>QUATRE GLYPHES. DEUX RÈGLES.</h2>
  <p>Les symboles arrivent sur leurs cibles au rythme du morceau. Appuie à l’instant où les deux coïncident, sans chercher à suivre la mélodie.</p>
  <ul class="first-visit-glyphs" aria-label="Glyphes et touches">${glyphList()}</ul>
  <ol class="first-visit-steps">
   <li>Choisis un morceau et une difficulté dans la bibliothèque.</li>
   <li>Après le décompte, les glyphes arrivent sur quatre lignes.</li>
   <li>Appuie sur △ □ × ○ avec <b>D F J K</b> ; <b>S</b> et <b>L</b> servent aux slides.</li>
   <li>Échap met en pause. Les records restent locaux et réservés au mode normal.</li>
  </ol>
  <p>${rulesText()}</p>
  <p class="muted">Aucun minuteur, aucune aide automatique. Le bouton ci-dessous lance le premier morceau disponible.</p>
  <div class="buttons"><button id="firstVisitGuideStart" class="primary" type="button">JOUER MA PREMIÈRE NOTE</button><button id="firstVisitGuideLater" type="button">PLUS TARD</button></div>`;
}
function install(app){
 if(!app||app.__firstVisit39)return;
 app.__firstVisit39=true;
 const doc=()=>root.document;
 const card=()=>doc().getElementById('firstVisitCard');
 const hide=()=>{const node=card();if(node)node.hidden=true;};
 const startFirst=async()=>{
  const songs=Array.isArray(app.songs)?app.songs:[];
  const song=songs.find(item=>item&&item.builtin)||songs[0];
  if(!song){app.toast('Aucun morceau disponible pour la première visite.',true);return;}
  writeState({seen:true,skipped:false});
  hide();
  try{
   if(app.song?.id!==song.id)await app.selectSong(song.id);
   await app.showView('library');
   await app.run(()=>app.startGame('play'),'Préparation de ta première note…');
   if(app.view!=='game'){
    writeState({seen:false});
    ensure();
    app.toast('La lecture n’a pas démarré. Vérifie la sortie audio, puis réessaie.',true);
   }
  }catch(error){
   writeState({seen:false});
   ensure();
   app.toast(error?.message||'La première visite n’a pas pu démarrer.',true);
  }
 };
 const openGuide=replay=>{
  if(replay)writeState({replays:readState().replays+1});
  app.openModal(guideHtml());
  doc().getElementById('firstVisitGuideStart').onclick=()=>{app.closeModal();startFirst();};
  doc().getElementById('firstVisitGuideLater').onclick=()=>{writeState({seen:true,skipped:true});hide();app.closeModal();};
 };
 const bind=()=>{
  const node=card();
  if(!node||node.dataset.bound==='1')return;
  node.dataset.bound='1';
  doc().getElementById('firstVisitSkip').onclick=()=>{writeState({seen:true,skipped:true});hide();};
  doc().getElementById('firstVisitDetail').onclick=()=>openGuide(false);
  doc().getElementById('firstVisitStart').onclick=()=>startFirst();
 };
 const ensure=()=>{
  if(card())return;
  const anchor=doc().querySelector('.library-left .intro')||doc().getElementById('progressionCard')||doc().querySelector('.library-tools');
  if(!anchor)return;
  anchor.insertAdjacentHTML('afterend',cardHtml());
  bind();
 };
 const render=()=>{if(readState().seen)return;ensure();};
 if(typeof app.init==='function'){
  const init=app.init.bind(app);
  app.init=async function(...args){const out=await init(...args);render();return out;};
 }
 if(typeof app.help==='function'){
  const help=app.help.bind(app);
  app.help=function(...args){
   const out=help(...args);
   const host=doc().getElementById('modalContent');
   if(host&&!host.querySelector('#firstVisitReplay')){
    host.insertAdjacentHTML('beforeend','<div class="buttons"><button id="firstVisitReplay" type="button">REVOIR LA PREMIÈRE VISITE</button></div>');
    host.querySelector('#firstVisitReplay').onclick=()=>openGuide(true);
   }
   return out;
  };
 }
 render();
}
root.PulseFirstVisit={KEY,CLICKS_TO_FIRST_NOTE,GLYPHS,RULES,readState,writeState,install};
if(typeof module!=='undefined'&&module.exports)module.exports=root.PulseFirstVisit;
})(globalThis);
