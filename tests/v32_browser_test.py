"""Native localhost V31 integration: real Web Audio, IndexedDB, mouse and keyboard.
Software-rendered Chromium; no claim about acoustic output latency or devices.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from playwright.sync_api import sync_playwright
import threading,json,hashlib,os,traceback
R=Path(__file__).resolve().parents[1];Q=R/'qa/v33/loops';Q.mkdir(parents=True,exist_ok=True)
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
  ok('V32 current release and explicitly selected storage mode load',p.evaluate('PulseCore.VERSION')==version and (os.environ.get('PULSE_DOCUMENT_MODE')=='1' or p.evaluate('PulseApp.store.persistent&&location.protocol==="http:"')))
  p.evaluate('PulseApp.showView("wardrobe");document.getElementById("mmdPanel").open=true')
  p.locator('#mmdInput').set_input_files([str(R/'examples/v27/PENDULE.pmx'),str(R/'examples/v27/ANCRAGE.vmd')]);p.wait_for_selector('#miCommit');p.locator('#miCommit').click();idle()

  p.evaluate('''async()=>{const a=PulseApp,files=a.song.scene.mmd.files;const model=files.find(f=>f.role==='model').id,motion=files.find(f=>f.role==='motion').id;
    a.song.scene.mmdDirector=PulseDirector.normalizeDirector({duration:a.song.duration,count:1,rhythm:{bpm:120,tempoMap:[{time:0,bpm:120},{time:3,bpm:180},{time:9,bpm:75}]},slots:[{modelAssetId:model,clips:[{id:'phase-test',motionAssetId:motion,start:1,end:40,motionStart:.1,sourceBpm:90,loopBeats:4,rate:1.25,loop:true}]}]});
    await a.store.put('songs',a.song);window.original32=structuredClone(a.song.scene.mmdDirector);window.notes32=JSON.stringify(a.song.charts);a.openMMDDirector();}''')
  p.wait_for_selector('#dSplit');select(['clip:0:0']);field('dTime',3.7,'input');p.locator('#dSplit').click();d=draft()
  ok('Beat-loop split is available from the actual Director button',len(d['slots'][0]['clips'])==2 and d['slots'][0]['clips'][1]['motionStart']==.1)
  ok('A nonzero source phase selects explicit schema 20',d['version']==20 and 0<d['slots'][0]['clips'][1]['loopPhaseBeats']<4)
  select(['clip:0:1']);field('dTime',22,'input');p.locator('#dSplit').click();d=draft()
  ok('Repeated cuts preserve samples after multiple wraps and tempo changes',p.evaluate('''async()=>{await PulseApp.directorDraftWrite;const d=PulseApp.directorRecoveries.get(PulseApp.song.id).director,o=original32;for(let t=1;t<40;t+=.137){const c=d.slots[0].clips.find(c=>t>=c.start&&t<c.end);if(Math.abs(PulseMotionSync.sourceTime(c,t,d.rhythm).local-PulseMotionSync.sourceTime(o.slots[0].clips[0],t,o.rhythm).local)>1e-7)return false;}return true;}'''))
  select(['clip:0:0','clip:0:1','clip:0:2']);p.locator('#dMerge').click();d=draft()
  ok('Actual UI merge accepts continuous loop phases',len(d['slots'][0]['clips'])==1 and d['slots'][0]['clips'][0]['end']==40)
  p.locator('#dUndo').click();d=draft();ok('Loop merge is undone as one edit',len(d['slots'][0]['clips'])==3)
  p.locator('#directorContent details').evaluate_all('(els)=>els.forEach(e=>e.open=true)')
  before=json.dumps(d,sort_keys=True);el=p.locator('[data-s="0"][data-c="1"][data-field="loopPhaseBeats"]');el.fill('4');el.dispatch_event('change')
  ok('Out-of-range phase is rejected without modifying the saved draft',json.dumps(draft(),sort_keys=True)==before and 'Phase' in p.locator('#directorMessage').inner_text())
  p.locator('#dPreview').click();idle();field('dTime',23,'input')
  ok('Real renderer consumes the loop-phase clock',p.evaluate('''(()=>{const old=PulseMotionSync.sourceTime,calls=[];PulseMotionSync.sourceTime=(...args)=>{const out=old(...args);calls.push({phase:args[0].loopPhaseBeats||0,time:args[1],local:out.local});return out;};try{PulseApp.stage.render(23,120,{preview:true});return calls.some(c=>c.phase>0&&Math.abs(c.time-23)<.001)&&PulseApp.stage.director.models[0].bones.every(b=>[...b.p,...b.q].every(Number.isFinite));}finally{PulseMotionSync.sourceTime=old;}})()'''))
  with p.expect_download() as info:p.locator('#dExport').click()
  exported=Q/'phase.director.json';info.value.save_as(str(exported));raw=json.loads(exported.read_text())
  ok('Export advertises schema 20 and retains all phase offsets',raw['version']==20 and raw['director']['version']==20 and len(raw['director']['slots'][0]['clips'])==3)
  p.locator('#dSave').click();idle()
  ok('Director save commits phased clips with the applied-draft marker',p.evaluate('''async()=>{const a=PulseApp,s=await a.store.get('songs',a.song.id),d=await a.store.get('settings','director-draft:'+a.song.id);return s.scene.mmdDirector.version===20&&s.scene.mmdDirector.slots[0].clips[1].loopPhaseBeats>0&&d.status==='applied'&&JSON.stringify(s.charts)===notes32;}'''))
  p.locator('#directorInput').set_input_files(str(exported));idle()
  ok('Schema 20 reimport restores the editable source phase',float(p.locator('[data-s="0"][data-c="1"][data-field="loopPhaseBeats"]').input_value())==raw['director']['slots'][0]['clips'][1]['loopPhaseBeats'])
  p.set_viewport_size({'width':390,'height':844});p.locator('#directorContent details').evaluate_all('(els)=>els.forEach(e=>e.open=true)')
  ok('Loop-phase controls stay within mobile dialog width',p.evaluate('document.getElementById("modalContent").scrollWidth<=document.getElementById("modalContent").clientWidth+1'))
  p.locator('[data-s="0"][data-c="1"][data-field="loopPhaseBeats"]').scroll_into_view_if_needed();p.screenshot(path=str(Q/'phase-mobile.png'));p.set_viewport_size({'width':1280,'height':900})
  p.locator('#closeModal').click();before=p.evaluate('JSON.stringify(PulseApp.song.scene)')
  raw['version']=19;p.locator('#directorInput').set_input_files({'name':'disguised.director.json','mimeType':'application/json','buffer':json.dumps(raw).encode()});idle()
  ok('Downgraded phase document refuses import without touching the song',p.evaluate('JSON.stringify(PulseApp.song.scene)')==before and p.evaluate('!document.getElementById("modal").open'))
  # Actual studio save: the recovery deletion must be part of the same call.
  p.evaluate('PulseApp.showView("editor")');p.wait_for_selector('#editorSave',state='visible');idle()
  p.evaluate('''async()=>{const a=PulseApp,e=a.editor;e.chart.title='Transactional studio test';e.dirty=true;await a.flushDraft();window.key32=a.draftKey();window.songBefore32=JSON.stringify(a.song);window.editBefore32=JSON.stringify(e.chart);window.realAtomic32=a.store.atomic;a.store.atomic=async function(rows,opts){if(rows.some(r=>r[0]==='songs'))throw Error('QA32 simulated write refusal');return realAtomic32.call(this,rows,opts);};}''')
  p.locator('#editorSave').click();idle()
  ok('Refused studio save retains song, dirty edit and recovery together',p.evaluate('''async()=>JSON.stringify(PulseApp.song)===songBefore32&&JSON.stringify(PulseApp.editor.chart)===editBefore32&&PulseApp.editor.dirty&&!!(await PulseApp.store.get('settings',key32))'''))
  p.evaluate('''PulseApp.store.atomic=async function(rows,opts){if(rows.some(r=>r[0]==='songs'))window.combined32=opts?.deletes?.some(r=>r[0]==='settings'&&r[1]===key32);return realAtomic32.call(this,rows,opts);};void 0;''');p.locator('#editorSave').click();idle()
  ok('Studio retry commits the song and deletes its recovery in one transaction',p.evaluate('''async()=>combined32===true&&!PulseApp.editor.dirty&&!(await PulseApp.store.get('settings',key32))&&(await PulseApp.store.get('songs',PulseApp.song.id)).charts.some(c=>c.title==='Transactional studio test')'''))
  p.evaluate('PulseApp.store.atomic=realAtomic32;void 0;')
  ok('No unhandled browser exception',not errors)
  b.close()
except Exception as e:
 failure=str(e);print(traceback.format_exc(),flush=True)
 try:p.screenshot(path=str(Q/'failure.png'),timeout=5000)
 except Exception:pass
finally:server.shutdown();server.server_close()
(Q/'results.json').write_text(json.dumps({'version':version,'buildSha256':hashlib.sha256((R/'index.html').read_bytes()).hexdigest(),'passed':sum(c['passed'] for c in checks),'failed':sum(not c['passed'] for c in checks),'failure':failure,'checks':checks,'errors':errors,'nativeHTTP':os.environ.get('PULSE_DOCUMENT_MODE')!='1','scope':('Injected document, temporary storage. ' if os.environ.get('PULSE_DOCUMENT_MODE')=='1' else 'Native HTTP/IndexedDB. ')+'Chromium + SwiftShader, native Web Audio, controlled keyboard/mouse and 390px viewport. Not acoustic latency, physical iPhone, stylus or screen-reader qualification.'},ensure_ascii=False,indent=2))
if failure:raise SystemExit(1)
