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
root.PulseDirectorEdit={all,copy,move,remove,paste,snap,publication};
if(typeof module!=='undefined')module.exports=root.PulseDirectorEdit;
})(globalThis);
