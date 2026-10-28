/* Director V30: musical-grid edits. Director times are AUDIO seconds;
 * chart tempo/meter positions are CHART seconds/beats, before chart.offset.
 * Pure operations, no DOM, storage, GPU, or random state. */
(function (root) {
  'use strict';
  const C = root.PulseCore || (typeof require === 'function' ? require('./core.js') : null);
  if (!C.timeToBeat && typeof require === 'function') require('./creator.js');
  if (!C.metricAt && typeof require === 'function') require('./precision-core.js');
  const D = root.PulseDirector || (typeof require === 'function' ? require('./director-core.js') : null);
  const E = root.PulseDirectorEdit || (typeof require === 'function' ? require('./director-edit.js') : null);
  const Sync = root.PulseMotionSync || (typeof require === 'function' ? require('./motion-sync.js') : null);
  const EPS = 1e-7;
  function finite(value, label) {
    if (typeof value !== 'number' || !Number.isFinite(value)) throw Error(label + ' doit être un nombre fini.');
    return value;
  }
  function musicalSnap(time, chart = {}, grid = 1, duration = 7200) {
    finite(time, 'Temps'); finite(duration, 'Durée');
    if (duration <= 0 || duration > 7200 || time < 0 || time > duration) throw Error('Curseur hors du spectacle.');
    if (grid === 0) return time;
    if (grid !== 'bar' && ![.25, 1 / 3, .5, 1, 4].includes(grid)) throw Error('Subdivision inconnue.');
    const offset = finite(chart.offset ?? 0, 'Décalage partition');
    const phase = finite(chart.gridOffset ?? 0, 'Origine musicale');
    if (Math.abs(offset) > 30 || Math.abs(phase) > 30) throw Error('Décalage limité à 30 secondes.');
    const origin = C.timeToBeat(chart, phase);
    const beat = C.timeToBeat(chart, time - offset) - origin;
    let candidates;
    if (grid === 'bar') {
      const meter = C.metricAt(chart, beat);
      candidates = [meter.start, meter.start + meter.span];
    } else {
      const n = Math.floor(beat / grid);
      candidates = [n * grid, (n + 1) * grid];
    }
    // Compare audio distances, not beat distances: these differ across a BPM change.
    const times = candidates.map(b => C.beatToTime(chart, b + origin) + offset)
      .filter(t => t >= -EPS && t <= duration + EPS)
      .map(t => Math.max(0, Math.min(duration, t)));
    if (!times.length) throw Error('Aucun point de grille dans la durée du spectacle.');
    times.sort((a, b) => Math.abs(a - time) - Math.abs(b - time) || b - a);
    return times[0];
  }
  function align(raw, selection, chart, grid) {
    const clipboard = E.copy(raw, selection);
    const target = musicalSnap(clipboard.anchor, chart, grid, raw.duration);
    return E.move(raw, selection, target - clipboard.anchor);
  }
  function split(raw, selection, time) {
    finite(time, 'Point de coupe');
    const d = D.normalizeDirector(structuredClone(raw));
    const clipboard = E.copy(d, selection); // shared validation, including stale/duplicate keys
    if (clipboard.entries.some(e => e.kind !== 'clip')) throw Error('Scinder : sélectionner uniquement des clips.');
    const ids = new Set(d.slots.flatMap(s => s.clips.map(c => c.id)).filter(Boolean));
    const unique = base => { let n = 1, id; do { id = base + '-split-' + n++; } while (ids.has(id)); ids.add(id); return id; };
    // Snapshot indexes are resolved before insertion. normalizeDirector sorts only at the end.
    for (const key of selection) {
      const [, s, i] = key.split(':').map((v, n) => n ? Number(v) : v);
      const track = d.slots[s].clips, clip = track[i];
      if (time <= clip.start + EPS || time >= clip.end - EPS) throw Error('Le curseur doit être à l’intérieur de chaque clip sélectionné.');
      const beatLoop=!!(clip.sourceBpm&&clip.loop&&clip.loopBeats);
      if(beatLoop&&!d.rhythm)throw Error('Carte de tempo requise pour scinder une boucle en temps.');
      if (time < clip.start + clip.transition - EPS) throw Error('Scinder après la fin du fondu pour conserver la pose.');
      const right = { ...structuredClone(clip), id: unique(clip.id || 'clip'), start: time,
        motionStart: beatLoop?clip.motionStart:sourceAt(clip, time, d.rhythm), transition: 0 };
      if(beatLoop)right.loopPhaseBeats=Sync.phaseAt(clip,time,d.rhythm);
      clip.end = time;
      track.push(right);
    }
    return D.normalizeDirector(d);
  }
  function sourceAt(clip,time,rhythm){
    if(clip.sourceBpm&&rhythm){
      return clip.motionStart+Math.max(0,C.timeToBeat(rhythm,time)-C.timeToBeat(rhythm,clip.start))*clip.rate*60/clip.sourceBpm;
    }
    return clip.motionStart+(time-clip.start)*clip.rate;
  }
  // Unknown extension fields must also match: never silently erase their meaning.
  function signature(clip){
    const skip=new Set(['id','start','end','motionStart','transition','loopPhaseBeats']);
    return JSON.stringify(Object.fromEntries(Object.keys(clip).filter(k=>!skip.has(k)).sort().map(k=>[k,clip[k]])));
  }
  function merge(raw,selection){
    const d=D.normalizeDirector(structuredClone(raw)),items=E.copy(d,selection).entries;
    if(items.some(e=>e.kind!=='clip'))throw Error('Fusionner : sélectionner uniquement des clips.');
    const groups=new Map();
    for(const key of selection){const [,s,i]=key.split(':').map((v,n)=>n?Number(v):v);if(!groups.has(s))groups.set(s,[]);groups.get(s).push(i);}
    for(const [slot,indexes] of groups){
      indexes.sort((a,b)=>a-b);if(indexes.length<2)throw Error('Sélectionner au moins deux clips par danseur.');
      const track=d.slots[slot].clips,first=track[indexes[0]],sig=signature(first);
      const beatLoop=!!(first.sourceBpm&&first.loop&&first.loopBeats);
      if(beatLoop&&!d.rhythm)throw Error('Carte de tempo requise pour fusionner une boucle en temps.');
      for(let j=1;j<indexes.length;j++){
        const a=track[indexes[j-1]],b=track[indexes[j]];
        if(indexes[j]!==indexes[j-1]+1||Math.abs(a.end-b.start)>EPS)throw Error('Fusion : les clips doivent être adjacents sans trou.');
        if(signature(b)!==sig)throw Error('Fusion : motions ou paramètres différents.');
        if(b.transition>0)throw Error('Fusion : un fondu intermédiaire serait perdu.');
        if(beatLoop){
          const expected=Sync.phaseAt(first,b.start,d.rhythm),actual=b.loopPhaseBeats||0,diff=Math.abs(expected-actual);
          if(Math.abs(first.motionStart-b.motionStart)>EPS||Math.min(diff,first.loopBeats-diff)>EPS)throw Error('Fusion : rupture de phase de boucle VMD.');
        }else if(Math.abs(sourceAt(first,b.start,d.rhythm)-b.motionStart)>EPS)throw Error('Fusion : rupture du temps source VMD.');
      }
      first.end=track[indexes.at(-1)].end;track.splice(indexes[0]+1,indexes.length-1);
    }
    return D.normalizeDirector(d);
  }
  function dragDelta(raw,selection,anchorKey,target,chart={},grid=0){
    const d=D.normalizeDirector(raw),picked=E.copy(d,selection),anchor=E.copy(d,[anchorKey]).anchor;
    if(!selection.includes(anchorKey))throw Error('Le bloc déplacé doit appartenir au groupe.');
    finite(target,'Position du groupe');
    let delta=target-anchor;
    if(grid!==0)delta=E.musicalSnap(Math.max(0,Math.min(d.duration,picked.anchor+delta)),chart,grid,d.duration)-picked.anchor;
    return delta;
  }
  function drag(raw,selection,anchorKey,target,chart={},grid=0){
    return E.move(raw,selection,dragDelta(raw,selection,anchorKey,target,chart,grid));
  }
  function copyForTransfer(raw,selection,models=[]){
    const d=D.normalizeDirector(raw),copy=E.copy(d,selection);
    copy.sourceModels=d.slots.map((slot,i)=>slot.modelAssetId||models[i%models.length]?.id||null);
    return copy;
  }
  function pasteTo(raw,clipboard,time,target,models=[]){
    const d=D.normalizeDirector(raw);
    if(target===null||target===undefined)return E.paste(d,clipboard,time);
    if(!Number.isInteger(target)||!d.slots[target])throw Error('Danseur cible inexistant.');
    // Validate the clipboard independently even when it only contains keyframes.
    if(!clipboard||!Array.isArray(clipboard.entries)||!clipboard.entries.length)throw Error('Presse-papiers invalide.');
    const copy=structuredClone(clipboard),clips=copy.entries.filter(e=>e?.kind==='clip');
    if(!clips.length)throw Error('Le presse-papiers ne contient aucun clip à transférer.');
    const origin=Math.min(...clips.map(c=>c.slot));
    const model=i=>d.slots[i]?.modelAssetId||models[i%models.length]?.id||null;
    for(const clip of clips){
      const dest=target+clip.slot-origin;
      if(!Number.isInteger(clip.slot)||!d.slots[clip.slot]||!d.slots[dest])throw Error('Le groupe dépasse les danseurs disponibles.');
      if(dest!==clip.slot&&(!clipboard.sourceModels?.[clip.slot]||clipboard.sourceModels[clip.slot]!==model(dest)))throw Error('Modèles différents ou inconnus : transfert refusé sans retargeting validé.');
      clip.slot=dest;
    }
    return E.paste(d,copy,time);
  }
  function shortcut(event, editing = false) {
    if (editing || event.isComposing || event.repeat || event.altKey) return null;
    const key = String(event.key || '').toLowerCase(), mod = event.ctrlKey || event.metaKey;
    if (mod) {
      if (key === 'z') return event.shiftKey ? 'dRedo' : 'dUndo';
      if (key === 'y' && !event.shiftKey) return 'dRedo';
      if (event.shiftKey) return null;
      return ({ a: 'dSelectAll', c: 'dCopy', v: 'dPaste', s: 'dSave' })[key] || null;
    }
    if (event.shiftKey) return null;
    return ({ delete: 'dDeleteSelected', backspace: 'dDeleteSelected', s: 'dSplit', m: 'dMerge', ' ': 'dPlay', g: 'dAlignSelected', arrowleft: 'cursorBack', arrowright: 'cursorForward' })[key] || null;
  }
  function readProject(raw, duration, assetIds) {
    if (!raw || raw.format !== 'DIVA-PULSE-DIRECTOR' || ![19,20].includes(raw.version)) throw Error('Format ou version Director non pris en charge (versions 19 ou 20 attendues).');
    if (!raw.director || typeof raw.director !== 'object' || Array.isArray(raw.director)) throw Error('Document Director absent ou invalide.');
    const director = D.normalizeDirector({ ...structuredClone(raw.director), duration });
    if(raw.version===19&&director.version===20)throw Error('Une phase de boucle exige le schéma Director 20.');
    if(raw.director.version!==undefined&&![19,20].includes(raw.director.version))throw Error('Version interne Director non prise en charge.');
    const ids = new Set(assetIds || []);
    for (const id of D.assetReferences({ mmdDirector: director })) if (!ids.has(id)) throw Error('Ce Director référence un autre pack MMD. Restaurer son .pulsepack.');
    return director;
  }
  Object.assign(E, { musicalSnap, align, split, merge, drag, dragDelta, pasteTo, copyForTransfer, sourceAt, shortcut, readProject });
  if (typeof module !== 'undefined') module.exports = E;
})(globalThis);
