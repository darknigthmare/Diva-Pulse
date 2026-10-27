"""V34: native storage cleanup and real audio interruptions. Explicit injected
mode is only a fallback for local UI checks; it skips the native abort probe."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
import threading,json,hashlib,os,traceback
R=Path(__file__).resolve().parents[1];Q=R/'qa/v34/vault-live';Q.mkdir(parents=True,exist_ok=True)
checks=[];errors=[];failure=None;mode='injected' if os.getenv('PULSE_DOCUMENT_MODE')=='1' else 'http';native_abort=False
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(R)));threading.Thread(target=server.serve_forever,daemon=True).start()
def ok(name,value):
 checks.append({'name':name,'passed':bool(value)});print(('PASS ' if value else 'FAIL ')+name,flush=True)
 if not value:raise AssertionError(name)
def idle():p.wait_for_function('!PulseApp.busy',timeout=90000)
try:
 with sync_playwright() as w:
  b=w.chromium.launch(executable_path=os.getenv('CHROMIUM_PATH','/usr/bin/chromium'),headless=False,args=['--no-sandbox','--disable-dev-shm-usage','--no-proxy-server','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required'])
  p=b.new_page(viewport={'width':1280,'height':900});p.set_default_timeout(20000);p.on('pageerror',lambda e:errors.append(str(e)))
  if mode=='http':p.goto(f'http://127.0.0.1:{server.server_port}/',wait_until='domcontentloaded')
  else:p.set_content((R/'index.html').read_text())
  p.wait_for_function('window.PulseApp&&document.documentElement.dataset.v28Ready==="true"');idle()
  ok('V34 modules boot on the selected storage surface',p.evaluate('document.documentElement.dataset.live34Ready==="true"&&document.documentElement.dataset.mediaVault34Ready==="true"') and (mode=='injected' or p.evaluate('PulseApp.store.persistent')))
  p.evaluate('''async()=>{const a=PulseApp;window.notes34=JSON.stringify(a.songs);await a.store.atomic(['qa-live','qa-draft','qa-unknown','qa-free'].map(id=>['assets',{id,name:id==='qa-free'?'<img src=x onerror=alert(1)>':id,kind:'audio',blob:new Blob([new Uint8Array([10,20,30,40])],{type:'audio/wav'})}]).concat([['settings',{id:'qa-media-root',audioAsset:'qa-live',future:{anything:'qa-unknown'}}]]));a.directorRecoveries.set('qa-probe',{director:{slots:[{motionAssetId:'qa-draft'}]}});await a.showView('settings');}''')
  p.locator('#mediaAnalyze34').click();idle()
  ok('Inventory protects persistent, unknown and in-memory draft references',p.locator('[data-media-id]').count()==1 and p.locator('[data-media-id="qa-free"]').count()==1)
  ok('Media names are literal text, never inserted as HTML',p.locator('#mediaCandidates34 img').count()==0 and '<img' in p.locator('#mediaCandidates34').inner_text())
  ok('Cleanup requires explicit selection and backup acknowledgement',p.locator('#mediaClean34').is_disabled())
  p.locator('[data-media-id="qa-free"]').check();ok('Selection alone is not destructive authorization',p.locator('#mediaClean34').is_disabled())
  p.locator('#mediaConfirm34').check();ok('Selection plus acknowledgement enables requested cleanup',p.locator('#mediaClean34').is_enabled())
  with p.expect_download() as out:p.locator('#mediaReport34').click()
  report=Q/'inventory.json';out.value.save_as(str(report));r=json.loads(report.read_text())
  ok('Exported inventory contains metadata and references, not binary payloads',r['format']=='DIVA-PULSE-MEDIA-REPORT' and len(r['orphans'])==1 and all('blob' not in a for a in r['assets']))
  p.evaluate('PulseApp.store.put("settings",{id:"qa-unrelated",value:1})');idle()
  ok('Any committed change marks the open inventory stale',p.locator('#mediaClean34').is_disabled() and 'modifiée' in p.locator('#mediaOutcome34').inner_text())
  p.locator('#mediaRescan34').click();idle()
  ok('Rescanning does not silently reselect previously checked media',not p.locator('[data-media-id="qa-free"]').is_checked())
  # Add a runtime-only reference AFTER reviewing: no commit notification exists.
  p.locator('[data-media-id="qa-free"]').check();p.locator('#mediaConfirm34').check()
  p.evaluate('PulseApp.directorRecoveries.set("qa-new",{director:{slots:[{motionAssetId:"qa-free"}]}})')
  p.locator('#mediaClean34').click();idle()
  ok('Transaction recheck preserves a newly referenced runtime asset',p.evaluate('async()=>!!(await PulseApp.store.get("assets","qa-free"))') and 'modifiée' in p.locator('#mediaOutcome34').inner_text())
  p.evaluate('PulseApp.directorRecoveries.delete("qa-new")');p.locator('#closeModal').click()
  if mode=='http':
   aborted=p.evaluate('''async()=>{const a=PulseApp,v=a.mediaVault,r=await v.review(),db=a.store.db,original=db.transaction.bind(db);let aborted=false,commits=0;const stop=a.store.watch(e=>{if(e.type==='commit')commits++;});db.transaction=function(names,mode,...rest){const tx=original(names,mode,...rest);if(mode==='readwrite'){const access=tx.objectStore.bind(tx);tx.objectStore=function(name){const s=access(name);if(name==='assets'){const del=s.delete.bind(s);s.delete=function(id){const req=del(id);req.addEventListener('success',()=>{if(aborted)return;aborted=true;tx.abort();},{once:true});return req;};}return s;};}return tx;};let refused=false;try{await v.clean(r,['qa-free']);}catch{refused=true;}finally{db.transaction=original;stop();}const asset=await a.store.get('assets','qa-free');return aborted&&refused&&commits===0&&JSON.stringify([...new Uint8Array(await asset.blob.arrayBuffer())])==='[10,20,30,40]';}''')
   ok('Real IDB abort after deletion request restores bytes and emits no successful commit',aborted);native_abort=True
  p.locator('#mediaAnalyze34').click();idle();p.locator('[data-media-id="qa-free"]').check();p.locator('#mediaConfirm34').check();p.screenshot(path=str(Q/'cleanup-review.png'),animations='disabled');p.locator('#mediaClean34').click();idle()
  ok('Confirmed cleanup removes only the selected orphan',p.evaluate('''async()=>{const s=PulseApp.store;return !(await s.get('assets','qa-free'))&&!!(await s.get('assets','qa-live'))&&!!(await s.get('assets','qa-draft'))&&!!(await s.get('assets','qa-unknown'));}'''))
  ok('Cleanup leaves songs and charts identical',p.evaluate('JSON.stringify(PulseApp.songs)===notes34'))
  p.evaluate('PulseApp.store.put("settings",{id:"qa-broken",audioAsset:"absent-media"})');p.locator('#mediaAnalyze34').click();idle()
  ok('A missing reference is visible and disables destructive cleanup',p.locator('#mediaClean34').is_disabled() and 'absent-media' in p.locator('#mediaIssues34').inner_text())
  p.locator('#closeModal').click();p.evaluate('PulseApp.store.del("settings","qa-broken")')
  # Real audio interruption: statechange must pause and require an explicit resume.
  p.evaluate('''async()=>{const a=PulseApp;await a.startGame('practice',{from:0,to:10,rate:1,loop:false});window.originalResult34=JSON.stringify(a.engine.result());await a.audio.ctx.suspend();}''')
  p.wait_for_function('PulseApp.paused')
  ok('AudioContext suspension pauses the live game and clears source inputs',p.evaluate('PulseApp.paused&&!PulseApp.audio.playing&&PulseApp.heldSources.size===0'))
  p.evaluate('PulseApp.pressSource("qa-suspended",0)')
  ok('Suspended input cannot score or arm a held source',p.evaluate('PulseApp.heldSources.size===0&&JSON.stringify(PulseApp.engine.result())===originalResult34'))
  p.evaluate('PulseApp.audio.ctx.resume()');p.wait_for_timeout(60)
  ok('AudioContext recovery alone does not restart a paused game',p.evaluate('PulseApp.paused&&!PulseApp.audio.playing'))
  p.locator('#resumeGame').click();p.wait_for_function('!PulseApp.paused')
  ok('Explicit resume starts the same paused song',p.evaluate('PulseApp.view==="game"&&PulseApp.audio.playing'))
  p.evaluate('''const a=PulseApp;a.audio.pause();a.audio.pausedAt=2;a.settings.vfxIntensity=0;a.settings.reducedEffects=true;a.engine=new PulseCore.JudgeEngine({title:'Gauges',bpm:120,notes:[{id:'h',time:1,lane:0,type:'hold',duration:4,x:.35,y:.5},{id:'h2',time:1,lane:2,type:'hold',duration:4,x:.65,y:.5}]},{noFail:true});a.engine.press(0,1);a.engine.press(2,1);a.engine.update(2);window.scoreHold34=JSON.stringify(a.engine.result());a.drawHoldGauges34(performance.now()+1000);''')
  ok('Multiple hold gauges remain readable with all decorative VFX off',p.locator('#holdMeter34 .hold-cell34:visible').count()==2 and '25 %' in p.locator('#holdMeter34').inner_text())
  p.evaluate('for(let i=0;i<10;i++)PulseApp.drawHoldGauges34(performance.now()+2000+i*100)')
  ok('Hold HUD redraws do not alter score or replay data',p.evaluate('JSON.stringify(PulseApp.engine.result())===scoreHold34'))
  p.set_viewport_size({'width':390,'height':844});p.screenshot(path=str(Q/'hold-mobile.png'),animations='disabled')
  ok('Hold status stays within the narrow viewport',p.locator('#holdMeter34').evaluate('e=>e.getBoundingClientRect().left>=0&&e.getBoundingClientRect().right<=innerWidth'))
  p.set_viewport_size({'width':1280,'height':900});p.evaluate('PulseApp.engine.release(0,2);PulseApp.drawHoldGauges34(performance.now()+4000)')
  ok('Releasing one hold does not clear a second lane gauge',p.locator('#holdMeter34 .hold-cell34:visible').count()==1)
  p.evaluate('PulseApp.pause()');p.evaluate('PulseApp.audio.ctx.close()');p.locator('#resumeGame').click();p.wait_for_function('!PulseApp.paused')
  ok('A closed audio context is recreated safely on explicit resume',p.evaluate('PulseApp.audio.ctx.state==="running"&&PulseApp.audio.playing'))
  p.evaluate('PulseApp.showView("settings")');idle();p.locator('#holdGauge34').uncheck();idle()
  ok('Hold-gauge preference persists through its settings handler',p.evaluate('async()=>(await PulseApp.store.get("settings","preferences")).holdGauge===false'))
  # Existing MMD fixtures make a real Director audition, not a fake audio object.
  p.evaluate('PulseApp.showView("wardrobe");document.getElementById("mmdPanel").open=true')
  p.locator('#mmdInput').set_input_files([str(R/'examples/v27/PENDULE.pmx'),str(R/'examples/v27/ANCRAGE.vmd')]);p.wait_for_selector('#miCommit');p.locator('#miCommit').click();idle();p.locator('#openMmdDirector').click();p.locator('#dPlay').click();idle();p.wait_for_function('PulseApp.directorAudition?.playing')
  p.evaluate('''Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));''')
  ok('Hiding the document pauses the actual Director audition without discarding the draft',p.evaluate('!PulseApp.directorAudition.playing&&document.getElementById("modal").open') and 'pause' in p.locator('#dPlaybackStatus').inner_text())
  p.evaluate('delete document.hidden;document.dispatchEvent(new Event("visibilitychange"))');p.wait_for_timeout(80)
  ok('Returning visible leaves the Director paused until explicitly resumed',p.evaluate('!PulseApp.directorAudition.playing'))
  p.locator('#dPlay').click();idle();p.wait_for_function('PulseApp.directorAudition.playing')
  ok('Director can resume normally after an interruption',p.evaluate('PulseApp.directorAudition.time>=0'))
  p.locator('#closeModal').click();ok('No uncaught browser errors in V34 flow',not errors);b.close()
except Exception as e:failure=str(e);print(traceback.format_exc(),flush=True)
finally:server.shutdown();server.server_close()
(Q/'results.json').write_text(json.dumps({'version':(R/'VERSION.txt').read_text().strip(),'buildSha256':hashlib.sha256((R/'index.html').read_bytes()).hexdigest(),'passed':sum(c['passed']for c in checks),'failed':sum(not c['passed']for c in checks),'failure':failure,'errors':errors,'checks':checks,'mode':mode,'nativeAbortExecuted':native_abort,'scope':'Native Web Audio and '+('HTTP/IndexedDB transactional test'if mode=='http'else'injected document, temporary store; native abort NOT executed')+'. Software GPU and viewport emulation, not device certification.'},ensure_ascii=False,indent=2))
if failure:raise SystemExit(1)
