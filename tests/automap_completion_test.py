"""Focused AutoMap completion tests: restored duplicate songs, transaction boundary,
real file drop and actual headless 2D fallback. Memory storage; no persistence claim."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,base64,traceback
R=Path(__file__).resolve().parents[1];Q=R/'qa/v6';checks=[];errors=[]
def ok(name,v):
 assert v,name
 checks.append({'name':name,'passed':True});print('PASS',name,flush=True)
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 p=b.new_page(viewport={'width':1280,'height':900});p.on('pageerror',lambda e:errors.append(str(e)));p.set_default_timeout(15000)
 try:
  p.set_content((R/'DIVA_PULSE_JOUER.html').read_text());p.wait_for_function('document.documentElement.dataset.v6Ready==="true"')
  ok('Automatic import remains enabled in the actual headless 2D fallback',p.evaluate('!PulseApp.stage.available&&PulseApp.settings.autoMapImport&&document.getElementById("fallbackStage").width>0'))
  p.mouse.click(20,130)
  values={n:base64.b64encode((R/'examples/v6'/n).read_bytes()).decode() for n in ['MODE_MANUEL_156.wav','SOURCE_EXACTE_100.wav']}
  p.evaluate('xs=>{window.files=Object.fromEntries(Object.entries(xs).map(([n,s])=>[n,new File([Uint8Array.from(atob(s),c=>c.charCodeAt(0))],n,{type:"audio/wav"})]));}',values)
  p.evaluate('()=>{const dt=new DataTransfer();dt.items.add(files["MODE_MANUEL_156.wav"]);document.dispatchEvent(new DragEvent("drop",{dataTransfer:dt,bubbles:true,cancelable:true}));}')
  p.wait_for_function('PulseApp.importLog?.length===1&&!PulseApp.busy',timeout=90000)
  ok('Dropping an actual audio File starts the automatic five-level import',p.evaluate('PulseApp.song.charts.length===5&&PulseApp.importLog[0].generated===5'))
  p.locator('#closeModal').click()
  p.evaluate('async()=>{const a=PulseApp;window.originalID=a.song.id;window.originalJSON=JSON.stringify(a.song);const copy=structuredClone(a.song);copy.id="qa-restored-copy";copy.title+=" copie restaurée";copy.charts=[];delete copy.mappingReport;await a.store.put("songs",copy);a.songs.push(copy);await a.showView("settings");}')
  p.locator('#autoMapFillLibrary').click()
  ok('Library completion identifies the incomplete restored copy', 'COMPLÉTER 1 MORCEAU' in p.locator('#modalContent').inner_text())
  p.locator('#fillLibraryConfirm').click();p.wait_for_function('PulseApp.importLog?.length===1&&!PulseApp.busy',timeout=90000)
  ok('Completion targets the incomplete copy despite a complete song with the same hash',p.evaluate('PulseApp.importLog[0].songId==="qa-restored-copy"&&PulseApp.songs.find(s=>s.id==="qa-restored-copy").charts.length===5'))
  ok('Completing a restored duplicate leaves the earlier song unchanged',p.evaluate('JSON.stringify(PulseApp.songs.find(s=>s.id===originalID))===originalJSON'))
  p.locator('#closeModal').click()
  ok('Explicit target rejects a different audio file without replacing the song',p.evaluate('async()=>{const a=PulseApp,s=a.songs.find(s=>s.id==="qa-restored-copy"),before=JSON.stringify(s);try{await a.importAudio(files["SOURCE_EXACTE_100.wav"],{targetSongId:s.id});return false;}catch(e){return e.message.includes("ne correspond pas")&&JSON.stringify(s)===before;}}'))
  ok('Completion of a deleted target fails rather than creating an unrelated song',p.evaluate('async()=>{const a=PulseApp,n=a.songs.length;try{await a.importAudio(files["SOURCE_EXACTE_100.wav"],{targetSongId:"nonexistent"});return false;}catch(e){return e.message.includes("n’existe plus")&&a.songs.length===n;}}'))
  ok('Cancel control is disabled during atomic commit and restored after commit',p.evaluate('async()=>{const a=PulseApp,s=structuredClone(a.song),old=a.store.atomic;let disabled=false;s.charts=[];a.store.atomic=async function(rows){disabled=document.getElementById("cancelAnalysis").disabled;return old.call(this,rows);};try{await a.publishMappedSong(s,a.buffer,null,a.song);return disabled&&!document.getElementById("cancelAnalysis").disabled;}finally{a.store.atomic=old;}}'))
  p.screenshot(path=str(Q/'07-fallback-2d.png'),full_page=True)
  ok('Focused completion and 2D scenarios have no uncaught exception',not errors)
 except Exception as e:
  checks.append({'name':'completion-suite','passed':False,'error':str(e)});traceback.print_exc();p.screenshot(path=str(Q/'error-completion.png'),full_page=True)
 b.close()
r={'suite':'V6 completion and 2D fallback','passed':sum(c['passed'] for c in checks),'failed':sum(not c['passed'] for c in checks),'checks':checks,'pageErrors':errors,'environment':'Headless Chromium, opaque origin, real audio File/drop/analysis. Restored duplicate fixture and commit spy operate on temporary memory storage.'};(Q/'completion-browser.json').write_text(json.dumps(r,indent=2,ensure_ascii=False));print('RESULT',r['passed'],'passed /',r['failed'],'failed',flush=True)
raise SystemExit(1 if r['failed'] or errors else 0)
