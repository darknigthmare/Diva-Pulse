#!/usr/bin/env python3
"""Idempotent migration of recovered V28. Never edits user browser data."""
from pathlib import Path
import json
R=Path(__file__).resolve().parents[1]
def patch(name,old,new):
 p=R/name;s=p.read_text(encoding='utf-8')
 if new in s:return
 if s.count(old)!=1:raise RuntimeError(f'{name}: expected one patch anchor, found {s.count(old)}')
 p.write_text(s.replace(old,new),encoding='utf-8')
patch('build.py',"{'PHYSICSDRAFT28':", "{'DIRECTOREDIT29':'director-edit.js','PHYSICSDRAFT28':")
patch('src/template.html','/*__DIRECTOR19__*/','/*__DIRECTOR19__*/\n/*__DIRECTOREDIT29__*/')
patch('src/core.js',"const VERSION = '28.0.0';","const VERSION = '29.0.0';")
patch('src/template.html','Continuité & reprise V28','Montage & sauvegardes V29')
patch('src/template.html','CONTINUITÉ &amp; REPRISE <b>28.0</b>','MONTAGE &amp; SAUVEGARDES <b>29.0</b>')
patch('sw.js','DIVA-PULSE-MMD-DIRECTOR-28.0.0','DIVA-PULSE-MMD-DIRECTOR-29.0.0')
patch('src/director-app.js',"if(session!==current||!saved||saved.packId!==current.packId", "if(session!==current||!saved?.director||saved.status==='applied'||saved.songId!==owner||saved.packId!==current.packId")
patch('src/enhancements.js',"storedSettings.filter(x=>x.id.startsWith('director-draft:')&&songs.some", "storedSettings.filter(x=>x.id.startsWith('director-draft:')&&x.director&&x.status!=='applied'&&songs.some")
patch('src/director-app.js','history:[],redo:[],loaded:false,time:0','history:[],redo:[],loaded:false,time:0,selection:new Set(),clipboard:null,snap:0')
patch('src/director-app.js','session.redo=[];session.draft=valid;session.loaded=false;renderDirector();','session.redo=[];session.draft=valid;session.selection.clear();session.loaded=false;renderDirector();')
patch('src/director-app.js',"function renderDirector(){\n  if(!session)return;", "function renderDirector(){\n  if(!session)return;\n  const E=root.PulseDirectorEdit;const picked=()=>[...session.selection];\n  const batch=fn=>mutate(next=>Object.assign(next,fn(next)));\n  const reportError=e=>{$('directorMessage').textContent=e.message;};\n  const refreshSelection=()=>{for(const el of $('directorContent').querySelectorAll('[data-select]'))el.checked=session.selection.has(el.dataset.select);$('dSelected').textContent=session.selection.size+' éléments sélectionnés';};")
patch('src/director-app.js','<div id="dOverview" class="director-overview"></div>', '''<fieldset class="director-batch"><legend>MONTAGE GROUPÉ</legend><div class="buttons"><button id="dSelectAll">Tout sélectionner</button><button id="dSelectNone">Désélectionner</button><button id="dCopy">Copier</button><button id="dPaste" ${session.clipboard?'':'disabled'}>Coller au curseur</button><button id="dDeleteSelected">Supprimer la sélection</button></div><div class="director-row"><label>Décalage (s)<input id="dMoveDelta" type="number" step=".01" value="1"></label><button id="dMoveSelected">Déplacer le groupe</button><label>Grille au BPM courant<select id="dSnap"><option value="0">Libre</option><option value=".5">Demi-temps</option><option value="1">Temps</option><option value="4">4 temps</option></select></label><button id="dSnapCursor">Aligner le curseur</button></div><output id="dSelected" aria-live="polite">${session.selection.size} éléments sélectionnés</output><p class="muted">Coche les clips et clés ci-dessous. Le collage conserve leurs écarts et leurs pistes. Toute collision ou sortie de durée annule l’opération entière. La grille utilise le BPM courant ; les mesures à tempo variable restent à affiner.</p></fieldset><div id="dOverview" class="director-overview"></div>''')
patch('src/director-app.js','row.innerHTML=`<strong>${j+1}</strong><label>VMD', 'row.innerHTML=`<label class="check"><input type="checkbox" data-select="clip:${i}:${j}" aria-label="Sélectionner clip ${j+1} danseur ${i+1}"> Sélection</label><strong>${j+1}</strong><label>VMD')
patch('src/director-app.js',"row.innerHTML=fields.map(f=>field", "row.innerHTML=`<label class=\"check\"><input type=\"checkbox\" data-select=\"${kind}:${i}\" aria-label=\"Sélectionner clé ${kind} ${i+1}\"> Sélection</label>`+fields.map(f=>field")
patch('src/director-app.js',"session.draft=session.history.pop();session.loaded=false;", "session.draft=session.history.pop();session.selection.clear();session.loaded=false;")
patch('src/director-app.js',"session.draft=session.redo.pop();session.loaded=false;", "session.draft=session.redo.pop();session.selection.clear();session.loaded=false;")
patch('src/director-app.js',"  $('dAuto').onclick=", """  for(const el of $('directorContent').querySelectorAll('[data-select]'))el.onchange=()=>{if(el.checked)session.selection.add(el.dataset.select);else session.selection.delete(el.dataset.select);refreshSelection();};
  $('dSelectAll').onclick=()=>{session.selection=new Set(E.all(session.draft));refreshSelection();};
  $('dSelectNone').onclick=()=>{session.selection.clear();refreshSelection();};
  $('dCopy').onclick=()=>{try{session.clipboard=E.copy(session.draft,picked());$('dPaste').disabled=false;$('directorMessage').textContent='Sélection copiée. Place le curseur puis colle.';}catch(e){reportError(e);}};
  $('dPaste').onclick=()=>batch(next=>E.paste(next,session.clipboard,session.time));
  $('dMoveSelected').onclick=()=>batch(next=>E.move(next,picked(),Number($('dMoveDelta').value)));
  $('dDeleteSelected').onclick=()=>batch(next=>E.remove(next,picked()));
  $('dSnap').value=String(session.snap);$('dSnap').onchange=()=>session.snap=Number($('dSnap').value);
  $('dSnapCursor').onclick=()=>{try{const chart=app.chart||{},bpm=C.tempoAt?.(chart,session.time)||chart.bpm||120;session.time=Math.min(d.duration,E.snap(session.time,bpm,session.snap,chart.gridOffset||0));$('dTime').value=session.time;$('dTime').dispatchEvent(new Event('input'));}catch(e){reportError(e);}};
  refreshSelection();
  $('dAuto').onclick=""")
