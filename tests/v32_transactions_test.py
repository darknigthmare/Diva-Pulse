"""Native IDB requests, rollback and studio retry. No memory-store substitute.
An actual transaction is aborted after its first successful delete/put request.
The entire disposable HTTP origin belongs to this automated test only.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
import threading, json, hashlib, os, traceback
R=Path(__file__).resolve().parents[1];Q=R/'qa/v33/transactions';Q.mkdir(parents=True,exist_ok=True)
checks=[];errors=[];failure=None;version=(R/'VERSION.txt').read_text().strip()
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(R)))
threading.Thread(target=server.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{server.server_port}/'
def ok(name,value):
 checks.append({'name':name,'passed':bool(value)});print(('PASS ' if value else 'FAIL ')+name,flush=True)
 if not value:raise AssertionError(name)
def boot():
 p.goto(url,wait_until='domcontentloaded');p.wait_for_function('window.PulseApp&&document.documentElement.dataset.v28Ready==="true"&&!PulseApp.busy')
try:
 with sync_playwright() as w:
  b=w.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),headless=False,args=['--no-sandbox','--disable-dev-shm-usage','--no-proxy-server','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  p=b.new_page(viewport={'width':1000,'height':800});p.set_default_timeout(30000);p.on('pageerror',lambda e:errors.append(str(e)));boot()
  ok('Transaction tests run on HTTP with real writable IndexedDB',p.evaluate('location.protocol==="http:"&&PulseApp.store.persistent&&PulseApp.store.db instanceof IDBDatabase&&!PulseApp.store.readOnly'))
  p.evaluate('''async()=>{const s=PulseApp.store,song=structuredClone(PulseApp.song);song.id='qa32-song';song.title='before';song.audioAsset='qa32-asset';song.scene.mmd=undefined;
    const d=PulseDirector.normalizeDirector({duration:song.duration,count:1,rhythm:{bpm:120,tempoMap:[{time:0,bpm:120},{time:3,bpm:180}]},slots:[{clips:[{start:1,end:40,sourceBpm:90,loop:true,loopBeats:4,motionStart:.1,rate:1.25}]}]});song.scene.mmdDirector=PulseDirectorEdit.split(d,['clip:0:0'],3.7);
    await s.atomic([['songs',song],['settings',{id:'qa32-draft',value:'recover me'}],['assets',{id:'qa32-asset',blob:new Blob([new Uint8Array([1,2,255])])}]]);
    window.seed32=structuredClone(song);window.events32=[];s.watch(e=>events32.push(e.type));
    window.armAbort32=()=>{const db=s.db,original=db.transaction.bind(db);window.hitAbort32=false;db.transaction=function(stores,mode,...args){const tx=original(stores,mode,...args);if(mode==='readwrite'){db.transaction=original;const get=tx.objectStore.bind(tx);let armed=false;tx.objectStore=name=>{const store=get(name);for(const method of ['put','delete']){const op=store[method].bind(store);store[method]=(...values)=>{const request=op(...values);if(!armed){armed=true;request.addEventListener('success',()=>{window.hitAbort32=tx instanceof IDBTransaction&&request instanceof IDBRequest;tx.abort();},{once:true});}return request;};}return store;};}return tx;};};}''')
  ok('Real database initially stores phase-bearing schema 20 and binary data',p.evaluate('''async()=>{const s=PulseApp.store,d=await s.get('songs','qa32-song');return d.scene.mmdDirector.version===20&&d.scene.mmdDirector.slots[0].clips[1].loopPhaseBeats>0&&(await s.get('assets','qa32-asset')).blob.size===3;}'''))
  ok('Abort occurs after a successful real IDB request, not an application mock',p.evaluate('''async()=>{armAbort32();try{await PulseApp.store.atomic([['songs',{...seed32,title:'must not persist'}],['assets',{id:'qa32-asset',blob:new Blob(['bad'])}]],{deletes:[['settings','qa32-draft']]});return false;}catch{return hitAbort32===true;}}'''))
  ok('Abort rolls back deletion, song update and binary overwrite together',p.evaluate('''async()=>{const s=PulseApp.store;return (await s.get('songs','qa32-song')).title==='before'&&(await s.get('settings','qa32-draft')).value==='recover me'&&JSON.stringify([...new Uint8Array(await (await s.get('assets','qa32-asset')).blob.arrayBuffer())])==='[1,2,255]';}'''))
  ok('Abort cannot promote snapshots or emit a success notification',p.evaluate('PulseApp.store.committed("songs","qa32-song").title==="before"&&PulseApp.store.committed("settings","qa32-draft").value==="recover me"&&!events32.includes("commit")&&!events32.includes("delete")&&events32.includes("write-error")'))
  p.evaluate('''async()=>{await PulseApp.store.atomic([['songs',{...seed32,title:'committed'}]],{deletes:[['settings','qa32-draft']]});}''')
  ok('Retry commits write and deletion with native completion',p.evaluate('''async()=>{const s=PulseApp.store;return (await s.get('songs','qa32-song')).title==='committed'&&!(await s.get('settings','qa32-draft'))&&!s.committed('settings','qa32-draft')&&events32.includes('commit')&&events32.includes('delete');}'''))
  ok('Conflicting deletion refuses the whole native request before mutation',p.evaluate('''async()=>{try{await PulseApp.store.atomic([['songs',{...seed32,title:'bad'}]],{deletes:[['songs','qa32-song']]});return false;}catch{return (await PulseApp.store.get('songs','qa32-song')).title==='committed';}}'''))
  p.evaluate('PulseApp.showView("editor")');p.wait_for_selector('#editorSave',state='visible')
  p.evaluate('''async()=>{const a=PulseApp,e=a.editor;e.chart.title='native32 studio';e.dirty=true;await a.flushDraft();window.editorKey32=a.draftKey();window.editorSong32=JSON.stringify(a.song);window.editorDraft32=JSON.stringify(e.chart);armAbort32();}''')
  ok('Studio abort leaves source, edit, recovery and dirty state retryable',p.evaluate('''async()=>{const a=PulseApp;try{await a.editor.save();return false;}catch{return hitAbort32&&JSON.stringify(a.song)===editorSong32&&JSON.stringify(a.editor.chart)===editorDraft32&&a.editor.dirty&&!!(await a.store.get('settings',editorKey32));}}'''))
  p.evaluate('PulseApp.editor.save()')
  ok('Native Studio retry removes the old recovery and preserves source charts',p.evaluate('''async()=>{const a=PulseApp,s=await a.store.get('songs',a.song.id);return !a.editor.dirty&&!(await a.store.get('settings',editorKey32))&&s.charts.length===JSON.parse(editorSong32).charts.length+1&&s.charts.some(c=>c.title==='native32 studio');}'''))
  boot()
  ok('Reload retains the mixed commit, binary bytes and schema 20 phase',p.evaluate('''async()=>{const s=PulseApp.store,row=await s.get('songs','qa32-song');return row.title==='committed'&&row.scene.mmdDirector.version===20&&row.scene.mmdDirector.slots[0].clips[1].loopPhaseBeats>0&&!(await s.get('settings','qa32-draft'))&&(await s.get('assets','qa32-asset')).blob.size===3;}'''))
  ok('No unhandled exception during native abort/retry flow',not errors)
  b.close()
except Exception as e:
 failure=str(e);print(traceback.format_exc(),flush=True)
finally:server.shutdown();server.server_close()
(Q/'results.json').write_text(json.dumps({'version':version,'buildSha256':hashlib.sha256((R/'index.html').read_bytes()).hexdigest(),'passed':sum(c['passed'] for c in checks),'failed':sum(not c['passed'] for c in checks),'failure':failure,'checks':checks,'errors':errors,'nativeHTTP':True,'scope':'Real HTTP, IndexedDB, IDBTransaction.abort after a successful IDBRequest, mixed deletion rollback, Studio retry and page reload. Does not simulate OS crash, disk corruption or browser eviction.'},ensure_ascii=False,indent=2))
if failure:raise SystemExit(1)
