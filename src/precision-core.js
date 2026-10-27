/* DIVA PULSE 5 · musical meter, pitch-preserving practice, MIDI input.
 * Pure algorithms. No network, official charts, or vendor game code. */
(function(root) {
'use strict';
const C=root.PulseCore||(typeof require==='function'?require('./core.js'):null);
if(!C.timeToBeat&&typeof require==='function')require('./creator.js');
const EPS=1e-7;
function meterMap(chart) {
  const raw=chart.meterMap??[{beat:0,numerator:4,denominator:4}];
  if(!Array.isArray(raw)||!raw.length||raw.length>512)throw Error('Carte de mesures : 1 à 512 entrées.');
  const out=raw.map(m=>{
    const beat=Number(m.beat),numerator=Number(m.numerator),denominator=Number(m.denominator);
    if(!Number.isFinite(beat)||beat<0||beat>50000||!Number.isInteger(numerator)||numerator<1||numerator>16||![2,4,8,16].includes(denominator))throw Error('Signature invalide : numérateur 1–16, dénominateur 2, 4, 8 ou 16.');
    const defaults=denominator===8&&numerator%3===0?Array(numerator/3).fill(3):denominator===8&&numerator===7?[2,2,3]:Array(numerator).fill(1);
    const groups=m.groups??defaults;
    if(!Array.isArray(groups)||!groups.length||groups.length>16||groups.some(x=>!Number.isInteger(x)||x<1)||groups.reduce((a,b)=>a+b,0)!==numerator)throw Error('Les groupes d’accents doivent totaliser le numérateur.');
    return {beat,numerator,denominator,groups:[...groups]};
  }).sort((a,b)=>a.beat-b.beat);
  if(Math.abs(out[0].beat)>EPS)throw Error('La première signature doit commencer à la pulsation 0.');
  let bar=1;
  return out.map((m,i)=>{
    if(i){const p=out[i-1],bars=(m.beat-p.beat)/(p.numerator*4/p.denominator);
      if(bars<EPS||Math.abs(bars-Math.round(bars))>EPS)throw Error('Un changement de signature doit commencer sur une nouvelle mesure.');
      bar+=Math.round(bars);
    }
    return {...m,bar,span:m.numerator*4/m.denominator};
  });
}
function metricAt(chart,beat) {
  const map=meterMap(chart);let m=map[0];
  for(const next of map){if(next.beat>beat+EPS)break;m=next;}
  const index=Math.floor((beat-m.beat+EPS)/m.span),start=m.beat+index*m.span;
  const pulse=(beat-start)*m.denominator/4;
  let group=0,acc=0,accent=false;
  for(const size of m.groups){if(Math.abs(pulse-acc)<EPS)accent=true;if(pulse+EPS>=acc)group=acc;acc+=size;}
  return {...m,bar:m.bar+index,start,pulse,downbeat:Math.abs(beat-start)<EPS,accent,group};
}
function metricGrid(chart,from,to,division=4) {
  const step=4/division,origin=C.timeToBeat(chart,C.finite(chart.gridOffset));
  if(!Number.isFinite(from)||!Number.isFinite(to)||from>to||![4,8,12,16,24,32,48,64].includes(division))throw Error('Fenêtre ou subdivision de grille invalide.');
  const a=C.timeToBeat(chart,from)-origin,b=C.timeToBeat(chart,to)-origin,first=Math.ceil((a-EPS)/step),last=Math.floor((b+EPS)/step);
  if(last-first>20000)throw Error('La grille demandée est trop dense.');
  const beats=new Set();for(let k=first;k<=last;k++)beats.add(Number((k*step).toFixed(9)));
  // Keep bar lines visible even when their meter does not divide the selected grid.
  let at=a,guard=0;while(at<=b+EPS&&guard++<20000){const m=metricAt(chart,at);const start=m.start;if(start>=a-EPS)beats.add(Number(start.toFixed(9)));at=start+m.span;if(at<=start+EPS)break;}
  return [...beats].sort((a,b)=>a-b).map(beat=>{const m=metricAt(chart,beat);return {time:C.beatToTime(chart,beat+origin),beat,bar:m.downbeat,barNumber:m.bar,quarter:Math.abs(beat-Math.round(beat))<EPS,accent:m.accent,signature:`${m.numerator}/${m.denominator}`};});
}
function metricClicks(chart,from,to) {
  const origin=C.timeToBeat(chart,C.finite(chart.gridOffset)),a=C.timeToBeat(chart,from)-origin,b=C.timeToBeat(chart,to)-origin,out=[];
  let beat=a,guard=0;
  while(beat<=b+EPS&&guard++<20000){const m=metricAt(chart,beat),unit=4/m.denominator;
    let next=m.start+Math.ceil((beat-m.start-EPS)/unit)*unit;
    if(next<beat-EPS)next+=unit;
    if(next>b+EPS)break;
    const n=metricAt(chart,next);out.push({time:C.beatToTime(chart,next+origin),beat:next,strong:n.downbeat,accent:n.accent});beat=next+EPS*4;
  }
  return out;
}
function autoMetricPV(chart,duration,stage='arena',barsPerShot=4) {
  const origin=C.timeToBeat(chart,C.finite(chart.gridOffset)),cameras=['wide','front','close','orbit','high','front'],dances=['idol','step','wave','reach','clap'],events=[];
  let beat=0,bar=0;for(let guard=0;guard<50000;guard++){
    const time=C.beatToTime(chart,beat+origin)+chart.offset;if(time>=duration)break;
    if(time>=0&&bar%barsPerShot===0){const i=events.length;events.push({id:C.uid(),time,camera:cameras[i%cameras.length],dance:dances[i%dances.length],stage});if(events.length>=2000)break;}
    beat=metricAt(chart,beat).start+metricAt(chart,beat).span;bar++;
  }
  return events;
}
/* Offline WSOLA: overlapping windows are aligned by waveform similarity.
 * All channels share the same alignment: stereo phase is not collapsed to mono.
 * This is a practice aid, not studio-grade time stretching or stem separation. */
function stretchPCM(channels,sampleRate,rate,progress=()=>{}) {
  if(!Array.isArray(channels)||!channels.length||channels.length>2||channels.some(c=>!(c instanceof Float32Array)))throw Error('Audio mono ou stéréo PCM requis.');
  const length=channels[0].length;
  if(!length||channels.some(c=>c.length!==length)||!Number.isFinite(sampleRate)||sampleRate<8000||sampleRate>192000||!Number.isFinite(rate)||rate<.25||rate>1.5)throw Error('Audio ou vitesse de traitement invalide.');
  const size=Math.max(1,Math.round(length/rate));
  if(size*channels.length>24000000)throw Error('Passage trop long pour la hauteur conservée. Choisir une section plus courte.');
  if(channels.some(c=>c.some(v=>!Number.isFinite(v))))throw Error('Les échantillons audio doivent être finis.');
  if(rate===1)return channels.map(c=>new Float32Array(c));
  const window=Math.min(length,Math.max(64,Math.round(sampleRate*.04))),hop=Math.max(1,Math.floor(window/4)),overlap=window-hop,search=Math.round(sampleRate*.009),stride=8;
  const win=new Float32Array(window);for(let i=0;i<window;i++)win[i]=.5-.5*Math.cos(2*Math.PI*(i+.5)/window);
  const output=channels.map(()=>new Float32Array(size+window)),weights=new Float32Array(size+window);
  let previous=0,frames=0;
  const correlation=(candidate,reference)=>{
    let dot=0,aa=0,bb=0;
    for(let i=0;i<overlap;i+=stride)for(let ch=0;ch<channels.length;ch++){
      const a=channels[ch][reference+i]||0,b=channels[ch][candidate+i]||0;dot+=a*b;aa+=a*a;bb+=b*b;
    }
    return aa>1e-10&&bb>1e-10?dot/Math.sqrt(aa*bb):0;
  };
  for(let pos=0;pos<size;pos+=hop){
    const target=Math.min(length-window,Math.max(0,Math.round(pos*rate)));
    let best=target;
    if(pos>0&&target>0){const lo=Math.max(0,target-search),hi=Math.min(length-window,target+search);let score=-Infinity;
      for(let c=lo;c<=hi;c+=8){const s=correlation(c,previous+hop)-Math.abs(c-target)/Math.max(1,search)*.0005;if(s>score){score=s;best=c;}}
      const coarse=best;for(let c=Math.max(lo,coarse-7);c<=Math.min(hi,coarse+7);c++){const s=correlation(c,previous+hop)-Math.abs(c-target)/Math.max(1,search)*.0005;if(s>score){score=s;best=c;}}
    }
    previous=best;
    for(let i=0;i<window&&pos+i<size;i++){const weight=win[i];weights[pos+i]+=weight;for(let ch=0;ch<channels.length;ch++)output[ch][pos+i]+=(channels[ch][best+i]||0)*weight;}
    if(frames++%80===0)progress(Math.min(1,pos/size));
  }
  const result=output.map(ch=>{const out=new Float32Array(size);for(let i=0;i<size;i++)out[i]=weights[i]>1e-8?Math.max(-1,Math.min(1,ch[i]/weights[i])):0;return out;});progress(1);return result;
}
function midiMapping(raw) {
  if(!Array.isArray(raw)||raw.length!==6||raw.some(n=>!Number.isInteger(n)||n<0||n>127)||new Set(raw).size!==6)throw Error('Choisir six notes MIDI distinctes entre 0 et 127.');return [...raw];
}
class MidiInputRouter {
  constructor({mapping=[60,62,64,65,67,69],channel=0,onPress=()=>{},onRelease=()=>{}}={}) {this.mapping=midiMapping(mapping);if(!Number.isInteger(channel)||channel<0||channel>16)throw Error('Canal MIDI : tous, ou de 1 à 16.');this.channel=channel;this.onPress=onPress;this.onRelease=onRelease;this.active=new Map();}
  receive(port,data,stamp,accept=true) {
    if(!data||data.length<3||![data[0],data[1],data[2]].every(Number.isInteger)||data[0]<128||data[0]>239||data[1]<0||data[1]>127||data[2]<0||data[2]>127)return null;
    const type=data[0]&240,channel=(data[0]&15)+1,key=`midi:${port}:${channel}:${data[1]}`;
    if(type===176&&(data[1]===120||data[1]===123)){this.clear(port,stamp,channel);return {kind:'reset',channel};}
    const down=type===144&&data[2]>0,up=type===128||(type===144&&!data[2]);if(!down&&!up)return null;
    if(up){const held=this.active.get(key);if(held){this.active.delete(key);this.onRelease(key,stamp);}return {kind:'off',note:data[1],channel};}
    if((this.channel&&this.channel!==channel)||!accept)return null;
    const lane=this.mapping.indexOf(data[1]);if(lane<0||this.active.has(key))return {kind:'note',note:data[1],channel};
    this.active.set(key,{port,channel,lane});this.onPress(key,lane,stamp);return {kind:'on',note:data[1],channel,lane};
  }
  clear(port=null,stamp,channel=null) {for(const [key,v] of [...this.active])if((port===null||v.port===port)&&(channel===null||channel===v.channel)){this.active.delete(key);this.onRelease(key,stamp);}}
  configure(mapping,channel=0) {const valid=midiMapping(mapping);if(!Number.isInteger(channel)||channel<0||channel>16)throw Error('Canal MIDI : tous, ou de 1 à 16.');this.clear();this.mapping=valid;this.channel=channel;}
}
function storageAudit(songs,assets,scores=[]) {
  const ids=new Set(assets.map(a=>a.id)),used=new Set(),issues=[],seen=new Set();
  for(const s of songs){if(seen.has(s.id))issues.push({kind:'duplicate-song',song:s.id});seen.add(s.id);
    for(const [role,id] of [['audio',s.audioAsset],['video',s.videoAsset],['model',s.scene?.modelAsset]])if(id){used.add(id);if(!ids.has(id))issues.push({kind:'missing-asset',song:s.id,role,id});}
    const charts=new Set();for(const c of s.charts||[]){if(charts.has(c.id))issues.push({kind:'duplicate-chart',song:s.id,chart:c.id});charts.add(c.id);try{C.validateChart(c);}catch(e){issues.push({kind:'invalid-chart',song:s.id,chart:c.id,error:e.message});}}
  }
  for(const a of assets)if(!(a.blob instanceof Blob))issues.push({kind:'invalid-asset',id:a.id});
  return {version:1,songs:songs.length,assets:assets.length,scores:scores.length,bytes:assets.reduce((s,a)=>s+(a.blob?.size||0),0),unused:assets.filter(a=>!used.has(a.id)).map(a=>a.id),issues};
}
const previousValidate=C.validateChart;
C.validateChart=function(raw,options){const chart=previousValidate(raw,options);if(raw.meterMap!==undefined)chart.meterMap=meterMap(chart).map(({bar,span,...m})=>m);return chart;};
Object.assign(C,{meterMap,metricAt,metricGrid,metricClicks,autoMetricPV,stretchPCM,midiMapping,MidiInputRouter,storageAudit});
// A normal MIDI can carry usable signatures even without DIVA PULSE metadata.
const previousMIDI=C.midiToChart;
C.midiToChart=function(midi,options={}) {
  const result=previousMIDI(midi,options);
  if((options.native&&midi.nativeChart)||!midi.timeSignatures?.length)return result;
  try {
    const map=[];for(const sig of [...midi.timeSignatures].sort((a,b)=>a.time-b.time)) {
      const entry={beat:C.timeToBeat(result.chart,sig.time),numerator:sig.numerator,denominator:sig.denominator};
      if(map.length&&Math.abs(map.at(-1).beat-entry.beat)<EPS)map[map.length-1]=entry;else map.push(entry);
    }
    if(map[0].beat>EPS)map.unshift({beat:0,numerator:4,denominator:4});
    result.chart=C.validateChart({...result.chart,meterMap:map});
  } catch(error) {
    result.warnings.push('Signatures MIDI conservées comme métadonnées, mais grille 4/4 : '+error.message);
  }
  return result;
};
const previousGrid=C.beatGrid;
C.beatGrid=(chart,...args)=>chart.meterMap?metricGrid(chart,...args):previousGrid(chart,...args);
if(typeof module!=='undefined'&&module.exports)module.exports=C;
})(globalThis);
