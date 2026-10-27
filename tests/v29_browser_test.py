"""V29 real UI batch edits and atomic save, using a native SwiftShader renderer.
Document injection uses temporary storage; durability is a separate test suite.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json, hashlib, traceback, os
R=Path(__file__).resolve().parents[1];Q=R/os.environ.get('PULSE_QA_DIR','qa/v32/regression-director');Q.mkdir(parents=True,exist_ok=True)
version=(R/'VERSION.txt').read_text().strip()
checks=[];errors=[];failure=None;p=None
html=(R/'index.html').read_text()
def ok(name,value=True):
 checks.append({'name':name,'passed':bool(value)});print(('PASS ' if value else 'FAIL ')+name,flush=True)
 if not value:raise AssertionError(name)
def idle():p.wait_for_function('!PulseApp.busy',timeout=90000)
def draft():return p.evaluate('async()=>{await PulseApp.directorDraftWrite;return PulseApp.directorRecoveries.get(PulseApp.song.id)?.director}')
def reveal():p.locator('#directorContent details').evaluate_all('(els)=>els.forEach(e=>e.open=true)')
def select(keys):
 print('Selecting',keys,flush=True);reveal();p.locator('#dSelectNone').click()
 for key in keys:p.locator('[data-select="'+key+'"]').check()
def field(id,value,event='change'):
 p.locator('#'+id).fill(str(value));p.locator('#'+id).dispatch_event(event)
try:
 with sync_playwright() as w:
  b=w.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),headless=False,args=['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required'])
  p=b.new_page(viewport={'width':1280,'height':900});p.set_default_timeout(30000);p.on('pageerror',lambda e:errors.append(str(e)))
  p.set_content(html);p.wait_for_function('document.documentElement.dataset.v28Ready==="true"');idle()
  ok('Current V29 bundle boots and retains the original 15 demo charts',p.evaluate('v=>PulseCore.VERSION===v&&document.title.includes("V"+v.split(".")[0])&&PulseApp.songs.length===3&&PulseApp.songs.every(s=>s.charts.length===5)',version))
  ok('Native software WebGL2 renderer is active',p.evaluate('PulseApp.stage.available&&PulseApp.stage.gl instanceof WebGL2RenderingContext'))
  p.evaluate('PulseApp.showView("wardrobe");document.getElementById("mmdPanel").open=true')
  p.locator('#mmdInput').set_input_files([str(R/'examples/v27/PENDULE.pmx'),str(R/'examples/v27/ANCRAGE.vmd')]);p.wait_for_selector('#miCommit');p.locator('#miCommit').click();idle();p.wait_for_function('PulseApp.stage.director?.models.length===1')
  ok('PMX and VMD import still reaches the actual renderer',p.evaluate('!!PulseApp.song.scene.mmd&&PulseApp.stage.director.models.length===1'))
  p.evaluate('''async()=>{const a=PulseApp;window.charts29=JSON.stringify(a.song.charts);a.song.scene.mmdDirector=PulseDirector.normalizeDirector({enabled:true,duration:a.song.duration,count:1,slots:[{clips:[{start:1,end:3},{start:8,end:10}]}],cameraTrack:[{time:1,yaw:35},{time:8,yaw:70}],lightTrack:[{time:2}]});await a.store.put('songs',a.song);window.scene29=JSON.stringify(a.song.scene);a.openMMDDirector();}''')
  p.wait_for_selector('#dSelectAll');p.locator('#dSelectAll').click()
  ok('Select all counts clips and both key tracks',p.locator('#dSelected').inner_text().startswith('5 '))
  select(['clip:0:0','camera:0','light:0']);p.locator('#dCopy').click();field('dTime',12,'input');p.locator('#dPaste').click();d=draft()
  ok('Copy/paste adds clips and keys with relative timing',d['slots'][0]['clips'][2]['start']==12 and d['cameraTrack'][2]['time']==12 and d['lightTrack'][1]['time']==13)
  ok('Pasting leaves the saved scene and note charts untouched',p.evaluate('JSON.stringify(PulseApp.song.scene)===scene29&&JSON.stringify(PulseApp.song.charts)===charts29'))
  select(['clip:0:2','camera:2','light:1']);field('dMoveDelta',-2);p.locator('#dMoveSelected').click();d=draft()
  ok('Moving a mixed selection preserves its relative offsets',d['slots'][0]['clips'][2]['start']==10 and d['cameraTrack'][2]['time']==10 and d['lightTrack'][1]['time']==11)
  select(['clip:0:2','camera:2']);before=json.dumps(draft(),sort_keys=True);field('dMoveDelta',-2);p.locator('#dMoveSelected').click()
  ok('Collision visibly refuses the whole group with no partial edit',json.dumps(draft(),sort_keys=True)==before and 'superposés' in p.locator('#directorMessage').inner_text())
  p.locator('#dUndo').click();d=draft();ok('Undo restores the previous complete group',d['slots'][0]['clips'][2]['start']==12 and d['lightTrack'][1]['time']==13)
  p.locator('#dRedo').click();d=draft();ok('Redo restores the accepted move and clears stale selection',d['slots'][0]['clips'][2]['start']==10 and p.locator('#dSelected').inner_text().startswith('0 '))
  select(['clip:0:2','camera:2','light:1']);p.locator('#dDeleteSelected').click();d=draft()
  ok('Deleting a mixed group keeps all unselected events',len(d['slots'][0]['clips'])==2 and len(d['cameraTrack'])==2 and len(d['lightTrack'])==1)
  p.locator('#dUndo').click();d=draft();ok('Deletion is undoable in a single step',len(d['slots'][0]['clips'])==3)
  field('dTime',1.17,'input');p.locator('#dSnap').select_option('1');p.locator('#dSnapCursor').click()
  expected=p.evaluate('PulseDirectorEdit.musicalSnap(1.17,PulseApp.chart,1,PulseApp.song.duration)')
  ok('Cursor snapping uses current chart tempo',abs(float(p.locator('#dTime').input_value())-expected)<.011)
  p.locator('#dPreview').click();idle();ok('Edited director preview loads real MMD with finite poses',p.evaluate('PulseApp.stage.director.models.length===1&&PulseApp.stage.director.models[0].bones.every(b=>[...b.p,...b.q].every(Number.isFinite))'))
  p.screenshot(path=str(Q/'01-director-desktop.png'),timeout=15000,animations='disabled')
  p.set_viewport_size({'width':390,'height':844});reveal()
  ok('Director dialog fits a phone-width viewport',p.evaluate('document.getElementById("modal").getBoundingClientRect().right<=innerWidth+1'))
  ok('Batch controls do not create horizontal overflow',p.evaluate('document.getElementById("modalContent").scrollWidth<=document.getElementById("modalContent").clientWidth+1'))
  p.screenshot(path=str(Q/'02-director-mobile.png'),timeout=15000,animations='disabled');p.set_viewport_size({'width':1280,'height':900})
  draft();p.evaluate('window.atomic29=PulseApp.store.atomic;PulseApp.store.atomic=async function(rows){if(rows.some(r=>r[0]==="songs"))throw Error("QA29 refused publication");return atomic29.call(this,rows)};void 0;')
  p.locator('#dSave').click();idle()
  ok('Refused save keeps source unchanged and dialog retryable',p.evaluate('JSON.stringify(PulseApp.song.scene)===scene29&&document.getElementById("modal").open') and p.locator('#dSave').is_visible())
  p.evaluate('PulseApp.store.atomic=atomic29;void 0;');p.locator('#dSave').click();idle()
  ok('Successful save commits song and applied-draft marker together',p.evaluate('async()=>{const a=PulseApp,d=await a.store.get("settings","director-draft:"+a.song.id),s=await a.store.get("songs",a.song.id);return d.status==="applied"&&d.director===null&&s.scene.mmdDirector.slots[0].clips.length===3}'))
  ok('Publication does not alter charts or notes',p.evaluate('JSON.stringify(PulseApp.song.charts)===charts29'))
  p.locator('#openMmdDirector').click();p.wait_for_timeout(150)
  ok('Already applied draft is not offered for recovery',not p.locator('#dRecovery').is_visible())
  p.locator('#closeModal').click()
  ok('Portable backup excludes applied recovery tombstones',p.evaluate('async()=>!(await PulseApp.buildBackupData()).data.directorDrafts.some(d=>d.songId===PulseApp.song.id)'))
  ok('Renderer remains healthy after preview and publication',p.evaluate('!PulseApp.frameError&&PulseApp.stage.gl.getError()===0'))
  ok('No unhandled JavaScript exception',not errors)
  b.close();p=None
except Exception as e:
 failure=str(e);print(traceback.format_exc(),flush=True)
 if p:
  try:p.screenshot(path=str(Q/'FAILURE.png'),timeout=5000)
  except Exception:pass
(Q/'results.json').write_text(json.dumps({'version':version,'buildSha256':hashlib.sha256(html.encode()).hexdigest(),'passed':sum(x['passed'] for x in checks),'failed':sum(not x['passed'] for x in checks),'failure':failure,'checks':checks,'errors':errors,'scope':'Real Chromium + SwiftShader UI. Temporary document storage; not physical iPhone or universal MMD certification.'},ensure_ascii=False,indent=2))
if failure:raise SystemExit(1)
