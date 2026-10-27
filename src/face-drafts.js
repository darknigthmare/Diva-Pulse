/* V26 facial recovery records. Saved scenes remain authoritative until explicit commit. */
(function(root,factory){const api=factory();root.PulseFaceDrafts=api;if(typeof module!=='undefined')module.exports=api;})(globalThis,function(){
'use strict';
function validate(record){
 const F=globalThis.PulseFace||(typeof require==='function'?require('./face-core.js'):null);
 if(!record||typeof record.songId!=='string'||!record.songId||record.songId.length>180)throw Error('Brouillon visage sans propriétaire valide.');
 if(!Number.isFinite(record.updated)||record.updated<0||!Number.isFinite(record.cursor)||record.cursor<0)throw Error('Métadonnées du brouillon visage invalides.');
 const track=F.validate(record.track);if(record.cursor>track.duration)throw Error('Curseur du brouillon hors durée.');
 return {id:'face-draft:'+record.songId,version:26,songId:record.songId,updated:record.updated,cursor:record.cursor,baseSignature:String(record.baseSignature||'').slice(0,120),track};
}
function merge(stored,memory,songs){const ids=new Set(songs.map(s=>s.id)),all=new Map();for(const r of [...stored,...memory]){if(!r||r.discarded||!ids.has(r.songId))continue;const d=validate(r),prev=all.get(d.songId);if(!prev||d.updated>=prev.updated)all.set(d.songId,d);}return [...all.values()];}
function remap(records,songMap,assetMap){return records.map(raw=>{const d=validate(raw),id=songMap.get(d.songId);if(!id)throw Error('Propriétaire du brouillon absent de la sauvegarde.');if(d.track.sourceAsset&&!assetMap.has(d.track.sourceAsset))throw Error('Voix guide du brouillon absente de la sauvegarde.');return validate({...d,songId:id,track:{...d.track,sourceAsset:d.track.sourceAsset?assetMap.get(d.track.sourceAsset):null}});});}
return {validate,merge,remap};
});
