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
      if (clip.sourceBpm) throw Error('Scission des clips synchronisés au BPM non prise en charge : conserver le clip entier.');
      if (time < clip.start + clip.transition - EPS) throw Error('Scinder après la fin du fondu pour conserver la pose.');
      const right = { ...structuredClone(clip), id: unique(clip.id || 'clip'), start: time,
        motionStart: clip.motionStart + (time - clip.start) * clip.rate, transition: 0 };
      clip.end = time;
      track.push(right);
    }
    return D.normalizeDirector(d);
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
    return ({ delete: 'dDeleteSelected', backspace: 'dDeleteSelected', s: 'dSplit', g: 'dAlignSelected', arrowleft: 'cursorBack', arrowright: 'cursorForward' })[key] || null;
  }
  function readProject(raw, duration, assetIds) {
    if (!raw || raw.format !== 'DIVA-PULSE-DIRECTOR' || raw.version !== 19) throw Error('Format ou version Director non pris en charge (version 19 attendue).');
    if (!raw.director || typeof raw.director !== 'object' || Array.isArray(raw.director)) throw Error('Document Director absent ou invalide.');
    const director = D.normalizeDirector({ ...structuredClone(raw.director), duration });
    const ids = new Set(assetIds || []);
    for (const id of D.assetReferences({ mmdDirector: director })) if (!ids.has(id)) throw Error('Ce Director référence un autre pack MMD. Restaurer son .pulsepack.');
    return director;
  }
  Object.assign(E, { musicalSnap, align, split, shortcut, readProject });
  if (typeof module !== 'undefined') module.exports = E;
})(globalThis);
