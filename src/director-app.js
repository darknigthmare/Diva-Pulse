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
 wrap('startGame',async(old,...args)=>{await old(...args);if(app.engine)$('gameModeLabel').textContent+=' · '+app.engine.profile.toUpperCase();});
 wrap('finish',async old=>{await old();if(app.lastResult&&app.engine)$('resultMode').textContent+=' · '+app.engine.profile.toUpperCase();});
 const panel=$('mmdPanel');panel.insertAdjacentHTML('beforeend',`<div class="buttons"><button id="importMmdFolder">＋ Importer un dossier</button><button id="openMmdDirector" class="primary">DIRECTOR · TIMELINE & PLANS</button></div><input id="mmdFolderInput" type="file" webkitdirectory multiple hidden>`);
 let session=null,previewTimer=null;
 app.directorRecoveries=new Map();app.directorDraftWrite=Promise.resolve();
 const draftKey=id=>'director-draft:'+id;
 function stashDraft(){if(!session||JSON.stringify(session.draft)===session.lastQueued)return;
  session.lastQueued=JSON.stringify(session.draft);// Returning to the initial state must also replace any older autosaved draft.
  const current=session,snapshot={id:draftKey(session.owner),songId:session.owner,packId:session.packId,director:structuredClone(session.draft),updatedAt:Date.now()};
  app.directorRecoveries.set(session.owner,snapshot);if($('dDraftStatus'))$('dDraftStatus').textContent='Sauvegarde du brouillon…';
  app.directorDraftWrite=app.directorDraftWrite.catch(()=>{}).then(()=>app.store.put('settings',snapshot)).then(()=>{if(session===current&&$('dDraftStatus'))$('dDraftStatus').textContent=app.store.persistent?'Brouillon sauvegardé localement':'Brouillon TEMPORAIRE · exporter avant fermeture';}).catch(e=>{if(session===current&&$('dDraftStatus'))$('dDraftStatus').textContent='Brouillon non sauvegardé · exporter le Director JSON';app.toast('Brouillon Director conservé en mémoire : '+e.message,true);});
 }
 function offerRecovery(){const current=session,owner=current.owner;Promise.resolve(app.directorRecoveries.get(owner)||app.store.get('settings',draftKey(owner))).then(saved=>{if(session!==current||!saved?.director||saved.status==='applied'||saved.songId!==owner||saved.packId!==current.packId||JSON.stringify(saved.director)===current.initialJSON)return;const box=$('dRecovery');if(!box)return;box.hidden=false;$('dRecover').onclick=()=>{try{const next=D.normalizeDirector(saved.director);session.history.push(structuredClone(session.draft));session.draft=next;session.redo=[];session.selection.clear();session.loaded=false;box.hidden=true;renderDirector();}catch(e){app.toast(e.message,true);}};}).catch(e=>app.toast('Lecture du brouillon impossible : '+e.message,true));
 }
 const closePreview=()=>{clearInterval(previewTimer);previewTimer=null;delete app.stage.directorPreview;if(session){session=null;app.modelLoaded=null;Promise.resolve(app.applyScene()).catch(e=>app.toast(e.message,true));}};
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
  session={draft:initial,initialJSON:JSON.stringify(initial),lastQueued:JSON.stringify(initial),owner:app.song.id,packId:app.song.scene.mmd.id,history:[],redo:[],loaded:false,time:0,selection:new Set(),clipboard:null,snap:0};
  app.openModal('<div class="eyebrow">DIRECTOR / ÉDITION NON DESTRUCTIVE</div><h2>MONTE TON SPECTACLE.</h2><p>Temps exprimés en secondes de la chanson. Les changements restent un brouillon jusqu’à Enregistrer. L’aperçu est silencieux.</p><div id="dRecovery" hidden><p>Un brouillon non appliqué existe pour ce morceau et ce pack.</p><button id="dRecover">Reprendre le brouillon</button></div><p id="dDraftStatus" role="status">Aucune modification non enregistrée.</p><p id="directorMessage" role="status"></p><div id="directorContent" tabindex="-1"></div>');
  $('modal').classList.add('director-modal');
  renderDirector();offerRecovery();
 };
 $('openMmdDirector').onclick=app.openMMDDirector;
 function mutate(fn){try{const next=structuredClone(session.draft);fn(next);const valid=D.normalizeDirector(next);if(JSON.stringify(valid)===JSON.stringify(session.draft))return;session.history.push(structuredClone(session.draft));session.history=session.history.slice(-60);session.redo=[];session.draft=valid;session.selection.clear();session.loaded=false;renderDirector();}catch(e){$('directorMessage').textContent=e.message;}}
 function options(files,value,empty){return '<option value="">'+empty+'</option>'+files.map(f=>`<option value="${esc(f.id)}" ${value===f.id?'selected':''}>${esc(f.name)}</option>`).join('');}
 function field(label,value,scope,extra=''){return `<label>${label}<input type="number" step=".01" value="${value}" ${scope} ${extra}></label>`;}
 function renderDirector(){
  if(!session)return;
  const E=root.PulseDirectorEdit;const picked=()=>[...session.selection];
  const batch=fn=>mutate(next=>Object.assign(next,fn(next)));
  const reportError=e=>{$('directorMessage').textContent=e.message;};
  const refreshSelection=()=>{for(const el of $('directorContent').querySelectorAll('[data-select]'))el.checked=session.selection.has(el.dataset.select);$('dSelected').textContent=session.selection.size+' éléments sélectionnés';};stashDraft();const d=session.draft,files=app.song.scene.mmd.files||[],models=files.filter(f=>f.role==='model'),motions=files.filter(f=>f.role==='motion'),sc=$('modal').scrollTop,expanded=new Set([...$('directorContent').querySelectorAll('details[open]')].map(el=>el.dataset.panel));
  $('directorContent').innerHTML=`<div class="director-toolbar"><label class="check"><input id="dEnabled" type="checkbox" ${d.enabled?'checked':''}> Activer</label>${field('Danseurs',d.count,'id="dCount"','min="1" max="4"')}${field('Espacement',d.spacing,'id="dSpacing"','min=".4" max="4"')}<label class="check"><input id="dCamera" type="checkbox" ${d.useCamera?'checked':''}> Caméra VMD</label></div><div class="buttons"><button id="dUndo" ${session.history.length?'':'disabled'}>Annuler</button><button id="dRedo" ${session.redo.length?'':'disabled'}>Rétablir</button><button id="dAuto">Auto-PV · remplacer le brouillon</button><button id="dExport">Exporter le Director JSON</button></div><fieldset class="director-batch"><legend>MONTAGE GROUPÉ</legend><div class="buttons"><button id="dSelectAll">Tout sélectionner</button><button id="dSelectNone">Désélectionner</button><button id="dCopy">Copier</button><button id="dPaste" ${session.clipboard?'':'disabled'}>Coller au curseur</button><button id="dDeleteSelected">Supprimer la sélection</button><button id="dSplit">Scinder au curseur</button></div><div class="director-row"><label>Décalage (s)<input id="dMoveDelta" type="number" step=".01" value="1"></label><button id="dMoveSelected">Déplacer le groupe</button><label>Grille musicale<select id="dSnap"><option value="0">Libre</option><option value=".25">Quart de temps</option><option value="0.3333333333333333">Triolet</option><option value=".5">Demi-temps</option><option value="1">Temps</option><option value="4">4 temps</option><option value="bar">Mesure réelle</option></select></label><button id="dSnapCursor">Aligner le curseur</button><button id="dAlignSelected">Aligner le groupe</button></div><output id="dSelected" aria-live="polite">${session.selection.size} éléments sélectionnés</output><p class="muted">Coche les clips et clés ci-dessous. Le collage conserve leurs écarts et leurs pistes. Toute collision ou sortie de durée annule l’opération entière. La grille suit les changements de tempo, la signature et les décalages de la partition. Aligner le groupe déplace son premier élément sans modifier les écarts. Scinder conserve le temps de la motion ; clips synchronisés au BPM et coupes dans un fondu refusés.</p><details><summary>Raccourcis de montage</summary><p>Ctrl/Cmd+A : tout sélectionner · C : copier · V : coller · Z : annuler · Maj+Z ou Y : rétablir · Ctrl/Cmd+S : enregistrer. Sans modificateur : Suppr : supprimer · S : scinder · G : aligner · flèches : curseur ±0,1 s. Les champs de saisie gardent leurs commandes natives.</p></details></fieldset><div id="dOverview" class="director-overview"></div><section class="director-preview"><label>Curseur <output id="dTimeLabel">${session.time.toFixed(2)} s</output><input id="dTime" type="range" min="0" max="${d.duration}" step=".01" value="${session.time}"></label><div class="buttons"><button id="dPreview">Charger l’aperçu du brouillon</button><button id="dSave" class="primary">ENREGISTRER LE SPECTACLE</button></div><canvas id="dPreviewCanvas" width="800" height="360" aria-label="Aperçu MMD au curseur"></canvas><p class="muted">Le glisser sur une bande déplace son clip ; les champs permettent le réglage précis. Les chevauchements sont refusés. Transition : fondu depuis la dernière pose du clip précédent, uniquement s’il est adjacent.</p></section><div id="dSlots"></div><details data-panel="keys" ${expanded.has("keys")?"open":""}><summary>Caméra & éclairage · clés manuelles</summary><p>La piste caméra manuelle est prioritaire sur une caméra VMD. Vide la piste pour revenir au VMD.</p><div class="buttons"><button id="dAddCamera">＋ Clé caméra au curseur</button><button id="dAddLight">＋ Clé lumière au curseur</button><button id="dClearCamera">Vider caméra</button><button id="dClearLight">Vider lumière</button></div><div id="dCameraRows"></div><div id="dLightRows"></div></details>`;
  for(let i=0;i<d.count;i++){
   const slot=d.slots[i],el=document.createElement('fieldset');el.className='director-slot';el.innerHTML=`<legend>DANSEUR ${i+1}</legend><div class="director-row"><label>Modèle<select data-s="${i}" data-field="modelAssetId">${options(models,slot.modelAssetId,'Modèle par défaut')}</select></label><label>Motion de base<select data-s="${i}" data-field="motionAssetId">${options(motions,slot.motionAssetId,'Motion par défaut')}</select></label>${field('Rotation °',slot.rotationY,`data-s="${i}" data-field="rotationY"`)}${field('Taille',slot.scale,`data-s="${i}" data-field="scale"`,'min=".25" max="3"')}</div><details data-panel="clips${i}" ${expanded.has("clips"+i)?"open":""}><summary>${slot.clips.length} clips · réglages détaillés</summary><button data-add="${i}">＋ Clip au curseur</button><div id="dClips${i}"></div></details>`;$('dSlots').append(el);
   slot.clips.forEach((c,j)=>{const row=document.createElement('div');row.className='director-clip';row.innerHTML=`<label class="check"><input type="checkbox" data-select="clip:${i}:${j}" aria-label="Sélectionner clip ${j+1} danseur ${i+1}"> Sélection</label><strong>${j+1}</strong><label>VMD<select data-s="${i}" data-c="${j}" data-field="motionAssetId">${options(motions,c.motionAssetId,'Sans VMD / mouvement ci-dessous')}</select></label><label>Mouvement procédural<select data-s="${i}" data-c="${j}" data-field="proceduralStyle">${['','pose','step','wave','clap','reach','idol'].map(v=>`<option value="${v}" ${c.proceduralStyle===v?'selected':''}>${v||'Pose VPD / repos'}</option>`).join('')}</select></label>${['start','end','rate','motionStart','transition','sourceBpm','loopBeats'].map((k,n)=>field(['Début s','Fin s','Vitesse','Départ VMD s','Fondu s','BPM source (vide = naturel)','Boucle (temps)'][n],c[k]??'',`data-s="${i}" data-c="${j}" data-field="${k}"`)).join('')}<label class="check"><input type="checkbox" data-s="${i}" data-c="${j}" data-field="loop" ${c.loop?'checked':''}> Boucle</label><label class="check"><input type="checkbox" data-s="${i}" data-c="${j}" data-field="camera" ${c.camera?'checked':''}> Caméra VMD</label><button data-del="${i},${j}" aria-label="Supprimer clip ${j+1} danseur ${i+1}">×</button>`;$('dClips'+i).append(row);});
   const lane=document.createElement('div');lane.className='director-lane';lane.innerHTML=`<span>D${i+1}</span><div class="director-strip"></div>`;const strip=lane.querySelector('.director-strip');
   slot.clips.forEach((c,j)=>{const clip=document.createElement('button');clip.className='director-block';clip.style.left=(c.start/d.duration*100)+'%';clip.style.width=((c.end-c.start)/d.duration*100)+'%';clip.textContent=String(j+1);clip.title=`${c.start.toFixed(2)} → ${c.end.toFixed(2)} s`;clip.onpointerdown=e=>{if(e.button!==0||!e.isPrimary)return;const from=e.clientX,left=c.start,span=c.end-c.start,width=strip.getBoundingClientRect().width;clip.setPointerCapture(e.pointerId);let target=left;clip.onpointermove=ev=>{if(ev.pointerId!==e.pointerId)return;target=C.clamp(left+(ev.clientX-from)/width*d.duration,0,d.duration-span);clip.style.left=target/d.duration*100+'%';};const cancel=()=>{clip.onpointermove=null;clip.onpointerup=null;clip.onpointercancel=null;clip.onlostpointercapture=null;clip.style.left=left/d.duration*100+'%';};clip.onpointercancel=cancel;clip.onlostpointercapture=cancel;clip.onpointerup=ev=>{if(ev.pointerId!==e.pointerId)return;cancel();if(clip.hasPointerCapture(e.pointerId))clip.releasePointerCapture(e.pointerId);mutate(next=>{next.slots[i].clips[j].start=+target.toFixed(3);next.slots[i].clips[j].end=+(target+span).toFixed(3);});};};strip.append(clip);});$('dOverview').append(lane);
  }
  for(const [kind,rows] of [['camera',d.cameraTrack],['light',d.lightTrack]])rows.forEach((k,i)=>{
   const row=document.createElement('div');row.className='director-key';const fields=kind==='camera'?['time','yaw','pitch','distance','fov']:['time','intensity'];row.innerHTML=`<label class="check"><input type="checkbox" data-select="${kind}:${i}" aria-label="Sélectionner clé ${kind} ${i+1}"> Sélection</label>`+fields.map(f=>field(({time:'Instant s',yaw:'Azimut °',pitch:'Inclinaison °',distance:'Distance',fov:'FOV °',intensity:'Intensité'})[f],k[f],`data-track="${kind}" data-k="${i}" data-field="${f}"`)).join('')+(kind==='light'?`<label>Couleur<input type="color" data-track="light" data-k="${i}" data-field="color" value="#${k.color.map(v=>Math.round(v*255).toString(16).padStart(2,'0')).join('')}"></label>`:'')+`<label>Courbe<select data-track="${kind}" data-k="${i}" data-field="easing">${['smooth','linear','step'].map(v=>`<option ${k.easing===v?'selected':''}>${v}</option>`).join('')}</select></label><button data-delkey="${kind},${i}" aria-label="Supprimer clé ${kind} ${i+1}">×</button>`;$(kind==='camera'?'dCameraRows':'dLightRows').append(row);
  });
  for(const el of $('directorContent').querySelectorAll('[data-field]'))el.onchange=()=>{const k=el.dataset.field;let value=el.type==='checkbox'?el.checked:el.tagName==='SELECT'?el.value:el.type==='color'?[1,3,5].map(i=>parseInt(el.value.slice(i,i+2),16)/255):Number(el.value);if(k.endsWith('AssetId'))value||=null;if(['sourceBpm','loopBeats'].includes(k)&&el.value==='')value=null;mutate(next=>{if(el.dataset.track)next[el.dataset.track+'Track'][+el.dataset.k][k]=value;else if(el.dataset.c!==undefined){const clip=next.slots[+el.dataset.s].clips[+el.dataset.c];clip[k]=value;if(k==='motionAssetId'){clip.sourceBpm=null;clip.loopBeats=null;}}else next.slots[+el.dataset.s][k]=value;});};
  for(const id of ['dEnabled','dCount','dSpacing','dCamera'])$(id).onchange=()=>mutate(next=>{next[{dEnabled:'enabled',dCount:'count',dSpacing:'spacing',dCamera:'useCamera'}[id]]=$(id).type==='checkbox'?$(id).checked:Number($(id).value);});
  $('dUndo').onclick=()=>{session.redo.push(session.draft);session.draft=session.history.pop();session.selection.clear();session.loaded=false;renderDirector();};$('dRedo').onclick=()=>{session.history.push(session.draft);session.draft=session.redo.pop();session.selection.clear();session.loaded=false;renderDirector();};
  for(const el of $('directorContent').querySelectorAll('[data-select]'))el.onchange=()=>{if(el.checked)session.selection.add(el.dataset.select);else session.selection.delete(el.dataset.select);refreshSelection();};
  $('dSelectAll').onclick=()=>{session.selection=new Set(E.all(session.draft));refreshSelection();};
  $('dSelectNone').onclick=()=>{session.selection.clear();refreshSelection();};
  $('dCopy').onclick=()=>{try{session.clipboard=E.copy(session.draft,picked());$('dPaste').disabled=false;$('directorMessage').textContent='Sélection copiée. Place le curseur puis colle.';}catch(e){reportError(e);}};
  $('dPaste').onclick=()=>batch(next=>E.paste(next,session.clipboard,session.time));
  $('dMoveSelected').onclick=()=>batch(next=>E.move(next,picked(),Number($('dMoveDelta').value)));
  $('dDeleteSelected').onclick=()=>batch(next=>E.remove(next,picked()));
  $('dSnap').value=String(session.snap);$('dSnap').onchange=()=>session.snap=$('dSnap').value==='bar'?'bar':Number($('dSnap').value);
  $('dSnapCursor').onclick=()=>{try{session.time=E.musicalSnap(session.time,app.chart||{},session.snap,d.duration);$('dTime').value=session.time;$('dTime').dispatchEvent(new Event('input'));}catch(e){reportError(e);}};
  $('dAlignSelected').onclick=()=>batch(next=>E.align(next,picked(),app.chart||{},session.snap));
  $('dSplit').onclick=()=>batch(next=>E.split(next,picked(),session.time));
  refreshSelection();
  $('dAuto').onclick=()=>mutate(next=>Object.assign(next,D.autoShow(app.song,app.chart,next,motions.map(m=>m.id))));
  for(const b of $('directorContent').querySelectorAll('[data-add]'))b.onclick=()=>mutate(next=>{const slot=next.slots[+b.dataset.add],start=session.time;slot.clips.push({start,end:Math.min(d.duration,start+4),motionAssetId:slot.motionAssetId||motions[0]?.id||null,rate:1,motionStart:0,transition:.3,loop:true,camera:false});});
  for(const b of $('directorContent').querySelectorAll('[data-del]'))b.onclick=()=>mutate(next=>{const [s,c]=b.dataset.del.split(',').map(Number);next.slots[s].clips.splice(c,1);});
  for(const kind of ['Camera','Light']){$('dAdd'+kind).onclick=()=>mutate(next=>next[kind.toLowerCase()+'Track'].push({time:session.time}));$('dClear'+kind).onclick=()=>mutate(next=>next[kind.toLowerCase()+'Track']=[]);}
  for(const b of $('directorContent').querySelectorAll('[data-delkey]'))b.onclick=()=>mutate(next=>{const [t,i]=b.dataset.delkey.split(',');next[t+'Track'].splice(+i,1);});
  $('dExport').onclick=()=>root.PulseServices.download(JSON.stringify({format:'DIVA-PULSE-DIRECTOR',version:19,director:session.draft},null,2),app.song.title+'.director.json');
  $('dTime').oninput=()=>{session.time=+$('dTime').value;$('dTimeLabel').textContent=session.time.toFixed(2)+' s';if(session.loaded){app.stage.directorPreview=session.time;app.stage.render(session.time,app.chart?.bpm||120,{preview:true});drawPreview();}};
  $('dPreview').onclick=()=>app.run(async()=>{if(!app.stage.available)throw Error('WebGL2 indisponible : l’édition reste possible sans aperçu 3D.');const current=session;await applyDirector(app,{...app.song.scene,mmdDirector:{...current.draft,enabled:true}});if(session!==current)return;session.loaded=true;app.stage.directorPreview=session.time;app.stage.render(session.time,app.chart?.bpm||120,{preview:true});drawPreview();clearInterval(previewTimer);previewTimer=setInterval(drawPreview,180);$('directorMessage').textContent='Aperçu chargé. Déplace le curseur pour examiner le spectacle.';},'Préparation de l’aperçu MMD…');
  $('dSave').onclick=()=>app.run(async()=>{const current=session,owner=app.song;if(!current||current.owner!==owner.id)throw Error('Le morceau a changé.');await app.directorDraftWrite;if(session!==current||app.song!==owner)throw Error('La session Director a changé.');const rows=E.publication(owner,current.draft,current.packId);await app.store.atomic(rows);Object.assign(owner,rows[0][1]);app.directorRecoveries.delete(current.owner);if(session===current){app.closeModal();renderMMD();}app.toast('Spectacle et fin du brouillon enregistrés ensemble. Les partitions sont inchangées.');},'Sauvegarde du spectacle…');
  $('modal').scrollTop=sc;$('directorMessage').textContent='Brouillon — '+d.slots.reduce((n,s)=>n+s.clips.length,0)+' clips · '+d.cameraTrack.length+' clés caméra · '+d.lightTrack.length+' clés lumière.';
 }
 function drawPreview(){const cv=$('dPreviewCanvas');if(!session?.loaded||!cv||!app.stage.available)return;const ctx=cv.getContext('2d');const source=app.stage.canvas,scale=Math.min(cv.width/source.width,cv.height/source.height),w=source.width*scale,h=source.height*scale;ctx.fillStyle='#050b16';ctx.fillRect(0,0,cv.width,cv.height);ctx.drawImage(source,(cv.width-w)/2,(cv.height-h)/2,w,h);}
 // Re-open portable Director projects against the current pack; IDs stay explicit.
 panel.insertAdjacentHTML('beforeend','<button id="importDirector">Importer un Director JSON</button><input id="directorInput" type="file" accept=".json" hidden>');
 $('importDirector').onclick=()=>$('directorInput').click();$('directorInput').onchange=e=>{const f=e.target.files[0];e.target.value='';if(f)app.run(async()=>{if(f.size>4*1024*1024)throw Error('Director JSON limité à 4 Mo.');const raw=JSON.parse(await f.text());const d=root.PulseDirectorEdit.readProject(raw,app.song.duration,app.song.scene.mmd?.assetIds);app.openMMDDirector();session.draft=d;renderDirector();},'Lecture du Director…');};
 wrap('showView',(old,...args)=>{if(session)app.closeModal();return old(...args);});
 // Capture only our dialog commands; typing, IME and the game keep their own keys.
 document.addEventListener('keydown',event=>{
  if(!session||!$('modal').open||!$('modal').classList.contains('director-modal')||app.busy)return;
  const target=event.target,editing=!!(target?.isContentEditable||target?.closest?.('input,textarea,select,[role="textbox"]'));
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
