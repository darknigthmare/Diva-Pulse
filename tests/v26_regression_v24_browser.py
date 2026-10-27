"""V24 UI + real software WebGL2. Storage faults are simulated; durability untested."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import base64,json,hashlib,traceback
R=Path(__file__).resolve().parents[1];Q=R/'qa/v26/regression-v24';Q.mkdir(parents=True,exist_ok=True)
html=(R/'index.html').read_text();checks=[];errors=[];warnings=[];failure=None;p=None
F={n:base64.b64encode((R/'examples/v24'/n).read_bytes()).decode() for n in ['APPEND_STANDARD.pmx','CYCLE_1_SECONDE.vmd','IK_LIMITS.pmx']}
def ok(name,value=True):
 checks.append({'name':name,'passed':bool(value)});print(('PASS ' if value else 'FAIL ')+name,flush=True)
 if not value:raise AssertionError(name)
def idle():p.wait_for_function('!PulseApp.busy',timeout=60000)
def close():
 if p.locator('#modal').evaluate('(e)=>e.open'):p.locator('#closeModal').click()
def sync():
 close();p.evaluate('PulseApp.showView("wardrobe");document.getElementById("mmdPanel").open=true');p.locator('#motionSyncOpen').click();p.wait_for_selector('#motionSyncRows')
try:
 with sync_playwright() as w:
  b=w.chromium.launch(executable_path='/usr/bin/chromium',headless=False,args=['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required'])
  p=b.new_page(viewport={'width':1440,'height':1000});p.set_default_timeout(20000);p.on('pageerror',lambda e:errors.append(str(e)));p.on('console',lambda e:warnings.append(e.text) if e.type in ['warning','error'] else None);p.set_content(html);p.wait_for_function('document.documentElement.dataset.reliabilityReady==="true"');idle()
  ok('V24 delivered HTML initializes',p.evaluate('PulseCore.VERSION==="26.0.0"&&document.title.includes("V26")'))
  ok('Real WebGL2 context exists',p.evaluate('PulseApp.stage.available&&PulseApp.stage.gl instanceof WebGL2RenderingContext'))
  ok('Three demo songs and five difficulties retained',p.evaluate('PulseApp.songs.length===3&&PulseApp.songs.every(s=>s.charts.length===5)'))
  p.evaluate('PulseApp.showView("settings")');p.locator('#storage24Refresh').click();idle()
  ok('Opaque origin storage accurately marked temporary','TEMPORAIRE' in p.locator('#storage24Status').inner_text())
  p.locator('#storage24Persist').click();idle();ok('No false persistent-storage promise in temporary mode','indisponible' in p.locator('#toast').inner_text())
  p.evaluate('PulseApp.showView("wardrobe");document.getElementById("mmdPanel").open=true;window.notes24=JSON.stringify(PulseApp.song.charts)')
  p.locator('#mmdInput').set_input_files([str(R/'examples/v24'/n) for n in ['APPEND_STANDARD.pmx','CYCLE_1_SECONDE.vmd']]);p.wait_for_selector('#miCommit');idle();ok('Append PMX validates for import',p.locator('#miCommit').is_enabled())
  p.locator('#miPreview').click();idle();ok('Append model renders in independent preview',p.evaluate('PulseApp.lastMMDPreview.rendered&&PulseApp.lastMMDPreview.glError===0'))
  p.locator('#miCommit').click();idle();p.wait_for_function('PulseApp.stage.director?.models.length===1');ok('Imported MMD keeps rhythm charts unchanged',p.evaluate('JSON.stringify(PulseApp.song.charts)===notes24'))
  p.evaluate('''async data=>{window.fixture24=data;window.dec24=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0)).buffer;const c=document.createElement('canvas');c.width=500;c.height=500;c.id='appendCanvas24';c.style='position:fixed;left:440px;top:150px;width:500px;height:500px;z-index:40000';document.body.append(c);window.diag24=new PulseStage.Stage(c);diag24.cameraMode='front';diag24.environment.hidden=true;await diag24.loadMMD(dec24(data['APPEND_STANDARD.pmx']),[dec24(data['CYCLE_1_SECONDE.vmd'])],null,[],'APPEND_STANDARD.pmx');diag24.custom.useIK=false;diag24.custom.loop=false;diag24.render(.25,120,{preview:true});}''',F)
  ok('Append translation reaches actual model pose',p.evaluate('Math.abs(diag24.custom.bones[1].p[0]-.2)<.003'))
  ok('Append rotation reaches actual model pose',p.evaluate('Math.abs(PulseSkeleton.toEuler(diag24.custom.bones[1].q)[2]-.4)<.005'))
  p.screenshot(animations='disabled',timeout=12000,path=str(Q/'02-append-render.png'));p.evaluate('diag24.render(0,120,{preview:true})');ok('Backward seek resets append without accumulation',p.evaluate('Math.abs(diag24.custom.bones[1].p[0])<1e-8&&Math.abs(diag24.custom.bones[1].q[2])<1e-8'))
  p.evaluate('diag24.render(.25,120,{preview:true});window.pose24=JSON.stringify(diag24.custom.bones.map(x=>[x.p,x.q]));diag24.render(.25,120,{preview:true})');ok('Same time produces same appended pose',p.evaluate('JSON.stringify(diag24.custom.bones.map(x=>[x.p,x.q]))===pose24'))
  p.evaluate('''()=>{const m=diag24.custom;m.pmx.bones[1].grant=null;m.pmx.bones[0].ik={target:1,loops:12,limit:.4,links:[{bone:0,limited:true,min:[0,0,0],max:[0,0,.1]}]};m.useIK=true;delete m.appendPlan;diag24.render(.25,120,{preview:true});}''')
  ok('Runtime IK limit is applied to actual bone quaternion',p.evaluate('Math.abs(PulseSkeleton.toEuler(diag24.custom.bones[0].q)[2])<=.100001'))
  ok('Append and IK rendered without GL errors',p.evaluate('diag24.gl.getError()===0'));p.evaluate('diag24.clearCustom();document.getElementById("appendCanvas24").remove()')
  sync();p.evaluate('window.scene24=JSON.stringify(PulseApp.song.scene)');p.locator('[data-analyze-motion="0"]').click();idle()
  ok('VMD analysis uses actual imported binary',p.evaluate('Math.abs(PulseApp.lastMotionProposal.periodSeconds-1)<.045'))
  ok('Period analysis offers half/double alternatives',p.locator('[data-proposed-bpm]').count()>=3)
  ok('Analysis alone changes neither scene nor notes',p.evaluate('JSON.stringify(PulseApp.song.scene)===scene24&&JSON.stringify(PulseApp.song.charts)===notes24'))
  p.locator('[data-proposed-bpm]').filter(has_text='120 BPM').click();ok('Proposal only fills source BPM field',p.locator('[data-key="bpm"]').first.input_value()=='120' and p.evaluate('JSON.stringify(PulseApp.song.scene)===scene24'))
  p.screenshot(animations='disabled',timeout=12000,path=str(Q/'03-motion-proposals.png'));p.locator('#motionSyncCancel').click();ok('Cancel proposal leaves saved show intact',p.evaluate('JSON.stringify(PulseApp.song.scene)===scene24'))
  sync();p.locator('[data-analyze-motion="0"]').click();idle();p.locator('[data-proposed-bpm]').filter(has_text='120 BPM').click();p.locator('#motionSyncSave').click();idle()
  ok('Explicit save commits chosen clock',p.evaluate('PulseApp.song.scene.mmd.files.find(f=>f.role==="motion").info.sync.bpm===120'))
  ok('Automatic renderer gets calibrated source BPM',p.evaluate('PulseApp.stage.director.models[0].directorClips.some(c=>c.sourceBpm===120)'))
  p.evaluate('''async()=>{const s=structuredClone(PulseApp.song);s.scene.mmdDirector=structuredClone(s.scene.autoShow.director);await PulseApp.store.put('songs',s);Object.assign(PulseApp.song,s);window.manual24=JSON.stringify(s.scene.mmdDirector);await PulseApp.saveMotionSync({[s.scene.mmd.files.find(f=>f.role==='motion').id]:{bpm:90,firstBeat:0,loopBeats:null}});}''')
  ok('Changing source BPM preserves manual montage',p.evaluate('JSON.stringify(PulseApp.song.scene.mmdDirector)===manual24'))
  p.evaluate('window.writable24=PulseApp.store.persistent;PulseApp.store.persistent=true;PulseApp.store.readOnly=true;window.readonlyScene24=JSON.stringify(PulseApp.song.scene)');sync();p.locator('[data-key="bpm"]').first.fill('140');p.locator('#motionSyncSave').click();idle()
  ok('Read-only write reports conflict with retryable dialog','Lecture seule' in p.locator('#motionSyncError').inner_text() and p.locator('#modal').evaluate('(e)=>e.open'))
  ok('Read-only write keeps original scene',p.evaluate('JSON.stringify(PulseApp.song.scene)===readonlyScene24'))
  close();p.evaluate('PulseApp.showView("settings");window.clockBefore24=PulseApp.settings.outputClock;window.keysBefore24=JSON.stringify(PulseApp.settings.keys)');p.locator('#outputClock').click();idle()
  ok('Read-only checkbox rolls back value and UI',p.evaluate('PulseApp.settings.outputClock===clockBefore24&&document.getElementById("outputClock").checked===clockBefore24'))
  p.evaluate('PulseApp.remapping=0');p.keyboard.press('g');p.wait_for_timeout(150)
  ok('Read-only key remapping rolls back without unhandled promise',p.evaluate('JSON.stringify(PulseApp.settings.keys)===keysBefore24') and not errors)
  p.evaluate('''()=>{window.storageApi24=navigator.storage;Object.defineProperty(navigator,'storage',{configurable:true,value:{estimate:async()=>{throw Error('QA storage access denied')},persisted:async()=>{throw Error('QA protection access denied')}}});}''');p.locator('#storage24Refresh').click();idle()
  ok('Denied diagnostic APIs do not break the game','Diagnostic partiel' in p.locator('#storage24Details').inner_text() and not errors);p.evaluate('Object.defineProperty(navigator,"storage",{configurable:true,value:storageApi24})')

  close();p.evaluate('''async()=>{window.oldDownload24=PulseServices.download;PulseServices.download=(text,name)=>{window.exported24={text,name}};await PulseApp.exportBackup();}''')
  ok('Read-only state still exports complete library',p.evaluate('JSON.parse(exported24.text).songs.length===3&&JSON.parse(exported24.text).assets.length>=2'))
  p.evaluate('PulseApp.store.readOnly=false;PulseApp.store.persistent=writable24;window.sourceSong24=PulseApp.song.id')
  p.evaluate('async()=>await PulseApp.restoreBackup(new File([exported24.text],"V24.pulsepack"))');p.locator('#confirmRestore').click();idle();p.evaluate('async()=>await PulseApp.selectSong(PulseApp.songs.find(s=>s.id!==sourceSong24&&s.scene.mmd?.files.some(f=>f.info?.sync?.bpm===90)).id)')
  ok('Restored copy retains source clock',p.evaluate('PulseApp.song.scene.mmd.files.some(f=>f.info?.sync?.bpm===90)'))
  ok('Restored manual montage reloads MMD with its original clock',p.evaluate('PulseApp.stage.director.models.length===1&&PulseApp.stage.director.models[0].directorClips.some(c=>c.sourceBpm===120)'))
  p.evaluate('PulseServices.download=oldDownload24');sync();p.locator('[data-analyze-motion="0"]').click();idle();p.set_viewport_size({'width':390,'height':844})
  ok('Motion suggestion dialog fits mobile viewport',p.evaluate('document.getElementById("modal").getBoundingClientRect().right<=innerWidth+1'))
  ok('Suggestion buttons fit mobile viewport',p.evaluate('Array.from(document.querySelectorAll("[data-proposed-bpm]")).every(b=>b.getBoundingClientRect().right<=innerWidth+1)'))
  p.screenshot(animations='disabled',timeout=12000,path=str(Q/'04-mobile-motion.png'));close();p.evaluate('PulseApp.showView("settings")');p.locator('#storage24Refresh').click();idle();p.locator('#storage24').scroll_into_view_if_needed();p.screenshot(animations='disabled',timeout=12000,path=str(Q/'05-mobile-storage.png'))
  ok('Storage panel fits mobile viewport',p.evaluate('document.getElementById("storage24").getBoundingClientRect().right<=innerWidth+1'))
  ok('No renderer frame failure',p.evaluate('!PulseApp.frameError'));ok('No unhandled JavaScript exception',not errors)
  b.close();p=None
except Exception as e:
 failure=str(e);print(traceback.format_exc(),flush=True)
 if p:
  try:p.screenshot(animations='disabled',timeout=12000,path=str(Q/'FAILURE.png'))
  except:pass
(Q/'browser-final.json').write_text(json.dumps({'version':'26.0.0','buildSha256':hashlib.sha256(html.encode()).hexdigest(),'passed':sum(c['passed'] for c in checks),'failed':sum(not c['passed'] for c in checks),'checks':checks,'failure':failure,'errors':errors,'warnings':warnings,'scope':'Real Chromium + software WebGL; temporary storage and simulated read-only state. No durability claim.'},indent=2,ensure_ascii=False))
if failure:raise SystemExit(1)
