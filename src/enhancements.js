/* DIVA PULSE 3 · integration layer. No network services, no embedded official assets. */
(function(root){'use strict';
const C=PulseCore,S=PulseServices,$=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const extraDefaults={outputClock:false,contrastNotes:true,earlyLate:true,hitSound:true};
function install(app){
  app.v3State={id:'v3-state',setlists:[],sessions:[]};app.replayInputs=[];app.lastReplay=null;app.replayCursor=0;
  const bind=(id,fn)=>$(id)?.addEventListener('click',()=>{try{const p=fn();p?.catch?.(e=>app.toast(e.message,true));}catch(e){app.toast(e.message,true);}});
  const wrap=(name,fn)=>{const prev=app[name].bind(app);app[name]=(...args)=>fn(prev,...args);};
  // getOutputTimestamp correlates presentation audio time with the event clock.
  // Legacy raw clock stays the default so existing user calibration is not changed.
  const audio=app.audio;
  audio.contextAt=function(stamp=performance.now()){
    if(!this.ctx)return 0;const now=performance.now();let event=Number(stamp);if(event>1e12)event-=performance.timeOrigin;if(!Number.isFinite(event)||Math.abs(event-now)>1000)event=now;
    if(app.settings.outputClock&&this.ctx.getOutputTimestamp){const ts=this.ctx.getOutputTimestamp();if(ts.contextTime>0&&ts.performanceTime>0&&Math.abs(now-ts.performanceTime)<1000)return ts.contextTime+(event-ts.performanceTime)/1000;}
    return this.ctx.currentTime+(event-now)/1000;
  };
  audio.timeAt=function(stamp=performance.now()){return this.playing?this.offset+(this.contextAt(stamp)-this.anchor)*this.rate:this.pausedAt;};
  Object.defineProperty(audio,'time',{get(){return this.timeAt();}});
  audio.clickAt=function(songTime,strong=false){if(!this.ctx||!this.playing)return;const at=Math.max(this.ctx.currentTime,this.anchor+(songTime-this.offset)/this.rate),o=this.ctx.createOscillator(),g=this.ctx.createGain();o.frequency.value=strong?1250:850;g.gain.setValueAtTime(.1,at);g.gain.exponentialRampToValueAtTime(.001,at+.045);o.connect(g);g.connect(this.ctx.destination);o.start(at);o.stop(at+.055);o.onended=()=>{o.disconnect();g.disconnect();};};
  wrap('init',async(prev)=>{await prev();app.v3State={...app.v3State,...await app.store.get('settings','v3-state')};app.v3State.setlists=Array.isArray(app.v3State.setlists)?app.v3State.setlists:[];app.v3State.sessions=Array.isArray(app.v3State.sessions)?app.v3State.sessions:[];app.renderSettings();document.documentElement.dataset.v3Ready='true';});
  wrap('renderLibrary',prev=>{prev();if(app.chart?.source==='midi-native')$('songSource').textContent='MIDI / PARTITION NATIVE';else if(app.chart?.source==='midi')$('songSource').textContent='MIDI / MAPPING ADAPTÉ';});
  wrap('applySettings',prev=>{for(const [k,v]of Object.entries(extraDefaults))app.settings[k]??=v;prev();document.documentElement.classList.toggle('contrast-notes',app.settings.contrastNotes);});
  wrap('renderSettings',prev=>{prev();for(const k of Object.keys(extraDefaults))$(k).checked=!!app.settings[k];$('clockInfo').textContent=app.settings.outputClock?'Horloge de sortie estimée active. Recalibre après un changement de mode ou de périphérique.':'Horloge V2 conservée. La compensation manuelle reste active.';});
  for(const k of Object.keys(extraDefaults))$(k).addEventListener('change',()=>app.run(async()=>{app.settings[k]=$(k).checked;app.applySettings();try{await app.store.put('settings',app.settings);}finally{app.renderSettings();}},'Enregistrement du réglage…'));
  wrap('applyScene',async prev=>{await prev();app.stage.blend=app.song.scene.blend??.5;app.stage.lights=app.song.scene.lights!==false;app.stage.spacing=app.song.scene.spacing||1;app.stage.modelRotation=app.song.scene.modelRotation||0;app.stage.modelScale=app.song.scene.modelScale||1;});
  wrap('renderWardrobe',prev=>{prev();$('stageLights').checked=app.song.scene.lights!==false;$('castSpacing').value=app.song.scene.spacing||1;$('modelRotation').value=app.song.scene.modelRotation||0;$('modelScale').value=app.song.scene.modelScale||1;});
  for(const [id,key] of [['stageLights','lights'],['castSpacing','spacing'],['modelRotation','modelRotation'],['modelScale','modelScale']])$(id).addEventListener('change',async()=>{app.song.scene[key]=$(id).type==='checkbox'?$(id).checked:Number($(id).value);try{await app.saveSong();await app.applyScene();}catch(e){app.toast(e.message,true);}});
  wrap('keyDown',(prev,e)=>{
    if(app.view==='editor'&&!$('modal').open&&!app.busy&&!['INPUT','SELECT','TEXTAREA'].includes(e.target?.tagName)&&(e.ctrlKey||e.metaKey)){
      if(e.code==='KeyA'){e.preventDefault();app.editor.select(app.editor.chart.notes);return;}
      if(e.code==='KeyC'){e.preventDefault();app.editor.copy();return;}
      if(e.code==='KeyV'){e.preventDefault();app.editor.paste();return;}
    }prev(e);
  });
  app.pressSource=function(source,lane,stamp){
    if(!Number.isInteger(lane)||lane<0||lane>5||this.heldSources.has(source))return;
    this.heldSources.set(source,lane);const set=this.laneSources[lane],first=set.size===0;set.add(source);$('touchControls').querySelector(`[data-lane="${lane}"]`)?.classList.add('pressed');if(!first)return;
    const t=this.audio.timeAt(stamp)-this.settings.inputOffset/1000*this.audio.rate;
    if(this.view==='editor'&&this.editor.recording){this.editor.recordPress(lane,this.audio.timeAt(stamp));return;}
    if(this.view==='game'&&!this.paused&&!['autoplay','pv','replay'].includes(this.mode)){
      if(this.mode==='play')this.replayInputs.push({time:t,lane,down:true});
      this.engine?.press(lane,t);if(this.settings.hitSound&&!this.consumeFeedback33)this.audio.sfx(lane);
    }
  };
  app.releaseSource=function(source,stamp){
    const lane=this.heldSources.get(source);if(lane===undefined)return;this.heldSources.delete(source);this.laneSources[lane].delete(source);if(this.laneSources[lane].size)return;
    $('touchControls').querySelector(`[data-lane="${lane}"]`)?.classList.remove('pressed');const t=this.audio.timeAt(stamp)-this.settings.inputOffset/1000*this.audio.rate;
    if(this.view==='game'&&this.mode==='play')this.replayInputs.push({time:Math.max(this.replayInputs.at(-1)?.time??t,t),lane,down:false});
    if(this.mode!=='replay')this.engine?.release(lane,t);if(this.editor.recording)this.editor.recordRelease(lane,this.audio.timeAt(stamp));
  };
  app.advanceReplay=function(time){const r=this.activeReplay;if(!r)return;while(this.replayCursor<r.inputs.length&&r.inputs[this.replayCursor].time<=time){const x=r.inputs[this.replayCursor++];this.engine.update(x.time);if(x.down)this.engine.press(x.lane,x.time);else this.engine.release(x.lane,x.time);}this.engine.update(time);};
  const oldPause=app.pause.bind(app);app.pause=function(){const snapshot=this.mode==='replay'&&this.engine?{held:new Set(this.engine.held),heldSince:new Map(this.engine.heldSince),chainArmed:new Set(this.engine.chainArmed),activeHolds:new Map([...this.engine.activeHolds].map(([k,v])=>[k,{...v}]))}:null;oldPause();if(snapshot)Object.assign(this.engine,snapshot);};
  wrap('startGame',async(prev,mode='play',practice=null)=>{
    if(mode==='replay'&&!app.pendingReplay)throw Error('Aucun replay chargé.');
    const replay=mode==='replay'?structuredClone(app.pendingReplay):null;
    const clearSetlist=mode==='play'&&!app.queueLaunching&&app.view==='library';
    if(await prev(mode,practice,replay)===false)return false;
    // A cancelled preparation must not erase the running take's input log.
    app.replayInputs=[];app.replayCursor=0;
    if(clearSetlist)app.activeSetlist=null;
    if(mode==='replay')$('gameModeLabel').textContent='REPLAY / AUCUN RECORD';
    app.takeStarted=new Date().toISOString();app.frameError=false;return true;
  });
  wrap('finish',async prev=>{
    if(app.finishing)return;
    const completion=await prev();if(!completion?.result)return completion;
    const {mode,result,chart,song,profile,noFail,practice}=completion,stats=C.timingStats(result.errors),log=result.log||[];
    if(mode==='play'){
      let last=-Infinity;
      const inputs=completion.inputs.map(e=>({...e,time:(last=Math.max(e.time,last))}));
      completion.replay={format:'DIVA-PULSE-REPLAY',version:1,engine:C.VERSION,judgmentProfile:profile,chart:structuredClone(chart),songId:song.id,audioHash:song.audioHash,demoId:song.demoId,title:song.title,inputs,endTime:completion.endTime,noFail,result,created:completion.started};
      if(completion.current())app.lastReplay=completion.replay;
      const session={songId:song.id,chartId:chart.id,signature:C.chartSignature(chart),judgmentProfile:profile,title:song.title,difficulty:chart.difficulty,accuracy:result.accuracy,score:result.score,fullCombo:result.fullCombo,mode:noFail?'no-fail':'play',date:completion.started};
      const write=async()=>{
        const next={...app.v3State,sessions:[...app.v3State.sessions,session].slice(-200)};
        await app.store.put('settings',next);
        app.v3State={...app.v3State,sessions:next.sessions};
      };
      const pending=(app.sessionWrite||Promise.resolve()).catch(()=>{}).then(write);app.sessionWrite=pending;
      try{await pending;}catch(e){app.toast('Historique non sauvegardé : '+e.message,true);}
    }
    if(!completion.current())return completion;
    $('performanceStats').innerHTML=`<div><strong>${stats.median.toFixed(1)} ms</strong><small>MÉDIANE</small></div><div><strong>${stats.deviation.toFixed(1)} ms</strong><small>DISPERSION</small></div><div><strong>${stats.early} / ${stats.late}</strong><small>AVANCE / RETARD</small></div><div><strong>${stats.center}</strong><small>DANS ±5 MS</small></div>`;
    $('exportReplay').hidden=$('watchReplay').hidden=mode!=='play';$('applyTiming').hidden=mode!=='play'||stats.suggestion===null;app.timingSuggestion=stats.suggestion;
    const suggestions=$('practiceSuggestions');suggestions.replaceChildren();
    if(!['autoplay','replay'].includes(mode)){const bad=C.practiceSegments(mode==='practice'?{...chart,notes:chart.notes.filter(n=>n.time+chart.offset>=practice.from&&n.time+chart.offset<practice.to)}:chart,log,song.duration).filter(x=>x.bad>0).slice(0,3);if(bad.length){let h=document.createElement('p');h.textContent='Reprendre les passages difficiles :';suggestions.append(h);for(const s of bad){let b=document.createElement('button');b.textContent=`${app.formatTime(s.from)} – ${app.formatTime(s.to)} · ${s.bad} notes à retravailler`;b.onclick=()=>app.run(()=>app.startGame('practice',{from:s.from,to:s.to,rate:.75,loop:true}),'Préparation du passage…');suggestions.append(b);}}}
    if(mode==='replay')$('resultMode').textContent='REPLAY · AUCUN RECORD';
    $('setlistNext').hidden=!app.activeSetlist||app.activeSetlist.index>=app.activeSetlist.entries.length-1;
    return completion;
  });
  bind('exportReplay',()=>{if(app.lastReplay)S.download(JSON.stringify(app.lastReplay),app.lastReplay.title+'.pulsereplay');});
  bind('watchReplay',()=>{app.pendingReplay=app.lastReplay;return app.run(()=>app.startGame('replay'),'Lecture du replay…');});
  bind('applyTiming',()=>{if(app.timingSuggestion===null)return;app.openModal(`<div class="eyebrow">CALIBRATION / PROPOSITION</div><h2>AJUSTER DE ${app.timingSuggestion>0?'+':''}${app.timingSuggestion} MS ?</h2><p>Cette proposition utilise la médiane de tes frappes, pas une mesure matérielle de latence. Elle s’ajoute au réglage actuel ; les partitions ne bougent pas.</p><button id="confirmTiming" class="primary">APPLIQUER</button>`);$('confirmTiming').onclick=()=>app.run(async()=>{app.settings.inputOffset=C.clamp(app.settings.inputOffset+app.timingSuggestion,-500,500);await app.store.put('settings',app.settings);app.closeModal();app.toast('Compensation réglée à '+app.settings.inputOffset+' ms.');},'Enregistrement de la calibration…');});
  bind('loadReplay',()=>$('replayInput').click());$('replayInput').addEventListener('change',e=>{const f=e.target.files[0];e.target.value='';if(f)app.run(async()=>{if(f.size>24*1024*1024)throw Error('Replay limité à 24 Mo.');const r=C.validateReplay(JSON.parse(await f.text()));const match=app.songs.find(s=>r.audioHash?s.audioHash===r.audioHash:r.demoId&&s.demoId===r.demoId);if(match)await app.selectSong(match.id);app.openModal(`<div class="eyebrow">REPLAY</div><h2>${esc(r.title||r.chart.title)}</h2><p>${r.inputs.length} entrées · ${r.chart.notes.length} notes.</p><p>${match?'Le fichier audio correspondant est présent dans la bibliothèque.':'L’audio correspondant n’a pas été identifié. Le replay sera associé au morceau sélectionné : '+esc(app.song.title)+'. Importe d’abord le bon audio si nécessaire.'}</p><button id="confirmReplay" class="primary">LIRE SUR CE MORCEAU</button>`);$('confirmReplay').onclick=()=>{app.pendingReplay=r;app.closeModal();app.run(()=>app.startGame('replay'),'Préparation du replay…');};},'Lecture du replay…');});
  bind('persistentStorage',async()=>{if(!navigator.storage?.persist)return app.toast('La demande de stockage durable n’est pas disponible ici.',true);const ok=await navigator.storage.persist();app.toast(ok?'Stockage durable accordé par le navigateur. Conserve une sauvegarde externe.':'Stockage durable non accordé. Exporte régulièrement la bibliothèque.',!ok);});
  // Audit is informative. It never silently repairs or re-quantizes an imported chart.
  app.auditDialog=function(chart){if(!chart)return this.toast('Aucune partition sélectionnée.',true);const audit=C.auditChart(chart,this.song.duration);this.lastAudit=audit;
    this.openModal(`<div class="eyebrow">CHART CHECK / NON DESTRUCTIF</div><h2>${audit.ok?'PARTITION CONTRÔLÉE':'POINTS À CORRIGER'}</h2><div class="audit-summary"><b>${audit.counts.error} erreurs</b><b>${audit.counts.warning} avertissements</b><b>${audit.counts.info} indications</b></div><p>${audit.stats.notes} notes · pic ${audit.stats.peakNps}/s. Ces règles détectent des risques, pas la qualité artistique d’un mapping.</p><div id="auditList" class="audit-list"></div><button id="downloadAudit" class="secondary">Exporter le contrôle JSON</button>`);
    const list=$('auditList');for(const issue of audit.issues){const row=document.createElement('button');row.className='audit-item '+issue.severity;row.textContent=`${this.formatTime(issue.time+chart.offset,true)} · ${issue.message}`;row.onclick=async()=>{this.closeModal();await this.showView('editor');if(this.editor.chart.id!==chart.id)this.editor.load(chart);this.editor.selected=issue.noteId;this.editor.selection=new Set(issue.noteId?[issue.noteId]:[]);this.editor.cursor=issue.time+chart.offset;this.editor.start=Math.max(0,this.editor.cursor-1);this.editor.renderFields();this.editor.draw();};list.append(row);}if(!audit.issues.length)list.textContent='Aucune anomalie détectée par les règles actuelles.';$('downloadAudit').onclick=()=>S.download(JSON.stringify({chartId:chart.id,signature:C.chartSignature(chart),...audit},null,2),'DIVA_PULSE_CONTROLE_PARTITION.json');
  };
  bind('libraryAudit',()=>app.auditDialog(app.chart));
  wrap('importChart',async(prev,file)=>{
    if(!/\.mid(i)?$/i.test(file.name)){await prev(file);return;}
    const midi=C.parseMIDI(await file.arrayBuffer());app.pendingMIDI=midi;
    app.openModal(`<div class="eyebrow">MIDI → PARTITION</div><h2>CHOISIS LE MAPPING.</h2><p>${midi.tracks.length} pistes · ${midi.notes.length} notes · ${midi.tempoMap.length} événements de tempo.</p><label>Piste<select id="midiTrack"><option value="all">Toutes les pistes</option>${midi.tracks.map(t=>`<option value="${t.index}">${esc(t.name)} · ${t.notes.length} notes</option>`).join('')}</select></label><label>Correspondance<select id="midiMapping"><option value="pitch">Adapter les hauteurs à △ □ × ○</option><option value="pulse">Touches réservées : MIDI 60–65 → △ □ × ○ ‹ ›</option></select></label><label class="check"><input id="midiHolds" type="checkbox" checked> Notes longues → HOLD / CHAIN</label><label class="check"><input id="midiDrums" type="checkbox" checked> Exclure la percussion (canal 10)</label>${midi.nativeChart?'<label class="check"><input id="midiNative" type="checkbox" checked> Restaurer la partition DIVA PULSE embarquée, positions incluses</label>':''}<div id="midiPreview" class="import-preview"></div><button id="confirmMIDI" class="primary">IMPORTER CETTE PARTITION</button>`);
    let converted;
    const update=()=>{try{converted=C.midiToChart(midi,{track:$('midiTrack').value,mapping:$('midiMapping').value,holds:$('midiHolds').checked,excludeDrums:$('midiDrums').checked,native:!!$('midiNative')?.checked,title:app.song.title,difficulty:app.difficulty});$('midiPreview').textContent=`${converted.chart.notes.length} notes prêtes. `+(converted.warnings.join(' ')||'Les instants et les changements de tempo sont conservés. Les positions sont adaptées sauf métadonnées DIVA PULSE.');$('confirmMIDI').disabled=!converted.chart.notes.length;}catch(e){converted=null;$('midiPreview').textContent=e.message;$('confirmMIDI').disabled=true;}};
    ['midiTrack','midiMapping','midiHolds','midiDrums','midiNative'].forEach(id=>$(id)?.addEventListener('change',update));update();
    $('confirmMIDI').onclick=()=>app.run(async()=>{if(!converted)return;if(app.view==='editor')await app.editor.autosave();const c=converted.chart;if(app.song.charts.length>=50)throw Error('Maximum 50 partitions par morceau.');const candidate={...app.song,charts:[...app.song.charts,c]};await app.store.put('songs',candidate);Object.assign(app.song,candidate);app.difficulty=c.difficulty;app.selectedChartId=c.id;if(app.view==='editor')app.editor.load(c);app.renderLibrary();app.closeModal();app.toast('Partition MIDI importée. Les fichiers précédents sont conservés.');},'Import de la partition MIDI…');
  });
  // A chart or song backup remains portable; restoration is a single DB transaction.
  app.buildBackupData=async function(onlySong=null){await this.directorDraftWrite;await this.faceDraftWrite;await this.physicsDraftWrite;const songs=structuredClone(onlySong?[onlySong]:this.songs),allAssets=await this.store.all('assets'),storedSettings=await this.store.all('settings'),directorDrafts=storedSettings.filter(x=>x.id.startsWith('director-draft:')&&x.director&&x.status!=='applied'&&songs.some(s=>s.id===x.songId)),refs=new Set();for(const s of songs){for(const id of [s.audioAsset,s.videoAsset,...root.PulseDirector.assetReferences(s.scene)])if(id)refs.add(id);}
    for(const d of this.directorRecoveries?.values()||[]){if(songs.some(s=>s.id===d.songId)){const i=directorDrafts.findIndex(x=>x.songId===d.songId);if(i<0)directorDrafts.push(d);else directorDrafts[i]=d;}}
    for(const d of directorDrafts)for(const id of root.PulseDirector.assetReferences({mmdDirector:d.director}))refs.add(id);
    const faceDrafts=root.PulseFaceDrafts.merge(storedSettings.filter(x=>x.id.startsWith('face-draft:')),Array.from(this.faceRecoveries?.values()||[]),songs);
    const physicsDrafts=root.PulsePhysicsDrafts.merge(storedSettings.filter(x=>x.id.startsWith('physics-draft:')),Array.from(this.physicsRecoveries?.values()||[]),songs);
    for(const d of faceDrafts){if(d.track.sourceAsset){refs.add(d.track.sourceAsset);const pending=this.facePendingAssets?.get(d.track.sourceAsset);if(pending&&!allAssets.some(a=>a.id===pending.id))allAssets.push(pending);}}
    for(const id of refs)if(!allAssets.some(a=>a.id===id&&a.blob))throw Error('Export annulé : média référencé absent ('+id+').');const assets=allAssets.filter(a=>refs.has(a.id));
    const chartDrafts=storedSettings.filter(x=>x.id.startsWith('draft:')&&songs.some(s=>s.id===x.songId));const ed=this.editor;if(ed.chart&&ed.dirty&&songs.some(s=>s.id===ed.ownerId)){const d={id:`draft:${ed.ownerId}:${ed.originalId}`,songId:ed.ownerId,originalId:ed.originalId,chart:C.validateChart(ed.chart),cursor:ed.cursor,updated:new Date().toISOString()},i=chartDrafts.findIndex(x=>x.id===d.id);if(i<0)chartDrafts.push(d);else chartDrafts[i]=d;}
    const data={format:'DIVA-PULSE-LIBRARY',version:5,created:new Date().toISOString(),songs,settings:this.settings,scores:this.scores.filter(r=>songs.some(s=>s.id===r.songId)),v3State:this.v3State,catalog:onlySong?[]:(this.catalogState?.entries||[]),drafts:chartDrafts,directorDrafts,faceDrafts,physicsDrafts,v4State:this.v4State||null,v5State:this.v5State||null,assets:[]};return {data,assets};
  };
  app.exportBackup=async function(onlySong=null){const {data,assets}=await this.buildBackupData(onlySong);if(assets.reduce((n,a)=>n+a.blob.size,0)>180*1024*1024)throw Error('Ce .pulsepack dépasse 180 Mio : utiliser la sauvegarde binaire .pulsebundle ou exporter un morceau.');for(const a of assets)data.assets.push({id:a.id,name:a.name,kind:a.kind,type:a.blob.type,data:await S.blobToBase64(a.blob)});
    S.download(JSON.stringify(data),(onlySong?onlySong.title:'DIVA_PULSE_BIBLIOTHEQUE_V26')+'.pulsepack');this.toast('Pack exporté : musique, partitions, scène, médias et données locales.');
  };
  app.restoreBackup=async function(file){if(file.size>256*1024*1024)throw Error('Pack limité à 256 Mo.');let raw;try{raw=JSON.parse(await file.text());}catch{throw Error('Pack JSON invalide.');}return this.reviewBackup(raw);};
  app.reviewBackup=async function(raw,binary=null){root.PulseBundle.validateLibrary(raw);
    // Validate every chart before offering the commit button.
    for(const s of raw.songs){if(!s.id||!Array.isArray(s.charts)||s.charts.length>50)throw Error('Morceau invalide dans le pack.');for(const c of s.charts)C.validateChart(c);}
    if(raw.directorDrafts!==undefined&&(!Array.isArray(raw.directorDrafts)||raw.directorDrafts.length>250))throw Error('Brouillons Director invalides.');for(const d of raw.directorDrafts||[]){if(typeof d.songId!=='string')throw Error('Brouillon Director sans propriétaire.');root.PulseDirector.normalizeDirector(d.director);}
    if(raw.faceDrafts!==undefined&&(!Array.isArray(raw.faceDrafts)||raw.faceDrafts.length>250))throw Error('Brouillons visage invalides.');const faceOwners=new Set();for(const item of raw.faceDrafts||[]){const d=root.PulseFaceDrafts.validate(item);if(faceOwners.has(d.songId)||!raw.songs.some(s=>s.id===d.songId))throw Error('Propriétaire de brouillon visage absent ou dupliqué.');faceOwners.add(d.songId);if(d.track.sourceAsset&&!raw.assets.some(a=>a.id===d.track.sourceAsset))throw Error('Voix guide du brouillon absente.');}
    root.PulsePhysicsDrafts.validateCollection(raw.physicsDrafts===undefined?[]:raw.physicsDrafts,raw.songs);
    const academy=C.mergeAcademyProgress?C.mergeAcademyProgress(this.v5State?.academy||{},raw.v5State?.academy||{}):{};
    let incomingCatalog=[];if(raw.catalog!==undefined){incomingCatalog=C.validateCatalog({format:'DIVA-PULSE-CHART-CATALOG',version:1,entries:raw.catalog}).entries;}
    if(raw.drafts!==undefined&&(!Array.isArray(raw.drafts)||raw.drafts.length>1000))throw Error('Brouillons de sauvegarde invalides.');
    for(const d of raw.drafts||[]){if(!d.songId||!d.originalId)throw Error('Brouillon sans propriétaire.');C.validateChart(d.chart);}
    this.openModal(`<div class="eyebrow">IMPORT / COPIES SÉCURISÉES</div><h2>RESTAURER ${raw.songs.length} MORCEAU(X).</h2><p>Les morceaux sont importés en copies. Aucun morceau existant n’est écrasé.</p><label class="check"><input id="restoreScores" type="checkbox" checked> Rattacher les records des morceaux importés</label><label class="check"><input id="restorePreferences" type="checkbox"> Remplacer mes réglages par ceux du pack</label><p>Les setlists compatibles sont ajoutées en copies. Les sessions et replays ne sont pas fusionnés automatiquement. Le catalogue, les brouillons et les meilleures médailles de l’académie sont restaurés avec les morceaux.</p><button id="confirmRestore" class="primary">RESTAURER LE PACK</button>`);
    $('confirmRestore').onclick=()=>this.run(async()=>{
      // Programmatic callers can still edit raw while the confirmation is open.
      root.PulseBundle.validateLibrary(raw);
      if(binary!==null&&(!(binary instanceof Map)||raw.assets.some(a=>!(binary.get(a.id) instanceof Blob)||binary.get(a.id).size!==a.size)))throw Error('Média binaire absent ou taille différente du manifeste.');
      const idMap=new Map(),songMap=new Map();for(const a of raw.assets){if(!a.id||idMap.has(a.id))throw Error('Identifiants de médias invalides.');idMap.set(a.id,C.uid());}
      const songs=raw.songs.map(s=>{if(songMap.has(s.id))throw Error('Identifiants de morceaux dupliqués.');const id=C.uid();songMap.set(s.id,id);for(const ref of [s.audioAsset,s.videoAsset,s.scene?.modelAsset])if(ref&&!idMap.has(ref))throw Error('Le pack fait référence à un média absent.');if(s.builtin&&!C.DEMOS.some(d=>d.id===s.demoId))throw Error('Démo inconnue dans le pack.');return {...structuredClone(s),id,title:String(s.title||'Sans titre').slice(0,180),audioAsset:idMap.get(s.audioAsset)||null,videoAsset:idMap.get(s.videoAsset)||null,scene:app.cleanSceneV3(root.PulseDirector.remapScene(s.scene,idMap)),charts:s.charts.map(c=>C.validateChart(c)),duration:C.clamp(C.finite(s.duration,60),1,7200)};});
      const scores=[];if($('restoreScores').checked)for(const old of (raw.scores||[]).slice(0,20000)){const song=songs.find(s=>s.id===songMap.get(old.songId)),chart=song?.charts.find(c=>c.id===old.chartId);if(chart&&Number.isFinite(old.score)&&Number.isFinite(old.accuracy)&&old.accuracy>=0&&old.accuracy<=100)scores.push({...old,songId:song.id,id:`${song.id}/${chart.id}/${root.PulseBundle.scoreSuffix(old,chart)}`});}
      const state=structuredClone(this.v3State);for(const list of (raw.v3State?.setlists||[]).slice(0,100)){const entries=(list.entries||[]).map(e=>({...e,songId:songMap.get(e.songId)})).filter(e=>songs.some(s=>s.id===e.songId&&s.charts.some(c=>c.id===e.chartId)));if(entries.length)state.setlists.push({id:C.uid(),title:String(list.title||'Setlist importée').slice(0,80),entries});}
      let prefs=null;if($('restorePreferences').checked&&raw.settings){prefs={...this.settings,...raw.settings,id:'preferences'};prefs.mmdDefaultSourceId=songMap.get(raw.settings?.mmdDefaultSourceId)||null;if(!Array.isArray(prefs.keys)||prefs.keys.length!==6||new Set(prefs.keys).size!==6||prefs.keys.some(k=>typeof k!=='string'||k.length>30))throw Error('Raccourcis de réglage invalides.');}
      if(prefs)prefs=root.PulseQuality.preferences(prefs,{strict:true}).value;
      const catalogState={id:'v4-catalog',entries:C.mergeCatalog(this.catalogState?.entries||[],incomingCatalog).entries};
      const drafts=(raw.drafts||[]).map(d=>{const songId=songMap.get(d.songId);if(!songId)throw Error('Le morceau du brouillon est absent du pack.');return {...d,id:`draft:${songId}:${d.originalId}`,songId,chart:C.validateChart(d.chart)};});
      const directorDrafts=(raw.directorDrafts||[]).map(d=>{const owner=songs.find(s=>s.id===songMap.get(d.songId));if(!owner?.scene?.mmd)throw Error('Brouillon Director : morceau ou pack manquant.');return {...d,id:'director-draft:'+owner.id,songId:owner.id,packId:root.PulseDirectorEdit.restoredRecoveryPackId(d,raw.songs.find(s=>s.id===d.songId),owner),director:root.PulseDirector.remapScene({mmdDirector:d.director},idMap).mmdDirector};});
      const faceDrafts=root.PulseFaceDrafts.remap(raw.faceDrafts||[],songMap,idMap);
      const physicsDrafts=root.PulsePhysicsDrafts.remap(raw.physicsDrafts||[],songMap,songs);
      const state5={id:'v5-state',academy};
      // All owners, references and selected settings are checked before Blob decoding.
      let bytes=0;const assets=raw.assets.map(a=>{const blob=binary?.get(a.id)||S.base64ToBlob(a.data,a.type);bytes+=blob.size;if(bytes>(binary?root.PulseBundle.MAX_BODY:180*1024*1024))throw Error('Trop de médias dans ce pack.');return {...a,id:idMap.get(a.id),blob,data:undefined};});
      const rows=[['settings',state5],...assets.map(a=>['assets',a]),...songs.map(s=>['songs',s]),...scores.map(s=>['scores',s]),['settings',state],['settings',catalogState],...drafts.map(d=>['settings',d]),...directorDrafts.map(d=>['settings',d]),...faceDrafts.map(d=>['settings',d]),...physicsDrafts.map(d=>['settings',d])];if(prefs)rows.push(['settings',prefs]);await this.store.atomic(rows);
      this.songs.push(...songs);this.scores.push(...scores);this.v5State=state5;this.v3State=state;this.catalogState=catalogState;if(prefs){this.settings=prefs;this.applySettings();this.renderSettings();}this.closeModal();this.renderLibrary();this.toast(`${songs.length} morceaux et ${scores.length} records restaurés en copies.`);
    },'Restauration transactionnelle…');
  };
  app.songManager=function(){const song=this.song;this.openModal(`<div class="eyebrow">BIBLIOTHÈQUE / MORCEAU</div><h2>${esc(song.title)}</h2><label>Titre<input id="manageTitle" maxlength="180" value="${esc(song.title)}"></label><label>Artiste<input id="manageArtist" maxlength="180" value="${esc(song.artist)}"></label><div class="buttons"><button id="saveSongMeta" class="primary">ENREGISTRER</button><button id="exportOneSong">Exporter ce morceau complet</button></div><p>${song.charts.length} partitions. Les versions source ne sont jamais remplacées par les modifications du studio.</p><div id="manageCharts" class="audit-list"></div>`);
    $('saveSongMeta').onclick=()=>this.run(async()=>{const next={...song,title:$('manageTitle').value.trim()||song.title,artist:$('manageArtist').value.trim()};await this.store.put('songs',next);Object.assign(song,next);this.renderLibrary();this.closeModal();},'Enregistrement du morceau…');$('exportOneSong').onclick=()=>this.run(()=>this.exportBackup(song),'Export du morceau…');
    for(const c of song.charts){let row=document.createElement('div');row.className='event-row';let text=document.createElement('span');text.textContent=`${c.difficulty} · ${c.source} · ${c.notes.length} notes`;let choose=document.createElement('button');choose.textContent='Choisir';choose.onclick=()=>{this.selectedChartId=c.id;this.difficulty=c.difficulty;this.renderLibrary();this.closeModal();};row.append(text,choose);$('manageCharts').append(row);}
  };bind('songManage',()=>app.songManager());
  // Setlists are queues of actual chart identities, never randomly substituted levels.
  app.setlistDialog=function(){this.queueDraft=this.queueDraft||[];const redraw=()=>{this.openModal(`<div class="eyebrow">SETLISTS / TON CONCERT</div><h2>ENCHAÎNE TES MORCEAUX.</h2><label>Nom<input id="setlistTitle" maxlength="80" value="${esc(this.queueTitle||'Mon concert')}"></label><p>Ajoute la partition actuellement sélectionnée, ou change de morceau dans la bibliothèque puis reviens ici.</p><div class="buttons"><button id="queueAdd">＋ ${esc(this.song.title)} · ${esc(this.difficulty)}</button><button id="queueClear">Vider</button></div><div id="queueList" class="audit-list"></div><div class="buttons"><button id="queueSave">Enregistrer la setlist</button><button id="queueLaunch" class="primary">LANCER LE CONCERT</button></div><h3>SETLISTS SAUVEGARDÉES</h3><div id="savedLists"></div><p class="muted">Chaque morceau garde son résultat normal. Le suivant démarre quand tu le demandes, sans lancement automatique.</p>`);
      const sync=()=>this.queueTitle=$('setlistTitle').value.trim()||'Mon concert';$('setlistTitle').oninput=sync;
      $('queueAdd').onclick=()=>{sync();if(!this.chart)return this.toast('Aucune partition dans cette difficulté.',true);if(this.queueDraft.length>=30)return this.toast('Maximum 30 morceaux par setlist.',true);this.queueDraft.push({songId:this.song.id,chartId:this.chart.id,difficulty:this.chart.difficulty});redraw();};$('queueClear').onclick=()=>{sync();this.queueDraft=[];redraw();};
      this.queueDraft.forEach((e,i)=>{const s=this.songs.find(s=>s.id===e.songId),c=s?.charts.find(c=>c.id===e.chartId),row=document.createElement('div');row.className='event-row';const label=document.createElement('span');label.textContent=`${i+1}. ${s?.title||'Morceau absent'} · ${c?.difficulty||'Partition absente'}`;row.append(label);for(const [txt,delta] of [['↑',-1],['↓',1],['×',0]]){let b=document.createElement('button');b.textContent=txt;b.onclick=()=>{sync();if(!delta)this.queueDraft.splice(i,1);else if(i+delta>=0&&i+delta<this.queueDraft.length)[this.queueDraft[i],this.queueDraft[i+delta]]=[this.queueDraft[i+delta],this.queueDraft[i]];redraw();};row.append(b);}$('queueList').append(row);});
      $('queueSave').onclick=()=>this.run(async()=>{sync();if(!this.queueDraft.length)throw Error('Ajoute au moins un morceau.');const next=structuredClone(this.v3State);next.setlists.push({id:C.uid(),title:this.queueTitle,entries:structuredClone(this.queueDraft)});await this.store.put('settings',next);this.v3State=next;redraw();},'Enregistrement de la setlist…');$('queueLaunch').disabled=!this.queueDraft.length;$('queueLaunch').onclick=()=>{sync();this.activeSetlist={title:this.queueTitle,entries:structuredClone(this.queueDraft),index:0};this.closeModal();this.run(()=>this.launchQueueEntry(),'Préparation du concert…');};
      for(const list of this.v3State.setlists){const row=document.createElement('div');row.className='event-row';const b=document.createElement('button');b.textContent=`${list.title} · ${list.entries.length} morceaux`;b.onclick=()=>{this.queueDraft=structuredClone(list.entries);this.queueTitle=list.title;redraw();};const del=document.createElement('button');del.textContent='×';del.onclick=()=>this.run(async()=>{const next={...this.v3State,setlists:this.v3State.setlists.filter(l=>l.id!==list.id)};await this.store.put('settings',next);this.v3State=next;redraw();},'Suppression de la setlist…');row.append(b,del);$('savedLists').append(row);}
    };redraw();
  };
  app.launchQueueEntry=async function(){const e=this.activeSetlist.entries[this.activeSetlist.index],s=this.songs.find(s=>s.id===e.songId);if(!s||!s.charts.some(c=>c.id===e.chartId))throw Error('Un morceau de la setlist est absent. Modifie la liste avant de continuer.');await this.selectSong(s.id);this.difficulty=e.difficulty;this.selectedChartId=e.chartId;this.queueLaunching=true;try{await this.startGame('play');}finally{this.queueLaunching=false;}$('gameModeLabel').textContent=`CONCERT ${this.activeSetlist.index+1}/${this.activeSetlist.entries.length} · LIVE`;};
  bind('setlistsButton',()=>app.setlistDialog());bind('setlistNext',()=>{app.activeSetlist.index++;return app.run(()=>app.launchQueueEntry(),'Morceau suivant…');});
  wrap('help',prev=>{prev();const p=document.createElement('p');p.textContent='V3 : MIDI multitrack, carte de tempo variable, Maj+clic / Alt+glisser pour sélectionner, Ctrl+A/C/V, contrôle non destructif, setlists et replays. Les noms de rangs et le barème restent propres à DIVA PULSE.';document.querySelector('#modalContent .dialog').insertBefore(p,$('helpClose')?.parentElement||null);});
}
root.PulseV3=install;
})(globalThis);
