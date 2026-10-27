"""V19 real Chromium integration checks. All test media are original fixtures.
Navigation to HTTP and file URLs is blocked in this environment.
The standalone document is injected through the permitted test harness.
Its explicit in-memory fallback is tested, NOT browser restart persistence.
Set DISPLAY=:99 under Xvfb for Mesa/SwiftShader on Linux without a screen.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
import base64, json, os, tempfile, threading, traceback
from playwright.sync_api import sync_playwright

R = Path(__file__).resolve().parents[1]
Q = R/'qa/v19'; Q.mkdir(parents=True, exist_ok=True)
checks=[]; errors=[]; warnings=[]; requests=[]

def ok(name,value=True,detail=None):
    checks.append({'name':name,'passed':bool(value),'detail':detail})
    print(('PASS ' if value else 'FAIL ')+name,flush=True)
    if not value:
        try:
            p.screenshot(path=str(Q/'FAILURE.png'),full_page=True)
            (Q/'failure-page.txt').write_text(p.locator('body').inner_text(),encoding='utf8')
            print(p.locator('#directorMessage').inner_text() if p.locator('#directorMessage').count() else p.locator('#toast').inner_text(),flush=True)
        except Exception:pass
        raise AssertionError(f'{name}: {detail}')
class Handler(SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,directory=str(R)))
thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
url=f'http://127.0.0.1:{server.server_port}/'
args=['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']

def ready(page):
    page.wait_for_function('document.documentElement.dataset.ready === "true"',timeout=30000)
    page.wait_for_function('!PulseApp.busy')

def idle(page): page.wait_for_function('!PulseApp.busy',timeout=40000)

def change(page,sel,value):
    el=page.locator(sel);el.fill(str(value));el.dispatch_event('change')

def snap(page,name): page.screenshot(path=str(Q/name),full_page=False)

def watch(page):
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('console',lambda msg:warnings.append(msg.text) if msg.type in ['error','warning'] else None)
    page.on('request',lambda req:requests.append(req.url) if req.url.startswith(('https://','http://')) and not req.url.startswith(url) else None)

p=None;failure=None
try:
  with tempfile.TemporaryDirectory(prefix='diva19-chromium-') as profile, sync_playwright() as pw:
    def launch(): return pw.chromium.launch_persistent_context(profile,executable_path='/usr/bin/chromium',headless=True,args=args,viewport={'width':1440,'height':1000})
    context=launch();p=context.pages[0] if context.pages else context.new_page();watch(p);p.set_content((R/'DIVA_PULSE_JOUER.html').read_text());ready(p)
    ok('Standalone document build V19 loads the library',p.evaluate('PulseCore.VERSION==="19.0.0"&&PulseApp.songs.length===3&&PulseApp.chart.notes.length>0'))
    ok('Header identifies V19 rather than an old build','19.0' in p.locator('.brand').inner_text())
    ok('Real WebGL2 context available',p.evaluate('PulseApp.stage.available&&PulseApp.stage.gl instanceof WebGL2RenderingContext'))
    ok('Opaque test document honestly shows temporary storage',p.evaluate('!PulseApp.store.persistent') and 'TEMPORAIRE' in p.locator('#saveStatus').inner_text())
    snap(p,'01-library.png')
    p.locator('nav [data-view="settings"]').click();p.wait_for_function('PulseApp.view==="settings"')
    p.locator('#judgmentProfile').select_option('accessible');idle(p)
    ok('Accessible profile selected via settings',p.evaluate('PulseApp.settings.judgmentProfile==="accessible"'))
    ok('Settings expose actual Accessible timing windows','±45 / ±90 / ±135 / ±180' in p.locator('#judgmentWindows').inner_text())
    p.locator('#judgmentProfile').select_option('precision');idle(p)
    ok('Precision choice is written to the active local store',p.evaluate('async()=> (await PulseApp.store.get("settings","preferences")).judgmentProfile === "precision"'))
    ok('Records separate nonstandard profiles',p.evaluate('''()=>{const a=PulseApp,old=a.settings.judgmentProfile;a.settings.judgmentProfile="standard";const x=a.scoreKey(a.chart);a.settings.judgmentProfile="accessible";const y=a.scoreKey(a.chart);a.settings.judgmentProfile="precision";const z=a.scoreKey(a.chart);a.settings.judgmentProfile=old;return x!==y&&x!==z&&y!==z&&x.endsWith("/rules4");}'''))
    p.locator('nav [data-view="wardrobe"]').click();p.wait_for_function('PulseApp.view==="wardrobe"')
    p.locator('#mmdPanel').evaluate('(el)=>el.open=true')
    fixtures=[str(R/'examples/v19'/f) for f in ['PULSE_BOT_A.pmd','PULSE_BOT_B.pmd','MOTION_A.vmd','MOTION_B.vmd','DIAG.tga']]
    p.locator('#mmdInput').set_input_files(fixtures)
    p.wait_for_function('!PulseApp.busy&&PulseApp.song.scene.mmd?.files.length===5',timeout=40000)
    ok('Actual file-input imports two PMDs, two VMDs and RLE TGA',p.evaluate('PulseApp.song.scene.mmd.files.filter(f=>f.role==="model").length===2'))
    ok('A PMD renders with four bones and its remapped facial morph',p.evaluate('PulseApp.stage.custom?.kind==="mmd"&&PulseApp.stage.custom.bones.length===4&&PulseApp.stage.custom.pmx.morphs.some(m=>m.name==="Smile")'))
    ok('RLE TGA is decoded and uploaded as a real GPU texture',p.evaluate('PulseApp.stage.custom.textures.filter(Boolean).length>0'))
    ok('PMD draw has no WebGL errors',p.evaluate('PulseApp.stage.render(1,120,{preview:true});PulseApp.stage.gl.getError()===0'))
    ok('All imported files are persisted atomically',p.evaluate('async()=>{const s=await PulseApp.store.get("songs",PulseApp.song.id);const a=await PulseApp.store.all("assets");return s.scene.mmd.assetIds.every(id=>a.some(x=>x.id===id&&x.blob.size));}'))
    p.evaluate('window.savedChartSignatures=PulseApp.song.charts.map(PulseCore.chartSignature);window.mmdSongId=PulseApp.song.id')
    snap(p,'02-pmd-stage.png')
    p.locator('#openMmdDirector').click();p.wait_for_selector('#directorContent')
    change(p,'#dCount',2);change(p,'#dSpacing',2.4);p.locator('#dAuto').click()
    ok('Director UI builds two independent tracks',p.locator('.director-slot').count()==2 and p.locator('.director-block').count()>2)
    ok('Auto-PV edits do not modify the saved song before confirmation',p.evaluate('!PulseApp.song.scene.mmdDirector'))
    model_ids=p.evaluate('PulseApp.song.scene.mmd.files.filter(f=>f.role==="model").map(f=>f.id)')
    p.locator('[data-s="0"][data-field="modelAssetId"]').select_option(model_ids[0])
    p.locator('[data-s="1"][data-field="modelAssetId"]').select_option(model_ids[1])
    p.locator('#dPreview').click();idle(p)
    ok('Preview loads both different PMD model instances',p.evaluate('PulseApp.stage.director?.models.length===2&&PulseApp.stage.director.models[0].name!==PulseApp.stage.director.models[1].name'))
    ok('Preview cannot overwrite stored Director state',p.evaluate('async()=>!(await PulseApp.store.get("songs",PulseApp.song.id)).scene.mmdDirector'))
    p.locator('#dTime').fill('1');p.locator('#dTime').dispatch_event('input')
    ok('Timeline cursor drives the preview clock',p.evaluate('PulseApp.stage.directorPreview===1'))
    ok('Independent VMDs actually move the two root bones differently',p.evaluate('''()=>{PulseApp.stage.render(1,120,{preview:true});const m=PulseApp.stage.director.models;return Math.abs(m[0].bones[0].p[0]-m[1].bones[0].p[0])>.2;}'''))
    ok('Manual camera and light tracks are sampled by the renderer',p.evaluate('!!PulseApp.stage.director.activeCamera&&!!PulseApp.stage.director.activeLight'))
    ok('Director light is sent to the WebGL shader',p.evaluate('''()=>{const s=PulseApp.stage;return Math.abs(s.gl.getUniform(s.program,s.u.LightIntensity)-s.director.activeLight.intensity)<.0001;}'''))
    # Rendering is synchronous before readPixels (not testing a stale compositor frame).
    ok('PMD geometry really contributes pixels to the WebGL frame',p.evaluate("""()=>{const s=PulseApp.stage,gl=s.gl,d=s.director;s.render(1,120,{preview:true});const a=new Uint8Array(s.canvas.width*s.canvas.height*4),b=new Uint8Array(a.length);gl.readPixels(0,0,s.canvas.width,s.canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,a);const f=d.config.formations;d.config.formations=[{time:0,visible:[false,false],positions:PulseV10Core.positions(2,2.4)}];s.render(1,120,{preview:true});gl.readPixels(0,0,s.canvas.width,s.canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,b);d.config.formations=f;s.render(1,120,{preview:true});let n=0;for(let i=0;i<a.length;i+=4)if(a[i]!==b[i]||a[i+1]!==b[i+1]||a[i+2]!==b[i+2])n++;return n>100&&gl.getError()===0;}"""))
    p.locator('#dPreviewCanvas').scroll_into_view_if_needed();snap(p,'03-director-preview.png')
    # Use the actual compiled motions and PMD skeleton to validate a half-fade.
    ok('VMD blending reaches the weighted bone pose at 50%',p.evaluate('''()=>{const s=PulseApp.stage,m=s.director.models[0],other=s.director.models[1];const a=m.directorClips[0].motion,b=other.directorClips[0].motion;const pa=s._mmdPose(m,a,30),pb=s._mmdPose(m,b,30);s.animateMMD(m,1,{current:{motion:b,local:1,loop:false},previous:{motion:a,local:1,loop:false},alpha:.5});return Math.abs(m.bones[0].p[0]-(pa.transforms[0].p[0]+pb.transforms[0].p[0])/2)<1e-5;}'''))
    p.locator('details[data-panel="clips0"]').evaluate('(el)=>el.open=true')
    change(p,'[data-s="0"][data-c="0"][data-field="rate"]',1.5)
    ok('Clip rate can be edited in the actual Director',float(p.locator('[data-s="0"][data-c="0"][data-field="rate"]').input_value())==1.5)
    p.locator('#dUndo').click();ok('Director undo restores the prior clip rate',float(p.locator('[data-s="0"][data-c="0"][data-field="rate"]').input_value())==1,p.locator('[data-s="0"][data-c="0"][data-field="rate"]').input_value())
    p.locator('#dRedo').click();ok('Director redo restores the edit',float(p.locator('[data-s="0"][data-c="0"][data-field="rate"]').input_value())==1.5)
    change(p,'[data-s="0"][data-c="0"][data-field="rate"]',1)
    change(p,'[data-s="0"][data-c="1"][data-field="start"]',0)
    ok('Overlapping clips are rejected rather than partially accepted','chevauche' in p.locator('#directorMessage').inner_text().lower())
    # A benign edit rerenders the valid draft. The rejected start never entered it.
    change(p,'#dSpacing',2.6)
    ok('Rejected clip edit did not change the valid draft',float(p.locator('[data-s="0"][data-c="1"][data-field="start"]').input_value())>0)
    # A real mouse drag into an available interval, then undo both edits.
    p.locator('[data-del="0,1"]').click()
    block=p.locator('.director-lane').first.locator('.director-block').first
    block.scroll_into_view_if_needed();box=block.bounding_box();x=box['x']+box['width']/2;y=box['y']+box['height']/2
    p.mouse.move(x,y);p.mouse.down();p.mouse.move(x+12,y,steps=5);p.mouse.up()
    ok('Dragging a timeline block changes its audio start in a free interval',float(p.locator('[data-s="0"][data-c="0"][data-field="start"]').input_value())>0)
    p.locator('#dUndo').click();p.locator('#dUndo').click()
    ok('Undo restores both the dragged clip and the removed neighbor',p.locator('[data-s="0"][data-c="1"][data-field="start"]').count()==1 and float(p.locator('[data-s="0"][data-c="0"][data-field="start"]').input_value())==0)
    p.locator('details[data-panel="keys"]').evaluate('(el)=>el.open=true')
    change(p,'[data-track="camera"][data-k="0"][data-field="distance"]',6.5)
    change(p,'[data-track="light"][data-k="0"][data-field="intensity"]',0)
    p.locator('#dTime').fill('0');p.locator('#dTime').dispatch_event('input')
    p.locator('#dPreview').click();idle(p)
    ok('Manual camera key is loaded from the editable draft',p.evaluate('PulseApp.stage.director.config.cameraTrack[0].distance===6.5'))
    ok('A zero-intensity light key remains zero in the real shader',p.evaluate('()=>{const s=PulseApp.stage;s.render(0,120,{preview:true});return s.gl.getUniform(s.program,s.u.LightIntensity)===0;}'))
    p.evaluate('()=>{window.realPut=PulseApp.store.put;PulseApp.store.put=async function(store,value){if(store==="songs")throw Error("QA sauvegarde refusée");return realPut.call(this,store,value);};}')
    p.locator('#dSave').click();idle(p)
    ok('Failed Director save preserves the draft and leaves the song unchanged',p.evaluate('document.getElementById("modal").open&&!PulseApp.song.scene.mmdDirector'))
    ok('Failed save is visible to the player','QA sauvegarde refusée' in p.locator('#toast').inner_text())
    p.evaluate('()=>{PulseApp.store.put=realPut;}')
    p.locator('#dSave').click();idle(p);p.wait_for_function('!document.getElementById("modal").open')
    ok('Director saves both models, clips, formation and camera/light tracks',p.evaluate('async()=>{const d=(await PulseApp.store.get("songs",PulseApp.song.id)).scene.mmdDirector;return d.count===2&&d.slots.every(s=>s.modelAssetId&&s.clips.length)&&d.formations.length&&d.cameraTrack.length&&d.lightTrack.length;}'))
    ok('Editing a complete spectacle leaves every chart unchanged',p.evaluate('JSON.stringify(savedChartSignatures)===JSON.stringify(PulseApp.song.charts.map(PulseCore.chartSignature))'))
    p.evaluate('()=>{window.downloadOriginal=PulseServices.download;PulseServices.download=(data,name)=>{window.exportedPack=JSON.parse(data);window.exportedName=name;};}')
    p.evaluate('async()=>{await PulseApp.exportBackup(PulseApp.song);}')
    ok('Production pulsepack export contains every MMD asset',p.evaluate('exportedPack.assets.length===5&&PulseDirector.assetReferences(exportedPack.songs[0].scene).every(id=>exportedPack.assets.some(a=>a.id===id))'))
    before=p.evaluate('PulseApp.songs.length')
    p.evaluate('async()=>{await PulseApp.restoreBackup(new File([JSON.stringify(exportedPack)],"roundtrip.pulsepack",{type:"application/json"}));}')
    p.locator('#confirmRestore').click();idle(p)
    ok('Actual restoration creates a copy without replacing the source',p.evaluate('PulseApp.songs.length')==before+1)
    ok('Restored Director references newly created asset IDs',p.evaluate('''async()=>{const s=PulseApp.songs.at(-1),ids=s.scene.mmd.assetIds,orig=exportedPack.songs[0].scene.mmd.assetIds;return s.id!==mmdSongId&&ids.every(id=>!orig.includes(id))&&PulseDirector.assetReferences(s.scene).every(id=>ids.includes(id))&&s.scene.mmdDirector.cameraTrack.length>0;}'''))
    p.evaluate('async()=>{window.copySongId=PulseApp.songs.at(-1).id;await PulseApp.selectSong(copySongId);await PulseApp.applyScene();}')
    ok('Restored PMD troupe really reloads in the renderer',p.evaluate('PulseApp.stage.director?.models.length===2&&PulseApp.stage.gl.getError()===0'))
    # Missing files fail on the active restore path before an atomic commit.
    p.evaluate('async()=>{window.badPack=structuredClone(exportedPack);badPack.assets.pop();window.countBeforeBad=PulseApp.songs.length;await PulseApp.restoreBackup(new File([JSON.stringify(badPack)],"missing.pulsepack"));}')
    p.locator('#confirmRestore').click();idle(p)
    ok('Restore with missing MMD media cannot insert a partial song',p.evaluate('PulseApp.songs.length===countBeforeBad&&document.getElementById("modal").open'))
    p.locator('#closeModal').click()
    p.evaluate('()=>{PulseServices.download=downloadOriginal;}')
    # Different viewport, same real project. Not represented as an iPhone device test.
    p.set_viewport_size({'width':390,'height':844});p.evaluate('PulseApp.openMMDDirector()');p.wait_for_selector('#dCount')
    snap(p,'04-mobile-director.png')
    ok('Director remains within the simulated mobile viewport',p.evaluate('''()=>{const r=document.getElementById("modal").getBoundingClientRect();return r.left>=-1&&r.right<=innerWidth+1;}'''))
    ok('Mobile Director button labels fit inside their controls',p.evaluate('Array.from(document.querySelectorAll("#directorContent .buttons button")).filter(b=>b.clientWidth>0).every(b=>b.scrollWidth<=b.clientWidth+1)'))
    p.keyboard.press('Escape');p.wait_for_function('!document.getElementById("modal").open');ok('Escape really cleans up the Director',p.evaluate('PulseApp.stage.directorPreview===undefined'))
    p.set_viewport_size({'width':1440,'height':1000});p.locator('nav [data-view="library"]').click();p.wait_for_function('PulseApp.view==="library"')
    p.locator('#audioInput').set_input_files(str(R/'examples/v19/TRIPLE_PULSE.wav'))
    p.wait_for_function('!PulseApp.busy&&PulseApp.songs.some(s=>s.title.includes("TRIPLE PULSE"))',timeout=60000)
    # The import summary modal may remain open.
    if p.locator('#modal').evaluate('(el)=>el.open'):p.locator('#closeModal').click()
    p.evaluate('async()=>{window.autoSongId=PulseApp.songs.find(s=>s.title.includes("TRIPLE PULSE")).id;await PulseApp.selectSong(autoSongId);}')
    ok('Real WAV decoding/worker analysis creates all five difficulties',p.evaluate('PulseApp.song.charts.length===5&&PulseApp.song.charts.every(c=>c.generator?.algorithmRevision===19)'))
    ok('Generated charts preserve exact inherited timing, lane and positions',p.evaluate('''()=>{const cs=PulseApp.song.charts;for(let i=1;i<cs.length;i++){const dst=new Set(cs[i].notes.map(n=>JSON.stringify([n.time,n.lane,n.x,n.y,n.type])));if(cs[i-1].notes.some(n=>!dst.has(JSON.stringify([n.time,n.lane,n.x,n.y,n.type]))))return false;}return true;}'''))
    ok('Mapping does not invent notes in the silent start/end',p.evaluate('PulseApp.song.charts.every(c=>c.notes.every(n=>n.time>.35&&n.time<7.65))'))
    ok('Every generated chart shares the same tempo map',p.evaluate('new Set(PulseApp.song.charts.map(c=>JSON.stringify(c.tempoMap))).size===1'))
    snap(p,'05-automap.png')
    p.evaluate('window.recordsBefore=PulseApp.scores.length')
    p.locator('#autoButton').click();p.wait_for_function('PulseApp.view==="game"',timeout=30000)
    ok('Gameplay uses the selected Precision judgment profile',p.evaluate('PulseApp.engine.profile==="precision"'))
    p.wait_for_function('PulseApp.view==="results"',timeout=30000)
    ok('Complete real-audio autoplay finishes at 100 percent',p.evaluate('PulseApp.lastResult.accuracy===100&&PulseApp.lastResult.counts.MISS===0'),p.evaluate('PulseApp.lastResult'))
    ok('Autoplay cannot write a normal player record',p.evaluate('PulseApp.scores.length===recordsBefore'))
    snap(p,'06-results.png')
    p.evaluate('PulseApp.showView("library")');p.wait_for_function('PulseApp.view==="library"')
    p.evaluate('async()=>{const s=await PulseApp.store.get("songs",copySongId);const index=PulseApp.songs.findIndex(x=>x.id===copySongId);PulseApp.songs[index]=s;await PulseApp.selectSong(copySongId);await PulseApp.applyScene();}')
    ok('Reloading saved song data retains MMD blobs and Director associations',p.evaluate('PulseApp.stage.director?.models.length===2&&PulseApp.stage.director.models.every(m=>m.textures.some(Boolean))'))
    ok('No uncaught JavaScript errors across all integrated flows',not errors,errors)
    ok('No external runtime dependency or network request',not requests,requests)
    context.close()
    # Fallback is a separate browser, explicitly excluding 3D claims.
    browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-webgl','--autoplay-policy=no-user-gesture-required']);p=browser.new_page(viewport={'width':1280,'height':800});watch(p);p.set_content((R/'DIVA_PULSE_JOUER.html').read_text());ready(p)
    ok('Fallback library boots when WebGL is disabled',p.evaluate('!PulseApp.stage.available&&PulseApp.songs.length===3'))
    p.locator('nav [data-view="wardrobe"]').click();p.locator('#mmdPanel').evaluate('(el)=>el.open=true');p.locator('#mmdInput').set_input_files(fixtures);p.wait_for_function('!PulseApp.busy&&!!PulseApp.song.scene.mmd',timeout=30000)
    p.locator('#openMmdDirector').click();p.locator('#dAuto').click();p.locator('#dPreview').click();idle(p)
    ok('No-WebGL Director remains editable and reports preview unavailable','WebGL2 indisponible' in p.locator('#toast').inner_text())
    p.locator('#dSave').click();idle(p)
    ok('No-WebGL setup can still save an MMD Director for later playback',p.evaluate('!!PulseApp.song.scene.mmdDirector'))
    browser.close();p=None
except Exception as exc:
    failure=str(exc);print(traceback.format_exc(),flush=True)
    if p:
        try:snap(p,'FAILURE.png');(Q/'failure-page.txt').write_text(p.locator('body').inner_text())
        except Exception:pass
finally:
    server.shutdown();server.server_close();thread.join(timeout=3)
    result={'passed':sum(c['passed'] for c in checks),'failed':sum(not c['passed'] for c in checks),'completed':failure is None,'failure':failure,'checks':checks,'uncaught':errors,'consoleWarnings':warnings,'externalRequests':requests,'scope':'Chromium desktop document injected by Playwright, SwiftShader WebGL2, explicit in-memory storage fallback, original PMD/VMD/TGA/WAV fixtures, responsive viewport and no-WebGL fallback. HTTP/file navigation blocked by browser policy: IndexedDB browser restart NOT validated. No physical MIDI/gamepad/Safari test.'}
    (Q/'browser-final.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
    print(json.dumps({k:result[k] for k in ['passed','failed','completed','failure']},ensure_ascii=False),flush=True)
if failure:raise SystemExit(1)
