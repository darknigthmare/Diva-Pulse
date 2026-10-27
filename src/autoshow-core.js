/* DIVA PULSE 20 — automatic, local, non-destructive performance planning.
 * Audio seconds are the only transport. No external media, ML service or DOM.
 * Source scene fields are never rewritten. Manual tracks override the plan.
 */
(function(root){
'use strict';
const C=root.PulseCore, D=root.PulseDirector, V=root.PulseV10Core;
const TRACKS=['stage','choreography','formations','camera','lighting'];
const STAGES=['arena','rooftop','sakura','orbital'];
const STYLES=['pose','step','wave','clap','reach','idol','spin'];
const clone=x=>structuredClone(x), clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const num=(x,d=0)=>Number.isFinite(Number(x))?Number(x):d;
const hash=x=>C.hashText(JSON.stringify(x)).toString(16);
function bounded(x,a,b,label){if(!Number.isFinite(x)||x<a||x>b)throw Error(label+' invalide.');return x;}
function list(x,label,max=512){if(!Array.isArray(x)||x.length>max)throw Error(label+' : liste invalide ou trop longue.');return x;}
function snapshots(s={}){
 const d=s.mmdDirector,e=s.events||[];
 return {
 stage:hash([s.stage,e.map(x=>[x.time,x.stage])]),
 choreography:hash([s.dance,s.modelAsset,s.modelClip,e.map(x=>[x.time,x.dance]),d?.enabled,d?.slots?.map(x=>[x.motionAssetId,x.clips,x.rate,x.offsetMs,x.ik]),s.mmd?.rate,s.mmd?.offsetMs,s.mmd?.loop]),
 formations:hash([s.cast,s.costumes,s.spacing,s.modelRotation,s.modelScale,d?.count,d?.spacing,d?.formations,d?.slots?.map(x=>[x.modelAssetId,x.scale,x.rotationY])]),
 camera:hash([s.camera,e.map(x=>[x.time,x.camera]),d?.cameraTrack,d?.cuts,d?.useCamera,s.mmd?.useCamera]),
 lighting:hash([s.lights,d?.lightTrack])};
}
function legacyLocks(song){
 const s=song.scene||{},d=s.mmdDirector,events=s.events?.length>0;
 return {stage:!!events||(!!s.stage&&s.stage!=='arena'),
 choreography:!!events||!!d||!!s.modelAsset||!!s.mmd?.pose||(!!s.dance&&s.dance!=='idol'),
 formations:!!d?.formations?.length||s.spacing!==undefined&&s.spacing!==1,
 camera:!!events||!!d?.cameraTrack?.length||!!d?.cuts?.length||s.mmd?.useCamera===true||(!!s.camera&&s.camera!=='auto'),
 lighting:s.lights===false||!!d?.lightTrack?.length};
}
function referenceChart(song){
 // Independent of the selected difficulty and UI state. Prefer analysis timing.
 const charts=song.charts||[];
 return charts.find(c=>c.source==='generated'&&c.difficulty==='HARD')||charts.find(c=>c.source==='generated')||charts.find(c=>c.difficulty==='HARD')||charts[0]||{};
}
function rhythmFor(song){
 const a=song.analysis,c=referenceChart(song),bpm=clamp(num(a?.bpm,c.bpm||song.bpm||120),20,400);
 let map=a?C.estimateTempoMap(a).map(x=>({time:x.time,bpm:x.bpm})):c.tempoMap?.length?clone(c.tempoMap):[{time:0,bpm}];
 const offset=a?0:num(c.offset);
 if(offset){const shifted=map.map(x=>({time:x.time+offset,bpm:x.bpm}));map=[{time:0,bpm:shifted.filter(x=>x.time<=0).at(-1)?.bpm||bpm},...shifted.filter(x=>x.time>1e-7)];}
 const rhythm={bpm,tempoMap:map,gridOffset:a?num(a.phase):num(c.gridOffset)+offset,meterMap:clone(c.meterMap||[{beat:0,numerator:4,denominator:4}])};
 rhythm.tempoMap=C.tempoMap(rhythm);rhythm.originBeat=C.timeToBeat(rhythm,rhythm.gridOffset);return rhythm;
}
function beatAt(plan,time){const map=plan.rhythm.tempoMap;let m=map[0];for(const x of map){if(x.time>time)break;m=x;}return m.beat+(time-m.time)*m.bpm/60-num(plan.rhythm.originBeat);}
function at(track,time,key='time'){let lo=0,hi=track?.length||0;while(lo<hi){const m=(lo+hi)>>1;if(track[m][key]<=time)lo=m+1;else hi=m;}return track?.[Math.max(0,lo-1)]||null;}
function meanEnergy(a,from,to,chart){
 if(a?.silent)return 0;
 if(a?.energy?.length){let sum=0,n=0;for(let i=C.lowerBound(a.energy,from);i<a.energy.length&&a.energy[i].time<to;i++){sum+=a.energy[i].value;n++;}return n?clamp(sum/n,0,1):0;}
 const notes=chart.notes||[];let n=0;for(const x of notes)if(x.time+num(chart.offset)>=from&&x.time+num(chart.offset)<to)n++;
 return n?clamp(.18+n/Math.max(1,to-from)/6,.18,1):a?0:.3;
}
function sectionsFor(song,rhythm){
 const duration=song.duration,chart=referenceChart(song),grid={...rhythm,notes:[],offset:0};
 const source=(chart.sections||[]).filter(x=>Number.isFinite(x.from)&&Number.isFinite(x.to)&&x.to>x.from&&x.from>=0&&x.to<=duration).sort((a,b)=>a.from-b.from);
 const usable=source.length&&source.every((x,i)=>!i||x.from>=source[i-1].to-1e-6);
 const cuts=usable?source.flatMap(x=>[x.from,x.to]):C.autoMetricPV(grid,duration,'arena',4).map(x=>x.time);
 const regions=song.analysis?.regions||[];
 for(let i=0;i<=regions.length;i++){const from=i?regions[i-1].to:0,to=i<regions.length?regions[i].from:duration;if(to-from>=.75&&regions.length)cuts.push(from,to);}
 let bounds=[...new Set([0,...cuts.filter(t=>t>0&&t<duration),duration])].sort((a,b)=>a-b);
 // Stay bounded on unusually long/dense sources. Downsample phrase cuts, never truncate the song.
 if(bounds.length>513){const stride=Math.ceil((bounds.length-2)/510);bounds=[0,...bounds.slice(1,-1).filter((_,i)=>i%stride===0),duration];}
 const raw=bounds.slice(0,-1).map((from,i)=>({from,to:bounds[i+1],energy:meanEnergy(song.analysis,from,bounds[i+1],chart)}));
 const avg=raw.reduce((n,s)=>n+s.energy,0)/Math.max(1,raw.length);
 return raw.map((s,i)=>{const original=usable?source.find(x=>s.from>=x.from-1e-6&&s.to<=x.to+1e-6):null;let role=s.energy<.055?'silence':original&&['intro','outro','chorus','build','break','verse','solo'].includes(original.role)?original.role:i===0?'intro':i===raw.length-1?'outro':s.energy>avg*1.18?'chorus':s.energy>raw[i-1].energy*1.35?'build':s.energy<avg*.7?'break':'verse';
 const labels={intro:'Introduction',outro:'Final',chorus:'Refrain probable',build:'Montée',break:'Passage calme',verse:'Phrase',solo:'Solo probable',silence:'Repos'};
 return {...s,role,label:role==='silence'?labels[role]+' '+(i+1):original?.label||labels[role]+' '+(i+1),confidence:song.analysis?clamp(num(song.analysis.confidence)*.7,.1,.85):.15};});
}
function boneKey(n){return String(n||'').normalize('NFKC').toLowerCase().replace(/[\s_.-]/g,'');}
function motionFeatures(parsed){
 const tracks=new Map();for(const k of parsed.bones||[]){if(!tracks.has(k.name))tracks.set(k.name,[]);tracks.get(k.name).push(k);}
 let total=0,count=0;for(const arr of tracks.values()){arr.sort((a,b)=>a.frame-b.frame);for(let i=1;i<arr.length;i++){const a=arr[i-1],b=arr[i],dt=(b.frame-a.frame)/30;if(dt<=0)continue;const dot=Math.abs(a.rot.reduce((n,x,j)=>n+x*b.rot[j],0));const speed=2*Math.acos(clamp(dot,0,1))/dt;if(Number.isFinite(speed)){total+=Math.min(speed,10);count++;}}}
 return {boneNames:[...tracks.keys()].slice(0,4096),morphNames:[...new Set((parsed.morphs||[]).map(m=>m.name))].slice(0,10000),energy:clamp(count?total/count/1.8:.15,.05,1),duration:num(parsed.duration),measured:true};
}
function chooseMotion(files,model,energy,seed,slot,section){
 const names=new Set(model?.info?.boneNames||[]),morphNames=new Set(model?.info?.morphNames||[]);
 const candidates=files.filter(f=>{const features=f.info?.motionFeatures,fNames=features?.boneNames;if(!features)return true;return (fNames||[]).some(n=>names.has(n))||(features.morphNames||[]).some(n=>morphNames.has(n));});
 return candidates.map(f=>({f,score:Math.abs(num(f.info?.motionFeatures?.energy,.5)-energy)+((C.hashText(seed+':'+slot+':'+section+':'+f.name)%1000)/1000)*.17})).sort((a,b)=>a.score-b.score)[0]?.f||null;
}
function sourceKey(song){const s=song.scene||{},a=song.analysis;return hash([song.audioHash||song.demoId||song.id,song.duration,a?.bpm,a?.phase,a?.energy,a?.tempoWindows,a?.silent,!a&&[referenceChart(song).bpm,referenceChart(song).tempoMap,referenceChart(song).gridOffset,referenceChart(song).offset,referenceChart(song).meterMap,referenceChart(song).sections,referenceChart(song).notes],s.cast,(s.mmd?.files||[]).map(f=>[f.id,f.name,f.info?.duration,f.info?.motionFeatures,...(f.info?.sync?[f.info.sync]:[])]),s.mmdDirector?.count]);}
function generate(song,{seed=0,mood='balanced'}={}){
 bounded(song.duration,.1,7200,'Durée du spectacle');if(!['balanced','calm','concert'].includes(mood))throw Error('Style de spectacle inconnu.');
 const s=song.scene||{},rhythm=rhythmFor(song),sections=sectionsFor(song,rhythm),models=(s.mmd?.files||[]).filter(f=>f.role==='model'),motions=(s.mmd?.files||[]).filter(f=>f.role==='motion'),count=clamp(s.mmdDirector?.count||models.length||s.cast?.length||1,1,models.length?4:3);
 const token=String(song.audioHash||song.demoId||song.id||song.title)+':'+seed;
 const plan={version:20,mode:'auto',seed,mood,duration:song.duration,basis:sourceKey(song),packId:s.mmd?.id||null,rhythm,count,sections,stageTrack:[],danceTracks:Array.from({length:count},()=>[]),cameraTrack:[],lightTrack:[],formations:[],director:null,locks:{},overrides:{},snapshots:snapshots(s),warnings:[]};
 const average=sections.reduce((n,x)=>n+x.energy,0)/sections.length,baseStage=mood==='calm'?'sakura':mood==='concert'?'arena':average>.58?'arena':STAGES[C.hashText(token)%4];
 const palette=baseStage==='sakura'?[1,.7,.86]:baseStage==='orbital'?[.72,.8,1]:baseStage==='rooftop'?[.82,.7,1]:[.64,1,.9];
 let lastStage=-Infinity,stage=baseStage;
 for(let i=0;i<sections.length;i++){
  const sec=sections[i],energy=sec.energy,lead=sec.role==='chorus'||sec.role==='outro'?0:i%count;
  const visible=Array.from({length:count},(_,j)=>!['intro','break','silence'].includes(sec.role)||j===lead);
  const kind=sec.role==='chorus'?'diamond':sec.role==='build'?'duo-front':['intro','break','silence'].includes(sec.role)?'solo':i%2?'arc':'line';
  const positions=count===1?[[0,0,0]]:V.formationPositions(kind,count,1.55);if(kind==='solo'&&lead){[positions[0],positions[lead]]=[positions[lead],positions[0]];}
  plan.formations.push({time:sec.from,end:sec.to,kind,lead,visible,positions,role:sec.role});
  if(i===0||mood!=='calm'&&sec.from-lastStage>=24&&['chorus','break'].includes(sec.role)){stage=sec.role==='chorus'?'arena':sec.role==='break'?'sakura':baseStage;plan.stageTrack.push({time:sec.from,stage});lastStage=sec.from;}
  const choices=sec.role==='silence'?['pose']:sec.role==='intro'||sec.role==='break'?['wave','pose','step']:sec.role==='build'?['reach','step']:sec.role==='chorus'?['clap','reach','idol']:['step','wave','idol'];
  for(let j=0;j<count;j++){
   const style=choices[C.hashText(token+':'+sec.role+':'+Math.round(energy*5)+':'+j)%choices.length];
   plan.danceTracks[j].push({start:sec.from,end:sec.to,style,energy:mood==='calm'?Math.min(.4,energy):energy,phase:sec.role==='chorus'?0:j*.25,transition:Math.min(.55,(sec.to-sec.from)/4)});
  }
  const spread=Math.max(0,...positions.filter((_,j)=>visible[j]).map(p=>Math.abs(p[0]))),solo=visible.filter(Boolean).length===1;
  const distance=Math.max(solo?6.4:8.3,6+spread*1.6),yaw=mood==='calm'?0:(i%2?1:-1)*(solo?10:18),pitch=sec.role==='build'?16:9;
  const target=solo?[positions[lead][0],1.6,positions[lead][2]]:[0,1.45,0];
  plan.cameraTrack.push({time:sec.from,yaw,pitch,distance,fov:44,target,easing:'smooth'});
  // A second key makes a real travelling rather than only one cut per section.
  if(sections.length<=256&&sec.to-sec.from>2)plan.cameraTrack.push({time:sec.from+(sec.to-sec.from)*.72,yaw:mood==='calm'?0:-yaw*.7,pitch:pitch+2,distance:distance+(mood==='calm'?0:.6),fov:44,target:[...target],easing:'smooth'});
  plan.lightTrack.push({time:sec.from,intensity:sec.role==='silence'?.45:clamp(.55+energy*.85,.55,1.4),color:palette.map((v,j)=>clamp(v+(sec.role==='chorus'&&j===0?.15:0),0,1)),easing:'smooth'});
 }
 if(models.length){
  const slots=Array.from({length:count},(_,j)=>{const model=models[j%models.length];return {modelAssetId:model.id,motionAssetId:null,rate:1,scale:1,rotationY:0,ik:s.mmd?.ik!==false,clips:sections.map((sec,i)=>{
   const motion=sec.role==='silence'?null:chooseMotion(motions,model,sec.energy,token,j,i),d=plan.danceTracks[j][i];
   const sync=motion?.info?.sync?root.PulseMotionSync.normalize(motion.info.sync,motion.info.duration):null;return {start:sec.from,end:sec.to,motionAssetId:motion?.id||null,rate:1,sourceBpm:sync?.bpm||null,loopBeats:sync?.loopBeats||null,motionStart:sync?.firstBeat||0,transition:d.transition,loop:true,camera:false,proceduralStyle:motion?null:d.style,proceduralEnergy:d.energy,musicalClock:!motion};
  })};});
  plan.director=D.normalizeDirector({duration:song.duration,rhythm:clone(rhythm),count,enabled:true,spacing:1.55,useCamera:false,slots,formations:plan.formations,cameraTrack:plan.cameraTrack,lightTrack:plan.lightTrack});
  if(motions.length)plan.warnings.push(motions.some(m=>m.info?.sync)?'VMD calés avec les tempos source fournis. Les motions sans réglage gardent leur vitesse originale. Vérifier les pas et les boucles.':'Les VMD fournis sont montés en phrases et bouclés si nécessaire. Leur tempo propre n’est pas deviné ni corrigé automatiquement.');
  if(plan.director.slots.some(s=>s.clips.some(c=>c.proceduralStyle)))plan.warnings.push('Sans VMD compatible : animation procédurale limitée aux os reconnus ; aucune danse ou synchronisation labiale officielle reproduite.');
 }
 if(!song.analysis)plan.warnings.push('Analyse audio absente : spectacle construit sur la grille disponible. Vérifier la pulsation.');
 else if(num(song.analysis.confidence)<.45)plan.warnings.push('Pulsation incertaine : les mouvements rythmiques sont une proposition à vérifier.');
 plan.warnings.push('Rôles musicaux estimés. Décors assemblés à partir des quatre scènes intégrées ; pas de génération de nouveaux modèles 3D.');
 return validate(plan);
}
function validate(raw){
 if(!raw||raw.version!==20||!['auto','manual','off'].includes(raw.mode))throw Error('Spectacle automatique invalide.');
 const p=clone(raw),dur=bounded(p.duration,.1,7200,'Durée');bounded(p.count,1,4,'Danseurs');if(!Number.isInteger(p.count))throw Error('Nombre de danseurs invalide.');
 if(!Number.isInteger(p.seed)||Math.abs(p.seed)>2147483647)throw Error('Graine invalide.');
 p.rhythm.tempoMap=C.tempoMap(p.rhythm);p.rhythm.originBeat=C.timeToBeat(p.rhythm,num(p.rhythm.gridOffset));list(p.sections,'Sections');list(p.stageTrack,'Décors');list(p.danceTracks,'Danseurs',4);if(p.danceTracks.length!==p.count)throw Error('Pistes de danse incomplètes.');
 let end=0;for(const s of p.sections){bounded(s.from,0,dur,'Début de phrase');bounded(s.to,s.from+.000001,dur,'Fin de phrase');if(Math.abs(s.from-end)>1e-6)throw Error('Les phrases doivent couvrir toute la musique.');bounded(s.energy,0,1,'Énergie');end=s.to;}if(Math.abs(end-dur)>1e-6)throw Error('Fin de spectacle incomplète.');
 for(const e of p.stageTrack){bounded(e.time,0,dur,'Décor');if(!STAGES.includes(e.stage))throw Error('Décor inconnu.');}
 for(const track of p.danceTracks){list(track,'Clips procéduraux');let last=0;for(const c of track){bounded(c.start,0,dur,'Début danse');bounded(c.end,c.start+.000001,dur,'Fin danse');if(c.start<last-1e-6||!STYLES.includes(c.style))throw Error('Clip procédural invalide.');last=c.end;bounded(c.phase,-16,16,'Phase');bounded(c.energy,0,1,'Énergie de danse');bounded(c.transition,0,5,'Fondu');}}
 p.cameraTrack=D.normalizeTrack(p.cameraTrack,'camera',dur);p.lightTrack=D.normalizeTrack(p.lightTrack,'light',dur);
 p.formations=D.normalizeDirector({duration:dur,count:p.count,formations:p.formations}).formations;
 p.locks=Object.fromEntries(TRACKS.map(k=>[k,!!p.locks?.[k]]));p.overrides=Object.fromEntries(TRACKS.map(k=>[k,!!p.overrides?.[k]]));
 if(p.director)p.director=D.normalizeDirector({...p.director,duration:dur});return p;
}
function prepare(song,{enabled=true,regenerate=false,seed,mood,unlock=[]}={}){
 if(!song?.scene||!song.duration)return song;
 const s=clone(song.scene),old=s.autoShow?validate(s.autoShow):null;
 if(!old&&!enabled)return song;
 if(old?.mode==='off')return {...song,scene:s};
 const current=snapshots(s),locks=old?{...old.locks}:legacyLocks(song),overrides=old?{...old.overrides}:{...locks};
 for(const k of TRACKS)if(old?.snapshots?.[k]&&old.snapshots[k]!==current[k]&&!(old.packId!==(s.mmd?.id||null)&&['choreography','camera'].includes(k))){locks[k]=true;overrides[k]=true;}
 for(const k of unlock){if(!TRACKS.includes(k))throw Error('Piste à déverrouiller inconnue.');locks[k]=false;overrides[k]=false;}
 const changed=old&&old.basis!==sourceKey(song);
 let plan=old;
 if(!old||(old.mode==='auto'&&(regenerate||changed||unlock.length))){
  const fresh=generate({...song,scene:s},{seed:seed??old?.seed??0,mood:mood??old?.mood??'balanced'});
  if(old){for(const k of TRACKS)if(locks[k]){
    const fields={stage:['stageTrack'],choreography:['danceTracks'],formations:['formations'],camera:['cameraTrack'],lighting:['lightTrack']}[k];
    for(const f of fields)fresh[f]=f==='danceTracks'&&old.count!==fresh.count?Array.from({length:fresh.count},(_,i)=>clone(old.danceTracks[i%old.count])):clone(old[f]);
   }
   if(locks.choreography&&old.director)fresh.director=clone(old.director);
  }
  plan=fresh;
 }
 plan={...plan,locks,overrides,snapshots:current};s.autoShow=validate(plan);return {...song,scene:s};
}
function effectiveDirector(scene){
 const p=scene?.autoShow;if(!p||p.mode==='off')return scene?.mmdDirector||null;
 if(!scene.mmdDirector&&p.overrides.choreography)return null;
 const base=scene.mmdDirector||p.director;if(!base)return null;
 // The manual Director always owns its model/clip associations.
 const d=clone(base);
 if(!scene.mmdDirector){if(p.overrides.camera){d.cameraTrack=[];d.useCamera=scene.mmd?.useCamera!==false;}if(p.overrides.lighting)d.lightTrack=[];if(p.overrides.formations){d.formations=[];d.spacing=clamp(1.55*(scene.spacing||1),.4,4);}}
 if(!p.overrides.camera)d.cameraTrack=clone(p.cameraTrack);
 if(!p.overrides.lighting)d.lightTrack=clone(p.lightTrack);
 if(!p.overrides.formations&&d.count===p.count)d.formations=clone(p.formations);
 return D.normalizeDirector(d);
}
function sample(p,time,{reduceMotion=false,aspect=16/9}={}){
 if(!p||p.mode==='off')return null;time=clamp(num(time),0,p.duration);
 const t=reduceMotion?0:time,form=at(p.formations,time),positions=V.formationAt(p.formations,time,p.count,1.55),section=at(p.sections,time,'from');
 let cam=D.sampleTrack(p.cameraTrack,t);if(cam&&reduceMotion){const extent=Math.max(0,...p.formations.flatMap(f=>f.positions.map(x=>Math.abs(x[0]))));cam={...cam,yaw:0,pitch:12,target:[0,1.5,0],distance:Math.max(9,(extent+1.5)/(Math.tan(cam.fov*Math.PI/360)*Math.max(.35,aspect))+1)};}if(cam){cam=clone(cam);const spread=Math.max(0,...positions.filter((_,i)=>form?.visible?.[i]!==false).map(v=>Math.abs(v[0]-cam.target[0])));cam.distance=Math.max(cam.distance,(spread+1.5)/(Math.tan(cam.fov*Math.PI/360)*Math.max(.35,aspect))+1);}
 return {time,beat:beatAt(p,time),stage:at(p.stageTrack,time)?.stage,form,positions,section,camera:D.cameraPose(cam),light:D.sampleTrack(p.lightTrack,t,'light'),dances:p.danceTracks.map(track=>at(track,Math.min(time,p.duration-1e-7),'start'))};
}
const aliases={head:['頭','head'],torso:['上半身','upperbody','spine','chest'],armL:['左腕','leftarm','arml','armleft'],armR:['右腕','rightarm','armr','armright'],elbowL:['左ひじ','leftelbow','elbowl','forearml'],elbowR:['右ひじ','rightelbow','elbowr','forearmr']};
function proceduralMotion(bones,style='step',energy=.5){
 if(!STYLES.includes(style))style='pose';const byName=new Map(bones.map(b=>[boneKey(b.name),b.name])),tracks=new Map();
 const quat=(x,y,z)=>{const sx=Math.sin(x/2),cx=Math.cos(x/2),sy=Math.sin(y/2),cy=Math.cos(y/2),sz=Math.sin(z/2),cz=Math.cos(z/2);return [sx*cy*cz+cx*sy*sz,cx*sy*cz-sx*cy*sz,cx*cy*sz+sx*sy*cz,cx*cy*cz-sx*sy*sz];};
 const amp=.2+clamp(energy,0,1)*.6;
 for(const [part,keys] of Object.entries(aliases)){
  const name=keys.map(k=>byName.get(boneKey(k))).find(Boolean);if(!name)continue;
  const arr=[];for(let i=0;i<=32;i++){const phase=i/32*Math.PI*4,side=part.endsWith('L')?-1:1;let x=0,y=0,z=0;
   if(part==='head'){y=Math.sin(phase/2)*.15*amp;x=-.04;}
   else if(part==='torso'){z=Math.sin(phase)*.09*amp;y=Math.sin(phase/2)*.12*amp;}
   else if(part.startsWith('elbow'))x=-.18-(style==='clap'?.55:style==='reach'?.35:.15)*(1+Math.sin(phase))*amp;
   else {const a=style==='pose'?.08:style==='wave'?.5:style==='reach'?.65:style==='clap'?.3:.22;z=side*Math.sin(phase+(part.endsWith('L')?0:Math.PI))*a*amp;x=style==='clap'?-.8*amp:Math.sin(phase/2)*.22*amp;}
   arr.push({frame:i*120/32,pos:[0,0,0],rot:quat(x,y,z)});
  }tracks.set(name,arr);
 }
 return {boneTracks:tracks,morphTracks:new Map(),cameraTracks:[],_maxFrame:120,procedural:true,matchedBones:tracks.size};
}
function references(scene){const p=scene?.autoShow;if(!p?.director)return [];return D.assetReferences({mmdDirector:p.director});}
function remapPlan(scene,map){const p=scene?.autoShow;if(!p)return scene;const s=clone(scene);if(p.director){const d=clone(p.director);for(const slot of d.slots){for(const key of ['modelAssetId','motionAssetId'])if(slot[key]){if(!map.has(slot[key]))throw Error('Média du spectacle automatique absent.');slot[key]=map.get(slot[key]);}for(const c of slot.clips)if(c.motionAssetId){if(!map.has(c.motionAssetId))throw Error('Motion automatique absente.');c.motionAssetId=map.get(c.motionAssetId);}}s.autoShow.director=d;}s.autoShow.snapshots=snapshots(s);return s;}
root.PulseAutoShow={TRACKS,STAGES,STYLES,generate,prepare,validate,snapshots,legacyLocks,referenceChart,rhythmFor,sectionsFor,sourceKey,effectiveDirector,sample,beatAt,at,motionFeatures,proceduralMotion,references,remapPlan};
if(typeof module!=='undefined')module.exports=root.PulseAutoShow;
})(globalThis);
