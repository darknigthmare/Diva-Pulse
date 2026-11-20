/* DIVA PULSE V38 — erreurs actionnables et états vides cohérents. Le toast existant garde son texte. */
(function(root){
'use strict';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function install(app){
 if(!app||app.__uiStates38)return;
 app.__uiStates38=true;
 let lastError=null;
 let host=document.getElementById('errorState');
 if(!host){
  host=document.createElement('div');
  host.id='errorState';host.hidden=true;
  host.setAttribute('role','alert');host.setAttribute('aria-live','assertive');
  document.body.append(host);
 }
 const clear=()=>{host.hidden=true;host.replaceChildren();};
 const show=(message,retry)=>{
  const diagnostic=()=>JSON.stringify({version:root.PulseCore?.VERSION,view:app.view,song:app.song?.title||null,message},null,2);
  host.innerHTML=`<div class="error-state-card"><strong>ACTION INTERROMPUE</strong><p>${esc(message)}</p><div class="error-actions">${retry?'<button type="button" data-error-act="retry">RÉESSAYER</button>':''}<button type="button" data-error-act="detail">COPIER LE DÉTAIL</button><button type="button" data-error-act="close">FERMER</button></div></div>`;
  host.hidden=false;
  host.querySelector('[data-error-act="close"]').onclick=clear;
  const retryButton=host.querySelector('[data-error-act="retry"]');
  if(retryButton)retryButton.onclick=()=>{clear();retry();};
  host.querySelector('[data-error-act="detail"]').onclick=async()=>{
   const text=diagnostic();
   try{await navigator.clipboard.writeText(text);app.toast('Détail copié. Aucune donnée n’est envoyée.');}
   catch{
    app.openModal(`<div class="eyebrow">DIAGNOSTIC</div><h2>DÉTAIL TECHNIQUE</h2><p>Copier ce texte pour le support. Il reste local.</p><textarea id="errorDetail" rows="10" readonly></textarea>`);
    const field=document.getElementById('errorDetail');field.value=text;field.select();
   }
  };
 };
 const toast=app.toast.bind(app);
 app.toast=function(text,error=false,...rest){
  if(error)lastError=String(text??'');
  return toast(text,error,...rest);
 };
 const run=app.run.bind(app);
 app.run=async function(fn,title){
  lastError=null;
  const out=await run(fn,title);
  if(lastError)show(lastError,()=>app.run(fn,title));
  return out;
 };
 const renderLibrary=app.renderLibrary.bind(app);
 app.renderLibrary=function(){
  const out=renderLibrary();
  const empty=document.querySelector('#songList .empty-list');
  if(empty){
   empty.innerHTML='<strong>AUCUN RÉSULTAT</strong><p>Aucun morceau ne correspond à cette recherche ou à ce filtre.</p><div class="empty-actions"><button type="button" data-empty="clear">EFFACER LA RECHERCHE</button></div>';
   empty.querySelector('[data-empty="clear"]').onclick=()=>{
    document.getElementById('searchSongs').value='';
    const favorite=document.getElementById('filterFavorite');
    favorite.setAttribute('aria-pressed','false');favorite.textContent='♡';
    this.favoriteFilter=false;
    this.renderLibrary();
   };
  }
  return out;
 };
}
root.PulseUIStates={install};
})(globalThis);
