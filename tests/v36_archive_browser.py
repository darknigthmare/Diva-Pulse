"""V36 library restoration contracts on native HTTP/IndexedDB.

Small synthetic binary payloads exercise exact preservation and remapping; they
are not audio, video or MMD decoder qualification. Malformed manifests are built
independently so an exporter cannot sanitize the evidence. The abort is a real
IDBTransaction.abort after a successful put; close/reopen uses a persistent profile.
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
Q = Path(os.getenv('PULSE_QA_DIR', str(R / 'qa/v36/archive')))
Q.mkdir(parents=True, exist_ok=True)
checks, errors = [], []
failure = None
context = None
native_abort = False
native_http = False
native_indexeddb = False
build_unchanged = False
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

def launch(w, path):
    return w.chromium.launch_persistent_context(
        str(path), executable_path=os.getenv('CHROMIUM_PATH', '/usr/bin/chromium'),
        headless=not bool(os.getenv('DISPLAY')), viewport={'width': 1280, 'height': 900},
        args=['--no-sandbox', '--disable-dev-shm-usage', '--no-proxy-server',
              '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])

def boot(p):
    p.set_default_timeout(30000)
    p.on('pageerror', lambda e: errors.append(str(e)))
    p.goto(url, wait_until='domcontentloaded')
    p.wait_for_function('window.PulseApp && document.documentElement.dataset.live34Ready === "true" && !PulseApp.busy')

try:
    with tempfile.TemporaryDirectory(prefix='diva-archive36-') as profile, sync_playwright() as w:
        context = launch(w, profile)
        p = context.pages[0]
        boot(p)
        native_http = p.evaluate('location.protocol === "http:"')
        native_indexeddb = p.evaluate('PulseApp.store.persistent && PulseApp.store.db instanceof IDBDatabase')
        ok('Archive tests use native IndexedDB and the exclusive writer lease', native_http and native_indexeddb and p.evaluate('!PulseApp.store.readOnly'))
        p.evaluate('''()=>{
            const a=PulseApp,B=PulseBundle,C=PulseCore;
            window.metrics36={decodes:0,mediaReads:0,writes:0,commits:0};
            const decode=PulseServices.base64ToBlob;
            PulseServices.base64ToBlob=(...args)=>{metrics36.decodes++;return decode(...args);};
            const tx=a.store.db.transaction.bind(a.store.db);
            a.store.db.transaction=function(names,mode,...rest){if(mode==='readwrite')metrics36.writes++;return tx(names,mode,...rest);};
            a.store.watch(e=>{if(e.type==='commit')metrics36.commits++;});
            const slice=Blob.prototype.slice;
            Blob.prototype.slice=function(start,...rest){if(this.name===window.archiveName36&&start>=window.archiveBody36)metrics36.mediaReads++;return slice.call(this,start,...rest);};
            const toast=a.toast.bind(a);a.toast=(message,...rest)=>{window.toast36=message;return toast(message,...rest);};
            window.resetMetrics36=()=>{metrics36={decodes:0,mediaReads:0,writes:0,commits:0};toast36='';};
            window.fixture36=()=>{
                const chart=C.validateChart({id:'archive-chart',title:'Archive source chart',notes:[{time:1,lane:0}],source:'manual'});
                const director=PulseDirector.normalizeDirector({duration:3,count:1,enabled:false,slots:[{modelAssetId:'model',motionAssetId:'motion',clips:[{start:0,end:3,motionAssetId:'motion'}]}]});
                const song={id:'archive-song',title:'Archive V36 fixture',duration:3,bpm:120,charts:[chart],audioAsset:'audio',videoAsset:'video',scene:{modelAsset:'model',mmd:{id:'source-pack',assetIds:['model','motion'],files:[{id:'model',name:'model.pmx',role:'model',kind:'pmx'},{id:'motion',name:'motion.vmd',role:'motion',kind:'vmd'}]},mmdDirector:director,faceTrack:{mode:'off',duration:3,sourceAsset:'guide'}}};
                const assets=['audio','video','model','motion','guide','old-motion'].map((id,i)=>({id,name:id+'.bin',kind:id,type:'application/octet-stream',data:btoa(String.fromCharCode(i,17,128,255))}));
                const recovery=structuredClone(director);recovery.slots[0].motionAssetId='old-motion';recovery.slots[0].clips[0].motionAssetId='old-motion';
                const signature=C.chartSignature(chart),record=(sig,profile='standard')=>({id:`archive-song/archive-chart/${sig}/rules4${profile==='standard'?'':'/profile-'+profile}`,songId:song.id,chartId:chart.id,rulesVersion:4,judgmentProfile:profile,score:1234,accuracy:98});
                return {format:'DIVA-PULSE-LIBRARY',version:5,songs:[song],assets,scores:[record(signature),record('abcdef01'),record(signature,'accessible')],
                    drafts:[{songId:song.id,originalId:'deleted-chart-parent',chart:{...chart,title:'Recoverable orphan chart'},cursor:1,updated:'2026-10-29T00:00:00.000Z'}],
                    directorDrafts:[{songId:song.id,packId:'previous-pack',director:recovery,cursor:1,updated:1}],
                    faceDrafts:[{songId:song.id,track:{mode:'off',duration:3,sourceAsset:'guide'},cursor:1,updated:1}],
                    physicsDrafts:[{songId:song.id,packId:'source-pack',settings:{},cursor:1,updated:1,baseSignature:''}],
                    v3State:{setlists:[{title:'Partial historical list',entries:[{songId:'missing-old-song',chartId:chart.id},{songId:song.id,chartId:chart.id}]}]}};
            };
            window.file36=async(raw,format,malformed=false)=>{
                archiveName36='archive-v36.'+format;
                if(format==='pulsepack'){archiveBody36=Infinity;return new File([JSON.stringify(raw)],archiveName36,{type:'application/json'});}
                const media=raw.assets.map(a=>({...a,blob:new Blob([Uint8Array.from(atob(a.data),c=>c.charCodeAt(0))],{type:a.type})}));
                let blob;
                if(!malformed)blob=await B.pack(raw,media);
                else{
                    const descriptors=[];for(const a of media)descriptors.push({id:a.id,name:a.name,kind:a.kind,type:a.type,size:a.blob.size,hashes:await B.hashes(a.blob)});
                    const bytes=new TextEncoder().encode(JSON.stringify({format:'DIVA-PULSE-BUNDLE',version:1,chunkSize:B.CHUNK,library:{...raw,assets:descriptors}}));
                    const head=new Uint8Array(B.HEADER);head.set(new TextEncoder().encode(B.MAGIC));new DataView(head.buffer).setUint32(8,bytes.length,true);head.set(Uint8Array.from((await B.digest(bytes)).match(/../g),s=>parseInt(s,16)),12);blob=new Blob([head,bytes,...media.map(a=>a.blob)]);
                }
                archiveBody36=B.HEADER+new DataView(await blob.slice(0,B.HEADER).arrayBuffer()).getUint32(8,true);
                return new File([blob],archiveName36,{type:'application/octet-stream'});
            };
            window.snapshot36=async()=>{
                const out={};for(const name of ['songs','settings','scores','assets'])out[name]=await a.store.all(name);
                out.assets=await Promise.all(out.assets.map(async row=>({...row,blob:[...new Uint8Array(await row.blob.arrayBuffer())]})));
                return JSON.stringify(out);
            };
            window.originalSongs36=JSON.stringify(a.songs);
            window.restored36=[];
        }''')
        for fmt in ['pulsepack', 'pulsebundle']:
            p.evaluate('''async format=>{
                const a=PulseApp;window.incoming36=fixture36();window.fileToRestore36=await file36(incoming36,format);window.before36=await snapshot36();window.songCount36=a.songs.length;resetMetrics36();
                const transfer=new DataTransfer();transfer.items.add(fileToRestore36);const input=document.getElementById('backupInput');input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));
            }''', fmt)
            p.wait_for_function('!PulseApp.busy && !!document.getElementById("confirmRestore")')
            ok(fmt+' opens confirmation without a storage write', p.evaluate('metrics36.writes===0 && metrics36.commits===0 && PulseApp.songs.length===songCount36'))
            p.locator('#confirmRestore').click()
            p.wait_for_function('!PulseApp.busy && !document.getElementById("modal").open')
            result = p.evaluate('''async()=>{
                const a=PulseApp,s=a.songs.at(-1),all=await a.store.all('assets'),known=new Set(all.map(x=>x.id)),refs=[s.audioAsset,s.videoAsset,...PulseDirector.assetReferences(s.scene)],drafts=(await a.store.all('settings')).filter(d=>d.songId===s.id),scores=(await a.store.all('scores')).filter(r=>r.songId===s.id);
                restored36.push(s.id);
                return {count:a.songs.length===songCount36+1,copy:s.id!=='archive-song',refs:refs.every(id=>known.has(id)&&!['audio','video','model','motion','guide'].includes(id)),
                    drafts:drafts.length===4&&drafts.some(d=>d.originalId==='deleted-chart-parent')&&drafts.filter(d=>d.packId).every(d=>d.packId===s.scene.mmd.id),
                    oldPackDraft:drafts.some(d=>d.director&&known.has(d.director.slots[0].clips[0].motionAssetId)&&!s.scene.mmd.assetIds.includes(d.director.slots[0].clips[0].motionAssetId)&&d.director.slots[0].clips[0].motionAssetId!==s.scene.mmdDirector.slots[0].clips[0].motionAssetId),
                    guide:drafts.some(d=>d.track?.sourceAsset===s.scene.faceTrack.sourceAsset),scores:scores.length===3&&scores.some(r=>r.id.endsWith('/abcdef01/rules4'))&&scores.some(r=>r.id.endsWith('/profile-accessible')),
                    bytes:JSON.stringify([...new Uint8Array(await all.find(x=>x.id===s.audioAsset).blob.arrayBuffer())])==='[0,17,128,255]',
                    originals:JSON.stringify(a.songs.slice(0,JSON.parse(originalSongs36).length))===originalSongs36,
                    once:metrics36.writes===1&&metrics36.commits===1,
                    setlist:a.v3State.setlists.at(-1).entries.length===1&&a.v3State.setlists.at(-1).entries[0].songId===s.id};
            }''')
            for key, description in [('count','adds one complete song'),('copy','assigns a new owner'),('refs','remaps the scene and media graph'),('drafts','remaps all draft owners and preserves orphan chart work'),('guide','reattaches the facial guide'),('oldPackDraft','keeps previous-pack draft media separate from the published scene'),('scores','retains distinct historical score signatures and profiles'),('bytes','retains exact media bytes'),('originals','preserves existing songs'),('once','commits all rows in one native transaction'),('setlist','keeps compatible entries of historical setlists')]:
                ok(fmt+' '+description, result[key])

        invalid = [
            ('duplicate songs', "r.songs.push(structuredClone(r.songs[0]))", 'songs[1].id'),
            ('duplicate assets', "r.assets.push(structuredClone(r.assets[0]))", 'assets[6].id'),
            ('duplicate charts', "r.songs[0].charts.push(structuredClone(r.songs[0].charts[0]))", 'charts[1].id'),
            ('duplicate chart drafts', "r.drafts.push({...structuredClone(r.drafts[0]),chart:{...r.drafts[0].chart,title:'Different lost work'}})", 'drafts[1]'),
            ('duplicate Director owners', "r.directorDrafts.push(structuredClone(r.directorDrafts[0]))", 'directorDrafts[1].songId'),
            ('missing chart draft owner', "r.drafts[0].songId='absent'", 'drafts[0].songId'),
            ('missing audio', "r.songs[0].audioAsset='absent'", 'songs[0].audioAsset'),
            ('missing MMD file', "r.songs[0].scene.mmd.files[0].id='absent'", 'mmd.files[0].id'),
            ('missing Director clip', "r.songs[0].scene.mmdDirector.slots[0].clips[0].motionAssetId='absent'", 'clips[0].motionAssetId'),
            ('missing face guide', "r.faceDrafts[0].track.sourceAsset='absent'", 'faceDrafts[0].track.sourceAsset'),
            ('colliding restored score keys', "r.scores=[{...r.scores[0],id:'old-a'},{...r.scores[0],id:'old-b'}]", 'scores[1]'),
            ('Director model outside its pack', "r.songs[0].scene.mmdDirector.slots[0].modelAssetId='old-motion'", 'slots[0].modelAssetId'),
            ('Director motion outside its pack', "r.songs[0].scene.mmdDirector.slots[0].motionAssetId='old-motion'", 'slots[0].motionAssetId'),
            ('Director clip outside its pack', "r.songs[0].scene.mmdDirector.slots[0].clips[0].motionAssetId='old-motion'", 'clips[0].motionAssetId'),
            ('Auto Show model outside its pack', "r.songs[0].scene.autoShow=PulseAutoShow.generate(r.songs[0]);r.songs[0].scene.autoShow.director.slots[0].modelAssetId='old-motion'", 'autoShow.director.slots[0].modelAssetId'),
            ('Auto Show motion outside its pack', "r.songs[0].scene.autoShow=PulseAutoShow.generate(r.songs[0]);r.songs[0].scene.autoShow.director.slots[0].motionAssetId='old-motion'", 'autoShow.director.slots[0].motionAssetId'),
            ('Auto Show clip outside its pack', "r.songs[0].scene.autoShow=PulseAutoShow.generate(r.songs[0]);r.songs[0].scene.autoShow.director.slots[0].clips[0].motionAssetId='old-motion'", 'autoShow.director.slots[0].clips[0].motionAssetId'),
            ('in-pack texture used as a motion', "r.songs[0].scene.mmd.assetIds.push('guide');r.songs[0].scene.mmd.files.push({id:'guide',role:'texture'});r.songs[0].scene.mmdDirector.slots[0].clips[0].motionAssetId='guide'", 'clips[0].motionAssetId'),
            ('in-pack motion used as a model', "r.songs[0].scene.mmdDirector.slots[0].modelAssetId='motion'", 'slots[0].modelAssetId'),
            ('second camera outside the loaded cache', "r.songs[0].scene.mmd.files.find(f=>f.id==='motion').role='camera';r.songs[0].scene.mmd.assetIds.push('guide');r.songs[0].scene.mmd.files.push({id:'guide',role:'camera'});r.songs[0].scene.mmdDirector.slots[0].clips[0].motionAssetId='guide'", 'clips[0].motionAssetId'),
            ('unknown future version', "r.version=999", '2, 3, 4, 5'),
            ('unknown V1 version', "r.version=1", '2, 3, 4, 5'),
        ]
        for fmt in ['pulsepack', 'pulsebundle']:
            for label, mutation, diagnostic in invalid:
                result = p.evaluate('''async args=>{
                    const a=PulseApp,r=fixture36();new Function('r',args.mutation)(r);const file=await file36(r,args.format,true),before=await snapshot36();resetMetrics36();a.closeModal();let error='';
                    try{await a.restoreBackup(file);}catch(e){error=e.message;}
                    return {error,unchanged:await snapshot36()===before,metrics:{...metrics36},confirmation:!!document.getElementById('confirmRestore')&&document.getElementById('modal').open};
                }''', {'mutation': mutation, 'format': fmt})
                passed = diagnostic in result['error'] and result['unchanged'] and not result['confirmation'] and all(result['metrics'][key] == 0 for key in ['decodes','mediaReads','writes','commits'])
                if not passed:
                    print(json.dumps(result, ensure_ascii=False), flush=True)
                ok(fmt+' refuses '+label+' before media decoding/body reads and every write', passed)

        result = p.evaluate('''async()=>{
            const a=PulseApp,r=fixture36(),before=await snapshot36();await a.reviewBackup(r);r.drafts.push({...structuredClone(r.drafts[0]),chart:{...r.drafts[0].chart,title:'late change'}});resetMetrics36();await document.getElementById('confirmRestore').onclick();
            const result=await snapshot36()===before&&metrics36.decodes===0&&metrics36.writes===0&&metrics36.commits===0&&toast36.includes('dupliqu');a.closeModal();return result;
        }''')
        ok('Confirmation rechecks a library mutated after review without decoding or writing', result)

        # Abort after a real native put success, then retry the still-open review.
        result = p.evaluate('''async()=>{
            const a=PulseApp,r=fixture36(),before=await snapshot36();await a.reviewBackup(r);resetMetrics36();
            const db=a.store.db,transaction=db.transaction.bind(db);window.aborted36=false;
            db.transaction=function(names,mode,...rest){const tx=transaction(names,mode,...rest);if(mode==='readwrite'){db.transaction=transaction;const objectStore=tx.objectStore.bind(tx);let armed=false;tx.objectStore=function(name){const store=objectStore(name),put=store.put.bind(store);store.put=function(...args){const req=put(...args);if(!armed){armed=true;req.addEventListener('success',()=>{aborted36=tx instanceof IDBTransaction&&req instanceof IDBRequest;tx.abort();},{once:true});}return req;};return store;};}return tx;};
            await document.getElementById('confirmRestore').onclick();
            return {native:aborted36,unchanged:await snapshot36()===before,commits:metrics36.commits,open:document.getElementById('modal').open};
        }''')
        native_abort = result['native']
        ok('Native transaction abort after a successful put leaves all stores unchanged', native_abort and result['unchanged'] and result['commits'] == 0 and result['open'])
        p.locator('#confirmRestore').click()
        p.wait_for_function('!PulseApp.busy && !document.getElementById("modal").open')
        ok('Retry after native abort commits one complete restore', p.evaluate('metrics36.commits===1 && PulseApp.songs.at(-1).title==="Archive V36 fixture"'))
        expected = p.evaluate('''async()=>{restored36.push(PulseApp.songs.at(-1).id);return {ids:restored36,snapshot:await snapshot36()};}''')
        context.close()
        context = launch(w, profile)
        p = context.pages[0]
        boot(p)
        ok('Full browser reopen keeps each restored copy out of quarantine', p.evaluate('ids=>ids.every(id=>PulseApp.songs.some(s=>s.id===id))&&!PulseApp.quarantinedSongs.some(q=>ids.includes(q.raw.id))', expected['ids']))
        persisted = p.evaluate('''async()=>{const a=PulseApp,out={};for(const name of ['songs','settings','scores','assets'])out[name]=await a.store.all(name);out.assets=await Promise.all(out.assets.map(async row=>({...row,blob:[...new Uint8Array(await row.blob.arrayBuffer())]})));return JSON.stringify(out);}''')
        ok('Full browser reopen preserves exact restored records and media bytes', persisted == expected['snapshot'])
        build_unchanged = hashlib.sha256((R / 'index.html').read_bytes()).hexdigest() == build_sha256
        ok('Generated build stays unchanged throughout the archive test', build_unchanged)
        ok('No unhandled browser exception during archive restoration', not errors)
        context.close()
        context = None
except Exception as error:
    failure = str(error)
    print(traceback.format_exc(), flush=True)
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
    'version': (R / 'VERSION.txt').read_text().strip(),
    'buildSha256': build_sha256,
    'passed': sum(check['passed'] for check in checks),
    'failed': sum(not check['passed'] for check in checks),
    'failure': failure, 'checks': checks, 'errors': errors,
    'nativeAbortExecuted': native_abort,
    'nativeHTTP': native_http, 'nativeIndexedDB': native_indexeddb,
    'buildUnchanged': build_unchanged,
    'scope': 'Native localhost Chromium, IndexedDB, real transaction abort and full browser close/reopen. Small synthetic binary fixtures; not media decoder, actual quota/eviction, 1 GiB, Safari or physical device certification.'
}, ensure_ascii=False, indent=2))
if failure:
    raise SystemExit(1)
