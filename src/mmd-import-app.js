/* V21 explicit preflight, local ZIP, disposable renderer preview and reusable cast. */
(function(root){'use strict';
const C=root.PulseCore,M=root.PulseMMD,K=root.PulseMMDCompat,P=root.PulseMMDPackage,A=root.PulseMMDAudit,$=id=>document.getElementById(id),MB=1024*1024;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function install(app){
 const wrap=(name,fn)=>{const old=app[name].bind(app);app[name]=(...args)=>fn(old,...args);};
 let active=null,preview=null,timer=null;
 function disposePreview(){clearInterval(timer);timer=null;if(preview){preview.clearCustom();preview.clearDirector();preview.gl?.getExtension('WEBGL_lose_context')?.loseContext();preview=null;}}
 wrap('openModal',(old,...args)=>{disposePreview();active=null;$('modal').classList.remove('mmd-import-modal');return old(...args);});
 wrap('closeModal',old=>{disposePreview();active=null;$('modal').classList.remove('mmd-import-modal');return old();});
 async function decodeTexture(file){
  if(/\.tga$/i.test(file.name)){const im=K.parseTGA(await file.arrayBuffer());return {width:im.width,height:im.height};}
  if(!root.createImageBitmap)return {warning:'Décodage image non vérifié par ce navigateur.'};
  const bm=await createImageBitmap(file);const r={width:bm.width,height:bm.height};bm.close();if(!r.width||!r.height||r.width>8192||r.height>8192||r.width*r.height>16777216)throw Error('Image limitée à 8192 px et 16 millions de pixels.');return r;
 }
 app.prepareMMDImport=async function(input,opts={}){
  const sourceSong=this.song;if(!sourceSong)throw Error('Choisir un morceau.');let files=[...input],archive=null;
  if(files.length===1&&/\.zip$/i.test(files[0].name)){archive=await P.unpackZip(files[0],opts);files=archive.files;}
  const selected=files.filter(f=>P.EXT.test(f.name)),ignored=files.filter(f=>!P.EXT.test(f.name)).map(f=>f.name).concat(archive?.ignored||[]);
  if(!selected.length||selected.length>200||selected.reduce((n,f)=>n+f.size,0)>180*MB)throw Error('Pack : 1 à 200 fichiers MMD/textures et 180 Mo maximum. RAR/7z : décompresser puis importer le dossier.');
  const seen=new Set(),entries=[],models=[],invalidFiles=[];
  for(const blob of selected){const name=blob.webkitRelativePath||blob.name,key=K.pathKey(name);if(seen.has(key))throw Error('Chemin dupliqué : '+name);seen.add(key);if(blob.size>80*MB)throw Error('Fichier limité à 80 Mo : '+name);
   const kind=M.ext(name),model=['pmx','pmd'].includes(kind),e={id:C.uid(),name,kind,role:model?'model':kind==='vmd'?'motion':kind==='vpd'?'pose':'texture',blob,size:blob.size,info:{kind}};
   entries.push(e);if(model)continue;
   try{const info=await M.inspect(blob);e.role=M.role(info);e.info={kind:info.kind,duration:info.duration,motionCount:info.motionCount,cameraCount:info.cameraCount,morphCount:info.morphCount};
    if(kind==='vmd')e.info.motionFeatures=root.PulseAutoShow.motionFeatures(M.parseVmd(await blob.arrayBuffer(),{full:true}));
    if(e.role==='texture')e.info.dimensions=await decodeTexture(blob);
   }catch(err){if(e.role==='texture')e.decodeError=err.message;else{e.invalid=err.message;invalidFiles.push({name,error:err.message});}}
   await new Promise(r=>setTimeout(r,0));
  }
  for(const e of entries.filter(f=>f.role==='model')){
   try{const m=e.kind==='pmx'?M.parsePmx(await e.blob.arrayBuffer(),{full:true}):M.parsePmd(await e.blob.arrayBuffer(),{full:true});const report=A.auditModel(m,e.name,entries);e.info={kind:e.kind,name:m.name,version:m.version,boneNames:report.boneNames,morphNames:report.morphNames,warnings:report.warnings,compatibility:report};models.push(report);
   }catch(err){e.invalid=err.message;models.push({name:e.name,format:e.kind.toUpperCase(),status:'blocked',blockers:[err.message],warnings:[],textures:[],compatibleMotions:[],missingTextures:0});}
   await new Promise(r=>setTimeout(r,0));
  }
  if(!models.length)throw Error('Aucun modèle PMX/PMD. Un VMD est une motion, un PMM un projet : ce ne sont pas des modèles.');
  const report={version:21,archive:archive?.archive||null,encoding:archive?.encoding||null,models,ignored,invalidFiles,rendererAvailable:app.stage.available,limits:{bones:1024,vertices:350000,triangles:500000,models:4},notice:'Contrôle technique, pas certification de fidélité. Bullet/soft bodies et effets MME ne sont pas exécutés ; toon simplifié.'};
  return {entries,report,songId:sourceSong.id,sceneVersion:JSON.stringify(sourceSong.scene)};
 };
 app.commitMMDImport=async function(plan,{models,allowMissing=false}={}){
  if(this.song?.id!==plan.songId||JSON.stringify(this.song.scene)!==plan.sceneVersion)throw Error('Le morceau ou la scène a changé : relancer le contrôle avant import.');
  models||=plan.report.models.filter(m=>!m.blockers.length).slice(0,4).map(m=>m.name);
  const reports=A.selectedReport(plan.report,models);if(!allowMissing&&reports.some(m=>m.missingTextures))throw Error('Textures manquantes/illisibles. Complète le dossier ou accepte explicitement le rendu incomplet.');
  const names=new Set(models),entries=plan.entries.filter(e=>e.role==='model'?names.has(e.name):!e.invalid&&!e.decodeError),ids=new Set(entries.map(e=>e.id));
  const pixelBytes=entries.filter(e=>e.role==='texture').reduce((n,e)=>n+(e.info.dimensions?.width||0)*(e.info.dimensions?.height||0)*4,0)*reports.length;
  if(pixelBytes>384*MB)throw Error('Budget textures dépassé pour cette troupe (384 Mo estimés). Réduire les textures ou le nombre de modèles.');
  const project={id:C.uid(),offsetMs:0,rate:1,ik:true,useCamera:true,loop:false,physics:false,assetIds:[...ids],files:entries.map(({blob,decodeError,invalid,...e})=>e),warnings:[...new Set(reports.flatMap(m=>m.warnings))],compatibilityReport:{...plan.report,models:reports}};
  const scene=structuredClone(this.song.scene);scene.mmd=project;delete scene.mmdDirector;delete scene.mmdInheritedFrom;
  if(scene.autoShow){scene.autoShow.director=null;scene.autoShow.basis='mmd-pack-replaced';scene.autoShow.locks.choreography=false;scene.autoShow.overrides.choreography=false;}
  const song=this.song,candidate={...song,scene},ops=entries.map(e=>['assets',{id:e.id,name:e.name,blob:e.blob,kind:'mmd-'+e.role}]);ops.push(['songs',candidate]);
  await this.store.atomic(ops);Object.assign(song,candidate);this.modelLoaded=null;
  try{await this.applyScene();}catch(e){this.lastMMDDiagnostic=['Pack enregistré mais rendu non chargé : '+e.message];}
  this.renderMMD();this.renderLibrary();$('mmdPanel').open=true;this.toast('Pack enregistré : '+reports.length+' modèle(s). '+(this.stage.available?'Consulte le rendu et les diagnostics.':'WebGL2 absent : scène 2D de secours.'));return project;
 };
 // Keep the programmatic API while making the UI a two-phase preflight/commit flow.
 app.importMMDFiles=async function(files,opts={}){return this.commitMMDImport(await this.prepareMMDImport(files,opts),opts);};
 function chosen(){return [...$('modal').querySelectorAll('[data-import-model]:checked')].map(e=>e.value);}
 function updateButton(){if(!active)return;const models=active.report.models.filter(m=>chosen().includes(m.name)),bad=!models.length||models.length>4||models.some(m=>m.blockers.length)||models.some(m=>m.missingTextures)&&!$('miMissing').checked;$('miCommit').disabled=bad;$('miPreview').disabled=models.length!==1||!app.stage.available;$('miCount').textContent=models.length+' modèle(s) choisi(s) / 4 maximum';}
 async function showPreflight(files,opts={}){
  const plan=await app.prepareMMDImport(files,opts);app.openModal(`<div class="eyebrow">MMD / CONTRÔLE AVANT IMPORT</div><h2>TON MODÈLE, AVANT LA SCÈNE.</h2><p>Un PMX/PMD contient le modèle. Les textures doivent l’accompagner ; les VMD sont des animations séparées. Aucun fichier de ce pack n’est encore enregistré.</p><p class="muted">${esc(plan.report.notice)}</p>${!app.stage.available?'<p class="mmd-alert">WebGL2 indisponible : édition et sauvegarde possibles, mais pas de personnages 3D ici.</p>':''}<div class="mmd-model-audits">${plan.report.models.map((m,i)=>`<article class="mmd-model-audit ${m.status}"><label class="check"><input type="checkbox" data-import-model value="${esc(m.name)}" ${!m.blockers.length&&i<4?'checked':''} ${m.blockers.length?'disabled':''}><strong>${esc(m.name)}</strong></label><p>${m.blockers.length?'REFUSÉ':m.status==='partial'?'IMPORTABLE AVEC LIMITES':'STRUCTURE IMPORTABLE · à vérifier visuellement'}</p>${m.stats?`<p>${m.stats.vertices.toLocaleString('fr')} sommets · ${m.stats.triangles.toLocaleString('fr')} triangles · ${m.stats.bones} os · ${m.stats.materials} matériaux<br>Danse auto : ${m.stats.proceduralBones} os reconnus. Textures à compléter : ${m.missingTextures}.${m.physics?.bodies?'<br>Physique : '+m.physics.bodies+' corps / '+m.physics.joints+' articulations — dynamique secondaire optionnelle, pas Bullet.':''}</p>`:''}${m.blockers.map(e=>`<p class="mmd-alert">${esc(e)}</p>`).join('')}<details ${m.missingTextures?'open':''}><summary>${m.warnings.length} avertissement(s) & compatibilité des motions</summary>${m.warnings.map(e=>`<p>${esc(e)}</p>`).join('')}${m.compatibleMotions.map(v=>`<p>VMD ${esc(v.name)} : ${v.matched}/${v.total} noms d’os correspondants · ${v.matchedMorphs||0}/${v.totalMorphs||0} morphs correspondants. Ce ratio ne certifie pas une chorégraphie adaptée.</p>`).join('')}</details></article>`).join('')}</div>${plan.report.invalidFiles.length?`<p class="mmd-alert">Motions/poses invalides exclues : ${plan.report.invalidFiles.map(f=>esc(f.name)+' — '+esc(f.error)).join('; ')}</p>`:''}<p>${plan.report.ignored.length} fichier(s) hors runtime ignoré(s) ; aucun script ni effet MME exécuté.</p><label class="check"><input id="miMissing" type="checkbox"> J’accepte les textures absentes/illisibles : rendu incomplet, matériaux de secours.</label><p id="miCount"></p><div class="buttons"><button id="miPreview">Tester un modèle en 3D sans enregistrer</button><button id="miExport">Exporter le diagnostic JSON</button><button id="miCommit" class="primary">${app.song.scene.mmd?'Remplacer le pack et sa timeline':'Importer la sélection'}</button><button id="miCancel">Annuler sans modifier le morceau</button></div>${app.song.scene.mmd?'<p class="mmd-alert">Ce remplacement détache la timeline MMD précédente. Exporte le morceau pour la conserver. Les partitions restent intactes.</p>':''}<p id="miMessage" role="status"></p><canvas id="miCanvas" width="800" height="450" hidden aria-label="Aperçu technique du modèle MMD"></canvas>`);
  active=plan;$('modal').classList.add('mmd-import-modal');for(const e of $('modal').querySelectorAll('[data-import-model],#miMissing'))e.onchange=updateButton;
  $('miCancel').onclick=()=>app.closeModal();$('miExport').onclick=()=>root.PulseServices.download(JSON.stringify(plan.report,null,2),'DIVA_PULSE_DIAGNOSTIC_MMD.json');
  $('miCommit').onclick=()=>app.run(async()=>{await app.commitMMDImport(plan,{models:chosen(),allowMissing:$('miMissing').checked});app.closeModal();},'Enregistrement atomique du pack MMD…');
  $('miPreview').onclick=()=>app.run(async()=>{
   disposePreview();const m=plan.entries.find(e=>e.name===chosen()[0]),textures=plan.entries.filter(e=>e.role==='texture'&&!e.decodeError),r=plan.report.models.find(e=>e.name===m.name),match=r.compatibleMotions.find(x=>x.matched>0||x.matchedMorphs>0),v=match?plan.entries.find(e=>e.name===match.name):null;
   const canvas=$('miCanvas');canvas.hidden=false;preview=new root.PulseStage.Stage(canvas);if(!preview.available)throw Error('Aperçu WebGL2 indisponible.');preview.cameraMode='front';
   const stage=preview;const info=await stage.loadMMD(await m.blob.arrayBuffer(),v?[await v.blob.arrayBuffer()]:[],null,textures,m.name);if(active!==plan||preview!==stage){stage.clearCustom();stage.gl?.getExtension('WEBGL_lose_context')?.loseContext();return;}stage.custom.useIK=true;stage.custom.loop=true;
   if(!v)Object.assign(stage.custom,root.PulseAutoShow.proceduralMotion(stage.custom.bones,'wave',.5));
   const start=performance.now();stage.render(1,120,{preview:true});timer=setInterval(()=>{if(stage===preview)stage.render((performance.now()-start)/1000,120,{preview:true});},70);
   app.lastMMDPreview={name:m.name,bones:info.bones,rendered:true,glError:stage.gl.getError()};$('miMessage').textContent='Aperçu technique à 120 BPM : '+info.bones+' os. '+(v?'VMD : '+v.name:'Mouvement procédural sur les os reconnus.')+' Rien n’est enregistré.';
  },'Test de rendu MMD…');updateButton();return plan;
 }
 const panel=$('mmdPanel');panel.insertAdjacentHTML('beforeend',`<section class="mmd-import-guide"><h3>IMPORTER UN MODÈLE TÉLÉCHARGÉ</h3><p>ZIP ou dossier complet, textures incluses. RAR/7z : décompresser d’abord. PMM, X, effets MME et scripts ne sont pas chargés.</p><div class="buttons"><button id="importMmdZip">＋ Importer un ZIP MMD</button><label>Noms dans les ZIP anciens<select id="mmdZipEncoding"><option value="auto">Auto UTF-8 / japonais</option><option value="utf-8">UTF-8</option><option value="shift-jis">Japonais Shift-JIS</option></select></label><button id="showMmdAudit">Diagnostic du pack actuel</button></div><input id="mmdZipInput" type="file" accept=".zip" hidden><div class="buttons"><button id="setDefaultMmd">Utiliser cette troupe pour les futures musiques</button><button id="clearDefaultMmd">Ne plus réutiliser automatiquement</button></div><p id="mmdDefaultStatus" role="status"></p></section>`);
 for(const id of ['mmdInput','mmdFolderInput','mmdZipInput'])$(id).onchange=e=>{const files=[...e.target.files];e.target.value='';if(files.length)app.run(()=>showPreflight(files,{encoding:$('mmdZipEncoding').value}),'Contrôle local des modèles & textures…');};
 $('mmdInput').accept='.pmx,.pmd,.vmd,.vpd,.png,.jpg,.jpeg,.bmp,.tga,.sph,.spa,.webp,.zip';$('importMmdZip').onclick=()=>$('mmdZipInput').click();
 $('showMmdAudit').onclick=()=>{const r=app.song?.scene?.mmd?.compatibilityReport;if(!r)return app.toast('Réimporte ce pack pour obtenir le contrôle V21.');app.openModal('<h2>DIAGNOSTIC DU PACK</h2><p>Contrôle à l’import, non certification visuelle. Les limites de rendu restent applicables.</p><pre class="mmd-report">'+esc(JSON.stringify(r,null,2))+'</pre>');};
 function renderDefault(){const source=app.songs.find(s=>s.id===app.settings.mmdDefaultSourceId);$('mmdDefaultStatus').textContent=source?.scene?.mmd?'Nouvelles musiques → troupe de « '+source.title+' ». Les scènes déjà créées ne changent pas.':'Aucune troupe automatique. Choisis un morceau contenant ton pack puis active ce réglage.';}
 wrap('renderMMD',old=>{old();renderDefault();});wrap('renderLibrary',old=>{old();renderDefault();});
 $('setDefaultMmd').onclick=()=>app.run(async()=>{if(!app.song?.scene?.mmd)throw Error('Importer un pack MMD avant de le choisir.');const prefs={...app.settings,mmdDefaultSourceId:app.song.id};await app.store.put('settings',prefs);app.settings=prefs;renderDefault();},'Choix de la troupe…');
 $('clearDefaultMmd').onclick=()=>app.run(async()=>{const prefs={...app.settings,mmdDefaultSourceId:null};await app.store.put('settings',prefs);app.settings=prefs;renderDefault();},'Réglage de la troupe…');
 // Insert the source pack before Auto Show sees a newly imported song.
 const put=app.store.put.bind(app.store),atomic=app.store.atomic.bind(app.store);
 async function inherited(song){if(!app.settings.mmdDefaultSourceId||app.songs.some(s=>s.id===song.id))return song;const source=await app.store.get('songs',app.settings.mmdDefaultSourceId);if(!source?.scene?.mmd)return song;for(const id of source.scene.mmd.assetIds||[]){const a=await app.store.get('assets',id);if(!a?.blob)return song;}return A.attachDefault(song,source);}
 app.store.put=async function(n,v){if(n!=='songs')return put(n,v);const next=await inherited(v);await put(n,next);v.scene=next.scene;};
 app.store.atomic=async function(rows,options={}){const opts=structuredClone(options);const restoring=rows.some(([n])=>n==='settings'),staged=[];for(const [n,v] of rows)staged.push([n,n==='songs'&&!restoring?await inherited(v):v]);await atomic(staged,opts);rows.forEach(([n,v],i)=>{if(n==='songs')v.scene=staged[i][1].scene;});};
 document.documentElement.dataset.mmdImportReady='true';
}
root.PulseMMDImportApp=install;
})(globalThis);
