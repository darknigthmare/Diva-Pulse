"""V30 Director: native HTTP/IndexedDB, actual keyboard/pointer UI, no app mocks."""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from playwright.sync_api import sync_playwright
import threading, json, hashlib, os, traceback
R=Path(__file__).resolve().parents[1]; Q=R/'qa/v30/workflow'; Q.mkdir(parents=True,exist_ok=True)
checks=[]; errors=[]; failure=None
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args): pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(R)))
threading.Thread(target=server.serve_forever,daemon=True).start()
def ok(name,value):
 checks.append({'name':name,'passed':bool(value)});print(('PASS ' if value else 'FAIL ')+name,flush=True)
 if not value:raise AssertionError(name)
def idle(): p.wait_for_function('!PulseApp.busy',timeout=90000)
def draft(): return p.evaluate('async()=>{await PulseApp.directorDraftWrite;return PulseApp.directorRecoveries.get(PulseApp.song.id)?.director}')
def field(id,value,event='change'): p.locator('#'+id).fill(str(value));p.locator('#'+id).dispatch_event(event)
def select(keys):
 p.locator('#directorContent details').evaluate_all('(els)=>els.forEach(e=>e.open=true)');p.locator('#dSelectNone').click()
 for k in keys:p.locator('[data-select="'+k+'"]').check()
