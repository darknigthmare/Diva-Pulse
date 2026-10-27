/* V19: deterministic Director contracts. Time values are AUDIO seconds.
 * A transition holds the outgoing clip's end pose; it never plays across a gap.
 * No random state, DOM or GPU calls in this module. */
(function(root){
'use strict';
const legacy=root.PulseV10Core||(typeof require==='function'?require('./v10-core.js'):{});
const C=root.PulseCore;
const finite=(x,d=0)=>x===undefined||x===null?d:Number(x);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const lerp=(a,b,t)=>a+(b-a)*t;
function number(x,d,min,max,label){const v=finite(x,d);if(!Number.isFinite(v)||v<min||v>max)throw Error(label+' hors plage.');return v;}
function vector(x,d,label,min=-100,max=100){const a=x??d;if(!Array.isArray(a)||a.length!==3)throw Error(label+' : 3 composantes attendues.');return a.map((v,i)=>number(v,d[i],min,max,label));}
function normalizeClip(c={},duration=7200){
 const start=number(c.start,0,0,duration,'Début du clip'),end=number(c.end,duration,0,duration,'Fin du clip');
 if(end<=start)throw Error('La fin du clip doit suivre son début.');
 return {...c,...(root.PulseMotionSync?.normalizeClip(c)||{}),id:String(c.id||''),start,end,motionAssetId:c.motionAssetId||null,rate:number(c.rate,1,.25,4,'Vitesse'),motionStart:number(c.motionStart,0,0,7200,'Départ VMD'),transition:Math.min(number(c.transition,0,0,5,'Transition'),end-start),loop:c.loop!==false,camera:!!c.camera};
}
function normalizeTrack(raw=[],kind='camera',duration=7200){
 if(!Array.isArray(raw)||raw.length>512)throw Error('Piste limitée à 512 clés.');
 const out=raw.map(k=>{
  const a={...k,time:number(k.time,0,0,duration,'Instant de clé'),easing:['linear','smooth','step'].includes(k.easing)?k.easing:'smooth'};
  if(kind==='camera')Object.assign(a,{yaw:number(k.yaw,0,-7200,7200,'Azimut'),pitch:number(k.pitch,10,-80,80,'Inclinaison'),distance:number(k.distance,7,.5,40,'Distance'),fov:number(k.fov,40,15,100,'Champ de vision'),target:vector(k.target,[0,1.6,0],'Cible caméra')});
  else Object.assign(a,{intensity:number(k.intensity,1,0,3,'Intensité'),color:vector(k.color,[1,1,1],'Couleur',0,1)});
  return a;
 }).sort((a,b)=>a.time-b.time);
 for(let i=1;i<out.length;i++)if(Math.abs(out[i].time-out[i-1].time)<1e-7)throw Error('Deux clés occupent le même instant.');
 return out;
}
function normalizeDirector(raw={}){
 if(raw.slots!==undefined&&(!Array.isArray(raw.slots)||raw.slots.length>4))throw Error('Emplacements Director invalides.');
 const duration=number(raw.duration,7200,.1,7200,'Durée'),count=Math.round(number(raw.count,2,1,4,'Nombre de danseurs')),spacing=number(raw.spacing,1.5,.4,4,'Espacement');
 const slots=Array.from({length:count},(_,i)=>{
  const s=raw.slots?.[i]||{};if(s.clips!==undefined&&(!Array.isArray(s.clips)||s.clips.length>512))throw Error('Piste de clips invalide.');const clips=(s.clips||[]).map(c=>normalizeClip(c,duration)).sort((a,b)=>a.start-b.start);
  if(clips.length>512)throw Error('Maximum 512 clips par danseur.');
  for(let j=1;j<clips.length;j++)if(clips[j].start<clips[j-1].end-1e-7)throw Error(`Danseur ${i+1} : clips superposés. Utiliser une transition, pas un chevauchement.`);
  return {...s,modelAssetId:s.modelAssetId||null,motionAssetId:s.motionAssetId||null,rate:number(s.rate,1,.25,4,'Vitesse de base'),offsetMs:number(s.offsetMs,0,-7200000,7200000,'Décalage'),rotationY:number(s.rotationY,0,-3600,3600,'Rotation'),scale:number(s.scale,1,.25,3,'Échelle'),ik:s.ik!==false,clips};
 });
 if(!Array.isArray(raw.formations||[])||(raw.formations||[]).length>512)throw Error('Formations invalides.');
 const formations=(raw.formations||[]).map(f=>{
  const lead=Math.round(number(f.lead,0,0,3,'Danseur principal'))%count;
  const positions=Array.from({length:count},(_,i)=>vector(f.positions?.[i],legacy.positions(count,spacing)[i],'Position'));
  return {...f,time:number(f.time,0,0,duration,'Instant de formation'),lead,visible:Array.from({length:count},(_,i)=>f.visible?.[i]!==false),positions};
 }).sort((a,b)=>a.time-b.time);
 for(let i=1;i<formations.length;i++)if(Math.abs(formations[i].time-formations[i-1].time)<1e-7)throw Error('Deux formations occupent le même instant.');
 if(raw.cuts!==undefined&&(!Array.isArray(raw.cuts)||raw.cuts.length>2000))throw Error('Coupes caméra invalides.');for(const c of raw.cuts||[]){number(c.time,0,0,duration,'Instant de coupe');if(!['auto','front','close','wide','orbit','high'].includes(c.camera))throw Error('Caméra de coupe inconnue.');}
 if(raw.rhythm){if(!Array.isArray(raw.rhythm.tempoMap)||raw.rhythm.tempoMap.length>2000)throw Error('Carte de tempo Director invalide.');C.tempoMap(raw.rhythm);}
 return {...raw,version:19,duration,enabled:raw.enabled!==false,count,spacing,useCamera:raw.useCamera!==false,slots,formations,cuts:(raw.cuts||[]).slice(0,2000),cameraTrack:normalizeTrack(raw.cameraTrack,'camera',duration),lightTrack:normalizeTrack(raw.lightTrack,'light',duration)};
}
function clipState(clips,time){
 const i=clips.findIndex(c=>time>=c.start&&time<c.end);if(i<0)return null;
 const current=clips[i],previous=clips[i-1],duration=Math.min(current.transition||0,current.end-current.start);
 const contiguous=previous&&Math.abs(previous.end-current.start)<1e-6;
 const alpha=duration>0?clamp((time-current.start)/duration,0,1):1;
 const outgoing=contiguous&&alpha<1?previous:null;
 return {current,previous:outgoing,alpha:outgoing?alpha:1,local:Math.max(0,(time-current.start)*current.rate+current.motionStart),previousLocal:outgoing?Math.max(0,(outgoing.end-outgoing.start)*outgoing.rate+outgoing.motionStart):null};
}
function motionFrame(motion,local,loop){
 // Compile and cache once, never flatten every bone track per render frame.
 if(motion._maxFrame===undefined){let max=0;for(const list of [...motion.boneTracks.values(),...motion.morphTracks.values(),motion.cameraTracks||[]])for(const k of list)max=Math.max(max,k.frame);motion._maxFrame=max;}
 const duration=motion._maxFrame/30;
 return (loop&&duration>0?(Math.max(0,local)%duration):Math.max(0,local))*30;
}
function sampleTrack(track,time,kind='camera'){
 if(!track?.length)return null;
 if(time<=track[0].time)return {...track[0]};if(time>=track.at(-1).time)return {...track.at(-1)};
 let lo=0,hi=track.length-1;while(lo+1<hi){const m=(lo+hi)>>1;if(track[m].time<=time)lo=m;else hi=m;}
 const a=track[lo],b=track[hi];let t=(time-a.time)/(b.time-a.time);
 if(a.easing==='step')t=0;else if(a.easing!=='linear')t=t*t*(3-2*t);
 if(kind==='light')return {intensity:lerp(a.intensity,b.intensity,t),color:a.color.map((v,i)=>lerp(v,b.color[i],t))};
 const delta=((b.yaw-a.yaw+540)%360+360)%360-180;
 return {yaw:a.yaw+delta*t,pitch:lerp(a.pitch,b.pitch,t),distance:lerp(a.distance,b.distance,t),fov:lerp(a.fov,b.fov,t),target:a.target.map((v,i)=>lerp(v,b.target[i],t))};
}
function cameraPose(key){if(!key)return null;const yaw=key.yaw*Math.PI/180,pitch=key.pitch*Math.PI/180,d=key.distance;return {eye:[key.target[0]+Math.sin(yaw)*Math.cos(pitch)*d,key.target[1]+Math.sin(pitch)*d,key.target[2]+Math.cos(yaw)*Math.cos(pitch)*d],target:[...key.target],fov:key.fov*Math.PI/180};}
function autoCuts(song,chart){
 const duration=number(song?.duration,60,.1,7200,'Durée');
 if(C?.autoMetricPV&&chart)return C.autoMetricPV(chart,duration,'arena',4).map(e=>({time:e.time,camera:e.camera}));
 const cuts=[];for(let t=0;t<duration;t+=960/(chart?.bpm||song?.bpm||120))cuts.push({time:t,camera:['wide','front','orbit','close'][cuts.length%4]});return cuts;
}
const originalAutoShow=legacy.autoShow;
function autoShow(song,chart,director,motions=[]){
 const d=originalAutoShow(song,chart,director,motions);d.duration=song.duration;
 const sections=legacy.musicalSections(song,chart);
 for(const s of d.slots){s.clips=s.clips.filter(c=>c.start<song.duration).map(c=>({...c,end:Math.min(c.end,song.duration)}));for(let i=0;i<s.clips.length;i++)s.clips[i].transition=i?.35:0;}
 d.cuts=autoCuts(song,chart);
 d.cameraTrack=sections.slice(0,512).map((s,i)=>({time:s.from,yaw:(i%2?1:-1)*(s.role==='chorus'?24:10),pitch:s.role==='solo'?4:12,distance:s.role==='solo'?5.4:8,fov:s.role==='chorus'?46:40,target:[0,1.6,0],easing:'smooth'}));
 d.lightTrack=sections.slice(0,512).map(s=>({time:s.from,intensity:s.role==='chorus'?1.25:s.role==='break'?.65:1,color:s.role==='chorus'?[1,.85,.93]:[.82,.94,1],easing:'smooth'}));
 // A rotating lead must actually receive the central slot of a solo formation.
 d.formations=(d.formations||[]).map(f=>{if(f.kind==='solo'&&f.lead>0){const p=f.positions;[p[0],p[f.lead]]=[p[f.lead],p[0]];}return f;});
 return normalizeDirector(d);
}
function assetReferences(scene){
 const ids=new Set([scene?.faceTrack?.sourceAsset,scene?.modelAsset,...(scene?.mmd?.assetIds||[])]);
 for(const s of scene?.mmdDirector?.slots||[]){ids.add(s.modelAssetId);ids.add(s.motionAssetId);for(const c of s.clips||[])ids.add(c.motionAssetId);}
 return [...ids].filter(Boolean);
}
function remapScene(scene,idMap){
 const s=structuredClone(scene||{}),lookup=id=>{if(!id)return null;if(!idMap.has(id))throw Error('Média MMD absent du pack : '+id);return idMap.get(id);};
 if(s.faceTrack){s.faceTrack=root.PulseFace.validate(s.faceTrack);s.faceTrack.sourceAsset=lookup(s.faceTrack.sourceAsset);}
 if(s.modelAsset)s.modelAsset=lookup(s.modelAsset);
 if(s.mmd){s.mmd.id='mmd-'+(C?.uid?.()||Date.now());s.mmd.assetIds=(s.mmd.assetIds||[]).map(lookup);s.mmd.files=(s.mmd.files||[]).map(f=>({...f,id:lookup(f.id)}));}
 if(s.mmdDirector){s.mmdDirector=normalizeDirector(s.mmdDirector);for(const slot of s.mmdDirector.slots){slot.modelAssetId=lookup(slot.modelAssetId);slot.motionAssetId=lookup(slot.motionAssetId);for(const c of slot.clips)c.motionAssetId=lookup(c.motionAssetId);}}
 return s;
}
root.PulseDirector={normalizeClip,normalizeTrack,normalizeDirector,clipState,motionFrame,sampleTrack,cameraPose,autoShow,autoCuts,assetReferences,remapScene};
Object.assign(legacy,{normalizeClip,normalizeDirector,autoShow,autoCuts});
if(typeof module!=='undefined')module.exports=root.PulseDirector;
})(typeof window!=='undefined'?window:globalThis);
