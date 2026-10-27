"""Real localhost + persistent Chromium profile + native IndexedDB/Web Locks/SW.
This does not certify iOS, hardware timing or survival of browser eviction.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
import threading, tempfile, json, hashlib, traceback, os
R=Path(__file__).resolve().parents[1];Q=R/os.environ.get('PULSE_QA_DIR','qa/v32/regression-persistence');Q.mkdir(parents=True,exist_ok=True)
version=(R/'VERSION.txt').read_text().strip()
checks=[];errors=[];failure=None;context=None
class Handler(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
 def end_headers(self):
  self.send_header('Cache-Control','no-cache');super().end_headers()
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,directory=str(R)))
thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
url=f'http://127.0.0.1:{server.server_port}/'
def ok(name,value=True):
 checks.append({'name':name,'passed':bool(value)});print(('PASS ' if value else 'FAIL ')+name,flush=True)
 if not value:raise AssertionError(name)
def boot(p):
 p.set_default_timeout(20000);p.on('pageerror',lambda e:errors.append(str(e)));p.goto(url,wait_until='domcontentloaded');p.wait_for_function('window.PulseApp&&document.documentElement.dataset.v28Ready==="true"');p.wait_for_function('!PulseApp.busy')
def launch(w,path):
 return w.chromium.launch_persistent_context(str(path),executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),headless=False,viewport={'width':1000,'height':800},args=['--no-sandbox','--disable-dev-shm-usage','--no-proxy-server','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
try:
 with tempfile.TemporaryDirectory(prefix='diva-qa29-') as profile,sync_playwright() as w:
  context=launch(w,profile);p=context.pages[0];boot(p)
  ok('True HTTP origin and native IndexedDB are active',p.evaluate('location.protocol==="http:"&&PulseApp.store.persistent&&!!PulseApp.store.db'))
  ok('First window owns the exclusive writer lease',p.evaluate('PulseApp.store.writerGuard==="locked"&&!PulseApp.store.readOnly'))
  p.evaluate('''async()=>{const a=PulseApp,s=structuredClone(a.song);s.id="qa-persist-song";s.title="V29 persistence probe";s.audioAsset="qa-binary";s.scene.mmd=undefined;await a.store.atomic([["assets",{id:"qa-binary",kind:"audio",name:"probe.bin",blob:new Blob([new Uint8Array([1,2,3,254,255])],{type:"application/octet-stream"})}],["songs",s],["settings",{id:"draft:qa-persist-song:"+s.charts[0].id,songId:s.id,originalId:s.charts[0].id,chart:s.charts[0],cursor:2,updated:new Date().toISOString()}]]);}''')
  ok('Cross-store transaction commits song, bytes and distinct chart draft',p.evaluate('async()=>{const a=PulseApp,s=await a.store.get("songs","qa-persist-song"),asset=await a.store.get("assets","qa-binary");return s.title==="V29 persistence probe"&&asset.blob.size===5&&(await a.store.all("settings")).some(d=>d.songId===s.id)}'))
  context.close();context=None
  context=launch(w,profile);p=context.pages[0];boot(p)
  ok('Full browser close/reopen retains saved song',p.evaluate('PulseApp.songs.some(s=>s.id==="qa-persist-song"&&s.title==="V29 persistence probe")'))
  ok('Binary asset bytes survive full browser reopen',p.evaluate('async()=>JSON.stringify([...new Uint8Array(await (await PulseApp.store.get("assets","qa-binary")).blob.arrayBuffer())])==="[1,2,3,254,255]"'))
  ok('Separate draft survives without overwriting saved chart',p.evaluate('async()=>{const s=await PulseApp.store.get("songs","qa-persist-song"),d=(await PulseApp.store.all("settings")).find(x=>x.songId===s.id);return d.cursor===2&&JSON.stringify(d.chart)===JSON.stringify(s.charts[0])}'))
  second=context.new_page();boot(second)
  ok('Second real window is read-only under native Web Locks',second.evaluate('PulseApp.store.persistent&&PulseApp.store.readOnly&&PulseApp.store.writerGuard==="read-only"'))
  ok('Second-window transaction is rejected without mutating either store',second.evaluate('''async()=>{const a=PulseApp;try{await a.store.atomic([["songs",{id:"qa-forbidden"}],["settings",{id:"qa-forbidden"}]])}catch(e){return e.code==="PULSE_READ_ONLY"&&!(await a.store.get("songs","qa-forbidden"))&&!(await a.store.get("settings","qa-forbidden"))}return false}'''))
  ok('Read-only window can still construct a portable backup',second.evaluate('async()=>{const out=await PulseApp.buildBackupData();return out.data.songs.some(s=>s.id==="qa-persist-song")&&out.assets.some(a=>a.id==="qa-binary")}'))
  p.close();second.reload(wait_until='domcontentloaded');second.wait_for_function('window.PulseApp&&document.documentElement.dataset.v28Ready==="true"');p=second
  ok('Closing writer then reloading transfers lease safely',p.evaluate('PulseApp.store.writerGuard==="locked"&&!PulseApp.store.readOnly'))
  p.evaluate('PulseApp.showView("settings")');p.locator('#enableOffline').click(force=True)
  p.evaluate('async()=>await navigator.serviceWorker.ready');p.wait_for_function('!!navigator.serviceWorker.controller')
  ok('Offline shell installs and controls the actual HTTP page',p.evaluate('!!navigator.serviceWorker.controller'))
  context.set_offline(True);p.reload(wait_until='domcontentloaded');p.wait_for_function('window.PulseApp&&document.documentElement.dataset.v28Ready==="true"')
  ok('Offline reload boots current V29 from service-worker cache',p.evaluate('v=>!navigator.onLine&&PulseCore.VERSION===v&&document.title.includes("V"+v.split(".")[0])',version))
  ok('Offline reload retains library and imported binary bytes',p.evaluate('async()=>PulseApp.songs.some(s=>s.id==="qa-persist-song")&&(await PulseApp.store.get("assets","qa-binary")).blob.size===5'))
  p.screenshot(path=str(Q/'offline-reload.png'))
  ok('No unhandled application exception across native persistence flow',not errors)
  context.close();context=None
except Exception as e:
 failure=str(e);print(traceback.format_exc(),flush=True)
finally:
 if context:
  try:context.close()
  except Exception:pass
 server.shutdown();server.server_close();thread.join()
(Q/'results.json').write_text(json.dumps({'version':version,'buildSha256':hashlib.sha256((R/'index.html').read_bytes()).hexdigest(),'passed':sum(x['passed'] for x in checks),'failed':sum(not x['passed'] for x in checks),'failure':failure,'checks':checks,'errors':errors,'scope':'Localhost and persistent Chromium profile; true IndexedDB, Web Locks and SW offline reload. Not OS PWA installation, iPhone/Safari or storage-eviction certification.'},ensure_ascii=False,indent=2))
if failure:raise SystemExit(1)
