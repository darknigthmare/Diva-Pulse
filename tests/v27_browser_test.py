"""V27 secondary dynamics: real UI, imported PMX and native WebGL poses.
The document is injected because network navigation is restricted in this runner.
No claim about native IndexedDB durability or physical GPU/device coverage.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import hashlib,json,traceback,os
R=Path(__file__).resolve().parents[1];Q=R/'qa/v27/features';Q.mkdir(parents=True,exist_ok=True)
html=(R/'index.html').read_text();checks=[];errors=[];warnings=[];failure=None;p=None

def ok(name,value=True):
 checks.append({'name':name,'passed':bool(value)});print(('PASS ' if value else 'FAIL ')+name,flush=True)
 if not value:raise AssertionError(name)
def idle():p.wait_for_function('!PulseApp.busy',timeout=90000)
def close():
 if p.locator('#modal').evaluate('(e)=>e.open'):p.locator('#closeModal').click()
def physics():
 close();p.evaluate('PulseApp.showView("wardrobe");document.getElementById("mmdPanel").open=true');p.locator('#physicsOpen27').click();p.wait_for_selector('#physicsSave27')
def field(name,value):
 p.locator('#'+name).fill(str(value));p.locator('#'+name).dispatch_event('change')
try:
 with sync_playwright() as w:
  b=w.chromium.launch(executable_path='/usr/bin/chromium',headless=False,args=['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required'])
  p=b.new_page(viewport={'width':1440,'height':1000});p.set_default_timeout(25000);p.on('pageerror',lambda e:errors.append(str(e)));p.on('console',lambda e:warnings.append(e.text) if e.type in ['warning','error'] else None)
  p.set_content(html);p.wait_for_function('document.documentElement.dataset.v27Ready==="true"');idle()
  ok('Delivered V27 HTML boots',p.evaluate('PulseCore.VERSION==="27.0.0"&&document.title.includes("V27")'))
  ok('Real software WebGL2 context',p.evaluate('PulseApp.stage.available&&PulseApp.stage.gl instanceof WebGL2RenderingContext'))
  ok('Previous demos and 15 charts retained',p.evaluate('PulseApp.songs.length===3&&PulseApp.songs.every(s=>s.charts.length===5)'))
  p.evaluate('window.sourceSong27=PulseApp.song;window.sourceCharts27=JSON.stringify(PulseApp.song.charts);PulseApp.showView("wardrobe");document.getElementById("mmdPanel").open=true')
  p.locator('#mmdInput').set_input_files([str(R/'examples/v27/PENDULE.pmx'),str(R/'examples/v27/ANCRAGE.vmd')]);p.wait_for_selector('#miCommit');idle()
  ok('Import diagnostic describes physics before persistence','secondaire' in p.locator('#modal').inner_text().lower() or 'physiqu' in p.locator('#modal').inner_text().lower())
  p.locator('#miCommit').click();idle();p.wait_for_function('PulseApp.stage.director?.models.length===1')
  ok('PMX physics data reaches renderer',p.evaluate('PulseApp.stage.director.models[0].pmx.physics.bodies.length===2'))
  ok('Physics remains off after importing compatible model',p.evaluate('!PulseApp.stage.secondarySettings?.enabled&&!PulseApp.stage.director.models[0].secondaryWorld'))
  p.evaluate('window.savedScene27=JSON.stringify(PulseApp.song.scene);window.sourceId27=PulseApp.song.id')
  physics();ok('Accessible explicit opt-in and per-model report',not p.locator('#physicsEnabled27').is_checked() and '2 corps' in p.locator('#physicsReports27').inner_text())
  ok('Preview describes approximations honestly','Ce n’est pas Bullet' in p.locator('#modal').inner_text())
  p.locator('#physicsEnabled27').check();p.locator('#physicsPlay27').click()
  p.wait_for_function('PulseApp.stage.director.models[0].secondaryWorld?.stats.steps>20',timeout=30000)
  ok('Actual preview advances fixed-step simulation',p.evaluate('PulseApp.stage.director.models[0].secondaryWorld.stats.steps>20'))
  ok('Dynamic joint changes real render bone rotation',p.evaluate('Math.abs(PulseApp.stage.director.models[0].bones[1].q[2])>.03'))
  ok('Preview is silent and does not start song audio',p.evaluate('!PulseApp.audio.playing'))
  ok('Preview did not change saved scene or chart data',p.evaluate('JSON.stringify(PulseApp.song.scene)===savedScene27&&JSON.stringify(PulseApp.song.charts)===sourceCharts27'))
  p.locator('#physicsPause27').click();p.wait_for_timeout(100);p.evaluate('window.pose27=JSON.stringify(PulseApp.stage.director.models[0].bones.map(b=>[b.p,b.q]));window.steps27=PulseApp.stage.director.models[0].secondaryWorld.stats.steps');p.wait_for_timeout(300)
  ok('Pause stops physics time and holds rendered pose',p.evaluate('JSON.stringify(PulseApp.stage.director.models[0].bones.map(b=>[b.p,b.q]))===pose27&&PulseApp.stage.director.models[0].secondaryWorld.stats.steps===steps27'))
  p.screenshot(path=str(Q/'01-pendulum-preview.png'))
  field('physicsCursor27',2);p.locator('#physicsCursor27').dispatch_event('input');p.wait_for_function('PulseApp.stage.director.models[0].secondaryWorld?.stats.steps===0')
  ok('Scrub resets instead of simulating unseen history',p.evaluate('PulseApp.stage.director.models[0].secondaryWorld.stats.resets===1'))
  p.locator('#physicsReset27').click();p.wait_for_function('Number(document.getElementById("physicsCursor27").value)===0')
  ok('Reset returns preview to time zero',p.locator('#physicsTime27').inner_text()=='0.00 s')
  field('physicsGravity27',0);p.locator('#physicsPlay27').click();p.wait_for_function('PulseApp.stage.director.models[0].secondaryWorld?.stats.steps>12');p.locator('#physicsPause27').click()
  ok('Gravity setting is passed into active simulation',p.evaluate('PulseApp.stage.director.models[0].secondaryWorld.settings.gravity===0'))
  field('physicsGravity27',200);ok('Invalid preview setting visibly refused','hors plage' in p.locator('#physicsMessage27').inner_text().lower() and p.evaluate('PulseApp.stage.secondarySettings.gravity===0'))
  field('physicsGravity27',9.8);p.set_viewport_size({'width':390,'height':844});p.locator('#physicsEnabled27').scroll_into_view_if_needed()
  ok('Physics dialog stays within portrait viewport',p.evaluate('document.getElementById("modal").getBoundingClientRect().right<=innerWidth+1'))
  ok('Physics controls have no horizontal overflow',p.evaluate('document.getElementById("modalContent").scrollWidth<=document.getElementById("modalContent").clientWidth+1'))
  p.screenshot(path=str(Q/'02-mobile-physics.png'));p.set_viewport_size({'width':1440,'height':1000})
  p.locator('#physicsCancel27').click();p.wait_for_function('!PulseApp.stage.director.models[0].secondaryWorld')
  ok('Cancel disposes preview world and restores disabled source',p.evaluate('!PulseApp.stage.secondarySettings.enabled&&JSON.stringify(PulseApp.song.scene)===savedScene27'))
  physics();p.locator('#physicsEnabled27').check();p.evaluate('window.originalPut27=PulseApp.store.put;PulseApp.store.put=async()=>{throw Error("QA27 refused dynamics save")};void 0;')
  p.locator('#physicsSave27').click();idle()
  ok('Refused save leaves scene and charts untouched',p.evaluate('JSON.stringify(PulseApp.song.scene)===savedScene27&&JSON.stringify(PulseApp.song.charts)===sourceCharts27'))
  ok('Refused save keeps retryable settings dialog',p.locator('#physicsSave27').is_visible() and p.locator('#physicsEnabled27').is_checked())
  p.evaluate('PulseApp.store.put=originalPut27;void 0;');p.locator('#physicsSave27').click();idle();p.wait_for_function('PulseApp.song.scene.secondaryPhysics27?.enabled')
  ok('Confirmed save retains opt-in per song',p.evaluate('PulseApp.song.scene.secondaryPhysics27.enabled===true'))
  ok('Other demo songs were not enabled silently',p.evaluate('PulseApp.songs.filter(s=>s.id!==sourceId27).every(s=>!s.scene.secondaryPhysics27?.enabled)'))
  physics()
  with p.expect_download() as dl:p.locator('#physicsExport27').click()
  path=Q/'dynamics-diagnostic.json';dl.value.save_as(path);diag=json.loads(path.read_text())
  ok('Diagnostic export contains counts, settings and explicit scope',diag['settings']['enabled'] and diag['reports'][0]['bodies']==2 and 'not Bullet' in diag['limits'])
  close();p.evaluate('PulseApp.showView("settings")')
  with p.expect_download(timeout=60000) as dl:p.locator('#bundleExport25').click();idle()
  bundle=Q/'dynamics-backup.pulsebundle';dl.value.save_as(bundle)
  ok('Binary backup exports actual MMD project with physics',bundle.stat().st_size>1000)
  p.evaluate('window.beforeRestore27=PulseApp.songs.length');p.locator('#backupInput').set_input_files(str(bundle));idle();p.locator('#confirmRestore').click();idle()
  ok('Restoration creates copies rather than replacing original',p.evaluate('PulseApp.songs.length===beforeRestore27*2'))
  p.evaluate('async()=>{window.restored27=PulseApp.songs.find(s=>s.id!==sourceId27&&s.scene.secondaryPhysics27?.enabled);await PulseApp.selectSong(restored27.id)}');p.wait_for_function('PulseApp.stage.director?.models.length===1')
  ok('Restored copy retains physics options',p.evaluate('PulseApp.song.scene.secondaryPhysics27.gravity===9.8&&PulseApp.song.scene.secondaryPhysics27.enabled'))
  ok('Restored actual PMX again supplies bodies and joints',p.evaluate('PulseApp.stage.director.models[0].pmx.physics.bodies.length===2&&PulseApp.stage.director.models[0].pmx.physics.joints.length===1'))
  ok('Restored chart content unchanged',p.evaluate('JSON.stringify(PulseApp.song.charts.map(c=>c.notes))===JSON.stringify(sourceSong27.charts.map(c=>c.notes))'))
  physics();p.locator('#physicsPlay27').click();p.wait_for_function('PulseApp.stage.director.models[0].secondaryWorld?.stats.steps>15')
  ok('Restored character is actually simulated in renderer',p.evaluate('Math.abs(PulseApp.stage.director.models[0].bones[1].q[2])>.02'))
  p.locator('#physicsPause27').click();p.locator('#physicsEnabled27').uncheck();p.wait_for_function('!PulseApp.stage.director.models[0].secondaryWorld')
  ok('Unchecking immediately returns renderer to animation-only',p.evaluate('!PulseApp.stage.director.models[0].secondaryWorld'))
  p.locator('#physicsSave27').click();idle();ok('Explicit disable is stored without deleting model',p.evaluate('!PulseApp.song.scene.secondaryPhysics27.enabled&&PulseApp.stage.director.models.length===1'))
  close();p.evaluate('async()=>await PulseApp.selectSong(PulseApp.songs.find(s=>!s.scene.mmd).id)');physics()
  ok('No-model song opens explanatory non-crashing panel','Charger un modèle' in p.locator('#physicsReports27').inner_text());close()
  # Independent mathematical time checks on native renderer; reference source and loaded copies unaffected.
  p.evaluate('async()=>await PulseApp.selectSong(sourceId27)');p.wait_for_function('PulseApp.stage.director?.models.length===1');physics();p.locator('#physicsEnabled27').check();field('physicsIterations27',8);p.locator('#physicsPlay27').click();p.wait_for_function('PulseApp.stage.director.models[0].secondaryWorld?.stats.steps>8');p.locator('#physicsPause27').click()
  ok('Renderer finite and no dynamics fault',p.evaluate('!PulseApp.stage.director.models[0].secondaryError&&PulseApp.stage.director.models[0].bones.every(b=>[...b.p,...b.q].every(Number.isFinite))'))
  ok('WebGL error state stays clear',p.evaluate('PulseApp.stage.gl.getError()===0'))
  ok('No application frame error',p.evaluate('!PulseApp.frameError'));ok('No unhandled JavaScript exception',not errors)
  b.close();p=None
except Exception as e:
 failure=str(e);print(traceback.format_exc(),flush=True)
 if p:
  try:p.screenshot(path=str(Q/'FAILURE.png'),timeout=10000)
  except:pass
(Q/'browser-final.json').write_text(json.dumps({'version':'27.0.0','buildSha256':hashlib.sha256(html.encode()).hexdigest(),'passed':sum(x['passed'] for x in checks),'failed':sum(not x['passed'] for x in checks),'checks':checks,'failure':failure,'errors':errors,'warnings':warnings,'scope':'Chromium + SwiftShader; document injection and temporary storage. Original small PMX fixture; not real-world MMD compatibility certification.'},indent=2,ensure_ascii=False))
if failure:raise SystemExit(1)
