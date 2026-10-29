/* V19 production integration: transactional MMD import, editable Director,
 * explicit judgment profiles, deterministic visual scrubbing. */
(function(root){
'use strict';
const C=root.PulseCore,D=root.PulseDirector,M=root.PulseMMD,$=id=>document.getElementById(id);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const emptyMotion=()=>({boneTracks:new Map(),morphTracks:new Map(),cameraTracks:[]});
function compileMotion(buffer){const p=M.parseVmd(buffer,{full:true}),m=emptyMotion();for(const k of p.bones){if(!m.boneTracks.has(k.name))m.boneTracks.set(k.name,[]);m.boneTracks.get(k.name).push(k);}for(const k of p.morphs){if(!m.morphTracks.has(k.name))m.morphTracks.set(k.name,[]);m.morphTracks.get(k.name).push(k);}m.cameraTracks=p.cameras||[];for(const a of [...m.boneTracks.values(),...m.morphTracks.values(),m.cameraTracks])a.sort((a,b)=>a.frame-b.frame);return m;}
async function applyDirector(app,scene){
 if(!scene?.mmdDirector?.enabled){app.mmdGeneration=(app.mmdGeneration||0)+1;app.stage.clearDirector?.();return false;}
 const cfg=D.normalizeDirector({...scene.mmdDirector,duration:app.song.duration}),key='director19:'+scene.mmd?.id+JSON.stringify(cfg);
 if(app.modelLoaded===key&&app.stage.director)return true;
 if(!app.stage.available){app.lastMMDDiagnostic=['Scène 2D de secours : le spectacle MMD est conservé, mais pas rendu.'];return true;}
 const generation=(app.mmdGeneration||0)+1;app.mmdGeneration=generation;
 const out=[];
 try{
  const assets=[];for(const id of scene.mmd?.assetIds||[]){const a=await app.store.get('assets',id);if(!a?.blob)throw Error('Fichier MMD absent : '+id);assets.push(a);}
  const meta=new Map((scene.mmd?.files||[]).map(f=>[f.id,f]));
  const models=assets.filter(a=>meta.get(a.id)?.role==='model'),motions=assets.filter(a=>meta.get(a.id)?.role==='motion'),camera=assets.find(a=>meta.get(a.id)?.role==='camera'),pose=assets.find(a=>meta.get(a.id)?.role==='pose'),textures=assets.filter(a=>meta.get(a.id)?.role==='texture');
  if(!models.length)throw Error('Aucun modèle PMX/PMD dans ce pack.');
  const cache=new Map();for(const a of [...motions,...(camera?[camera]:[])])cache.set(a.id,compileMotion(await a.blob.arrayBuffer()));
  const positions=root.PulseV10Core.positions(cfg.count,cfg.spacing);
  for(let i=0;i<cfg.count;i++){
   const slot=cfg.slots[i],model=slot.modelAssetId?models.find(m=>m.id===slot.modelAssetId):models[i%models.length];if(!model)throw Error('Modèle du danseur '+(i+1)+' absent.');
   const motionId=slot.motionAssetId||motions[i%Math.max(1,motions.length)]?.id||null;
   const clips=slot.clips.length?slot.clips:[{start:Math.max(0,slot.offsetMs/1000),end:cfg.duration,motionAssetId:motionId,rate:slot.rate,motionStart:Math.max(0,-slot.offsetMs/1000)*slot.rate,transition:0,loop:scene.mmd.loop===true,camera:cfg.useCamera&&i===0}];
   if(clips.some(c=>c.motionAssetId&&!cache.has(c.motionAssetId)))throw Error('Motion de clip absente du pack.');
   const info=await app.stage.loadMMD(await model.blob.arrayBuffer(),[],pose?M.decodeVpdBytes(await pose.blob.arrayBuffer()):null,textures,model.name,true),m=info.model;
   m.useIK=scene.mmd.ik!==false&&slot.ik!==false;m.directorTransform={...slot,x:positions[i][0],y:positions[i][1],z:positions[i][2]};
   m.directorClips=clips.map(c=>{const motion=cache.get(c.motionAssetId)||(c.proceduralStyle&&root.PulseAutoShow?root.PulseAutoShow.proceduralMotion(m.bones,c.proceduralStyle,c.proceduralEnergy):emptyMotion());if(motion.procedural&&!motion.matchedBones)m.warnings.push('Danse procédurale : aucun os compatible reconnu ; pose conservée.');return {...c,motion:camera&&c.camera?{...motion,cameraTracks:cache.get(camera.id).cameraTracks}:motion};});out.push(m);
  }
  if(generation!==app.mmdGeneration){out.forEach(m=>app.stage._disposeCustom(m));return true;}
  app.stage.clearCustom();app.stage.setMMDDirector(out,cfg);app.modelLoaded=key;
  app.lastMMDDiagnostic=[...new Set(out.flatMap(m=>m.warnings))];return true;
 }catch(e){out.forEach(m=>app.stage._disposeCustom(m));app.lastMMDDiagnostic=['MMD non chargé : '+e.message];throw e;}
}
root.PulseV10.applyDirector=applyDirector;
function install(app){
 const wrap=(name,fn)=>{const old=app[name].bind(app);app[name]=(...args)=>fn(old,...args);};
 // The default Standard windows keep legacy rules4 records compatible.
 $('settings').insertAdjacentHTML('beforeend',`<section class="settings-card"><div class="eyebrow">19 / RESSENTI</div><h2>LE BON INSTANT.</h2><label>Profil de jugement<select id="judgmentProfile"><option value="standard">Standard</option><option value="accessible">Accessible</option><option value="precision">Précision</option></select></label><p id="judgmentWindows"></p><p>Les notes ne changent pas. Les records Accessible et Précision sont séparés. Un replay conserve le profil de la partie enregistrée.</p></section>`);
 wrap('applySettings',old=>{if(!Object.hasOwn(C.JUDGMENT_PROFILES,app.settings.judgmentProfile))app.settings.judgmentProfile='standard';old();});
 wrap('renderSettings',old=>{old();$('judgmentProfile').value=app.settings.judgmentProfile||'standard';$('judgmentWindows').textContent='COOL / FINE / SAFE / SAD : ±'+C.JUDGMENT_PROFILES[$('judgmentProfile').value].map(v=>Math.round(v*1000)).join(' / ±')+' ms.';});
 $('judgmentProfile').onchange=()=>app.run(async()=>{const candidate={...app.settings,judgmentProfile:C.judgmentProfile($('judgmentProfile').value)};await app.store.put('settings',candidate);app.settings=candidate;app.renderSettings();app.renderLibrary();},'Enregistrement du profil…');
 wrap('startGame',async(old,...args)=>{const result=await old(...args);if(result===false)return false;if(app.engine)$('gameModeLabel').textContent+=' · '+app.engine.profile.toUpperCase();return result;});
 wrap('finish',async old=>{const completion=await old();if(completion?.result&&completion.current())$('resultMode').textContent+=' · '+completion.profile.toUpperCase();return completion;});
 const panel=$('mmdPanel');panel.insertAdjacentHTML('beforeend',`<div class="buttons"><button id="importMmdFolder">＋ Importer un dossier</button><button id="openMmdDirector" class="primary">DIRECTOR · TIMELINE & PLANS</button></div><input id="mmdFolderInput" type="file" webkitdirectory multiple hidden>`);
 let session=null,previewTimer=null;
 app.directorRecoveries=new Map();app.directorDraftWrite=Promise.resolve();
 const draftKey=id=>'director-draft:'+id;
 function recoveryActive(current){return session===current&&app.song===current.song&&current.owner===app.song?.id&&current.packId===app.song?.scene?.mmd?.id&&$('modal').open&&$('dRecovery')===current.recoveryBox;}
 function recoveryReady(current=session){return !!current&&current.recoveryState==='ready'&&recoveryActive(current);}
 function recoveryState(current,state,message){
  if(!recoveryActive(current))return false;current.recoveryState=state;$('directorContent').inert=state!=='ready';
  if(message)$('dDraftStatus').textContent=message;return true;
 }
 function stashDraft(){if(!recoveryReady()||JSON.stringify(session.draft)===session.lastQueued)return;
  session.lastQueued=JSON.stringify(session.draft);// Returning to the initial state must also replace any older autosaved draft.
  const current=session,snapshot={...structuredClone(session.recoveryBase||{}),id:draftKey(session.owner),songId:session.owner,packId:session.packId,status:'draft',director:structuredClone(session.draft),updatedAt:Date.now()};
  app.directorRecoveries.set(session.owner,snapshot);if($('dDraftStatus'))$('dDraftStatus').textContent='Sauvegarde du brouillon…';
  app.directorDraftWrite=app.directorDraftWrite.catch(()=>{}).then(()=>app.store.put('settings',snapshot)).then(()=>{if(recoveryActive(current))$('dDraftStatus').textContent=app.store.persistent?'Brouillon sauvegardé localement':'Brouillon TEMPORAIRE · exporter avant fermeture';}).catch(e=>{if(recoveryActive(current))$('dDraftStatus').textContent='Brouillon non sauvegardé · exporter le Director JSON';app.toast('Brouillon Director conservé en mémoire : '+e.message,true);});
 }
 function acceptRecovery(current,saved,director,message){
  if(!recoveryActive(current))return false;
  current.recoveryBase=structuredClone(saved);current.history.push(structuredClone(current.draft));current.draft=structuredClone(director);current.lastQueued=JSON.stringify(current.draft);current.redo=[];current.selection.clear();current.loaded=false;
  current.recoveryBox.hidden=true;recoveryState(current,'ready',message);renderDirector();return true;
 }
 async function resolveRecovery(current,action,mapping){
  if(!recoveryActive(current)||current.recoveryState!=='pending')return false;
  const E=root.PulseDirectorEdit,saved=current.recoverySource;
  const candidate=action==='discard'?{id:draftKey(current.owner),songId:current.owner,packId:current.packId,status:'discarded',director:null,updatedAt:Date.now()}:E.reassociateRecovery(saved,current.song,mapping);
  recoveryState(current,'writing','Enregistrement du choix de récupération…');for(const el of current.recoveryBox.querySelectorAll('button,select'))el.disabled=true;
  // The next dialog waits for this entire operation, including cache publication.
  // Request success alone must never discard the previous recovery after abort.
  const write=app.directorDraftWrite.catch(()=>{}).then(()=>{if(!recoveryActive(current))throw Error('La session Director a changé avant l’enregistrement.');return app.store.put('settings',candidate);}).then(()=>{if(action==='discard')app.directorRecoveries.delete(current.owner);else app.directorRecoveries.set(current.owner,structuredClone(candidate));});
  app.directorDraftWrite=write.catch(()=>{});
  try{
   await write;if(!recoveryActive(current))return false;
   if(action==='discard'){current.recoveryBase=null;current.recoveryBox.hidden=true;recoveryState(current,'ready','Ancien brouillon écarté. Les prochaines modifications formeront un nouveau brouillon.');return true;}
   return acceptRecovery(current,candidate,candidate.director,'Brouillon réassocié et sauvegardé. Enregistrer le spectacle reste une action distincte.');
  }catch(e){if(recoveryActive(current)){recoveryState(current,'pending','Choix non enregistré · le brouillon précédent est conservé.');for(const el of current.recoveryBox.querySelectorAll('button,select'))el.disabled=false;$('dRecoveryMessage').textContent=e.message;}throw e;}
 }
 function showRecovery(current,info){
  if(!recoveryActive(current))return;
  const box=current.recoveryBox,compatible=info.kind==='compatible',supported=info.kind!=='unsupported';box.hidden=false;
  const explanation=info.kind==='unsupported'?'Ce brouillon ne peut pas être repris ici : '+info.error:compatible?'Un brouillon non appliqué existe pour ce morceau et ce pack.':'Un brouillon non appliqué existe pour un ancien pack, ou référence des médias absents du pack courant. Choisis les médias explicitement pour le réassocier.';
  box.innerHTML='<p>'+esc(explanation)+'</p><p>Le brouillon sauvegardé reste protégé jusqu’à ton choix. Fermer cette fenêtre le conserve. La réassociation remplace ce brouillon après validation, sans publier le spectacle ; tu peux exporter sa source avant ce choix.</p><div class="buttons">'+(compatible?'<button id="dRecover">Reprendre le brouillon</button>':'')+(supported?'<button id="dReassociate">Réassocier au pack courant…</button>':'')+'<button id="dExportRecovery">Exporter le brouillon source</button><button id="dDiscardRecovery">Écarter le brouillon puis commencer</button></div><p class="muted">L’export source est le JSON brut sauvegardé, avec tous ses champs et sa version.</p><p id="dRecoveryMessage" role="status"></p><div id="dRecoveryMappings" hidden></div>';
  $('dExportRecovery').onclick=()=>{if(recoveryActive(current))root.PulseServices.download(root.PulseDirectorEdit.recoverySourceJSON(current.recoverySource),current.song.title+'.director-recovery.json');};
  $('dDiscardRecovery').onclick=()=>app.run(()=>resolveRecovery(current,'discard'),'Conservation du choix de récupération…');
  if(compatible)$('dRecover').onclick=()=>{if(current.recoveryState==='pending')acceptRecovery(current,current.recoverySource,info.director,'Brouillon repris. Les modifications restent séparées du spectacle publié.');};
  if(supported)$('dReassociate').onclick=()=>{
   if(!recoveryActive(current)||current.recoveryState!=='pending')return;
   const fields=$('dRecoveryMappings');fields.hidden=false;
   fields.innerHTML='<p>Associe chaque référence au média du pack courant. Les noms ne déterminent aucune association automatique. Le timing, les clés et les phases de boucle sont conservés.</p>'+info.refs.map((ref,i)=>'<label>'+esc(ref.uses.join(', '))+' · '+esc(ref.id)+'<select id="dRecoveryAsset'+i+'">'+options(info.choices[ref.role],ref.id,'Choisir '+(ref.role==='model'?'un modèle':'une motion'))+'</select></label>').join('')+'<div class="buttons"><button id="dConfirmReassociate" class="primary">Confirmer la réassociation du brouillon</button><button id="dCancelReassociate">Annuler la réassociation</button></div>';
   $('dCancelReassociate').onclick=()=>{if(recoveryActive(current))fields.hidden=true;};
   $('dConfirmReassociate').onclick=()=>app.run(()=>{const mapping={};for(let i=0;i<info.refs.length;i++)mapping[info.refs[i].key]=$('dRecoveryAsset'+i).value;return resolveRecovery(current,'reassociate',mapping);},'Réassociation du brouillon…');
  };
 }
 async function offerRecovery(current=session){
  if(!recoveryActive(current))return false;const token=++current.recoveryRead;
  recoveryState(current,'loading','Recherche d’un brouillon sauvegardé…');current.recoveryBox.hidden=true;
  try{
   await app.directorDraftWrite;if(!recoveryActive(current)||token!==current.recoveryRead)return false;
   const saved=app.directorRecoveries.get(current.owner)||await app.store.get('settings',draftKey(current.owner));
   if(!recoveryActive(current)||token!==current.recoveryRead)return false;
   const info=root.PulseDirectorEdit.inspectRecovery(saved,current.song);
   if(info.kind==='none'||(info.kind==='compatible'&&JSON.stringify(info.director)===current.initialJSON)){current.recoveryBase=info.kind==='none'?null:structuredClone(saved);recoveryState(current,'ready','Aucune modification non enregistrée.');return true;}
   current.recoverySource=structuredClone(saved);recoveryState(current,'pending','Brouillon sauvegardé protégé · choisis une action de récupération.');showRecovery(current,info);return false;
  }catch(e){if(recoveryActive(current)&&token===current.recoveryRead){recoveryState(current,'error','Lecture impossible · l’édition reste protégée pour conserver le brouillon.');current.recoveryBox.hidden=false;current.recoveryBox.innerHTML='<p>'+esc(e.message)+'</p><button id="dRetryRecovery">Réessayer la lecture du brouillon</button>';$('dRetryRecovery').onclick=()=>offerRecovery(current);}return false;}
 }
 const closePreview=()=>{clearInterval(previewTimer);previewTimer=null;session?.audition?.dispose();delete app.directorAudition;delete app.stage.directorClock;delete app.stage.directorPreview;if(session){session=null;app.modelLoaded=null;Promise.resolve(app.applyScene()).catch(e=>app.toast(e.message,true));}};
 wrap('closeModal',old=>{closePreview();return old();});
 function renderMMD(){
  const m=app.song?.scene?.mmd;const info=$('mmdInfo');info.replaceChildren();
  for(const f of m?.files||[]){const span=document.createElement('span');span.className='mmd-chip';span.textContent=f.role+' · '+f.name;info.append(span);}
  if(!m)info.textContent='Aucun pack MMD associé.';
  $('mmdRuntime').textContent=(app.lastMMDDiagnostic?.join(' ')||'PMX/PMD, VMD, VPD, TGA/RLE. Physique Bullet absente, SDEF/QDEF et toon partiels.');
  for(const [id,key] of [['mmdOffset','offsetMs'],['mmdRate','rate']])$(id).value=m?.[key]??(key==='rate'?1:0);
  for(const [id,key] of [['mmdCamera','useCamera'],['mmdIk','ik'],['mmdLoop','loop']])$(id).checked=key==='loop'?!!m?.[key]:m?.[key]!==false;
 }
 app.renderMMD=renderMMD;wrap('renderWardrobe',old=>{old();renderMMD();});
 app.importMMDFiles=async function(files){
  const selected=[...files].filter(f=>/\.(pmx|pmd|vmd|vpd|png|jpg|jpeg|bmp|tga|sph|spa)$/i.test(f.name));
  if(!selected.length||selected.length>200||selected.reduce((n,f)=>n+f.size,0)>180*1024*1024)throw Error('Pack MMD : 1 à 200 fichiers et 180 Mo maximum.');
  const oldSong=app.song,names=new Set(),entries=[],ops=[];
  for(const file of selected){
   if(file.size>80*1024*1024)throw Error('Fichier MMD limité à 80 Mo.');
   const name=file.webkitRelativePath||file.name,key=root.PulseMMDCompat.pathKey(name);if(names.has(key))throw Error('Chemin dupliqué : '+name);names.add(key);
   const info=await M.inspect(file),id=C.uid();let warnings=[],boneNames,motionFeatures;
   if(info.kind==='pmx'||info.kind==='pmd'){const buffer=await file.arrayBuffer(),model=info.kind==='pmx'?M.parsePmx(buffer,{full:true}):M.parsePmd(buffer,{full:true});warnings=root.PulseMMDCompat.validateModel(model);boneNames=model.bones.map(b=>b.name);}
   if(info.kind==='vmd'&&root.PulseAutoShow)motionFeatures=root.PulseAutoShow.motionFeatures(M.parseVmd(await file.arrayBuffer(),{full:true}));
   const slim={kind:info.kind,name:info.name,version:info.version,duration:info.duration,motionCount:info.motionCount,cameraCount:info.cameraCount,morphCount:info.morphCount,warnings,boneNames,motionFeatures};
   entries.push({id,name,kind:info.kind,role:M.role(info),size:file.size,info:slim});ops.push(['assets',{id,name,blob:file,kind:'mmd-'+M.role(info)}]);
  }
  if(!entries.some(f=>f.role==='model'))throw Error('Le pack doit contenir au moins un modèle PMX/PMD.');
  const project={id:C.uid(),offsetMs:0,rate:1,ik:true,useCamera:true,loop:false,physics:false,assetIds:entries.map(e=>e.id),files:entries,warnings:[...new Set(entries.flatMap(e=>e.info.warnings||[]))]};
  const scene={...oldSong.scene,mmd:project};delete scene.mmdDirector;const candidate={...oldSong,scene};ops.push(['songs',candidate]);
  await app.store.atomic(ops);Object.assign(oldSong,candidate);app.modelLoaded=null;
  try{await app.applyScene();}catch(e){app.lastMMDDiagnostic=[e.message];}
  renderMMD();app.toast(`Pack MMD enregistré : ${entries.length} fichiers. Les chemins des dossiers sont conservés.`);return project;
 };
 function importSelection(files){if(!files.length)return;const run=()=>app.run(()=>app.importMMDFiles(files),'Validation du pack MMD…');if(app.song?.scene?.mmd){app.openModal('<h2>REMPLACER LE PACK MMD ?</h2><p>La timeline actuelle sera détachée. Exporte ton morceau avant de remplacer son spectacle.</p><button id="replaceMMD" class="primary">Remplacer ce pack</button>');$('replaceMMD').onclick=()=>{app.closeModal();run();};}else run();}
 $('importMmd').onclick=()=>$('mmdInput').click();$('importMmdFolder').onclick=()=>$('mmdFolderInput').click();
 for(const id of ['mmdInput','mmdFolderInput'])$(id).onchange=e=>{const files=[...e.target.files];e.target.value='';importSelection(files);};
 $('clearMmd').onclick=()=>app.run(async()=>{const scene={...app.song.scene};delete scene.mmd;delete scene.mmdDirector;const candidate={...app.song,scene};await app.store.put('songs',candidate);Object.assign(app.song,candidate);app.modelLoaded=null;app.lastMMDDiagnostic=[];await app.applyScene();renderMMD();},'Retrait de l’association MMD…');
 for(const [id,key] of [['mmdOffset','offsetMs'],['mmdRate','rate'],['mmdCamera','useCamera'],['mmdIk','ik'],['mmdLoop','loop']])$(id).onchange=()=>app.run(async()=>{
  if(!app.song.scene.mmd)return;const el=$(id),value=el.type==='checkbox'?el.checked:Number(el.value);
  if(typeof value==='number'&&(!Number.isFinite(value)||(key==='rate'&&(value<.25||value>4))||Math.abs(value)>7200000))throw Error('Valeur MMD invalide.');
  const candidate={...app.song,scene:{...app.song.scene,mmd:{...app.song.scene.mmd,[key]:value}}};await app.store.put('songs',candidate);Object.assign(app.song,candidate);app.modelLoaded=null;await app.applyScene();renderMMD();
 },'Réglage MMD…');

 app.openMMDDirector=function(){
  if(!app.song?.scene?.mmd)return app.toast('Importe d’abord un pack contenant un PMX ou PMD.',true);
  const base=app.song.scene.mmdDirector||root.PulseAutoShow?.effectiveDirector(app.song.scene);const initial=D.normalizeDirector({...base,duration:app.song.duration,count:base?.count||1});
  session={song:app.song,recoveryState:'loading',recoveryRead:0,recoveryBase:null,draft:initial,initialJSON:JSON.stringify(initial),lastQueued:JSON.stringify(initial),owner:app.song.id,packId:app.song.scene.mmd.id,history:[],redo:[],loaded:false,time:0,selection:new Set(),clipboard:null,snap:0,audition:null,audioRate:1,audioVolume:app.settings.volume??.65,loopEnabled:false,loopA:0,loopB:Math.min(20,app.song.duration)};
  app.openModal('<div class="eyebrow">DIRECTOR / ÉDITION NON DESTRUCTIVE</div><h2>MONTE TON SPECTACLE.</h2><p>Temps exprimés en secondes de la chanson. Les changements restent un brouillon jusqu’à Enregistrer. Lecture audio et animation partagent la même horloge ; les notes et records restent inchangés.</p><div id="dRecovery" hidden></div><p id="dDraftStatus" role="status">Aucune modification non enregistrée.</p><p id="directorMessage" role="status"></p><div id="directorContent" tabindex="-1"></div>');
  $('modal').classList.add('director-modal');
  session.recoveryBox=$('dRecovery');renderDirector();return offerRecovery(session);
 };
 $('openMmdDirector').onclick=app.openMMDDirector;
 function mutate(fn){if(!recoveryReady())return;try{pauseAudition();const next=structuredClone(session.draft);fn(next);const valid=D.normalizeDirector(next);if(JSON.stringify(valid)===JSON.stringify(session.draft))return;session.history.push(structuredClone(session.draft));session.history=session.history.slice(-60);session.redo=[];session.draft=valid;session.selection.clear();session.loaded=false;renderDirector();}catch(e){$('directorMessage').textContent=e.message;}}
 function options(files,value,empty){return '<option value="">'+empty+'</option>'+files.map(f=>`<option value="${esc(f.id)}" ${value===f.id?'selected':''}>${esc(f.name)}</option>`).join('');}
 function field(label,value,scope,extra=''){return `<label>${label}<input type="number" step=".01" value="${value}" ${scope} ${extra}></label>`;}
 function renderDirector(){
  if(!session)return;
  $('directorContent').inert=!recoveryReady();pauseAudition();
  const E=root.PulseDirectorEdit;const picked=()=>[...session.selection];
  const batch=fn=>mutate(next=>Object.assign(next,fn(next)));
  const reportError=e=>{$('directorMessage').textContent=e.message;};
  const refreshSelection=()=>{for(const el of $('directorContent').querySelectorAll('[data-select]'))el.checked=session.selection.has(el.dataset.select);for(const el of $('directorContent').querySelectorAll('[data-event-key]'))el.setAttribute('aria-pressed',String(session.selection.has(el.dataset.eventKey)));$('dSelected').textContent=session.selection.size+' éléments sélectionnés';};stashDraft();const d=session.draft,files=app.song.scene.mmd.files||[],models=files.filter(f=>f.role==='model'),motions=files.filter(f=>f.role==='motion'),sc=$('modal').scrollTop,expanded=new Set([...$('directorContent').querySelectorAll('details[open]')].map(el=>el.dataset.panel));
  $('directorContent').innerHTML=`<div class="director-toolbar"><label class="check"><input id="dEnabled" type="checkbox" ${d.enabled?'checked':''}> Activer</label>${field('Danseurs',d.count,'id="dCount"','min="1" max="4"')}${field('Espacement',d.spacing,'id="dSpacing"','min=".4" max="4"')}<label class="check"><input id="dCamera" type="checkbox" ${d.useCamera?'checked':''}> Caméra VMD</label></div><div class="buttons"><button id="dUndo" ${session.history.length?'':'disabled'}>Annuler</button><button id="dRedo" ${session.redo.length?'':'disabled'}>Rétablir</button><button id="dAuto">Auto-PV · remplacer le brouillon</button><button id="dExport">Exporter le Director JSON</button></div><fieldset class="director-batch"><legend>MONTAGE GROUPÉ</legend><div class="buttons"><button id="dSelectAll">Tout sélectionner</button><button id="dSelectNone">Désélectionner</button><button id="dCopy">Copier</button><button id="dPaste" ${session.clipboard?'':'disabled'}>Coller au curseur</button><button id="dDeleteSelected">Supprimer la sélection</button><button id="dSplit">Scinder au curseur</button><button id="dMerge">Fusionner les clips</button></div><div class="director-row"><label>Coller vers<select id="dPasteTarget"><option value="">Pistes d’origine</option>${d.slots.map((_,i)=>`<option value="${i}">À partir de D${i+1}</option>`).join('')}</select></label><label>Décalage (s)<input id="dMoveDelta" type="number" step=".01" value="1"></label><button id="dMoveSelected">Déplacer le groupe</button><label>Grille musicale<select id="dSnap"><option value="0">Libre</option><option value=".25">Quart de temps</option><option value="0.3333333333333333">Triolet</option><option value=".5">Demi-temps</option><option value="1">Temps</option><option value="4">4 temps</option><option value="bar">Mesure réelle</option></select></label><button id="dSnapCursor">Aligner le curseur</button><button id="dAlignSelected">Aligner le groupe</button></div><output id="dSelected" aria-live="polite">${session.selection.size} éléments sélectionnés</output><p class="muted">Coche les clips et clés ci-dessous. Le collage conserve leurs écarts et leurs pistes. Toute collision ou sortie de durée annule l’opération entière. La grille suit les changements de tempo, la signature et les décalages de la partition. Aligner le groupe déplace son premier élément sans modifier les écarts. Scinder conserve le temps source, y compris le tempo variable. Les boucles VMD en temps et les coupes dans un fondu sont refusées. Fusionner exige des clips contigus avec une motion et un temps source continus. Le transfert entre danseurs exige le même modèle identifié ; les autres pistes restent communes.</p><details><summary>Raccourcis de montage</summary><p>Ctrl/Cmd+A : tout sélectionner · C : copier · V : coller · Z : annuler · Maj+Z ou Y : rétablir · Ctrl/Cmd+S : enregistrer. Sans modificateur : Suppr : supprimer · S : scinder · M : fusionner · Espace : lecture/pause · G : aligner · flèches : curseur ±0,1 s. Les champs de saisie gardent leurs commandes natives.</p></details></fieldset><div id="dOverview" class="director-overview"></div><section class="director-preview"><label>Curseur <output id="dTimeLabel">${session.time.toFixed(2)} s</output><input id="dTime" type="range" min="0" max="${d.duration}" step=".01" value="${session.time}"></label><div class="buttons"><button id="dPreview">Charger l’aperçu du brouillon</button><button id="dPlay" aria-pressed="false">▶ Écouter le brouillon</button><button id="dStop">Arrêt · retour à A</button><button id="dSave" class="primary">ENREGISTRER LE SPECTACLE</button></div><div class="director-row"><label>Vitesse d’écoute<select id="dAudioRate">${[.25,.5,.75,1,1.25,1.5,2].map(v=>`<option value="${v}" ${session.audioRate===v?'selected':''}>${v}×</option>`).join('')}</select></label><label>Volume<input id="dAudioVolume" type="range" min="0" max="1" step=".01" value="${session.audioVolume}"></label><label class="check"><input id="dLoop" type="checkbox" ${session.loopEnabled?'checked':''}> Boucle A/B</label>${field('A (s)',session.loopA,'id="dLoopA"')}${field('B (s)',session.loopB,'id="dLoopB"')}</div><p id="dPlaybackStatus" role="status">Écoute arrêtée · aucun record modifié. La vitesse change aussi la hauteur du son.</p><canvas id="dPreviewCanvas" width="800" height="360" aria-label="Aperçu MMD au curseur"></canvas><p class="muted">Cliquer ou Entrée sélectionne un bloc ; Ctrl/Cmd/clic ajoute ou retire. Glisser un bloc sélectionné déplace tout son groupe et suit la grille. Les champs permettent le réglage précis. Les chevauchements sont refusés. Transition : fondu depuis la dernière pose du clip précédent, uniquement s’il est adjacent.</p></section><div id="dSlots"></div><details data-panel="keys" ${expanded.has("keys")?"open":""}><summary>Caméra & éclairage · clés manuelles</summary><p>La piste caméra manuelle est prioritaire sur une caméra VMD. Vide la piste pour revenir au VMD.</p><div class="buttons"><button id="dAddCamera">＋ Clé caméra au curseur</button><button id="dAddLight">＋ Clé lumière au curseur</button><button id="dClearCamera">Vider caméra</button><button id="dClearLight">Vider lumière</button></div><div id="dCameraRows"></div><div id="dLightRows"></div></details>`;
  for(let i=0;i<d.count;i++){
   const slot=d.slots[i],el=document.createElement('fieldset');el.className='director-slot';el.innerHTML=`<legend>DANSEUR ${i+1}</legend><div class="director-row"><label>Modèle<select data-s="${i}" data-field="modelAssetId">${options(models,slot.modelAssetId,'Modèle par défaut')}</select></label><label>Motion de base<select data-s="${i}" data-field="motionAssetId">${options(motions,slot.motionAssetId,'Motion par défaut')}</select></label>${field('Rotation °',slot.rotationY,`data-s="${i}" data-field="rotationY"`)}${field('Taille',slot.scale,`data-s="${i}" data-field="scale"`,'min=".25" max="3"')}</div><details data-panel="clips${i}" ${expanded.has("clips"+i)?"open":""}><summary>${slot.clips.length} clips · réglages détaillés</summary><button data-add="${i}">＋ Clip au curseur</button><div id="dClips${i}"></div></details>`;$('dSlots').append(el);
   slot.clips.forEach((c,j)=>{const row=document.createElement('div');row.className='director-clip';row.innerHTML=`<label class="check"><input type="checkbox" data-select="clip:${i}:${j}" aria-label="Sélectionner clip ${j+1} danseur ${i+1}"> Sélection</label><strong>${j+1}</strong><label>VMD<select data-s="${i}" data-c="${j}" data-field="motionAssetId">${options(motions,c.motionAssetId,'Sans VMD / mouvement ci-dessous')}</select></label><label>Mouvement procédural<select data-s="${i}" data-c="${j}" data-field="proceduralStyle">${['','pose','step','wave','clap','reach','idol'].map(v=>`<option value="${v}" ${c.proceduralStyle===v?'selected':''}>${v||'Pose VPD / repos'}</option>`).join('')}</select></label>${['start','end','rate','motionStart','transition','sourceBpm','loopBeats','loopPhaseBeats'].map((k,n)=>field(['Début s','Fin s','Vitesse','Départ VMD s','Fondu s','BPM source (vide = naturel)','Boucle (temps)','Phase (temps)'][n],c[k]??'',`data-s="${i}" data-c="${j}" data-field="${k}"`)).join('')}<label class="check"><input type="checkbox" data-s="${i}" data-c="${j}" data-field="loop" ${c.loop?'checked':''}> Boucle</label><label class="check"><input type="checkbox" data-s="${i}" data-c="${j}" data-field="camera" ${c.camera?'checked':''}> Caméra VMD</label><button data-del="${i},${j}" aria-label="Supprimer clip ${j+1} danseur ${i+1}">×</button>`;$('dClips'+i).append(row);});
   const lane=document.createElement('div');lane.className='director-lane';lane.innerHTML=`<span>D${i+1}</span><div class="director-strip"></div>`;const strip=lane.querySelector('.director-strip');
   slot.clips.forEach((c,j)=>{const clip=document.createElement('button');clip.className='director-block';clip.style.left=(c.start/d.duration*100)+'%';clip.style.width=((c.end-c.start)/d.duration*100)+'%';clip.textContent=String(j+1);clip.title=`${c.start.toFixed(2)} → ${c.end.toFixed(2)} s`;bindBlock(clip,`clip:${i}:${j}`,c.start,strip);strip.append(clip);});$('dOverview').append(lane);
  }
  function bindBlock(block,key,time,strip){
   block.dataset.eventKey=key;block.setAttribute('aria-pressed',String(session.selection.has(key)));
   block.setAttribute('aria-label',`${key} · ${time.toFixed(2)} secondes. Entrée : sélectionner.`);
   const toggle=()=>{session.selection.has(key)?session.selection.delete(key):session.selection.add(key);refreshSelection();};
   block.onclick=e=>{if(e.detail===0)toggle();};
   block.onpointerdown=e=>{
    if(e.button!==0||!e.isPrimary||app.busy)return;
    if(e.ctrlKey||e.metaKey||e.shiftKey){toggle();e.preventDefault();return;}
    pauseAudition();if(!session.selection.has(key))session.selection=new Set([key]);refreshSelection();
    const current=session,keys=picked(),from=e.clientX,width=strip.getBoundingClientRect().width;
    if(!width)return;
    const blocks=[...$('dOverview').querySelectorAll('[data-event-key]')].filter(b=>keys.includes(b.dataset.eventKey));
    const starts=blocks.map(b=>Number.parseFloat(b.style.left));let target=time,moved=false;
    block.setPointerCapture(e.pointerId);
    const cancel=()=>{block.onpointermove=null;block.onpointerup=null;block.onpointercancel=null;block.onlostpointercapture=null;blocks.forEach((b,i)=>{b.style.left=starts[i]+'%';b.classList.remove('drag-invalid');});};
    block.onpointermove=ev=>{
     if(ev.pointerId!==e.pointerId||session!==current)return;
     moved=moved||Math.abs(ev.clientX-from)>3;if(!moved)return;
     target=time+(ev.clientX-from)/width*d.duration;
     try{E.drag(current.draft,keys,key,target,app.chart||{},current.snap);const delta=E.dragDelta(current.draft,keys,key,target,app.chart||{},current.snap);blocks.forEach((b,i)=>{b.style.left=starts[i]+delta/d.duration*100+'%';b.classList.remove('drag-invalid');});$('directorMessage').textContent='Déplacement du groupe · relâcher pour appliquer, Échap pour annuler.';}
     catch(error){blocks.forEach(b=>b.classList.add('drag-invalid'));reportError(error);}
    };
    block.onpointercancel=cancel;block.onlostpointercapture=cancel;
    block.onpointerup=ev=>{if(ev.pointerId!==e.pointerId)return;cancel();if(block.hasPointerCapture(e.pointerId))block.releasePointerCapture(e.pointerId);if(moved&&session===current)batch(next=>E.drag(next,keys,key,target,app.chart||{},current.snap));};
   };
  }
  for(const [kind,title,rows] of [['camera','CAM',d.cameraTrack],['light','LUM',d.lightTrack],['formation','POS',d.formations]]){
   const lane=document.createElement('div');lane.className='director-lane';lane.innerHTML=`<span>${title}</span><div class="director-strip"></div>`;const strip=lane.lastElementChild;
   rows.forEach((value,i)=>{const block=document.createElement('button');block.className='director-block director-point';block.style.left=value.time/d.duration*100+'%';block.textContent=String(i+1);bindBlock(block,`${kind}:${i}`,value.time,strip);strip.append(block);});$('dOverview').append(lane);
  }
  const formationPanel=document.createElement('details');formationPanel.dataset.panel='formations';formationPanel.open=expanded.has('formations');
  formationPanel.innerHTML='<summary>Formations · positions et danseur principal</summary><p>Positions numériques par danseur. Déplacer les clés déplace leur instant, pas les pas de la motion.</p><button id="dAddFormation">＋ Formation au curseur</button><div id="dFormationRows"></div>';
  $('directorContent').append(formationPanel);
  d.formations.forEach((f,i)=>{
   const row=document.createElement('fieldset');row.className='director-slot';row.innerHTML=`<legend>FORMATION ${i+1}</legend><label class="check"><input type="checkbox" data-select="formation:${i}" aria-label="Sélectionner formation ${i+1}"> Sélection</label><div class="director-row">${field('Instant s',f.time,`data-track="formation" data-k="${i}" data-field="time"`)}${field('Principal (0 = D1)',f.lead,`data-track="formation" data-k="${i}" data-field="lead"`,'min="0" max="'+(d.count-1)+'"')}<button data-delkey="formation,${i}">Supprimer formation</button></div>`+f.positions.map((pos,j)=>`<div class="director-row"><label class="check"><input type="checkbox" data-f="${i}" data-dancer="${j}" data-visible ${f.visible[j]?'checked':''}> D${j+1} visible</label>${pos.map((v,axis)=>field(['X','Y','Z'][axis],v,`data-f="${i}" data-dancer="${j}" data-axis="${axis}"`)).join('')}</div>`).join('');$('dFormationRows').append(row);
  });
  $('dAddFormation').onclick=()=>mutate(next=>next.formations.push({time:session.time,lead:0}));
  for(const el of formationPanel.querySelectorAll('[data-f]'))el.onchange=()=>mutate(next=>{const f=next.formations[+el.dataset.f],j=+el.dataset.dancer;if(el.hasAttribute('data-visible'))f.visible[j]=el.checked;else f.positions[j][+el.dataset.axis]=Number(el.value);});
  for(const [kind,rows] of [['camera',d.cameraTrack],['light',d.lightTrack]])rows.forEach((k,i)=>{
   const row=document.createElement('div');row.className='director-key';const fields=kind==='camera'?['time','yaw','pitch','distance','fov']:['time','intensity'];row.innerHTML=`<label class="check"><input type="checkbox" data-select="${kind}:${i}" aria-label="Sélectionner clé ${kind} ${i+1}"> Sélection</label>`+fields.map(f=>field(({time:'Instant s',yaw:'Azimut °',pitch:'Inclinaison °',distance:'Distance',fov:'FOV °',intensity:'Intensité'})[f],k[f],`data-track="${kind}" data-k="${i}" data-field="${f}"`)).join('')+(kind==='light'?`<label>Couleur<input type="color" data-track="light" data-k="${i}" data-field="color" value="#${k.color.map(v=>Math.round(v*255).toString(16).padStart(2,'0')).join('')}"></label>`:'')+`<label>Courbe<select data-track="${kind}" data-k="${i}" data-field="easing">${['smooth','linear','step'].map(v=>`<option ${k.easing===v?'selected':''}>${v}</option>`).join('')}</select></label><button data-delkey="${kind},${i}" aria-label="Supprimer clé ${kind} ${i+1}">×</button>`;$(kind==='camera'?'dCameraRows':'dLightRows').append(row);
  });
  for(const el of $('directorContent').querySelectorAll('[data-field]'))el.onchange=()=>{const k=el.dataset.field;let value=el.type==='checkbox'?el.checked:el.tagName==='SELECT'?el.value:el.type==='color'?[1,3,5].map(i=>parseInt(el.value.slice(i,i+2),16)/255):Number(el.value);if(k.endsWith('AssetId'))value||=null;if(['sourceBpm','loopBeats'].includes(k)&&el.value==='')value=null;mutate(next=>{if(el.dataset.track)(el.dataset.track==='formation'?next.formations:next[el.dataset.track+'Track'])[+el.dataset.k][k]=value;else if(el.dataset.c!==undefined){const clip=next.slots[+el.dataset.s].clips[+el.dataset.c];clip[k]=value;if(k==='motionAssetId'){clip.sourceBpm=null;clip.loopBeats=null;delete clip.loopPhaseBeats;}}else next.slots[+el.dataset.s][k]=value;});};
  for(const id of ['dEnabled','dCount','dSpacing','dCamera'])$(id).onchange=()=>mutate(next=>{next[{dEnabled:'enabled',dCount:'count',dSpacing:'spacing',dCamera:'useCamera'}[id]]=$(id).type==='checkbox'?$(id).checked:Number($(id).value);});
  $('dUndo').onclick=()=>{if(!recoveryReady())return;session.redo.push(session.draft);session.draft=session.history.pop();session.selection.clear();session.loaded=false;renderDirector();};$('dRedo').onclick=()=>{if(!recoveryReady())return;session.history.push(session.draft);session.draft=session.redo.pop();session.selection.clear();session.loaded=false;renderDirector();};
  for(const el of $('directorContent').querySelectorAll('[data-select]'))el.onchange=()=>{if(el.checked)session.selection.add(el.dataset.select);else session.selection.delete(el.dataset.select);refreshSelection();};
  $('dSelectAll').onclick=()=>{session.selection=new Set(E.all(session.draft));refreshSelection();};
  $('dSelectNone').onclick=()=>{session.selection.clear();refreshSelection();};
  $('dCopy').onclick=()=>{try{session.clipboard=E.copyForTransfer(session.draft,picked(),models);$('dPaste').disabled=false;$('directorMessage').textContent='Sélection copiée. Place le curseur puis colle.';}catch(e){reportError(e);}};
  $('dPaste').onclick=()=>{const target=$('dPasteTarget').value;batch(next=>E.pasteTo(next,session.clipboard,session.time,target===''?null:Number(target),models));};
  $('dMoveSelected').onclick=()=>batch(next=>E.move(next,picked(),Number($('dMoveDelta').value)));
  $('dDeleteSelected').onclick=()=>batch(next=>E.remove(next,picked()));
  $('dSnap').value=String(session.snap);$('dSnap').onchange=()=>session.snap=$('dSnap').value==='bar'?'bar':Number($('dSnap').value);
  $('dSnapCursor').onclick=()=>{try{session.time=E.musicalSnap(session.time,app.chart||{},session.snap,d.duration);$('dTime').value=session.time;$('dTime').dispatchEvent(new Event('input'));}catch(e){reportError(e);}};
  $('dAlignSelected').onclick=()=>batch(next=>E.align(next,picked(),app.chart||{},session.snap));
  $('dSplit').onclick=()=>batch(next=>E.split(next,picked(),session.time));
  $('dMerge').onclick=()=>batch(next=>E.merge(next,picked()));
  refreshSelection();
  $('dAuto').onclick=()=>mutate(next=>Object.assign(next,D.autoShow(app.song,app.chart,next,motions.map(m=>m.id))));
  for(const b of $('directorContent').querySelectorAll('[data-add]'))b.onclick=()=>mutate(next=>{const slot=next.slots[+b.dataset.add],start=session.time;slot.clips.push({start,end:Math.min(d.duration,start+4),motionAssetId:slot.motionAssetId||motions[0]?.id||null,rate:1,motionStart:0,transition:.3,loop:true,camera:false});});
  for(const b of $('directorContent').querySelectorAll('[data-del]'))b.onclick=()=>mutate(next=>{const [s,c]=b.dataset.del.split(',').map(Number);next.slots[s].clips.splice(c,1);});
  for(const kind of ['Camera','Light']){$('dAdd'+kind).onclick=()=>mutate(next=>next[kind.toLowerCase()+'Track'].push({time:session.time}));$('dClear'+kind).onclick=()=>mutate(next=>next[kind.toLowerCase()+'Track']=[]);}
  for(const b of $('directorContent').querySelectorAll('[data-delkey]'))b.onclick=()=>mutate(next=>{const [t,i]=b.dataset.delkey.split(',');(t==='formation'?next.formations:next[t+'Track']).splice(+i,1);});
  $('dExport').onclick=()=>root.PulseServices.download(JSON.stringify({format:'DIVA-PULSE-DIRECTOR',version:session.draft.version,director:session.draft},null,2),app.song.title+'.director.json');
  $('dTime').oninput=()=>{session.time=+$('dTime').value;if(session.audition)session.time=session.audition.seek(Math.min(session.time,session.audition.duration));$('dTimeLabel').textContent=session.time.toFixed(2)+' s';if(session.loaded){app.stage.directorPreview=session.time;app.stage.render(session.time,app.chart?.bpm||120,{preview:true});drawPreview();}};
  $('dPreview').onclick=()=>app.run(()=>loadAudition(false),'Préparation de l’aperçu MMD…');
  $('dPlay').onclick=()=>{if(session.audition?.playing){pauseAudition();return;}const current=session,epoch=app.liveEpoch34?.();app.run(async()=>{await loadAudition(true);if(session!==current||!current.audition||document.hidden||app.liveEpoch34?.()!==epoch)return;await current.audition.context.resume();if(session!==current||document.hidden||app.liveEpoch34?.()!==epoch||current.audition.context.state!=='running')return;current.audition.play(Math.min(current.time,current.audition.duration));drawPreview();},'Préparation de l’écoute…');};
  $('dStop').onclick=()=>{pauseAudition();session.time=session.loopEnabled?session.loopA:0;if(session.audition)session.audition.seek(session.time);drawPreview();$('dTime').value=session.time;$('dTimeLabel').textContent=session.time.toFixed(2)+' s';};
  $('dAudioRate').onchange=()=>{try{session.audioRate=Number($('dAudioRate').value);session.audition?.setRate(session.audioRate);drawPreview();}catch(e){reportError(e);}};
  $('dAudioVolume').oninput=()=>{session.audioVolume=Number($('dAudioVolume').value);session.audition?.setVolume(session.audioVolume);};
  for(const id of ['dLoop','dLoopA','dLoopB'])$(id).onchange=()=>{
   try{const a=Number($('dLoopA').value),b=Number($('dLoopB').value),enabled=$('dLoop').checked,limit=session.audition?.duration||d.duration;
    if(!Number.isFinite(a)||!Number.isFinite(b)||a<0||b>limit||b-a<.05)throw Error('Boucle : 0 ≤ A < B ≤ durée audio, avec au moins 0,05 seconde.');
    session.audition?.setLoop(a,b,enabled);Object.assign(session,{loopA:a,loopB:b,loopEnabled:enabled});drawPreview();
   }catch(e){$('dLoop').checked=session.loopEnabled;$('dLoopA').value=session.loopA;$('dLoopB').value=session.loopB;reportError(e);}
  };
  $('dSave').onclick=()=>app.run(async()=>{const current=session,owner=app.song;if(!recoveryReady(current))throw Error('Choisis d’abord une action pour le brouillon sauvegardé.');if(current.owner!==owner.id)throw Error('Le morceau a changé.');await app.directorDraftWrite;if(session!==current||app.song!==owner)throw Error('La session Director a changé.');const rows=E.publication(owner,current.draft,current.packId);await app.store.atomic(rows);Object.assign(owner,rows[0][1]);app.directorRecoveries.delete(current.owner);if(session===current){app.closeModal();renderMMD();}app.toast('Spectacle et fin du brouillon enregistrés ensemble. Les partitions sont inchangées.');},'Sauvegarde du spectacle…');
  $('modal').scrollTop=sc;$('directorMessage').textContent='Brouillon — '+d.slots.reduce((n,s)=>n+s.clips.length,0)+' clips · '+d.cameraTrack.length+' clés caméra · '+d.lightTrack.length+' clés lumière.';
 }
 app.pauseDirectorAudition=()=>pauseAudition();
 function pauseAudition(){
  if(!session?.audition)return;
  session.time=session.audition.pause();
  if($('dPlay')){$('dPlay').textContent='▶ Reprendre l’écoute';$('dPlay').setAttribute('aria-pressed','false');}
  if($('dPlaybackStatus'))$('dPlaybackStatus').textContent='Écoute en pause · aucun record modifié.';
 }
 async function loadAudition(withAudio){
  const current=session,owner=app.song;if(!recoveryReady(current)||current.owner!==owner.id)return;
  pauseAudition();
  if(current.audition?.context.state==='closed'){current.audition.dispose();current.audition=null;delete app.directorAudition;}
  if(withAudio&&!current.audition){
   await app.audio.init();await app.prepareAudio();
   if(session!==current||app.song!==owner)return;
   current.audition=new root.PulseDirectorAudio(app.audio.ctx,app.buffer,current.draft.duration);app.directorAudition=current.audition;
   current.loopB=Math.min(current.loopB,current.audition.duration);if(current.loopA>=current.loopB-.05){current.loopA=0;current.loopB=current.audition.duration;}
   current.audition.setRate(current.audioRate);current.audition.setVolume(current.audioVolume);current.audition.setLoop(current.loopA,current.loopB,current.loopEnabled);
   current.time=Math.min(current.time,current.audition.duration);current.audition.seek(current.time);
   $('dLoopA').value=current.loopA;$('dLoopB').value=current.loopB;
  }
  if(app.stage.available&&!current.loaded){await applyDirector(app,{...owner.scene,mmdDirector:{...current.draft,enabled:true}});if(session!==current)return;current.loaded=true;}
  else if(!app.stage.available&&!withAudio)throw Error('WebGL2 indisponible : l’édition et l’écoute audio restent possibles.');
  if(session!==current)return;
  app.stage.directorClock=()=>{
   const time=current.audition?.time??current.time;current.time=time;
   if($('dTime'))$('dTime').value=time;if($('dTimeLabel'))$('dTimeLabel').textContent=time.toFixed(2)+' s';
   const chart=app.chart||{},chartTime=time-(chart.offset||0);
   return {time,bpm:C.tempoAt(chart,chartTime),beat:C.timeToBeat(chart,chartTime)};
  };
  app.stage.directorPreview=current.time;drawPreview();clearInterval(previewTimer);previewTimer=setInterval(drawPreview,100);
  $('directorMessage').textContent=withAudio?'Écoute du brouillon · horloge audio commune.':'Aperçu chargé. Déplace le curseur pour examiner le spectacle.';
 }
 function drawPreview(){
  if(!session)return;
  const audio=session.audition;
  if(audio){session.time=audio.time;if(audio.playing&&!audio.loop&&session.time>=audio.duration)audio.pause();
   if($('dPlay')){$('dPlay').textContent=audio.playing?'Ⅱ Pause':'▶ Reprendre l’écoute';$('dPlay').setAttribute('aria-pressed',String(audio.playing));}
   const text=audio.playing?'Lecture du brouillon · horloge audio · aucun record modifié.':'Écoute en pause · aucun record modifié.';
   if($('dPlaybackStatus')&&$('dPlaybackStatus').textContent!==text)$('dPlaybackStatus').textContent=text;
  }
  if($('dTime'))$('dTime').value=session.time;if($('dTimeLabel'))$('dTimeLabel').textContent=session.time.toFixed(2)+' s';
  const cv=$('dPreviewCanvas');if(!session.loaded||!cv||!app.stage.available)return;
  app.stage.directorPreview=session.time;if(!audio?.playing||!['library','wardrobe','game','results'].includes(app.view))app.stage.render(session.time,C.tempoAt?.(app.chart||{},session.time)||120,{preview:true});
  const ctx=cv.getContext('2d'),source=app.stage.canvas,scale=Math.min(cv.width/source.width,cv.height/source.height),w=source.width*scale,h=source.height*scale;ctx.fillStyle='#050b16';ctx.fillRect(0,0,cv.width,cv.height);ctx.drawImage(source,(cv.width-w)/2,(cv.height-h)/2,w,h);
 }
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseAudition();});
 root.addEventListener('pagehide',()=>{session?.audition?.dispose();clearInterval(previewTimer);});
 // Re-open portable Director projects against the current pack; IDs stay explicit.
 panel.insertAdjacentHTML('beforeend','<button id="importDirector">Importer un Director JSON</button><input id="directorInput" type="file" accept=".json" hidden>');
 $('importDirector').onclick=()=>$('directorInput').click();$('directorInput').onchange=e=>{const f=e.target.files[0];e.target.value='';if(f)app.run(async()=>{if(f.size>4*1024*1024)throw Error('Director JSON limité à 4 Mo.');const raw=JSON.parse(await f.text());const owner=app.song,d=root.PulseDirectorEdit.readProject(raw,owner.duration,owner.scene.mmd?.assetIds);const ready=await app.openMMDDirector();if(!ready)throw Error('Un brouillon sauvegardé est protégé. Résous sa récupération, puis importe à nouveau ce Director.');if(app.song!==owner||!recoveryReady())throw Error('La session Director a changé.');session.history.push(structuredClone(session.draft));session.draft=d;renderDirector();},'Lecture du Director…');};
 wrap('showView',(old,...args)=>{if(session)app.closeModal();return old(...args);});
 // Capture only our dialog commands; typing, IME and the game keep their own keys.
 document.addEventListener('keydown',event=>{
  if(!recoveryReady()||!$('modal').classList.contains('director-modal')||app.busy)return;
  const target=event.target,editing=!!(target?.isContentEditable||target?.closest?.('input,textarea,select,[role="textbox"]'));
  if(target?.closest?.('.director-block')&&(event.key===' '||event.key==='Enter'))return;
  const command=root.PulseDirectorEdit.shortcut(event,editing);if(!command)return;
  event.preventDefault();event.stopImmediatePropagation();
  if(command==='cursorBack'||command==='cursorForward'){
   $('dTime').value=C.clamp(session.time+(command==='cursorBack'?-.1:.1),0,session.draft.duration);$('dTime').dispatchEvent(new Event('input'));
  }else{const button=$(command);if(button&&!button.disabled)button.click();}
  if(session&&$('modal').open)$('directorContent')?.focus({preventScroll:true});
 },true);
 const close=app.closeModal.bind(app);app.closeModal=function(){const r=close();$('modal').classList.remove('director-modal');return r;};
}
root.PulseV19=install;
})(globalThis);
