"""V25 actual browser controls + binary backup + real software WebGL; opaque storage."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import base64,json,hashlib,traceback,os
R=Path(__file__).resolve().parents[1];Q=R/'qa/v26/regression-v25';Q.mkdir(parents=True,exist_ok=True)
html=(R/'index.html').read_text();checks=[];errors=[];warnings=[];failure=None;p=None

def ok(name,value=True):
 checks.append({'name':name,'passed':bool(value)});print(('PASS ' if value else 'FAIL ')+name,flush=True)
 if not value:raise AssertionError(name)
def idle():p.wait_for_function('!PulseApp.busy',timeout=60000)
def close():
 if p.locator('#modal').evaluate('(e)=>e.open'):p.locator('#closeModal').click()
def face():
 close();p.evaluate('PulseApp.showView("wardrobe");document.getElementById("mmdPanel").open=true');p.locator('#faceOpen25').click();p.wait_for_selector('#faceSave25')
try:
 with sync_playwright() as w:
  b=w.chromium.launch(executable_path='/usr/bin/chromium',headless=not bool(os.environ.get('DISPLAY')),args=['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required'])
  p=b.new_page(viewport={'width':1440,'height':1000});p.set_default_timeout(20000);p.on('pageerror',lambda e:errors.append(str(e)));p.on('console',lambda e:warnings.append(e.text) if e.type in ['warning','error'] else None)
  p.set_content(html);p.wait_for_function('document.documentElement.dataset.v26Ready==="true"');idle()
  ok('Delivered V25 initializes',p.evaluate('PulseCore.VERSION==="26.0.0"&&document.title.includes("V26")'))
  ok('Actual WebGL2 context',p.evaluate('PulseApp.stage.available&&PulseApp.stage.gl instanceof WebGL2RenderingContext'))
  ok('All original demos and difficulties retained',p.evaluate('PulseApp.songs.length===3&&PulseApp.songs.every(s=>s.charts.length===5)'))
  ok('Face automation remains opt-in',p.evaluate('!PulseApp.settings.autoFaceImport'))
  p.screenshot(path=str(Q/'01-library.png'))
  p.evaluate('PulseApp.showView("wardrobe");document.getElementById("mmdPanel").open=true;window.notes25=JSON.stringify(PulseApp.song.charts)')
  p.locator('#mmdInput').set_input_files(str(R/'examples/v25/FACE_ROBOT.pmx'));p.wait_for_selector('#miCommit');idle();ok('Original face PMX import accepted',p.locator('#miCommit').is_enabled());p.locator('#miCommit').click();idle();p.wait_for_function('PulseApp.stage.director?.models.length>=1')
  ok('Model actually loaded',p.evaluate('PulseApp.stage.director.models[0].morphByName.has("mouthOpen")'))
  face();p.evaluate('window.savedFace25=JSON.stringify(PulseApp.song.scene.faceTrack||null)');p.locator('#faceGuide25').set_input_files(str(R/'examples/v25/VOIX_SYNTHETIQUE_TEST.wav'));idle()
  ok('Real audio guide decoded and analyzed in Worker','8.00 s' in p.locator('#faceSource25').inner_text())
  ok('Analysis alone leaves saved scene untouched',p.evaluate('JSON.stringify(PulseApp.song.scene.faceTrack||null)===savedFace25'))
  p.locator('#faceCursor25').fill('1.25');p.locator('#faceCursor25').dispatch_event('input');p.wait_for_function('PulseApp.stage.director.models[0].faceDiagnostic?.open>.25',timeout=10000)
  ok('Live model mouth is animated by preview',p.evaluate('PulseApp.stage.director.models[0].faceDiagnostic.open>.25'))
  ok('Base source vertex array remains immutable',p.evaluate('PulseApp.stage.director.models[0].pmx.positions[24*3+1]>2.15'))
  ok('Desktop dialog uses available width without empty gutter',p.evaluate('document.querySelector("#modalContent>.dialog").getBoundingClientRect().width>900'));p.screenshot(path=str(Q/'02-face-preview.png'))
  p.evaluate('window.faceStore25=PulseApp.store.atomic;PulseApp.store.atomic=async()=>{throw Error("QA25 write denied")};void 0;');p.locator('#faceSave25').click();idle()
  ok('Rejected save preserves stored face source',p.evaluate('JSON.stringify(PulseApp.song.scene.faceTrack||null)===savedFace25'))
  ok('Rejected save preserves editor for retry',p.locator('#faceSave25').is_visible())
  p.evaluate('PulseApp.store.atomic=faceStore25;void 0;');p.locator('#faceSave25').click();idle()
  ok('Confirmed save commits facial plan and guide media',p.evaluate('PulseApp.song.scene.faceTrack?.sourceKind==="voice-guide"&&!!PulseApp.song.scene.faceTrack.sourceAsset'))
  ok('Facial editing never rewrites charts',p.evaluate('JSON.stringify(PulseApp.song.charts)===notes25'))
  p.evaluate('window.faceOwner25=PulseApp.song.id;window.faceAsset25=PulseApp.song.scene.faceTrack.sourceAsset')
  face();p.locator('summary').filter(has_text='Clés manuelles').click();p.locator('#faceMode25').select_option('manual');p.locator('#faceCursor25').fill('0');p.locator('#faceKeyValue25').fill('0');p.locator('#faceAddKey25').click();p.locator('#faceCursor25').fill('1');p.locator('#faceKeyValue25').fill('1');p.locator('#faceAddKey25').click();p.locator('#faceCursor25').fill('2');p.locator('#faceKeyValue25').fill('0');p.locator('#faceAddKey25').click()
  ok('Manual keys inserted through UI',p.locator('#faceKeys25 .face25-key').count()==3)
  with p.expect_download() as download:p.locator('#faceExport25').click()
  facefile=Q/'manual.pulseface.json';download.value.save_as(facefile)
  p.locator('#faceSave25').click();idle();ok('Manual track stored separately',p.evaluate('PulseApp.song.scene.faceTrack.mode==="manual"'))
  # Real GPU position buffer: mouth lower edge is displaced at the requested time.
  result=p.evaluate('''()=>{const s=PulseApp.stage,m=s.director.models[0];s.faceTrack=PulseApp.song.scene.faceTrack;s.faceLead=0;m.directorSlot=0;const empty={boneTracks:new Map(),morphTracks:new Map(),cameraTracks:[]};s.animateMMD(m,1,{current:{motion:empty,local:1,loop:false}});const gl=s.gl,arr=new Float32Array(m.pmx.positions.length);gl.bindBuffer(gl.ARRAY_BUFFER,m.geos[0].positionBuffer);gl.getBufferSubData(gl.ARRAY_BUFFER,0,arr);window.openGPU25=arr[24*3+1];window.scratch25=m.vertexScratch;s.animateMMD(m,2,{current:{motion:empty,local:2,loop:false}});gl.bindBuffer(gl.ARRAY_BUFFER,m.geos[0].positionBuffer);gl.getBufferSubData(gl.ARRAY_BUFFER,0,arr);return {opened:openGPU25,closed:arr[24*3+1],base:m.pmx.positions[24*3+1],error:gl.getError()};}''')
  ok('Facial displacement reaches actual GPU vertices',result['opened']<result['base']-.2)
  ok('Morph scratch memory is reused instead of a full allocation each frame',p.evaluate('PulseApp.stage.director.models[0].vertexScratch===scratch25'));ok('GPU vertex returns to source at zero weight',abs(result['closed']-result['base'])<.00001)
  ok('Facial buffer update has no GL error',result['error']==0)
  p.evaluate('''()=>{const s=PulseApp.stage,m=s.director.models[0],v={boneTracks:new Map(),morphTracks:new Map([['Talk',[{frame:0,weight:0},{frame:60,weight:0}]]]),cameraTracks:[]};s.animateMMD(m,1,{current:{motion:v,local:1,loop:false}});window.groupProtected25=m.faceDiagnostic.blocked&&m.faceDiagnostic.open===0;}''')
  ok('Actual renderer respects VMD group explicit zero',p.evaluate('groupProtected25'))
  face();p.locator('#faceCursor25').fill('0.5');p.locator('#faceCursor25').dispatch_event('input');p.set_viewport_size({'width':390,'height':844});p.screenshot(path=str(Q/'03-mobile-face.png'))
  ok('Mobile analysis button remains readable at full row width',p.evaluate('document.getElementById("faceAnalyze25").getBoundingClientRect().width>250'));ok('Facial editor fits mobile viewport',p.evaluate('document.getElementById("modal").getBoundingClientRect().right<=innerWidth+1'))
  p.locator('summary').filter(has_text='Clés manuelles').click();p.locator('#faceClearKeys25').click();p.locator('#faceImport25').set_input_files(str(facefile));idle();ok('Exported facial track restores into draft',p.locator('#faceKeys25 .face25-key').count()==3)
  p.locator('#faceCancel25').click();ok('Cancel clears preview clock',p.evaluate('PulseApp.facePreviewTime===null'))
  p.set_viewport_size({'width':1440,'height':1000})
  # Enable optional generation and create new music. Its manual predecessor is preserved.
  p.evaluate('window.savedManual25=JSON.stringify(PulseApp.song.scene.faceTrack);PulseApp.showView("settings")');p.locator('#autoFaceImport25').check();idle()
  p.locator('#audioInput').set_input_files(str(R/'examples/v25/VOIX_SYNTHETIQUE_TEST.wav'));idle();p.wait_for_function('PulseApp.song.duration<9')
  ok('New audio import automatically prepares face when enabled',p.evaluate('PulseApp.song.scene.faceTrack?.mode==="audio"'))
  ok('New audio keeps five generated difficulties',p.evaluate('PulseApp.song.charts.length===5'))
  ok('Auto face source has exact audio fingerprint',p.evaluate('PulseApp.song.scene.faceTrack.sourceHash===PulseApp.song.audioHash'))
  ok('Existing manual facial track is not replaced',p.evaluate('JSON.stringify(PulseApp.songs.find(s=>s.id===faceOwner25).scene.faceTrack)===savedManual25'))
  close();p.evaluate('window.newSong25=PulseApp.song.id;PulseApp.showView("settings")')
  with p.expect_download(timeout=60000) as download:p.locator('#bundleExport25').click();idle()
  bundle=Q/'roundtrip.pulsebundle';download.value.save_as(bundle);ok('Binary backup has expected magic',bundle.read_bytes()[:8]==b'PULSEB25')
  ok('Binary export includes shared face guide',p.evaluate('PulseApp.lastBundleExport.assets>=3'))
  p.evaluate('window.beforeRestore25=PulseApp.songs.length')
  p.locator('#backupInput').set_input_files(str(bundle));idle();p.wait_for_selector('#confirmRestore');p.locator('#confirmRestore').click();idle()
  ok('Binary restoration creates copies',p.evaluate('PulseApp.songs.length===beforeRestore25*2'))
  ok('Face guide media reference remapped on copy',p.evaluate('PulseApp.songs.some(s=>s.id!==faceOwner25&&s.scene.faceTrack?.sourceKind==="voice-guide"&&s.scene.faceTrack.sourceAsset!==faceAsset25)'))
  p.evaluate('''async()=>{const s=PulseApp.songs.find(s=>s.id!==faceOwner25&&s.scene.faceTrack?.sourceKind==='voice-guide');window.restoredFace25=s.id;await PulseApp.selectSong(s.id);}''');p.wait_for_function('PulseApp.stage.director?.models.length>=1')
  ok('Restored character and manual face reload into renderer',p.evaluate('PulseApp.stage.faceTrack.mode==="manual"&&PulseApp.stage.director.models[0].morphByName.has("mouthOpen")'))
  # Corruption never reaches the confirmation or writes.
  damaged=bytearray(bundle.read_bytes());damaged[-1]^=1;bad=Q/'corrupt.pulsebundle';bad.write_bytes(damaged);p.evaluate('window.songCount25=PulseApp.songs.length');close();p.locator('#backupInput').set_input_files(str(bad));idle()
  ok('Altered media is refused before restore confirmation',p.evaluate('!document.getElementById("modal").open&&PulseApp.songs.length===songCount25'))
  ok('Corrupt archive reports integrity error','altéré' in p.locator('#toast').inner_text())
  # Read-only rescue export must not make even one write.
  p.evaluate('window.realAtomic25=PulseApp.store.atomic;window.realPut25=PulseApp.store.put;PulseApp.store.atomic=PulseApp.store.put=async()=>{throw Error("QA25 no writes")};PulseApp.showView("settings")')
  with p.expect_download(timeout=60000) as download:p.locator('#bundleExport25').click();idle()
  download.value.save_as(Q/'read-only-rescue.pulsebundle');ok('Binary rescue export succeeds with every write forbidden',(Q/'read-only-rescue.pulsebundle').is_file())
  p.evaluate('PulseApp.store.atomic=realAtomic25;PulseApp.store.put=realPut25;void 0;')
  p.screenshot(path=str(Q/'04-backup-controls.png'))
  ok('No renderer frame failure',p.evaluate('!PulseApp.frameError'))
  ok('No unhandled JavaScript exception',not errors)
  b.close();p=None
except Exception as e:
 failure=str(e);print(traceback.format_exc(),flush=True)
 if p:
  try:p.screenshot(animations='disabled',timeout=12000,path=str(Q/'FAILURE.png'))
  except:pass
(Q/'browser-final.json').write_text(json.dumps({'version':'26.0.0','buildSha256':hashlib.sha256(html.encode()).hexdigest(),'passed':sum(c['passed'] for c in checks),'failed':sum(not c['passed'] for c in checks),'checks':checks,'failure':failure,'errors':errors,'warnings':warnings,'scope':'Real Chromium + software WebGL in opaque document. Temporary storage; no durability claim.'},indent=2,ensure_ascii=False))
if failure:raise SystemExit(1)
