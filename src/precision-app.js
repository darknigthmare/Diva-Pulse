/* V5 integration: additive runtime features. Audio and MIDI never leave the device. */
(function(root){
'use strict';
const C=PulseCore,S=PulseServices,$=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function install(app){
 const wrap=(name,fn)=>{const previous=app[name].bind(app);app[name]=(...args)=>fn(previous,...args);};
 const bind=(id,fn,event='click')=>$(id)?.addEventListener(event,e=>{try{Promise.resolve(fn(e)).catch(err=>app.toast(err.message,true));}catch(err){app.toast(err.message,true);}});
 const ed=app.editor,audio=app.audio;
 app.pitchGeneration=0;app.pitchPreparing=false;app.midiAccess=null;app.midiPorts=new Map();app.midiEnabled=false;app.midiLearn=null;
 $('settings').insertAdjacentHTML('beforeend',`<section class="settings-card precision-settings"><div class="eyebrow">05 / PRECISION & LIVE INPUT</div><h2>LE RYTHME, SOUS CONTRÔLE.</h2><div class="precision-grid"><div><h3>ENTRAÎNEMENT MUSICAL</h3><label class="check"><input type="checkbox" id="preservePitchDefault"> Conserver la hauteur du son en entraînement</label><p>Traitement local WSOLA du passage, jusqu’à 120 secondes. Les voix et attaques peuvent être légèrement altérées. Les notes et le tempo de la partition ne sont jamais réécrits.</p><label class="check"><input type="checkbox" id="practiceClicksDefault"> Décompte sonore avant chaque tentative</label><p class="muted">La compensation de saisie suit maintenant la vitesse d’entraînement. Les records et replays normaux gardent les règles V4.</p></div><div><h3>CLAVIER / PADS MIDI</h3><p>Joue ou enregistre dans le studio avec six notes MIDI. Aucun message n’est envoyé aux instruments. La connexion est demandée uniquement avec le bouton ci-dessous.</p><div class="buttons"><button id="connectMIDI" class="secondary">Connecter un contrôleur MIDI</button><button id="disconnectMIDI" disabled>Déconnecter</button></div><p id="midiLiveStatus" role="status">MIDI déconnecté.</p><div id="midiConfig" hidden><label>Entrée<select id="midiPort"><option value="all">Toutes les entrées</option></select></label><label>Canal<select id="midiChannel"><option value="0">Tous les canaux</option>${Array.from({length:16},(_,i)=>`<option value="${i+1}">${i+1}</option>`).join('')}</select></label><div id="midiMapRows" class="midi-map"></div><button id="cancelMIDILearn" hidden>Annuler l’apprentissage</button></div></div></div><h3>DIAGNOSTIC DE LA BIBLIOTHÈQUE</h3><p>Vérifier les médias manquants, partitions invalides et fichiers inutilisés, sans les supprimer.</p><button id="libraryHealth">Contrôler la bibliothèque</button><p class="muted">Les exports .pulsepack restent la sauvegarde de secours. Une copie de brouillon n’est durable que lorsque le stockage local est effectivement disponible.</p></section>`);
 $('practiceProgress').insertAdjacentHTML('afterend','<div id="pitchWait" class="pitch-wait" hidden><strong>Préparation de la prochaine tentative…</strong><p id="pitchWaitText"></p><button id="cancelPitchLoop">Quitter l’entraînement</button></div>');
 $('tempoList').parentElement.insertAdjacentHTML('afterend',`<details class="meter-editor" open><summary>SIGNATURES & ACCENTS</summary><p>Les pulsations sont comptées en noires depuis l’origine de la grille. Un changement commence au début d’une mesure, sans déplacer les notes.</p><div class="meter-form"><label>Pulsation de début<input id="meterBeat" type="number" min="0" step=".5" value="0"></label><label>Numérateur<input id="meterNumerator" type="number" min="1" max="16" value="4"></label><label>Dénominateur<select id="meterDenominator"><option>2</option><option selected>4</option><option>8</option><option>16</option></select></label><label>Groupes, ex. 2+2+3<input id="meterGroups" placeholder="Automatique" maxlength="40"></label></div><div class="buttons"><button id="meterAtCursor">Mesure au curseur</button><button id="meterApply">Appliquer la signature</button></div><div id="meterList"></div></details>`);
 const defaults={preservePitchDefault:false,practiceClicksDefault:true,midiMapping:[60,62,64,65,67,69],midiChannel:0,midiPort:'all'};
 wrap('applySettings',prev=>{for(const [key,value] of Object.entries(defaults))app.settings[key]??=structuredClone(value);try{app.settings.midiMapping=C.midiMapping(app.settings.midiMapping);}catch{app.settings.midiMapping=[...defaults.midiMapping];}if(!Number.isInteger(app.settings.midiChannel)||app.settings.midiChannel<0||app.settings.midiChannel>16)app.settings.midiChannel=0;prev();});
 wrap('renderSettings',prev=>{prev();for(const id of ['preservePitchDefault','practiceClicksDefault'])$(id).checked=!!app.settings[id];app.renderMIDI();});
 for(const id of ['preservePitchDefault','practiceClicksDefault'])bind(id,async()=>{const next={...app.settings,[id]:$(id).checked};await app.store.put('settings',next);app.settings=next;},'change');
 wrap('init',async prev=>{await prev();app.renderSettings();document.documentElement.dataset.v5Ready='true';});
 // One stretch buffer at a time; cancel and release its worker on exit.
 app.cancelPitch=function(){this.pitchGeneration++;this.pitchAbort?.abort();this.pitchAbort=null;this.pitchPreparing=false;$('pitchWait').hidden=true;};
 app.preparePitch=async function(practice){
   if(!practice?.preservePitch||Math.abs(practice.rate-1)<1e-8){audio.stretched=null;return;}
   const generation=this.pitchGeneration;await this.prepareAudio();if(generation!==this.pitchGeneration)throw Error('Préparation audio annulée.');const original=this.buffer;
   if(original.numberOfChannels>2)throw Error('Hauteur conservée : utiliser un fichier mono ou stéréo. Aucun canal multicanal ne sera supprimé.');
   const sr=original.sampleRate,from=Math.floor(Math.max(0,practice.from-1.7)*sr)/sr,to=Math.min(original.duration,practice.to+.25);
   if(practice.to-practice.from>120+1e-7||to-from>121.95)throw Error('Hauteur conservée : choisir un passage de 120 secondes maximum.');
   if(audio.stretched?.original===original&&audio.stretched.from===from&&audio.stretched.to===to&&Math.abs(audio.stretched.rate-practice.rate)<1e-8)return;
   this.pitchAbort?.abort();const controller=new AbortController();this.pitchAbort=controller;
   const lo=Math.floor(from*sr),hi=Math.min(original.length,Math.ceil(to*sr)),channels=[];
   for(let ch=0;ch<Math.min(2,original.numberOfChannels);ch++)channels.push(original.getChannelData(ch).slice(lo,hi));
   if(Math.round((hi-lo)/practice.rate)*channels.length>24000000)throw Error('Mémoire audio : choisir un passage plus court pour cette vitesse.');
   const code=`const stretch=${C.stretchPCM.toString()};onmessage=e=>{try{const result=stretch(e.data.channels,e.data.sampleRate,e.data.rate,p=>postMessage({progress:p}));postMessage({result},result.map(x=>x.buffer));}catch(error){postMessage({error:error.message});}};`;
   const url=URL.createObjectURL(new Blob([code],{type:'text/javascript'}));
   const values=await new Promise((resolve,reject)=>{
     let worker,timer;const cleanup=()=>{clearTimeout(timer);worker?.terminate();URL.revokeObjectURL(url);controller.signal.removeEventListener('abort',abort);};
     const abort=()=>{cleanup();reject(Error('Préparation audio annulée.'));};
     try{worker=new Worker(url);timer=setTimeout(()=>{cleanup();reject(Error('Traitement audio trop long. Choisir une section plus courte.'));},60000);
       worker.onmessage=e=>{if(e.data.progress!==undefined){const text=`Hauteur conservée · ${Math.round(e.data.progress*100)} %`;if(app.busy)$('busyText').textContent=text;if(app.pitchPreparing)$('pitchWaitText').textContent=text;return;}cleanup();e.data.error?reject(Error(e.data.error)):resolve(e.data.result);};
       worker.onerror=()=>{cleanup();reject(Error('Le navigateur bloque le traitement audio local. Désactiver la hauteur conservée ou utiliser le lanceur fourni.'));};
       controller.signal.addEventListener('abort',abort,{once:true});if(controller.signal.aborted)return abort();worker.postMessage({channels,sampleRate:sr,rate:practice.rate},channels.map(c=>c.buffer));
     }catch(e){cleanup();reject(e);}
   });
   if(controller.signal.aborted)throw Error('Préparation audio annulée.');
   const buffer=audio.ctx.createBuffer(values.length,values[0].length,sr);values.forEach((v,i)=>buffer.copyToChannel(v,i));
   audio.stretched={original,buffer,rate:practice.rate,from:lo/sr,to};
 };
 const oldPlay=audio.play.bind(audio);
 audio.play=function(buffer=this.buffer,position=0,rate=1){
   const s=this.stretched;
   if(s?.original!==buffer||Math.abs(s.rate-rate)>1e-8||Math.max(0,position)<s.from-1e-5||position>s.to)return oldPlay(buffer,position,rate);
   this.stop();this.buffer=buffer;this.rate=rate;this.offset=Math.max(0,position);this.anchor=this.ctx.currentTime+Math.max(0,-position/rate);this.source=this.ctx.createBufferSource();this.source.buffer=s.buffer;this.source.playbackRate.value=1;this.source.connect(this.gain);
   this.source.start(this.anchor,C.clamp((this.offset-s.from)/rate,0,Math.max(0,s.buffer.duration-.001)));this.playing=true;this.pausedAt=position;
 };
 audio.stopClicks=function(){for(const o of this.countClicks||[]){try{o.stop();o.disconnect();}catch{}}this.countClicks=[];};
 const previousStop=audio.stop.bind(audio);audio.stop=function(){this.stopClicks();return previousStop();};
 app.schedulePracticeCount=function(){
   if(!this.practice?.countClicks||!this.audio.playing)return;const time=this.practice.from,chart=this.gameChart,local=time-chart.offset;
   let clicks=C.metricClicks(chart,local-1.65,local-.025).filter(x=>x.time+chart.offset>=this.audio.time-.005);
   if(!clicks.length)clicks=[{time:local-.5,strong:true}];
   for(const click of clicks){const at=audio.anchor+(click.time+chart.offset-audio.offset)/audio.rate;if(at<audio.ctx.currentTime)continue;
     const o=audio.ctx.createOscillator(),g=audio.ctx.createGain();o.frequency.value=click.strong?1200:850;g.gain.setValueAtTime(.12,at);g.gain.exponentialRampToValueAtTime(.001,at+.035);o.connect(g);g.connect(audio.sfxGain);o.start(at);o.stop(at+.045);o.onended=()=>{o.disconnect();g.disconnect();};(audio.countClicks??=[]).push(o);
   }
 };
 wrap('practiceDialog',prev=>{prev();const paragraph=[...document.querySelectorAll('#modalContent p')].find(p=>p.textContent.includes('ralenti modifie'));if(paragraph)paragraph.innerHTML='Choisis un ralenti classique ou à hauteur conservée. Les tentatives restent séparées des records normaux.';
   $('practiceStart').insertAdjacentHTML('beforebegin',`<label class="check"><input id="practicePitch" type="checkbox" ${app.settings.preservePitchDefault?'checked':''}> Conserver la hauteur du son (traitement local)</label><label class="check"><input id="practiceClicks" type="checkbox" ${app.settings.practiceClicksDefault?'checked':''}> Décompte sonore avant la tentative</label><p class="muted">Hauteur conservée : passage de 120 s maximum, avec un possible lissage des attaques. La progression prépare le nouveau ralenti entre deux tentatives.</p>`);
   const previous=$('practiceStart').onclick;$('practiceStart').onclick=()=>{app.nextPracticeAudio={preservePitch:$('practicePitch').checked,countClicks:$('practiceClicks').checked};previous();};
 });
 wrap('startGame',async(prev,mode='play',practice=null)=>{
   app.cancelPitch();audio.stretched=null;const options=app.nextPracticeAudio;app.nextPracticeAudio=null;
   if(mode==='practice'){practice=C.safePractice({...practice,preservePitch:options?.preservePitch??practice?.preservePitch??app.settings.preservePitchDefault,countClicks:options?.countClicks??practice?.countClicks??app.settings.practiceClicksDefault},app.song.duration);await app.preparePitch(practice);}
   await prev(mode,practice);app.schedulePracticeCount();
 });
 app.restartPracticeLoop=async function(){
   if(this.pitchPreparing||this.paused||!this.practice)return;
   const token=++this.pitchGeneration;this.pitchPreparing=true;this.paused=true;audio.pause();this.clearSources();
   try{
     this.engine?.reset(this.practice.from,this.practice.to);audio.pausedAt=this.practice.from-1.7;
     if(this.practice.preservePitch&&Math.abs(this.practice.rate-1)>1e-8){$('pitchWait').hidden=false;$('pitchWaitText').textContent='Préparation locale de l’audio…';}
     await this.preparePitch(this.practice);
     if(token!==this.pitchGeneration||this.view!=='game')return;
     audio.play(this.buffer,this.practice.from-1.7,this.practice.rate);$('pvVideo').playbackRate=this.practice.rate;this.bursts=[];this.lastJudgment=null;this.schedulePracticeCount();this.paused=false;
   }catch(e){if(token===this.pitchGeneration){this.paused=false;this.pause();this.toast(e.message,true);}}
   finally{if(token===this.pitchGeneration){this.pitchPreparing=false;$('pitchWait').hidden=true;}}
 };
 bind('cancelPitchLoop',()=>{app.cancelPitch();app.closeModal();return app.showView('library');});
 wrap('showView',async(prev,view)=>{if(view!=='game'){app.cancelPitch();audio.stretched=null;}app.midiLearn=null;if($('cancelMIDILearn'))$('cancelMIDILearn').hidden=true;app.midiRouter?.clear();await prev(view);});
 wrap('resume',async prev=>{if(app.paused&&app.practice?.preservePitch){await app.preparePitch(app.practice);audio.rate=app.practice.rate;}return prev();});
 wrap('pause',prev=>{if(app.pitchPreparing){app.cancelPitch();app.paused=false;}prev();app.midiRouter?.clear();});
 // Meter-aware studio: edits keep the original source immutable via existing history.
 app.renderMeters=function(){if(!ed.chart)return;const rows=$('meterList');rows.replaceChildren();
   for(const m of C.meterMap(ed.chart)){const row=document.createElement('div');row.className='event-row';row.innerHTML=`<span>Mesure ${m.bar} · pulsation ${m.beat} · <b>${m.numerator}/${m.denominator}</b> · ${m.groups.join('+')}</span><button>Modifier</button>${m.beat?'<button aria-label="Retirer la signature">×</button>':''}`;
     row.querySelector('button').onclick=()=>{$('meterBeat').value=m.beat;$('meterNumerator').value=m.numerator;$('meterDenominator').value=m.denominator;$('meterGroups').value=m.groups.join('+');};
     if(m.beat)row.querySelectorAll('button')[1].onclick=()=>{const before=structuredClone(ed.chart);ed.chart.meterMap=C.meterMap(ed.chart).filter(x=>x.beat!==m.beat).map(({bar,span,...x})=>x);ed.commit(before);app.renderMeters();};rows.append(row);
   }
 };
 for(const name of ['load','fill','commit','undo','redo']){const prev=ed[name].bind(ed);ed[name]=(...args)=>{const r=prev(...args);if($('meterList'))app.renderMeters();return r;};}
 bind('meterAtCursor',()=>{if(!ed.chart)return;const beat=C.timeToBeat(ed.chart,ed.cursor-ed.chart.offset)-C.timeToBeat(ed.chart,ed.chart.gridOffset||0),m=C.metricAt(ed.chart,beat);$('meterBeat').value=Math.max(0,m.start).toFixed(3);});
 bind('meterApply',()=>{if(!ed.chart)return;const before=structuredClone(ed.chart),text=$('meterGroups').value.trim(),m={beat:Number($('meterBeat').value),numerator:Number($('meterNumerator').value),denominator:Number($('meterDenominator').value)};if(text)m.groups=text.split(/[+,\s]+/).map(Number);
   ed.chart.meterMap=[...C.meterMap(ed.chart).filter(x=>Math.abs(x.beat-m.beat)>1e-7).map(({bar,span,...x})=>x),m];ed.commit(before);app.renderMeters();ed.resetClick();
 });
 ed.resetClick=function(){if(this.chart)this.clickUntil=this.cursor-this.chart.offset-.02;};
 const oldUpdate=ed.update.bind(ed);
 ed.update=function(){const on=this.metronome;if(this.listening&&on){const now=audio.time-this.chart.offset;if(this.clickUntil===undefined||now<this.clickUntil-.4)this.clickUntil=now-.02;const end=now+.12;if(end>this.clickUntil){for(const click of C.metricClicks(this.chart,this.clickUntil+1e-6,end)){const t=click.time+this.chart.offset;if(t>=audio.time-.01)audio.clickAt(t,click.strong||click.accent);}this.clickUntil=end;}}
   this.metronome=false;try{return oldUpdate();}finally{this.metronome=on;}
 };
 ed.autoPV=function(){if(!this.chart)return;app.openModal('<div class="eyebrow">PV / MESURES MUSICALES</div><h2>UN MONTAGE À LA MESURE.</h2><p>Un nouveau plan toutes les quatre mesures, avec les signatures et changements de tempo du studio. Les anciens plans ne sont remplacés qu’après validation.</p><button id="confirmAutoPV" class="primary">CRÉER LE MONTAGE</button>');$('confirmAutoPV').onclick=()=>app.run(async()=>{const events=C.autoMetricPV(this.chart,app.song.duration,app.song.scene.stage),next={...app.song,scene:{...app.song.scene,events}};await app.store.put('songs',next);Object.assign(app.song,next);app.stage.events=events;this.renderEvents();app.closeModal();app.toast(`${events.length} plans créés selon la carte de mesures.`);},'Enregistrement du montage…');};
 // MIDI: explicit permission, no sysex, note-on/off and all-notes-off only.
 app.midiRouter=new C.MidiInputRouter({onPress:(key,lane,stamp)=>app.pressSource(key,lane,stamp),onRelease:(key,stamp)=>app.releaseSource(key,stamp)});
 app.renderMIDI=function(){if(!$('midiMapRows'))return;const available=!!navigator.requestMIDIAccess&&isSecureContext;$('connectMIDI').disabled=this.midiEnabled;$('disconnectMIDI').disabled=!this.midiEnabled;$('midiConfig').hidden=!this.midiEnabled;
   if(!this.midiEnabled){$('midiLiveStatus').textContent=available?'MIDI déconnecté. La connexion demandera ton autorisation.':'Web MIDI indisponible dans ce contexte. L’import de fichiers MIDI reste utilisable.';return;}
   const entries=[...this.midiAccess.inputs.values()].filter(p=>p.state==='connected');$('midiLiveStatus').textContent=entries.length?`${entries.length} entrée(s) connectée(s) · aucun envoi MIDI.`:'Autorisation accordée, mais aucune entrée MIDI connectée.';
   const ports=$('midiPort');ports.replaceChildren(new Option('Toutes les entrées','all'));for(const p of entries)ports.add(new Option(p.name||p.id,p.id));const selected=this.settings.midiPort||'all';if(selected!=='all'&&!entries.some(p=>p.id===selected)){ports.add(new Option('Entrée sélectionnée déconnectée',selected));$('midiLiveStatus').textContent='Entrée sélectionnée déconnectée. Rebrancher cet appareil ou choisir une autre entrée.';}ports.value=selected;$('midiChannel').value=this.settings.midiChannel||0;
   const rows=$('midiMapRows');rows.replaceChildren();this.settings.midiMapping.forEach((note,lane)=>{const row=document.createElement('div');row.className='midi-map-row';row.innerHTML=`<b>${C.LANES[lane]}</b><input type="number" min="0" max="127" value="${note}" aria-label="Note MIDI ${C.LANES[lane]}"><button>Apprendre</button>`;row.querySelector('input').onchange=()=>app.setMIDINote(lane,Number(row.querySelector('input').value)).catch(e=>{app.toast(e.message,true);app.renderMIDI();});row.querySelector('button').onclick=()=>{app.midiRouter.clear();app.midiLearn=lane;$('midiLiveStatus').textContent=`Joue une note MIDI pour ${C.LANES[lane]}.`;$('cancelMIDILearn').hidden=false;};rows.append(row);});
 };
 app.setMIDINote=async function(lane,note){const mapping=[...this.settings.midiMapping],old=mapping[lane],duplicate=mapping.indexOf(note);if(duplicate>=0&&duplicate!==lane)mapping[duplicate]=old;mapping[lane]=note;const valid=C.midiMapping(mapping),prefs={...this.settings,midiMapping:valid};await this.store.put('settings',prefs);this.settings=prefs;this.midiRouter.configure(valid,this.settings.midiChannel);this.midiLearn=null;$('cancelMIDILearn').hidden=true;this.renderMIDI();};
 app.wireMIDIPorts=function(){for(const p of this.midiPorts.values())p.onmidimessage=null;this.midiPorts.clear();
   for(const port of this.midiAccess.inputs.values())if(port.state==='connected'){
     this.midiPorts.set(port.id,port);port.onmidimessage=e=>{if(!this.midiEnabled)return;const data=e.data;
       if(this.midiLearn!==null&&(data[0]&240)===144&&data[2]>0&&(this.settings.midiPort==='all'||this.settings.midiPort===port.id)&&(!this.settings.midiChannel||this.settings.midiChannel===(data[0]&15)+1)){const lane=this.midiLearn;this.midiLearn=null;this.setMIDINote(lane,data[1]).catch(err=>this.toast(err.message,true));return;}
       const accepts=!this.busy&&!$('modal').open&&((this.view==='game'&&!this.paused&&['play','practice'].includes(this.mode))||(this.view==='editor'&&ed.recording))&&(this.settings.midiPort==='all'||this.settings.midiPort===port.id);
       const result=this.midiRouter.receive(port.id,data,e.timeStamp,accepts);if(result?.kind==='on'&&$('midiLiveStatus'))$('midiLiveStatus').textContent=`${port.name||'MIDI'} · canal ${result.channel} · note ${result.note} → ${C.LANES[result.lane]}`;
     };
   }
   this.renderMIDI();
 };
 app.handleMIDIStateChange=function(e){if(e.port?.state==='disconnected')this.midiRouter.clear(e.port.id);this.wireMIDIPorts();};
 app.connectMIDI=async function(){if(!navigator.requestMIDIAccess||!isSecureContext)throw Error('Web MIDI indisponible. Utiliser un navigateur compatible sur HTTPS ou le serveur local ; les fichiers MIDI restent importables.');
   const access=await navigator.requestMIDIAccess({sysex:false});this.midiAccess=access;this.midiEnabled=true;this.midiRouter.configure(this.settings.midiMapping,this.settings.midiChannel);
   access.onstatechange=e=>this.handleMIDIStateChange(e);this.wireMIDIPorts();
 };
 app.disconnectMIDI=function(){this.midiRouter.clear();for(const port of this.midiPorts.values())port.onmidimessage=null;this.midiPorts.clear();if(this.midiAccess)this.midiAccess.onstatechange=null;this.midiEnabled=false;this.midiLearn=null;$('cancelMIDILearn').hidden=true;this.renderMIDI();};
 bind('connectMIDI',()=>app.connectMIDI());bind('disconnectMIDI',()=>app.disconnectMIDI());bind('cancelMIDILearn',()=>{app.midiLearn=null;$('cancelMIDILearn').hidden=true;app.renderMIDI();});
 for(const id of ['midiChannel','midiPort'])bind(id,async()=>{app.midiRouter.clear();const next={...app.settings,[id]:id==='midiChannel'?Number($(id).value):$(id).value};await app.store.put('settings',next);app.settings=next;app.midiRouter.configure(next.midiMapping,next.midiChannel);},'change');
 window.addEventListener('blur',()=>app.midiRouter.clear());document.addEventListener('visibilitychange',()=>{if(document.hidden)app.midiRouter.clear();});
 const previousEdStop=ed.stop.bind(ed);ed.stop=function(){app.midiRouter.clear();return previousEdStop();};
 // Library diagnostics never delete or silently rewrite personal data.
 app.libraryHealth=async function(){const songs=await this.store.all('songs'),assets=await this.store.all('assets'),scores=await this.store.all('scores');const report=C.storageAudit(songs,assets,scores);report.persistent=this.store.persistent;report.storageReason=this.store.reason||null;report.quarantined=(this.quarantinedSongs||[]).map(s=>({id:s.raw?.id,error:s.error}));report.created=new Date().toISOString();this.lastStorageAudit=report;
   this.openModal(`<div class="eyebrow">BIBLIOTHÈQUE / LECTURE SEULE</div><h2>${report.issues.length||report.quarantined.length?'POINTS À VÉRIFIER.':'BIBLIOTHÈQUE CONTRÔLÉE.'}</h2><div class="health-counts"><b>${report.songs} morceaux enregistrés</b><b>${report.assets} médias</b><b>${(report.bytes/1048576).toFixed(2)} Mo</b></div><p>${report.persistent?'IndexedDB actif sur cette origine.':'TEMPORAIRE : ces données peuvent disparaître à la fermeture.'} ${esc(report.storageReason||'')}</p><p>${report.unused.length} média(s) non référencé(s), conservé(s) par précaution. ${report.issues.length} anomalie(s), ${report.quarantined.length} morceau(x) écarté(s) au démarrage sans suppression.</p><div id="healthIssues" class="audit-list"></div><div class="buttons"><button id="exportHealth">Exporter le diagnostic</button><button id="healthBackup" class="primary">Sauvegarder la bibliothèque</button></div>${report.quarantined.length?'<button id="exportQuarantine">Exporter les données brutes non chargées</button>':''}<p class="muted">Les démos non modifiées peuvent être créées en mémoire : elles ne figurent pas forcément dans le nombre de morceaux enregistrés.</p>`);
   for(const issue of report.issues){const p=document.createElement('p');p.textContent=`${issue.kind} · ${issue.song||issue.id||''} ${issue.error||issue.role||''}`;$('healthIssues').append(p);}
   $('exportHealth').onclick=()=>S.download(JSON.stringify(report,null,2),'DIVA_PULSE_DIAGNOSTIC_V5.json');$('healthBackup').onclick=()=>this.run(()=>this.exportBackup(),'Sauvegarde…');if($('exportQuarantine'))$('exportQuarantine').onclick=()=>S.download(JSON.stringify(this.quarantinedSongs,null,2),'DIVA_PULSE_DONNEES_NON_CHARGEES.json');
 };
 bind('libraryHealth',()=>app.run(()=>app.libraryHealth(),'Contrôle de la bibliothèque…'));
 // User-visible storage errors must never leave a green "saved" badge.
 const oldOpen=app.store.open.bind(app.store);app.store.open=async function(){await oldOpen();if(this.db){const previous=this.db.onversionchange;this.db.onversionchange=e=>{previous?.(e);this.invalidated=true;this.persistent=false;$('saveStatus').textContent='RECHARGER';app.toast('La connexion au stockage a changé. Recharger le jeu avant de modifier la bibliothèque.',true,15000);};this.db.onclose=()=>{this.invalidated=true;this.persistent=false;this.reason='Connexion au stockage fermée. Recharger le jeu.';$('saveStatus').textContent='RECHARGER';};}return this;};
 for(const name of ['get','all','put','del','atomic']){const prev=app.store[name].bind(app.store);app.store[name]=(...args)=>{if(app.store.invalidated)return Promise.reject(Error(app.store.reason||'Stockage fermé : recharger le jeu.'));return prev(...args);};}
 wrap('help',prev=>{prev();const p=document.createElement('p');p.textContent='V5 : ralentis à hauteur conservée, signatures 3/4, 6/8, 7/8 et personnalisées, accents et contrôleurs MIDI en direct. La hauteur conservée traite seulement le passage d’entraînement, sans modifier le fichier audio ou les notes.';document.querySelector('#modalContent .dialog').append(p);});
}
root.PulseV5=install;
})(globalThis);
