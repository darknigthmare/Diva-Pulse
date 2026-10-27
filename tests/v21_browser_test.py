"""V21 file-bound integration. Document injection is used because this environment
blocks browser loopback navigation. Actual WebGL2/SwiftShader; temporary store.
No claim of real hardware, browser restart persistence, or universal MMD assets.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,hashlib,traceback,base64
R=Path(__file__).resolve().parents[1];Q=R/'qa/v21';Q.mkdir(parents=True,exist_ok=True)
HTML=(R/'DIVA_PULSE_JOUER.html').read_text();checks=[];errors=[];console=[];failure=None;p=None

def ok(name,value=True,detail=None):
 checks.append({'name':name,'passed':bool(value),'detail':detail});print(('PASS ' if value else 'FAIL ')+name,flush=True)
 if not value:raise AssertionError(name+': '+str(detail))
def idle():p.wait_for_function('!PulseApp.busy',timeout=90000)
def close():
 if p.locator('#modal').evaluate('(e)=>e.open'):p.locator('#closeModal').click()
def select(view):
 close();p.locator(f'nav [data-view="{view}"]').click();idle()
def importzip(name='TROUPE_ORIGINALE_V21.zip'):
 p.locator('#mmdZipInput').set_input_files(str(R/'examples/v21'/name));p.wait_for_selector('#miCommit',state='visible',timeout=30000);idle()
def shot(name):p.screenshot(path=str(Q/name),full_page=False)
def watch(page):
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('console',lambda e:console.append(e.text) if e.type in ['warning','error'] else None)
try:
 with sync_playwright() as pw:
  b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=False,args=['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required'])
  p=b.new_page(viewport={'width':1440,'height':1000});p.set_default_timeout(15000);watch(p);p.set_content(HTML);p.wait_for_function('document.documentElement.dataset.autoShowReady==="true"');idle()
  ok('V21 boot, automatic show and import tools are ready',p.evaluate('PulseCore.VERSION==="21.0.0"&&document.documentElement.dataset.mmdImportReady==="true"'))
  ok('Real WebGL2 context is available',p.evaluate('PulseApp.stage.gl instanceof WebGL2RenderingContext'))
  ok('New MMD bone palette has 1024 slots',p.evaluate('PulseApp.stage.boneCapacity===1024'))
  ok('Temporary storage is disclosed',not p.evaluate('PulseApp.store.persistent') and 'TEMPORAIRE' in p.locator('#saveStatus').inner_text())
  select('wardrobe');p.locator('#mmdPanel > summary').click();p.evaluate('async()=>{window.originalScene=JSON.stringify(PulseApp.song.scene);window.originalCharts=JSON.stringify(PulseApp.song.charts);window.originalAssets=(await PulseApp.store.all("assets")).length;window.sourceId=PulseApp.song.id;}')
  importzip();ok('ZIP preflight lists both real PMD models',p.locator('.mmd-model-audit').count()==2)
  ok('Relative parent textures resolved before commit','Textures à compléter : 0.' in p.locator('#modalContent').inner_text())
  ok('Nothing is stored during preflight',p.evaluate('async()=>JSON.stringify(PulseApp.song.scene)===originalScene&&(await PulseApp.store.all("assets")).length===originalAssets'))
  p.locator('.mmd-model-audit details summary').first.click()
  ok('Compatible VMD bone names are reported','4/4 noms d’os correspondants' in p.locator('#modalContent').inner_text())
  ok('Preflight uses the desktop dialog width instead of a half-width panel',p.evaluate('()=>{const a=document.querySelector("#modalContent>.dialog").getBoundingClientRect();const b=document.getElementById("modal").getBoundingClientRect();return a.width>=b.width*.95;}'))
  shot('02-preflight.png')
  p.locator('[data-import-model]').nth(1).uncheck();p.locator('#miPreview').click();idle()
  ok('Disposable pre-import preview actually renders the selected PMD',p.evaluate('PulseApp.lastMMDPreview.rendered&&PulseApp.lastMMDPreview.bones===4&&PulseApp.lastMMDPreview.glError===0'))
  ok('Preview leaves active scene and song data unchanged',p.evaluate('JSON.stringify(PulseApp.song.scene)===originalScene&&!PulseApp.stage.director'))
  p.locator('#miCanvas').scroll_into_view_if_needed();shot('03-model-preview.png')
  p.locator('#miCancel').click();ok('Cancelling preview keeps the original scene and media',p.evaluate('async()=>JSON.stringify(PulseApp.song.scene)===originalScene&&(await PulseApp.store.all("assets")).length===originalAssets'))
  importzip('TEXTURE_MANQUANTE_V21.zip');ok('Missing texture prevents an unacknowledged import',p.locator('#miCommit').is_disabled())
  p.locator('#miMissing').check();ok('Explicit acknowledgement enables degraded import',p.locator('#miCommit').is_enabled());p.locator('#miCancel').click()
  importzip('MODEL_INVALIDE_V21.zip');ok('Invalid model appears as blocked',p.locator('#miCommit').is_disabled() and 'REFUSÉ' in p.locator('#modalContent').inner_text());p.locator('#miCancel').click()
  importzip();p.locator('#miCommit').click();idle();p.wait_for_function('PulseApp.stage.director?.models.length===2')
  ok('Validated ZIP creates a two-model MMD AutoShow',p.evaluate('PulseApp.song.scene.mmd.files.length===4&&PulseApp.song.scene.autoShow.director.count===2'))
  ok('Both models actually load their parent-folder TGA texture',p.evaluate('PulseApp.stage.director.models.every(m=>m.textures.length===1&&m.parts.every(p=>!!p.texture))'))
  ok('Material VAOs share a single position buffer per model',p.evaluate('PulseApp.stage.director.models.every(m=>m.parts.length===7&&new Set(m.geos.map(g=>g.positionBuffer)).size===1)'))
  ok('MMD bone animation changes with the song clock',p.evaluate('()=>{const s=PulseApp.stage;s.animateDirector(.5);const q=JSON.stringify(s.director.models[0].bones.map(b=>b.q));s.animateDirector(1);return q!==JSON.stringify(s.director.models[0].bones.map(b=>b.q));}'))
  ok('Rendered troupe is error-free in WebGL',p.evaluate('()=>{PulseApp.stage.render(1,128,{preview:true});return PulseApp.stage.gl.getError()===0;}'))
  # Deterministically render between texture decoding and upload. In the old
  # loader this overwrote the float bone texture with RGBA bytes (GL 1282).
  ok('A frame rendered during texture decoding cannot corrupt the bone palette',p.evaluate("""async()=>{const a=PulseApp,s=a.stage,files=a.song.scene.mmd.files;const model=files.find(f=>f.role==='model'),tex=files.find(f=>f.role==='texture'),motion=files.find(f=>f.role==='motion');const mb=await(await a.store.get('assets',model.id)).blob.arrayBuffer(),tb=await(await a.store.get('assets',tex.id)).blob.arrayBuffer(),vb=await(await a.store.get('assets',motion.id)).blob.arrayBuffer();const interrupted={name:tex.name,blob:{arrayBuffer:async()=>{s.render(2,128,{preview:true});return tb;}}};const info=await s.loadMMD(mb,[vb],null,[interrupted],model.name,true);s.render(3,128,{preview:true});const good=s.gl.getError()===0&&info.model.textures.length===1;s._disposeCustom(info.model);return good;}"""))
  ok('Import did not change the rhythm charts',p.evaluate('JSON.stringify(PulseApp.song.charts)===originalCharts'))
  shot('04-imported-troupe.png')
  p.locator('#setDefaultMmd').click();idle();ok('Default troupe is saved explicitly',p.evaluate('PulseApp.settings.mmdDefaultSourceId===sourceId'))
  select('library');p.evaluate('window.assetsWithModels=PulseApp.song.scene.mmd.assetIds.slice()')
  p.locator('#audioInput').set_input_files(str(R/'examples/v19/TRIPLE_PULSE.wav'));p.wait_for_function('!PulseApp.busy&&PulseApp.songs.some(s=>s.title.includes("TRIPLE PULSE"))',timeout=90000);close()
  p.evaluate('async()=>{await PulseApp.selectSong(PulseApp.songs.find(s=>s.title.includes("TRIPLE PULSE")).id);window.newSongId=PulseApp.song.id;}')
  ok('One audio import creates 5 charts and inherits the selected cast',p.evaluate('PulseApp.song.charts.length===5&&PulseApp.song.scene.mmdInheritedFrom.songId===sourceId'))
  ok('Inherited cast references the same stored assets without copying files',p.evaluate('JSON.stringify(PulseApp.song.scene.mmd.assetIds)===JSON.stringify(assetsWithModels)'))
  ok('Inherited MMD troupe is animated by the new song AutoShow',p.evaluate('PulseApp.stage.director.models.length===2&&PulseApp.song.scene.autoShow.director.slots[0].clips.length>0'))
  p.evaluate('async()=>await PulseApp.selectSong(PulseApp.songs[1].id)')
  ok('Previously existing songs are not overwritten by a default troupe',p.evaluate('!PulseApp.song.scene.mmd'))
  p.evaluate('async()=>await PulseApp.selectSong(sourceId)');select('wardrobe')
  importzip();p.evaluate('async()=>{window.beforeFailure=JSON.stringify(PulseApp.song.scene);window.beforeFailureAssets=(await PulseApp.store.all("assets")).length;window.oldAtomic=PulseApp.store.atomic;PulseApp.store.atomic=async()=>{throw Error("V21 QA write denied");};}')
  p.locator('#miCommit').click();idle()
  ok('Failed import keeps previous scene and retry controls',p.evaluate('document.getElementById("modal").open&&JSON.stringify(PulseApp.song.scene)===beforeFailure'))
  ok('Failed import inserts no new media',p.evaluate('async()=>(await PulseApp.store.all("assets")).length===beforeFailureAssets'))
  ok('Failed import reports write failure','write denied' in p.locator('#toast').inner_text())
  p.evaluate('()=>{PulseApp.store.atomic=oldAtomic;}');p.locator('#miCancel').click()
  # High-bone test uses real binary PMD + VMD fixtures, not fabricated model objects.
  p.locator('#mmdInput').set_input_files([str(R/'examples/v21'/n) for n in ['SQUELETTE_300_OS.pmd','MOTION_300_OS.vmd']]);p.wait_for_selector('#miCommit',state='visible');idle()
  ok('300-bone PMD is accepted by the preflight',p.locator('#miCommit').is_enabled() and '300 os' in p.locator('#modalContent').inner_text())
  p.locator('#miPreview').click();idle();ok('Actual renderer loads and draws a 300-bone PMD',p.evaluate('PulseApp.lastMMDPreview.bones===300&&PulseApp.lastMMDPreview.glError===0'))
  p.locator('#miCancel').click()
  p.evaluate('async()=>{window.downloadOriginal=PulseServices.download;PulseServices.download=(text,name)=>{window.exported={text,name};};await PulseApp.exportBackup();window.pack=JSON.parse(exported.text);window.beforeRestore=PulseApp.songs.length;}')
  ok('Backup contains all four MMD data files',p.evaluate('pack.assets.filter(a=>a.kind.startsWith("mmd-")).length===4'))
  p.evaluate('async()=>await PulseApp.restoreBackup(new File([JSON.stringify(pack)],"troupe.pulsepack"))');p.locator('#restorePreferences').check();p.locator('#confirmRestore').click();idle()
  ok('Full library restores as copies',p.evaluate('PulseApp.songs.length===beforeRestore*2'))
  ok('Default troupe preference is remapped to the restored source song',p.evaluate('PulseApp.settings.mmdDefaultSourceId!==sourceId&&PulseApp.songs.some(s=>s.id===PulseApp.settings.mmdDefaultSourceId&&s.scene.mmd)'))
  p.evaluate('async()=>await PulseApp.selectSong(PulseApp.settings.mmdDefaultSourceId)')
  ok('Restored troupe reloads with real textures and new asset IDs',p.evaluate('PulseApp.stage.director.models.length===2&&PulseApp.stage.director.models.every(m=>m.textures.length===1)&&PulseApp.song.scene.mmd.assetIds.every(x=>!assetsWithModels.includes(x))'))
  p.evaluate('()=>{PulseServices.download=downloadOriginal;}');select('wardrobe');p.locator('#clearDefaultMmd').click();idle()
  ok('Automatic reuse can be turned off without deleting the model',p.evaluate('PulseApp.settings.mmdDefaultSourceId===null&&!!PulseApp.song.scene.mmd'))
  p.set_viewport_size({'width':390,'height':844});importzip()
  ok('Preflight dialog fits a portrait viewport',p.evaluate('()=>{const r=document.getElementById("modal").getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1;}'))
  ok('Preflight button labels do not overflow on mobile',p.evaluate('Array.from(document.querySelectorAll("#modalContent button")).every(b=>b.scrollWidth<=b.clientWidth+1)'))
  shot('05-mobile-preflight.png');p.locator('#miCancel').click()
  ok('No unhandled JavaScript errors',not errors,errors);ok('No renderer frame failure',p.evaluate('!PulseApp.frameError'));b.close()
  b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-webgl']);p=b.new_page(viewport={'width':1280,'height':800});watch(p);p.set_content(HTML);p.wait_for_function('document.documentElement.dataset.autoShowReady==="true"');select('wardrobe');importzip()
  ok('No-WebGL environment explicitly disables 3D preview',p.locator('#miPreview').is_disabled() and 'WebGL2 indisponible' in p.locator('#modalContent').inner_text())
  p.locator('#miCommit').click();idle();ok('Pack can be stored in fallback mode without pretending to render it',p.evaluate('!PulseApp.stage.available&&!!PulseApp.song.scene.mmd&&!!document.getElementById("fallbackStage")'))
  ok('Fallback import has no unhandled exception',not errors,errors);b.close();p=None
except Exception as e:
 failure=str(e);print(traceback.format_exc(),flush=True)
 if p:
  try:shot('failure.png');(Q/'failure-page.txt').write_text(p.locator('body').inner_text());print('TOAST',p.locator('#toast').inner_text())
  except Exception:pass
finally:
 result={'buildSha256':hashlib.sha256(HTML.encode()).hexdigest(),'completed':failure is None,'passed':sum(c['passed'] for c in checks),'failed':sum(not c['passed'] for c in checks),'failure':failure,'checks':checks,'uncaughtErrors':errors,'consoleWarnings':console,'scope':'Chromium, real WebGL2 via software SwiftShader, document injection, temporary storage. No browser-restart persistence or physical peripherals test.'}
 (Q/'browser-final.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print(json.dumps({k:result[k] for k in ['completed','passed','failed','failure']}),flush=True)
if failure:raise SystemExit(1)
