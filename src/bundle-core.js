/* V25 binary backup: bounded manifest + individually SHA-256 checked 1 MiB chunks.
   Media are Blob slices, never a library-sized base64 string. This is not a signature. */
(function(root){'use strict';
const C=root.PulseCore||(typeof require==='function'?require('./hash-core.js'):{});
const MAGIC='PULSEB25',HEADER=44,CHUNK=1048576,MAX_BODY=1073741824,MAX_META=16777216;
const abort=signal=>{if(signal?.aborted)throw new DOMException('Opération annulée.','AbortError');};
async function digest(bytes){if(root.crypto?.subtle){const b=await root.crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(b),v=>v.toString(16).padStart(2,'0')).join('');}return C.sha256Hex(bytes);}
async function hashes(blob,{signal,onProgress=()=>{},base=0,total=blob.size}={}){const out=[];for(let i=0;i<blob.size;i+=CHUNK){abort(signal);out.push(await digest(await blob.slice(i,i+CHUNK).arrayBuffer()));onProgress(Math.min(total,base+i+CHUNK),total);await new Promise(r=>setTimeout(r,0));}abort(signal);return out;}
function mediaCheck(rows){if(!Array.isArray(rows)||rows.length>1000)throw Error('Maximum 1 000 médias par sauvegarde.');let total=0;const seen=new Set();for(const a of rows){if(!a||typeof a!=='object'||Array.isArray(a))throw Error('Description média invalide.');for(const [key,limit]of [['name',512],['kind',80],['type',255]])if(typeof a[key]!=='string'||a[key].length>limit)throw Error('Métadonnée média invalide : '+key);if(typeof a.id!=='string'||!a.id||seen.has(a.id))throw Error('Identifiant média invalide ou dupliqué.');seen.add(a.id);if(!Number.isSafeInteger(a.size)||a.size<0)throw Error('Taille de média invalide.');total+=a.size;if(total>MAX_BODY)throw Error('Sauvegarde binaire limitée à 1 Gio de médias.');if(!Array.isArray(a.hashes)||a.hashes.length!==Math.ceil(a.size/CHUNK)||a.hashes.some(h=>typeof h!=='string'||!/^[a-f\d]{64}$/.test(h)))throw Error('Empreintes média invalides.');}return total;}
// Library schemas are separate from the binary container version. V2/V3 are
// documented in FORMAT_PARTITIONS.md, V4 adds drafts, V5 is the current exporter.
const LIBRARY_VERSIONS=Object.freeze([2,3,4,5]);
function archiveError(path,message){throw Error(path+' : '+message);}
function archiveObject(value,path){if(!value||typeof value!=='object'||Array.isArray(value))archiveError(path,'objet attendu.');return value;}
function archiveList(value,path,max){if(!Array.isArray(value)||value.length>max)archiveError(path,'liste attendue, maximum '+max+'.');return value;}
function archiveId(value,path){if(typeof value!=='string'||!value)archiveError(path,'identifiant non vide attendu.');return value;}
function archiveUnique(rows,path){const out=new Map();rows.forEach((row,i)=>{archiveObject(row,`${path}[${i}]`);const id=archiveId(row.id,`${path}[${i}].id`);if(out.has(id))archiveError(`${path}[${i}].id`,'identifiant dupliqué.');out.set(id,row);});return out;}
// Import/recovery boundaries must reject an unknown schema before the permissive
// editing normalizer can promote it or replace its version. Unversioned V9/V10
// Directors are historical data; loop phase was first persisted in schema 20.
function readDirector(value,path='Director'){
 archiveObject(value,path);
 if(value.version!==undefined&&![19,20].includes(value.version))archiveError(path+'.version','version Director non prise en charge ; versions acceptées : sans version (historique), 19, 20.');
 const D=root.PulseDirector||(typeof require==='function'?require('./director-core.js'):null);
 if(!D)archiveError(path,'module Director indisponible.');
 let next;try{next=D.normalizeDirector(structuredClone(value));}catch(e){archiveError(path,e.message);}
 if(next.version===20&&value.version!==20)archiveError(path+'.version','une phase de boucle exige le schéma 20 explicite.');
 return next;
}
function scoreSuffix(record,chart,path='scores'){
 const prefix=record.songId+'/'+record.chartId+'/',suffix=typeof record.id==='string'&&record.id.startsWith(prefix)?record.id.slice(prefix.length):'',match=/^([a-f\d]{1,8})(\/rules4)?(?:\/profile-(accessible|precision))?$/.exec(suffix);
 if(match){
  if(record.rulesVersion!==undefined&&(record.rulesVersion>=4)!==!!match[2])archiveError(path,'la clé et la version des règles du record se contredisent.');
  if(record.judgmentProfile!==undefined&&record.judgmentProfile!==(match[3]||'standard'))archiveError(path,'la clé et le profil du record se contredisent.');
  // A previous chart signature is historical data, never a score for today's notes.
  return suffix;
 }
 const profile=C.judgmentProfile(record.judgmentProfile);
 return C.chartSignature(chart)+(record.rulesVersion>=4?'/rules4':'')+(profile==='standard'?'':'/profile-'+profile);
}
function validateLibrary(raw){
 archiveObject(raw,'library');if(raw.format!=='DIVA-PULSE-LIBRARY')archiveError('library.format','bibliothèque DIVA-PULSE-LIBRARY attendue.');
 if(!LIBRARY_VERSIONS.includes(raw.version))archiveError('library.version','version de bibliothèque non prise en charge ; versions acceptées : 2, 3, 4, 5.');
 const songs=archiveUnique(archiveList(raw.songs,'songs',250),'songs'),assets=archiveUnique(archiveList(raw.assets,'assets',1000),'assets'),charts=new Map();
 const check=(fn,path)=>{try{return fn();}catch(e){archiveError(path,e.message);}};
 const ref=(id,path)=>{if(id===undefined||id===null||id==='')return;archiveId(id,path);if(!assets.has(id))archiveError(path,'média référencé absent ('+id.slice(0,120)+').');};
 const director=(value,path,pack=null)=>{
  const available=(id,at,kind)=>{ref(id,at);if(id===undefined||id===null||id===''||!pack)return;
   if(!pack.ids.has(id))archiveError(at,'média absent du pack MMD de la scène.');
   const role=pack.roles.get(id);if(kind==='model'?role!=='model':role!=='motion'&&role!=='camera')archiveError(at,kind==='model'?'modèle absent des fichiers chargeables du pack MMD.':'motion absente des fichiers chargeables du pack MMD.');
  };
  archiveObject(value,path);const slots=archiveList(value.slots===undefined?[]:value.slots,path+'.slots',4);
  slots.forEach((slot,i)=>{const at=`${path}.slots[${i}]`;archiveObject(slot,at);available(slot.modelAssetId,at+'.modelAssetId','model');available(slot.motionAssetId,at+'.motionAssetId','motion');
   archiveList(slot.clips===undefined?[]:slot.clips,at+'.clips',512).forEach((clip,j)=>{archiveObject(clip,`${at}.clips[${j}]`);available(clip.motionAssetId,`${at}.clips[${j}].motionAssetId`,'motion');});});
  readDirector(value,path);
 };
 const face=(value,path)=>{archiveObject(value,path);ref(value.sourceAsset,path+'.sourceAsset');if(root.PulseFace)check(()=>root.PulseFace.validate(value),path);};
 raw.songs.forEach((song,i)=>{
  const at=`songs[${i}]`,cc=archiveUnique(archiveList(song.charts,at+'.charts',50),at+'.charts');
  const normalized=new Map();for(const [id,chart]of cc)normalized.set(id,check(()=>C.validateChart(chart),at+'.charts['+song.charts.indexOf(chart)+']'));charts.set(song.id,normalized);
  ref(song.audioAsset,at+'.audioAsset');ref(song.videoAsset,at+'.videoAsset');
  if(song.builtin&&!C.DEMOS.some(d=>d.id===song.demoId))archiveError(at+'.demoId','démo inconnue dans le pack.');
  const scene=song.scene;if(scene===undefined||scene===null)return;archiveObject(scene,at+'.scene');ref(scene.modelAsset,at+'.scene.modelAsset');
  const pack={ids:new Set(),roles:new Map()};
  if(scene.mmd!==undefined&&scene.mmd!==null){
   const path=at+'.scene.mmd',mmd=archiveObject(scene.mmd,path),ids=pack.ids;
   archiveList(mmd.assetIds===undefined?[]:mmd.assetIds,path+'.assetIds',1000).forEach((id,j)=>{archiveId(id,`${path}.assetIds[${j}]`);if(ids.has(id))archiveError(`${path}.assetIds[${j}]`,'identifiant dupliqué.');ids.add(id);ref(id,`${path}.assetIds[${j}]`);});
   const files=archiveList(mmd.files===undefined?[]:mmd.files,path+'.files',1000),meta=archiveUnique(files,path+'.files');files.forEach((file,j)=>{const at=`${path}.files[${j}].id`;ref(file.id,at);if(!ids.has(file.id))archiveError(at,'média absent de assetIds du pack MMD.');});
   // Match director-app's resource cache: all models/motions, the first camera.
   let camera=false;for(const id of ids){const role=meta.get(id)?.role;if(role==='camera'){if(camera)continue;camera=true;}pack.roles.set(id,role);}
  }
  if(scene.mmdDirector!==undefined&&scene.mmdDirector!==null)director(scene.mmdDirector,at+'.scene.mmdDirector',pack);
  if(scene.autoShow!==undefined&&scene.autoShow!==null){const p=archiveObject(scene.autoShow,at+'.scene.autoShow');if(p.director)director(p.director,at+'.scene.autoShow.director',pack);if(root.PulseAutoShow)check(()=>root.PulseAutoShow.validate(p),at+'.scene.autoShow');}
  if(scene.faceTrack!==undefined&&scene.faceTrack!==null)face(scene.faceTrack,at+'.scene.faceTrack');
  if(scene.secondaryPhysics27&&root.PulseSecondaryPhysics)check(()=>root.PulseSecondaryPhysics.normalize(scene.secondaryPhysics27),at+'.scene.secondaryPhysics27');
 });
 const owned=(key,max)=>{const rows=archiveList(raw[key]===undefined?[]:raw[key],key,max),seen=new Set();rows.forEach((row,i)=>{const at=`${key}[${i}]`;archiveObject(row,at);archiveId(row.songId,at+'.songId');if(!songs.has(row.songId))archiveError(at+'.songId','morceau propriétaire absent.');
   const destination=key==='drafts'?JSON.stringify([row.songId,archiveId(row.originalId,at+'.originalId')]):row.songId;
   if(seen.has(destination))archiveError(at+(key==='drafts'?'':'.songId'),'destination de brouillon dupliquée.');seen.add(destination);
  });return rows;};
 owned('drafts',1000).forEach((d,i)=>{archiveObject(d.chart,`drafts[${i}].chart`);archiveId(d.chart.id,`drafts[${i}].chart.id`);check(()=>C.validateChart(d.chart),`drafts[${i}].chart`);});
 // Missing original chart IDs are deliberate: an orphan Studio draft is recoverable.
 // Recovery records may belong to a previous pack. Keep their media globally
 // reachable and the draft separate; publication/reassociation remains explicit.
 owned('directorDrafts',250).forEach((d,i)=>{if(!songs.get(d.songId).scene?.mmd)archiveError(`directorDrafts[${i}].songId`,'pack MMD du propriétaire absent.');director(d.director,`directorDrafts[${i}].director`);});
 owned('faceDrafts',250).forEach((d,i)=>{face(d.track,`faceDrafts[${i}].track`);if(root.PulseFaceDrafts)check(()=>root.PulseFaceDrafts.validate(d),`faceDrafts[${i}]`);});
 const physics=owned('physicsDrafts',250);if(root.PulsePhysicsDrafts)check(()=>root.PulsePhysicsDrafts.validateCollection(physics,raw.songs),'physicsDrafts');
 const scoreKeys=new Set();archiveList(raw.scores??[],'scores',20000).forEach((old,i)=>{
  archiveObject(old,`scores[${i}]`);const chart=charts.get(old.songId)?.get(old.chartId);
  // Keep the historical filter for optional scores whose song/chart is gone.
  if(!chart||!Number.isFinite(old.score)||!Number.isFinite(old.accuracy)||old.accuracy<0||old.accuracy>100)return;
  const key=JSON.stringify([old.songId,old.chartId+'/'+scoreSuffix(old,chart,`scores[${i}]`)]);
  if(scoreKeys.has(key))archiveError(`scores[${i}]`,'destination de record dupliquée.');scoreKeys.add(key);
 });
 if(raw.v3State!==undefined&&raw.v3State!==null){archiveObject(raw.v3State,'v3State');archiveList(raw.v3State.setlists??[],'v3State.setlists',100).forEach((list,i)=>{const at=`v3State.setlists[${i}]`;archiveObject(list,at);archiveList(list.entries??[],at+'.entries',20000).forEach((entry,j)=>archiveObject(entry,`${at}.entries[${j}]`));});}
 return raw;
}
async function pack(raw,assets,opts={}){
 if(raw?.format!=='DIVA-PULSE-LIBRARY'||!Array.isArray(assets)||assets.length>1000)throw Error('Bibliothèque invalide.');
 const total=assets.reduce((n,a)=>n+(a.blob?.size??MAX_BODY+1),0);if(total>MAX_BODY)throw Error('Sauvegarde binaire limitée à 1 Gio de médias.');
 let done=0;const descriptors=[];for(const a of assets){if(!(a.blob instanceof Blob))throw Error('Média sans contenu.');const hs=await hashes(a.blob,{...opts,base:done,total});done+=a.blob.size;descriptors.push({id:a.id,name:String(a.name||'').slice(0,512),kind:String(a.kind||'').slice(0,80),type:a.blob.type,size:a.blob.size,hashes:hs});}mediaCheck(descriptors);
 const meta={format:'DIVA-PULSE-BUNDLE',version:1,chunkSize:CHUNK,library:{...structuredClone(raw),assets:descriptors}},bytes=new TextEncoder().encode(JSON.stringify(meta));if(bytes.length>MAX_META)throw Error('Métadonnées trop volumineuses.');
 const head=new Uint8Array(HEADER);head.set(new TextEncoder().encode(MAGIC));new DataView(head.buffer).setUint32(8,bytes.length,true);const h=await digest(bytes);head.set(Uint8Array.from(h.match(/../g),s=>parseInt(s,16)),12);abort(opts.signal);
 return new Blob([head,bytes,...assets.map(a=>a.blob)],{type:'application/octet-stream'});
}
async function unpack(file,opts={}){
 if(file.size<HEADER||file.size>HEADER+MAX_META+MAX_BODY)throw Error('Taille de sauvegarde binaire invalide.');abort(opts.signal);
 const head=new Uint8Array(await file.slice(0,HEADER).arrayBuffer());if(new TextDecoder().decode(head.slice(0,8))!==MAGIC)throw Error('Signature .pulsebundle inconnue.');const size=new DataView(head.buffer).getUint32(8,true);if(size>MAX_META||HEADER+size>file.size)throw Error('Longueur du manifeste invalide.');
 const bytes=await file.slice(HEADER,HEADER+size).arrayBuffer(),expected=Array.from(head.slice(12),v=>v.toString(16).padStart(2,'0')).join('');if(await digest(bytes)!==expected)throw Error('Manifeste altéré : empreinte différente.');
 let meta;try{meta=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{throw Error('Manifeste illisible.');}
 if(meta.format!=='DIVA-PULSE-BUNDLE'||meta.version!==1||meta.chunkSize!==CHUNK||meta.library?.format!=='DIVA-PULSE-LIBRARY')throw Error('Format binaire non pris en charge.');const raw=validateLibrary(meta.library),total=mediaCheck(raw.assets);if(file.size!==HEADER+size+total)throw Error('Médias tronqués ou données supplémentaires.');
 const blobs=new Map();let at=HEADER+size,done=0;for(const a of raw.assets){const blob=file.slice(at,at+a.size,a.type),hs=await hashes(blob,{...opts,base:done,total});if(hs.some((h,i)=>h!==a.hashes[i]))throw Error('Média altéré : '+a.name);blobs.set(a.id,blob);at+=a.size;done+=a.size;}abort(opts.signal);
 return {raw,blobs,totalBytes:total};
}
const api={MAGIC,HEADER,CHUNK,MAX_BODY,MAX_META,LIBRARY_VERSIONS,digest,hashes,pack,unpack,mediaCheck,validateLibrary,readDirector,scoreSuffix};root.PulseBundle=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
