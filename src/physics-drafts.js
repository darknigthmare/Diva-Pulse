/* V28: pure, bounded secondary-dynamics recovery records. No executable content. */
(function(root,factory){const api=factory();root.PulsePhysicsDrafts=api;if(typeof module!=='undefined')module.exports=api;})(globalThis,function(){
'use strict';
const P=globalThis.PulseSecondaryPhysics||(typeof require==='function'?require('./secondary-physics.js'):null);
const C=globalThis.PulseCore||(typeof require==='function'?require('./core.js'):null);
function signature(value){return String(C.hashText(JSON.stringify(P.normalize(value||{}))));}
function validate(raw){
 if(!raw||typeof raw.songId!=='string'||!raw.songId||raw.songId.length>180)throw Error('Brouillon dynamique : propriétaire invalide.');
 if(!Number.isFinite(raw.updated)||raw.updated<0)throw Error('Brouillon dynamique : date invalide.');
 const base={id:'physics-draft:'+raw.songId,version:28,songId:raw.songId,updated:raw.updated};
 if(raw.discarded===true)return {...base,discarded:true};
 if(!Number.isFinite(raw.cursor)||raw.cursor<0||raw.cursor>7200)throw Error('Brouillon dynamique : curseur invalide.');
 if(raw.packId!==null&&raw.packId!==undefined&&(typeof raw.packId!=='string'||raw.packId.length>180))throw Error('Brouillon dynamique : pack invalide.');
 if(typeof raw.baseSignature!=='string'||raw.baseSignature.length>120)throw Error('Brouillon dynamique : signature invalide.');
 if(!raw.settings||typeof raw.settings!=='object'||Array.isArray(raw.settings))throw Error('Brouillon dynamique : réglages absents.');
 return {...base,cursor:raw.cursor,packId:raw.packId||null,baseSignature:raw.baseSignature,settings:P.normalize(raw.settings)};
}
function merge(stored,memory,songs){
 const owners=new Map(songs.map(s=>[s.id,s])),out=new Map();
 for(const item of [...stored,...memory]){
  if(!item||!owners.has(item.songId))continue;
  const d=validate(item),last=out.get(d.songId);
  if(!d.discarded&&d.cursor>owners.get(d.songId).duration)throw Error('Brouillon dynamique hors durée du morceau.');
  // Last memory record wins ties. Tombstones participate before final filtering.
  if(!last||d.updated>=last.updated)out.set(d.songId,d);
 }
 return [...out.values()].filter(d=>!d.discarded);
}
function validateCollection(records,songs){
 if(!Array.isArray(records)||records.length>250)throw Error('Collection de brouillons dynamiques invalide.');
 const ids=new Set();for(const raw of records){const d=validate(raw),owner=songs.find(s=>s.id===d.songId);
  if(d.discarded||!owner||ids.has(d.songId)||d.cursor>owner.duration)throw Error('Brouillon dynamique : propriétaire absent, dupliqué ou durée invalide.');ids.add(d.songId);
 }
 return records.map(validate);
}
function remap(records,songMap,songs){return records.map(raw=>{
 const d=validate(raw),id=songMap.get(d.songId),owner=songs.find(s=>s.id===id);
 if(d.discarded||!id||!owner||d.cursor>owner.duration)throw Error('Brouillon dynamique : propriétaire restauré absent ou durée invalide.');
 return validate({...d,songId:id,packId:owner.scene?.mmd?.id||null});
});}
function conflicts(record,owner){const d=validate(record);return {
 settings:!d.discarded&&d.baseSignature!==signature(owner.scene?.secondaryPhysics27),
 pack:!d.discarded&&d.packId!==(owner.scene?.mmd?.id||null)
};}
return {signature,validate,merge,validateCollection,remap,conflicts};
});
