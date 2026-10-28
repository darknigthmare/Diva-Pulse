/* V33: bounded cosmetic feedback. This module never changes judgments or scores.
 * Audio is procedural/original; no downloaded samples. Times are monotonic ms.
 */
(function(root){
'use strict';
const MAX_EFFECTS=48,MAX_VOICES=12,MAX_CACHE=96;
const STYLES=['pulse','arcade','soft'];
const RATINGS=['COOL','FINE','SAFE','SAD','MISS','WRONG'];
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
function options(raw={}){
 if(!raw||typeof raw!=='object')raw={};
 return {vfxIntensity:typeof raw.vfxIntensity==='number'&&Number.isFinite(raw.vfxIntensity)?clamp(raw.vfxIntensity,0,1):.7,
 sfxStyle:STYLES.includes(raw.sfxStyle)?raw.sfxStyle:'pulse',missSound:raw.missSound===true};
}
function cue(event,when){
 if(!event||!RATINGS.includes(event.rating)||!Number.isFinite(when))return null;
 const n=event.note,lane=n?.lane;
 return {rating:event.rating,lane:Number.isInteger(lane)&&lane>=0&&lane<6?lane:0,
  x:Number.isFinite(n?.x)?clamp(n.x,0,1):.5,y:Number.isFinite(n?.y)?clamp(n.y,0,1):.5,
  visible:!!n&&Number.isFinite(n.x)&&Number.isFinite(n.y),slide:n?.type==='slide'||n?.type==='chain',
  when,duration:['MISS','WRONG'].includes(event.rating)?230:360};
}
class Effects{
 constructor(){this.clear();this.dropped=0;}
 clear(){this.items=[];this.combo=0;this.milestone=0;}
 push(event,when){const c=cue(event,when);if(!c)return null;
  this.combo=['COOL','FINE'].includes(c.rating)?this.combo+1:0;
  c.milestone=this.combo>0&&this.combo%25===0?this.combo:0;
  if(c.milestone)this.milestone=c.milestone;
  if(this.items.length>=MAX_EFFECTS){this.items.shift();this.dropped++;}
  if(c.visible)this.items.push(c);return c;
 }
 frame(now){if(!Number.isFinite(now)){this.items=[];return [];}
  this.items=this.items.filter(c=>now>=c.when&&now-c.when<c.duration);
  return this.items.map(c=>({...c,progress:(now-c.when)/c.duration}));
 }
}
function soundSpec(event,style='pulse'){
 const c=cue(event,0);if(!c)return null;style=STYLES.includes(style)?style:'pulse';
 const good=['COOL','FINE'].includes(c.rating),bad=['SAD','MISS','WRONG'].includes(c.rating);
 return {frequency:bad?145+(c.lane*9):520+c.lane*82,duration:bad?.085:c.slide?.11:.075,
  brightness:style==='arcade'?.26:style==='soft'?.03:.12,
  sweep:bad?.65:c.slide?1.55:.67,harmonic:c.rating==='COOL'?.22:0,
  attack:style==='soft'?.006:.0025,level:good?.8:.55};
}
function pcm(spec,sampleRate){
 if(!spec||!Number.isFinite(sampleRate)||sampleRate<8000||sampleRate>192000)throw Error('Fréquence audio hors plage.');
 for(const k of ['frequency','duration','brightness','sweep','harmonic','attack','level'])if(!Number.isFinite(spec[k]))throw Error('Son invalide.');
 if(spec.frequency<20||spec.frequency>4000||spec.duration<=0||spec.duration>.25||spec.attack<=0||spec.attack>=spec.duration||spec.sweep<=0||spec.sweep>4)throw Error('Son hors plage.');
 const out=new Float32Array(Math.ceil(sampleRate*spec.duration));let phase=0;
 for(let i=0;i<out.length;i++){
  const t=i/sampleRate,u=i/Math.max(1,out.length-1);phase+=2*Math.PI*spec.frequency*(1+(spec.sweep-1)*u)/sampleRate;
  const attack=Math.min(1,t/spec.attack),release=(1-u)*(1-u),env=attack*release;
  const wave=Math.sin(phase)+spec.brightness*Math.sin(phase*3)+spec.harmonic*Math.sin(phase*2);
  out[i]=clamp(wave/(1+Math.abs(spec.brightness)+Math.abs(spec.harmonic))*env*clamp(spec.level,0,1),-1,1);
 }
 out[0]=out[out.length-1]=0;return out;
}
class SoundBank{
 constructor(audio){this.audio=audio;this.cache=new Map();this.voices=new Set();this.stats={played:0,dropped:0};}
 stop(){for(const v of [...this.voices]){try{v.source.stop();}catch{}v.cleanup();}}
 play(event,settings={}){try{return this._play(event,settings||{});}catch{this.stats.dropped++;return false;}}
 prepareContext(ctx){if(this.context!==ctx){this.stop();this.cache.clear();this.context=ctx;}}
 bufferFor(ctx,event,style){
  const spec=soundSpec(event,style);if(!spec)return null;
  const key=JSON.stringify([ctx.sampleRate,style,spec]);let buffer=this.cache.get(key);
  if(!buffer){const data=pcm(spec,ctx.sampleRate);buffer=ctx.createBuffer(1,data.length,ctx.sampleRate);buffer.copyToChannel(data,0);
   if(this.cache.size>=MAX_CACHE)this.cache.delete(this.cache.keys().next().value);this.cache.set(key,buffer);}
  return buffer;
 }
 prewarm(settings={}){
  const ctx=this.audio.ctx;if(!ctx||ctx.state!=='running')return 0;
  this.prepareContext(ctx);const style=options(settings).sfxStyle;let count=0;
  for(const rating of RATINGS)for(let lane=0;lane<6;lane++)for(const type of ['tap','slide']){this.bufferFor(ctx,{rating,note:{lane,type}},style);count++;}
  return count;
 }
 _play(event,settings){
  const a=this.audio,ctx=a.ctx,opts=options(settings);
  if(!ctx||ctx.state!=='running'||!a.sfxGain||settings.hitSound===false||!(a.sfxVolume>0))return false;
  if(['MISS','WRONG','SAD'].includes(event?.rating)&&!opts.missSound)return false;
  const spec=soundSpec(event,opts.sfxStyle);if(!spec)return false;
  this.prepareContext(ctx);
  if(this.voices.size>=MAX_VOICES){this.stats.dropped++;return false;}
  const buffer=this.bufferFor(ctx,event,opts.sfxStyle);
  const source=ctx.createBufferSource(),gain=ctx.createGain();gain.gain.value=.12;source.buffer=buffer;
  const v={source,cleanup:()=>{source.onended=null;try{source.disconnect();gain.disconnect();}catch{}this.voices.delete(v);}};
  try{source.connect(gain);gain.connect(a.sfxGain);source.onended=v.cleanup;this.voices.add(v);source.start();this.stats.played++;return true;}
  catch{v.cleanup();this.stats.dropped++;return false;}
 }
}
function install(app){
 const $=id=>document.getElementById(id),C=root.PulseCore;
 const wrap=(name,fn)=>{const old=app[name].bind(app);app[name]=(...args)=>fn(old,...args);};
 const motion=matchMedia('(prefers-reduced-motion: reduce)'),effects=new Effects(),sounds=new SoundBank(app.audio);
 app.feedback33={effects,sounds};
 const reduced=()=>motion.matches||app.settings.reduceMotion===true;
 const reset=()=>{effects.clear();sounds.stop();};
 app.consumeFeedback33=(event,now)=>{const c=effects.push(event,now);if(c&&!app.paused)sounds.play(event,app.settings);};
 app.drawFeedback33=function(ctx,rect,rad,now,time){
  const list=effects.frame(now),opts=options(this.settings);if(this.settings.reducedEffects||opts.vfxIntensity<=0)return;
  const calm=reduced()||this.settings.graphicsQuality===0,intensity=opts.vfxIntensity;
  const palette=['#82f5ce','#ffb2db','#9fc5ff','#ffd0a3','#86edf3','#86edf3'];
  ctx.save();try{
   for(const c of list){const x=rect.x+c.x*rect.width,y=rect.y+c.y*rect.height,p=c.progress;
    const good=['COOL','FINE'].includes(c.rating),color=good?palette[c.lane]:c.rating==='SAFE'?'#ffe4a8':'#ff9dad';
    const radius=rad+5+(calm?0:p*(good?32:9));ctx.globalAlpha=(1-p)*intensity;ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=calm?2:Math.max(1,2.6*(1-p));
    ctx.beginPath();
    if(good){ctx.arc(x,y,radius,0,Math.PI*2);ctx.stroke();
     if(!calm&&c.rating==='COOL'){const sparks=this.settings.graphicsQuality<1?4:8;for(let i=0;i<sparks;i++){const angle=i/sparks*Math.PI*2+(c.lane*.3),r=radius+6;ctx.beginPath();ctx.moveTo(x+Math.cos(angle)*r,y+Math.sin(angle)*r);ctx.lineTo(x+Math.cos(angle)*(r+5*(1-p)),y+Math.sin(angle)*(r+5*(1-p)));ctx.stroke();}}
     if(c.slide&&!calm){ctx.beginPath();const d=c.lane===4?-1:1;ctx.moveTo(x-d*(radius+12),y-6);ctx.lineTo(x-d*radius,y);ctx.lineTo(x-d*(radius+12),y+6);ctx.stroke();}
    }else{ctx.moveTo(x-7,y-7);ctx.lineTo(x+7,y+7);ctx.moveTo(x+7,y-7);ctx.lineTo(x-7,y+7);ctx.stroke();}
   }
   // Essential hold feedback is deliberately static in reduced-motion mode.
   for(const h of this.engine?.activeHolds?.values()||[]){const n=h.note,span=h.end-h.start;if(!n||span<=0||!Number.isFinite(time))continue;
    const p=clamp((time-h.start)/span,0,1);ctx.globalAlpha=.75*intensity;ctx.strokeStyle='#ffe4a8';ctx.lineWidth=3;ctx.beginPath();ctx.arc(rect.x+n.x*rect.width,rect.y+n.y*rect.height,rad+7,-Math.PI/2,-Math.PI/2+Math.PI*2*p);ctx.stroke();
   }
  }finally{ctx.restore();}
 };
 $('settings').insertAdjacentHTML('beforeend',`<section class="settings-card" id="feedbackSettings33"><div class="eyebrow">33 / RESSENTI DU LIVE</div><h2>CHAQUE FRAPPE COMPTE.</h2><p>Halo précis pour COOL, anneau pour FINE, croix discrète pour une erreur et jauge de maintien. Aucun changement de score ni de fenêtre de jugement.</p><label>Intensité des effets<input id="vfxIntensity" type="range" min="0" max="1" step=".05"><output id="vfxIntensityOut"></output></label><label>Signature sonore<select id="sfxStyle"><option value="pulse">Pulse · cristal</option><option value="arcade">Arcade · harmonique</option><option value="soft">Soft · doux</option></select></label><label class="check"><input id="missSound" type="checkbox"> Signaler les erreurs par un son discret</label><button id="testFeedback33">Écouter le son de réussite</button><p id="motionPreference33" role="status"></p><p>Les effets respectent « Réduire les éclats », « Réduire les mouvements » et la préférence du système. Au maximum 48 impacts et 12 sons simultanés ; aucun flash plein écran.</p></section>`);
 const sync=()=>{const o=options(app.settings);$('vfxIntensity').value=o.vfxIntensity;$('vfxIntensityOut').textContent=Math.round(o.vfxIntensity*100)+' %';$('sfxStyle').value=o.sfxStyle;$('missSound').checked=o.missSound;$('motionPreference33').textContent=reduced()?'Mouvements réduits : halos fixes, sans particules.':'Effets localisés actifs ; symboles et timing prioritaires.';};
 wrap('applySettings',prev=>{Object.assign(app.settings,options(app.settings));prev();app.stage.reduceMotion=reduced();
  if(app.audio.sfxGain)app.audio.sfxGain.gain.setTargetAtTime(app.audio.sfxVolume,app.audio.ctx.currentTime,.01);
  if(!app.settings.hitSound||app.audio.sfxVolume===0)sounds.stop();sync();});
 wrap('renderSettings',prev=>{prev();sync();});
 for(const id of ['vfxIntensity','sfxStyle','missSound'])$(id).onchange=()=>app.run(async()=>{
  const candidate={...app.settings,[id]:id==='missSound'?$(id).checked:id==='vfxIntensity'?Number($(id).value):$(id).value};
  try{await app.store.put('settings',candidate);app.settings=candidate;app.applySettings();}finally{sync();}
 },'Enregistrement du ressenti…');
 $('testFeedback33').onclick=()=>app.run(async()=>{await app.audio.init();const played=sounds.play({rating:'COOL',note:{lane:0,type:'tap'}},app.settings);app.toast(played?'Son de réussite joué.':'Sons désactivés ou volume nul : aucun son joué.');},'Essai sonore…');
 // Some browsers defer media-query change events while a surface is busy.
 // Reconcile before the existing frame as well, never after stage rendering.
 const syncMotion=()=>{const value=reduced();if(app.stage.reduceMotion!==value){effects.clear();app.stage.reduceMotion=value;sync();}};
 motion.addEventListener?.('change',syncMotion);
 wrap('frame',(prev,ts)=>{syncMotion();return prev(ts);});
 wrap('startGame',async(prev,...args)=>{reset();return prev(...args);});
 wrap('showView',(prev,view,...args)=>{if(view!=='game')reset();return prev(view,...args);});
 wrap('pause',prev=>{reset();return prev();});
 wrap('finish',(...args)=>{reset();const [prev,...rest]=args;return prev(...rest);});
 if(app.restartPracticeLoop)wrap('restartPracticeLoop',(...args)=>{reset();const [prev,...rest]=args;return prev(...rest);});
 // A released pointer capture is a release of that source, never of a second device.
 $('touchControls').addEventListener('lostpointercapture',e=>{if(e.target.closest?.('[data-lane]'))app.releaseSource('touch-'+e.pointerId,e.timeStamp);});
 const press=app.pressSource.bind(app);app.pressSource=(source,lane,stamp)=>{
  if(app.view==='game'&&(app.paused||app.finishing||!['play','practice'].includes(app.mode)))return;
  return press(source,lane,stamp);
 };
 document.documentElement.dataset.feedback33Ready='true';
}
const api={MAX_EFFECTS,MAX_VOICES,MAX_CACHE,STYLES,options,cue,Effects,soundSpec,pcm,SoundBank,install};
root.PulseFeedback33=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
