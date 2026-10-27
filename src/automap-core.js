/* DIVA PULSE 6 — AutoMap. Original local analysis and deterministic chart families.
 * No model/service/CDN dependency. These heuristics do not transcribe vocals or
 * recover an official level. Analysis and generation are separately testable. */
(function(root){
'use strict';
const C=root.PulseCore||(typeof require==='function'?require('./core.js'):null);
if(!C.generateMusicalChart&&typeof require==='function')require('./live-core.js');
if(!C.meterMap&&typeof require==='function')require('./precision-core.js');

// This whole function can be serialized into a Worker: keep helpers inside it.
function analyzeMusicPCM(input,sr=22050,progress=()=>{}) {
  const ch=ArrayBuffer.isView(input)?[input]:input;
  if(!Array.isArray(ch)||!ch.length||ch.length>2||!ch.every(a=>a instanceof Float32Array)||!Number.isFinite(sr)||sr<8000||sr>96000)throw Error('Analyse : PCM mono/stéréo Float32 attendu.');
  const length=ch[0].length,duration=length/sr;
  if(ch.some(a=>a.length!==length)||duration<.15||duration>600.01)throw Error('Analyse : durée attendue entre 0,15 seconde et 10 minutes.');
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const q=(a,p)=>{const s=Array.from(a).filter(Number.isFinite).sort((a,b)=>a-b);return s.length?s[Math.floor((s.length-1)*p)]:0;};
  const size=1024,hop=Math.round(sr*.01),frames=Math.ceil(length/hop),bins=size/2;
  const win=new Float64Array(size),re=new Float64Array(size),im=new Float64Array(size),mag=new Float64Array(bins),prev=new Float64Array(bins);
  const reverse=new Uint16Array(size),twR=new Float64Array(size/2),twI=new Float64Array(size/2);
  for(let i=0;i<size;i++){win[i]=.5-.5*Math.cos(2*Math.PI*i/(size-1));let r=0,x=i;for(let j=0;j<10;j++){r=(r<<1)|(x&1);x>>=1;}reverse[i]=r;}
  for(let i=0;i<size/2;i++){twR[i]=Math.cos(-2*Math.PI*i/size);twI[i]=Math.sin(-2*Math.PI*i/size);}
  function fft(){for(let i=0;i<size;i++){const j=reverse[i];if(i<j){let t=re[i];re[i]=re[j];re[j]=t;t=im[i];im[i]=im[j];im[j]=t;}}for(let n=2;n<=size;n<<=1){const h=n>>1,step=size/n;for(let off=0;off<size;off+=n)for(let j=0;j<h;j++){const a=off+j,b=a+h,k=j*step,tr=twR[k]*re[b]-twI[k]*im[b],ti=twR[k]*im[b]+twI[k]*re[b];re[b]=re[a]-tr;im[b]=im[a]-ti;re[a]+=tr;im[a]+=ti;}}}
  const flux=Array.from({length:3},()=>new Float32Array(frames)),energyFrames=new Float32Array(frames),centers=new Float32Array(frames),bandFrames=Array.from({length:3},()=>new Float32Array(frames));
  const small=Math.max(1,Math.round(sr*.002)),env=new Float32Array(Math.ceil(length/small));
  let peak=0,clip=0,invalid=0;
  for(let j=0;j<env.length;j++){let en=0,n=0;for(let i=j*small;i<Math.min(length,(j+1)*small);i++)for(const a of ch){const raw=a[i];if(!Number.isFinite(raw)){invalid++;continue;}const v=clamp(raw,-4,4);peak=Math.max(peak,Math.abs(v));clip+=Math.abs(raw)>=.999;en+=v*v;n++;}env[j]=Math.sqrt(en/Math.max(1,n));}
  if(invalid)throw Error('Analyse : échantillons audio non finis.');
  const robust=q(env,.95),silent=robust<.00008&&peak<.0005,gate=Math.max(.00006,robust*.023);
  if(silent)return {version:6,algorithm:'multiband-family-v6',duration,bpm:120,phase:0,confidence:0,silent:true,onsets:[],energy:[],regions:[],warnings:['Audio silencieux : aucune partition artificielle créée.'],candidates:[],tempoWindows:[],variableTempo:false};
  for(let f=0;f<frames;f++){
    mag.fill(0);let en=0;
    for(const a of ch){let mean=0;for(let j=0;j<size;j++)mean+=a[f*hop+j-size/2]||0;mean/=size;for(let j=0;j<size;j++){const v=(a[f*hop+j-size/2]||0)-mean;re[j]=v*win[j];im[j]=0;en+=v*v;}
      fft();for(let k=1;k<bins;k++)mag[k]+=Math.hypot(re[k],im[k])/ch.length;
    }
    energyFrames[f]=Math.sqrt(en/(size*ch.length));let sum=0,weighted=0;
    for(let k=1;k<bins;k++){const hz=k*sr/size,b=hz<250?0:hz<2500?1:2,m=Math.log1p(mag[k]*4);flux[b][f]+=Math.max(0,m-prev[k]);bandFrames[b][f]+=m;prev[k]=m;sum+=m;weighted+=m*hz;}
    centers[f]=sum?clamp(weighted/sum/(sr/2)):0;
    if(f%500===0)progress(.05+.55*f/frames,'Analyse spectrale multibande');
  }
  const scales=flux.map(a=>Math.max(q(a,.975),.001)),novelty=new Float32Array(frames),maxEnv=Math.max(robust,.0001);
  for(let f=0;f<frames;f++){const b=flux.map((a,i)=>Math.min(3,a[f]/scales[i]));novelty[f]=(.36*b[0]+.4*b[1]+.24*b[2])*(energyFrames[f]>gate?1:0);}
  const pref=new Float64Array(frames+1);for(let i=0;i<frames;i++)pref[i+1]=pref[i]+novelty[i];
  const onsets=[];let last=-1;
  for(let f=1;f<frames-1;f++){
    const lo=Math.max(0,f-22),hi=Math.min(frames,f+23),avg=(pref[hi]-pref[lo])/(hi-lo),value=novelty[f];
    if(value<.045||value<avg*1.3+.015||value<novelty[f-1]||value<=novelty[f+1]||energyFrames[f]<=gate)continue;
    const center=f*hop/sr,start=Math.max(1,Math.floor((center-.032)*sr/small)),end=Math.min(env.length-1,Math.ceil((center+.032)*sr/small));
    let maxRise=0,riseAt=start;
    for(let j=start;j<=end;j++){const diff=env[j]-(env[j-2]||0);if(diff>maxRise){maxRise=diff;riseAt=j;}}
    let onsetTime=center;
    if(maxRise>gate*.5){let j=riseAt;const floor=(env[Math.max(start,riseAt-5)]||0)+maxRise*.06;while(j>start&&riseAt-j<5&&env[j-1]>floor)j--;onsetTime=j*small/sr;}
    onsetTime=Math.max(0,Math.min(duration-.002,onsetTime));
    const bands=flux.map((a,i)=>clamp(a[f]/scales[i]/2));
    const strength=clamp(.42*value/2+.58*value/(avg*4+.1));
    const onset={time:+onsetTime.toFixed(6),strength,centroid:centers[f],energy:clamp(energyFrames[f]/maxEnv),bands,confidence:clamp(value/(avg*3+.05)),frame:f};
    if(onsetTime-last<.055){if(onsets.length&&onset.strength>onsets.at(-1).strength)onsets[onsets.length-1]=onset;}else onsets.push(onset);
    last=onsets.at(-1).time;
  }
  // Normalized onset envelope for period correlation. No fixed global latency
  // correction: each selected event is tied to the measured attack itself.
  const pulse=new Float32Array(frames);for(const o of onsets){const f=Math.round(o.time*sr/hop);for(let d=-1;d<=1;d++)if(f+d>=0&&f+d<frames)pulse[f+d]=Math.max(pulse[f+d],o.strength*(d===0?1:.45));}
  function tempoScores(from=0,to=frames){const scores=[];for(let bpm=60;bpm<=210;bpm++){const lag=60/bpm*sr/hop;let dot=0,a2=0,b2=0;for(let f=Math.max(from,Math.ceil(lag));f<to;f++){const k=f-lag,j=Math.floor(k),w=k-j,a=pulse[f],b=(pulse[j]||0)*(1-w)+(pulse[j+1]||0)*w;dot+=a*b;a2+=a*a;b2+=b*b;}
    const score=dot/Math.sqrt(Math.max(1e-12,a2*b2));scores.push({bpm,score,rank:score*(.88+.12*Math.exp(-(((bpm-125)/65)**2)))});}return scores.sort((a,b)=>b.rank-a.rank);}
  progress(.67,'Estimation du tempo et de sa stabilité');
  const scores=tempoScores(),candidates=[];
  for(const s of scores)if(candidates.every(x=>Math.abs(Math.log(x.bpm/s.bpm))>.045)){candidates.push(s);if(candidates.length===5)break;}
  let bpm=candidates[0]?.score>.025?candidates[0].bpm:120,beat=60/bpm,phase=0,best=-1;
  // Refine the estimated period by regression over events near integer beats.
  for(let pass=0;pass<2;pass++){
    best=-1;for(let i=0;i<120;i++){const p=i*beat/120;let s=0;for(const o of onsets){const r=((o.time-p)%beat+beat)%beat,d=Math.min(r,beat-r);s+=o.strength*Math.exp(-d*d/.0016);}if(s>best){best=s;phase=p;}}
    let sw=0,sx=0,sy=0,sxx=0,sxy=0;
    for(const o of onsets){const x=Math.round((o.time-phase)/beat);if(Math.abs(o.time-(phase+x*beat))>.035)continue;const w=o.strength;sw+=w;sx+=w*x;sy+=w*o.time;sxx+=w*x*x;sxy+=w*x*o.time;}
    const den=sw*sxx-sx*sx;if(den>1e-6){const b=(sw*sxy-sx*sy)/den;if(b>.2&&b<1.1&&Math.abs(b/beat-1)<.015){beat=b;bpm=60/b;phase=((sy-beat*sx)/sw%beat+beat)%beat;}}
  }
  const total=onsets.reduce((s,o)=>s+o.strength,0),alignment=total?best/total:0;
  const tempoWindows=[];for(let t=0;t<duration;t+=12){const a=Math.floor(t*sr/hop),b=Math.min(frames,Math.floor((t+16)*sr/hop));if(b-a<4*sr/hop)continue;const s=tempoScores(a,b)[0];if(s?.score>.08)tempoWindows.push({from:t,to:Math.min(duration,t+16),bpm:s.bpm,correlation:+s.score.toFixed(3)});}
  const reliable=tempoWindows.filter(w=>w.correlation>.32),variableTempo=reliable.some(w=>{const d=Math.min(...[.5,1,2].map(m=>Math.abs(Math.log(w.bpm/(bpm*m)))));return d>.09;});
  const confidence=onsets.length<4?0:clamp(.6*alignment+.4*(scores[0]?.score||0),0,.97)*(variableTempo?.7:1);
  const energy=[],regions=[];let from=null;
  for(let j=0;j<env.length;j+=10){const time=j*small/sr;let v=0;for(let k=j;k<Math.min(env.length,j+10);k++)v=Math.max(v,env[k]);energy.push({time:+time.toFixed(6),value:clamp(v/maxEnv)});if(v>gate&&from===null)from=time;if((v<=gate||j+10>=env.length)&&from!==null){const to=v>gate?duration:time;if(to-from>.03)regions.push({from,to});from=null;}}
  const merged=[];for(const r of regions){if(merged.length&&r.from-merged.at(-1).to<.12)merged.at(-1).to=r.to;else merged.push({...r});}
  const warnings=[];
  if(confidence<.5)warnings.push('Pulsation incertaine : timings des attaques conservés, grille à vérifier.');
  if(variableTempo)warnings.push('Variations de tempo probables : quantification automatique désactivée. La grille reste indicative.');
  if(clip/(length*ch.length)>.005)warnings.push('Audio probablement écrêté : certaines attaques peuvent être moins précises.');
  if(onsets.length<8)warnings.push('Très peu d’attaques : les cinq difficultés peuvent rester proches.');
  progress(1,'Analyse terminée');
  return {version:6,algorithm:'multiband-family-v6',duration,bpm:+bpm.toFixed(3),phase:+phase.toFixed(6),confidence:+confidence.toFixed(3),onsets,energy,regions:merged,tempoWindows,variableTempo,silent:false,candidates:candidates.map(x=>x.bpm),tempoCandidates:candidates.map(x=>({bpm:x.bpm,correlation:+x.score.toFixed(3)})),warnings,channels:ch.length,clippingRatio:clip/(length*ch.length)};
}

const PROFILES=Object.freeze([
 {difficulty:'EASY',gap:.44,sameGap:.44,peak:3,sustained:1.8,target:1.25,fraction:.28,approach:2.3,maxChord:1},
 {difficulty:'NORMAL',gap:.275,sameGap:.275,peak:5,sustained:2.8,target:2.15,fraction:.46,approach:2,maxChord:1},
 {difficulty:'HARD',gap:.175,sameGap:.175,peak:7,sustained:4.2,target:3.3,fraction:.67,approach:1.75,maxChord:2},
 {difficulty:'EXTREME',gap:.12,sameGap:.12,peak:10,sustained:6,target:4.8,fraction:.86,approach:1.5,maxChord:3},
 {difficulty:'EX EXTREME',gap:.0875,sameGap:.0875,peak:13,sustained:8,target:6.5,fraction:1,approach:1.3,maxChord:4}
]);
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
function mappingOptions(opts={}){
 const density=Number(opts.density??1),bpm=opts.bpm==null||opts.bpm===''?undefined:Number(opts.bpm),seed=Number(opts.seed??1),style=opts.style||'ribbon',focus=opts.focus||'balanced';
 if(!Number.isFinite(density)||density<.5||density>1.5)throw Error('Densité attendue entre 0,5 et 1,5.');
 if(bpm!==undefined&&(!Number.isFinite(bpm)||bpm<40||bpm>300))throw Error('BPM imposé attendu entre 40 et 300.');
 if(!Number.isSafeInteger(seed)||Math.abs(seed)>2147483647)throw Error('Graine entière attendue (±2 147 483 647).');
 if(!['ribbon','arc','orbit'].includes(style)||!['balanced','percussive','bright'].includes(focus))throw Error('Profil musical ou disposition inconnu.');
 return {...opts,density,bpm,seed,style,focus,quantize:opts.quantize!==false,holds:opts.holds!==false,slides:opts.slides!==false,chords:opts.chords!==false};
}
function atEnergy(a,time){if(!a.energy?.length)return 1;let i=C.lowerBound(a.energy,time);return Math.max(a.energy[Math.min(i,a.energy.length-1)]?.value||0,a.energy[Math.max(0,i-1)]?.value||0);}
function inRegion(a,time){if(!a.regions?.length)return true;return a.regions.some(r=>time>=r.from-.018&&time<=r.to+.018);}
function estimateTempoMap(analysis){
 const base=Math.max(40,Math.min(300,+analysis?.bpm||120)),duration=Math.max(.1,+analysis?.duration||0),wins=(analysis?.tempoWindows||[]).filter(w=>Number.isFinite(+w.bpm)&&Number.isFinite(+w.from)&&(+w.correlation||0)>=.24).sort((a,b)=>a.from-b.from);
 if(!wins.length||!analysis?.variableTempo)return [{time:0,bpm:+base.toFixed(3),confidence:+(analysis?.confidence||0).toFixed(3)}];
 const normalize=b=>{let x=+b;while(x<base*.66)x*=2;while(x>base*1.55)x/=2;return Math.max(40,Math.min(300,x));};
 const raw=[{time:0,bpm:base,confidence:+(analysis?.confidence||0)}];
 for(const w of wins){const bpm=normalize(w.bpm),prev=raw.at(-1);if(Math.abs(Math.log(bpm/prev.bpm))<.025)continue;raw.push({time:Math.max(0,Math.min(duration,+w.from)),bpm,confidence:+w.correlation||0});}
 const out=[];for(const e of raw){if(out.length&&e.time-out.at(-1).time<4){if(e.confidence>out.at(-1).confidence)out[out.length-1]=e;continue;}out.push({time:+e.time.toFixed(3),bpm:+e.bpm.toFixed(3),confidence:+Math.max(0,Math.min(1,e.confidence)).toFixed(3)});}
 if(out.length&&out[0].time>0)out.unshift({time:0,bpm:+base.toFixed(3),confidence:+(analysis?.confidence||0).toFixed(3)});return out.length?out:[{time:0,bpm:+base.toFixed(3),confidence:+(analysis?.confidence||0).toFixed(3)}];
}
function gridTempoMap(map){return (map||[]).map(e=>({time:+e.time,bpm:+e.bpm}));}
function bpmAt(map,time,fallback=120){let bpm=fallback;for(const e of map||[]){if(e.time>time+1e-9)break;bpm=e.bpm;}return bpm;}
function beatAtTime(map,time,phase=0){const m=(map?.length?map:[{time:0,bpm:120}]).slice().sort((a,b)=>a.time-b.time);let beats=-phase*(m[0].bpm/60);for(let i=0;i<m.length;i++){const a=m[i],end=i+1<m.length?Math.min(time,m[i+1].time):time;if(end>a.time)beats+=(end-a.time)*a.bpm/60;if(time<(m[i+1]?.time??Infinity))break;}return beats;}
function timeAtBeat(map,target,phase=0){const m=(map?.length?map:[{time:0,bpm:120}]).slice().sort((a,b)=>a.time-b.time);let beats=-phase*(m[0].bpm/60);for(let i=0;i<m.length;i++){const a=m[i],end=m[i+1]?.time??Infinity,span=end===Infinity?Infinity:(end-a.time)*a.bpm/60;if(target<=beats+span)return a.time+(target-beats)*60/a.bpm;beats+=span;}return 0;}
function nearestTempoGrid(time,map,phase=0,division=4){const beat=beatAtTime(map,time,phase),q=Math.round(beat*division)/division;return timeAtBeat(map,q,phase);}
function estimateStars(chart,duration){const s=C.chartStats(chart),nps=s.notes/Math.max(1,duration),v=1+.68*s.peakNps+.32*nps+.3*s.chords/Math.max(1,s.notes)*10+.15*s.slides/Math.max(1,s.notes)*10;return Math.round(clamp(v,1,10)*2)/2;}
function measureFamily(charts,analysis,options={}) {
 const errors=[],warnings=[...(analysis.warnings||[])],rows=[];
 for(const c of charts){const p=PROFILES[C.DIFFICULTIES.indexOf(c.difficulty)];if(!p){errors.push('Difficulté inconnue.');continue;}
  let chart;try{chart=C.validateChart(c,{allowEmpty:false});}catch(e){errors.push(`${c.difficulty} : ${e.message}`);continue;}
  const groups=[];for(const n of chart.notes){if(!groups.length||Math.abs(groups.at(-1)[0].time-n.time)>1e-6)groups.push([n]);else groups.at(-1).push(n);}
  const laneLast=Array(6).fill(null);let minGap=Infinity,maxShift=0;
  for(let gi=0;gi<groups.length;gi++){const g=groups[gi];if(gi){const gap=g[0].time-groups[gi-1][0].time;minGap=Math.min(minGap,gap);if(gap<p.gap-1e-5)errors.push(`${c.difficulty} : frappes trop rapprochées.`);}
   if(g.length>p.maxChord)errors.push(`${c.difficulty} : accord trop chargé.`);
   for(let i=0;i<g.length;i++){const n=g[i];if(n.time+(n.duration||0)>analysis.duration+.001||n.time<0)errors.push(`${c.difficulty} : note hors audio.`);
    if(n.x<.12||n.x>.88||n.y<.2||n.y>.8)errors.push(`${c.difficulty} : cible hors zone sûre.`);
    if(!inRegion(analysis,n.audioTime??n.time)||atEnergy(analysis,n.audioTime??n.time)<.018)errors.push(`${c.difficulty} : note dans un silence.`);
    if(Number.isFinite(n.audioTime)){const shift=Math.abs(n.time-n.audioTime);maxShift=Math.max(maxShift,shift);if(shift>.02501)errors.push(`${c.difficulty} : recalage excessif.`);}
    const prev=laneLast[n.lane];if(prev&&prev.time+(prev.type==='hold'?prev.duration:0)+.04>n.time)errors.push(`${c.difficulty} : maintien ou touche en conflit.`);laneLast[n.lane]=n;
    for(let j=0;j<i;j++)if(Math.hypot(n.x-g[j].x,n.y-g[j].y)<.09)errors.push(`${c.difficulty} : cibles d’accord superposées.`);
   }
  }
  const stats=C.chartStats(chart);if(stats.peakNps>p.peak)errors.push(`${c.difficulty} : pic de densité excessif.`);
  for(let i=0,j=0;i<chart.notes.length;i++){while(chart.notes[i].time-chart.notes[j].time>4)j++;if(i-j+1>Math.ceil(p.sustained*4))errors.push(`${c.difficulty} : densité prolongée excessive.`);}
  rows.push({difficulty:c.difficulty,notes:stats.notes,events:groups.length,peakNps:stats.peakNps,nps:+(stats.notes/Math.max(1,analysis.duration)).toFixed(2),holds:stats.holds,slides:stats.slides,chords:stats.chords,minGap:Number.isFinite(minGap)?+minGap.toFixed(4):null,maxShiftMs:+(maxShift*1000).toFixed(2),stars:estimateStars(c,analysis.duration),signature:C.chartSignature(c)});
 }
 for(let i=1;i<charts.length;i++){const low=charts[i-1],hi=charts[i],set=new Set(hi.notes.map(n=>`${n.eventId}|${n.lane}|${n.time}|${n.type}`));if(low.notes.some(n=>!set.has(`${n.eventId}|${n.lane}|${n.time}|${n.type}`)))errors.push('Les repères communs changent entre difficultés.');if(low.notes.length===hi.notes.length)warnings.push(`${low.difficulty} / ${hi.difficulty} proches : pas de notes inventées pour gonfler la difficulté.`);}
 return {version:6,ok:!errors.length,errors:[...new Set(errors)],warnings:[...new Set(warnings)],rows,confidence:analysis.confidence||0,sharedAnchors:!errors.some(e=>e.includes('repères communs')),scope:'Contrôle structurel et heuristique ; pas une validation artistique ni une certification de mapping officiel.'};
}
// V19: choose a local binary/ternary grid only when several non-binary
// attacks support it. A lone syncopation cannot force a triplet section.
function rhythmWindows(onsets,map,phase=0){
 const groups=new Map();for(const o of onsets){const beat=beatAtTime(map,o.time,phase),index=Math.floor(Math.max(0,beat)/8);if(!groups.has(index))groups.set(index,[]);groups.get(index).push({beat,weight:Math.max(.05,o.strength||1)});}
 return [...groups.entries()].map(([index,list])=>{
  let binary=0,ternary=0,total=0,evidence=0;
  for(const e of list){const db=Math.abs(e.beat-Math.round(e.beat*4)/4),dt=Math.abs(e.beat-Math.round(e.beat*6)/6);binary+=Math.min(.125,db)*e.weight;ternary+=Math.min(.125,dt)*e.weight;total+=e.weight;if(dt<.027&&db>.052)evidence++;}
  const chosen=list.length>=6&&evidence>=3&&ternary<binary*.6&&binary/total>.022;
  return {index,from:Math.max(0,timeAtBeat(map,index*8,phase)),to:timeAtBeat(map,(index+1)*8,phase),division:chosen?6:4,rhythm:chosen?'ternary':'binary',evidence,confidence:+(chosen?clamp(1-ternary/Math.max(binary,1e-6),0,1):0).toFixed(3)};
 });
}
function generateChartFamily(analysis,raw={}) {
 const opts=mappingOptions(raw);
 if(!analysis||analysis.silent||!Number.isFinite(analysis.duration)||analysis.duration<=0||analysis.duration>600.01||!Array.isArray(analysis.onsets)||analysis.onsets.length>60000)throw Error('Analyse musicale absente ou invalide.');
 const bpm=opts.bpm||analysis.bpm||120;if(!Number.isFinite(bpm)||bpm<40||bpm>300)throw Error('Tempo invalide dans l’analyse.');
 const beat=60/bpm,phase=opts.bpm?C.generationPhase(analysis.onsets,bpm):(analysis.phase||0),conf=analysis.confidence||0,tempoMap=opts.bpm?[{time:0,bpm:opts.bpm,confidence:1}]:estimateTempoMap(analysis),gridMap=gridTempoMap(tempoMap),quantize=opts.quantize&&(conf>=.42||opts.bpm!==undefined||tempoMap.some(x=>(x.confidence||0)>=.45));
 const rawEvents=analysis.onsets.filter(o=>Number.isFinite(o.time)&&Number.isFinite(o.strength)&&o.time>=0&&o.time<analysis.duration-.06&&o.strength>0&&inRegion(analysis,o.time)&&atEnergy(analysis,o.time)>=.018).sort((a,b)=>a.time-b.time);
 const rhythm=rhythmWindows(rawEvents,gridMap,phase),rhythmMap=new Map(rhythm.map(w=>[w.index,w]));
 const events=[];
 for(const [index,o] of rawEvents.entries()){
  let time=o.time;const region=rhythmMap.get(Math.floor(Math.max(0,beatAtTime(gridMap,time,phase))/8)),division=region?.division||4,nearest=nearestTempoGrid(time,gridMap,phase,division);
  if(quantize&&Math.abs(nearest-time)<=.025&&nearest>=0&&inRegion(analysis,nearest))time=nearest;
  if(events.length&&time-events.at(-1).time<.055)continue;
  const meter=beatAtTime(gridMap,time,phase),integer=Math.abs(meter-Math.round(meter)),half=Math.abs(meter*2-Math.round(meter*2)),gridWeight=integer<.1?1:half<.12?.65:.3;
  const bands=o.bands||[o.strength,o.strength,o.centroid||.2],focus=opts.focus==='percussive'?bands[0]*.7+bands[2]*.3:opts.focus==='bright'?bands[1]*.45+bands[2]*.55:Math.max(...bands)*.4+o.strength*.6;
  const score=.5*o.strength+.18*focus+.24*gridWeight+.08*(o.energy||.5);
  events.push({...o,audioTime:o.time,time:+time.toFixed(6),subdivision:division,eventId:`attack-${index}`,beat:meter,score,birth:99,gridWeight,bands});
 }
 if(events.length<2)throw Error('Pas assez d’attaques musicales fiables : audio conservé, utiliser le studio manuel ou une partition existante.');
 // A family is grown, not re-randomized. Every anchor from an easier level is
 // inherited by the next one with the same timestamp, symbol and mechanism.
 const phraseLength=beat*8,phrases=new Map();
 for(const e of events){const p=Math.floor(Math.max(0,e.beat)/8);if(!phrases.has(p))phrases.set(p,[]);phrases.get(p).push(e);}
 let selected=[];
 function insertAllowed(e,list,p){let idx=C.lowerBound(list,e.time);if(idx&&e.time-list[idx-1].time<p.gap-1e-6)return false;if(idx<list.length&&list[idx].time-e.time<p.gap-1e-6)return false;
  // Any sliding 1 s / 4 s window containing this event is bounded. The sparse
  // lower tiers never reserve more events than the higher profile can handle.
  const lo=C.lowerBound(list,e.time-4),hi=C.lowerBound(list,e.time+4.00001),near=list.slice(lo,hi);near.push(e);near.sort((a,b)=>a.time-b.time);
  for(const [window,limit] of [[1,p.peak],[4,Math.ceil(p.sustained*4)]])for(let i=0,j=0;i<near.length;i++){while(near[i].time-near[j].time>window+1e-8)j++;if(i-j+1>limit)return false;}
  list.splice(idx,0,e);return true;
 }
 for(let level=0;level<5;level++){
  const p=PROFILES[level];selected=[...selected];
  for(const group of phrases.values()){
   const first=group[0].time,last=group.at(-1).time,span=Math.min(timeAtBeat(gridMap,(Math.floor(group[0].beat/8)+1)*8,phase)-timeAtBeat(gridMap,Math.floor(group[0].beat/8)*8,phase),Math.max(beat,last-first+beat));
   const avg=group.reduce((a,e)=>a+(e.strength||0),0)/Math.max(1,group.length),local=clamp(.78+avg*.48,.72,1.28),budget=Math.max(1,Math.min(Math.ceil(group.length*p.fraction*opts.density*local),Math.ceil(span*p.target*opts.density*local)));
   let have=group.filter(e=>e.birth<level).length;
   const candidates=group.filter(e=>e.birth===99).sort((a,b)=>b.score-a.score||a.time-b.time);
   for(const e of candidates){if(have>=budget)break;if(insertAllowed(e,selected,p)){e.birth=level;have++;}}
  }
 }
 const base=events.filter(e=>e.birth<5),motifs=new Map();
 for(const [phrase,group] of phrases){const rhythm=Array(32).fill(0);for(const e of group){const slot=((Math.round(e.beat*4)%32)+32)%32;rhythm[slot]=Math.max(rhythm[slot],Math.round(e.strength*2)+1);}const key=rhythm.join('');if(!motifs.has(key))motifs.set(key,C.hashText(key+':'+opts.seed));for(const e of group)e.motif=motifs.get(key);}
 let lastLane=-1,run=0;
 for(let i=0;i<base.length;i++){
  const e=base[i],slot=((Math.round(e.beat*4)%32)+32)%32,hash=C.hashText(`${e.motif}:${slot}`),pool=e.birth===0?[0,2]:[0,1,2,3];
  let lane=pool[hash%pool.length];if(lane===lastLane&&run>=2)lane=pool[(pool.indexOf(lane)+1)%pool.length];
  const gap=i?e.time-base[i-1].time:1;
  if(opts.slides&&e.birth>=2&&e.bands[2]>.38&&hash%5===0&&gap>=.15)lane=hash%2?4:5;
  run=lane===lastLane?run+1:1;lastLane=lane;
  const motion=e.beat*Math.PI/8,x=opts.style==='orbit'?.5+Math.cos(motion)*.23:.5+Math.sin(motion)*.25,y=opts.style==='ribbon'?.46+Math.sin(e.beat*Math.PI/4)*.11:opts.style==='arc'?.53-Math.abs(Math.sin(motion))*.18:.48+Math.sin(motion)*.18;
  e.note={id:e.eventId,eventId:e.eventId,audioTime:e.audioTime,time:e.time,lane,type:lane>3?'slide':'tap',x:+x.toFixed(5),y:+y.toFixed(5),duration:0,angle:Math.sin(motion)*70-90,distance:.56};
 }
 // Holds occupy genuinely audible gaps. They end before the next event in the
 // complete family, so adding difficulty can never create a same-key overlap.
 if(opts.holds)for(let i=0;i<base.length;i++){const e=base[i],n=e.note,gap=(base[i+1]?.time??analysis.duration)-e.time;if(e.birth<1||n.lane>3||gap<.72||C.hashText(e.eventId+opts.seed)%3!==0)continue;let end=e.time;for(let t=e.time+.12;t<Math.min(analysis.duration-.05,e.time+3,e.time+gap-.1);t+=.06){if(atEnergy(analysis,t)<.085||!inRegion(analysis,t))break;end=t;}if(end-e.time>=.55){n.type='hold';n.duration=+(end-e.time).toFixed(6);}}
 const extras=[],chordGroups=new Map();
 // The valid lower-tier lists are maintained incrementally. Inserting an accent
 // can only break a density window containing that accent, not the whole song.
 const tierNotes=PROFILES.map((_,level)=>base.filter(e=>e.birth<=level).map(e=>e.note));
 // Add accents without consuming unbounded note budgets. A chord uses another
 // face button; no opposite-direction double-slide is synthesized.
 for(let level=2;level<5;level++)if(opts.chords){const p=PROFILES[level];
  for(const e of base){if(e.birth>level||e.note.lane>3||e.note.type==='hold'||e.strength<.38||C.hashText(e.eventId+opts.seed)%(level===2?11:level===3?7:5)!==0)continue;
   const g=[e.note,...(chordGroups.get(e.eventId)||[])];if(g.length>=p.maxChord)continue;
   const lane=[0,1,2,3].find(l=>!g.some(n=>n.lane===l)&&!base.some(x=>x!==e&&x.note.lane===l&&(Math.abs(x.time-e.time)<p.sameGap||x.note.type==='hold'&&x.time<e.time&&x.time+x.note.duration+.08>e.time)));
   if(lane===undefined||extras.some(n=>n.lane===lane&&n.eventId!==e.eventId&&Math.abs(n.time-e.time)<p.sameGap))continue;const n={...e.note,id:e.eventId+'-'+lane,lane,type:'tap',duration:0,birth:level};
   let ok=true;for(let tier=level;tier<5&&ok;tier++){const limitProfile=PROFILES[tier],list=tierNotes[tier],lo=C.lowerBound(list,n.time-4.00001),hi=C.lowerBound(list,n.time+4.00001),test=list.slice(lo,hi);test.splice(C.lowerBound(test,n.time),0,n);for(const [win,limit] of [[1,limitProfile.peak],[4,Math.ceil(limitProfile.sustained*4)]])for(let i=0,j=0;i<test.length;i++){while(test[i].time-test[j].time>win+1e-8)j++;if(i-j+1>limit){ok=false;break;}}}
   if(ok){extras.push(n);if(!chordGroups.has(n.eventId))chordGroups.set(n.eventId,[]);chordGroups.get(n.eventId).push(n);for(let tier=level;tier<5;tier++){const list=tierNotes[tier];list.splice(C.lowerBound(list,n.time),0,n);}}
  }
 }
 // Reserve all possible chord slots on every tier, retaining coordinates of
 // shared anchors. No centered target is silently moved by a harder version.
 for(const e of base){const group=[e.note,...(chordGroups.get(e.eventId)||[])];if(group.length>1){const half=(group.length-1)*.055,x=clamp(e.note.x,.14+half,.86-half),y=e.note.y;group.sort((a,b)=>a.lane-b.lane).forEach((n,i)=>{n.x=clamp(x+(i-(group.length-1)/2)*.11,.14,.86);n.y=y;});}}
 const sectionDraft=[];for(const [idx,group] of phrases){if(sectionDraft.length>=200)break;const from=Math.max(0,timeAtBeat(gridMap,idx*8,phase)),to=Math.min(analysis.duration,timeAtBeat(gridMap,(idx+1)*8,phase));if(to-from<=.1)continue;const density=group.length/Math.max(1,to-from),energy=group.reduce((a,e)=>a+e.strength,0)/Math.max(1,group.length),spectral=group.reduce((a,e)=>a+(e.bands?.[2]||0),0)/Math.max(1,group.length);sectionDraft.push({idx,from,to,density,energy,spectral});}
 const meanEnergy=sectionDraft.reduce((a,s)=>a+s.energy,0)/Math.max(1,sectionDraft.length),meanDensity=sectionDraft.reduce((a,s)=>a+s.density,0)/Math.max(1,sectionDraft.length);
 const sections=sectionDraft.map((s,i)=>{const prev=sectionDraft[i-1],next=sectionDraft[i+1];let role='verse';if(i===0)role='intro';else if(i===sectionDraft.length-1)role='outro';else if(s.energy>meanEnergy*1.18&&s.density>meanDensity*.95)role='chorus';else if(prev&&s.energy>prev.energy*1.22)role='build';else if(prev&&next&&s.energy<meanEnergy*.72&&s.energy<prev.energy*.82)role='break';else if(s.spectral>.48&&s.density>meanDensity*1.08)role='solo';const names={intro:'Intro',verse:'Couplet',chorus:'Refrain',build:'Montée',break:'Pont / calme',solo:'Solo',outro:'Final'};return {id:'auto-section-'+s.idx,label:`${names[role]} · ${i+1}`,from:s.from,to:s.to,role,energy:+s.energy.toFixed(4),density:+s.density.toFixed(4),confidence:+Math.min(.95,.45+Math.abs(s.energy-meanEnergy)*.7+Math.abs(s.density-meanDensity)*.08).toFixed(3)};});
 const familyId='family6-'+C.hashText(JSON.stringify([analysis.duration,bpm,phase,tempoMap,opts.seed,opts.density,opts.style,opts.focus,opts.quantize,opts.holds,opts.slides,opts.chords,base.map(e=>[e.time,e.birth,e.note.lane,e.note.type])])).toString(16);
 const charts=PROFILES.map((p,level)=>C.validateChart({title:opts.title||'Musique importée',id:C.uid(),bpm,tempoMap:gridTempoMap(tempoMap),gridOffset:phase,offset:0,difficulty:p.difficulty,source:'generated',notes:[...base.filter(e=>e.birth<=level).map(e=>({...e.note,approach:p.approach})),...extras.filter(n=>n.birth<=level).map(n=>({...n,approach:p.approach}))],sections:structuredClone(sections),generator:{version:6,algorithm:'coherent-family',familyId,seed:opts.seed,density:opts.density,style:opts.style,focus:opts.focus,quantize,requestedQuantize:opts.quantize,detectedBpm:analysis.bpm,usedBpm:bpm,confidence:conf,motifs:motifs.size,attacks:events.length,options:opts,warning:'Mapping heuristique local : vérifier à l’écoute. Pas une partition officielle.'}}));
 const report=measureFamily(charts,analysis,opts);report.rhythmWindows=rhythm;report.ternaryWindows=rhythm.filter(w=>w.division===6).length;report.algorithmRevision=19;
 if(report.ternaryWindows)report.warnings.push(`${report.ternaryWindows} phrase(s) à subdivision ternaire probable. Vérifier à l’écoute.`);
 for(const c of charts){c.generator.algorithmRevision=19;c.generator.rhythmWindows=structuredClone(rhythm);}
 for(const c of charts)c.generator.quality={...report.rows.find(r=>r.difficulty===c.difficulty),ok:report.ok,warnings:report.warnings};
 if(!report.ok)throw Error('Mapping refusé par le contrôle de jouabilité : '+report.errors.slice(0,3).join(' '));
 return {familyId,charts,report,analysis,options:opts};
}
function missingDifficulties(song){const available=new Set((song.charts||[]).filter(c=>Array.isArray(c.notes)&&c.notes.length).map(c=>c.difficulty));return C.DIFFICULTIES.filter(d=>!available.has(d));}
function exactCatalogCharts(song,entries){let next={...song,charts:[...(song.charts||[])]},added=0,duplicates=0;for(const entry of entries||[]){if(!['exact','demo'].includes(C.matchCatalog(entry,song).level))continue;const missing=missingDifficulties(next),charts=entry.charts.filter(c=>missing.includes(c.difficulty)&&c.notes?.length);if(!charts.length)continue;const result=C.attachCatalog(next,{...entry,charts});next=result.song;added+=result.added;duplicates+=result.duplicates;}return {song:next,added,duplicates};}
Object.assign(C,{analyzeMusicPCM,AUTOMAP_PROFILES:PROFILES,mappingOptions,generateChartFamily,measureFamily,missingDifficulties,exactCatalogCharts,rhythmWindows,estimateStars,estimateTempoMap,bpmAt,beatAtTime,timeAtBeat,nearestTempoGrid});
if(typeof module!=='undefined')module.exports=C;
})(globalThis);
