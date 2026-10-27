/* V22: opt-in VMD beat clock. The source BPM must be supplied, not guessed. */
(function(root){'use strict';const C=root.PulseCore;
function value(x,min,max,label){const v=Number(x);if(!Number.isFinite(v)||v<min||v>max)throw Error(label+' hors plage.');return v;}
function normalize(raw,duration=7200){
 if(!raw||raw.bpm===null||raw.bpm===undefined||raw.bpm==='')return null;
 const bpm=value(raw.bpm,20,400,'Tempo source'),firstBeat=value(raw.firstBeat??0,0,7200,'Premier temps VMD');
 if(firstBeat>=duration)throw Error('Le premier temps est après la fin du VMD.');
 const loopBeats=raw.loopBeats==null||raw.loopBeats===''?null:value(raw.loopBeats,1,256,'Longueur de boucle');
 if(loopBeats!==null&&!Number.isInteger(loopBeats))throw Error('La boucle doit compter un nombre entier de temps.');
 if(loopBeats&&firstBeat+loopBeats*60/bpm>duration+1/300)throw Error('La boucle dépasse la durée du VMD.');
 return {bpm,firstBeat,loopBeats};
}
function sourceTime(clip,time,rhythm){
 if(!clip.sourceBpm||!rhythm)return {local:Math.max(0,(time-clip.start)*clip.rate+clip.motionStart),loop:clip.loop};
 let beats=Math.max(0,C.timeToBeat(rhythm,time)-C.timeToBeat(rhythm,clip.start))*(clip.rate??1);
 if(clip.loop&&clip.loopBeats)beats=phaseAt(clip,time,rhythm);
 return {local:(clip.motionStart||0)+beats*60/clip.sourceBpm,loop:clip.loop&&!clip.loopBeats};
}
// Phase is expressed in source beats; motionStart remains the loop origin.
// Keeping the origin separate is essential when a cut occurs after a wrap.
function phaseAt(clip,time,rhythm){
 if(!rhythm)throw Error('Carte de tempo requise pour scinder ou fusionner une boucle en temps.');
 const elapsed=Math.max(0,C.timeToBeat(rhythm,time)-C.timeToBeat(rhythm,clip.start))*(clip.rate??1);
 const phase=((elapsed+(clip.loopPhaseBeats||0))%clip.loopBeats+clip.loopBeats)%clip.loopBeats;
 return phase<1e-10||clip.loopBeats-phase<1e-10?0:phase;
}
function normalizeClip(c){
 const phase=value(c.loopPhaseBeats??0,0,256,'Phase de boucle');
 if(c.sourceBpm==null){if(phase)throw Error('Phase de boucle sans BPM source.');return {sourceBpm:null,loopBeats:null,...(c.loopPhaseBeats!==undefined?{loopPhaseBeats:0}:{})};}
 if(c.loopBeats!=null&&!Number.isInteger(Number(c.loopBeats)))throw Error('Boucle en temps entière attendue.');
 const sourceBpm=value(c.sourceBpm,20,400,'Tempo source du clip'),loopBeats=c.loopBeats==null?null:value(c.loopBeats,1,256,'Boucle en temps');
 if(phase&&(!loopBeats||c.loop===false||phase>=loopBeats))throw Error('Phase hors de la boucle active.');
 return {sourceBpm,loopBeats,...(c.loopPhaseBeats!==undefined?{loopPhaseBeats:phase}:{})};
}
root.PulseMotionSync={normalize,sourceTime,normalizeClip,phaseAt};if(typeof module!=='undefined')module.exports=root.PulseMotionSync;
})(typeof window!=='undefined'?window:globalThis);
