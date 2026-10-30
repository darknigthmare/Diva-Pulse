"""V35 playback lifecycle regression, native HTTP/IndexedDB and Web Audio.

Promises at preparation boundaries are deliberately deferred to reproduce races.
The final WSOLA check uses the actual worker. Visibility is injected; this is not
physical-device, background-throttling or acoustic latency certification.
"""
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import hashlib
import json
import os
import threading
import traceback
from playwright.sync_api import sync_playwright

R = Path(__file__).resolve().parents[1]
Q = Path(os.getenv('PULSE_QA_DIR', str(R / 'qa/v35/playback')))
Q.mkdir(parents=True, exist_ok=True)
checks, errors = [], []
failure = None

class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

def ok(name, value):
    checks.append({'name': name, 'passed': bool(value)})
    print(('PASS ' if value else 'FAIL ') + name, flush=True)
    if not value:
        raise AssertionError(name)

server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Quiet, directory=str(R)))
threading.Thread(target=server.serve_forever, daemon=True).start()
try:
    with sync_playwright() as w:
        browser = w.chromium.launch(
            executable_path=os.getenv('CHROMIUM_PATH', '/usr/bin/chromium'),
            headless=not bool(os.getenv('DISPLAY')),
            args=['--no-sandbox', '--disable-dev-shm-usage', '--no-proxy-server',
                  '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
                  '--autoplay-policy=no-user-gesture-required'])
        p = browser.new_page(viewport={'width': 1280, 'height': 900})
        p.set_default_timeout(30000)
        p.on('pageerror', lambda e: errors.append(str(e)))
        p.goto(f'http://127.0.0.1:{server.server_port}/', wait_until='domcontentloaded')
        p.wait_for_function('window.PulseApp && document.documentElement.dataset.live34Ready === "true" && !PulseApp.busy')
        p.evaluate('''async()=>{
            const a=PulseApp;
            window.originalPitch35=a.preparePitch;
            window.originalScene35=a.applyScene;
            window.originalPrepareAudio35=a.prepareAudio;
            window.originalVideo35=a.prepareVideo;
            window.playCalls35=0;
            const play=a.audio.play;
            a.audio.play=function(...args){playCalls35++;return play.apply(this,args);};
            window.hide35=()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));};
            window.show35=()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));};
            window.deferPitch35=()=>{
                window.deferred35=[];
                a.preparePitch=()=>new Promise((resolve,reject)=>deferred35.push({resolve,reject}));
            };
            window.fresh35=async()=>{
                show35();a.cancelPitch();a.preparePitch=originalPitch35;
                a.applyScene=originalScene35;a.prepareAudio=originalPrepareAudio35;a.prepareVideo=originalVideo35;
                await a.showView('library');a.closeModal();await a.audio.init();
                a.settings.noFail=true;a.settings.practiceClicksDefault=false;
                await a.startGame('practice',{from:0,to:Math.min(30,a.song.duration),rate:1,loop:false,preservePitch:true,countClicks:false});
                window.playCalls35=0;
            };
            await a.audio.init();
        }''')
        ok('Native HTTP boot uses persistent storage and a running audio context', p.evaluate('PulseApp.store.persistent && PulseApp.audio.ctx.state === "running"'))

        # The original launch had no guard after applyScene. A hide/show cycle
        # must invalidate it even when the page is visible again at completion.
        p.evaluate('''()=>{const a=PulseApp;window.sceneReady35=false;a.applyScene=()=>new Promise(r=>{window.releaseScene35=r;sceneReady35=true;});window.pending35=a.startGame('play');}''')
        p.wait_for_function('sceneReady35')
        p.evaluate('hide35();show35()')
        result = p.evaluate('''async()=>{releaseScene35();await pending35;PulseApp.applyScene=originalScene35;return playCalls35===0 && PulseApp.view==='library' && !PulseApp.audio.playing;}''')
        ok('Hide/show during scene preparation cancels the original launch', result)

        p.evaluate('''async()=>{await fresh35();const a=PulseApp;await a.showView('library');a.closeModal();playCalls35=0;window.audioReady35=false;a.prepareAudio=()=>new Promise(r=>{window.releaseAudio35=r;audioReady35=true;});window.pending35=a.startGame('play');}''')
        p.wait_for_function('audioReady35')
        p.evaluate('PulseApp.showView("settings")')
        result = p.evaluate('''async()=>{releaseAudio35();await pending35;PulseApp.prepareAudio=originalPrepareAudio35;return playCalls35===0 && PulseApp.view==='settings' && !PulseApp.audio.playing;}''')
        ok('Navigation during audio preparation cannot launch the abandoned song', result)

        p.evaluate('''async()=>{await fresh35();const a=PulseApp;await a.showView('library');a.closeModal();playCalls35=0;window.videoReady35=false;a.prepareVideo=()=>new Promise(r=>{window.releaseVideo35=r;videoReady35=true;});a.pendingReplay={engine:'34.0.0',judgmentProfile:'accessible',noFail:true,chart:structuredClone(a.chart),inputs:[],endTime:20};a.settings.judgmentProfile='precision';window.pending35=a.startGame('replay');}''')
        p.wait_for_function('videoReady35')
        p.evaluate('hide35();show35()')
        result = p.evaluate('''async()=>{releaseVideo35();await pending35;PulseApp.prepareVideo=originalVideo35;return playCalls35===0 && PulseApp.view==='library' && !PulseApp.audio.playing;}''')
        ok('Late video completion cannot create a partially initialized replay', result)
        p.evaluate("PulseApp.startGame('replay')")
        ok('A fresh replay installs its recorded profile before the first frame', p.evaluate('PulseApp.audio.playing && PulseApp.engine.profile==="accessible" && PulseApp.mode==="replay"'))
        p.evaluate('PulseApp.settings.judgmentProfile="standard"')

        p.evaluate('''async()=>{await fresh35();deferPitch35();window.pending35=PulseApp.restartPracticeLoop();}''')
        p.wait_for_function('deferred35.length === 1')
        ok('Loop preparation stops playback and enters its pending state', p.evaluate('PulseApp.paused && PulseApp.pitchPreparing && !PulseApp.audio.playing'))
        p.evaluate('hide35()')
        ok('Hiding during a pending loop cancels preparation and exposes resume', p.evaluate('PulseApp.paused && !PulseApp.pitchPreparing && !PulseApp.audio.playing && document.getElementById("modal").open && !!document.getElementById("resumeGame")'))
        p.evaluate('show35()')
        result = p.evaluate('''async()=>{deferred35[0].resolve();await pending35;PulseApp.preparePitch=originalPitch35;return playCalls35===0 && PulseApp.paused && !PulseApp.audio.playing;}''')
        ok('Returning visible before a late loop result does not restart music', result)
        p.locator('#resumeGame').click()
        p.wait_for_function('!PulseApp.paused && PulseApp.audio.playing')
        ok('An explicit resume after cancellation starts exactly once', p.evaluate('playCalls35===1 && PulseApp.audio.ctx.state==="running"'))

        p.evaluate('''async()=>{await fresh35();deferPitch35();window.pending35=PulseApp.restartPracticeLoop();await PulseApp.audio.ctx.suspend();}''')
        p.wait_for_function('!PulseApp.pitchPreparing')
        ok('Native AudioContext suspension cancels pending loop preparation', p.evaluate('PulseApp.paused && !PulseApp.audio.playing && document.getElementById("modal").open'))
        p.evaluate('PulseApp.audio.ctx.resume()')
        result = p.evaluate('''async()=>{deferred35[0].resolve();await pending35;PulseApp.preparePitch=originalPitch35;return playCalls35===0 && PulseApp.paused && !PulseApp.audio.playing;}''')
        ok('Context recovery plus a late worker result still requires user resume', result)

        p.evaluate('''async()=>{await fresh35();deferPitch35();window.pending35=PulseApp.restartPracticeLoop();await PulseApp.showView('library');}''')
        result = p.evaluate('''async()=>{deferred35[0].resolve();await pending35;PulseApp.preparePitch=originalPitch35;return playCalls35===0 && PulseApp.view==='library' && !PulseApp.audio.playing && !PulseApp.pitchPreparing;}''')
        ok('Leaving practice rejects the pending loop without hidden playback', result)

        p.evaluate('''async()=>{await fresh35();deferPitch35();window.pending35=PulseApp.restartPracticeLoop();}''')
        result = p.evaluate('''async()=>{deferred35[0].resolve();const result=await pending35;PulseApp.preparePitch=originalPitch35;return result===true && playCalls35===1 && !PulseApp.paused && !PulseApp.pitchPreparing && PulseApp.audio.playing && document.getElementById('pitchWait').hidden;}''')
        ok('A current loop completes once and clears preparation state', result)

        p.evaluate('''async()=>{await fresh35();PulseApp.pause();deferPitch35();window.pending35=PulseApp.resume();}''')
        p.wait_for_function('deferred35.length === 1')
        p.evaluate('hide35();show35()')
        result = p.evaluate('''async()=>{deferred35[0].resolve();await pending35;PulseApp.preparePitch=originalPitch35;return playCalls35===0 && PulseApp.paused && !PulseApp.audio.playing && document.getElementById('modal').open;}''')
        ok('A delayed resume cannot acquire a new authorization after hide/show', result)

        p.evaluate('''async()=>{await fresh35();PulseApp.pause();deferPitch35();window.olderResume35=PulseApp.resume();window.newerResume35=PulseApp.resume();}''')
        p.wait_for_function('deferred35.length === 2')
        result = p.evaluate('''async()=>{deferred35[1].resolve();await newerResume35;return playCalls35===1 && !PulseApp.paused && PulseApp.audio.playing;}''')
        ok('The newest explicit resume can complete normally', result)
        result = p.evaluate('''async()=>{deferred35[0].reject(Error('Superseded preparation'));await olderResume35;PulseApp.preparePitch=originalPitch35;return playCalls35===1 && !PulseApp.paused && PulseApp.audio.playing;}''')
        ok('A rejected older resume cannot stop or restart the newer playback', result)

        p.evaluate('''async()=>{await fresh35();const a=PulseApp;await a.showView('library');a.closeModal();playCalls35=0;deferPitch35();window.pending35=a.startGame('practice',{from:0,to:10,rate:.75,loop:false,preservePitch:true,countClicks:false});}''')
        p.wait_for_function('deferred35.length === 1')
        p.evaluate('hide35();show35()')
        result = p.evaluate('''async()=>{deferred35[0].resolve();await pending35;PulseApp.preparePitch=originalPitch35;return playCalls35===0 && PulseApp.view==='library' && !PulseApp.audio.playing;}''')
        ok('Late pitch preparation cannot launch a cancelled practice session', result)

        p.evaluate('''async()=>{const a=PulseApp;a.closeModal();await a.startGame('practice',{from:0,to:3,rate:.75,loop:false,preservePitch:true,countClicks:false});}''')
        ok('Real WSOLA worker still prepares a slower practice buffer', p.evaluate('PulseApp.audio.playing && !PulseApp.paused && PulseApp.audio.stretched?.rate===.75 && PulseApp.audio.stretched.buffer.duration>3'))
        p.evaluate('PulseApp.pause()')
        p.locator('#resumeGame').click()
        p.wait_for_function('!PulseApp.paused && PulseApp.audio.playing')
        ok('Explicit resume reuses a valid pitch-preserved buffer', p.evaluate('PulseApp.audio.rate===.75 && PulseApp.audio.stretched?.rate===.75'))
        p.evaluate('PulseApp.showView("library")')
        ok('Leaving the final session stops audio and releases preparation', p.evaluate('!PulseApp.audio.playing && !PulseApp.pitchPreparing && !PulseApp.audio.stretched'))
        result = p.evaluate('''async()=>{const a=PulseApp;await a.showView('editor');const source=a.chart.id;a.editor.chart.title='V35 Studio saved chart';a.editor.dirty=true;const started=await a.startGame('play');const saved=await a.store.get('songs',a.song.id);return started!==false && a.view==='game' && a.audio.playing && !a.editor.dirty && a.gameChart.title==='V35 Studio saved chart' && a.gameChart.id!==source && saved.charts.some(c=>c.id===a.gameChart.id && c.title===a.gameChart.title);}''')
        ok('Starting from dirty Studio plays the newly saved derived chart', result)
        p.evaluate('PulseApp.showView("library")')
        ok('No uncaught browser errors in playback lifecycle scenarios', not errors)
        browser.close()
except Exception as exc:
    failure = str(exc)
    print(traceback.format_exc(), flush=True)
finally:
    server.shutdown()
    server.server_close()

(Q / 'results.json').write_text(json.dumps({
    'version': (R / 'VERSION.txt').read_text().strip(),
    'buildSha256': hashlib.sha256((R / 'index.html').read_bytes()).hexdigest(),
    'passed': sum(c['passed'] for c in checks),
    'failed': sum(not c['passed'] for c in checks),
    'failure': failure, 'errors': errors, 'checks': checks,
    'nativeHTTP': True, 'nativeAudio': True,
    'scope': 'Native HTTP/IndexedDB and Web Audio; controlled deferred preparation boundaries and injected visibility events. Final WSOLA check uses the real worker. Software GPU, no physical-device or acoustic certification.'
}, ensure_ascii=False, indent=2) + '\n')
if failure:
    raise SystemExit(1)
