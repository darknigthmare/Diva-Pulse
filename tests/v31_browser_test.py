"""Native localhost V31 integration: real Web Audio, IndexedDB, mouse and keyboard.
Software-rendered Chromium; no claim about acoustic output latency or devices.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from playwright.sync_api import sync_playwright
import threading,json,hashlib,os,traceback
R=Path(__file__).resolve().parents[1];Q=R/'qa/v32/audition';Q.mkdir(parents=True,exist_ok=True)
checks=[];errors=[];failure=None;version=(R/'VERSION.txt').read_text().strip()
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(R)));threading.Thread(target=server.serve_forever,daemon=True).start()
def ok(name,value):
 checks.append({'name':name,'passed':bool(value)});print(('PASS ' if value else 'FAIL ')+name,flush=True)
 if not value:raise AssertionError(name)
def idle():p.wait_for_function('!PulseApp.busy',timeout=90000)
def draft():return p.evaluate('async()=>{await PulseApp.directorDraftWrite;return PulseApp.directorRecoveries.get(PulseApp.song.id)?.director}')
def field(id,value,event='change'):
 # The playback clock updates a range between browser tasks. Setting its value
 # and dispatching input must be one task, like a native slider interaction;
 # a second delayed input would seek again to the newly advanced live value.
 el=p.locator('#'+id)
 if el.get_attribute('type')=='range':el.evaluate('(el,args)=>{el.value=String(args[0]);el.dispatchEvent(new Event(args[1],{bubbles:true}))}',[value,event])
 else:el.fill(str(value));el.dispatch_event(event)
def select(keys):
 p.locator('#directorContent details').evaluate_all('(els)=>els.forEach(e=>e.open=true)');p.locator('#dSelectNone').click()
 for k in keys:p.locator('[data-select="'+k+'"]').check()
def drag(delta,cancel=False):
 block=p.locator('[data-event-key="clip:0:0"]');block.scroll_into_view_if_needed();box=block.bounding_box();width=block.evaluate('b=>b.parentElement.getBoundingClientRect().width');duration=p.evaluate('PulseApp.song.duration');x=box['x']+min(10,box['width']/2);y=box['y']+15
 p.mouse.move(x,y);p.mouse.down();p.mouse.move(x+width*delta/duration,y,steps=6)
 if cancel:block.dispatch_event('pointercancel',{'pointerId':1,'isPrimary':True})
 p.mouse.up()
try:
 with sync_playwright() as w:
  b=w.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),headless=False,args=['--no-sandbox','--disable-dev-shm-usage','--no-proxy-server','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required'])
  p=b.new_page(viewport={'width':1280,'height':900});p.set_default_timeout(20000);p.on('pageerror',lambda e:errors.append(str(e)));
  if os.environ.get('PULSE_DOCUMENT_MODE')=='1':p.set_content((R/'index.html').read_text())
  else:p.goto(f'http://127.0.0.1:{server.server_port}/',wait_until='domcontentloaded')
  p.wait_for_function('document.documentElement.dataset.v28Ready==="true"');idle()
  ok('V31 current release and explicitly selected storage mode load',p.evaluate('PulseCore.VERSION')==version and (os.environ.get('PULSE_DOCUMENT_MODE')=='1' or p.evaluate('PulseApp.store.persistent&&location.protocol==="http:"')))
  p.evaluate('PulseApp.showView("wardrobe");document.getElementById("mmdPanel").open=true')
  p.locator('#mmdInput').set_input_files([str(R/'examples/v27/PENDULE.pmx'),str(R/'examples/v27/ANCRAGE.vmd')]);p.wait_for_selector('#miCommit');p.locator('#miCommit').click();idle()
  p.evaluate('''async()=>{const a=PulseApp,model=a.song.scene.mmd.files.find(f=>f.role==='model').id;a.song.scene.mmdDirector=PulseDirector.normalizeDirector({duration:a.song.duration,count:3,slots:[{modelAssetId:model,clips:[{id:'a',start:1,end:7,rate:1.5,motionStart:2},{start:12,end:14}]},{modelAssetId:model,clips:[{start:2,end:8}]},{modelAssetId:model,clips:[]}],cameraTrack:[{time:1}],lightTrack:[{time:2}],formations:[{time:1.5,positions:[[0,0,0],[1,0,0],[-1,0,0]]}]});await a.store.put('songs',a.song);window.saved31=JSON.stringify(a.song.scene);window.notes31=JSON.stringify(a.song.charts);window.scores31=JSON.stringify(await a.store.all('scores'));a.openMMDDirector();}''')
  p.wait_for_selector('#dMerge');block=p.locator('[data-event-key="clip:0:0"]');block.focus();p.keyboard.press('Enter')
  ok('Keyboard block selection exposes pressed state',block.get_attribute('aria-pressed')=='true' and p.locator('#dSelected').inner_text().startswith('1 '))
  p.locator('[data-event-key="camera:0"]').click(modifiers=['Control'])
  ok('Modifier click extends selection without moving events',p.locator('#dSelected').inner_text().startswith('2 '))
  keys=['clip:0:0','clip:1:0','camera:0','light:0','formation:0'];select(keys);drag(1);d=draft()
  ok('Actual pointer drag moves clips, camera, light and formation together',abs(d['slots'][0]['clips'][0]['start']-2)<.03 and abs(d['formations'][0]['time']-2.5)<.03 and abs(d['cameraTrack'][0]['time']-2)<.03)
  p.locator('#dUndo').click();d=draft();ok('Whole pointer gesture has one undo entry',abs(d['slots'][0]['clips'][0]['start']-1)<1e-7 and abs(d['formations'][0]['time']-1.5)<1e-7)
  select(keys);before=json.dumps(draft(),sort_keys=True);drag(2,cancel=True)
  ok('Pointer cancellation publishes no partial mixed edit',json.dumps(draft(),sort_keys=True)==before)
  drag(7)
  ok('Collision during group drag leaves every track unchanged',json.dumps(draft(),sort_keys=True)==before and 'superposés' in p.locator('#directorMessage').inner_text())
  select(['clip:0:0']);field('dTime',3,'input');p.locator('#dSplit').click();d=draft();ok('Clip split is available in live UI',len(d['slots'][0]['clips'])==3)
  select(['clip:0:0','clip:0:1']);p.locator('#dMerge').click();d=draft();ok('UI merge restores contiguous source timing',len(d['slots'][0]['clips'])==2 and d['slots'][0]['clips'][0]['end']==7 and d['slots'][0]['clips'][0]['motionStart']==2)
  select(['clip:0:0']);p.locator('#dCopy').click();p.locator('#dPasteTarget').select_option('2');field('dTime',20,'input');p.locator('#dPaste').click();d=draft()
  ok('Clip can be copied from D1 to same-model D3',d['slots'][2]['clips'][0]['start']==20 and d['slots'][0]['clips'][0]['start']==1)
  p.locator('#dUndo').click();p.locator('#directorContent details').evaluate_all('(els)=>els.forEach(e=>e.open=true)');p.locator('[data-f="0"][data-dancer="2"][data-axis="0"]').fill('-1.25');p.locator('[data-f="0"][data-dancer="2"][data-axis="0"]').dispatch_event('change');d=draft()
  ok('Formation positions are editable without changing motion clips',d['formations'][0]['positions'][2][0]==-1.25 and d['slots'][0]['clips'][0]['start']==1)
  ok('All montage operations leave saved song and charts intact',p.evaluate('JSON.stringify(PulseApp.song.scene)===saved31&&JSON.stringify(PulseApp.song.charts)===notes31'))
  field('dTime',2,'input');p.locator('#dPlay').click();idle();p.wait_for_timeout(200)
  ok('Audition starts native Web Audio without starting the game transport',p.evaluate('PulseApp.directorAudition.playing&&PulseApp.directorAudition.source instanceof AudioBufferSourceNode&&PulseApp.directorAudition.buffer instanceof AudioBuffer&&!PulseApp.audio.playing'))
  print('CLOCK',p.evaluate('({audio:PulseApp.directorAudition.time,stage:PulseApp.stage.directorPreview,slider:document.getElementById("dTime").value,playing:PulseApp.directorAudition.playing,frameError:PulseApp.frameError,context:PulseApp.audio.ctx.state})'),flush=True)
  ok('Audio cursor and rendered MMD share one time source',p.evaluate('(()=>{const a=PulseApp.directorAudition,before=a.time;PulseApp.stage.render(999,42,{preview:true});const frame=PulseApp.stage.directorPreview;return frame>=before&&frame<=a.time&&Math.abs(Number(document.getElementById("dTime").value)-frame)<.011})()'))
  p.locator('#dPlay').click();t=p.evaluate('PulseApp.directorAudition.time');p.wait_for_timeout(200)
  ok('Pause disconnects source and freezes audition cursor',p.evaluate('!PulseApp.directorAudition.playing&&PulseApp.directorAudition.source===null') and abs(p.evaluate('PulseApp.directorAudition.time')-t)<1e-7)
  field('dTime',2.75,'input');p.locator('#dPlay').click();idle()
  print('RESUME',p.evaluate('({position:PulseApp.directorAudition.position,time:PulseApp.directorAudition.time,playing:PulseApp.directorAudition.playing})'),flush=True)
  ok('Scrub then resume starts from requested audio second',p.evaluate('PulseApp.directorAudition.playing&&Math.abs(PulseApp.directorAudition.position-2.75)<.0001&&PulseApp.directorAudition.time>=2.75'))
  field('dTime',8,'input');ok('Scrubbing while playing replaces source at requested position',p.evaluate('PulseApp.directorAudition.playing&&PulseApp.directorAudition.position===8&&PulseApp.directorAudition.time>=8'))
  p.locator('#dAudioRate').select_option('0.5')
  ok('Half-speed audition follows half the audio-context elapsed time',p.evaluate('async()=>{const a=PulseApp.directorAudition,t=a.time,c=a.context.currentTime;await new Promise(r=>setTimeout(r,180));return a.source.playbackRate.value===.5&&Math.abs((a.time-t)-(a.context.currentTime-c)*.5)<.002}'))
  p.locator('#dAudioRate').select_option('1');field('dLoopA',1);field('dLoopB',1.2);p.locator('#dLoop').check();p.wait_for_timeout(500)
  ok('A/B loop uses native source boundaries and a wrapped cursor',p.evaluate('(()=>{const a=PulseApp.directorAudition;return a.source.loop&&a.source.loopStart===1&&a.source.loopEnd===1.2&&a.time>=1&&a.time<1.2})()'))
  field('dLoopB',.5)
  ok('Invalid A/B edit does not corrupt the active loop',p.evaluate('PulseApp.directorAudition.loop.end===1.2&&PulseApp.directorAudition.playing') and float(p.locator('#dLoopB').input_value())==1.2)
  p.locator('#dStop').click();ok('Stop silences source and returns to A',p.evaluate('!PulseApp.directorAudition.playing&&PulseApp.directorAudition.time===1'))
  p.locator('#dLoop').uncheck();p.locator('#directorContent').focus();p.keyboard.press('Space');idle();ok('Space toggles audition outside text fields',p.evaluate('PulseApp.directorAudition.playing'))
  p.locator('#dPlay').click();p.locator('#directorContent details').evaluate_all('(els)=>els.forEach(e=>e.open=true)');p.screenshot(path=str(Q/'desktop.png'));p.set_viewport_size({'width':390,'height':844})
  ok('Audio and formation controls fit a phone-width viewport',p.evaluate('document.getElementById("modalContent").scrollWidth<=document.getElementById("modalContent").clientWidth+1'))
  p.locator('#dPlay').scroll_into_view_if_needed();p.screenshot(path=str(Q/'mobile.png'));p.set_viewport_size({'width':1280,'height':900})
  ok('Audition adds no score or note changes',p.evaluate('async()=>JSON.stringify(await PulseApp.store.all("scores"))===scores31&&JSON.stringify(PulseApp.song.charts)===notes31'))
  p.evaluate('window.closedAudio31=PulseApp.directorAudition');p.locator('#closeModal').click();p.wait_for_timeout(100)
  ok('Closing Director disposes audition nodes but preserves shared game context',p.evaluate('closedAudio31.disposed&&!closedAudio31.playing&&closedAudio31.source===null&&!PulseApp.directorAudition&&PulseApp.audio.ctx.state!=="closed"'))
  p.locator('#openMmdDirector').click();p.wait_for_selector('#dRecover',state='visible');p.locator('#dRecover').click()
  ok('Unsaved formation edit recovers without starting sound',draft()['formations'][0]['positions'][2][0]==-1.25 and p.evaluate('!PulseApp.directorAudition'))
  with p.expect_download() as info:p.locator('#dExport').click()
  export=Q/'director-export.json';info.value.save_as(str(export));saved=json.loads(export.read_text());ok('Director export preserves formation geometry and schema 19',saved['version']==19 and saved['director']['formations'][0]['positions'][2][0]==-1.25)
  p.locator('#dSave').click();idle()
  ok('Save publishes formation and completed-draft marker atomically',p.evaluate('async()=>{const a=PulseApp,s=await a.store.get("songs",a.song.id),d=await a.store.get("settings","director-draft:"+a.song.id);return s.scene.mmdDirector.formations[0].positions[2][0]===-1.25&&d.status==="applied"&&JSON.stringify(s.charts)===notes31}'))
  p.locator('#directorInput').set_input_files(str(export));idle()
  ok('Director JSON reimports the saved formation coordinates',p.evaluate('document.getElementById("modal").open') and p.locator('[data-f="0"][data-dancer="2"][data-axis="0"]').input_value()=='-1.25')
  p.evaluate('document.getElementById("dPlay").click();PulseApp.closeModal()');idle()
  ok('Closing during async audio preparation cannot start a stale audition',p.evaluate('!PulseApp.directorAudition&&!document.getElementById("modal").open&&!PulseApp.audio.playing'))
  ok('Native renderer remains healthy',p.evaluate('!PulseApp.frameError&&PulseApp.stage.gl.getError()===0'))
  ok('No unhandled JavaScript exception',not errors)
  b.close()
except Exception as e:
 failure=str(e);print(traceback.format_exc(),flush=True)
 try:p.screenshot(path=str(Q/'failure.png'),timeout=5000)
 except Exception:pass
finally:server.shutdown();server.server_close()
(Q/'results.json').write_text(json.dumps({'version':version,'buildSha256':hashlib.sha256((R/'index.html').read_bytes()).hexdigest(),'passed':sum(c['passed'] for c in checks),'failed':sum(not c['passed'] for c in checks),'failure':failure,'checks':checks,'errors':errors,'nativeHTTP':os.environ.get('PULSE_DOCUMENT_MODE')!='1','scope':('Injected document, temporary storage. ' if os.environ.get('PULSE_DOCUMENT_MODE')=='1' else 'Native HTTP/IndexedDB. ')+'Chromium + SwiftShader, native Web Audio, controlled keyboard/mouse and 390px viewport. Not acoustic latency, physical iPhone, stylus or screen-reader qualification.'},ensure_ascii=False,indent=2))
if failure:raise SystemExit(1)
