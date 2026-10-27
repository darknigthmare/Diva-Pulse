/* V24: a motion cycle is NOT automatically a musical beat. Proposal only.
 * Bounded 30 Hz pose correlation; alternatives explicitly retain half/double ambiguity.
 */
(function(root){'use strict';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function analyze(motion,{maxSeconds=90}={}){
 if(!motion||!Array.isArray(motion.bones))throw Error('VMD complet attendu.');
 const duration=Math.min(Number(motion.duration)||0,Math.max(4,Math.min(90,Number(maxSeconds)||90))),hz=30,n=Math.floor(duration*hz)+1;
 const none=reason=>({method:'pose-autocorrelation-v1',duration,confidence:0,candidates:[],reason,warnings:['Un cycle de pose ne détermine pas le BPM musical. Validation à l’écoute nécessaire.']});
 if(n<121)return none('Motion trop courte : quatre secondes au minimum.');
 const tracks=new Map();for(const key of motion.bones){if(!tracks.has(key.name))tracks.set(key.name,[]);tracks.get(key.name).push(key);}
 const channels=[];
 for(const [name,raw]of [...tracks].sort((a,b)=>b[1].length-a[1].length).slice(0,128)){
  const keys=raw.map(k=>({...k})).sort((a,b)=>a.frame-b.frame);if(keys.length<4)continue;
  let prev=null;for(const k of keys){if([...k.pos,...k.rot].some(x=>!Number.isFinite(x)))throw Error('Clé VMD non finie.');const q=[...k.rot];if(prev&&q.reduce((s,v,i)=>s+v*prev[i],0)<0)for(let j=0;j<4;j++)q[j]=-q[j];k.__analysisQ=q;prev=q;}
  // Translation and quaternion components preserve signed pose cycles, unlike speed-only signals.
  for(let c=0;c<7;c++){
   const a=new Float64Array(n);let j=0;
   for(let i=0;i<n;i++){while(j+1<keys.length&&keys[j+1].frame<=i)j++;const x=keys[j],y=keys[Math.min(j+1,keys.length-1)],t=clamp((i-x.frame)/Math.max(1,y.frame-x.frame),0,1);const p=c<3?x.pos[c]:x.__analysisQ[c-3],q=c<3?y.pos[c]:y.__analysisQ[c-3];a[i]=p+(q-p)*t;}
   const mean=a.reduce((s,x)=>s+x,0)/n;let energy=0;for(let i=0;i<n;i++){a[i]-=mean;energy+=a[i]*a[i];}
   if(energy/n>(c<3?.0004:.0001))channels.push({name,c,a,energy});
  }
 }
 // Do not write a single auxiliary property to the source VMD or to model metadata.

 channels.sort((a,b)=>b.energy-a.energy);const selected=channels.slice(0,16);
 if(!selected.length)return none('Aucun cycle corporel mesurable : pose statique ou animation faciale seule.');
 const maxLag=Math.min(180,Math.floor(n/3)),scores=[];
 for(let lag=8;lag<=maxLag;lag++){let total=0;for(const {a}of selected){let ab=0,aa=0,bb=0;for(let i=lag;i<n;i++){ab+=a[i]*a[i-lag];aa+=a[i]*a[i];bb+=a[i-lag]*a[i-lag];}total+=aa&&bb?ab/Math.sqrt(aa*bb):0;}scores.push({lag,score:total/selected.length});}
 const peaks=scores.filter((v,i)=>i>0&&i<scores.length-1&&v.score>scores[i-1].score&&v.score>=scores[i+1].score&&v.score>.6).sort((a,b)=>b.score-a.score);
 if(!peaks.length)return none('Aucune répétition de pose suffisamment stable détectée.');
 const top=peaks[0],first=peaks.filter(p=>p.score>=top.score-.07).sort((a,b)=>a.lag-b.lag)[0],idx=first.lag-8,l=scores[idx-1].score,c=first.score,r=scores[idx+1].score,delta=clamp(.5*(l-r)/(l-2*c+r||1),-.5,.5),period=(first.lag+delta)/hz;
 // Require agreement between the early/late halves, not only a repetitive subsection.
 const stability=[];for(const [lo,hi]of [[0,Math.floor(n/2)],[Math.floor(n/2),n]]){let s=0;for(const {a}of selected){let ab=0,aa=0,bb=0;for(let i=lo+first.lag;i<hi;i++){ab+=a[i]*a[i-first.lag];aa+=a[i]*a[i];bb+=a[i-first.lag]*a[i-first.lag];}s+=aa&&bb?ab/Math.sqrt(aa*bb):0;}stability.push(s/selected.length);}
 const confidence=clamp(Math.min(first.score,...stability),0,1);if(confidence<.65)return none('Cycles variables : une seule pulsation source ne serait pas fiable.');
 const candidates=[.5,1,2,4,8].map(beats=>({bpm:Math.round(beats*60/period*10)/10,beatsPerCycle:beats,periodSeconds:period,firstBeat:0})).filter(x=>x.bpm>=40&&x.bpm<=240);
 return {method:'pose-autocorrelation-v1',duration,periodSeconds:period,confidence,channels:selected.length,stability,candidates,reason:'Période de pose répétée, à interpréter musicalement.',warnings:['Le premier temps reste à régler : la phase de la danse n’est pas un temps fort certain.','Boucles et tempos moitié/double possibles ; aucune valeur n’est appliquée automatiquement.','Approximation temporelle pour l’analyse uniquement ; le lecteur conserve ses courbes VMD.']};
}
root.PulseMotionAnalysis={analyze};if(typeof module!=='undefined')module.exports=root.PulseMotionAnalysis;
})(typeof window!=='undefined'?window:globalThis);
