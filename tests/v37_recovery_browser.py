"""V37 Director recovery on native HTTP/IndexedDB, with actual V27 MMD fixtures.

Exercises recovery ownership and persistence, not MMD visual fidelity or a full
V22-V29 migration matrix. The abort is a real IDBTransaction.abort after the
first put request succeeds; source JSON and phased timing remain inspectable.
"""
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import hashlib
import json
import os
import tempfile
import threading
import traceback
from playwright.sync_api import sync_playwright

R = Path(__file__).resolve().parents[1]
Q = Path(os.getenv('PULSE_QA_DIR', str(R / 'qa/v37/recovery')))
Q.mkdir(parents=True, exist_ok=True)
checks, errors = [], []
failure = None
context = None
native_http = native_indexeddb = native_abort = build_unchanged = False
build_sha256 = hashlib.sha256((R / 'index.html').read_bytes()).hexdigest()

class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

def ok(name, value):
    checks.append({'name': name, 'passed': bool(value)})
    print(('PASS ' if value else 'FAIL ') + name, flush=True)
    if not value:
        raise AssertionError(name)

server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Quiet, directory=str(R)))
thread = threading.Thread(target=server.serve_forever, daemon=True)
thread.start()
url = f'http://127.0.0.1:{server.server_port}/'

def launch(w, profile):
    return w.chromium.launch_persistent_context(
        str(profile), executable_path=os.getenv('CHROMIUM_PATH', '/usr/bin/chromium'),
        headless=not bool(os.getenv('DISPLAY')), viewport={'width': 1280, 'height': 1000},
        args=['--no-sandbox', '--disable-dev-shm-usage', '--no-proxy-server',
              '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])

def boot(page):
    page.set_default_timeout(30000)
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(url, wait_until='domcontentloaded')
    page.wait_for_function('window.PulseApp && document.documentElement.dataset.live34Ready === "true" && !PulseApp.busy')

def idle(page):
    page.wait_for_function('!PulseApp.busy')

try:
    with tempfile.TemporaryDirectory(prefix='diva-recovery37-') as profile, sync_playwright() as w:
        context = launch(w, profile)
        p = context.pages[0]
        boot(p)
        native_http = p.evaluate('location.protocol === "http:"')
        native_indexeddb = p.evaluate('PulseApp.store.persistent && PulseApp.store.db instanceof IDBDatabase')
        ok('Recovery runs on native HTTP and writable IndexedDB', native_http and native_indexeddb and p.evaluate('!PulseApp.store.readOnly'))
        p.evaluate('''async()=>{
            const a=PulseApp,D=PulseDirector;
            await a.showView('wardrobe');
            const owner=structuredClone(a.song);owner.id=PulseCore.uid();owner.title='Recovery V37 fixture';owner.duration=12;owner.scene={...owner.scene};delete owner.scene.mmd;delete owner.scene.mmdDirector;delete owner.scene.autoShow;
            await a.store.put('songs',owner);a.songs.push(owner);await a.selectSong(owner.id);
            const files=[];for(const name of ['PENDULE.pmx','ANCRAGE.vmd'])files.push(new File([await (await fetch('examples/v27/'+name)).arrayBuffer()],name));
            const oldPack=await a.importMMDFiles(files),model=oldPack.files.find(f=>f.role==='model').id,motion=oldPack.files.find(f=>f.role==='motion').id;
            const director=D.normalizeDirector({version:20,duration:12,count:1,manual:{note:'Keep all source fields'},rhythm:{bpm:120,tempoMap:[{time:0,bpm:120},{time:5,bpm:180}]},slots:[{modelAssetId:model,motionAssetId:motion,clips:[{id:'manual-cut',start:1,end:10,motionAssetId:motion,sourceBpm:100,loopBeats:4,loopPhaseBeats:1,rate:1.25,motionStart:.1,loop:true}]}],cameraTrack:[{time:1,yaw:42}],lightTrack:[{time:2,intensity:.7}],formations:[{time:3,positions:[[1,0,2]]}]});
            window.source37={id:'director-draft:'+owner.id,songId:owner.id,packId:oldPack.id,director,updatedAt:7,extra:{label:'source metadata'}};
            await a.store.put('settings',source37);await a.importMMDFiles(files);
            window.owner37=a.song.id;window.scene37=JSON.stringify(a.song.scene);window.charts37=JSON.stringify(a.song.charts);
            window.map37={};const pack=a.song.scene.mmd;
            map37[JSON.stringify(['model',model])]=pack.files.find(f=>f.role==='model').id;
            map37[JSON.stringify(['motion',motion])]=pack.files.find(f=>f.role==='motion').id;
            window.metrics37={writes:0,commits:0,decodes:0,reads:0};
            const transaction=a.store.db.transaction.bind(a.store.db);a.store.db.transaction=function(names,mode,...rest){if(mode==='readwrite')metrics37.writes++;return transaction(names,mode,...rest);};
            a.store.watch(e=>{if(e.type==='commit')metrics37.commits++;});
            const decode=PulseServices.base64ToBlob;PulseServices.base64ToBlob=(...args)=>{metrics37.decodes++;return decode(...args);};
            const slice=Blob.prototype.slice;Blob.prototype.slice=function(start,...rest){if(this.name===window.fileName37&&start>=window.bodyStart37)metrics37.reads++;return slice.call(this,start,...rest);};
            window.reset37=()=>{metrics37={writes:0,commits:0,decodes:0,reads:0};};
            window.stored37=()=>a.store.get('settings','director-draft:'+owner37);
            window.armAbort37=()=>{const db=a.store.db,original=db.transaction.bind(db);window.aborted37=false;db.transaction=function(names,mode,...rest){const tx=original(names,mode,...rest);if(mode==='readwrite'){db.transaction=original;const get=tx.objectStore.bind(tx);let armed=false;tx.objectStore=function(name){const store=get(name),put=store.put.bind(store);store.put=function(...args){const req=put(...args);if(!armed){armed=true;req.addEventListener('success',()=>{aborted37=tx instanceof IDBTransaction&&req instanceof IDBRequest;tx.abort();},{once:true});}return req;};return store;};}return tx;};};
            window.backupFile37=async(raw,assets,format)=>{
                fileName37='recovery-v37.'+format;
                if(format==='pulsepack'){bodyStart37=Infinity;const data={...structuredClone(raw),assets:await Promise.all(assets.map(async a=>({id:a.id,name:a.name,kind:a.kind,type:a.blob.type,data:await PulseServices.blobToBase64(a.blob)})))};return new File([JSON.stringify(data)],fileName37,{type:'application/json'});}
                const blob=await PulseBundle.pack(raw,assets);bodyStart37=PulseBundle.HEADER+new DataView(await blob.slice(0,PulseBundle.HEADER).arrayBuffer()).getUint32(8,true);return new File([blob],fileName37,{type:'application/octet-stream'});
            };
            window.copies37=[];reset37();await a.openMMDDirector();
        }''')
        ok('Previous-pack recovery is visible before any edit or storage write', p.evaluate('!document.getElementById("dRecovery").hidden && document.getElementById("directorContent").inert && !!document.getElementById("dReassociate") && !document.getElementById("dRecover") && metrics37.writes===0'))
        ok('Blocked synthetic edit and keyboard save leave the source and publication unchanged', p.evaluate('''async()=>{const a=PulseApp;document.getElementById('dCount').value='2';document.getElementById('dCount').dispatchEvent(new Event('change',{bubbles:true}));document.dispatchEvent(new KeyboardEvent('keydown',{key:'s',ctrlKey:true,bubbles:true}));await a.directorDraftWrite;return JSON.stringify(await stored37())===JSON.stringify(source37)&&JSON.stringify(a.song.scene)===scene37&&metrics37.writes===0;}'''))
        with p.expect_download() as download:
            p.locator('#dExportRecovery').click()
        exported = json.loads(Path(download.value.path()).read_text())
        ok('Source export contains the exact recovery record and its extra fields', exported == p.evaluate('source37'))
        p.locator('#dReassociate').click()
        ok('Equal filenames do not guess model or motion associations', p.evaluate('[...document.querySelectorAll("#dRecoveryMappings select")].length===2 && [...document.querySelectorAll("#dRecoveryMappings select")].every(s=>s.value==="")'))
        p.screenshot(path=str(Q / 'recovery-choices.png'), full_page=True)
        p.locator('#dCancelReassociate').click()
        p.locator('#closeModal').click()
        ok('Canceling and closing keep the exact previous-pack recovery', p.evaluate('''async()=>JSON.stringify(await stored37())===JSON.stringify(source37)&&metrics37.writes===0'''))

        p.evaluate('''async()=>{
            const a=PulseApp,d=PulseDirectorEdit.reassociateRecovery(source37,a.song,map37,8).director;
            const input=document.getElementById('directorInput'),transfer=new DataTransfer();transfer.items.add(new File([JSON.stringify({format:'DIVA-PULSE-DIRECTOR',version:20,director:d})],'current.director.json',{type:'application/json'}));input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));
        }''')
        idle(p)
        ok('Portable Director import waits for recovery and cannot overwrite its source', p.evaluate('''async()=>document.getElementById('directorContent').inert&&!document.getElementById('dRecovery').hidden&&JSON.stringify(await stored37())===JSON.stringify(source37)&&metrics37.writes===0'''))

        p.evaluate('''()=>{const a=PulseApp;a.closeModal();a.directorRecoveries.delete(owner37);window.actualGet37=a.store.get.bind(a.store);window.pendingReads37=[];a.store.get=(name,id)=>name==='settings'&&id==='director-draft:'+owner37?new Promise((resolve,reject)=>pendingReads37.push({resolve,reject})):actualGet37(name,id);window.firstOpen37=a.openMMDDirector();}''')
        p.wait_for_function('pendingReads37.length===1')
        p.evaluate('()=>{PulseApp.closeModal();window.secondOpen37=PulseApp.openMMDDirector();}')
        p.wait_for_function('pendingReads37.length===2')
        ok('Late read from the closed Director cannot unlock the next dialog', p.evaluate('''async()=>{pendingReads37[0].resolve(source37);await firstOpen37;return document.getElementById('directorContent').inert&&document.getElementById('dRecovery').hidden&&metrics37.writes===0;}'''))
        p.evaluate('''async()=>{pendingReads37[1].resolve(source37);await secondOpen37;PulseApp.store.get=actualGet37;}''')
        ok('Only the current read reveals its recovery decision', p.evaluate('document.getElementById("directorContent").inert&&!document.getElementById("dRecovery").hidden&&!!document.getElementById("dReassociate")'))
        p.evaluate('''async()=>{const a=PulseApp;a.closeModal();a.store.get=(name,id)=>name==='settings'&&id==='director-draft:'+owner37?Promise.reject(Error('Injected read failure')):actualGet37(name,id);await a.openMMDDirector();a.store.get=actualGet37;}''')
        ok('Read failure leaves editing protected and offers a retry', p.evaluate('document.getElementById("directorContent").inert&&!!document.getElementById("dRetryRecovery")&&metrics37.writes===0'))
        p.locator('#dRetryRecovery').click()
        p.wait_for_selector('#dReassociate')
        ok('Read retry recovers the untouched source', p.evaluate('''async()=>JSON.stringify(await stored37())===JSON.stringify(source37)&&document.getElementById('directorContent').inert'''))

        # Export/import native copies before resolving the source recovery.
        p.evaluate('''async()=>{PulseApp.closeModal();window.backup37=await PulseApp.buildBackupData(PulseApp.song);window.originalSong37=JSON.stringify(PulseApp.song);}''')
        ok('Library V5 exporter retains previous-pack recovery and all referenced media', p.evaluate('backup37.data.version===5&&JSON.stringify(backup37.data.directorDrafts[0])===JSON.stringify(source37)&&PulseDirector.assetReferences({mmdDirector:source37.director}).every(id=>backup37.assets.some(a=>a.id===id))'))
        for fmt in ['pulsepack', 'pulsebundle']:
            for origin in ['foreign', 'same', 'absent']:
                p.evaluate('''async args=>{
                    const a=PulseApp,raw=structuredClone(backup37.data);
                    if(args.origin==='same')raw.directorDrafts=[PulseDirectorEdit.reassociateRecovery(source37,a.songs.find(s=>s.id===owner37),map37,9)];
                    if(args.origin==='absent')delete raw.directorDrafts[0].packId;
                    window.rawRestore37=raw;const file=await backupFile37(raw,backup37.assets,args.format);reset37();await a.restoreBackup(file);
                }''', {'format': fmt, 'origin': origin})
                ok(fmt+' '+origin+' recovery reaches review without writing', p.evaluate('metrics37.writes===0&&metrics37.commits===0&&!!document.getElementById("confirmRestore")'))
                p.locator('#confirmRestore').click()
                idle(p)
                result = p.evaluate('''async origin=>{
                    const a=PulseApp,copy=a.songs.at(-1),saved=await a.store.get('settings','director-draft:'+copy.id),ids=new Set((await a.store.all('assets')).map(x=>x.id));copies37.push({id:copy.id,origin,packId:saved.packId,director:saved.director,extra:saved.extra});
                    return {copy:copy.id!==owner37&&saved.songId===copy.id,provenance:origin==='same'?saved.packId===copy.scene.mmd.id:origin==='foreign'?saved.packId===source37.packId:saved.packId===undefined,
                    phase:saved.director.version===20&&saved.director.slots[0].clips[0].loopPhaseBeats===1&&saved.director.cameraTrack[0].yaw===42&&JSON.stringify(saved.extra)===JSON.stringify(source37.extra),
                    refs:PulseDirector.assetReferences({mmdDirector:saved.director}).every(id=>ids.has(id)&&!backup37.assets.some(a=>a.id===id)),original:JSON.stringify(a.songs.find(s=>s.id===owner37))===originalSong37,
                    commit:metrics37.writes===1&&metrics37.commits===1};
                }''', origin)
                ok(fmt+' '+origin+' recovery copy keeps owner, provenance, phases and source', all(result.values()))
        for fmt in ['pulsepack', 'pulsebundle']:
            for label, version in [('unknown schema', 999), ('phase hidden as schema 19', 19)]:
                result = p.evaluate('''async args=>{
                    const raw=structuredClone(backup37.data);raw.directorDrafts[0].director.version=args.version;const before=JSON.stringify(raw),file=await backupFile37(raw,backup37.assets,args.format);reset37();let error='';
                    try{await PulseApp.restoreBackup(file);}catch(e){error=e.message;}
                    return {error,unchanged:before===JSON.stringify(raw),reads:metrics37.reads,decodes:metrics37.decodes,writes:metrics37.writes};
                }''', {'format': fmt, 'version': version})
                ok(fmt+' rejects '+label+' before media read, decode or write', bool(result['error']) and result['unchanged'] and result['reads'] == result['decodes'] == result['writes'] == 0)
        p.evaluate('''async()=>{const a=PulseApp;a.closeModal();await a.selectSong(owner37);reset37();await a.openMMDDirector();}''')
        p.locator('#dReassociate').click()
        p.locator('#dRecoveryAsset0').select_option(p.evaluate('map37[Object.keys(map37).find(k=>k.includes("model"))]'))
        p.locator('#dRecoveryAsset1').select_option(p.evaluate('map37[Object.keys(map37).find(k=>k.includes("motion"))]'))
        p.evaluate('PulseApp.store.readOnly=true')
        p.locator('#dConfirmReassociate').click()
        idle(p)
        p.evaluate('PulseApp.store.readOnly=false')
        ok('Read-only refusal keeps source, edit guard and published scene unchanged', p.evaluate('''async()=>JSON.stringify(await stored37())===JSON.stringify(source37)&&document.getElementById('directorContent').inert&&JSON.stringify(PulseApp.song.scene)===scene37&&metrics37.writes===0'''))
        p.evaluate('window.cacheBefore37=JSON.stringify(PulseApp.directorRecoveries.get(owner37));reset37();armAbort37()')
        p.locator('#dConfirmReassociate').click()
        idle(p)
        native_abort = p.evaluate('aborted37')
        ok('Native abort after put success preserves the previous recovery and cache', native_abort and p.evaluate('''async()=>JSON.stringify(await stored37())===JSON.stringify(source37)&&JSON.stringify(PulseApp.directorRecoveries.get(owner37))===cacheBefore37&&metrics37.commits===0&&document.getElementById('directorContent').inert'''))
        p.locator('#dConfirmReassociate').click()
        idle(p)
        ok('Retry commits reassociation and unlocks editing without publishing', p.evaluate('''async()=>{const saved=await stored37(),expected=PulseDirectorEdit.reassociateRecovery(source37,PulseApp.song,map37,saved.updatedAt);window.reassociated37=structuredClone(saved);return JSON.stringify(saved)===JSON.stringify(expected)&&metrics37.commits===1&&!document.getElementById('directorContent').inert&&document.getElementById('dRecovery').hidden&&JSON.stringify(PulseApp.song.scene)===scene37;}'''))
        p.locator('#closeModal').click()
        p.evaluate('reset37();PulseApp.openMMDDirector()')
        p.wait_for_selector('#dRecover')
        p.locator('#dRecover').click()
        ok('Same-pack resume keeps source metadata and writes nothing until editing', p.evaluate('''async()=>!document.getElementById('directorContent').inert&&JSON.stringify(await stored37())===JSON.stringify(reassociated37)&&metrics37.writes===0'''))
        p.locator('details[data-panel="keys"] > summary').click()
        p.locator('[data-track="camera"][data-field="yaw"]').fill('43')
        p.locator('[data-track="camera"][data-field="yaw"]').dispatch_event('change')
        p.evaluate('PulseApp.directorDraftWrite')
        ok('First edit autosaves with schema 20 phases and source metadata preserved', p.evaluate('''async()=>{const saved=await stored37();return saved.director.cameraTrack[0].yaw===43&&saved.director.version===20&&saved.director.slots[0].clips[0].loopPhaseBeats===1&&JSON.stringify(saved.extra)===JSON.stringify(source37.extra)&&JSON.stringify(PulseApp.song.scene)===scene37;}'''))
        p.locator('#dSave').click()
        idle(p)
        ok('Publication commits the scene and applied tombstone while keeping charts', p.evaluate('''async()=>{const saved=await stored37(),song=await PulseApp.store.get('songs',owner37);window.published37=structuredClone(song);return saved.status==='applied'&&saved.director===null&&song.scene.mmdDirector.cameraTrack[0].yaw===43&&song.scene.mmdDirector.slots[0].clips[0].loopPhaseBeats===1&&JSON.stringify(song.charts)===charts37;}'''))
        p.evaluate('PulseApp.openMMDDirector()')
        p.wait_for_function('!document.getElementById("directorContent").inert')
        ok('Applied tombstone never resurrects an already published recovery', p.evaluate('document.getElementById("dRecovery").hidden'))

        p.evaluate('''async()=>{const a=PulseApp;a.closeModal();window.future37=structuredClone(source37);future37.director.version=999;future37.director.futureField={values:[1,2,3]};await a.store.put('settings',future37);a.directorRecoveries.delete(owner37);reset37();await a.openMMDDirector();}''')
        ok('Unknown stored Director version is protected and cannot be normalized or reassociated', p.evaluate('document.getElementById("directorContent").inert&&!document.getElementById("dRecover")&&!document.getElementById("dReassociate")&&document.getElementById("dRecovery").textContent.includes("version")&&metrics37.writes===0'))
        with p.expect_download() as download:
            p.locator('#dExportRecovery').click()
        ok('Unknown-version source export preserves every field exactly', json.loads(Path(download.value.path()).read_text()) == p.evaluate('future37'))
        p.locator('#closeModal').click()
        ok('Closing unsupported recovery does not modify its source', p.evaluate('''async()=>JSON.stringify(await stored37())===JSON.stringify(future37)&&metrics37.writes===0'''))
        p.evaluate('PulseApp.openMMDDirector()')
        p.wait_for_selector('#dDiscardRecovery')
        p.evaluate('reset37();armAbort37()')
        p.locator('#dDiscardRecovery').click()
        idle(p)
        ok('Native abort also preserves unsupported recovery after explicit discard fails', p.evaluate('''async()=>aborted37&&JSON.stringify(await stored37())===JSON.stringify(future37)&&metrics37.commits===0&&document.getElementById('directorContent').inert'''))
        p.locator('#dDiscardRecovery').click()
        idle(p)
        ok('Explicit discard retry commits its tombstone and preserves the published song', p.evaluate('''async()=>{const saved=await stored37();return saved.status==='discarded'&&saved.director===null&&!document.getElementById('directorContent').inert&&metrics37.commits===1&&JSON.stringify(await PulseApp.store.get('songs',owner37))===JSON.stringify(published37);}'''))
        p.locator('#closeModal').click()
        expected = p.evaluate('''async()=>({owner:owner37,published:published37,source:source37,copies:copies37,recovery:await stored37()})''')
        context.close()
        context = launch(w, profile)
        p = context.pages[0]
        boot(p)
        ok('Full browser reopen preserves the published song and explicit discard marker', p.evaluate('''async expected=>{const s=PulseApp.store;return JSON.stringify(await s.get('songs',expected.owner))===JSON.stringify(expected.published)&&JSON.stringify(await s.get('settings','director-draft:'+expected.owner))===JSON.stringify(expected.recovery);}''', expected))
        reopened = p.evaluate('''async expected=>{const rows=[];for(const c of expected.copies){const s=PulseApp.songs.find(s=>s.id===c.id),d=await PulseApp.store.get('settings','director-draft:'+c.id);rows.push({origin:c.origin,song:!!s,draft:!!d,provenance:c.origin==='absent'?d?.packId===undefined:d?.packId===c.packId,phase:JSON.stringify(d?.director)===JSON.stringify(c.director),extra:JSON.stringify(d?.extra)===JSON.stringify(c.extra),quarantine:PulseApp.quarantinedSongs.find(q=>q.raw.id===c.id)?.error||null});}return rows;}''', expected)
        if not all(all(row[k] for k in ['song', 'draft', 'provenance', 'phase', 'extra']) for row in reopened):
            print(json.dumps(reopened, ensure_ascii=False), flush=True)
        ok('Full browser reopen keeps every archive copy, phase and provenance', all(all(row[k] for k in ['song', 'draft', 'provenance', 'phase', 'extra']) for row in reopened))
        p.evaluate('''async id=>{await PulseApp.selectSong(id);await PulseApp.showView('wardrobe');await PulseApp.openMMDDirector();}''', expected['copies'][0]['id'])
        ok('Restored old-pack recovery remains visible and protected after a full reopen', p.evaluate('document.getElementById("directorContent").inert&&!!document.getElementById("dReassociate")&&!document.getElementById("dRecover")'))
        build_unchanged = hashlib.sha256((R / 'index.html').read_bytes()).hexdigest() == build_sha256
        ok('Integrated build stays unchanged during the native recovery test', build_unchanged)
        ok('No unhandled browser exception in the recovery lifecycle', not errors)
        context.close()
        context = None
except Exception as error:
    failure = str(error)
    print(traceback.format_exc(), flush=True)
    if context:
        try:
            context.pages[0].screenshot(path=str(Q / 'failure.png'), full_page=True)
        except Exception:
            pass
finally:
    if context:
        try:
            context.close()
        except Exception:
            pass
    server.shutdown()
    server.server_close()
    thread.join()

(Q / 'results.json').write_text(json.dumps({
    'version': (R / 'VERSION.txt').read_text().strip(), 'buildSha256': build_sha256,
    'passed': sum(c['passed'] for c in checks), 'failed': sum(not c['passed'] for c in checks),
    'failure': failure, 'checks': checks, 'errors': errors,
    'nativeHTTP': native_http, 'nativeIndexedDB': native_indexeddb,
    'nativeAbortExecuted': native_abort, 'buildUnchanged': build_unchanged,
    'scope': 'Native localhost Chromium/IndexedDB, real V27 MMD fixtures, protected previous-pack Director recovery, explicit reassociation and discard, refused writes and native transaction abort, schema boundaries, both library archive formats, and full browser close/reopen. Does not certify the full V22–V29 historical migration matrix, actual quota/eviction, OS crash, Safari or physical devices.'
}, ensure_ascii=False, indent=2))
if failure:
    raise SystemExit(1)
