/* DIVA PULSE 4. Pure, testable logic. No network or assets. */
(function(root){
'use strict';
const C=root.PulseCore||(typeof require==='function'?require('./core.js'):null);
if(!C.timeToBeat&&typeof require==='function')require('./creator.js');
const clone=v=>structuredClone(v);
function lowerBound(notes,time){let lo=0,hi=notes.length;while(lo<hi){const m=(lo+hi)>>>1;if(notes[m].time<time)lo=m+1;else hi=m;}return lo;}
// The import validator caps approach at 15 s. This conservative range never drops
// a valid custom trajectory, even after a seek or changing speed.
function visibleNotes(notes,time,offset=0,speed=1,lateWindow=.15){
  if(!Number.isFinite(time))return [];
  // This is a conservative candidate range. The renderer supplies the current
  // judgment profile's late window, then applies each note's exact bounds.
  const tail=Number.isFinite(lateWindow)?Math.max(0,lateWindow):.15;
  const lo=lowerBound(notes,time-offset-tail-.001),hi=lowerBound(notes,time-offset+15/Math.max(.5,speed)+.001);
  return notes.slice(lo,hi);
}
function normalizeTitle(v){return String(v||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();}
function songIdentity(song){return {audioHash:typeof song.audioHash==='string'?song.audioHash:null,demoId:song.builtin?song.demoId:null,title:String(song.title||''),artist:String(song.artist||''),duration:Number(song.duration)||0};}
function matchCatalog(entry,song){
  if(entry.audioHash&&song.audioHash&&entry.audioHash===song.audioHash&&entry.audioHash.startsWith('sha256:'))return {level:'exact',reason:'SHA-256 identique : même fichier audio'};
  if(entry.demoId&&song.builtin&&entry.demoId===song.demoId)return {level:'demo',reason:'Instrumental de démonstration identique'};
  const name=normalizeTitle(entry.title),other=normalizeTitle(song.title);
  if(name&&name===other)return {level:'candidate',reason:Math.abs((entry.duration||0)-(song.duration||0))<1?'Titre et durée proches, audio non vérifié':'Titre identique, version audio à vérifier'};
  return {level:'none',reason:'Aucune correspondance vérifiable'};
}
function cleanCatalogEntry(raw,index=0){
  if(!raw||typeof raw!=='object'||!Array.isArray(raw.charts)||!raw.charts.length||raw.charts.length>50)throw Error('Entrée de catalogue invalide.');
  if(raw.audioHash!=null&&!/^sha256:[a-f0-9]{64}$/.test(raw.audioHash))throw Error('Une identité audio de catalogue doit être un SHA-256 complet.');
  if(raw.demoId!=null&&!C.DEMOS.some(d=>d.id===raw.demoId))throw Error('Instrumental de catalogue inconnu.');
  let sourceUrl=String(raw.sourceUrl||'');if(sourceUrl&&!/^https?:\/\//i.test(sourceUrl))throw Error('Adresse source HTTP(S) attendue.');
  const charts=raw.charts.map(c=>C.validateChart(c,{allowEmpty:false}));
  return {id:String(raw.id||C.uid()).slice(0,180),title:String(raw.title||`Morceau ${index+1}`).slice(0,180),artist:String(raw.artist||'').slice(0,180),author:String(raw.author||'').slice(0,180),edition:String(raw.edition||'Non précisée').slice(0,100),sourceUrl:sourceUrl.slice(0,2048),duration:Math.max(0,Math.min(7200,Number(raw.duration)||0)),audioHash:raw.audioHash||null,demoId:raw.demoId||null,charts};
}
function validateCatalog(raw){
  if(raw?.format!=='DIVA-PULSE-CHART-CATALOG'||raw.version!==1||!Array.isArray(raw.entries)||raw.entries.length>250)throw Error('Catalogue .pulsecharts version 1 attendu (250 morceaux maximum).');
  const entries=raw.entries.map(cleanCatalogEntry);let total=0;for(const e of entries)for(const c of e.charts)total+=c.notes.length;
  if(total>250000)throw Error('Catalogue limité à 250 000 notes au total.');
  return {format:'DIVA-PULSE-CHART-CATALOG',version:1,title:String(raw.title||'Catalogue local').slice(0,180),entries};
}
function catalogPayload(entry){return JSON.stringify([entry.audioHash,entry.demoId,normalizeTitle(entry.title),entry.edition,entry.charts.map(c=>[c.difficulty,c.offset,c.gridOffset,c.tempoMap,c.notes])]);}
function mergeCatalog(oldEntries,incoming){
  const out=clone(oldEntries),seen=new Set(out.map(catalogPayload));let added=0,duplicates=0;
  for(const raw of incoming){const e=cleanCatalogEntry(raw),key=catalogPayload(e);if(seen.has(key)){duplicates++;continue;}seen.add(key);out.push({...e,id:C.uid()});added++;}
  if(out.length>250)throw Error('Le catalogue local est limité à 250 morceaux.');
  validateCatalog({format:'DIVA-PULSE-CHART-CATALOG',version:1,entries:out});return {entries:out,added,duplicates};
}
function attachCatalog(song,entry,{allowUnverified=false,difficulties=null}={}){
  const clean=cleanCatalogEntry(entry),match=matchCatalog(clean,song);
  if(!['exact','demo'].includes(match.level)&&!allowUnverified)throw Error('Identité audio non vérifiée. Une confirmation explicite est nécessaire.');
  const selected=clean.charts.filter(c=>!difficulties||difficulties.includes(c.difficulty));let duplicates=0;
  const out=clone(song),sigs=new Set(out.charts.map(c=>`${c.difficulty}:${JSON.stringify([c.offset,c.notes,c.tempoMap,c.gridOffset,c.sections])}`));
  for(const c of selected){const key=`${c.difficulty}:${JSON.stringify([c.offset,c.notes,c.tempoMap,c.gridOffset,c.sections])}`;if(sigs.has(key)){duplicates++;continue;}sigs.add(key);
    out.charts.push({...clone(c),id:C.uid(),source:'catalogue',parent:{id:c.id,source:c.source},provenance:{...c.provenance,catalogId:clean.id,catalogTitle:clean.title,catalogEdition:clean.edition,author:clean.author,identity:match.level,importSignature:C.chartSignature(c)}});
  }
  if(out.charts.length>50)throw Error('Maximum 50 partitions par morceau. Aucune partition ajoutée.');
  return {song:out,added:out.charts.length-song.charts.length,duplicates,match};
}
function validateSections(raw,duration=7200){
  if(!Array.isArray(raw)||raw.length>200)throw Error('Maximum 200 sections.');
  const out=raw.map((s,i)=>{const from=Number(s.from),to=Number(s.to);if(!Number.isFinite(from)||!Number.isFinite(to)||from<0||to<=from||to>duration+.001)throw Error('Section invalide : choisir début < fin dans la durée du morceau.');return {id:String(s.id||C.uid()),label:String(s.label||`Section ${i+1}`).slice(0,80),from,to};}).sort((a,b)=>a.from-b.from||a.to-b.to);
  if(new Set(out.map(s=>s.id)).size!==out.length)throw Error('Deux sections utilisent le même identifiant.');return out;
}
function safePractice(raw,duration){
  const from=Number(raw.from),to=Number(raw.to),rate=Number(raw.rate??1),target=Number(raw.target??95),step=Number(raw.step??.05);
  if(!Number.isFinite(from)||!Number.isFinite(to)||from<0||to>duration+.001||to-from<.5)throw Error('Choisir un passage valide d’au moins 0,5 seconde.');
  if(!Number.isFinite(rate)||rate<.25||rate>1.5||!Number.isFinite(target)||target<50||target>100||!Number.isFinite(step)||step<.01||step>.25)throw Error('Paramètres d’entraînement invalides.');
  return {...raw,from,to,rate,target,step,loop:!!raw.loop,adaptive:!!raw.adaptive};
}
function nextPracticeRate(rate,result,{adaptive=false,target=95,step=.05}={}){
  if(!adaptive)return rate;if(!result.total||result.failed)return rate;
  return result.accuracy>=target&&result.counts.MISS===0&&result.counts.WRONG===0?Math.min(1,Math.round((rate+step)*100)/100):rate;
}
function chartDensity(chart,duration,bins=48){
  const out=Array(Math.max(1,Math.min(240,bins))).fill(0),seconds=Math.max(.001,duration);
  for(const n of chart.notes){const t=n.time+chart.offset;if(t>=0&&t<seconds)out[Math.min(out.length-1,Math.floor(t/seconds*out.length))]++;}
  return out;
}
function energyAt(analysis,time){const a=analysis.energy||[];if(!a.length)return 1;let lo=0,hi=a.length;while(lo<hi){let m=(lo+hi)>>>1;if(a[m].time<time)lo=m+1;else hi=m;}return Math.max(0,Number(a[Math.min(a.length-1,lo)]?.value)||0);}
function generationPhase(onsets,bpm){const beat=60/bpm;let phase=0,best=-1;for(let i=0;i<96;i++){let p=i/96*beat,score=0;for(const o of onsets){const r=((o.time-p)%beat+beat)%beat,d=Math.min(r,beat-r);score+=Math.max(.001,o.strength)*Math.exp(-d*d/.0016);}if(score>best){best=score;phase=p;}}return phase;}
function generateMusicalChart(analysis,difficulty='NORMAL',opts={}){
  if(!analysis||analysis.silent||!Array.isArray(analysis.onsets)||!analysis.onsets.length)throw Error('Audio silencieux ou attaques absentes. Utiliser le studio manuel.');
  const level=C.DIFFICULTIES.indexOf(difficulty);if(level<0)throw Error('Difficulté inconnue.');
  const bpm=Number(opts.bpm??analysis.bpm),density=Number(opts.density??1),seed=Number(opts.seed??1),style=opts.style||'ribbon';
  if(!Number.isFinite(bpm)||bpm<20||bpm>400||!Number.isFinite(density)||density<.5||density>1.5||!Number.isFinite(seed)||!['ribbon','arc','orbit'].includes(style))throw Error('Réglages de génération invalides.');
  const duration=Number(analysis.duration);if(!Number.isFinite(duration)||duration<=0||duration>7200)throw Error('Durée d’analyse invalide.');
  const gap=[.43,.27,.19,.125,.09][level]/density,phase=opts.bpm?generationPhase(analysis.onsets,bpm):Number(analysis.phase)||0,beat=60/bpm;
  let onsets=analysis.onsets.filter(o=>Number.isFinite(o.time)&&Number.isFinite(o.strength)&&o.time>=.2&&o.time<duration-.18&&o.strength>=[.15,.09,.05,.02,0][level]/density).map(o=>({...o})).sort((a,b)=>a.time-b.time);
  if(!onsets.length)onsets=analysis.onsets.filter(o=>Number.isFinite(o.time)&&o.time>=.2&&o.time<duration-.18).map(o=>({...o})).sort((a,b)=>a.time-b.time);
  const kept=[];for(const o of onsets){let time=o.time;if(opts.quantize){const snapped=C.snapTime(time,bpm,level<2?8:16,phase);if(Math.abs(time-snapped)<=.035)time=snapped;}const n={...o,time,rawTime:o.time};if(!kept.length||time-kept.at(-1).time>=gap)kept.push(n);else if(o.strength>kept.at(-1).strength)kept[kept.length-1]=n;}
  // A phrase signature is determined by its rhythm, not by its position. Repeated
  // rhythms reuse the same lane motif; no voice recognition is being claimed.
  const groups=new Map();for(const o of kept){let p=Math.floor((o.time-phase)/(beat*16));if(!groups.has(p))groups.set(p,[]);groups.get(p).push(o);}
  const notes=[],sections=[],onsetIndex=new Map(kept.map((o,i)=>[o,i]));let motifs=new Set();
  for(const [phrase,events] of groups){const start=phase+phrase*16*beat;
    const signature=events.map(o=>Math.round((o.time-start)/beat*4)).join('.');motifs.add(signature);
    const random=C.rng((C.hashText(signature)^seed)>>>0),pattern=[0,1,2,3,2,1,0,2,1,3,0,2,3,1,2,0],shift=Math.floor(random()*4);
    for(let i=0;i<events.length;i++){const o=events[i],pos=i%8;let lane=(pattern[i%pattern.length]+shift)%4,type='tap';
      if(level>=2&&opts.slides!==false&&i%12===10){lane=4+(shift%2);type='slide';}
      let x=.18+pos*.088,y=.38+Math.sin(pos*Math.PI/4)*.15;
      if(style==='arc'){x=.19+pos*.087;y=.5-Math.sin(pos/7*Math.PI)*.25;}
      if(style==='orbit'){x=.5+Math.cos(pos/8*Math.PI*2)*.29;y=.44+Math.sin(pos/8*Math.PI*2)*.22;}
      let hold=0;if(level>0&&opts.holds!==false&&lane<4&&i%4===0){const next=kept[onsetIndex.get(o)+1]?.time||duration;let available=Math.min(3,next-o.time-.1);if(available>=.65){let audible=0;for(let t=o.time+.15;t<o.time+available;t+=.12){if(energyAt(analysis,t)<.075)break;audible=t-o.time;}if(audible>=.5){type='hold';hold=audible;}}}
      const approach=[2.1,1.9,1.65,1.4,1.2][level],angle=(pos%2?-38:38)+Math.round(Math.sin(pos)*30),distance=.6;
      notes.push({id:`musical-${notes.length}`,time:o.time,lane,type,duration:hold,x,y,approach,angle,distance});
      if(level>=2&&opts.chords!==false&&lane<4&&o.strength>.38&&i%[16,14,12,8,6][level]===0){const partner=(lane+2)%4;notes.push({id:`musical-${notes.length}`,time:o.time,lane:partner,type:'tap',duration:0,x:C.clamp(x+(x>.65?-.15:.15),.12,.88),y:C.clamp(y+.14,.15,.78),approach,angle,distance});}
    }
    const from=Math.max(0,start),to=Math.min(duration,start+16*beat);if(to>from&&sections.length<200)sections.push({id:`phrase-${phrase}`,label:`Phrase ${sections.length+1}`,from,to});
  }
  if(!notes.length)throw Error('Pas assez d’attaques utilisables pour ce réglage.');
  // Remove accidental same-lane coincidence caused by quantization. No retiming.
  notes.sort((a,b)=>a.time-b.time||a.lane-b.lane);const unique=notes.filter((n,i)=>!i||n.time!==notes[i-1].time||n.lane!==notes[i-1].lane);
  return C.validateChart({title:opts.title||'Partition générée',difficulty,bpm,gridOffset:phase,notes:unique,source:'generated',sections,generator:{version:4,seed,density,style,quantize:!!opts.quantize,detectedBpm:analysis.bpm,usedBpm:bpm,confidence:analysis.confidence||0,motifs:motifs.size,attacks:analysis.onsets.length,selectedAttacks:kept.length,warning:'Proposition rythmique basée sur les attaques. Pas une transcription vocale ni un niveau officiel.'}});
}
function validateChordBindings(raw){
  if(!Array.isArray(raw)||raw.length>8)throw Error('Huit raccourcis d’accords maximum.');
  const keys=new Set();return raw.map(x=>{if(!/^Key[A-Z]$|^Digit[0-9]$|^Numpad[0-9]$/.test(x.code)||keys.has(x.code))throw Error('Touche de raccourci invalide ou dupliquée.');keys.add(x.code);if(!Array.isArray(x.lanes)||x.lanes.length<2||x.lanes.length>4||new Set(x.lanes).size!==x.lanes.length||x.lanes.some(l=>!Number.isInteger(l)||l<0||l>3))throw Error('Un accord exige 2 à 4 symboles distincts.');return {code:x.code,lanes:[...x.lanes].sort()};});
}
Object.assign(C,{lowerBound,visibleNotes,normalizeTitle,songIdentity,matchCatalog,cleanCatalogEntry,validateCatalog,mergeCatalog,attachCatalog,validateSections,safePractice,nextPracticeRate,chartDensity,generationPhase,generateMusicalChart,validateChordBindings});
if(typeof module!=='undefined')module.exports=C;
})(globalThis);
