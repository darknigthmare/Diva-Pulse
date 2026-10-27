/* V25: deterministic audio-envelope facial track. No speech or phoneme recognition.
   Original local implementation; the optional voice guide is never mixed into playback. */
(function(root,factory){const api=factory();root.PulseFace=api;if(typeof module!=='undefined')module.exports=api;})(globalThis,function factory(){
'use strict';
const FPS=25,MAX_SECONDS=7200,MAX_SAMPLES=FPS*MAX_SECONDS+1;
const canonical=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/[\s_\-]/g,'');
const MOUTH=['あ','a','aa','mouthopen','jawopen','openmouth'],BLINK=['まばたき','blink','eyesclose','eyeclose'];
function num(x,d,min,max,label){if(x===undefined)return d;if(typeof x!=='number'||!Number.isFinite(x)||x<min||x>max)throw Error(label+' hors plage.');return x;}
function validate(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Piste visage invalide.');
 if(!['off','audio','manual'].includes(raw.mode))throw Error('Mode visage inconnu.');
 const p={version:25,mode:raw.mode,duration:num(raw.duration,1,.01,MAX_SECONDS,'Durée visage'),offset:num(raw.offset,0,-30,30,'Décalage visage'),gain:num(raw.gain,1,0,3,'Gain visage'),maxOpen:num(raw.maxOpen,.8,0,1,'Ouverture maximale'),floor:num(raw.floor,.08,0,.8,'Seuil'),slot:num(raw.slot,-1,-1,3,'Danseur'),mouth:raw.mouth??'auto',blink:raw.blink??false,respectVmd:raw.respectVmd??true,sourceKind:raw.sourceKind??'mix',sourceAsset:raw.sourceAsset??null,sourceName:String(raw.sourceName||'').slice(0,180),sourceHash:raw.sourceHash??null,seed:num(raw.seed,25,0,2147483647,'Graine')};
 if(!Number.isInteger(p.slot)||!Number.isInteger(p.seed)||typeof p.mouth!=='string'||p.mouth.length>120||!p.mouth.trim())throw Error('Cible visage invalide.');
 if(typeof p.blink!=='boolean'||typeof p.respectVmd!=='boolean')throw Error('Protection visage invalide.');
 if(!['mix','voice-guide','manual'].includes(p.sourceKind)||p.sourceAsset!==null&&typeof p.sourceAsset!=='string'||p.sourceHash!==null&&!/^(sha256:)?[a-f\d]{64}$/.test(p.sourceHash))throw Error('Source visage invalide.');
 if(raw.envelope!==undefined&&raw.envelope!==null){const e=raw.envelope;if(e.fps!==FPS||!Array.isArray(e.values)||e.values.length>MAX_SAMPLES||!e.values.length||e.values.some(v=>!Number.isInteger(v)||v<0||v>255))throw Error('Enveloppe visage invalide.');const duration=num(e.duration,0,.01,MAX_SECONDS,'Durée de l’enveloppe');if(e.values.length!==Math.floor(duration*FPS)+1)throw Error('Longueur de l’enveloppe incohérente.');p.envelope={fps:FPS,duration,values:[...e.values]};}
 if(!Array.isArray(raw.keys??[])||(raw.keys||[]).length>10000)throw Error('Clés visage invalides.');
 p.keys=(raw.keys||[]).map(k=>({time:num(k.time,undefined,0,p.duration,'Instant de clé'),open:num(k.open,undefined,0,1,'Ouverture de clé')}));
 if(p.keys.some(k=>k.time===undefined||k.open===undefined))throw Error('Clé visage incomplète.');p.keys.sort((a,b)=>a.time-b.time);
 for(let i=1;i<p.keys.length;i++)if(p.keys[i].time-p.keys[i-1].time<1e-7)throw Error('Deux clés visage au même instant.');
 if(p.mode==='audio'&&!p.envelope)throw Error('Analyser un audio avant d’activer la bouche.');
 return p;
}
function analyze(channels,sampleRate){
 if(!Array.isArray(channels)||!channels.length||channels.length>2||channels.some(a=>!(a instanceof Float32Array)))throw Error('Une ou deux pistes PCM attendues.');
 if(!Number.isFinite(sampleRate)||sampleRate<8000||sampleRate>192000)throw Error('Fréquence audio non prise en charge.');
 const n=channels[0].length,duration=n/sampleRate;
 if(!n||duration>600||channels.some(a=>a.length!==n)||n*channels.length*4>134217728)throw Error('Analyse visage limitée à 10 minutes et 128 Mio PCM.');
 const count=Math.floor(duration*FPS)+1,energy=new Float64Array(count),hop=sampleRate/FPS;
 for(let i=0;i<count;i++){let e=0;const from=Math.max(0,Math.round(i*hop-hop/2)),to=Math.min(n,Math.round(i*hop+hop/2)),length=to-from;
  for(const ch of channels){let sum=0,square=0;for(let j=from;j<to;j++){const x=ch[j];if(!Number.isFinite(x))throw Error('Échantillon audio non fini.');sum+=x;square+=x*x;}if(length)e=Math.max(e,Math.sqrt(Math.max(0,square/length-(sum/length)**2)));}energy[i]=e;
 }
 const sorted=Array.from(energy).sort((a,b)=>a-b),reference=sorted[Math.floor((sorted.length-1)*.95)]||0,noise=Math.max(.001,Math.min(reference*.12,.015)),values=[];
 let value=0;for(const e of energy){const target=reference>.001?Math.max(0,Math.min(1,(e-noise)/(Math.max(reference,noise+.001)-noise))):0;const a=target>value?.7:.35;value+=(target-value)*a;values.push(Math.round(Math.min(1,value)*255));}values[0]=0;values[values.length-1]=0;
 return {envelope:{fps:FPS,duration,values},reference,silent:reference<=.001,kind:'audio-envelope-not-phonemes'};
}
function workerSource(){return 'const F=('+factory.toString()+')();onmessage=e=>{try{postMessage({ok:true,result:F.analyze(e.data.channels,e.data.sampleRate)});}catch(x){postMessage({ok:false,error:x.message});}};';}
function sample(p,time){
 if(!p||p.mode==='off'||!Number.isFinite(time)||time<0||time>=p.duration)return 0;
 const t=time-p.offset;if(t<0)return 0;let v=0;
 if(p.mode==='audio'&&p.envelope){const e=p.envelope;if(t>=e.duration)return 0;const at=t*e.fps,i=Math.floor(at),f=at-i;v=((e.values[i]||0)*(1-f)+(e.values[i+1]||0)*f)/255;v=Math.max(0,(v-p.floor)/(1-p.floor));}
 else if(p.mode==='manual'&&p.keys.length){const ks=p.keys;if(t<ks[0].time||t>ks.at(-1).time)return 0;let lo=0,hi=ks.length-1;while(lo+1<hi){const m=(lo+hi)>>1;if(ks[m].time<=t)lo=m;else hi=m;}const a=ks[lo],b=ks[hi];v=a===b?a.open:a.open+(b.open-a.open)*Math.max(0,Math.min(1,(t-a.time)/(b.time-a.time||1)));}
 return Math.min(p.maxOpen,Math.max(0,v*p.gain));
}
function pick(model,target,aliases){const all=model.pmx?.morphs||[];if(target&&target!=='auto')return all.find(m=>m.name===target)||null;const byName=new Map(all.map(m=>[canonical(m.name),m]));for(const a of aliases)if(byName.has(a))return byName.get(a);return null;}
function touches(model,motion,target){
 if(!motion?.morphTracks||!target)return false;const all=model.pmx.morphs;
 function follows(m,seen){if(m===target)return true;if(!m||m.type!==0||seen.has(m)||seen.size>16)return false;const next=new Set(seen);next.add(m);return m.items.some(x=>follows(all[x.index],next));}
 for(const name of motion.morphTracks.keys())if(follows(model.morphByName.get(name),new Set()))return true;return false;
}
function blinkValue(time,seed,slot){if(time<0)return 0;const period=3.4+((seed+slot*17)%13)*.11,phase=((time+slot*.7)%period+period)%period;const x=(phase-1.7)/.075;return Math.abs(x)<1?(1-Math.abs(x)):0;}
function apply(model,pose,plan,time,{current=null,previous=null,slot=0,lead=0}={}){
 if(!plan||plan.mode==='off')return;
 const mouth=pick(model,plan.mouth,MOUTH),blink=pick(model,'auto',BLINK),selected=slot===(plan.slot<0?lead:plan.slot),motions=[current,previous];
 const blocked=mouth&&plan.respectVmd&&motions.some(m=>touches(model,m,mouth));
 const value=selected?sample(plan,time):0;
 if(mouth&&!blocked)pose.morphs.set(mouth.name,value);
 const blinkBlocked=blink&&plan.respectVmd&&motions.some(m=>touches(model,m,blink));
 if(plan.blink&&blink&&!blinkBlocked)pose.morphs.set(blink.name,time>=plan.duration?0:blinkValue(time,plan.seed,slot));
 model.faceDiagnostic={mouth:mouth?.name||null,missing:!mouth,selected,blocked:!!blocked,open:mouth?(pose.morphs.get(mouth.name)||0):0,blink:blink?.name||null};
}
return {FPS,validate,analyze,workerSource,sample,apply,pick,touches,blinkValue};
});
