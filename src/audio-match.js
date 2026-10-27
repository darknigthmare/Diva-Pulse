/* V26 original local acoustic resemblance descriptor. NOT an identity proof.
   Spectral shape + relative amplitude; no network, catalog lookup or copyrighted audio. */
(function(root,factory){const api=factory();root.PulseAudioMatch=api;if(typeof module!=='undefined')module.exports=api;})(globalThis,function factory(){
'use strict';
const RATE=11025,FPS=20,N=1024,BANDS=12,MAX_SECONDS=600;
const LIMITS=[45,90,150,240,380,600,900,1350,2000,2800,3700,4600,5513];
function validate(p){
 if(!p||p.version!==26||p.rate!==FPS||p.bands!==BANDS||!Number.isFinite(p.duration)||p.duration<.1||p.duration>MAX_SECONDS+.01)throw Error('Empreinte acoustique incompatible.');
 const count=Math.ceil(p.duration*FPS);
 if(!Array.isArray(p.energy)||p.energy.length!==count||!Array.isArray(p.spectrum)||p.spectrum.length!==count*BANDS)throw Error('Taille de l’empreinte acoustique invalide.');
 if(p.energy.some(x=>!Number.isInteger(x)||x<0||x>255)||p.spectrum.some(x=>!Number.isInteger(x)||x<0||x>255))throw Error('Valeur acoustique invalide.');
 return p;
}
function fft(re,im){
 for(let i=1,j=0;i<N;i++){let bit=N>>1;for(;j&bit;bit>>=1)j^=bit;j^=bit;if(i<j){[re[i],re[j]]=[re[j],re[i]];}}
 for(let size=2;size<=N;size<<=1){const angle=-2*Math.PI/size,wr=Math.cos(angle),wi=Math.sin(angle);for(let start=0;start<N;start+=size){let ar=1,ai=0;for(let j=0;j<size/2;j++){const a=start+j,b=a+size/2,tr=ar*re[b]-ai*im[b],ti=ar*im[b]+ai*re[b];re[b]=re[a]-tr;im[b]=im[a]-ti;re[a]+=tr;im[a]+=ti;const x=ar*wr-ai*wi;ai=ar*wi+ai*wr;ar=x;}}}
}
function analyze(channels,sampleRate=RATE){
 if(sampleRate!==RATE||!Array.isArray(channels)||channels.length<1||channels.length>2||channels.some(x=>!(x instanceof Float32Array)))throw Error('PCM 11025 Hz mono/stéréo attendu.');
 const length=channels[0].length,duration=length/RATE;if(length<RATE*.1||duration>MAX_SECONDS+.01||channels.some(x=>x.length!==length))throw Error('Analyse acoustique : 0,1 seconde à 10 minutes.');
 for(const ch of channels)for(const x of ch)if(!Number.isFinite(x))throw Error('Échantillon acoustique non fini.');
 const count=Math.ceil(duration*FPS),energies=new Float64Array(count),spectrum=[],hann=Float64Array.from({length:N},(_,i)=>.5-.5*Math.cos(2*Math.PI*i/(N-1))),bins=new Int8Array(N/2+1);bins.fill(-1);
 for(let k=1;k<bins.length;k++){const hz=k*RATE/N;for(let b=0;b<BANDS;b++)if(hz>=LIMITS[b]&&hz<LIMITS[b+1]){bins[k]=b;break;}}
 const re=new Float64Array(N),im=new Float64Array(N),power=new Float64Array(BANDS);
 for(let frame=0;frame<count;frame++){
  const center=Math.round((frame+.5)*RATE/FPS),from=center-(N>>1);power.fill(0);let energy=0;
  for(const ch of channels){let sum=0,mean=0,n=0;for(let i=0;i<N;i++){const at=from+i,x=at>=0&&at<length?ch[at]:0;re[i]=x;mean+=x;n++;}mean/=n;
   for(let i=0;i<N;i++){const x=re[i]-mean;sum+=x*x;re[i]=x*hann[i];im[i]=0;}energy+=sum/N;fft(re,im);
   for(let k=1;k<bins.length;k++)if(bins[k]>=0)power[bins[k]]+=re[k]*re[k]+im[k]*im[k];
  }
  energies[frame]=Math.sqrt(energy/channels.length);
  const total=power.reduce((a,b)=>a+b,0)||1;
  for(let b=0;b<BANDS;b++)spectrum.push(Math.round(255*Math.sqrt(power[b]/total)));
 }
 const sorted=Array.from(energies).sort((a,b)=>a-b),peak=sorted[Math.floor((count-1)*.97)]||0;
 const energy=Array.from(energies,x=>Math.round(Math.min(1,x/Math.max(peak,.0001))*255));
 return validate({version:26,rate:FPS,bands:BANDS,duration,energy,spectrum});
}
function corr(a,b){const n=a.length;if(n<10)return 0;let x=0,y=0,xx=0,yy=0,xy=0;for(let i=0;i<n;i++){x+=a[i];y+=b[i];xx+=a[i]*a[i];yy+=b[i]*b[i];xy+=a[i]*b[i];}const d=Math.sqrt(Math.max(0,n*xx-x*x)*Math.max(0,n*yy-y*y));return d>1e-7?(n*xy-x*y)/d:0;}
function compare(source,target){
 validate(source);validate(target);
 const rejected=reason=>({candidate:false,reason,score:0,offset:0,identityVerified:false});
 if(Math.min(source.duration,target.duration)<8)return rejected('Huit secondes au minimum pour une comparaison.');
 if(Math.abs(source.duration-target.duration)>2.05)return rejected('Durées trop différentes : aucune adaptation de vitesse.');
 if(Math.min(source.energy.filter(x=>x>12).length,target.energy.filter(x=>x>12).length)<FPS*3)return rejected('Signal silencieux ou insuffisant.');
 let best=null;
 for(let shift=-40;shift<=40;shift++){
  const from=Math.max(0,-shift),to=Math.min(source.energy.length,target.energy.length-shift),overlap=(to-from)/Math.min(source.energy.length,target.energy.length);if(overlap<.90)continue;
  const step=Math.max(1,Math.floor((to-from)/1200)),a=[],b=[];let spectral=0,active=0;const chunks=Array.from({length:4},()=>[[],[]]);
  for(let i=from;i<to;i+=step){const j=i+shift,ea=source.energy[i]/255,eb=target.energy[j]/255;a.push(ea);b.push(eb);const k=Math.min(3,Math.floor((i-from)*4/(to-from)));chunks[k][0].push(ea);chunks[k][1].push(eb);
   if(ea>.05&&eb>.05){let dot=0,aa=0,bb=0;for(let f=0;f<BANDS;f++){const x=source.spectrum[i*BANDS+f],y=target.spectrum[j*BANDS+f];dot+=x*y;aa+=x*x;bb+=y*y;}spectral+=dot/Math.sqrt(aa*bb||1);active++;}
  }
  const rhythm=corr(a,b),shape=active?spectral/active:0,score=.65*Math.max(0,rhythm)+.35*shape;
  if(!best||score>best.score)best={candidate:false,score,rhythm,shape,overlap,offset:shift/FPS,segments:chunks.map(x=>corr(...x)),identityVerified:false};
 }
 if(!best)return rejected('Recouvrement insuffisant.');
 best.candidate=best.rhythm>=.92&&best.shape>=.94&&best.segments.filter(x=>x>=.82).length>=3;
 best.reason=best.candidate?'Ressemblance forte ; vérifier la version, les frappes et le décalage avant copie.':'Ressemblance insuffisante pour proposer les partitions.';
 return best;
}
function copyCharts(source,target,ids,offset){
 const C=globalThis.PulseCore;if(!C)throw Error('Moteur de partitions absent.');
 if(!Number.isFinite(offset)||Math.abs(offset)>2)throw Error('Décalage de copie limité à ±2 secondes.');
 if(source.id===target.id||!Array.isArray(ids)||!ids.length||new Set(ids).size!==ids.length||ids.length>50)throw Error('Sélection de partitions invalide.');
 if(target.charts.length+ids.length>50)throw Error('Maximum 50 partitions par morceau.');
 const copies=ids.map(id=>{const original=source.charts.find(c=>c.id===id);if(!original)throw Error('Partition source absente.');const total=(original.offset||0)+offset;if(Math.abs(total)>30)throw Error('Offset de partition hors plage.');const chart=C.validateChart({...structuredClone(original),id:C.uid(),title:original.title+' · copie à vérifier',offset:total,source:'acoustic-copy',provenance:{...original.provenance,method:'local-acoustic-candidate-v26',sourceSongId:source.id,sourceChartId:original.id,sourceSignature:C.chartSignature(original),sourceAudioHash:source.audioHash||null,targetAudioHash:target.audioHash||null,acceptedOffset:offset,identityVerified:false,acceptedAt:new Date().toISOString()}});if(chart.notes.some(n=>n.time+chart.offset<-.001||n.time+chart.offset>target.duration+.001))throw Error('Une note sortirait de l’audio cible ; copie refusée.');return chart;});
 return {...target,charts:[...target.charts,...copies]};
}
function workerSource(){return 'const A=('+factory.toString()+')();onmessage=e=>{try{const d=e.data;postMessage({ok:true,result:d.action==="analyze"?A.analyze(d.channels,d.sampleRate):d.sources.map(s=>({songId:s.songId,...A.compare(s.fingerprint,d.target)})).filter(x=>x.candidate).sort((a,b)=>b.score-a.score)});}catch(x){postMessage({ok:false,error:x.message});}};';}
return {RATE,FPS,BANDS,analyze,compare,validate,copyCharts,workerSource};
});
