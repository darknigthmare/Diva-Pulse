"""V28 UI -> local store -> renderer -> binary backup -> restore -> explicit recovery.
Temporary document injection is used; no native persistence claim.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,hashlib,traceback
R=Path(__file__).resolve().parents[1];Q=R/'qa/v28/features';Q.mkdir(parents=True,exist_ok=True)
html=(R/'index.html').read_text();checks=[];errors=[];failure=None;p=None

def ok(name,value=True):
 checks.append({'name':name,'passed':bool(value)});print(('PASS ' if value else 'FAIL ')+name,flush=True)
 if not value:raise AssertionError(name)
def idle():p.wait_for_function('!PulseApp.busy',timeout=90000)
def close():
 if p.locator('#modal').evaluate('(e)=>e.open'):p.locator('#closeModal').click()
def physics():
 close();p.evaluate('PulseApp.showView("wardrobe");document.getElementById("mmdPanel").open=true');p.locator('#physicsOpen27').click();p.wait_for_selector('#physicsSave27')
def field(id,value):
 p.locator('#'+id).fill(str(value));p.locator('#'+id).dispatch_event('change')
def draft():p.evaluate('async()=>await PulseApp.physicsDraftWrite')
try:
 with sync_playwright() as w:
  b=w.chromium.launch(executable_path='/usr/bin/chromium',headless=False,args=['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required'])
  p=b.new_page(viewport={'width':1000,'height':800});p.set_default_timeout(25000);p.on('pageerror',lambda e:errors.append(str(e)))
  p.set_content(html);p.wait_for_function('document.documentElement.dataset.v28Ready==="true"');idle()
  ok('V28 final application initializes',p.evaluate('PulseCore.VERSION==="28.0.0"&&document.title.includes("V28")'))
  ok('Native WebGL2 software context',p.evaluate('PulseApp.stage.available&&PulseApp.stage.gl instanceof WebGL2RenderingContext'))
  ok('All original demos and difficulties retained',p.evaluate('PulseApp.songs.length===3&&PulseApp.songs.every(s=>s.charts.length===5)'))
  p.evaluate('PulseApp.showView("wardrobe");document.getElementById("mmdPanel").open=true')
  p.locator('#mmdInput').set_input_files([str(R/'examples/v27/PENDULE.pmx'),str(R/'examples/v27/ANCRAGE.vmd')]);p.wait_for_selector('#miCommit');p.locator('#miCommit').click();idle();p.wait_for_function('PulseApp.stage.director?.models.length===1')
  p.evaluate('window.owner28=PulseApp.song;window.scene28=JSON.stringify(owner28.scene);window.charts28=JSON.stringify(owner28.charts)')
  physics();ok('No initial recovery is fabricated',not p.locator('#physicsRecovery28').is_visible())
  p.locator('#physicsEnabled27').check();field('physicsGravity27',12);field('physicsDamping27',.15)
  p.locator('#physicsCursor27').fill('2');p.locator('#physicsCursor27').dispatch_event('input');p.locator('#physicsCursor27').dispatch_event('change');draft()
  ok('Draft is written separately from source song',p.evaluate('async()=>!!(await PulseApp.store.get("settings","physics-draft:"+owner28.id))&&JSON.stringify(owner28.scene)===scene28'))
  ok('Draft contains validated settings and preview cursor',p.evaluate('async()=>{const d=await PulseApp.getPhysicsRecovery(owner28);return d.cursor===2&&d.settings.gravity===12&&d.settings.enabled}'))
  ok('Temporary durability is honestly stated','TEMPORAIRE' in p.locator('#physicsDraftStatus28').inner_text())
  p.locator('#physicsPlay27').click();p.wait_for_function('PulseApp.stage.director.models[0].secondaryWorld?.stats.steps>16')
  ok('Recovered settings affect real skeleton, not metadata only',p.evaluate('Math.abs(PulseApp.stage.director.models[0].bones[1].q[2])>.01'))
  p.locator('#physicsPause27').click();close();p.wait_for_function('!PulseApp.stage.director.models[0].secondaryWorld')
  ok('Closing restores source and does not publish draft',p.evaluate('JSON.stringify(owner28.scene)===scene28&&!PulseApp.stage.secondarySettings.enabled'))
  physics();p.wait_for_selector('#physicsRecovery28',state='visible')
  ok('Reopening offers explicit recovery without applying it',not p.locator('#physicsEnabled27').is_checked() and p.locator('#physicsGravity27').input_value()=='9.8')
  p.locator('#physicsRecover28').click()
  ok('Recovery loads settings and saved cursor',p.locator('#physicsEnabled27').is_checked() and p.locator('#physicsGravity27').input_value()=='12' and p.locator('#physicsCursor27').input_value()=='2')
  ok('Recovery still leaves committed song unchanged',p.evaluate('JSON.stringify(owner28.scene)===scene28'))
  p.screenshot(path=str(Q/'01-recovery-preview.png'))
  p.set_viewport_size({'width':390,'height':844});p.locator('#physicsEnabled27').scroll_into_view_if_needed()
  ok('Physics recovery fits mobile viewport',p.evaluate('document.getElementById("modal").getBoundingClientRect().right<=innerWidth+1'))
  ok('No horizontal overflow in mobile recovery form',p.evaluate('document.getElementById("modalContent").scrollWidth<=document.getElementById("modalContent").clientWidth+1'))
  p.screenshot(path=str(Q/'02-mobile-physics.png'));p.set_viewport_size({'width':1000,'height':800})
  # Force real store writes to fail. Both draft publication and scene publication use atomic().
  p.evaluate('window.atomic28=PulseApp.store.atomic;PulseApp.store.atomic=async()=>{throw Error("QA28 storage full")};void 0;')
  field('physicsGravity27',7);draft()
  ok('Failed write preserves newest recovery in memory',p.evaluate('PulseApp.physicsRecoveries.get(owner28.id).settings.gravity===7'))
  ok('Failed write is visible to the user','Écriture refusée' in p.locator('#physicsDraftStatus28').inner_text())
  p.locator('#physicsSave27').click();idle()
  ok('Failed publication preserves scene, charts and editable form',p.evaluate('JSON.stringify(owner28.scene)===scene28&&JSON.stringify(owner28.charts)===charts28') and p.locator('#physicsSave27').is_visible())
  close();p.evaluate('PulseApp.showView("settings")')
  with p.expect_download(timeout=60000) as d:p.locator('#bundleExport25').click();idle()
  bundle=Q/'recovery.pulsebundle';d.value.save_as(bundle)
  ok('Backup is produced even while all writes are rejected',bundle.stat().st_size>1000)
  p.evaluate('async()=>{window.backup28=(await PulseApp.buildBackupData()).data}');ok('Newest failed-write recovery is exported',p.evaluate('backup28.physicsDrafts.find(d=>d.songId===owner28.id).settings.gravity===7'))
  # Also use the legacy portable .pulsepack to verify it calls the same source-of-truth builder.
  with p.expect_download(timeout=60000) as d:p.evaluate('async()=>await PulseApp.exportBackup()')
  pack=Q/'recovery.pulsepack';d.value.save_as(pack)
  ok('Legacy JSON backup transports independent physics recovery',json.loads(pack.read_text())['physicsDrafts'][0]['settings']['gravity']==7)
  p.evaluate('PulseApp.store.atomic=atomic28;window.count28=PulseApp.songs.length;void 0;')
  p.locator('#backupInput').set_input_files(str(bundle));idle();p.locator('#confirmRestore').click();idle()
  ok('Bundle restoration creates copies only',p.evaluate('PulseApp.songs.length===count28*2'))
  p.evaluate('async()=>{window.restored28=PulseApp.songs.find(s=>s.id!==owner28.id&&s.scene.mmd);await PulseApp.selectSong(restored28.id)}');p.wait_for_function('PulseApp.stage.director?.models.length===1')
  physics();p.wait_for_selector('#physicsRecovery28',state='visible');p.locator('#physicsRecover28').click()
  ok('Restored recovery is rebound to copied owner and model pack',p.evaluate('async()=>{const d=await PulseApp.getPhysicsRecovery(restored28);return d.songId===restored28.id&&d.packId===restored28.scene.mmd.id&&d.settings.gravity===7}'))
  ok('Restored source remains disabled until explicit save',p.evaluate('!restored28.scene.secondaryPhysics27?.enabled') and p.locator('#physicsEnabled27').is_checked())
  p.locator('#physicsPlay27').click();p.wait_for_function('PulseApp.stage.director.models[0].secondaryWorld?.stats.steps>12')
  ok('Restored model and recovery run in actual renderer',p.evaluate('PulseApp.stage.director.models[0].secondaryWorld.settings.gravity===7'))
  p.locator('#physicsPause27').click();p.locator('#physicsSave27').click();idle()
  ok('Explicit publication saves source settings',p.evaluate('restored28.scene.secondaryPhysics27.gravity===7&&restored28.scene.secondaryPhysics27.enabled'))
  ok('Recovery tombstone is committed with the scene',p.evaluate('async()=>(await PulseApp.store.get("settings","physics-draft:"+restored28.id)).discarded===true'))
  physics();ok('Published draft is not resurrected',not p.locator('#physicsRecovery28').is_visible())
  field('physicsGravity27',3);draft();close();physics();p.wait_for_selector('#physicsRecovery28',state='visible');p.locator('#physicsDiscard28').click();idle();close();physics()
  ok('Discarding recovery preserves saved settings and does not resurrect on reopen',p.evaluate('restored28.scene.secondaryPhysics27.gravity===7') and not p.locator('#physicsRecovery28').is_visible())
  ok('No discarded physics recovery appears in backup',p.evaluate('async()=>!(await PulseApp.buildBackupData()).data.physicsDrafts.some(d=>d.songId===restored28.id)'))
  close();p.evaluate('''async()=>{const raw=structuredClone(backup28);raw.physicsDrafts=[{...raw.physicsDrafts[0],songId:'absent'}];window.bad28='';try{await PulseApp.reviewBackup(raw);}catch(e){bad28=e.message}}''')
  ok('Invalid recovery owner is rejected before restore confirmation',p.evaluate('bad28.includes("absent")&&!document.getElementById("modal").open'))
  ok('Source song and original notes survived entire round trip unchanged',p.evaluate('JSON.stringify(owner28.scene)===scene28&&JSON.stringify(owner28.charts)===charts28'))
  ok('No GPU error',p.evaluate('PulseApp.stage.gl.getError()===0'))
  ok('No render-loop failure',p.evaluate('!PulseApp.frameError'))
  ok('No unhandled JavaScript error',not errors)
  b.close();p=None
except Exception as e:
 failure=str(e);print(traceback.format_exc(),flush=True)
 if p:
  try:p.screenshot(path=str(Q/'FAILURE.png'),timeout=6000)
  except:pass
(Q/'browser-final.json').write_text(json.dumps({'version':'28.0.0','buildSha256':hashlib.sha256(html.encode()).hexdigest(),'passed':sum(c['passed'] for c in checks),'failed':sum(not c['passed'] for c in checks),'checks':checks,'failure':failure,'errors':errors,'scope':'Chromium + SwiftShader; original PMX/VMD fixtures; temporary injected document, no physical device or native durability claim.'},ensure_ascii=False,indent=2))
if failure:raise SystemExit(1)
