/* V26: local acoustic candidates and durable/portable facial recovery. */
(function(root){'use strict';const A=root.PulseAudioMatch,D=root.PulseFaceDrafts,F=root.PulseFace,C=root.PulseCore,S=root.PulseServices,$=id=>document.getElementById(id);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function install(app){
 const wrap=(name,fn)=>{const old=app[name].bind(app);app[name]=(...args)=>fn(old,...args);};
 app.faceRecoveries=new Map();app.facePendingAssets=new Map();app.faceDraftWrite=Promise.resolve();
 app.queueFaceRecovery=function(owner,track,asset,cursor=0){
  const snapshot=D.validate({songId:owner.id,updated:Date.now(),cursor,baseSignature:String(C.hashText(JSON.stringify(owner.scene.faceTrack||null))),track});
  this.faceRecoveries.set(owner.id,snapshot);if(asset)this.facePendingAssets.set(asset.id,asset);
  const status=this.song===owner?$('faceDraftStatus26'):null;if(status)status.textContent='Brouillon conservé en mémoire · enregistrement local…';
  const rows=[['settings',snapshot]];if(asset)rows.unshift(['assets',asset]);
  this.faceDraftWrite=this.faceDraftWrite.catch(()=>{}).then(()=>this.store.atomic(rows)).then(()=>{if(this.song===owner&&this.faceRecoveries.get(owner.id)===snapshot&&$('faceDraftStatus26'))$('faceDraftStatus26').textContent=this.store.persistent?'Brouillon sauvegardé localement, scène inchangée.':'Brouillon TEMPORAIRE · exporter avant de quitter.';}).catch(e=>{if(this.song===owner&&this.faceRecoveries.get(owner.id)===snapshot&&$('faceDraftStatus26'))$('faceDraftStatus26').textContent='Écriture refusée · brouillon en mémoire, inclus dans l’export de secours. '+e.message;});return this.faceDraftWrite;
 };
 app.getFaceRecovery=async function(owner){return this.faceRecoveries.get(owner.id)||(await this.store.get('settings','face-draft:'+owner.id));};
 app.discardFaceRecovery=async function(owner){await this.faceDraftWrite;await this.store.put('settings',{id:'face-draft:'+owner.id,songId:owner.id,discarded:true});const old=this.faceRecoveries.get(owner.id);this.faceRecoveries.delete(owner.id);if(old?.track.sourceAsset)this.facePendingAssets.delete(old.track.sourceAsset);};
 // A successful scene commit and the recovery tombstone are one atomic operation.
 app.saveFaceTrack=async function(owner,track,asset=null){
  if(this.song!==owner)throw Error('Le morceau sélectionné a changé.');await this.faceDraftWrite;
  const plan=F.validate(track),pending=asset||this.facePendingAssets.get(plan.sourceAsset),next={...owner,scene:{...owner.scene,faceTrack:plan}},rows=[['songs',next],['settings',{id:'face-draft:'+owner.id,songId:owner.id,discarded:true}]];
  if(plan.sourceAsset&&!pending&&!(await this.store.get('assets',plan.sourceAsset))?.blob)throw Error('Voix guide du brouillon absente : réimporter la voix ou une piste JSON sans média.');if(this.song!==owner)throw Error('Le morceau sélectionné a changé.');if(pending)rows.unshift(['assets',pending]);await this.store.atomic(rows);Object.assign(owner,next);this.faceRecoveries.delete(owner.id);if(plan.sourceAsset)this.facePendingAssets.delete(plan.sourceAsset);if(this.song===owner)this.stage.faceTrack=owner.scene.faceTrack;return plan;
 };
 app.acousticCandidates=new Map();
 const panel=document.createElement('section');panel.className='settings-card';panel.id='audioMatch26';panel.innerHTML='<div class="eyebrow">26 / RETROUVER SES PARTITIONS</div><h2>LE MÊME ENREGISTREMENT ?</h2><label class="check"><input id="audioMatchImport26" type="checkbox"> Comparer localement les nouvelles musiques aux morceaux déjà indexés</label><p>Empreinte du son décodé : profils spectraux et énergie. Une ressemblance n’est pas une identité vérifiée. Aucun remplacement, recalage ou regroupement silencieux. Rien n’est envoyé sur Internet.</p><div class="buttons"><button id="audioIndex26">Indexer la bibliothèque existante</button><button id="audioFind26">Comparer le morceau sélectionné</button></div><p id="audioIndexStatus26" role="status"></p><p>8 secondes à 10 minutes. Décalages recherchés : ±2 s ; pas de correction de tempo ou de version live/remix. Les ressemblances doivent être vérifiées à l’écoute et confirmées avant toute copie.</p>';$('settings').append(panel);
 $('chartInfo').insertAdjacentHTML('afterend','<button id="audioReview26" class="subtle" hidden>Examiner les partitions ressemblantes</button>');
 $('audioMatchImport26').onchange=()=>app.run(async()=>{const candidate={...app.settings,audioMatchImport:$('audioMatchImport26').checked};try{await app.store.put('settings',candidate);app.settings=candidate;}finally{app.renderSettings();}},'Préférence de comparaison…');
 wrap('renderSettings',old=>{old();$('audioMatchImport26').checked=app.settings.audioMatchImport!==false;});
 wrap('renderLibrary',old=>{old();const matches=app.acousticCandidates.get(app.song?.id)||[];$('audioReview26').hidden=!matches.length;$('audioReview26').textContent=`${matches.length} ressemblance(s) · examiner les anciennes partitions`;});
 const worker=(payload,signal,transfer=[])=>new Promise((resolve,reject)=>{
  if(!root.Worker)return reject(Error('Worker indisponible pour la comparaison.'));let w,done=false;const url=URL.createObjectURL(new Blob([A.workerSource()],{type:'text/javascript'}));
  const finish=(err,value)=>{if(done)return;done=true;clearTimeout(timer);signal?.removeEventListener('abort',cancel);w?.terminate();URL.revokeObjectURL(url);err?reject(err):resolve(value);};
  const cancel=()=>finish(new DOMException('Comparaison annulée.','AbortError')),timer=setTimeout(()=>finish(Error('Analyse acoustique trop longue.')),90000);
  try{if(signal?.aborted)return cancel();w=new Worker(url);signal?.addEventListener('abort',cancel,{once:true});w.onmessage=e=>finish(e.data.ok?null:Error(e.data.error),e.data.result);w.onerror=e=>finish(Error(e.message||'Comparaison interrompue.'));w.postMessage(payload,transfer);}catch(e){finish(e);}
 });
 app.fingerprintAudio=async function(buffer,signal){
  if(buffer.duration<.1||buffer.duration>600)throw Error('Audio hors plage de comparaison.');const Offline=root.OfflineAudioContext||root.webkitOfflineAudioContext;if(!Offline)throw Error('Rééchantillonnage indisponible.');const channels=[];
  for(let i=0;i<Math.min(2,buffer.numberOfChannels);i++){if(signal?.aborted)throw new DOMException('Analyse annulée.','AbortError');const off=new Offline(1,Math.ceil(buffer.duration*A.RATE),A.RATE),input=off.createBuffer(1,buffer.length,buffer.sampleRate);input.copyToChannel(buffer.getChannelData(i),0);const src=off.createBufferSource();src.buffer=input;src.connect(off.destination);src.start();channels.push((await off.startRendering()).getChannelData(0).slice());}
  return worker({action:'analyze',channels,sampleRate:A.RATE},signal,channels.map(c=>c.buffer));
 };
 app.compareIndexedAudio=async function(song,signal){
  if(!song.acoustic26)return [];A.validate(song.acoustic26);
  const sources=[];for(const s of this.songs){if(s.id===song.id||s.audioHash&&s.audioHash===song.audioHash||!s.charts.length||!s.acoustic26||Math.abs(s.duration-song.duration)>2.05)continue;try{A.validate(s.acoustic26);sources.push({songId:s.id,fingerprint:s.acoustic26});}catch{/* An old corrupt descriptor must not block other songs. */}}
  if(sources.length>250)throw Error('Comparaison limitée aux 250 candidats de durée proche.');
  const result=[];for(let i=0;i<sources.length;i+=8){if(signal?.aborted)throw new DOMException('Comparaison annulée.','AbortError');result.push(...await worker({action:'compare',sources:sources.slice(i,i+8),target:song.acoustic26},signal));}result.sort((a,b)=>b.score-a.score);this.acousticCandidates.set(song.id,result);return result;
 };
 wrap('publishMappedSong',async(old,song,buffer,asset,original)=>{
  if(app.settings.audioMatchImport!==false&&!song.acoustic26){try{song.acoustic26=await app.fingerprintAudio(buffer,app.analysisAbort?.signal);}catch(e){if(e.name==='AbortError')throw e;song.acousticWarning=e.message;}}
  const out=await old(song,buffer,asset,original);try{await app.compareIndexedAudio(song,app.analysisAbort?.signal);}catch(e){app.acousticCandidates.set(song.id,[]);}app.renderLibrary();return out;
 });
 app.indexAcousticSong=async function(song,signal){
  if(song.acoustic26){try{return A.validate(song.acoustic26);}catch{}}
  let buffer=this.buffers.get(song.id);if(!buffer){if(song.builtin){const demo=C.DEMOS.find(d=>d.id===song.demoId);if(!demo)throw Error('Démo source absente.');await this.audio.init();const data=C.synthDemo(demo);buffer=this.audio.fromSamples(data.samples,data.sampleRate);}else{const media=await this.store.get('assets',song.audioAsset);if(!media?.blob)throw Error('Audio absent.');buffer=await this.audio.decode(media.blob);}}
  const fp=await this.fingerprintAudio(buffer,signal);if(signal?.aborted)throw new DOMException('Analyse annulée.','AbortError');const next={...song,acoustic26:fp};await this.store.put('songs',next);Object.assign(song,next);return fp;
 };
 $('audioIndex26').onclick=()=>app.run(async()=>{app.analysisAbort=new AbortController();$('cancelAnalysis').hidden=false;const log=[];for(const s of app.songs){if(app.analysisAbort.signal.aborted)break;try{$('busyText').textContent='Index acoustique : '+s.title;await app.indexAcousticSong(s,app.analysisAbort.signal);log.push({songId:s.id,title:s.title,ok:true});}catch(e){log.push({songId:s.id,title:s.title,ok:false,error:e.message});if(e.name==='AbortError')break;}}app.lastAcousticIndex=log;$('audioIndexStatus26').textContent=`${log.filter(x=>x.ok).length}/${log.length} morceaux indexés. ${log.filter(x=>!x.ok).map(x=>x.title+' : '+x.error).join(' · ')}`;},'Index local, sans modifier les partitions…');
 app.findAudioMatches=async function(){const owner=this.song;this.analysisAbort=new AbortController();$('cancelAnalysis').hidden=false;await this.indexAcousticSong(owner,this.analysisAbort.signal);const results=await this.compareIndexedAudio(owner,this.analysisAbort.signal);if(this.song!==owner)throw Error('Le morceau a changé.');this.renderLibrary();this.reviewAudioMatches();return results;};
 $('audioFind26').onclick=()=>app.run(()=>app.findAudioMatches(),'Comparaison du son…');$('audioReview26').onclick=()=>app.reviewAudioMatches();
 app.acceptAcousticCharts=async function(owner,source,ids,delta){if(this.song!==owner||!this.songs.includes(source))throw Error('Source ou destination changée.');const next=A.copyCharts(source,owner,ids,delta);await this.store.put('songs',next);Object.assign(owner,next);this.renderLibrary();return next;};
 app.reviewAudioMatches=function(){
  const owner=this.song,matches=this.acousticCandidates.get(owner.id)||[];
  this.openModal(`<div class="eyebrow">COMPARAISON LOCALE / ${esc(owner.title)}</div><h2>DES PARTITIONS À RÉUTILISER ?</h2><p>Une ressemblance acoustique n’est pas une identité vérifiée. Vérifie l’enregistrement et le timing. La copie ajoute des variantes, sans supprimer les niveaux source ou actuels.</p><p id="mapListenStatus" role="status"></p><div id="audioMatches26"></div><p id="audioMatchMessage26" role="status"></p>`);
  const host=$('audioMatches26');if(!matches.length)host.textContent='Aucune ressemblance suffisamment forte. Indexer les anciens morceaux peut fournir de nouveaux candidats.';
  for(const m of matches){const source=this.songs.find(s=>s.id===m.songId);if(!source)continue;const row=document.createElement('section');row.className='match26-card';row.innerHTML=`<h3>${esc(source.title)}</h3><p>Indice de ressemblance : ${(m.score*100).toFixed(1)} / 100 · décalage proposé ${m.offset.toFixed(2)} s. Ce score n’est pas une probabilité d’identité.</p><label>Décalage accepté, secondes<input data-match-offset type="number" value="${m.offset}" min="-2" max="2" step=".01"></label><div class="match26-charts">${source.charts.map(c=>`<label class="check"><input type="checkbox" data-chart="${esc(c.id)}">${esc(c.difficulty)} · ${c.notes.length} notes · ${esc(c.source)}</label>`).join('')}</div><label>Début de l’écoute (s)<input data-listen-start type="number" value="${Math.max(0,(source.charts[0]?.notes[0]?.time||0)-.8).toFixed(2)}" min="0" max="${Math.max(0,owner.duration-1)}" step=".1"></label><div class="buttons"><button data-match-listen>Écouter ces frappes sur le nouvel audio</button><button data-match-stop>Arrêter</button></div><p data-listen-status></p><label class="check"><input data-match-confirm type="checkbox">J’ai vérifié la version et le décalage ; créer des copies à contrôler.</label><button data-match-copy>Ajouter les partitions sélectionnées</button>`;
   row.querySelector('[data-match-copy]').onclick=()=>this.run(async()=>{if(!row.querySelector('[data-match-confirm]').checked)throw Error('Confirmer la vérification du timing avant de copier.');const ids=Array.from(row.querySelectorAll('[data-chart]:checked')).map(x=>x.dataset.chart),delta=+row.querySelector('[data-match-offset]').value;await this.acceptAcousticCharts(owner,source,ids,delta);this.closeModal();this.toast('Copies ajoutées. Les partitions précédentes et le spectacle sont conservés.');},'Copie non destructive…');
   row.querySelector('[data-match-listen]').onclick=()=>this.run(async()=>{const id=row.querySelector('[data-chart]:checked')?.dataset.chart||source.charts[0].id,chart=source.charts.find(c=>c.id===id),delta=+row.querySelector('[data-match-offset]').value;if(!Number.isFinite(delta)||Math.abs(delta)>2)throw Error('Décalage invalide.');await this.listenMapping({...chart,offset:(chart.offset||0)+delta},+row.querySelector('[data-listen-start]').value,owner.id);row.querySelector('[data-listen-status]').textContent='Écoute du nouvel audio + clics de la première partition cochée (12 secondes maximum).';},'Vérification des frappes…');row.querySelector('[data-match-stop]').onclick=()=>this.stopMappingPreview();host.append(row);
  }
 };
 wrap('init',async old=>{await old();app.renderSettings();document.documentElement.dataset.v26Ready='true';});
}
root.PulseV26={install};
})(globalThis);