old="""const current=session;if(current.owner!==app.song.id)throw Error('Le morceau a changé.');await app.directorDraftWrite;const valid=D.normalizeDirector(current.draft),candidate={...app.song,scene:{...app.song.scene,mmdDirector:valid}};await app.store.put('songs',candidate);Object.assign(app.song,candidate);app.directorRecoveries.delete(current.owner);try{await app.store.del('settings',draftKey(current.owner));}catch(e){app.toast('Spectacle enregistré ; nettoyage du brouillon à réessayer.',true);}app.closeModal();renderMMD();app.toast('Spectacle enregistré. Les partitions sont inchangées.');"""
new="""const current=session,owner=app.song;if(!current||current.owner!==owner.id)throw Error('Le morceau a changé.');await app.directorDraftWrite;if(session!==current||app.song!==owner)throw Error('La session Director a changé.');const rows=E.publication(owner,current.draft,current.packId);await app.store.atomic(rows);Object.assign(owner,rows[0][1]);app.directorRecoveries.delete(current.owner);if(session===current){app.closeModal();renderMMD();}app.toast('Spectacle et fin du brouillon enregistrés ensemble. Les partitions sont inchangées.');"""
patch('src/director-app.js',old,new)
patch('src/director-app.js','<div id="directorContent"></div><p id="directorMessage" role="status"></p>', '<p id="directorMessage" role="status"></p><div id="directorContent"></div>')
(R/'VERSION.txt').write_text('29.0.0\n')
p=R/'package.json';data=json.loads(p.read_text());data.update(name='diva-pulse',version='29.0.0')
data['scripts'].update({'test:browser':'python3 tests/v29_browser_test.py','test:browser:persistence':'python3 tests/v29_persistence_test.py','test:browser:regression':'python3 tests/run_browser_regressions.py','test:browser:mmd':'python3 tests/v28_native_mmd_browser.py','test:browser:playback':'python3 tests/v28_playback_browser_test.py','test:launcher':'python3 tests/launcher_test.py'})
p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
p=R/'manifest.webmanifest';data=json.loads(p.read_text());data['name']='DIVA PULSE — Montage & sauvegardes V29';p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
# Parameterize current regression assertions without changing the tested behaviors.
for p in (R/'tests').glob('v28*.py'):
 s=p.read_text();s=s.replace('PulseCore.VERSION===\"28.0.0\"&&document.title.includes(\"V28\")','PulseCore.VERSION===\"29.0.0\"&&document.title.includes(\"V29\")')
 s=s.replace("'version':'28.0.0'","'version':(R/'VERSION.txt').read_text().strip()")
 s=s.replace("R/'qa/v28/", "R/'qa/v29/regressions/")
 p.write_text(s)
print('V29 source migration applied; run build.py and test suites next.')
