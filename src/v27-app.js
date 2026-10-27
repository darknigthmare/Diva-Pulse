/* V28 continuation: bounded dynamics, explicit draft recovery and atomic publication.
 * Existing control IDs are retained for V27 accessibility / regression compatibility. */
(function(root){'use strict';
const P=root.PulseSecondaryPhysics,D=root.PulsePhysicsDrafts,C=root.PulseCore,$=id=>document.getElementById(id),esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function install(app){
 const wrap=(name,fn)=>{const old=app[name].bind(app);app[name]=(...args)=>fn(old,...args);};
 app.physicsRecoveries=new Map();app.physicsDraftWrite=Promise.resolve();let serial=Date.now();
 app.queuePhysicsRecovery=function(owner,value,cursor=0){
  const snapshot=D.validate({songId:owner.id,packId:owner.scene?.mmd?.id||null,updated:serial=Math.max(Date.now(),serial+1),cursor,baseSignature:D.signature(owner.scene?.secondaryPhysics27),settings:value});
  this.physicsRecoveries.set(owner.id,snapshot);
  const status=()=>this.song===owner?$('physicsDraftStatus28'):null;
  if(status())status().textContent='Brouillon en mémoire · enregistrement local…';
  this.physicsDraftWrite=this.physicsDraftWrite.catch(()=>{}).then(()=>this.store.put('settings',snapshot)).then(()=>{
   if(this.physicsRecoveries.get(owner.id)===snapshot&&status())status().textContent=this.store.persistent?'Brouillon sauvegardé localement · scène inchangée.':'Brouillon TEMPORAIRE · exporter avant de fermer.';
  }).catch(e=>{
   if(this.physicsRecoveries.get(owner.id)===snapshot&&status())status().textContent='Écriture refusée · brouillon conservé en mémoire et dans l’export de secours. '+e.message;
  });return this.physicsDraftWrite;
 };
 app.getPhysicsRecovery=async function(owner){
  const memory=this.physicsRecoveries.get(owner.id);let stored;try{stored=await this.store.get('settings','physics-draft:'+owner.id);}catch(e){if(!memory)throw e;}
  return D.merge(stored?[stored]:[],memory?[memory]:[],[owner])[0]||null;
 };
 app.discardPhysicsRecovery=async function(owner){
  await this.physicsDraftWrite;const tomb={id:'physics-draft:'+owner.id,songId:owner.id,updated:serial=Math.max(Date.now(),serial+1),discarded:true};
  await this.store.put('settings',tomb);this.physicsRecoveries.set(owner.id,tomb);
 };
 const models=()=>app.stage.director?.models||[app.stage.custom].filter(m=>m?.kind==='mmd');let preview=null;
 function resetWorlds(){for(const m of models()){m.secondaryWorld?.dispose();m.secondaryWorld=null;m.secondaryError=null;m.secondaryKey=null;}}
 function restore(){if(!preview)return;preview=null;app.stage.secondarySettings=P.normalize(app.song?.scene?.secondaryPhysics27);resetWorlds();$('modal').classList.remove('physics27-modal');}
 wrap('openModal',(old,...args)=>{restore();return old(...args);});wrap('closeModal',old=>{restore();return old();});
 wrap('selectSong',async(old,...args)=>{restore();return old(...args);});
 wrap('applyScene',async old=>{app.stage.secondarySettings=P.normalize(app.song?.scene?.secondaryPhysics27);const out=await old();return out;});
 wrap('startGame',async(old,...args)=>{resetWorlds();return old(...args);});
 app.physicsReport=()=>models().map((m,i)=>({slot:i+1,name:m.name,...P.inspect(m.pmx.physics),state:m.secondaryError?'fault':m.secondaryWorld?'active':'off',error:m.secondaryError||null,stats:m.secondaryWorld?{...m.secondaryWorld.stats}:null}));
 app.saveSecondarySettings=async function(owner,value){
  if(this.song!==owner)throw Error('Le morceau a changé.');const settings=P.normalize(value);await this.physicsDraftWrite;
  if(this.song!==owner)throw Error('Le morceau a changé.');
  const next={...owner,scene:{...owner.scene,secondaryPhysics27:settings}},tomb={id:'physics-draft:'+owner.id,songId:owner.id,updated:serial=Math.max(Date.now(),serial+1),discarded:true};
  await this.store.atomic([['songs',next],['settings',tomb]]);
  Object.assign(owner,next);this.physicsRecoveries.set(owner.id,tomb);
  if(this.song===owner){this.stage.secondarySettings=settings;resetWorlds();}return settings;
 };
 $('mmdPanel').insertAdjacentHTML('beforeend','<div class="buttons"><button id="physicsOpen27">DYNAMIQUE SECONDAIRE · EXPÉRIMENTALE</button></div>');
 const render=app.stage.render.bind(app.stage);app.stage.render=(time,bpm,options)=>{
  if(preview){if(preview.playing){const now=performance.now();preview.time+=Math.min(1,(now-preview.last)/1000);preview.last=now;if(preview.time>preview.owner.duration){preview.time=0;resetWorlds();}}time=preview.time;options={...options,menu:false,preview:false};}
  const out=render(time,bpm,options);
  if(preview&&$('physicsCanvas27')&&app.stage.available){const cv=$('physicsCanvas27'),ctx=cv.getContext('2d');ctx.drawImage(app.stage.canvas,0,0,cv.width,cv.height);$('physicsTime27').textContent=preview.time.toFixed(2)+' s';$('physicsCursor27').value=preview.time;$('physicsLive27').textContent=app.physicsReport().map(m=>'Danseur '+m.slot+' : '+(m.error||m.stats?m.error||`${m.stats.steps} pas · ${m.stats.resets} remise(s) à zéro · retard ${Math.round((m.stats.backlogSeconds||0)*1000)} ms · ${m.stats.reason}`:m.canSimulate?'dynamique désactivée':'sans données simulables')).join(' · ');}
  return out;
 };
 app.openSecondaryPhysics=function(){
  if(!this.song)return;const owner=this.song,settings=P.normalize(owner.scene.secondaryPhysics27),reports=this.physicsReport();
  this.openModal(`<div class="eyebrow">28 / MMD &amp; MOUVEMENTS SECONDAIRES</div><h2>DES CHAÎNES QUI RÉAGISSENT.</h2><p>Mode expérimental local : corps guidés par les os, gravité, articulations et collisions approchées. <strong>Ce n’est pas Bullet et ce n’est pas une compatibilité MMD exhaustive.</strong> Désactivé par défaut ; aucune note ni motion source n’est réécrite.</p><section id="physicsRecovery28" class="physics27-report" hidden><h3>REPRENDRE SON TRAVAIL</h3><p id="physicsRecoveryInfo28"></p><div class="buttons"><button id="physicsRecover28">Reprendre le brouillon</button><button id="physicsDiscard28">Écarter ce brouillon</button></div></section><p id="physicsDraftStatus28" role="status">Les changements valides sont conservés à part, sans remplacer la scène.</p><div id="physicsReports27">${reports.length?reports.map(r=>`<section class="physics27-report"><h3>Danseur ${r.slot} · ${esc(r.name)}</h3><p>${r.bodies} corps, dont ${r.dynamic} dynamiques · ${r.supportedJoints}/${r.joints} articulations prises en compte. ${r.canSimulate?'Simulable avec les limites ci-dessous.':'Pas de dynamique appliquée à ce modèle.'}</p><p>${r.warnings.map(esc).join(' ')}</p></section>`).join(''):'Charger un modèle PMX/PMD avec des corps et des articulations pour voir un effet.'}</div><label class="check"><input type="checkbox" id="physicsEnabled27" ${settings.enabled?'checked':''}>Activer la dynamique secondaire pour ce morceau</label><div class="physics27-controls"><label>Gravité (unités modèle / s²)<input id="physicsGravity27" type="number" min="0" max="100" step=".1" value="${settings.gravity}"></label><label>Amortissement additionnel<input id="physicsDamping27" type="number" min="0" max=".95" step=".01" value="${settings.damping}"></label><label>Influence 0–1<input id="physicsStrength27" type="number" min="0" max="1" step=".05" value="${settings.strength}"></label><label>Itérations par pas<input id="physicsIterations27" type="number" min="2" max="12" step="1" value="${settings.iterations}"></label></div><label class="check"><input type="checkbox" id="physicsCollisions27" ${settings.collisions?'checked':''}>Collisions locales selon les groupes du modèle</label><label class="check"><input type="checkbox" id="physicsGround27" ${settings.ground?'checked':''}>Plan de sol à Y = 0 dans le modèle</label><canvas id="physicsCanvas27" width="720" height="320" aria-label="Aperçu silencieux de la dynamique secondaire"></canvas><label>Position d’aperçu <output id="physicsTime27">0.00 s</output><input id="physicsCursor27" type="range" min="0" max="${owner.duration}" step=".01" value="0"></label><div class="buttons"><button id="physicsPlay27">Lire l’aperçu silencieux</button><button id="physicsPause27">Pause</button><button id="physicsReset27">Repartir de la pose</button></div><p id="physicsLive27" role="status"></p><p id="physicsMessage27" role="status">Aperçu uniquement. Brouillon indépendant ; Enregistrer pour appliquer au morceau.</p><details><summary>Limites de cette simulation</summary><p>Pas fixe 60 Hz, 128 corps et 256 articulations par modèle. Collisions : enveloppes sphériques pour les corps dynamiques ; sphères, boîtes et capsules guidées. Masse scalaire pour les contraintes de rotation, pas de tenseur d’inertie complet. Les corps souples, impulsions de morphs et interactions entre danseurs ne sont pas traités. Le modèle est simulé dans son propre repère : les déplacements de formation ne génèrent pas d’inertie.</p><p>Rattrapage borné à 12 pas par image : les images lentes conservent l’élan, avec un retard affiché. Retour, saut de plus de 1 s, retard accumulé supérieur à 1 s ou discontinuité de pose : remise à zéro de sécurité. Le déplacement du curseur ne recalcule pas l’historique physique. Les corps marqués dynamiques peuvent modifier la pose animée ; désactiver pour retrouver le VMD sans simulation.</p></details><div class="buttons"><button id="physicsSave27" class="primary">ENREGISTRER LA DYNAMIQUE</button><button id="physicsExport27">Exporter le diagnostic JSON</button><button id="physicsCancel27">Fermer sans appliquer</button></div>`);
  $('modal').classList.add('physics27-modal');preview={owner,time:0,playing:false,last:performance.now()};app.stage.secondarySettings=settings;resetWorlds();const session=preview;
  const fields=()=>P.normalize({enabled:$('physicsEnabled27').checked,gravity:$('physicsGravity27').value,damping:$('physicsDamping27').value,strength:$('physicsStrength27').value,iterations:$('physicsIterations27').value,collisions:$('physicsCollisions27').checked,ground:$('physicsGround27').checked});
  const refresh=()=>{try{const value=fields();app.stage.secondarySettings=value;resetWorlds();app.queuePhysicsRecovery(owner,value,preview.time);$('physicsMessage27').textContent='Aperçu non appliqué. Fermer rétablit la scène ; le brouillon reste récupérable.';}catch(e){$('physicsMessage27').textContent=e.message;}};
  for(const id of ['physicsEnabled27','physicsGravity27','physicsDamping27','physicsStrength27','physicsIterations27','physicsCollisions27','physicsGround27'])$(id).onchange=refresh;
  $('physicsCursor27').oninput=()=>{preview.time=Number($('physicsCursor27').value);preview.last=performance.now();resetWorlds();};$('physicsCursor27').onchange=()=>{try{app.queuePhysicsRecovery(owner,fields(),preview.time);}catch(e){$('physicsMessage27').textContent=e.message;}};
  $('physicsPlay27').onclick=()=>{try{fields();if(!app.stage.available)throw Error('WebGL2 indisponible : réglages conservables, aperçu 3D absent.');preview.playing=true;preview.last=performance.now();}catch(e){$('physicsMessage27').textContent=e.message;}};
  $('physicsPause27').onclick=()=>{preview.playing=false;};$('physicsReset27').onclick=()=>{preview.time=0;preview.last=performance.now();resetWorlds();};
  $('physicsSave27').onclick=()=>app.run(async()=>{const value=fields();await app.saveSecondarySettings(owner,value);this.closeModal();this.toast(value.enabled?'Dynamique secondaire enregistrée. Contrôler le rendu en PV.':'Dynamique désactivée. La motion source est conservée.');},'Enregistrement de la dynamique…');
  // Read-only discovery: existing drafts are not applied before an explicit recovery click.
  app.getPhysicsRecovery(owner).then(recovery=>{
   if(preview!==session||app.song!==owner||!recovery)return;
   const conflict=D.conflicts(recovery,owner);$('physicsRecovery28').hidden=false;
   $('physicsRecoveryInfo28').textContent='Brouillon du '+new Date(recovery.updated).toLocaleString('fr')+' · curseur '+recovery.cursor.toFixed(2)+' s.'+(conflict.settings?' Les réglages enregistrés ont changé depuis : la reprise ne les remplace pas avant confirmation.':'')+(conflict.pack?' Le pack MMD a changé : vérifier tous les modèles dans l’aperçu.':'');
   $('physicsRecover28').onclick=()=>{
    if(preview!==session)return;const v=recovery.settings;
    for(const [id,key]of [['physicsGravity27','gravity'],['physicsDamping27','damping'],['physicsStrength27','strength'],['physicsIterations27','iterations']])$(id).value=v[key];
    for(const [id,key]of [['physicsEnabled27','enabled'],['physicsCollisions27','collisions'],['physicsGround27','ground']])$(id).checked=v[key];
    preview.time=recovery.cursor;preview.playing=false;preview.last=performance.now();$('physicsCursor27').value=recovery.cursor;
    app.stage.secondarySettings=P.normalize(v);resetWorlds();$('physicsRecovery28').hidden=true;
    $('physicsMessage27').textContent='Brouillon repris dans l’aperçu, pas dans la scène. Enregistrer pour publier.';
   };
   $('physicsDiscard28').onclick=()=>app.run(async()=>{await app.discardPhysicsRecovery(owner);if(preview===session){$('physicsRecovery28').hidden=true;$('physicsDraftStatus28').textContent='Brouillon écarté. Scène enregistrée inchangée.';}},'Abandon du brouillon seulement…');
  }).catch(e=>{if(preview===session&&$('physicsDraftStatus28'))$('physicsDraftStatus28').textContent='Récupération indisponible : '+e.message;});
  $('physicsCancel27').onclick=()=>this.closeModal();$('physicsExport27').onclick=()=>root.PulseServices.download(new Blob([JSON.stringify({version:28,settings:fields(),reports:this.physicsReport(),limits:'PBD secondary approximation, not Bullet'},null,2)],{type:'application/json'}),'DIVA_PULSE_DYNAMIQUE_DIAGNOSTIC.json');
 };
 $('physicsOpen27').onclick=()=>app.openSecondaryPhysics();
 wrap('init',async old=>{await old();document.documentElement.dataset.v27Ready='true';document.documentElement.dataset.v28Ready='true';});
}
root.PulseV27={install};
})(globalThis);
