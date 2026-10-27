"""V23 actual standalone build, real software WebGL2, fault-injected persistence paths.
No inference of physical hardware, Safari or IndexedDB durability from this suite.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,hashlib,base64,traceback
R=Path(__file__).resolve().parents[1];Q=R/'qa/v26/regression-v23';Q.mkdir(parents=True,exist_ok=True)
HTML=(R/'DIVA_PULSE_JOUER.html').read_text();checks=[];errors=[];console=[];failure=None;p=None
B={n:base64.b64encode((R/'examples/v23'/n).read_bytes()).decode() for n in ['SDEF_STRIP.pmx','QDEF_STRIP.pmx','BEND.vmd']}
def ok(n,v=True):
 checks.append({'name':n,'passed':bool(v)});print(('PASS ' if v else 'FAIL ')+n,flush=True)
 if not v:raise AssertionError(n)
def idle():p.wait_for_function('!PulseApp.busy',timeout=90000)
def close():
 if p.locator('#modal').evaluate('(e)=>e.open'):p.locator('#closeModal').click()
def director():
 close();p.evaluate('PulseApp.showView("wardrobe");document.getElementById("mmdPanel").open=true');p.locator('#openMmdDirector').click();p.wait_for_selector('#dSpacing')
try:
 with sync_playwright() as w:
  b=w.chromium.launch(executable_path='/usr/bin/chromium',headless=False,args=['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']);p=b.new_page(viewport={'width':1440,'height':1000});p.set_default_timeout(30000);p.on('pageerror',lambda e:errors.append(str(e)));p.on('console',lambda e:console.append(e.text) if e.type in ['error','warning'] else None)
  p.set_content(HTML);p.wait_for_function('document.documentElement.dataset.qualityReady==="true"');idle()
  ok('V23 title, version and diagnostic entry point',p.evaluate('PulseCore.VERSION==="26.0.0"&&document.title.includes("Reconnaissance")&&!!document.getElementById("qualityPanel")'))
  ok('Real WebGL2 renderer initialized',p.evaluate('PulseApp.stage.available&&PulseApp.stage.gl instanceof WebGL2RenderingContext'))
  probe=p.evaluate((R/'tests/v23_gpu_probe.js').read_text());(Q/'gpu-feedback.json').write_text(json.dumps(probe,indent=2))
  ok('36 GPU SDEF/QDEF/LBS transforms agree with CPU reference under 0.00002',probe['maxError']<2e-5)
  ok('GPU feedback has no GL error',probe['glError']==0)
  p.evaluate('''async data=>{const dec=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0)).buffer;window.skinData=data;window.dec23=dec;
   const cv=document.createElement('canvas');cv.width=500;cv.height=500;cv.id='skinCanvas';cv.style='position:fixed;left:400px;top:180px;z-index:40000;width:500px;height:500px';document.body.append(cv);window.skinStage=new PulseStage.Stage(cv);skinStage.cameraMode='front';skinStage.environment.hidden=true;
   window.loadSkin=async n=>{await skinStage.loadMMD(dec(data[n]),[dec(data['BEND.vmd'])],null,[],n);skinStage.custom.useIK=false;skinStage.custom.loop=false;skinStage.render(.5,120,{preview:true});};await loadSkin('SDEF_STRIP.pmx');}''',B)
  ok('SDEF PMX retains all three center buffers and weights at the renderer',p.evaluate('skinStage.custom.pmx.sdefC.length===18&&skinStage.custom.pmx.weightTypes.every(x=>x===3)&&skinStage.custom.geos[0].attributes[8].buffer!==null'))
  ok('Two materials share one bone palette and one GPU palette upload',p.evaluate('new Set(skinStage.custom.parts.map(n=>n.skin)).size===1&&skinStage.paletteUploads===1'))
  p.evaluate('''()=>{window.palette23=skinStage.custom.parts[0].skin._palette;skinStage.render(1,120,{preview:true});window.gpuSdef=(()=>{const a=new Float32Array(18),g=skinStage.gl;g.bindBuffer(g.ARRAY_BUFFER,skinStage.custom.geos[0].attributes[6].buffer);g.getBufferSubData(g.ARRAY_BUFFER,0,a);return [...a]})();}''')
  ok('Palette memory is reused across frames',p.evaluate('skinStage.custom.parts[0].skin._palette===palette23&&skinStage.paletteUploads===1'))
  ok('SDEF Z reflection reaches actual GPU attributes',p.evaluate('gpuSdef[2]===-.25'))
  p.screenshot(path=str(Q/'02-sdef-render.png'))
  p.evaluate('async()=>await loadSkin("QDEF_STRIP.pmx")')
  ok('QDEF PMX uses the QDEF shader path',p.evaluate('skinStage.custom.pmx.weightTypes.every(x=>x===4)&&skinStage.custom.geos[0].skinTypes.every(x=>x===4)&&skinStage.gl.getError()===0'))
  p.evaluate('skinStage.clearCustom();document.getElementById("skinCanvas").remove()')
  # A write denied by the actual Store transaction path, not a faked UI promise.
  p.evaluate('''()=>{window.prefs23=JSON.stringify(PulseApp.settings);window.realDB23=PulseApp.store.db;PulseApp.store.db={transaction(){const tx={error:new Error('QA quota denied'),objectStore(){return {put(){}}},abort(){}};queueMicrotask(()=>tx.onabort());return tx;}};}''')
  p.evaluate('''async()=>{PulseApp.settings.musicVolume=.03;try{await PulseApp.store.put('settings',PulseApp.settings)}catch{};}''')
  ok('Aborted preference write restores in-memory settings',p.evaluate('JSON.stringify(PulseApp.settings)===prefs23'))
  p.evaluate('PulseApp.store.db=realDB23;window.basePut23=PulseApp.store.put;window.favorite23=!!PulseApp.song.favorite;PulseApp.store.put=async()=>{throw Error("QA song denied")};true')
  p.locator('#favoriteSong').click();p.wait_for_timeout(200)
  ok('Failed favorite edit restores song and UI',p.evaluate('!!PulseApp.song.favorite===favorite23&&document.getElementById("favoriteSong").textContent===(favorite23?"♥":"♡")'))
  ok('Failed UI edit reports error without unhandled rejection',not errors)
  # Export succeeds even with every new write refused, including an unsaved editor copy.
  p.evaluate('''async()=>{const a=PulseApp;a.editor.ownerId=a.song.id;a.editor.originalId=a.chart.id;a.editor.chart=structuredClone(a.chart);a.editor.chart.title='UNSAVED QA CHART';a.editor.dirty=true;window.download23=PulseServices.download;PulseServices.download=(text,name)=>{window.backup23={text,name}};await a.exportBackup();a.editor.dirty=false;window.pack23=JSON.parse(backup23.text);}''')
  ok('Export performs no write and preserves unsaved chart separately',p.evaluate('pack23.drafts.some(d=>d.chart.title==="UNSAVED QA CHART")&&pack23.songs[0].charts.every(c=>c.title!=="UNSAVED QA CHART")'))
  p.evaluate('window.metaTitle23=PulseApp.song.title;PulseApp.songManager()');p.locator('#manageTitle').fill('TITRE NON SAUVEGARDÉ');p.locator('#saveSongMeta').click();idle()
  ok('Refused metadata write preserves source and retry field',p.evaluate('PulseApp.song.title===metaTitle23') and p.locator('#manageTitle').input_value()=='TITRE NON SAUVEGARDÉ')
  close();p.evaluate('window.queueCount23=PulseApp.v3State.setlists.length;PulseApp.setlistDialog()');p.locator('#queueAdd').click();p.locator('#queueSave').click();idle()
  ok('Refused setlist save never publishes a phantom list',p.evaluate('PulseApp.v3State.setlists.length===queueCount23&&PulseApp.queueDraft.length>0'))
  p.evaluate('PulseApp.store.put=basePut23;true');p.locator('#queueSave').click();idle()
  ok('Setlist save can be retried without losing its queue',p.evaluate('PulseApp.v3State.setlists.length===queueCount23+1'))
  p.evaluate('PulseApp.store.put=async()=>{throw Error("QA delete list denied")};true');p.locator('#savedLists .event-row').last.locator('button').last.click();idle()
  ok('Refused setlist removal preserves the saved list',p.evaluate('PulseApp.v3State.setlists.length===queueCount23+1'))
  p.evaluate('PulseApp.store.put=basePut23;true');close()
  p.evaluate('PulseApp.showView("wardrobe");document.getElementById("mmdPanel").open=true');p.locator('#mmdZipInput').set_input_files(str(R/'examples/v21/TROUPE_ORIGINALE_V21.zip'));p.wait_for_selector('#miCommit',state='visible');idle();p.locator('#miCommit').click();idle();p.wait_for_function('PulseApp.stage.director?.models.length===2')
  p.evaluate('window.notes23=JSON.stringify(PulseApp.song.charts);window.owner23=PulseApp.song.id;window.scene23=JSON.stringify(PulseApp.song.scene)')
  director();p.locator('#dSpacing').fill('2.3');p.locator('#dSpacing').dispatch_event('change');p.evaluate('async()=>await PulseApp.directorDraftWrite')
  ok('Director mutation is saved as separate draft',p.evaluate('async()=>{const d=await PulseApp.store.get("settings","director-draft:"+owner23);return d.director.spacing===2.3&&JSON.stringify(PulseApp.song.scene)===scene23;}'))
  close();director();p.wait_for_selector('#dRecover',state='visible');p.locator('#dRecover').click()
  ok('Closing and reopening offers explicit draft recovery',p.locator('#dSpacing').input_value()=='2.3')
  p.locator('#dUndo').click();ok('Recovered draft remains undoable',p.locator('#dSpacing').input_value()!='2.3');p.locator('#dRedo').click()
  p.evaluate('window.draftPut23=PulseApp.store.put;PulseApp.store.put=async(n,v)=>{if(n==="settings"&&v.id.startsWith("director-draft:"))throw Error("QA draft denied");return draftPut23(n,v)};true')
  p.locator('#dSpacing').fill('2.5');p.locator('#dSpacing').dispatch_event('change');p.evaluate('async()=>await PulseApp.directorDraftWrite')
  ok('Refused draft write is visibly reported and retained in memory',p.evaluate('PulseApp.directorRecoveries.get(owner23).director.spacing===2.5') and 'non sauvegardé' in p.locator('#dDraftStatus').inner_text())
  close();p.evaluate('PulseApp.store.put=draftPut23;true');director();p.wait_for_selector('#dRecover',state='visible');p.locator('#dRecover').click();ok('Memory recovery retains latest failed draft',p.locator('#dSpacing').input_value()=='2.5')
  close();p.evaluate('async()=>{await PulseApp.exportBackup();window.recoveryPack23=JSON.parse(backup23.text);}')
  ok('Portable backup contains Director recovery state',p.evaluate('recoveryPack23.directorDrafts.some(d=>d.songId===owner23&&d.director.spacing===2.5)'))
  p.evaluate('async()=>await PulseApp.restoreBackup(new File([JSON.stringify(recoveryPack23)],"V23.pulsepack"))');p.locator('#confirmRestore').click();idle()
  p.evaluate('''async()=>{const rows=await PulseApp.store.all('settings'),d=rows.find(x=>x.id.startsWith('director-draft:')&&x.songId!==owner23);window.restoredDraft23=d;await PulseApp.selectSong(d.songId);}''')
  ok('Restored draft has new owner, pack and asset references',p.evaluate('restoredDraft23.packId===PulseApp.song.scene.mmd.id&&restoredDraft23.director.slots.every(s=>PulseApp.song.scene.mmd.assetIds.includes(s.modelAssetId))'))
  director();p.wait_for_selector('#dRecover',state='visible');p.locator('#dRecover').click();ok('Restored portable draft can be recovered from UI',p.locator('#dSpacing').input_value()=='2.5')
  p.set_viewport_size({'width':390,'height':844});ok('Director recovery controls fit mobile dialog',p.evaluate('document.getElementById("modal").getBoundingClientRect().right<=innerWidth+1'));p.screenshot(path=str(Q/'03-mobile-recovery.png'));p.set_viewport_size({'width':1440,'height':1000})
  p.locator('#dSave').click();idle();p.wait_for_function('PulseApp.stage.director?.config.spacing===2.5')
  ok('Explicit save applies recovered draft and removes recovery marker',p.evaluate('async()=>PulseApp.song.scene.mmdDirector.spacing===2.5&&!await PulseApp.store.get("settings","director-draft:"+PulseApp.song.id)'))
  ok('Draft work and restore preserve rhythm chart contents',p.evaluate('JSON.stringify(PulseApp.song.charts)===notes23'))
  # Actual loss/restoration extension: no synthetic DOM-only context event.
  p.evaluate('async()=>await PulseApp.startGame("pv")');p.wait_for_timeout(250)
  p.evaluate('window.beforeContext23=JSON.stringify(PulseApp.song);window.lost23=PulseApp.stage.gl.getExtension("WEBGL_lose_context");lost23.loseContext()');p.wait_for_function('!PulseApp.stage.available')
  p.wait_for_function('PulseApp.paused');p.evaluate('window.pausedTime23=PulseApp.audio.time');p.wait_for_timeout(300)
  ok('Real GPU loss pauses the playing audio clock',p.evaluate('PulseApp.paused&&!PulseApp.audio.playing&&Math.abs(PulseApp.audio.time-pausedTime23)<.001'))
  ok('Context loss is detected without changing saved content',p.evaluate('JSON.stringify(PulseApp.song)===beforeContext23'))
  p.evaluate('lost23.restoreContext()');p.wait_for_function('PulseApp.stage.available&&PulseApp.stage.director?.models.length===2',timeout=45000)
  ok('Context restoration rebuilds and reloads both MMD models',p.evaluate('PulseApp.stage.director.config.spacing===2.5&&JSON.stringify(PulseApp.song)===beforeContext23'))
  ok('GPU recovery does not resume the performance without the player',p.evaluate('PulseApp.paused&&!PulseApp.audio.playing'))
  p.locator('#leaveGame').click();p.wait_for_function('PulseApp.view==="library"')
  p.evaluate('PulseApp.stage.render(1,120,{preview:true})');ok('Restored renderer has valid GL state',p.evaluate('PulseApp.stage.gl.getError()===0'))
  p.evaluate('''async()=>{window.beforeAudit23=JSON.stringify(PulseApp.songs);await PulseApp.showView('settings');}''');p.locator('#runQuality').click();idle()
  ok('Integrated library audit leaves songs unchanged',p.evaluate('JSON.stringify(PulseApp.songs)===beforeAudit23&&PulseApp.lastQualityReport.songs.length===PulseApp.songs.length'))
  p.locator('#exportQuality').click();idle();ok('Audit export contains explicit capability limitations',p.evaluate('JSON.parse(backup23.text).limitations.some(x=>x.includes("Bullet"))'))
  p.locator('#qualityPanel').scroll_into_view_if_needed();p.locator('#qualityRows details').first.locator('summary').click();p.screenshot(path=str(Q/'04-quality-report.png'))
  ok('Settings shortcuts expose the six actual sections',p.locator('.settings-shortcuts button').count()==6)
  # Faulty restored preferences must not insert half a library.
  p.evaluate('''async()=>{window.preRestoreCount=PulseApp.songs.length;const a=structuredClone(recoveryPack23);a.settings.musicVolume=Infinity;window.badRestore23=a;await PulseApp.restoreBackup(new File([JSON.stringify(a)],'bad.pulsepack'));}''')
  # JSON Infinity becomes null; null volume must be rejected just as arbitrary invalid numeric input.
  cb=p.locator('#restorePreferences')
  if cb.count():cb.check()
  else:
   boxes=p.locator('#modal input[type=checkbox]');print('restore checkbox ids',boxes.evaluate_all('(xs)=>xs.map(x=>x.id)'),flush=True)
  p.locator('#confirmRestore').click();idle()
  ok('Invalid preference restore is atomic and leaves copies uninserted',p.evaluate('PulseApp.songs.length===preRestoreCount'))
  close();p.evaluate('PulseServices.download=download23;true')
  ok('No unhandled exception in all V23 user journeys',not errors)
  ok('No persistent frame error',p.evaluate('!PulseApp.frameError'))
  b.close();p=None
except Exception as e:
 failure=str(e);print(traceback.format_exc(),flush=True)
 if p:
  try:p.screenshot(path=str(Q/'failure.png'))
  except:pass
finally:
 result={'buildSha256':hashlib.sha256(HTML.encode()).hexdigest(),'passed':sum(c['passed'] for c in checks),'total':len(checks),'failure':failure,'checks':checks,'errors':errors,'consoleWarnings':console,'storage':'temporary','renderer':'Chromium WebGL2 SwiftShader'};(Q/'browser-final.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print(json.dumps({k:v for k,v in result.items() if k not in ['checks','consoleWarnings']},ensure_ascii=False))
 if failure:raise SystemExit(1)
