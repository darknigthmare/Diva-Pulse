/* V34: informational hold gauge and audio-interruption handling. No score writes.
 * A hidden document never resumes automatically. Cosmetic sounds remain optional.
 */
(function(root){
'use strict';
function holds(engine,time){
 if(!Number.isFinite(time))return [];
 return [...(engine?.activeHolds?.entries()||[])].slice(0,6).flatMap(([lane,h])=>{
  if(!Number.isInteger(lane)||lane<0||lane>5||!h?.note||!Number.isFinite(h.start)||!Number.isFinite(h.end)||h.end<=h.start||time<h.start||time>=h.end)return [];
  return [{lane,id:h.note.id,start:h.start,end:h.end,progress:Math.max(0,Math.min(1,(time-h.start)/(h.end-h.start)))}];
 });
}
function install(app){
 const $=id=>document.getElementById(id),wrap=(key,fn)=>{const old=app[key].bind(app);app[key]=(...a)=>fn(old,...a);};
 let boundContext=null,epoch=0,takeEpoch=0,lastPaint=0;
 const stopPreview=()=>{
  epoch++;
  if(app.directorAudition?.playing){app.pauseDirectorAudition();if($('directorMessage'))$('directorMessage').textContent='Écoute mise en pause. Reprendre explicitement pour continuer.';}
  if(app.editor?.listening||app.editor?.recording)app.editor.stop();
  // Preparing the next loop is paused internally but still needs the pause UI.
  if(app.view==='game'&&(!app.paused||app.pitchPreparing))app.pause();
  app.cancelPitch?.();
  app.feedback33?.sounds.stop();
 };
 const interrupted=()=>{if(boundContext&&boundContext.state!=='running')stopPreview();};
 const attach=()=>{const ctx=app.audio.ctx;if(ctx===boundContext)return;if(boundContext)boundContext.removeEventListener?.('statechange',interrupted);boundContext=ctx;ctx?.addEventListener?.('statechange',interrupted);};
 // Statechange can be delayed, so reconcile before inputs and rendering too.
 const reconcile=()=>{attach();if((document.hidden||boundContext?.state==='interrupted'||boundContext?.state==='suspended'||boundContext?.state==='closed')&&((app.view==='game'&&((!app.paused&&app.audio.playing)||app.pitchPreparing))||app.directorAudition?.playing||app.editor?.listening))stopPreview();};
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stopPreview();});
 window.addEventListener('pagehide',stopPreview);
 wrap('resume',async(old,...args)=>{try{return await old(...args);}catch(e){app.toast('Reprise audio impossible : '+e.message,true);return false;}});
 const init=app.audio.init.bind(app.audio);app.audio.init=async(...args)=>{const c=await init(...args);attach();return c;};
 const content=document.createElement('div');content.id='holdMeter34';content.setAttribute('aria-label','Progression des maintiens');content.hidden=true;
 const cells=[];
 for(let lane=0;lane<6;lane++){
  const el=document.createElement('div');el.className='hold-cell34';el.hidden=true;
  const text=document.createElement('span'),bar=document.createElement('span'),fill=document.createElement('i');bar.className='hold-bar34';bar.append(fill);el.append(text,bar);content.append(el);cells.push({el,text,fill,last:-1});
 }
 $('game').append(content);
 $('feedbackSettings33').insertAdjacentHTML('beforeend','<label class="check"><input id="holdGauge34" type="checkbox"> Jauges de maintien lisibles, même sans éclats</label><p>La jauge suit le maintien réel. Elle n’attribue aucun bonus supplémentaire et reste immobile en pause. Une interruption audio impose une reprise manuelle.</p>');
 const sync=()=>{$('holdGauge34').checked=app.settings.holdGauge!==false;};
 wrap('applySettings',old=>{old();sync();if(app.settings.holdGauge===false)content.hidden=true;});
 wrap('renderSettings',old=>{old();sync();});
 $('holdGauge34').onchange=()=>app.run(async()=>{const next={...app.settings,holdGauge:$('holdGauge34').checked};try{await app.store.put('settings',next);app.settings=next;app.applySettings();}finally{sync();}},'Enregistrement de la jauge…');
 const clear=()=>{content.hidden=true;for(const c of cells){c.el.hidden=true;c.last=-1;}};
 const paint=ts=>{
  if(app.view!=='game'||app.settings.holdGauge===false||app.finishing){clear();return;}
  if(app.paused)return;
  if(ts-lastPaint<70)return;lastPaint=ts;
  const list=holds(app.engine,app.engine?.lastTime??app.audio.time),active=new Set(list.map(h=>h.lane));content.hidden=!list.length;
  for(let i=0;i<6;i++)if(!active.has(i)){cells[i].el.hidden=true;cells[i].last=-1;}
  for(const h of list){const c=cells[h.lane],pct=Math.floor(h.progress*100);c.el.hidden=false;
   if(pct!==c.last){c.last=pct;c.text.textContent=root.PulseCore.LANES[h.lane]+' HOLD '+pct+' %';c.fill.style.transform=`scaleX(${h.progress})`;}
  }
 };
 wrap('frame',(old,ts)=>{reconcile();const out=old(ts);paint(ts);return out;});
 wrap('pressSource',(old,...args)=>{reconcile();if(app.view==='game'&&(document.hidden||app.audio.ctx?.state!=='running'))return;return old(...args);});
 wrap('showView',(old,view,...args)=>{epoch++;takeEpoch++;if(view!=='game')clear();return old(view,...args);});
 wrap('startGame',async(old,...args)=>{epoch++;takeEpoch++;clear();const result=await old(...args);attach();if(document.hidden||app.audio.ctx?.state!=='running')stopPreview();try{app.feedback33?.sounds.prewarm?.(app.settings);}catch{/* Cosmetic preparation must not stop an otherwise playable song. */}return result;});
 // The core resume rechecks the epoch as well as chart identity after init.
 app.liveEpoch34=()=>epoch;
 app.liveTakeEpoch=()=>takeEpoch;
 app.drawHoldGauges34=paint;app.reconcileAudio34=reconcile;sync();
 document.documentElement.dataset.live34Ready='true';
}
root.PulseLive34={holds,install};if(typeof module!=='undefined')module.exports=root.PulseLive34;
})(globalThis);
