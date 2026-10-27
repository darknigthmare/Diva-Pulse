/* V24: explicit local-storage capabilities and motion-period proposals. */
(function(root){'use strict';const $=id=>document.getElementById(id);
function install(app){
 const panel=document.createElement('section');panel.className='settings-card';panel.id='storage24';
 panel.innerHTML='<div class="eyebrow">24 / SAUVEGARDES LOCALES</div><h2>UNE SEULE FENÊTRE ÉCRIT.</h2><p>Avec IndexedDB et Web Locks, une fenêtre V24 ou ultérieure conserve le droit d’écriture. Les autres consultent et exportent seulement : ferme les autres fenêtres puis recharge pour reprendre. Les anciennes versions ne participent pas à ce verrou.</p><p id="storage24Status" role="status"></p><div class="buttons"><button id="storage24Refresh">Actualiser le diagnostic</button><button id="storage24Persist">Demander la protection du stockage</button><button id="storage24Export">Exporter ma bibliothèque</button></div><p id="storage24Details"></p><p>La protection accordée par le navigateur n’est pas une sauvegarde externe. Elle ne protège pas d’un effacement manuel ou d’un changement d’adresse. Le dépôt Google Drive du jeu ne synchronise pas la bibliothèque locale.</p>';
 $('settings').append(panel);
 const mb=x=>(Number(x||0)/1048576).toFixed(1)+' Mio';
 app.storageCapabilities=async function(){const api=root.navigator?.storage,errors=[];const safe=async name=>{try{return api?.[name]?await api[name]():null;}catch(e){errors.push(name+' : '+e.message);return null;}};return {persistentDatabase:!!this.store.persistent,readOnly:!!(this.store.readOnly||this.store.lease?.released),writerGuard:this.store.writerGuard||'unavailable',estimate:await safe('estimate'),durable:await safe('persisted'),origin:root.location?.origin||'unknown',errors};};
 const draw=async()=>{const d=await app.storageCapabilities();$('storage24Status').textContent=!d.persistentDatabase?'TEMPORAIRE : exporter avant de fermer.':d.readOnly?'LECTURE SEULE : une autre fenêtre V24 ou ultérieure utilise cette bibliothèque.':d.writerGuard==='locked'?'IndexedDB actif · écriture réservée à cette fenêtre.':'IndexedDB actif · protection multi-fenêtres indisponible.';
 $('storage24Details').textContent=(d.estimate?mb(d.estimate.usage)+' utilisés / '+mb(d.estimate.quota)+' de quota estimé. ':'')+(d.durable===true?'Stockage protégé contre l’éviction automatique.':d.durable===false?'Protection contre l’éviction non accordée.':'Protection non disponible.')+' Adresse : '+d.origin+(d.errors.length?' · Diagnostic partiel : '+d.errors.join(' ; '):'');};
 $('storage24Refresh').onclick=()=>app.run(draw,'Diagnostic du stockage…');
 $('storage24Export').onclick=()=>app.run(()=>app.exportBackup(),'Export de secours…');
 $('storage24Persist').onclick=()=>app.run(async()=>{if(!app.store.persistent||!root.navigator?.storage?.persist)throw Error('Protection indisponible ici : utilise le lanceur local ou HTTPS.');const granted=await navigator.storage.persist();await draw();app.toast(granted?'Protection accordée. Garde une copie .pulsepack externe.':'Le navigateur n’a pas accordé la protection. Exporte régulièrement.',!granted);},'Demande au navigateur…');
 const oldInit=app.init.bind(app);app.init=async()=>{await oldInit();await draw();if(app.store.readOnly){const bar=document.createElement('div');bar.className='readonly24';bar.setAttribute('role','status');bar.textContent='LECTURE SEULE · Une autre fenêtre utilise cette bibliothèque. Export possible ; fermer les autres fenêtres puis recharger pour modifier.';document.body.append(bar);$('saveStatus').textContent='LECTURE SEULE';}document.documentElement.dataset.reliabilityReady='true';};
 const oldOpen=$('motionSyncOpen').onclick;
 $('motionSyncOpen').onclick=()=>{oldOpen();const rows=$('motionSyncRows');if(!rows)return;const owner=app.song.id,files=app.song.scene.mmd.files.filter(f=>f.role==='motion');
  for(const [i,f]of files.entries()){
   const row=rows.querySelector(`[data-sync="${i}"]`),button=document.createElement('button'),out=document.createElement('div');button.type='button';button.textContent='Analyser les cycles de cette motion';button.dataset.analyzeMotion=String(i);out.className='motion24-proposals';out.setAttribute('role','status');row.append(button,out);
   button.onclick=()=>app.run(async()=>{
    if(app.song.id!==owner)throw Error('Le morceau a changé.');const asset=await app.store.get('assets',f.id);if(!asset?.blob)throw Error('VMD manquant.');const motion=root.PulseMMD.parseVmd(await asset.blob.arrayBuffer(),{full:true});await new Promise(r=>setTimeout(r,0));const result=root.PulseMotionAnalysis.analyze(motion);if(app.song.id!==owner||!row.isConnected)return;app.lastMotionProposal={assetId:f.id,...result};out.replaceChildren();
    const text=document.createElement('p');text.textContent=result.candidates.length?`Cycle estimé : ${result.periodSeconds.toFixed(3)} s · répétitivité ${Math.round(result.confidence*100)} %. Choisir son interprétation, puis vérifier le premier temps.`:result.reason;out.append(text);
    for(const proposal of result.candidates){const b=document.createElement('button');b.type='button';b.textContent=proposal.bpm+' BPM · '+proposal.beatsPerCycle+' temps/cycle';b.dataset.proposedBpm=String(proposal.bpm);b.onclick=()=>{row.querySelector('[data-key="bpm"]').value=proposal.bpm;const message=document.createElement('p');message.textContent='Valeur préparée, NON enregistrée. Vérifie le premier temps et clique sur Enregistrer le calage pour appliquer.';out.append(message);};out.append(b);}
    const warning=document.createElement('p');warning.textContent=result.warnings.join(' ');out.append(warning);
   },'Recherche de cycles, sans changer la chorégraphie…');
  }
 };
}
root.PulseReliability={install};
})(globalThis);
