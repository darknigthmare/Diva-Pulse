"""GAME-05 V37: actual HTTP, IndexedDB and Web Audio, controlled take timestamps.
Commit promises and one native abort are deliberately injected. These tests do
not certify acoustic latency, historical replay identity or multi-window writes.
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
Q = Path(os.getenv('PULSE_QA_DIR', str(R / 'qa/v37/records-replays')))
Q.mkdir(parents=True, exist_ok=True)
build_hash = hashlib.sha256((R / 'index.html').read_bytes()).hexdigest()
checks, errors = [], []
error_details, http_errors = [], []
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
            executable_path=os.getenv('CHROMIUM_PATH', '/usr/bin/chromium'), headless=True,
            args=['--no-sandbox', '--disable-dev-shm-usage', '--no-proxy-server',
                  '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
                  '--autoplay-policy=no-user-gesture-required'])
        p = browser.new_page(viewport={'width': 1280, 'height': 900})
        p.set_default_timeout(30000)
        p.on('pageerror', lambda e: errors.append(str(e)))
        def collect_console(message):
            if message.type != 'error':
                return
            errors.append(message.text)
            detail = {'message': message.text, 'location': message.location,
                      'afterCheck': checks[-1]['name'] if checks else 'startup'}
            error_details.append(detail)
            print('BROWSER_ERROR ' + json.dumps(detail), flush=True)

        def collect_response(response):
            if response.status < 400:
                return
            detail = {'status': response.status, 'url': response.url}
            http_errors.append(detail)
            print('HTTP_ERROR ' + json.dumps(detail), flush=True)

        p.on('console', collect_console)
        p.on('response', collect_response)
        p.goto(f'http://127.0.0.1:{server.server_port}/', wait_until='domcontentloaded')
        p.wait_for_function('window.PulseApp && document.documentElement.dataset.live34Ready === "true" && !PulseApp.busy')
        p.evaluate("""async()=>{
            const a=PulseApp,C=PulseCore;await a.audio.init();
            window.put37=a.store.put;window.video37=a.prepareVideo;
            window.baseSong37=structuredClone(a.song);window.serial37=0;
            window.clock37=t=>{a.audio.pause();a.audio.pausedAt=t;a.paused=false;};
            window.input37=(lane,time,down)=>{clock37(time);if(down)a.pressSource('qa37-'+lane,lane);else a.releaseSource('qa37-'+lane);};
            window.hit37=(time=1)=>{input37(0,time,true);input37(0,time+.01,false);};
            window.shortChart37=(id,notes=[{id:'n',time:1,lane:0}],difficulty='NORMAL')=>C.validateChart({id,title:'Original QA37 chart',difficulty,notes});
            window.fresh37=async(mode='play',profile='standard',noFail=false,suffix,chart,practice,duration=4)=>{
                await a.showView('library');a.closeModal();suffix=suffix||String(++serial37);
                chart=chart||shortChart37('chart-'+suffix);
                const song={...structuredClone(baseSong37),id:'qa37-'+suffix,title:'QA37 '+suffix,duration,charts:[chart]};
                a.songs=a.songs.filter(s=>s.id!==song.id);a.songs.push(song);await a.store.put('songs',song);
                a.song=song;a.selectedChartId=chart.id;a.difficulty=chart.difficulty;
                a.settings.noFail=noFail;a.settings.judgmentProfile=profile;a.settings.inputOffset=0;
                a.settings.practiceClicksDefault=false;a.settings.practicePitchDefault=false;
                a.settings.useVideo=false;a.settings.hitSound=false;
                const buffer=a.audio.ctx.createBuffer(1,Math.ceil(a.audio.ctx.sampleRate*duration),a.audio.ctx.sampleRate);
                a.buffers.set(song.id,buffer);a.buffer=null;a.bufferId=null;
                if(mode==='replay')a.pendingReplay={format:'DIVA-PULSE-REPLAY',version:1,engine:C.VERSION,
                    judgmentProfile:profile,noFail,chart:structuredClone(chart),inputs:[{time:1,lane:0,down:true},{time:1.01,lane:0,down:false}],endTime:2};
                if(practice?.academy)a.activeLesson=C.LESSONS.find(l=>l.id===practice.academy);
                const started=await a.startGame(mode,mode==='practice'?(practice||{from:0,to:3,rate:1,loop:false,preservePitch:false,countClicks:false}):null);
                if(started===false)throw Error('QA37 launch unexpectedly cancelled');
                return song.id;
            };
            window.deferScores37=()=>{
                window.slots37=[0,1].map(()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};});
                window.scoreWrites37=[];
                a.store.put=async function(store,row){
                    if(store==='scores'){const slot=slots37[scoreWrites37.length];scoreWrites37.push(structuredClone(row));await slot.promise;}
                    return put37.call(this,store,row);
                };
            };
        }""")
        ok('HTTP boot uses native persistent IndexedDB and a running AudioContext',
           p.evaluate('PulseApp.store.persistent && PulseApp.store.db instanceof IDBDatabase && PulseApp.audio.ctx instanceof AudioContext && PulseApp.audio.ctx.state==="running"'))

        for profile in ['standard', 'accessible', 'precision']:
            for mode, no_fail in [('play', False), ('play', True), ('practice', False), ('autoplay', False), ('replay', False), ('pv', False)]:
                result = p.evaluate("""async([profile,mode,noFail])=>{
                    const a=PulseApp,before=await a.store.all('scores');
                    await fresh37(mode,profile,noFail,profile+'-'+mode+'-'+noFail);
                    if(mode==='play'||mode==='practice')hit37();
                    else if(mode==='autoplay')a.engine.update(2,true);
                    else if(mode==='replay')a.advanceReplay(2);
                    clock37(2);const completion=await a.finish(),after=await a.store.all('scores');
                    const eligible=mode==='play'&&!noFail;
                    const fresh=after.filter(row=>!before.some(old=>old.id===row.id));
                    let correct=completion?.mode===mode && after.length===before.length+(eligible?1:0);
                    if(eligible)correct=correct&&fresh[0].score===1000&&fresh[0].judgmentProfile===profile&&fresh[0].rulesVersion===4&&fresh[0].id.endsWith('/rules4'+(profile==='standard'?'':'/profile-'+profile));
                    else correct=correct&&JSON.stringify(after)===JSON.stringify(before);
                    if(mode==='play')correct=correct&&completion.replay.noFail===noFail&&completion.replay.judgmentProfile===profile&&PulseCore.simulateReplay(completion.replay).score===1000;
                    correct=correct&&document.querySelectorAll('.practice-summary').length===(mode==='practice'?1:0);
                    return correct;
                }""", [profile, mode, no_fail])
                ok(f'{profile} / {mode} / noFail={no_fail}: native records stay in the correct category', result)

        p.evaluate("""async()=>{
            const a=PulseApp;await fresh37('play','accessible',false,'navigate');hit37();clock37(2);
            window.owner37=a.song.id;deferScores37();window.pending37=a.finish();
        }""")
        p.wait_for_function('scoreWrites37.length===1')
        p.evaluate('PulseApp.showView("settings")')
        p.locator('#noFail').check()
        p.wait_for_function('PulseApp.settings.noFail===true')
        result = p.evaluate("""async()=>{
            const a=PulseApp;await a.selectSong(baseSong37.id);slots37[0].resolve();const completion=await pending37;
            a.store.put=put37;const row=(await a.store.all('scores')).find(s=>s.songId===owner37);
            const session=(await a.store.get('settings','v3-state')).sessions.find(s=>s.songId===owner37);
            return a.view==='settings'&&a.engine===null&&row.score===1000&&row.judgmentProfile==='accessible'
                &&completion.replay.songId===owner37&&completion.replay.noFail===false
                &&completion.replay.judgmentProfile==='accessible'&&session.mode==='play'
                &&PulseCore.simulateReplay(completion.replay).score===1000;
        }""")
        ok('Navigation and the actual no-fail checkbox during commit cannot relabel the finished take', result)

        p.evaluate("""async()=>{
            await fresh37('play','standard',false,'old-running');hit37();clock37(2);
            deferScores37();window.pending37=PulseApp.finish();
        }""")
        p.wait_for_function('scoreWrites37.length===1')
        result = p.evaluate("""async()=>{
            const a=PulseApp;await fresh37('play','precision',true,'new-running');const engine=a.engine;
            slots37[0].resolve();const old=await pending37;a.store.put=put37;
            return a.view==='game'&&a.engine===engine&&a.audio.playing&&!a.finishing
                &&a.engine.profile==='precision'&&a.engine.options.noFail&&old.replay.songId==='qa37-old-running'
                &&old.replay.result.score===1000&&!old.current();
        }""")
        ok('An old commit preserves the newer engine, native audio playback and finishing state', result)


        p.evaluate("""async()=>{
            const a=PulseApp;await fresh37('play','accessible',false,'hidden-finish');hit37();clock37(2);
            window.takeEpochBefore37=a.liveTakeEpoch();window.audioEpochBefore37=a.liveEpoch34();
            deferScores37();window.pending37=a.finish();
        }""")
        p.wait_for_function('scoreWrites37.length===1')
        result = p.evaluate("""async()=>{
            const a=PulseApp;Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});
            document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('blur'));
            const interrupted=a.liveEpoch34()>audioEpochBefore37;slots37[0].resolve();const completion=await pending37;
            const whileHidden=a.view==='results'&&!a.audio.playing&&completion.current()&&completion.result.score===1000
                &&a.liveTakeEpoch()===takeEpochBefore37&&!document.getElementById('modal').open;
            delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));a.store.put=put37;
            return interrupted&&whileHidden&&a.view==='results'&&!a.audio.playing
                &&PulseCore.simulateReplay(completion.replay).score===1000;
        }""")
        ok('A completed take reaches its results while hidden and remains silent after visibility returns', result)

        p.evaluate("""async()=>{
            const a=PulseApp;await fresh37('play','standard',false,'preparing-next');hit37();clock37(2);
            deferScores37();window.pending37=a.finish();window.oldEngine37=a.engine;
        }""")
        p.wait_for_function('scoreWrites37.length===1')
        p.evaluate("""()=>{
            const a=PulseApp;window.videoReady37=false;
            a.prepareVideo=()=>new Promise(r=>{window.releaseVideo37=r;videoReady37=true;});
            window.newPreparation37=a.startGame('play');
        }""")
        p.wait_for_function('videoReady37')
        result = p.evaluate("""async()=>{
            const a=PulseApp;document.getElementById('resultMode').textContent='NEXT PREPARATION';
            slots37[0].resolve();const old=await pending37;
            const preserved=!old.current()&&a.view==='game'&&a.engine===oldEngine37
                &&document.getElementById('resultMode').textContent==='NEXT PREPARATION';
            releaseVideo37();await newPreparation37;a.prepareVideo=video37;a.store.put=put37;
            return preserved&&a.view==='game'&&a.engine!==oldEngine37&&!a.finishing&&a.audio.playing;
        }""")
        ok('An older finish cannot take over a new preparation before its engine is installed', result)

        for old_score, new_score in [(1000, 750), (750, 1000)]:
            for reverse in [False, True]:
                result = p.evaluate("""async([oldScore,newScore,reverse])=>{
                    const a=PulseApp,suffix='overlap-'+oldScore+'-'+newScore+'-'+reverse;
                    await fresh37('play','standard',false,suffix);hit37(oldScore===1000?1:1.04);clock37(2);
                    deferScores37();const old=a.finish();
                    while(!scoreWrites37.length)await new Promise(r=>setTimeout(r,0));
                    await fresh37('play','standard',false,suffix);hit37(newScore===1000?1:1.04);clock37(2);
                    const newer=a.finish();await Promise.resolve();const serialized=scoreWrites37.length===1;
                    if(reverse){slots37[1].resolve();slots37[0].resolve();}else{slots37[0].resolve();slots37[1].resolve();}
                    await Promise.all([old,newer]);a.store.put=put37;
                    const rows=(await a.store.all('scores')).filter(s=>s.songId==='qa37-'+suffix);
                    return serialized&&rows.length===1&&rows[0].score===1000&&a.lastReplay.result.score===newScore
                        &&a.lastResult.score===newScore&&a.scores.find(s=>s.id===rows[0].id).score===1000;
                }""", [old_score, new_score, reverse])
                ok(f'Overlapping {old_score}/{new_score} results, release order {"second-first" if reverse else "first-second"}: IndexedDB keeps 1000', result)

        result = p.evaluate("""async()=>{
            const a=PulseApp;await fresh37('play','standard',false,'abort');hit37(1.04);clock37(2);await a.finish();
            await fresh37('play','standard',false,'abort');hit37();clock37(2);
            a.store.put=function(store,row){
                if(store!=='scores')return put37.call(this,store,row);
                return new Promise((resolve,reject)=>{const tx=this.db.transaction('scores','readwrite');
                    tx.onabort=()=>reject(Error('QA37 intentional native score transaction abort'));
                    tx.oncomplete=()=>reject(Error('Expected native abort'));tx.objectStore('scores').put(row);tx.abort();});
            };
            try{await a.finish();}finally{a.store.put=put37;}
            const row=(await a.store.all('scores')).find(s=>s.songId==='qa37-abort');
            return row.score===750&&a.scores.find(s=>s.id===row.id).score===750&&a.lastReplay.result.score===1000
                &&PulseCore.simulateReplay(a.lastReplay).score===1000;
        }""")
        ok('A real IndexedDB abort preserves the old record and the new take replay', result)

        p.evaluate("""async()=>{
            const a=PulseApp;await fresh37('play','standard',false,'cancel-replay');hit37();
            window.libraryOwner37=a.song;window.chartsBefore37=JSON.stringify(a.song.charts);window.logBefore37=a.replayInputs;
            a.pendingReplay={format:'DIVA-PULSE-REPLAY',version:1,engine:PulseCore.VERSION,noFail:true,judgmentProfile:'accessible',
                chart:shortChart37('recorded-only',[{time:1,lane:0}], 'EXTREME'),inputs:[],endTime:2};
            window.videoReady37=false;a.prepareVideo=()=>new Promise(r=>{window.releaseVideo37=r;videoReady37=true;});
            window.pending37=a.startGame('replay');
        }""")
        p.wait_for_function('videoReady37')
        result = p.evaluate("""async()=>{
            const a=PulseApp;await a.showView('library');await a.selectSong(baseSong37.id);const selected=a.selectedChartId;
            releaseVideo37();const started=await pending37;a.prepareVideo=video37;
            return started===false&&a.view==='library'&&!a.audio.playing&&a.selectedChartId===selected
                &&JSON.stringify(libraryOwner37.charts)===chartsBefore37&&a.replayInputs===logBefore37
                &&!a.song.charts.some(c=>c.id==='recorded-only');
        }""")
        ok('An abandoned replay launch changes neither source library nor the previous input log', result)

        p.evaluate("""async()=>{
            const a=PulseApp;await fresh37('play','standard',false,'snapshot-replay');
            window.chartsBefore37=JSON.stringify(a.song.charts);
            a.pendingReplay={format:'DIVA-PULSE-REPLAY',version:1,engine:PulseCore.VERSION,noFail:true,judgmentProfile:'accessible',
                chart:shortChart37('recorded-only',[{time:1,lane:0}], 'EXTREME'),
                inputs:[{time:1,lane:0,down:true},{time:1.01,lane:0,down:false}],endTime:2};
            window.videoReady37=false;a.prepareVideo=()=>new Promise(r=>{window.releaseVideo37=r;videoReady37=true;});
            window.pending37=a.startGame('replay');
        }""")
        p.wait_for_function('videoReady37')
        result = p.evaluate("""async()=>{
            const a=PulseApp;a.pendingReplay={...a.pendingReplay,noFail:false,judgmentProfile:'precision',inputs:[]};
            releaseVideo37();await pending37;a.prepareVideo=video37;clock37(2);a.advanceReplay(2);
            return a.engine.profile==='accessible'&&a.engine.options.noFail&&a.engine.result().score===1000
                &&a.gameChart.id==='recorded-only'&&document.getElementById('gameDifficulty').textContent==='EXTREME'
                &&JSON.stringify(a.song.charts)===chartsBefore37;
        }""")
        ok('Prepared replay uses its captured chart, difficulty, profile, no-fail and inputs', result)

        result = p.evaluate("""async()=>{
            const a=PulseApp,c=shortChart37('hold-chord-chain',[
                {id:'hold',time:1,lane:0,type:'hold',duration:1},{id:'chord',time:1,lane:1},
                {id:'slide',time:1.2,lane:4,type:'slide'},{id:'chain',time:1.4,lane:4,type:'chain',duration:.3}]);
            await fresh37('play','accessible',false,'hold-chord-chain',c);
            for(const [t,lane,down]of [[1,0,true],[1,1,true],[1.02,1,false],[1.2,4,true],[1.5,4,false],[1.75,0,false]])input37(lane,t,down);
            clock37(2);a.engine.update(2);const completion=await a.finish();
            window.savedReplay37=JSON.stringify(completion.replay);window.recordsBeforeReplay37=JSON.stringify(await a.store.all('scores'));
            const simulated=PulseCore.simulateReplay(completion.replay);
            return completion.result.score===4170&&completion.result.holdBonus===170&&simulated.score===4170
                &&simulated.holdBonus===170&&completion.replay.version===1&&completion.replay.judgmentProfile==='accessible';
        }""")
        ok('A captured live HOLD/chord/chain replay matches the independent 4170-point oracle', result)
        p.locator('#watchReplay').click()
        p.wait_for_function('PulseApp.mode==="replay" && PulseApp.view==="game" && !PulseApp.busy')
        result = p.evaluate("""async()=>{
            const a=PulseApp;clock37(2);a.advanceReplay(2);const completion=await a.finish();
            return completion.result.score===4170&&completion.result.holdBonus===170
                &&JSON.stringify(await a.store.all('scores'))===recordsBeforeReplay37
                &&JSON.stringify(a.lastReplay)===savedReplay37&&document.querySelectorAll('.practice-summary').length===0;
        }""")
        ok('The actual Watch Replay button reproduces that score without replacing a record', result)
        p.wait_for_function('document.getElementById("toast").hidden')
        p.screenshot(path=str(Q / 'replay-result.png'), full_page=True)

        p.evaluate("""async()=>{
            const a=PulseApp;await fresh37('play','precision',false,'pause-hold',shortChart37('pause-hold',[{id:'h',time:1,lane:0,type:'hold',duration:2}]));
            input37(0,1,true);clock37(1.5);a.engine.update(1.5);
        }""")
        p.locator('#pauseButton').click()
        p.locator('#resumeGame').click()
        p.wait_for_function('!PulseApp.paused && PulseApp.audio.playing')
        result = p.evaluate("""async()=>{
            const a=PulseApp;clock37(3);a.engine.update(3);const completion=await a.finish();
            return completion.result.score===1100&&completion.result.holdBonus===100
                &&PulseCore.simulateReplay(completion.replay).score===1100
                &&completion.replay.inputs.some(e=>!e.down&&e.time===1.5);
        }""")
        ok('Actual pause/resume closes the HOLD and its replay at the same 1100-point result', result)

        p.evaluate("""async()=>{
            const a=PulseApp,lesson=PulseCore.LESSONS.find(l=>l.id==='pulse');
            await fresh37('practice','standard',false,'academy',PulseCore.academyChart(lesson),
                {from:2,to:30,rate:1,loop:false,preservePitch:false,countClicks:false,academy:lesson.id},32);
            clock37(30);a.engine.update(30,true);window.academyReady37=false;
            a.store.put=async function(store,row){if(row.id==='v5-state')await new Promise(r=>{window.releaseAcademy37=r;academyReady37=true;});return put37.call(this,store,row);};
            window.pending37=a.finish();
        }""")
        p.wait_for_function('academyReady37')
        result = p.evaluate("""async()=>{
            const a=PulseApp;await fresh37('play','precision',false,'after-academy');const engine=a.engine;
            const before=document.querySelectorAll('.academy-result').length;
            releaseAcademy37();const old=await pending37;a.store.put=put37;
            return old.mode==='practice'&&!old.current()&&a.engine===engine&&a.view==='game'&&a.audio.playing
                &&document.querySelectorAll('.academy-result').length===before
                &&(await a.store.get('settings','v5-state')).academy.pulse.completed===true;
        }""")
        ok('A delayed academy commit preserves the medal and cannot take over a newer live', result)

        expected = p.evaluate("""async()=>{
            const a=PulseApp;await a.showView('library');
            return {records:(await a.store.all('scores')).map(s=>({id:s.id,score:s.score,profile:s.judgmentProfile})),
                sessions:(await a.store.get('settings','v3-state')).sessions.map(s=>({songId:s.songId,mode:s.mode,profile:s.judgmentProfile,score:s.score}))};
        }""")
        p.reload(wait_until='domcontentloaded')
        p.wait_for_function('window.PulseApp && document.documentElement.dataset.live34Ready === "true" && !PulseApp.busy')
        result = p.evaluate("""async(expected)=>{
            const a=PulseApp,records=(await a.store.all('scores')).map(s=>({id:s.id,score:s.score,profile:s.judgmentProfile}));
            const sessions=(await a.store.get('settings','v3-state')).sessions.map(s=>({songId:s.songId,mode:s.mode,profile:s.judgmentProfile,score:s.score}));
            return JSON.stringify(records)===JSON.stringify(expected.records)&&JSON.stringify(sessions)===JSON.stringify(expected.sessions)
                &&(await a.store.get('settings','v5-state')).academy.pulse.completed===true;
        }""", expected)
        ok('Records, take categories and the academy result survive a real reload', result)
        ok('No uncaught browser or rendering errors in record/replay scenarios', not errors)
        browser.close()
except Exception as exc:
    failure = str(exc)
    print(traceback.format_exc(), flush=True)
finally:
    server.shutdown()
    server.server_close()

unchanged = hashlib.sha256((R / 'index.html').read_bytes()).hexdigest() == build_hash
if not unchanged and not failure:
    failure = 'Build changed during browser validation'
(Q / 'results.json').write_text(json.dumps({
    'version': (R / 'VERSION.txt').read_text().strip(), 'buildSha256': build_hash,
    'passed': sum(c['passed'] for c in checks), 'failed': sum(not c['passed'] for c in checks),
    'failure': failure, 'errors': errors, 'checks': checks, 'buildUnchanged': unchanged,
    'errorDetails': error_details, 'httpErrors': http_errors,
    'nativeHTTP': True, 'nativeIndexedDB': True, 'nativeWebAudio': True,
    'scope': 'Production methods and controls on native HTTP/IndexedDB/Web Audio; original silent test buffers, controlled timestamps, injected visibility/blur, deferred promises and one intentional native transaction abort. No historical-replay, physical-latency or multi-window concurrency certification.'
}, ensure_ascii=False, indent=2) + '\n')
if failure:
    raise SystemExit(1)