def key(value):p.locator('#directorContent').focus();p.keyboard.press(value)
try:
 with sync_playwright() as w:
  b=w.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),headless=False,args=['--no-sandbox','--disable-dev-shm-usage','--no-proxy-server','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  p=b.new_page(viewport={'width':1280,'height':900});p.set_default_timeout(20000);p.on('pageerror',lambda e:errors.append(str(e)))
  if os.environ.get('PULSE_DOCUMENT_MODE')=='1':p.set_content((R/'index.html').read_text())
  else:p.goto(f'http://127.0.0.1:{server.server_port}/',wait_until='domcontentloaded')
  p.wait_for_function('document.documentElement.dataset.v28Ready==="true"');idle()
  ok('V30 loads current build; storage matches explicitly requested mode',p.evaluate('PulseCore.VERSION==="30.0.0"') and (os.environ.get('PULSE_DOCUMENT_MODE')=='1' or p.evaluate('PulseApp.store.persistent')))
  p.evaluate('PulseApp.showView("wardrobe");document.getElementById("mmdPanel").open=true')
  p.locator('#mmdInput').set_input_files([str(R/'examples/v27/PENDULE.pmx'),str(R/'examples/v27/ANCRAGE.vmd')]);p.wait_for_selector('#miCommit');p.locator('#miCommit').click();idle()
  p.evaluate('''async()=>{const a=PulseApp;a.chart.tempoMap=[{time:0,bpm:120},{time:3.3,bpm:60}];a.chart.bpm=120;a.chart.gridOffset=.2;a.chart.offset=.25;a.chart.meterMap=[{beat:0,numerator:3,denominator:4},{beat:6,numerator:7,denominator:8}];a.song.scene.mmdDirector=PulseDirector.normalizeDirector({duration:a.song.duration,count:2,slots:[{clips:[{id:'a',start:1.13,end:5.13,rate:1.5,motionStart:2,transition:.2}]},{clips:[{start:2.13,end:6.13}]}],cameraTrack:[{time:1.63}],lightTrack:[{time:2.13}]});await a.store.put('songs',a.song);window.saved30=JSON.stringify(a.song.scene);window.notes30=JSON.stringify(a.song.charts);a.openMMDDirector();}''')
  p.wait_for_selector('#dSnap');p.locator('#dSnap').select_option('1');field('dTime',3.52,'input');p.locator('#dSnapCursor').click()
  ok('UI snapping integrates variable tempo and both offsets',abs(float(p.locator('#dTime').input_value())-3.45)<.011)
  p.locator('#dSnap').select_option('bar');field('dTime',6.5,'input');p.locator('#dSnapCursor').click();expected=p.evaluate('PulseDirectorEdit.musicalSnap(6.5,PulseApp.chart,"bar",PulseApp.song.duration)')
  ok('UI uses actual meter-aware bar snapping',abs(float(p.locator('#dTime').input_value())-expected)<.011)
  p.locator('#dSnap').select_option('1');select(['clip:0:0','clip:1:0','camera:0','light:0']);key('g');d=draft()
  ok('G aligns a mixed group preserving spacing',abs(d['slots'][0]['clips'][0]['start']-.95)<1e-7 and abs(d['cameraTrack'][0]['time']-1.45)<1e-7)
  key('Control+z');d=draft();ok('Keyboard undo restores complete group',abs(d['slots'][0]['clips'][0]['start']-1.13)<1e-7)
  key('Control+Shift+z');d=draft();ok('Keyboard redo restores accepted group',abs(d['slots'][0]['clips'][0]['start']-.95)<1e-7)
  key('Control+z');select(['clip:0:0','camera:0']);key('Control+c');field('dTime',12,'input');key('Control+v');d=draft()
  ok('Keyboard copy/paste preserves clip-camera offsets',len(d['slots'][0]['clips'])==2 and abs(d['cameraTrack'][1]['time']-12.5)<1e-7)
  key('Control+z');select(['clip:0:0']);field('dTime',3,'input');key('s');d=draft()
  ok('S splits at cursor preserving VMD time',len(d['slots'][0]['clips'])==2 and abs(d['slots'][0]['clips'][1]['motionStart']-4.805)<1e-7 and d['slots'][0]['clips'][1]['transition']==0)
  key('Control+z');select(['clip:0:0']);count=p.locator('#dSelected').inner_text();p.locator('#dMoveDelta').focus();p.keyboard.press('Control+a');p.keyboard.press('Backspace')
  ok('Native field selection/deletion does not trigger scene commands',p.locator('#dSelected').inner_text()==count and len(draft()['slots'][0]['clips'])==1)
  p.locator('#dMoveDelta').fill('1');key('Control+a');ok('Keyboard select-all covers all tracks',p.locator('#dSelected').inner_text().startswith('4 '))
  key('Delete');d=draft();ok('Deletion is a single mixed-track edit',not d['slots'][0]['clips'] and not d['cameraTrack'] and not d['lightTrack']);key('Control+z')
  select([]);before=json.dumps(draft(),sort_keys=True);block=p.locator('.director-block').first;block.scroll_into_view_if_needed();box=block.bounding_box();p.mouse.move(box['x']+box['width']/2,box['y']+10);p.mouse.down();p.mouse.move(box['x']+box['width']/2+30,box['y']+10);block.dispatch_event('pointercancel',{'pointerId':1,'isPrimary':True});p.mouse.up()
  ok('pointercancel does not commit partial drag',json.dumps(draft(),sort_keys=True)==before)
  ok('Editing leaves saved scene and notes unchanged',p.evaluate('JSON.stringify(PulseApp.song.scene)===saved30&&JSON.stringify(PulseApp.song.charts)===notes30'))
  select(['clip:0:0']);field('dTime',3,'input');key('s');draft();p.locator('#closeModal').click();p.locator('#openMmdDirector').click();p.wait_for_selector('#dRecover',state='visible');key('Control+a');p.locator('#dRecover').click()
  ok('Recovery clears stale selections and redo',p.locator('#dSelected').inner_text().startswith('0 ') and p.locator('#dRedo').is_disabled())
  p.locator('#directorContent details').evaluate_all('(els)=>els.forEach(e=>e.open=true)');p.screenshot(path=str(Q/'desktop.png'),animations='disabled');p.set_viewport_size({'width':390,'height':844})
  ok('Expanded editor fits phone-width viewport',p.evaluate('document.getElementById("modalContent").scrollWidth<=document.getElementById("modalContent").clientWidth+1&&[...document.querySelectorAll(".director-batch .buttons button")].every(b=>b.getBoundingClientRect().width>=120&&b.getBoundingClientRect().height>=48)'))
  p.screenshot(path=str(Q/'mobile.png'),animations='disabled');p.set_viewport_size({'width':1280,'height':900});key('Control+s');idle()
  ok('Keyboard save publishes cut and closes editor',p.evaluate('!document.getElementById("modal").open&&PulseApp.song.scene.mmdDirector.slots[0].clips.length===2'))
  before=p.evaluate('JSON.stringify(PulseApp.song.scene)');p.locator('#directorInput').set_input_files({'name':'future.director.json','mimeType':'application/json','buffer':json.dumps({'format':'DIVA-PULSE-DIRECTOR','version':999,'director':{}}).encode()});idle()
  ok('Future schema is rejected without overwrite',p.evaluate('JSON.stringify(PulseApp.song.scene)')==before and 'version Director' in p.locator('#toast').inner_text())
  ok('No unhandled JavaScript exception',not errors)
  b.close()
except Exception as e:
 failure=str(e);print(traceback.format_exc(),flush=True)
finally:
 server.shutdown();server.server_close()
(Q/'results.json').write_text(json.dumps({'version':'30.0.0','buildSha256':hashlib.sha256((R/'index.html').read_bytes()).hexdigest(),'passed':sum(c['passed'] for c in checks),'failed':sum(not c['passed'] for c in checks),'failure':failure,'checks':checks,'errors':errors,'documentMode':os.environ.get('PULSE_DOCUMENT_MODE')=='1','scope':('Injected document: no durable-storage qualification. ' if os.environ.get('PULSE_DOCUMENT_MODE')=='1' else 'Native HTTP/IndexedDB. ')+'Chromium and SwiftShader. Actual keyboard/mouse, phone viewport emulation; not physical iPhone certification.'},ensure_ascii=False,indent=2))
if failure:raise SystemExit(1)
