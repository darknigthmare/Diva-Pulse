/* Tempo-aware editor; all edits are transactions and imported sources remain immutable. */
(function(root){
'use strict';
const C=PulseCore,S=PulseServices,Base=PulseEditor,$=id=>document.getElementById(id),colors=['#83f4b9','#dda7ff','#86c3ff','#ff9abc','#ffdf80','#ffdf80'];
class EditorV3 extends Base {
  constructor(app){super(app);this.selection=new Set();this.clipboard=[];this.metronome=false;this.nextClick=0;this.bindV3();}
  bindV3(){
    const on=(id,fn)=>$(id).addEventListener('click',()=>{try{const p=fn();p?.catch?.(e=>this.app.toast(e.message,true));}catch(e){this.app.toast(e.message,true);}});
    const replace=(id,fn)=>{const el=$(id),fresh=el.cloneNode(true);el.replaceWith(fresh);on(id,fn);};
    replace('quantizeButton',()=>this.transform('quantize',{grid:this.grid}));
    replace('mirrorButton',()=>this.transform('mirror'));
    on('selectAll',()=>this.select(this.chart.notes));on('selectVisible',()=>this.select(this.chart.notes.filter(n=>n.time+this.chart.offset>=this.start&&n.time+this.chart.offset<=this.start+this.zoom)));
    on('selectNone',()=>this.select([]));on('copyNotes',()=>this.copy());on('pasteNotes',()=>this.paste());
    on('shiftNotes',()=>this.transform('shift',{seconds:+$('groupShift').value}));on('swapLanes',()=>this.transform('lanes'));
    on('applyLayout',()=>this.transform('layout',{pattern:$('layoutPattern').value}));
    on('editorMIDI',()=>{if(this.chart)S.download(new Blob([C.exportMIDI(this.chart)],{type:'audio/midi'}),this.chart.title+'.mid');});
    on('editorAudit',()=>this.app.auditDialog(this.chart));
    on('tempoAdd',()=>this.setTempo(+$('tempoTime').value,+$('tempoBpm').value));
    on('tempoAtCursor',()=>{$('tempoTime').value=Math.max(0,this.cursor-this.chart.offset).toFixed(3);$('tempoBpm').value=C.tempoAt(this.chart,this.cursor-this.chart.offset);});
    $('gridOrigin').addEventListener('change',()=>{const before=structuredClone(this.chart);this.chart.gridOffset=+$('gridOrigin').value;this.commit(before);});
    $('timelineScroll').addEventListener('input',()=>this.resetClick());
    $('editorMetronome').addEventListener('change',()=>{this.metronome=$('editorMetronome').checked;this.resetClick();});
    for(const id of ['noteAngle','noteDistance'])$(id).addEventListener('change',()=>{if(!this.note)return;const before=structuredClone(this.chart);this.note.angle=+$('noteAngle').value;this.note.distance=+$('noteDistance').value;this.commit(before);});
    // Replace the base BPM listener: modifying the first tempo must not erase later events.
    const old=$('editorBpm'),newEl=old.cloneNode(true);old.replaceWith(newEl);newEl.addEventListener('change',()=>this.setTempo(0,+newEl.value));
    on('autoPV',()=>this.autoPV());
    for(const [id,key] of [['pvBlend','blend'],['videoOffset','videoOffset']])$(id).addEventListener('change',async()=>{if(id==='pvBlend')this.app.song.scene.blend=C.clamp(+$('pvBlend').value,0,3);else this.app.song.videoOffset=C.clamp(+$('videoOffset').value,-30,30);await this.app.saveSong();this.app.stage.blend=this.app.song.scene.blend;});
  }
  load(chart){super.load(chart);this.selection?.clear();this.renderTempo();}
  async open(){const wanted=this.app.chart;if(this.chart&&this.ownerId===this.app.song.id&&wanted&&wanted.id!==this.originalId&&wanted.id!==this.chart.id){await this.autosave();this.load(wanted);}await super.open();this.renderTempo();$('pvBlend').value=this.app.song.scene.blend??.5;$('videoOffset').value=this.app.song.videoOffset||0;}
  fill(){super.fill();this.renderTempo();}
  get selectedNotes(){const set=this.selection||new Set(this.selected?[this.selected]:[]);return this.chart?.notes.filter(n=>set.has(n.id))||[];}
  ids(){const ids=this.selectedNotes.map(n=>n.id);return ids.length?ids:this.note?[this.note.id]:[];}
  select(notes){this.selection=new Set(notes.map(n=>n.id));this.selected=notes[0]?.id||null;this.renderFields();this.draw();this.status();}
  status(){super.status();if(!this.chart||!this.selection)return;const valid=new Set(this.chart.notes.map(n=>n.id));this.selection=new Set([...this.selection].filter(id=>valid.has(id)));if(this.selected&&!valid.has(this.selected))this.selected=[...this.selection][0]||null;if(this.selected&&!this.selection.size)this.selection.add(this.selected);$('selectionCount').textContent=`${this.selection.size} sélectionnée${this.selection.size>1?'s':''}`;}
  snap(t){return C.snapChartTime(this.chart,t,this.grid);}
  commit(before){try{this.chart=C.validateChart(this.chart);this.history.push(this.chart);this.dirty=true;this.renderFields();this.renderTempo();this.draw();this.status();return true;}catch(e){if(before)this.chart=before;this.app.toast(e.message,true);this.renderFields();this.draw();return false;}}
  transform(op,opts={}){if(!this.chart)return;const before=structuredClone(this.chart);try{this.chart=C.editSelection(this.chart,this.ids(),op,opts);this.commit(before);}catch(e){this.app.toast(e.message,true);}}
  copy(){this.clipboard=structuredClone(this.selectedNotes.length?this.selectedNotes:this.note?[this.note]:[]);this.app.toast(`${this.clipboard.length} note(s) copiée(s).`);}
  paste(at=this.cursor-this.chart.offset){if(!this.clipboard.length)return this.app.toast('Sélectionne puis copie des notes.',true);const before=structuredClone(this.chart);try{const result=C.pasteNotes(this.chart,this.clipboard,Math.max(0,this.snap(at)));this.chart=result.chart;this.selection=new Set(result.ids);this.selected=result.ids[0];this.commit(before);}catch(e){this.app.toast(e.message,true);}}
  duplicate(){const ns=this.selectedNotes.length?this.selectedNotes:this.note?[this.note]:[];if(!ns.length)return;this.clipboard=structuredClone(ns);const last=Math.max(...ns.map(n=>n.time)),step=4/(this.grid||8),beat=C.timeToBeat(this.chart,last);const at=C.beatToTime(this.chart,(Math.floor(beat/step+1e-7)+1)*step);this.paste(at);}
  remove(){if(this.ids().length){this.transform('delete');this.select([]);}}
  renderFields(){super.renderFields();const n=this.note;if(n){$('noteAngle').value=n.angle??0;$('noteDistance').value=n.distance??.65;}}
  setTempo(time,bpm){if(!Number.isFinite(time)||time<0||time>7200||!Number.isFinite(bpm)||bpm<20||bpm>400)return this.app.toast('Temps ≥ 0 et BPM entre 20 et 400 attendus.',true);const before=structuredClone(this.chart);this.chart.tempoMap=this.chart.tempoMap.filter(m=>Math.abs(m.time-time)>1e-7);this.chart.tempoMap.push({time,bpm});if(time===0)this.chart.bpm=bpm;if(this.commit(before))$('editorBpm').value=this.chart.bpm;}
  renderTempo(){if(!this.chart||!$('tempoList'))return;const el=$('tempoList');el.replaceChildren();$('gridOrigin').value=this.chart.gridOffset||0;
    for(const m of this.chart.tempoMap){const row=document.createElement('div');row.className='tempo-row';const label=document.createElement('button');label.textContent=`${m.time.toFixed(3)} s  /  ${m.bpm.toFixed(2)} BPM`;label.onclick=()=>{$('tempoTime').value=m.time;$('tempoBpm').value=m.bpm;this.cursor=m.time+this.chart.offset;this.start=Math.max(0,this.cursor-1);this.draw();};row.append(label);
      if(m.time>0){const del=document.createElement('button');del.textContent='×';del.setAttribute('aria-label','Supprimer le tempo à '+m.time+' secondes');del.onclick=()=>{const before=structuredClone(this.chart);this.chart.tempoMap=this.chart.tempoMap.filter(x=>x.time!==m.time);this.commit(before);};row.append(del);}el.append(row);
    }
  }
  pointerDown(e){if(!this.chart||this.recording)return;const p=this.canvasPoint(e);if(p.x<43)return;const time=this.start+(p.x-43)/(p.w-43)*this.zoom;
    if(p.y<72){this.cursor=C.clamp(time,0,this.app.song.duration||600);if(this.listening)this.app.audio.seek(this.cursor);$('eventTime').value=this.cursor.toFixed(3);this.resetClick();this.draw();return;}
    const lane=C.clamp(Math.floor((p.y-75)/((p.h-75)/6)),0,5),existing=this.chart.notes.find(n=>n.lane===lane&&Math.abs(n.time+this.chart.offset-time)*((p.w-43)/this.zoom)<12);
    if(e.altKey){this.drag={box:true,x:p.x,y:p.y,w:0,h:0};e.target.setPointerCapture(e.pointerId);return;}
    const before=structuredClone(this.chart);
    if(existing){if(e.shiftKey){if(this.selection.has(existing.id))this.selection.delete(existing.id);else this.selection.add(existing.id);this.selected=this.selection.has(existing.id)?existing.id:[...this.selection][0]||null;this.renderFields();this.draw();this.status();return;}
      if(!this.selection.has(existing.id))this.selection=new Set([existing.id]);this.selected=existing.id;
    }else{const n={id:C.uid(),time:this.snap(time-this.chart.offset),lane,type:lane>3?'slide':'tap',duration:0,x:.2+this.chart.notes.length%7*.09,y:.42,approach:1.6};this.chart.notes.push(n);this.selected=n.id;this.selection=new Set([n.id]);}
    this.drag={before,downX:p.x,downY:p.y,originalTime:this.note.time,originalLane:this.note.lane,originals:structuredClone(this.selectedNotes),moved:false};e.target.setPointerCapture(e.pointerId);this.renderFields();this.draw();this.status();
  }
  pointerMove(e){if(!this.drag)return;const p=this.canvasPoint(e),d=this.drag;
    if(d.box){d.w=p.x-d.x;d.h=p.y-d.y;const left=Math.min(d.x,p.x),right=Math.max(d.x,p.x),top=Math.min(d.y,p.y),bottom=Math.max(d.y,p.y),unit=(p.w-43)/this.zoom,laneH=(p.h-75)/6;
      const ns=this.chart.notes.filter(n=>{const x=43+(n.time+this.chart.offset-this.start)*unit,y=75+(n.lane+.5)*laneH;return x>=left&&x<=right&&y>=top&&y<=bottom;});this.selection=new Set(ns.map(n=>n.id));this.selected=ns[0]?.id||null;this.draw();this.status();return;}
    if(Math.hypot(p.x-d.downX,p.y-d.downY)<3&&!d.moved)return;d.moved=true;
    const delta=this.snap(d.originalTime+(p.x-d.downX)/(p.w-43)*this.zoom)-d.originalTime,dl=C.clamp(Math.floor((p.y-75)/((p.h-75)/6)),0,5)-d.originalLane;
    for(const orig of d.originals){const n=this.chart.notes.find(n=>n.id===orig.id);if(n){n.time=orig.time+delta;n.lane=C.clamp(orig.lane+dl,0,5);}}
    this.renderFields();this.draw();
  }
  pointerUp(){if(!this.drag)return;const d=this.drag;this.drag=null;if(!d.box)this.commit(d.before);else this.renderFields();}
  drawPlacement(){const cv=$('placement');if(!cv)return;cv.width=320;cv.height=180;const ctx=cv.getContext('2d');ctx.fillStyle='#0a1424';ctx.fillRect(0,0,320,180);ctx.strokeStyle='#20384e';for(let x=0;x<320;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,180);ctx.stroke();}for(let y=0;y<180;y+=30){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(320,y);ctx.stroke();}
    const n=this.note;if(!n)return;const near=this.chart.notes.filter(a=>Math.abs(a.time-n.time)<.8);
    for(const a of near){const primary=a.id===n.id;ctx.globalAlpha=primary?1:.3;ctx.strokeStyle=colors[a.lane];ctx.fillStyle=colors[a.lane];ctx.lineWidth=primary?2:1;ctx.beginPath();ctx.arc(a.x*320,a.y*180,10,0,Math.PI*2);ctx.stroke();ctx.font='14px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(C.LANES[a.lane],a.x*320,a.y*180);}
    ctx.globalAlpha=.65;const angle=(n.angle??0)*Math.PI/180,dist=(n.distance??.65)*150;ctx.strokeStyle=colors[n.lane];ctx.setLineDash([4,3]);ctx.beginPath();ctx.moveTo(n.x*320,n.y*180);ctx.lineTo(n.x*320+Math.sin(angle)*dist,n.y*180-Math.cos(angle)*dist);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;
  }
  resetClick(){if(this.chart)this.nextClick=Math.ceil(C.timeToBeat(this.chart,this.cursor-this.chart.offset));}
  async togglePlay(record){await super.togglePlay(record);this.resetClick();}
  update(){if(this.listening&&this.metronome){const local=this.app.audio.time-this.chart.offset;let guard=0;while(C.beatToTime(this.chart,this.nextClick)<local+.15&&guard++<100){const t=C.beatToTime(this.chart,this.nextClick)+this.chart.offset;if(t>=this.app.audio.time-.015)this.app.audio.clickAt?.(t,this.nextClick%4===0);this.nextClick++;}}super.update();}
  draw(){if(!this.chart||this.app.view!=='editor')return;const cv=$('timeline'),r=cv.getBoundingClientRect();if(!r.width)return;const ratio=Math.min(devicePixelRatio||1,2),w=r.width,h=r.height;if(cv.width!==Math.round(w*ratio)||cv.height!==Math.round(h*ratio)){cv.width=Math.round(w*ratio);cv.height=Math.round(h*ratio);}const ctx=cv.getContext('2d');ctx.setTransform(ratio,0,0,ratio,0,0);ctx.fillStyle='#0a1425';ctx.fillRect(0,0,w,h);
    const left=43,unit=(w-left)/this.zoom,laneH=(h-75)/6,duration=this.app.song.duration||60,wave=this.app.song.waveform||[],offset=this.chart.offset;
    ctx.fillStyle='#58afa780';for(let x=left;x<w;x+=2){const t=this.start+(x-left)/unit,i=Math.floor(t/duration*wave.length),a=wave[i]||0;ctx.fillRect(x,42-a*23,1,a*46);}
    for(const g of C.beatGrid(this.chart,this.start-offset,this.start+this.zoom-offset,this.grid||4)){const x=left+(g.time+offset-this.start)*unit;ctx.strokeStyle=g.bar?'#427383':g.quarter?'#243f57':'#14263a';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();if(g.bar){ctx.fillStyle='#acc4d7';ctx.font='9px monospace';ctx.fillText('M'+(g.barNumber??Math.floor(g.beat/4)+1),x+3,12);}}
    for(const t of this.chart.tempoMap){const x=left+(t.time+offset-this.start)*unit;if(x<left||x>w)continue;ctx.strokeStyle='#ffce87';ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(x,18);ctx.lineTo(x,h);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#ffce87';ctx.font='9px monospace';ctx.fillText(t.bpm.toFixed(0)+' BPM',x+3,26);}
    for(let lane=0;lane<6;lane++){const y=75+lane*laneH;ctx.fillStyle=lane%2?'#17253b65':'#0b172840';ctx.fillRect(left,y,w-left,laneH);ctx.strokeStyle='#243449';ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();ctx.fillStyle=colors[lane];ctx.font='19px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(C.LANES[lane],20,y+laneH/2);}
    ctx.save();ctx.beginPath();ctx.rect(left,75,w-left,h-75);ctx.clip();
    for(const n of this.chart.notes){const x=left+(n.time+offset-this.start)*unit,y=75+(n.lane+.5)*laneH,tail=n.duration*unit;if(x>w+12||x+tail<left-12)continue;const selected=this.selection?.has(n.id)||n.id===this.selected;ctx.fillStyle=colors[n.lane];if(n.duration&&n.type!=='tap'){ctx.globalAlpha=.24;ctx.fillRect(x,y-5,Math.min(tail,w-x),10);ctx.globalAlpha=1;}ctx.beginPath();ctx.arc(x,y,selected?10:7,0,Math.PI*2);ctx.fill();if(selected){ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();}ctx.fillStyle='#10202c';ctx.font='11px system-ui';ctx.fillText(C.LANES[n.lane],x,y+.5);}
    ctx.restore();const x=left+(this.cursor-this.start)*unit;if(x>=left&&x<=w){ctx.strokeStyle=this.recording?'#ff809d':'#8ffff0';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,14);ctx.lineTo(x,h);ctx.stroke();}
    if(this.drag?.box){const d=this.drag;ctx.fillStyle='#79e8df20';ctx.fillRect(d.x,d.y,d.w,d.h);ctx.strokeStyle='#79e8df';ctx.strokeRect(d.x,d.y,d.w,d.h);}
    ctx.textAlign='left';ctx.textBaseline='alphabetic';$('editorTime').textContent=this.app.formatTime(this.cursor,true);this.status();
  }
  autoPV(){if(!this.chart)return;const app=this.app;app.openModal('<div class="eyebrow">PV / MONTAGE</div><h2>UNE CAMÉRA AU RYTHME.</h2><p>Créer un nouveau plan toutes les quatre mesures, à partir de la carte de tempo. Les anciens plans seront remplacés seulement après validation.</p><button id="confirmAutoPV" class="primary">CRÉER LE MONTAGE</button>');$('confirmAutoPV').onclick=async()=>{const events=[],cameras=['wide','front','close','orbit','high','front'],dances=['idol','step','wave','reach','clap'];let beat=0,guard=0;while(guard++<2000){const time=C.beatToTime(this.chart,beat)+this.chart.offset;if(time>=app.song.duration)break;if(time>=0)events.push({id:C.uid(),time,camera:cameras[events.length%cameras.length],dance:dances[events.length%dances.length],stage:app.song.scene.stage});beat+=16;}app.song.scene.events=events;await app.saveSong();app.stage.events=events;this.renderEvents();app.closeModal();app.toast(`${events.length} plans créés sur les mesures de la partition.`);};}
}
root.PulseEditor=EditorV3;
})(globalThis);
