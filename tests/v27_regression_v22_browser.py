"""V22 actual inline build + software WebGL2 + temporary store.
These tests do not certify real hardware or persistence after browser restart.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import base64,json,hashlib,traceback
R=Path(__file__).resolve().parents[1];Q=R/'qa/v27/regression-v22';Q.mkdir(parents=True,exist_ok=True)
HTML=(R/'DIVA_PULSE_JOUER.html').read_text();checks=[];errors=[];warnings=[];failure=None;p=None
B={n:base64.b64encode((R/'examples/v22'/n).read_bytes()).decode() for n in ['SURFACE_TEST.pmx','FADE.vmd','UV_SHIFT.vmd','GROUP.vmd','COLOR.tga']}
def ok(n,v=True):
 checks.append({'name':n,'passed':bool(v)});print(('PASS ' if v else 'FAIL ')+n,flush=True)
 if not v:raise AssertionError(n)
def idle():p.wait_for_function('!PulseApp.busy',timeout=90000)
def close():
 if p.locator('#modal').evaluate('(e)=>e.open'):p.locator('#closeModal').click()
def openSync():
 close();p.evaluate('PulseApp.showView("wardrobe");document.getElementById("mmdPanel").open=true');p.locator('#motionSyncOpen').click()
try:
 with sync_playwright() as pw:
  b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=False,args=['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required'])
  p=b.new_page(viewport={'width':1440,'height':1000});p.set_default_timeout(30000);p.on('pageerror',lambda e:errors.append(str(e)));p.on('console',lambda e:warnings.append(e.text) if e.type in ['warning','error'] else None)
  p.set_content(HTML);p.wait_for_function('document.documentElement.dataset.motionSyncReady==="true"');idle()
  ok('V22 build and new UI ready',p.evaluate('PulseCore.VERSION==="27.0.0"'))
  ok('Real software WebGL2 context',p.evaluate('PulseApp.stage.gl instanceof WebGL2RenderingContext'))
  p.screenshot(path=str(Q/'01-library.png'))
  p.evaluate('window.chartBefore=JSON.stringify(PulseApp.song.charts);PulseApp.showView("wardrobe");document.getElementById("mmdPanel").open=true')
  p.locator('#mmdInput').set_input_files([str(R/'examples/v22'/n) for n in ['SURFACE_TEST.pmx','FADE.vmd','COLOR.tga']]);p.wait_for_selector('#miCommit',state='visible');idle();p.locator('.mmd-model-audit details summary').first.click()
  ok('Morph-only VMD has compatible morph names','1/1 morphs correspondants' in p.locator('#modalContent').inner_text())
  p.locator('#miPreview').click();idle();ok('Independent preview renders the morph-only animation',p.evaluate('PulseApp.lastMMDPreview.rendered&&PulseApp.lastMMDPreview.glError===0') and 'FADE.vmd' in p.locator('#miMessage').inner_text())
  p.locator('#miCanvas').scroll_into_view_if_needed();p.screenshot(path=str(Q/'02-surface-preview.png'));p.locator('#miCommit').click();idle();p.wait_for_function('PulseApp.stage.director?.models.length===1')
  ok('AutoShow selects the morph-only VMD',p.evaluate('PulseApp.song.scene.autoShow.director.slots[0].clips.some(c=>c.motionAssetId!==null)'))
  ok('Import keeps chart data intact',p.evaluate('JSON.stringify(PulseApp.song.charts)===chartBefore'))
  p.evaluate('''async data=>{const dec=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0)).buffer;window.fixture=data;window.dec22=dec;
   const canvas=document.createElement('canvas');canvas.id='surfaceTestCanvas';canvas.width=540;canvas.height=540;canvas.style='position:fixed;left:350px;top:180px;width:540px;height:540px;z-index:50000';document.body.append(canvas);
   window.diag=new PulseStage.Stage(canvas);diag.cameraMode='front';diag.reduceMotion=true;diag.environment.hidden=true;
   await diag.loadMMD(dec(data['SURFACE_TEST.pmx']),[dec(data['FADE.vmd'])],null,[{name:'COLOR.tga',blob:new Blob([dec(data['COLOR.tga'])])}],'SURFACE_TEST.pmx');diag.custom.useIK=false;diag.custom.loop=false;
   window.pixels22=()=>{const g=diag.gl,a=new Uint8Array(g.drawingBufferWidth*g.drawingBufferHeight*4);g.readPixels(0,0,g.drawingBufferWidth,g.drawingBufferHeight,g.RGBA,g.UNSIGNED_BYTE,a);let sum=0;for(let i=0;i<a.length;i+=4)sum+=a[i]+a[i+1]+a[i+2];return sum;};
   window.uv22=()=>{const a=new Float32Array(diag.custom.pmx.uv.length);diag.gl.bindBuffer(diag.gl.ARRAY_BUFFER,diag.custom.geos[0].uvBuffer);diag.gl.getBufferSubData(diag.gl.ARRAY_BUFFER,0,a);return [...a];};
   window.motion22=name=>{const m=PulseMMD.parseVmd(dec(fixture[name]),{full:true});diag.custom.morphTracks=new Map();for(const k of m.morphs){if(!diag.custom.morphTracks.has(k.name))diag.custom.morphTracks.set(k.name,[]);diag.custom.morphTracks.get(k.name).push(k);}delete diag.custom._maxFrame;};
   diag.render(0,120,{preview:true});window.opaque22=pixels22();}''',B)
  ok('Two materials share one UV buffer',p.evaluate('diag.custom.parts.length===2&&new Set(diag.custom.geos.map(g=>g.uvBuffer)).size===1'))
  p.evaluate('diag.render(1,120,{preview:true})');ok('Material morph reaches zero opacity',p.evaluate('diag.custom.parts.every(p=>p.color[3]===0)'))
  ok('Material morph changes real framebuffer pixels',p.evaluate('Math.abs(pixels22()-opaque22)>10000'))
  p.evaluate('diag.render(2,120,{preview:true})');ok('Zero weight restores opacity without altering source',p.evaluate('diag.custom.parts.every(p=>p.color[3]===1)&&diag.custom.pmx.materials.every(p=>p.diffuse[3]===1)'))
  p.evaluate('motion22("UV_SHIFT.vmd");diag.render(1,120,{preview:true})');ok('UV morph reaches actual GPU buffer',p.evaluate('Math.abs(uv22()[0]-.625)<1e-6&&Math.abs(uv22()[1]-.5)<1e-6'));p.screenshot(path=str(Q/'03-uv-render.png'))
  p.evaluate('diag.render(2,120,{preview:true})');ok('Seek resets UV GPU buffer',p.evaluate('Math.abs(uv22()[0]-.125)<1e-6&&Math.abs(uv22()[1]-.75)<1e-6'))
  p.evaluate('motion22("GROUP.vmd");diag.render(1,120,{preview:true})');ok('Groups combine UV and opacity',p.evaluate('Math.abs(uv22()[0]-.375)<1e-6&&diag.custom.parts.every(p=>p.color[3]===.5)'))
  ok('Surface renderer has no WebGL error',p.evaluate('diag.gl.getError()===0'));p.evaluate('diag.clearCustom();diag.gl.getExtension("WEBGL_lose_context")?.loseContext();document.getElementById("surfaceTestCanvas").remove()')
  p.locator('#mmdZipInput').set_input_files(str(R/'examples/v21/TROUPE_ORIGINALE_V21.zip'));p.wait_for_selector('#miCommit',state='visible');idle();p.locator('#miCommit').click();idle();p.wait_for_function('PulseApp.stage.director?.models.length===2');p.evaluate('window.source22=PulseApp.song.id;window.notes22=JSON.stringify(PulseApp.song.charts)')
  openSync();ok('Calibration has all three user fields',p.locator('[data-key]').count()>=3)
  p.locator('[data-key=bpm]').first.fill('120');p.locator('[data-key=firstBeat]').first.fill('0');p.locator('[data-key=loopBeats]').first.fill('4');p.locator('#motionSyncSave').click();idle()
  ok('BPM calibration is saved in motion metadata',p.evaluate('PulseApp.song.scene.mmd.files.find(f=>f.role==="motion").info.sync.bpm===120'))
  ok('Source clock is present in actual AutoShow renderer clips',p.evaluate('PulseApp.song.scene.autoShow.director.rhythm.tempoMap.length>0&&PulseApp.stage.director.models.some(m=>m.directorClips.some(c=>c.sourceBpm===120))'))
  ok('Calibration never rewrites rhythm charts',p.evaluate('JSON.stringify(PulseApp.song.charts)===notes22'))
  ok('Renderer consumes music-beat source time',p.evaluate('''()=>{const s=PulseApp.stage,old=s.animateMMD,seen=[];s.animateMMD=function(m,t,x){seen.push(x.current.local);return old.call(this,m,t,x);};s.animateDirector(1);s.animateMMD=old;const c=s.director.models[0].directorClips[0],target=PulseMotionSync.sourceTime(c,1,s.director.config.rhythm).local;return seen.length===2&&Math.abs(seen[0]-target)<1e-8;}'''))
  openSync();p.locator('[data-key=bpm]').first.fill('999');p.evaluate('window.sceneBeforeInvalid=JSON.stringify(PulseApp.song.scene)');p.locator('#motionSyncSave').click();idle()
  ok('Invalid BPM preserves scene and shows error',p.evaluate('JSON.stringify(PulseApp.song.scene)===sceneBeforeInvalid') and 'hors plage' in p.locator('#motionSyncError').inner_text());p.locator('#motionSyncCancel').click()
  openSync();p.locator('[data-key=bpm]').first.fill('130');p.locator('[data-key=loopBeats]').first.fill('');p.evaluate('window.put22=PulseApp.store.put;window.failScene22=JSON.stringify(PulseApp.song.scene);PulseApp.store.put=async()=>{throw Error("V22 write denied")};true');p.locator('#motionSyncSave').click();idle()
  ok('Refused save preserves scene and retry dialog',p.evaluate('JSON.stringify(PulseApp.song.scene)===failScene22&&document.getElementById("modal").open') and 'write denied' in p.locator('#motionSyncError').inner_text());p.evaluate('PulseApp.store.put=put22;true');p.locator('#motionSyncCancel').click()
  p.evaluate('''async()=>{const a=PulseApp,n=structuredClone(a.song);n.scene.mmdDirector=structuredClone(n.scene.autoShow.director);await a.store.put('songs',n);Object.assign(a.song,n);window.manual22=JSON.stringify(a.song.scene.mmdDirector);await a.applyScene();const f=a.song.scene.mmd.files.find(f=>f.role==='motion');await a.saveMotionSync({[f.id]:{bpm:130,firstBeat:0,loopBeats:null}});}''')
  ok('Manual montage preserved after source profile update',p.evaluate('JSON.stringify(PulseApp.song.scene.mmdDirector)===manual22'))
  p.evaluate('''async()=>{window.download22=PulseServices.download;PulseServices.download=(text,name)=>{window.export22={text,name}};await PulseApp.exportBackup();window.ids22=PulseApp.song.scene.mmd.assetIds.slice();await PulseApp.restoreBackup(new File([export22.text],'V22.pulsepack'));}''');p.locator('#confirmRestore').click();idle();p.evaluate('async()=>await PulseApp.selectSong(PulseApp.songs.find(s=>s.id!==source22&&s.scene.mmd?.files.some(f=>f.info?.sync?.bpm===130)).id)')
  ok('Backup restores calibration and remaps asset IDs',p.evaluate('PulseApp.song.scene.mmd.files.some(f=>f.info?.sync?.bpm===130)&&PulseApp.song.scene.mmd.assetIds.every(id=>!ids22.includes(id))'))
  ok('Restored manual montage keeps original clip clock',p.evaluate('PulseApp.stage.director.models.length===2&&PulseApp.stage.director.models[0].directorClips[0].sourceBpm===120'))
  p.evaluate('PulseServices.download=download22;true');openSync();p.set_viewport_size({'width':390,'height':844})
  ok('Dialog fits portrait viewport',p.evaluate('()=>{const r=document.getElementById("modal").getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1;}'))
  ok('Inputs stay in portrait viewport',p.evaluate('Array.from(document.querySelectorAll(".sync-fields input")).every(e=>e.getBoundingClientRect().right<=innerWidth)'));p.screenshot(path=str(Q/'04-mobile-calibration.png'));close()
  ok('No unhandled JavaScript exception',not errors);ok('No frame renderer failure',p.evaluate('!PulseApp.frameError'));b.close();p=None
except Exception as e:
 failure=str(e);print(traceback.format_exc(),flush=True)
 if p:
  try:p.screenshot(path=str(Q/'failure.png'))
  except:pass
finally:
 result={'buildSha256':hashlib.sha256(HTML.encode()).hexdigest(),'passed':sum(c['passed'] for c in checks),'total':len(checks),'failure':failure,'checks':checks,'errors':errors,'consoleWarnings':warnings,'storage':'temporary','renderer':'Chromium WebGL2 SwiftShader'}
 (Q/'browser-final.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print(json.dumps({k:v for k,v in result.items() if k not in ['checks','consoleWarnings']},ensure_ascii=False))
 if failure:raise SystemExit(1)
