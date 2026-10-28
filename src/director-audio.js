/* V31 isolated audition transport. Shares an AudioContext, never the game source.
 * AudioContext.currentTime is the only playback clock. A/B repetition is done
 * by AudioBufferSourceNode, not by a JavaScript timer restarting the sound. */
(function(root){
'use strict';
function finite(n,label,min,max){if(typeof n!=='number'||!Number.isFinite(n)||n<min||n>max)throw Error(label+' hors plage.');return n;}
class DirectorAudio {
 constructor(context,buffer,duration){
  if(!context||!buffer)throw Error('Audio Director non préparé.');
  this.duration=Math.min(finite(duration,'Durée',.1,7200),finite(buffer.duration,'Durée audio',.1,7200));
  this.context=context;this.buffer=buffer;this.source=null;this.playing=false;this.disposed=false;
  this.position=0;this.anchor=0;this.rate=1;this.volume=.65;this.loop=null;
  this.gain=context.createGain();this.gain.gain.value=this.volume;this.gain.connect(context.destination);
 }
 guard(){if(this.disposed)throw Error('Aperçu fermé.');}
 get time(){
  let t=this.playing?this.position+Math.max(0,this.context.currentTime-this.anchor)*this.rate:this.position;
  if(this.playing&&this.loop&&t>=this.loop.end)t=this.loop.start+(t-this.loop.start)%(this.loop.end-this.loop.start);
  return Math.max(0,Math.min(this.duration,t));
 }
 detach(){const s=this.source;this.source=null;this.playing=false;if(s){s.onended=null;try{s.stop();}catch{}s.disconnect();}}
 play(position=this.position){
  this.guard();finite(position,'Curseur',0,this.duration);this.detach();
  if(this.loop&&(position<this.loop.start||position>=this.loop.end))position=this.loop.start;
  this.position=position;
  if(position>=this.duration)return false;
  const s=this.context.createBufferSource();s.buffer=this.buffer;s.playbackRate.value=this.rate;
  if(this.loop){s.loop=true;s.loopStart=this.loop.start;s.loopEnd=this.loop.end;}
  s.connect(this.gain);this.anchor=this.context.currentTime;this.source=s;this.playing=true;
  s.onended=()=>{if(this.source!==s)return;this.position=this.duration;this.source=null;this.playing=false;s.disconnect();};
  try{s.start(this.anchor,position);if(!this.loop)s.stop(this.anchor+(this.duration-position)/this.rate);}
  catch(e){this.detach();throw e;}
  return true;
 }
 pause(){this.guard();const t=this.time;this.detach();this.position=t;return t;}
 seek(position){this.guard();finite(position,'Curseur',0,this.duration);if(this.playing)this.play(position);else this.position=position;return this.time;}
 setRate(rate){this.guard();finite(rate,'Vitesse audio',.25,2);const t=this.time,playing=this.playing;this.detach();this.rate=rate;this.position=t;if(playing)this.play(t);}
 setVolume(volume){this.guard();finite(volume,'Volume',0,1);this.volume=volume;this.gain.gain.setTargetAtTime(volume,this.context.currentTime,.015);}
 setLoop(start,end,enabled){
  this.guard();if(enabled){finite(start,'Début de boucle',0,this.duration);finite(end,'Fin de boucle',0,this.duration);if(end-start<.05)throw Error('Boucle : au moins 0,05 seconde.');}
  const t=this.time,playing=this.playing;this.detach();this.position=t;this.loop=enabled?{start,end}:null;if(playing)this.play(t);
 }
 dispose(){if(this.disposed)return;this.detach();this.gain.disconnect();this.buffer=null;this.disposed=true;}
}
root.PulseDirectorAudio=DirectorAudio;if(typeof module!=='undefined')module.exports=DirectorAudio;
})(globalThis);
