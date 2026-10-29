/* V29: immutable batch edits. Selection indexes refer to a normalized draft.
 * The UI clears selections after every structural mutation, including undo.
 * A rejected edit never mutates its input, clipboard or previously saved song. */
(function(root){
'use strict';
const D=root.PulseDirector||(typeof require==='function'?require('./director-core.js'):null);
const fail=message=>{throw Error(message);};
function finite(value,label){if(typeof value!=='number'||!Number.isFinite(value))fail(label+' doit être un nombre fini.');return value;}
function refs(draft,selection){
 if(!Array.isArray(selection)||!selection.length||selection.length>3584)fail('Sélection vide ou trop grande.');
 const seen=new Set();
 return selection.map(key=>{
  if(typeof key!=='string'||!/^(clip:[0-3]|camera|light|formation):\d+$/.test(key))fail('Sélection invalide.');
  if(seen.has(key))fail('Sélection dupliquée.');seen.add(key);
  const p=key.split(':'),kind=p[0],slot=kind==='clip'?Number(p[1]):null,index=Number(p.at(-1));
  const track=kind==='clip'?draft.slots[slot]?.clips:(kind==='formation'?draft.formations:draft[kind+'Track']);
  if(!Number.isSafeInteger(index)||!track?.[index])fail('La sélection a changé : sélectionner à nouveau.');
  return {key,kind,slot,index,value:track[index]};
 });
}
function all(raw){const d=D.normalizeDirector(raw),keys=[];d.slots.forEach((s,i)=>s.clips.forEach((_,j)=>keys.push(`clip:${i}:${j}`)));for(const k of ['camera','light','formation'])(k==='formation'?d.formations:d[k+'Track']).forEach((_,i)=>keys.push(`${k}:${i}`));return keys;}
function copy(raw,selection){
 const d=D.normalizeDirector(raw),items=refs(d,selection);
 const anchor=Math.min(...items.map(x=>x.kind==='clip'?x.value.start:x.value.time));
 return {format:'DIVA-PULSE-DIRECTOR-CLIPBOARD',version:1,anchor,entries:items.map(({kind,slot,value})=>({kind,slot,value:structuredClone(value)}))};
}
function move(raw,selection,delta){
 finite(delta,'Décalage');const d=D.normalizeDirector(structuredClone(raw));
 for(const {kind,value} of refs(d,selection)){
  if(kind==='clip'){value.start+=delta;value.end+=delta;}else value.time+=delta;
 }
 return D.normalizeDirector(d);
}
function remove(raw,selection){
 const d=D.normalizeDirector(structuredClone(raw)),items=refs(d,selection);
 for(const item of items.sort((a,b)=>b.index-a.index)){
  const track=item.kind==='clip'?d.slots[item.slot].clips:(item.kind==='formation'?d.formations:d[item.kind+'Track']);track.splice(item.index,1);
 }
 return D.normalizeDirector(d);
}
function paste(raw,clipboard,time){
 finite(time,'Curseur');const d=D.normalizeDirector(structuredClone(raw));
 if(time<0||time>d.duration)fail('Curseur hors du spectacle.');
 if(!clipboard||clipboard.format!=='DIVA-PULSE-DIRECTOR-CLIPBOARD'||clipboard.version!==1||!Array.isArray(clipboard.entries)||!clipboard.entries.length||clipboard.entries.length>3584)fail('Presse-papiers Director invalide.');
 finite(clipboard.anchor,'Origine du presse-papiers');
 const delta=time-clipboard.anchor;
 for(const item of clipboard.entries){
  if(!item||!['clip','camera','light','formation'].includes(item.kind)||!item.value||typeof item.value!=='object')fail('Élément à coller invalide.');
  const value=structuredClone(item.value);
  if(item.kind==='clip'){
   if(!Number.isInteger(item.slot)||!d.slots[item.slot])fail('Le danseur destinataire n’existe plus.');
   value.start=finite(value.start,'Début')+delta;value.end=finite(value.end,'Fin')+delta;
   value.id='';d.slots[item.slot].clips.push(value);
  }else{value.time=finite(value.time,'Instant')+delta;(item.kind==='formation'?d.formations:d[item.kind+'Track']).push(value);}
 }
 return D.normalizeDirector(d);
}
function snap(time,bpm=120,beats=1,offset=0){
 finite(time,'Temps');finite(bpm,'BPM');finite(beats,'Grille');finite(offset,'Origine');
 if(bpm<20||bpm>400||beats<0||beats>16)fail('Grille rythmique hors plage.');
 if(!beats)return time;const step=60/bpm*beats;
 return Math.max(0,Math.round((time-offset)/step)*step+offset);
}
// A library keeps one recovery per song. A different pack or an unsupported
// schema is protected until the user explicitly resumes, reassociates or discards.
const bundle=()=>root.PulseBundle||(typeof require==='function'?require('./bundle-core.js'):null);
function recoveryAssets(song){
 if(!song?.id||!song.scene?.mmd?.id)fail('Le morceau ou le pack MMD a changé.');
 const pack=song.scene.mmd,files=new Map((pack.files||[]).map(f=>[f.id,f])),choices={model:[],motion:[]};let camera=false;
 for(const id of new Set(pack.assetIds||[])){
  const f=files.get(id);if(!f)continue;
  if(f.role==='model')choices.model.push({...f});
  if(f.role==='motion')choices.motion.push({...f});
  if(f.role==='camera'&&!camera){choices.motion.push({...f});camera=true;}
 }
 return choices;
}
function recoveryRefs(director){
 const refs=new Map(),add=(role,id,use)=>{if(!id)return;const key=JSON.stringify([role,id]);if(!refs.has(key))refs.set(key,{key,role,id,uses:[]});refs.get(key).uses.push(use);};
 director.slots.forEach((slot,i)=>{add('model',slot.modelAssetId,'D'+(i+1)+' · modèle');add('motion',slot.motionAssetId,'D'+(i+1)+' · motion de base');slot.clips.forEach((clip,j)=>add('motion',clip.motionAssetId,'D'+(i+1)+' · clip '+(j+1)));});
 return [...refs.values()];
}
function inspectRecovery(saved,song){
 if(!saved||(['applied','discarded'].includes(saved.status)&&!saved.director))return {kind:'none'};
 try{
  if(saved.songId!==song?.id)fail('Le propriétaire du brouillon ne correspond pas à ce morceau.');
  const director=bundle().readDirector(saved.director,'Brouillon Director'),choices=recoveryAssets(song),refs=recoveryRefs(director);
  const compatible=saved.packId===song.scene.mmd.id&&refs.every(r=>choices[r.role].some(f=>f.id===r.id));
  return {kind:compatible?'compatible':'reassociate',director,refs,choices};
 }catch(e){return {kind:'unsupported',error:e.message};}
}
function reassociateRecovery(saved,song,mapping={},now=Date.now()){
 const info=inspectRecovery(saved,song);if(info.kind==='unsupported')fail(info.error);if(info.kind==='none')fail('Aucun brouillon à réassocier.');
 if(!mapping||typeof mapping!=='object'||Array.isArray(mapping))fail('Associations de médias invalides.');
 const keys=new Set(info.refs.map(r=>r.key)),selected=new Map();
 for(const key of Object.keys(mapping))if(!keys.has(key))fail('Association de média inconnue.');
 for(const ref of info.refs){
  // Keep only an already identical available ID. Names are never used to guess.
  const id=Object.hasOwn(mapping,ref.key)?mapping[ref.key]:ref.id;
  if(typeof id!=='string'||!info.choices[ref.role].some(f=>f.id===id))fail('Choisir '+(ref.role==='model'?'un modèle':'une motion')+' du pack courant pour '+ref.uses.join(', ')+'.');
  selected.set(ref.key,id);
 }
 const director=structuredClone(info.director),remap=(role,id)=>id?selected.get(JSON.stringify([role,id])):id;
 for(const slot of director.slots){slot.modelAssetId=remap('model',slot.modelAssetId);slot.motionAssetId=remap('motion',slot.motionAssetId);for(const clip of slot.clips)clip.motionAssetId=remap('motion',clip.motionAssetId);}
 return {...structuredClone(saved),id:'director-draft:'+song.id,songId:song.id,packId:song.scene.mmd.id,status:'draft',director,updatedAt:finite(now,'Date')};
}
function recoverySourceJSON(saved){return JSON.stringify(saved,null,2);}
function restoredRecoveryPackId(saved,sourceSong,copySong){
 const source=sourceSong?.scene?.mmd?.id;
 return typeof source==='string'&&source&&saved.packId===source?copySong.scene.mmd.id:saved.packId;
}
function publication(song,draft,packId,now=Date.now()){
 if(!song||typeof song.id!=='string'||!song.id||!packId||song.scene?.mmd?.id!==packId)fail('Le morceau ou le pack MMD a changé.');
 const director=D.normalizeDirector({...structuredClone(draft),duration:song.duration});
 const ids=new Set(song.scene.mmd.assetIds||[]);
 for(const id of D.assetReferences({mmdDirector:director}))if(!ids.has(id))fail('Le spectacle référence un média absent du pack.');
 const candidate={...structuredClone(song),scene:{...structuredClone(song.scene),mmdDirector:director}};
 // A tombstone shares the same transaction as the song: no cleanup failure can
 // resurrect an already applied recovery. Portable exports omit this marker.
 const tombstone={id:'director-draft:'+song.id,songId:song.id,packId,status:'applied',director:null,updatedAt:finite(now,'Date')};
 return [['songs',candidate],['settings',tombstone]];
}
root.PulseDirectorEdit={all,copy,move,remove,paste,snap,publication,inspectRecovery,reassociateRecovery,recoverySourceJSON,restoredRecoveryPackId};
if(typeof module!=='undefined')module.exports=root.PulseDirectorEdit;
})(globalThis);
