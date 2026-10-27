/* DIVA PULSE 3 · creation tools. Pure functions, also tested under Node. */
(function (root) {
'use strict';
const C=root.PulseCore || (typeof require==='function' ? require('./core.js') : null);
const EPS=1e-7;
function tempoMap(chart) {
  const bpm=Number(chart.bpm || 120), raw=chart.tempoMap?.length ? chart.tempoMap : [{time:0,bpm}];
  if(raw.length>4096) throw Error('Maximum 4 096 changements de tempo.');
  const map=raw.map(m=>({time:Number(m.time),bpm:Number(m.bpm)})).sort((a,b)=>a.time-b.time);
  if(map.some(m=>!Number.isFinite(m.time)||m.time<0||m.time>7200||!Number.isFinite(m.bpm)||m.bpm<20||m.bpm>400)) throw Error('Temps ou BPM de la carte de tempo invalide.');
  if(map[0].time>EPS)map.unshift({time:0,bpm});
  else map[0].time=0;
  for(let i=1;i<map.length;i++)if(Math.abs(map[i].time-map[i-1].time)<EPS) throw Error('Deux tempos occupent le même instant.');
  let beat=0;
  return map.map((m,i)=>{if(i)beat+=(m.time-map[i-1].time)*map[i-1].bpm/60;return {...m,beat};});
}
function timeToBeat(chart,time) {
  const map=tempoMap(chart);let m=map[0];
  for(const p of map){if(p.time>time)break;m=p;}
  return m.beat+(time-m.time)*m.bpm/60;
}
function beatToTime(chart,beat) {
  const map=tempoMap(chart);let m=map[0];
  for(const p of map){if(p.beat>beat+EPS)break;m=p;}
  return m.time+(beat-m.beat)*60/m.bpm;
}
function snapChartTime(chart,time,division=8) {
  if(!division)return Math.max(0,time);
  const step=4/division, phase=C.finite(chart.gridOffset,0);
  const origin=timeToBeat(chart,phase),beat=timeToBeat(chart,time)-origin;
  return Math.max(0,beatToTime(chart,Math.round(beat/step)*step+origin));
}
function beatGrid(chart,from,to,division=4) {
  const step=4/division, origin=timeToBeat(chart,C.finite(chart.gridOffset,0));
  const first=Math.ceil((timeToBeat(chart,from)-origin-EPS)/step),last=Math.floor((timeToBeat(chart,to)-origin+EPS)/step);
  if(last-first>20000)throw Error('La grille demandée est trop dense.');
  const out=[];for(let k=first;k<=last;k++){const beat=k*step;out.push({time:beatToTime(chart,beat+origin),beat,bar:Math.abs(beat/4-Math.round(beat/4))<EPS,quarter:Math.abs(beat-Math.round(beat))<EPS});}return out;
}
function editSelection(chart,ids,op,opts={}) {
  const next=structuredClone(chart), set=new Set(ids), selected=next.notes.filter(n=>set.has(n.id));
  if(!selected.length)throw Error('Sélectionne au moins une note.');
  if(op==='delete')next.notes=next.notes.filter(n=>!set.has(n.id));
  else for(const n of selected){
    if(op==='quantize')n.time=snapChartTime(chart,n.time,opts.grid||8);
    else if(op==='mirror'){n.x=1-n.x;if(n.angle!==undefined)n.angle=-n.angle;}
    else if(op==='shift'){n.time+=Number(opts.seconds||0);}
    else if(op==='lanes'){n.lane=[3,2,1,0,5,4][n.lane];}
    else if(op==='layout'){
      const i=selected.indexOf(n),u=selected.length===1?.5:i/(selected.length-1);
      if(opts.pattern==='arc'){n.x=.15+u*.7;n.y=.62-Math.sin(Math.PI*u)*.35;}
      else if(opts.pattern==='zigzag'){n.x=.17+u*.66;n.y=i%2?.65:.3;}
      else if(opts.pattern==='circle'){n.x=.5+Math.cos(u*Math.PI*1.8)*.27;n.y=.47+Math.sin(u*Math.PI*1.8)*.25;}
      else {n.x=.15+u*.7;n.y=.45;}
    }
    else throw Error('Transformation inconnue.');
  }
  return C.validateChart(next);
}
function pasteNotes(chart,notes,at) {
  if(!notes.length)throw Error('Le presse-papiers est vide.');
  const first=Math.min(...notes.map(n=>n.time)),ids=[],next=structuredClone(chart);
  for(const n of notes){const id=C.uid();ids.push(id);next.notes.push({...structuredClone(n),id,time:n.time-first+at});}
  return {chart:C.validateChart(next),ids};
}
function auditChart(chart,duration=Infinity) {
  const c=C.validateChart(chart), notes=c.notes, issues=[],counts={error:0,warning:0,info:0};
  const add=(severity,code,n,message)=>{counts[severity]++;if(issues.length<500)issues.push({severity,code,noteId:n?.id||null,time:n?.time||0,message});};
  if(!notes.length)add('warning','EMPTY',null,'Cette partition ne contient aucune note.');
  const lastLane=new Map(),active=new Map();
  let group=[],groupT=-Infinity;
  function groupCheck(){if(group.length>4)add('warning','CHORD_SIZE',group[0],`Accord de ${group.length} touches : contrôler la faisabilité avec la manette.`);
    for(let i=0;i<group.length;i++)for(let j=i+1;j<group.length;j++)if(Math.hypot(group[i].x-group[j].x,(group[i].y-group[j].y)*.5625)<.048)add('warning','TARGET_OVERLAP',group[j],'Deux cibles simultanées sont trop proches.');}
  for(const n of notes){
    const actual=n.time+c.offset;
    if(actual<0)add('error','BEFORE_AUDIO',n,'La note est placée avant le début audio.');
    if(actual>duration+.01)add('error','AFTER_AUDIO',n,'La note est placée après la fin audio.');
    if(n.x<.04||n.x>.96||n.y<.08||n.y>.9)add('warning','OFFSCREEN',n,'La cible est hors de la zone de sécurité.');
    if(n.lane>3&&['tap','hold'].includes(n.type)||n.lane<4&&['slide','chain'].includes(n.type))add('warning','LANE_TYPE',n,'Le type de note et la touche choisie sont inhabituels.');
    const prev=lastLane.get(n.lane);
    if(prev&&n.time-prev.time<.085)add('warning','REPEAT_FAST',n,`Même touche répétée après ${Math.round((n.time-prev.time)*1000)} ms.`);
    const hold=active.get(n.lane);
    if(hold&&n.time<hold.time+Math.min(hold.duration,5)-.03)add('info','HOLD_CUT',n,'Cette touche coupe un HOLD précédent : vérifier le choix de mapping.');
    if(['hold','chain'].includes(n.type)){active.set(n.lane,n);if(n.duration<=0)add('warning','EMPTY_SUSTAIN',n,'Note maintenue sans durée explicite.');if(n.time+c.offset+n.duration>duration+.1)add('info','TAIL_AFTER_AUDIO',n,'Le maintien dépasse la fin de la musique.');}
    if(n.approach<.35)add('warning','APPROACH_FAST',n,'Temps d’approche inférieur à 350 ms.');
    if(Math.abs(n.time-groupT)>EPS){groupCheck();group=[];groupT=n.time;}group.push(n);lastLane.set(n.lane,n);
  }groupCheck();
  const stats=C.chartStats(c),limit=[5,8,12,18,24][Math.max(0,C.DIFFICULTIES.indexOf(c.difficulty))];
  if(stats.peakNps>limit)add('warning','DENSITY',notes[0],`Pic de ${stats.peakNps} notes/s, élevé pour ${c.difficulty}.`);
  const segments=[];
  for(let t=0;t<Math.min(Number.isFinite(duration)?duration:stats.duration+1,7200);t+=8){const ns=notes.filter(n=>n.time+c.offset>=t&&n.time+c.offset<t+8);segments.push({from:t,to:Math.min(t+8,duration),notes:ns.length,nps:ns.length/8});}
  return {counts,issues,truncated:Object.values(counts).reduce((a,b)=>a+b,0)>issues.length,stats,segments,ok:counts.error===0};
}
function timingStats(errors=[]) {
  const a=errors.filter(Number.isFinite).sort((a,b)=>a-b),n=a.length,mean=n?a.reduce((s,x)=>s+x,0)/n:0;
  const median=n?(a[Math.floor((n-1)/2)]+a[Math.ceil((n-1)/2)])/2:0;
  const deviation=n?Math.sqrt(a.reduce((s,x)=>s+(x-mean)**2,0)/n):0;
  const bins=Array.from({length:29},(_,i)=>({ms:(i-14)*10,count:0}));
  a.forEach(x=>bins[C.clamp(Math.round(x/10)+14,0,28)].count++);
  return {n,mean,median,deviation,early:a.filter(x=>x< -5).length,late:a.filter(x=>x>5).length,center:a.filter(x=>Math.abs(x)<=5).length,bins,suggestion:n>=12&&deviation<45?Math.round(median):null};
}
function practiceSegments(chart,log=[],duration=0) {
  const times=new Map();for(const e of log)if(e.noteId)times.set(e.noteId,e);
  const parts=[];
  for(let from=0;from<duration;from+=8){let notes=chart.notes.filter(n=>n.time+chart.offset>=from&&n.time+chart.offset<from+8);if(!notes.length)continue;
    let errors=0,bad=0;for(const n of notes){const e=times.get(n.id);if(!e||!['COOL','FINE'].includes(e.rating))bad++;errors+=Math.abs(e?.error||0);}
    parts.push({from:Math.max(0,from-1),to:Math.min(duration,from+9),bad,notes:notes.length,weight:bad*100+errors/Math.max(1,notes.length)});
  }return parts.sort((a,b)=>b.weight-a.weight).slice(0,5);
}
function validateReplay(raw) {
  if(raw?.format!=='DIVA-PULSE-REPLAY'||!Array.isArray(raw.inputs)||raw.inputs.length>200000)throw Error('Replay DIVA PULSE invalide.');
  const chart=C.validateChart(raw.chart,{allowEmpty:false});
  const inputs=raw.inputs.map(e=>({time:Number(e.time),lane:Number(e.lane),down:!!e.down}));
  if(inputs.some(e=>!Number.isFinite(e.time)||e.time< -40||e.time>7500||!Number.isInteger(e.lane)||e.lane<0||e.lane>5))throw Error('Entrée de replay invalide.');
  for(let i=1;i<inputs.length;i++)if(inputs[i].time<inputs[i-1].time-EPS)throw Error('Les entrées du replay ne sont pas ordonnées.');
  return {...raw,chart,inputs,judgmentProfile:C.judgmentProfile(raw.judgmentProfile),version:1};
}
function simulateReplay(raw){const r=validateReplay(raw),e=new C.JudgeEngine(r.chart,{noFail:!!r.noFail,judgmentProfile:r.judgmentProfile,legacyChains:String(r.engine||'').startsWith('3.')});for(const x of r.inputs){e.update(x.time);if(x.down)e.press(x.lane,x.time);else e.release(x.lane,x.time);}e.update(r.endTime||Math.max(...r.chart.notes.map(n=>n.time+n.duration))+r.chart.offset+1);return e.finish();}

// Standard MIDI File reader: format 0/1, PPQN or SMPTE; channel messages,
// running status, tempo/name/lyrics/signature metadata, bounded SysEx skipping.
function parseMIDI(buffer) {
  const bytes=buffer instanceof Uint8Array?buffer:new Uint8Array(buffer);
  if(bytes.length>16*1024*1024)throw Error('MIDI limité à 16 Mo.');
  const dv=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),dec=new TextDecoder();let p=0;
  function need(n,end=bytes.length){if(p+n>end)throw Error(`MIDI tronqué à l’octet ${p}.`);}
  function u16(){need(2);const v=dv.getUint16(p);p+=2;return v;}
  function u32(){need(4);const v=dv.getUint32(p);p+=4;return v;}
  function text(n){need(n);const s=dec.decode(bytes.subarray(p,p+n));p+=n;return s;}
  function vlq(end){let v=0;for(let i=0;i<4;i++){need(1,end);const b=bytes[p++];v=v*128+(b&127);if(!(b&128))return v;}throw Error('MIDI : entier variable trop long.');}
  if(text(4)!=='MThd')throw Error('En-tête MIDI MThd manquant.');
  const header=u32();if(header<6)throw Error('En-tête MIDI invalide.');need(header);
  const format=u16(),count=u16(),division=u16();p+=header-6;
  if(![0,1].includes(format))throw Error('MIDI type 2 : exporter une séquence au format 0 ou 1.');
  if(!count||count>256||format===0&&count!==1)throw Error('Nombre de pistes MIDI invalide.');
  if(!division)throw Error('Résolution MIDI nulle.');
  const smpte=!!(division&0x8000), fpsCode=256-(division>>8),fps=fpsCode===29?30000/1001:fpsCode,tpf=division&255;
  if(smpte&&(![24,25,29,30].includes(fpsCode)||!tpf))throw Error('Résolution SMPTE invalide.');
  const tracks=[], tempos=[{tick:0,us:500000,order:-1}], signatures=[],lyrics=[],warnings=[];let noteCounter=0,eventCounter=0,nativeChart=null;
  for(let index=0;index<count;index++){
    if(text(4)!=='MTrk')throw Error('Bloc MIDI MTrk attendu.');const len=u32();need(len);const end=p+len,track={index,name:`Piste ${index+1}`,notes:[],channels:[],endTick:0};let tick=0,status=0,done=false;const active=new Map();
    while(p<end){
      if(++eventCounter>500000)throw Error('MIDI : trop d’événements.');tick+=vlq(end);need(1,end);let b=bytes[p++];
      if(b<128){if(!status)throw Error('Running status MIDI sans statut précédent.');p--;b=status;}
      else if(b<240)status=b;
      if(b===255){need(1,end);const type=bytes[p++],n=vlq(end);need(n,end);const data=bytes.subarray(p,p+n);p+=n;
        if(type===0x2f){done=true;break;}
        if(type===0x51){if(n!==3)throw Error('Tempo MIDI invalide.');const us=data[0]*65536+data[1]*256+data[2];if(!us)throw Error('Tempo MIDI nul.');tempos.push({tick,us,order:eventCounter});}
        if(type===3)track.name=dec.decode(data).slice(0,180)||track.name;
        if(type===0x58&&n>=2)signatures.push({tick,numerator:data[0],denominator:2**data[1]});
        if(type===5)lyrics.push({tick,text:dec.decode(data).slice(0,400)});
        if(type===1&&n<8*1024*1024){const t=dec.decode(data);if(t.startsWith('DIVA-PULSE-CHART:'))try{nativeChart=C.validateChart(JSON.parse(t.slice(17)));}catch{warnings.push('Métadonnées natives ignorées : invalides.');}}
        continue;
      }
      if(b===0xf0||b===0xf7){const n=vlq(end);need(n,end);p+=n;status=0;continue;}
      if(b>=0xf0)throw Error(`Message système MIDI non pris en charge : 0x${b.toString(16)}.`);
      const kind=b>>4,channel=b&15;if(kind<8||kind>14)throw Error('Statut MIDI invalide.');
      need(kind===12||kind===13?1:2,end);const a=bytes[p++],v=kind===12||kind===13?0:bytes[p++];if(a>=128||v>=128)throw Error('Donnée MIDI hors plage.');
      const key=channel+':'+a;
      if(kind===9&&v>0){if(++noteCounter>50000)throw Error('MIDI : maximum 50 000 notes.');const note={id:`midi-${index}-${noteCounter}`,tick,pitch:a,velocity:v,channel,track:index};if(!active.has(key))active.set(key,[]);active.get(key).push(note);track.notes.push(note);}
      else if(kind===8||kind===9&&v===0){const note=active.get(key)?.shift();if(note)note.endTick=tick;}
    }
    track.endTick=tick;for(const queue of active.values())for(const n of queue){n.endTick=Math.max(n.tick,tick);warnings.push(`Piste ${index+1} : note ${n.pitch} sans note-off, arrêt en fin de piste.`);}
    if(!done)warnings.push(`Piste ${index+1} : marqueur de fin absent.`);
    track.channels=[...new Set(track.notes.map(n=>n.channel))];tracks.push(track);p=end;
  }
  // At simultaneous tempo events, the last event in file order wins.
  tempos.sort((a,b)=>a.tick-b.tick||a.order-b.order);const tm=[];for(const t of tempos){if(tm.at(-1)?.tick===t.tick)tm[tm.length-1]=t;else tm.push(t);}
  let seconds=0;for(let i=0;i<tm.length;i++){if(i)seconds+=smpte?(tm[i].tick-tm[i-1].tick)/(fps*tpf):(tm[i].tick-tm[i-1].tick)/division*tm[i-1].us/1e6;tm[i].time=seconds;}
  function tickTime(tick){if(smpte)return tick/(fps*tpf);let lo=0,hi=tm.length-1;while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(tm[mid].tick<=tick)lo=mid;else hi=mid-1;}const t=tm[lo];return t.time+(tick-t.tick)/division*t.us/1e6;}
  const all=[];for(const t of tracks)for(const n of t.notes){n.time=tickTime(n.tick);n.duration=Math.max(0,tickTime(n.endTick??n.tick)-n.time);all.push(n);}
  all.sort((a,b)=>a.time-b.time||a.pitch-b.pitch);
  return {format,division,smpte,tracks,notes:all,tempoMap:tm.map(t=>({time:t.time,bpm:60000000/t.us})),timeSignatures:signatures.map(s=>({...s,time:tickTime(s.tick)})),lyrics:lyrics.map(l=>({time:tickTime(l.tick),text:l.text})),duration:tickTime(Math.max(...tracks.map(t=>t.endTick),0)),warnings:warnings.slice(0,100),nativeChart};
}
function midiToChart(midi,opts={}){
  if(opts.native&&midi.nativeChart)return {chart:C.validateChart({...midi.nativeChart,id:C.uid(),source:'midi-native'}),warnings:[],dropped:0};
  const map=midi.tempoMap;if(map.some(m=>m.bpm<20||m.bpm>400))throw Error('Ce MIDI contient un tempo hors de la plage 20–400 BPM du jeu.');
  const selected=midi.notes.filter(n=>(opts.track===undefined||opts.track==='all'||n.track===Number(opts.track))&&(!opts.excludeDrums||n.channel!==9));
  if(!selected.length)throw Error('La sélection MIDI ne contient aucune note.');
  const notes=[],warnings=[...midi.warnings],used=new Map();let dropped=0,reassigned=0;
  for(const n of selected){const k=n.time.toFixed(7);if(!used.has(k))used.set(k,new Set());const lanes=used.get(k);let lane=opts.mapping==='pulse'?n.pitch-60:((n.pitch%4)+4)%4;
    if(opts.mapping==='pulse'&&(lane<0||lane>5)){dropped++;continue;}
    if(lanes.has(lane)){if(opts.mapping==='pulse'){dropped++;continue;}const free=[0,1,2,3].find(l=>!lanes.has(l));if(free===undefined){dropped++;continue;}lane=free;reassigned++;}
    lanes.add(lane);const i=notes.length,hold=opts.holds!==false&&n.duration>=.35;
    notes.push({id:C.uid(),time:n.time,lane,type:lane>3?(hold?'chain':'slide'):(hold?'hold':'tap'),duration:hold?Math.min(n.duration,5):0,x:.18+(i%7)*.105,y:.45+Math.sin(i*.6)*.16,approach:1.7,midi:{pitch:n.pitch,channel:n.channel,track:n.track,velocity:n.velocity}});
  }
  if(dropped)warnings.push(`${dropped} note(s) non représentable(s) dans ce mapping ; elles ne seront pas importées.`);
  if(reassigned)warnings.push(`${reassigned} note(s) d’accord déplacée(s) vers une autre touche libre. Les instants sont conservés.`);
  const chart=C.validateChart({title:opts.title||'Import MIDI',source:'midi',difficulty:opts.difficulty||'NORMAL',bpm:map[0].bpm,tempoMap:map,notes,midiSource:{mapping:opts.mapping||'pitch',dropped,reassigned},timeSignatures:midi.timeSignatures});
  return {chart,warnings,dropped};
}
function exportMIDI(chart){
  const c=C.validateChart(chart),ppqn=9600,enc=new TextEncoder(),out=[];
  const u16=n=>[(n>>8)&255,n&255],u32=n=>[(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255];
  function vlq(n){if(!Number.isInteger(n)||n<0||n>0x0fffffff)throw Error('Durée MIDI hors plage.');const a=[n&127];while(n>>=7)a.unshift((n&127)|128);return a;}
  function meta(type,data){return [255,type,...vlq(data.length),...data];}
  function chunk(tag,a){return [...enc.encode(tag),...u32(a.length),...a];}
  const absMap=tempoMap(c).map(m=>({time:m.time+c.offset,bpm:m.bpm}));let atZero=absMap[0].bpm;for(const m of absMap)if(m.time<=0)atZero=m.bpm;
  const axis={bpm:atZero,tempoMap:[{time:0,bpm:atZero},...absMap.filter(m=>m.time>EPS)]};
  const tick=time=>Math.round(timeToBeat(axis,time)*ppqn);
  function track(events){events.sort((a,b)=>a.tick-b.tick||a.order-b.order);const data=[];let last=0;for(const e of events){data.push(...vlq(e.tick-last));for(const b of e.data)data.push(b);last=e.tick;}data.push(0,255,47,0);return chunk('MTrk',data);}
  const conductor=[{tick:0,order:0,data:meta(3,enc.encode(c.title))},{tick:0,order:1,data:meta(1,enc.encode('DIVA-PULSE-CHART:'+JSON.stringify(c)))}];
  const meters=C.meterMap?C.meterMap(c):[{beat:0,numerator:4,denominator:4}];
  const origin=timeToBeat(c,C.finite(c.gridOffset)),signatures=meters.map(m=>({...m,time:beatToTime(c,m.beat+origin)+c.offset}));
  let initial=signatures[0];for(const m of signatures)if(m.time<=0)initial=m;
  // Standard SMF signatures for other sequencers; native metadata retains custom groups.
  for(const m of [{...initial,time:0},...signatures.filter(m=>m.time>EPS)])conductor.push({tick:tick(m.time),order:2,data:meta(0x58,[m.numerator,Math.log2(m.denominator),24,8])});
  for(const m of axis.tempoMap){const us=Math.round(60000000/m.bpm);conductor.push({tick:tick(m.time),order:3,data:meta(0x51,[(us>>16)&255,(us>>8)&255,us&255])});}
  const noteEvents=[];for(const n of c.notes){const t=n.time+c.offset;if(t<0)throw Error('Le MIDI ne permet pas de note avant le temps zéro. Corriger le décalage avant cet export.');const start=tick(t),end=Math.max(start+1,tick(t+(n.duration||.06)));noteEvents.push({tick:start,order:10,data:[0x90+n.lane,60+n.lane,100]},{tick:end,order:0,data:[0x80+n.lane,60+n.lane,0]});}
  out.push(...chunk('MThd',[...u16(1),...u16(2),...u16(ppqn)]));for(const t of [track(conductor),track(noteEvents)])for(const b of t)out.push(b);
  return new Uint8Array(out);
}
Object.assign(C,{tempoMap,timeToBeat,beatToTime,snapChartTime,beatGrid,editSelection,pasteNotes,auditChart,timingStats,practiceSegments,validateReplay,simulateReplay,parseMIDI,midiToChart,exportMIDI});
if(typeof module!=='undefined')module.exports=C;
})(globalThis);
