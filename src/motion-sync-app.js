(function(root){'use strict';
const S=root.PulseMotionSync,$=id=>document.getElementById(id);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function install(app){
 $('mmdPanel').insertAdjacentHTML('beforeend','<section class="mmd-import-guide"><h3>CALAGE MUSICAL DES VMD</h3><p>Indique le tempo connu d’une motion pour la synchroniser aux temps du morceau, même lorsque son tempo varie. Une analyse propose des cycles à interpréter, sans appliquer de BPM automatiquement.</p><button id="motionSyncOpen">Caler les motions sur la pulsation</button></section>');
 app.saveMotionSync=async function(profiles){
  if(!this.song?.scene?.mmd)throw Error('Importer des motions VMD avant de les caler.');
  const song=this.song,candidate=structuredClone(song),motions=candidate.scene.mmd.files.filter(f=>f.role==='motion'),ids=new Set(motions.map(f=>f.id));
  for(const id of Object.keys(profiles))if(!ids.has(id))throw Error('Motion inconnue dans le réglage.');
  for(const f of motions)if(Object.hasOwn(profiles,f.id)){f.info||={};const sync=S.normalize(profiles[f.id],Number(f.info.duration)||7200);if(sync)f.info.sync=sync;else delete f.info.sync;}
  await this.store.put('songs',candidate);Object.assign(song,candidate);this.modelLoaded=null;await this.applyScene();this.renderMMD();this.renderLibrary();return song;
 };
 $('motionSyncOpen').onclick=()=>{
  const files=app.song?.scene?.mmd?.files?.filter(f=>f.role==='motion')||[];
  if(!files.length)return app.toast('Aucune motion VMD : importer un pack contenant ses animations.');
  app.openModal(`<div class="eyebrow">22 / VMD & PULSATION</div><h2>LE MOUVEMENT AU BON TEMPO.</h2><p>Renseigne le BPM connu de la chorégraphie, son premier temps et, facultativement, une boucle entière en temps. Exemple : 120 BPM et 4 temps = 2 secondes. BPM vide : lecture originale.</p><p>Appliqué aux pistes Auto Show libres et aux futures musiques qui réutilisent cette troupe. Les montages manuels et les spectacles figés ne sont pas remplacés.</p><div id="motionSyncRows">${files.map((f,i)=>`<fieldset class="sync-row" data-sync="${i}"><legend>${esc(f.name)}</legend><p>${Number(f.info?.duration||0).toFixed(2)} s · tempo source à confirmer</p><div class="sync-fields"><label>BPM source<input aria-label="BPM source ${i+1}" data-key="bpm" type="number" min="20" max="400" step=".01" placeholder="Original" value="${esc(f.info?.sync?.bpm??'')}"></label><label>Premier temps dans le VMD (s)<input aria-label="Premier temps ${i+1}" data-key="firstBeat" type="number" min="0" step=".001" value="${esc(f.info?.sync?.firstBeat??0)}"></label><label>Boucle (temps, facultatif)<input aria-label="Boucle ${i+1}" data-key="loopBeats" type="number" min="1" max="256" step="1" placeholder="Durée du fichier" value="${esc(f.info?.sync?.loopBeats??'')}"></label></div></fieldset>`).join('')}</div><p>Sans longueur de boucle renseignée, le fichier boucle sur sa durée totale, pas forcément un nombre entier de temps. Le réglage ne répare ni un squelette incompatible ni le glissement des pieds.</p><p id="motionSyncError" role="alert"></p><div class="buttons"><button id="motionSyncSave" class="primary">Enregistrer le calage</button><button id="motionSyncCancel">Annuler sans modifier</button></div>`);
  $('modal').classList.add('motion-sync-modal');$('motionSyncCancel').onclick=()=>app.closeModal();
  $('motionSyncSave').onclick=()=>app.run(async()=>{
   const profiles={};files.forEach((f,i)=>{const row=$('motionSyncRows').querySelector(`[data-sync="${i}"]`);profiles[f.id]=Object.fromEntries([...row.querySelectorAll('[data-key]')].map(e=>[e.dataset.key,e.value]));});
   try{await app.saveMotionSync(profiles);app.closeModal();app.toast('Calage enregistré. Les notes et les pistes manuelles sont conservées.');}catch(e){$('motionSyncError').textContent=e.message;throw e;}
  },'Calage du spectacle…');
 };
 for(const name of ['closeModal','openModal']){const old=app[name].bind(app);app[name]=(...a)=>{$('modal').classList.remove('motion-sync-modal');return old(...a);};}
 document.documentElement.dataset.motionSyncReady='true';
}
root.PulseMotionSyncApp=install;
})(globalThis);
