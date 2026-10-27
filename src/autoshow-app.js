/* V20 automatic show lifecycle. Changes are staged, then committed atomically. */
(function(root){
'use strict';
const A=root.PulseAutoShow,C=root.PulseCore,D=root.PulseDirector,$=id=>document.getElementById(id);
const labels={stage:'Scène & décor',choreography:'Chorégraphie',formations:'Formations & présence',camera:'Caméra & déplacements',lighting:'Lumière'};
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function install(app){
 const wrap=(name,fn)=>{const old=app[name].bind(app);app[name]=(...args)=>fn(old,...args);};
 const prepare=s=>A.prepare(s,{enabled:app.settings.autoShowImport!==false});
 wrap('openModal',(old,...args)=>{$('modal').classList.remove('auto-show-modal');return old(...args);});
 wrap('closeModal',old=>{$('modal').classList.remove('auto-show-modal');return old();});
 // Do not publish an automatically modified scene before the store commit.
 const put=app.store.put.bind(app.store),atomic=app.store.atomic.bind(app.store);
 app.store.put=async function(name,value){if(name!=='songs')return put(name,value);const next=prepare(value);await put(name,next);value.scene=next.scene;if(app.song?.id===value.id)app.stage.autoShowPlan=next.scene.autoShow?.mode==='off'?null:next.scene.autoShow;};
 app.store.atomic=async function(rows){const staged=rows.map(([n,v])=>[n,n==='songs'?prepare(v):v]);await atomic(staged);rows.forEach(([n,v],i)=>{if(n==='songs')v.scene=staged[i][1].scene;});};
 // The plan owns only extra data; source fields and charts stay unchanged.
 app.ensureAutoShow=async function(song=this.song,opts={}){if(!song)return null;const next=A.prepare(song,{enabled:this.settings.autoShowImport!==false,...opts});if(JSON.stringify(next.scene)!==JSON.stringify(song.scene)){await this.store.put('songs',next);song.scene=next.scene;}return song.scene.autoShow||null;};
 const oldDirector=root.PulseV10.applyDirector;
 root.PulseV10.applyDirector=async function(a,scene){const config=A.effectiveDirector(scene);return oldDirector(a,config?{...scene,mmdDirector:config}:scene);};
 const oldReferences=D.assetReferences,oldRemap=D.remapScene;
 D.assetReferences=scene=>[...new Set([...oldReferences(scene),...(scene?.autoShow?.director?oldReferences({mmdDirector:scene.autoShow.director}):[])])];
 D.remapScene=function(scene,map){const s=oldRemap(scene,map),next=A.remapPlan(s,map);if(next.autoShow){next.autoShow=A.validate(next.autoShow);next.autoShow.snapshots=A.snapshots(next);}return next;};
 wrap('applyScene',async old=>{
  if(app.song){try{await app.ensureAutoShow();app.autoShowError=null;}catch(e){app.autoShowError=e.message;app.toast('Spectacle automatique non enregistré : '+e.message,true);}
   app.stage.autoShowPlan=app.song.scene.autoShow?.mode!=='off'?app.song.scene.autoShow:null;
  }
  const out=await old();const p=app.stage.autoShowPlan;
  if(p&&!p.overrides.stage)app.stage.setStage(p.stageTrack[0]?.stage||app.song.scene.stage);
  if($('autoShowStatus'))renderStatus();return out;
 });
 wrap('applySettings',old=>{app.settings.autoShowImport??=true;old();});
 $('settings').insertAdjacentHTML('beforeend',`<section class="settings-card auto-show-settings"><div class="eyebrow">20 / AUTO SHOW</div><h2>UNE MUSIQUE. UN SPECTACLE.</h2><label class="check"><input id="autoShowImport" type="checkbox" checked> Créer un spectacle à l’import et compléter les morceaux sans spectacle</label><p>Les réglages manuels sont prioritaires. Chaque piste automatique reste indépendante des notes et peut être protégée. Les VMD disponibles sont montés ; sinon des mouvements procéduraux sont utilisés.</p><button id="autoShowLibrary">Compléter les spectacles de la bibliothèque</button><p id="autoShowBatchStatus" role="status"></p></section>`);
 $('autoMapQuick').closest('.automap-importbar').insertAdjacentHTML('beforeend','<label class="check"><input id="autoShowQuick" type="checkbox" checked> Spectacle automatique</label>');
 $('chartInfo').insertAdjacentHTML('afterend','<div class="auto-show-card"><div><span class="eyebrow">AUTO SHOW</span><p id="autoShowStatus" role="status"></p></div><button id="openAutoShow">SPECTACLE · AUTO / MANUEL</button></div>');
 $('mmdPanel').insertAdjacentHTML('beforeend','<button id="wardrobeAutoShow">Spectacle automatique · scène, danse, caméra</button>');
 wrap('renderSettings',old=>{old();$('autoShowImport').checked=app.settings.autoShowImport!==false;$('autoShowQuick').checked=app.settings.autoShowImport!==false;});
 for(const id of ['autoShowImport','autoShowQuick'])$(id).onchange=()=>app.run(async()=>{const prefs={...app.settings,autoShowImport:$(id).checked};await app.store.put('settings',prefs);app.settings=prefs;app.renderSettings();},'Réglage du spectacle automatique…');
 function renderStatus(){const p=app.song?.scene?.autoShow;const el=$('autoShowStatus');if(!el)return;
  if(!p)el.textContent='Non préparé · création au chargement si activée.';
  else if(p.mode==='off')el.textContent='Désactivé pour ce morceau · scène manuelle conservée.';
  else {const n=A.TRACKS.filter(k=>p.locks[k]).length;el.textContent=`${p.mode==='manual'?'Proposition figée':'Spectacle préparé'} · ${p.sections.length} phrases · ${p.director?'MMD + motions':'mouvements procéduraux'} · ${n} piste(s) protégée(s)`;}
  if(app.autoShowError)el.textContent+=' · Écriture refusée, ancienne scène conservée.';
 }
 wrap('renderLibrary',old=>{old();renderStatus();});
 $('openAutoShow').onclick=() => app.openAutoShow();$('wardrobeAutoShow').onclick=()=>app.openAutoShow();
 app.openAutoShow=function(){
  const song=this.song,p=song.scene.autoShow;
  this.openModal(`<div class="eyebrow">AUTO SHOW / ${esc(song.title)}</div><h2>LE SPECTACLE SUIT TA MUSIQUE.</h2><p>Proposition déterministe et locale. Le travail manuel n’est jamais remplacé par une simple réimportation. Déverrouiller une piste autorise explicitement l’auto à la reprendre ; ses anciennes valeurs manuelles restent dans la scène.</p><div class="auto-show-options"><label>État<select id="asMode"><option value="auto">Automatique · compléter les pistes libres</option><option value="manual">Figé · ne plus régénérer</option><option value="off">Désactivé · utiliser la scène manuelle</option></select></label><label>Ambiance<select id="asMood"><option value="balanced">Équilibrée</option><option value="calm">Calme · scène stable</option><option value="concert">Concert</option></select></label><label>Variante / graine<input id="asSeed" type="number" step="1" min="0" max="2147483647" value="${p?.seed||0}"></label></div><div class="auto-show-locks">${A.TRACKS.map(k=>`<label class="check"><input id="asLock-${k}" type="checkbox" ${p?.locks[k]?'checked':''}> Protéger ${labels[k].toLowerCase()}${p?.overrides[k]?' · réglage manuel prioritaire':''}</label>`).join('')}</div><div class="buttons"><button id="asApply" class="primary">Enregistrer / générer les pistes libres</button><button id="asAnalyze">Réexaminer l’audio & les motions</button><button id="asWatch">Voir le PV avec la musique</button><button id="asExport">Exporter le plan & diagnostic</button></div><p class="muted">Les caméras sont continues, sans stroboscope. L’option Réduire les mouvements stabilise aussi la caméra automatique. Les fichiers VMD ne sont pas transformés en chorégraphies officielles de la chanson.</p><div class="auto-show-summary">${p?`<p>${p.count} personnage(s), ${p.cameraTrack.length} clés caméra, ${p.lightTrack.length} clés lumière. ${song.analysis?'Analyse audio disponible.':'Grille disponible, analyse audio non effectuée.'}</p><p>${p.warnings.map(esc).join(' ')}</p><details><summary>Voir les ${p.sections.length} phrases</summary><div class="auto-show-sections">${p.sections.map((s,i)=>`<p><strong>${s.from.toFixed(2)}–${s.to.toFixed(2)} s</strong> ${esc(s.label)} · énergie ${Math.round(s.energy*100)} % · ${esc(p.danceTracks[0]?.[i]?.style||'pose')}</p>`).join('')}</div></details>`:'La proposition sera créée sans modifier la partition.'}</div><p id="asMessage" role="status"></p>`);
  $('modal').classList.add('auto-show-modal');
  $('asMode').value=p?.mode||'auto';$('asMood').value=p?.mood||'balanced';
  $('asApply').onclick=()=>this.run(async()=>{
   if(this.song.id!==song.id)throw Error('Le morceau a changé.');
   const seed=Number($('asSeed').value);if(!Number.isInteger(seed)||seed<0||seed>2147483647)throw Error('La graine doit être un entier positif.');
   const mode=$('asMode').value,mood=$('asMood').value,old=song.scene.autoShow||A.generate(song,{seed,mood});
   const locks=Object.fromEntries(A.TRACKS.map(k=>[k,$('asLock-'+k).checked])),unlock=A.TRACKS.filter(k=>!locks[k]);
   let candidate={...song,scene:{...song.scene,autoShow:{...structuredClone(old),mode:'auto',locks}}};
   candidate=A.prepare(candidate,{enabled:true,regenerate:mode==='auto',seed,mood,unlock:mode==='auto'?unlock:[]});candidate.scene.autoShow.mode=mode;
   await this.store.put('songs',candidate);Object.assign(song,candidate);this.closeModal();this.modelLoaded=null;await this.applyScene();this.renderLibrary();this.toast('Spectacle enregistré. Les notes et les pistes protégées sont conservées.');
  },'Construction du spectacle…');
  $('asAnalyze').onclick=()=>this.run(async()=>{this.closeModal();await this.analyzeAutoShow(song);await this.applyScene();this.renderLibrary();this.openAutoShow();},'Analyse locale du spectacle…');
  $('asWatch').onclick=()=>this.run(async()=>{this.closeModal();await this.startGame('pv');},'Préparation du PV…');
  $('asExport').onclick=()=>{if(!p)return this.toast('Créer le spectacle avant de l’exporter.',true);root.PulseServices.download(JSON.stringify({format:'DIVA-PULSE-AUTO-SHOW',version:20,audioHash:song.audioHash||null,title:song.title,plan:p},null,2),song.title+'.pulseshow.json');};
 };
 app.analyzeAutoShow=async function(song){
  const candidate=structuredClone(song);this.analysisAbort=new AbortController();const signal=this.analysisAbort.signal;$('cancelAnalysis').hidden=false;
  try{
   let buffer=this.buffers.get(song.id);
   if(!buffer){if(song.builtin){const demo=C.DEMOS.find(d=>d.id===song.demoId);await this.audio.init();const synth=C.synthDemo(demo);buffer=this.audio.fromSamples(synth.samples,synth.sampleRate);}else {const asset=await this.store.get('assets',song.audioAsset);if(!asset?.blob)throw Error('Audio absent : réimporter le fichier.');buffer=await this.audio.decode(asset.blob);}}
   // Built-in synthesis uses the same tested preparation path as playback.
   candidate.analysis=await this.audio.analyze(buffer,{signal,onProgress:(v,text)=>this.mappingProgress(v,text)});
   for(const f of candidate.scene.mmd?.files||[]){if(signal.aborted)throw Error('Analyse annulée.');if(!['model','motion'].includes(f.role))continue;const a=await this.store.get('assets',f.id);if(!a?.blob)throw Error('Média MMD absent : '+f.name);const bytes=await a.blob.arrayBuffer();f.info={...f.info};if(f.role==='motion')f.info.motionFeatures=A.motionFeatures(root.PulseMMD.parseVmd(bytes,{full:true}));else f.info.boneNames=(f.kind==='pmd'?root.PulseMMD.parsePmd(bytes,{full:true}):root.PulseMMD.parsePmx(bytes,{full:true})).bones.map(b=>b.name);}
   if(signal.aborted)throw Error('Analyse annulée.');const next=A.prepare(candidate,{enabled:true,regenerate:true});$('cancelAnalysis').disabled=true;await this.store.put('songs',next);Object.assign(song,next);return next.scene.autoShow;
  } finally {$('cancelAnalysis').hidden=true;$('cancelAnalysis').disabled=false;}
 };
 $('autoShowLibrary').onclick=()=>app.run(async()=>{
  const report=[];for(const song of app.songs){try{const before=JSON.stringify(song.scene);await app.ensureAutoShow(song);report.push({title:song.title,status:before===JSON.stringify(song.scene)?'conservé':'complété'});}catch(e){report.push({title:song.title,status:'erreur',message:e.message});}await new Promise(r=>setTimeout(r,0));}
  app.autoShowBatchReport=report;$('autoShowBatchStatus').textContent=report.map(x=>x.title+' : '+x.status+(x.message?' ('+x.message+')':'')).join(' · ');app.renderLibrary();
 },'Complétion des spectacles sans écraser le manuel…');
 wrap('init',async old=>{await old();app.renderSettings();renderStatus();document.documentElement.dataset.autoShowReady='true';});
}
root.PulseAutoShowApp=install;
})(globalThis);
