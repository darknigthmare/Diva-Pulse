/* DIVA PULSE V38 — états vides, erreurs et reprise uniformes. Le toast existant garde son texte. */
(function(root){
'use strict';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function install(app){
 if(!app||app.__uiStates38)return;
 app.__uiStates38=true;
 let host=document.getElementById('errorState');
 if(!host){
  host=document.createElement('div');
  host.id='errorState';host.hidden=true;
  host.setAttribute('role','alert');host.setAttribute('aria-live','assertive');
  document.body.append(host);
 }
 app.showErrorState=function(error,{retry=null,detail=null}={}){
  const message=String(error?.message||error||'Erreur inconnue.');
  const diagnostic=()=>{
   const payload={version:root.PulseCore?.VERSION,view:this.view,song:this.song?.title||null,message,at:new Date().toISOString()};
   try{return JSON.stringify({...payload,...(typeof detail==='function'?detail():detail||{})},null,2);}catch{return JSON.stringify(payload,null,2);}
  };
  host.innerHTML=`<div class="error-state-card"><strong>ACTION INTERROMPUE</strong><p>${esc(message)}</p><div class="error-actions">${retry?'<button type="button" data-error-act="retry">RÉESSAYER</button>':''}<button type="button" data-error-act="detail">COPIER LE DÉTAIL</button><button type="button" data-error-act="close">FERMER</button></div></div>`;
  host.hidden=false;
  host.querySelector('[data-error-act="close"]').onclick=()=>this.clearErrorState();
  const retryButton=host.querySelector('[data-error-act="retry"]');
  if(retryButton)retryButton.onclick=()=>{this.clearErrorState();retry();};
  host.querySelector('[data-error-act="detail"]').onclick=async()=>{
   const text=diagnostic();
   try{await navigator.clipboard.writeText(text);this.toast('Détail copié. Aucune donnée n’est envoyée.');}
   catch{
    this.openModal(`<div class="eyebrow">DIAGNOSTIC</div><h2>DÉTAIL TECHNIQUE</h2><p>Copier ce texte pour le support. Il reste local.</p><textarea id="errorDetail" rows="10" readonly></textarea>`);
    const field=document.getElementById('errorDetail');field.value=text;field.select();
   }
  };
 };
 app.clearErrorState=function(){host.hidden=true;host.replaceChildren();};
 const toast=app.toast.bind(app);
 app.toast=function(text,error=false,...rest){
  if(error)app.__lastError={text:String(text??''),at:Date.now()};
  return toast(text,error,...rest);
 };
 const run=app.run.bind(app);
 app.run=async function(fn,title){
  app.__lastError=null;
  const out=await run(fn,title);
  const failure=app.__lastError;
  if(failure)this.showErrorState(new Error(failure.text),{retry:()=>this.run(fn,title)});
  return out;
 };
 const renderLibrary=app.renderLibrary.bind(app);
 app.renderLibrary=function(){
  const out=renderLibrary();
  const empty=document.querySelector('#songList .empty-list');
  if(empty){
   const none=!this.songs.length;
   empty.innerHTML=`<strong>${none?'AUCUN MORCEAU':'AUCUN RÉSULTAT'}</strong><p>${none?'Importe un audio pour créer ta bibliothèque locale.':'Aucun morceau ne correspond à cette recherche ou à ce filtre.'}</p><div class="empty-actions">${none?'<button type="button" data-empty="import">IMPORTER UN AUDIO</button>':'<button type="button" data-empty="clear">EFFACER LA RECHERCHE</button>'}<button type="button" data-empty="academy">ACADÉMIE</button></div>`;
   empty.querySelector('[data-empty="import"]')?.addEventListener('click',()=>document.getElementById('addAudio').click());
   empty.querySelector('[data-empty="clear"]')?.addEventListener('click',()=>{
    document.getElementById('searchSongs').value='';
    document.getElementById('filterFavorite').setAttribute('aria-pressed','false');
    this.favoriteFilter=false;
    this.renderLibrary();
   });
   empty.querySelector('[data-empty="academy"]')?.addEventListener('click',()=>this.academyDialog?.());
  }
  return out;
 };
}
root.PulseUIStates={install};
})(globalThis);
