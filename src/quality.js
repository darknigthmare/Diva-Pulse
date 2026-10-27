/* V23: input contracts, failure-safe editing, capability report, GPU recovery. */
(function(root){'use strict';
const C=root.PulseCore,S=root.PulseServices;
function preferences(raw={}, {strict=false}={}){
 if(!raw||typeof raw!=='object'||Array.isArray(raw)){if(strict)throw Error('Réglage invalide : preferences');return {value:{id:'preferences'},warnings:['preferences']};}
 const out={...raw,id:'preferences'},warnings=[];
 const bad=(key,fallback)=>{if(strict)throw Error('Réglage invalide : '+key);warnings.push(key);out[key]=structuredClone(fallback);};
 const ranges={musicVolume:[0,1,.65],sfxVolume:[0,.6,.18],inputOffset:[-500,500,0],visualOffset:[-500,500,0],approachSpeed:[.5,2,1],graphicsQuality:[0,3,1.5],noteScale:[.5,2,1],stageDim:[0,1,0],autoMapDensity:[.5,1.5,1],midiChannel:[0,16,0]};
 for(const [k,[min,max,fallback]]of Object.entries(ranges))if(k in raw){const n=Number(raw[k]),validType=typeof raw[k]==='number'||typeof raw[k]==='string'&&raw[k].trim()!=='';if(!validType||!Number.isFinite(n)||n<min||n>max||k==='midiChannel'&&!Number.isInteger(n))bad(k,fallback);else out[k]=n;}
 const keys=['KeyD','KeyF','KeyJ','KeyK','KeyS','KeyL'];
 if('keys'in raw&&(!Array.isArray(raw.keys)||raw.keys.length!==6||new Set(raw.keys).size!==6||raw.keys.some(k=>typeof k!=='string'||!/^(Key[A-Z]|Digit\d|Numpad\w+|Arrow(Left|Right|Up|Down)|Bracket(Left|Right)|Semicolon|Quote|Comma|Period|Slash|Backslash|Minus|Equal|Intl\w+)$/.test(k))))bad('keys',keys);
 if('midiMapping'in raw&&(!Array.isArray(raw.midiMapping)||raw.midiMapping.length!==6||new Set(raw.midiMapping).size!==6||raw.midiMapping.some(x=>!Number.isInteger(x)||x<0||x>127)))bad('midiMapping',[60,62,64,65,67,69]);
 for(const key of ['holdGauge','reduceMotion','showTouch','useVideo','noFail','outputClock','contrastNotes','hitSound','earlyLate','reducedEffects','padChords','autoMapImport','autoShowImport','autoFaceImport','audioMatchImport'])if(key in raw&&typeof raw[key]!=='boolean')bad(key,false);
 if('judgmentProfile'in raw&&!['standard','accessible','precision'].includes(raw.judgmentProfile))bad('judgmentProfile','standard');
 if(raw.chords){try{out.chords=C.validateChordBindings(raw.chords);if(out.chords.some(b=>(out.keys||keys).includes(b.code)))throw Error('Accord et touche unitaire en conflit.');}catch(e){bad('chords',[]);}}
 return {value:out,warnings};
}
function songAudit(song,assets){
 const issues=[],add=(severity,code,message)=>issues.push({severity,code,message});
 if(!song?.charts?.length)add('warning','no-chart','Aucune partition : importer une source ou lancer AutoMap.');
 const diffs=new Set((song.charts||[]).map(c=>c.difficulty)),missing=C.DIFFICULTIES.filter(d=>!diffs.has(d));if(missing.length)add('info','missing-difficulties','Difficultés absentes : '+missing.join(', ')+'.');
 for(const c of song.charts||[]){try{C.validateChart(c);}catch(e){add('error','invalid-chart',c.title+' : '+e.message);continue;}
  const out=c.notes.filter(n=>n.time+(c.offset||0)<0||n.time+(c.offset||0)>song.duration+.01);if(out.length)add('warning','out-of-audio',`${c.difficulty} : ${out.length} notes hors de l’audio.`);
 }
 const known=new Set(assets.map(a=>a.id)),refs=[song.audioAsset,song.videoAsset,...(root.PulseDirector?.assetReferences(song.scene)||[])].filter(Boolean);
 for(const id of new Set(refs))if(!known.has(id))add('error','missing-asset','Média absent : '+id);
 try{if(song.scene?.secondaryPhysics27)root.PulseSecondaryPhysics.normalize(song.scene.secondaryPhysics27);}catch(e){add('error','invalid-secondary',e.message);}
 try{if(song.scene?.faceTrack)root.PulseFace.validate(song.scene.faceTrack);}catch(e){add('error','invalid-face',e.message);}
 try{if(song.scene?.autoShow)root.PulseAutoShow.validate(song.scene.autoShow);}catch(e){add('error','invalid-show',e.message);}
 if(!song.scene?.autoShow&&!song.scene?.mmdDirector&&!song.scene?.events?.length)add('info','no-show','Aucun spectacle préparé pour ce morceau.');
 if(song.acoustic26)try{root.PulseAudioMatch.validate(song.acoustic26);}catch(e){add('warning','invalid-acoustic','Index acoustique à refaire : '+e.message);}
 if(song.charts?.some(c=>c.source==='acoustic-copy'))add('info','acoustic-copies','Partitions réutilisées après ressemblance acoustique : vérifier le timing dans le nouvel audio.');
 const motions=(song.scene?.mmd?.files||[]).filter(f=>f.role==='motion');if(motions.some(m=>!m.info?.sync?.bpm))add('info','unclocked-motion','Certaines motions conservent leur vitesse naturelle : leur BPM source n’est pas renseigné.');
 return {songId:song.id,title:song.title,charts:song.charts?.length||0,issues};
}
function replace(target,value){for(const k of Object.keys(target))delete target[k];Object.assign(target,structuredClone(value));}
function install(app){
 const $=id=>document.getElementById(id),wrap=(key,fn)=>{const old=app[key].bind(app);app[key]=(...args)=>fn(old,...args);};
 const status=()=>{const e=$('saveStatus');if(!e)return;e.textContent=app.store.invalidated?'STOCKAGE FERMÉ':app.store.persistent?'LOCAL / SAUVÉ':'TEMPORAIRE';e.title=app.store.reason||'Sauvegarde locale, pas une synchronisation Google Drive.';};
 app.store.watch(e=>{if(e.type==='unavailable'){status();app.toast(e.reason,true,15000);if(app.view==='game'&&!app.paused)app.pause();}
  if(e.type==='write-error'){for(const [kind,value] of e.rows||[])if(kind==='settings'){const before=app.store.committed(kind,value.id);if(!before)continue;const target=value.id==='preferences'?app.settings:value.id==='v3-state'?app.v3State:null;if(target){replace(target,before);if(value.id==='preferences')app.applySettings();}}}
 });
 // The snapshot belongs to the requested song, not whichever song is selected later.
 const serial=new Map();app.saveSong=async function(){const song=this.song,id=song.id,next=structuredClone(song),version=(serial.get(id)||0)+1;serial.set(id,version);const before=this.store.committed('songs',id)||structuredClone(song);
  try{await this.store.put('songs',next);if(serial.get(id)===version)replace(song,next);}catch(e){if(serial.get(id)===version){replace(song,this.store.committed('songs',id)||before);if(this.song===song){this.renderLibrary();this.renderWardrobe();}}throw e;}
 };
 wrap('importModel',async(old,...args)=>{try{return await old(...args);}catch(e){app.modelLoaded=null;await app.applyScene();throw e;}});
 wrap('init',async old=>{await old();for(const song of app.songs)if(!app.store.committed('songs',song.id))app.store.remember('songs',song);app.store.remember('settings',app.settings);app.store.remember('settings',app.v3State);status();if(app.preferenceWarnings?.length)app.toast('Réglages invalides réinitialisés : '+app.preferenceWarnings.join(', '),true,12000);document.documentElement.dataset.qualityReady='true';});
 // Recover WebGL resources, then reload scene assets from the store. Never overwrite notes.
 app.stage.onRestored=async()=>{app.modelLoaded=null;app.frameError=null;app.frozenStageRendered=false;$('no3d').hidden=true;try{await app.applyScene();app.toast('Scène 3D rechargée. La partie reste en pause jusqu’à ta reprise.');}catch(e){app.toast('La 3D est revenue mais le spectacle n’a pas pu être rechargé : '+e.message,true);}};
 const onError=app.stage.onError;app.stage.onError=m=>{onError?.(m);if(!app.stage.available){app.modelLoaded=null;if(app.view==='game'&&!app.paused)app.pause();}};
 const section=document.createElement('section');section.className='settings-card';section.id='qualityPanel';section.innerHTML='<div class="eyebrow">23 / DIAGNOSTIC DU PROJET</div><h2>CONTRÔLER AVANT DE JOUER.</h2><p>Vérifie les niveaux, les médias et les spectacles présents. Aucun fichier n’est modifié ni supprimé. Ce contrôle ne certifie pas la fidélité musicale ou MMD.</p><div class="buttons"><button id="runQuality" class="secondary">Auditer ma bibliothèque</button><button id="exportQuality">Exporter le diagnostic JSON</button></div><p id="qualityStatus" role="status"></p><div id="qualityRows"></div>';
 $('settings').append(section);
 const shortcuts=document.createElement('div');shortcuts.className='settings-shortcuts';shortcuts.setAttribute('role','navigation');shortcuts.setAttribute('aria-label','Rubriques des réglages');
 for(const [text,id]of [['Audio','musicVolume'],['Commandes','keyBindings'],['Sauvegardes','exportLibrary'],['AutoMap','autoMapImport'],['Spectacle','autoShowImport','autoFaceImport','audioMatchImport'],['Diagnostic','qualityPanel']]){const el=$(id);if(!el)continue;const target=el.closest('section')||el;const b=document.createElement('button');b.type='button';b.textContent=text;b.onclick=()=>target.scrollIntoView({block:'start',behavior:'instant'});shortcuts.append(b);}
 $('settings').querySelector('h1').after(shortcuts);
 app.auditLibraryQuality=async function(){const assets=await this.store.all('assets'),songs=this.songs.map(s=>songAudit(s,assets));return {version:C.VERSION,createdAt:new Date().toISOString(),storage:this.store.invalidated?'closed':this.store.persistent?'indexeddb':'temporary',webgl:this.stage.available,limitations:['Physique Bullet, corps souples et MME absents.','Retargeting universel et appuis des pieds absents ; animation de bouche par enveloppe ou clés, pas reconnaissance des phonèmes.','Partition officielle : catalogue local uniquement ; comparaison 1:1 non certifiée.','Matériaux, IK et héritage d’os partiels.'],songs};};
 const draw=report=>{app.lastQualityReport=report;const list=$('qualityRows');list.replaceChildren();let count=0;for(const row of report.songs){const details=document.createElement('details'),summary=document.createElement('summary');count+=row.issues.length;summary.textContent=row.title+' — '+(row.issues.length?row.issues.length+' points à examiner':'Contrôles structurels réussis');details.append(summary);for(const issue of row.issues){const p=document.createElement('p');p.textContent=({error:'ERREUR',warning:'À VÉRIFIER',info:'INFO'})[issue.severity]+' · '+issue.message;details.append(p);}list.append(details);} $('qualityStatus').textContent=`${report.songs.length} morceaux · ${count} points à vérifier · stockage ${report.storage}.`};
 $('runQuality').onclick=()=>app.run(async()=>draw(await app.auditLibraryQuality()),'Audit non destructif…');
 $('exportQuality').onclick=()=>app.run(async()=>S.download(JSON.stringify(await app.auditLibraryQuality(),null,2),'DIVA_PULSE_DIAGNOSTIC.json'),'Export du diagnostic…');
}
root.PulseQuality={preferences,songAudit,install,replace};if(typeof module!=='undefined')module.exports=root.PulseQuality;
})(globalThis);
