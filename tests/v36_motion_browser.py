"""UX-05: reduced camera/decor motion and saved preferences on native HTTP.

Actual WebGL uniform submissions, IndexedDB and the application handlers are used.
System media preferences are emulated. The small PMX is an original test fixture;
this does not qualify imported videos, complete MMD animation or physical devices.
"""
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import hashlib
import json
import os
import subprocess
import threading
import traceback
from playwright.sync_api import sync_playwright

R = Path(__file__).resolve().parents[1]
Q = Path(os.getenv('PULSE_QA_DIR', str(R / 'qa/v36/motion')))
Q.mkdir(parents=True, exist_ok=True)
build_hash = hashlib.sha256((R / 'index.html').read_bytes()).hexdigest()
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
    fixture = subprocess.check_output(
        ['node', '-e', "process.stdout.write(require('./tests/v23-fixtures.cjs').pmx(3).toString('base64'))"],
        cwd=R, text=True)
    with sync_playwright() as w:
        browser = w.chromium.launch(
            executable_path=os.getenv('CHROMIUM_PATH', '/usr/bin/chromium'), headless=True,
            args=['--no-sandbox', '--disable-dev-shm-usage', '--no-proxy-server',
                  '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
                  '--autoplay-policy=no-user-gesture-required'])
        p = browser.new_page(viewport={'width': 1280, 'height': 900}, reduced_motion='no-preference')
        p.set_default_timeout(30000)
        p.on('pageerror', lambda e: errors.append(str(e)))
        p.goto(f'http://127.0.0.1:{server.server_port}/', wait_until='domcontentloaded')
        p.wait_for_function('window.PulseApp && document.documentElement.dataset.live34Ready === "true" && !PulseApp.busy')
        ok('HTTP boot uses native IndexedDB and WebGL2', p.evaluate('PulseApp.store.persistent && PulseApp.stage.available && PulseApp.stage.gl instanceof WebGL2RenderingContext'))
        p.evaluate('''async()=>{const a=PulseApp;a.settings.reduceMotion=false;await a.store.put('settings',a.settings);a.applySettings();await a.showView('settings');}''')
        p.locator('#reduceMotion').check()
        p.wait_for_function('PulseApp.settings.reduceMotion && !document.getElementById("reduceMotion").disabled')
        ok('User motion option commits through the actual checkbox handler', p.evaluate('async()=>PulseApp.stage.reduceMotion && document.documentElement.dataset.reducedMotion==="true" && (await PulseApp.store.get("settings","preferences")).reduceMotion===true'))
        ok('User motion option stops CSS transitions and spinner without hiding status text', p.evaluate('''()=>getComputedStyle(document.getElementById('playButton')).transitionDuration==='0s' && getComputedStyle(document.querySelector('.stage-window')).transitionDuration==='0s' && getComputedStyle(document.querySelector('.spinner')).animationName==='none' && !!document.getElementById('motionPreference33').textContent'''))
        p.reload(wait_until='domcontentloaded')
        p.wait_for_function('window.PulseApp && document.documentElement.dataset.live34Ready === "true" && !PulseApp.busy')
        ok('User option survives a real page reload', p.evaluate('PulseApp.settings.reduceMotion===true && PulseApp.stage.reduceMotion===true && document.documentElement.dataset.reducedMotion==="true"'))
        p.evaluate('PulseApp.showView("settings")')
        p.locator('#reduceMotion').uncheck()
        p.wait_for_function('PulseApp.settings.reduceMotion===false && !document.getElementById("reduceMotion").disabled')
        p.evaluate('''()=>{const a=PulseApp;window.savedSettings36=JSON.stringify(a.settings);window.put36=a.store.put;a.store.put=async function(store,row){if(store==='settings'&&row.id==='preferences')throw Error('QA36 preference refusal');return put36.call(this,store,row);};}''')
        p.locator('#reduceMotion').click()
        p.wait_for_function('!document.getElementById("reduceMotion").disabled')
        ok('A refused preference write restores the checkbox, runtime and stored preference', p.evaluate('''async()=>{const a=PulseApp;return JSON.stringify(a.settings)===savedSettings36 && !document.getElementById('reduceMotion').checked && !a.stage.reduceMotion && (await a.store.get('settings','preferences')).reduceMotion===false;}'''))
        p.evaluate('PulseApp.store.put=put36;void 0;')
        p.emulate_media(reduced_motion='reduce')
        p.wait_for_function('document.documentElement.dataset.reducedMotion==="true" && PulseApp.stage.reduceMotion')
        ok('System preference reaches rendering and CSS without overwriting the user option', p.evaluate('''async()=>PulseApp.settings.reduceMotion===false && (await PulseApp.store.get('settings','preferences')).reduceMotion===false && getComputedStyle(document.querySelector('.spinner')).animationName==='none' '''))
        fallback = p.evaluate('''()=>{
            const a=PulseApp,probe=Object.create(a),cv=document.createElement('canvas');
            probe.view='library';probe.song={...a.song,scene:{...a.song.scene,autoShow:null}};cv.getContext('2d',{willReadFrequently:true});
            cv.style.cssText='position:fixed;left:-2000px;top:0;width:960px;height:540px';document.body.append(cv);
            try{a.drawFallback.call(probe,cv,1100);const first=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;a.drawFallback.call(probe,cv,3700);const next=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;let changed=0,maxDifference=0;for(let i=0;i<first.length;i++){const delta=Math.abs(first[i]-next[i]);if(delta)changed++;maxDifference=Math.max(maxDifference,delta);}return {same:changed===0,changed,maxDifference,reduced:a.isMotionReduced(),width:cv.width,height:cv.height};}finally{cv.remove();}
        }''')
        print('Canvas probe '+json.dumps(fallback),flush=True)
        ok('Actual Canvas fallback decor respects the system preference', fallback['same'])

        p.evaluate('PulseApp.showView("library")')
        matrices = p.evaluate('''async(encoded)=>{
            const a=PulseApp,s=a.stage,D=PulseDirector,G=PulseStage.math;
            const original={custom:s.custom,director:s.director,plan:s.autoShowPlan,events:s.events,preview:s.directorPreview};
            const beforeCharts=JSON.stringify(a.song.charts),beforeScores=JSON.stringify(a.scores);
            const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));
            const loaded=await s.loadMMD(bytes.buffer,[],null,[],'UX36 original strip',true),model=loaded.model;
            const cfg=D.normalizeDirector({duration:20,count:1,cameraTrack:[
                {time:0,yaw:0,pitch:10,distance:8,fov:35},{time:10,yaw:90,pitch:30,distance:4,fov:80}],
                lightTrack:[{time:0,intensity:.6,color:[.7,.8,1]},{time:10,intensity:2.4,color:[1,.2,.3]}]});
            model.directorTransform={scale:1};
            model.directorClips=[{start:0,end:20,rate:1,motionStart:0,transition:0,loop:false,camera:false,
                motion:{boneTracks:new Map(),morphTracks:new Map(),cameraTracks:[]}}];
            model.cameraTracks=[{frame:0,pos:[0,1.6,0],rot:[0,0,0],distance:8,fov:35},
                {frame:300,pos:[2,2,0],rot:[.4,1.2,0],distance:4,fov:80}];delete model._maxFrame;
            const plan=PulseAutoShow.generate(a.song),before=JSON.stringify({cfg,plan,cameraTracks:model.cameraTracks});
            const near=(x,y)=>x.length===y.length&&x.every((v,i)=>Math.abs(v-y[i])<.0001);
            const equal=(x,y)=>near(x.view,y.view)&&near(x.projection,y.projection);
            const capture=time=>{
                const gl=s.gl,submit=gl.uniformMatrix4fv;let currentModel,view,projection;
                gl.uniformMatrix4fv=function(location,transpose,value){
                    submit.call(this,location,transpose,value);
                    if(location===s.u.View)view=Array.from(gl.getUniform(s.program,s.u.View));
                    if(location===s.u.Model)currentModel=Array.from(value);
                    if(location===s.u.MVP&&!projection&&currentModel&&view){
                        const actual=gl.getUniform(s.program,s.u.MVP);
                        projection=Array.from(G.mul(G.mul(actual,G.inv(currentModel)),G.inv(view)));
                    }
                };
                try{s.render(time,120,{menu:false,pv:true,energy:time ? .9 : .1});}
                finally{gl.uniformMatrix4fv=submit;}
                if(!view||!projection)throw Error('No actual WebGL view/projection submission observed');
                return {view,projection,particle:s.particles.map(p=>[...p.p]),bars:s.bars.map(b=>[...b.s]),
                    light:gl.getUniform(s.program,s.u.LightIntensity),activeCamera:s.director?.activeCamera||model.activeCamera};
            };
            const out={};
            try{
                s.reduceMotion=true;s.autoShowPlan=null;s.director=null;s.custom=null;
                s.events=[{time:0,camera:'front'},{time:4,camera:'close'},{time:8,camera:'high'}];
                out.builtin=equal(capture(0),capture(9));s.events=[];
                s.director={models:[model],config:cfg};const first=capture(0),last=capture(9);
                out.director=equal(first,last);out.activeTrackStillEvaluates=!near(first.activeCamera.eye,last.activeCamera.eye);
                out.decor=JSON.stringify(first.particle)===JSON.stringify(last.particle)&&JSON.stringify(first.bars)===JSON.stringify(last.bars)&&first.light===last.light;
                s.directorPreview=0;const preview0=capture(0);s.directorPreview=9;out.preview=equal(preview0,capture(9));delete s.directorPreview;
                s.director=null;s.custom=model;model.useCamera=true;model.loop=false;
                out.vmd=equal(capture(0),capture(9));
                s.custom=null;s.autoShowPlan=plan;out.autoshow=equal(capture(0),capture(9));
                s.director={models:[model],config:cfg};plan.overrides.camera=true;
                out.manualOverride=equal(capture(0),capture(9));plan.overrides.camera=false;
                s.autoShowPlan=null;s.reduceMotion=false;out.normalReturns=!equal(capture(0),capture(9));
                s.reduceMotion=true;out.backwardSeek=equal(capture(9),capture(2));
                out.sourcesUnchanged=before===JSON.stringify({cfg,plan,cameraTracks:model.cameraTracks})&&beforeCharts===JSON.stringify(a.song.charts)&&beforeScores===JSON.stringify(a.scores);
            }finally{
                s.custom=null;s.director=null;s._disposeCustom(model);s.custom=original.custom;s.director=original.director;s.autoShowPlan=original.plan;s.events=original.events;
                if(original.preview===undefined)delete s.directorPreview;else s.directorPreview=original.preview;
                a.applySettings();await a.applyScene();
            }
            return out;
        }''', fixture)
        for key, name in [
            ('builtin','Builtin cuts keep actual WebGL view and projection fixed'),
            ('director','Director camera keeps actual WebGL view and projection fixed'),
            ('activeTrackStillEvaluates','Authored Director camera still evaluates without driving the calm view'),
            ('decor','Actual scene particles, bars and lighting stay still'),
            ('preview','Director preview uses the same calm camera policy'),
            ('vmd','VMD camera on the original PMX fixture cannot override the calm view'),
            ('autoshow','Auto Show camera stays calm'),
            ('manualOverride','Auto Show manual camera override remains calm without editing its keys'),
            ('normalReturns','Disabling calm mode restores authored camera movement'),
            ('backwardSeek','Seeking backwards preserves the calm view'),
            ('sourcesUnchanged','Camera checks preserve charts, records and authored camera data')]:
            ok(name, matrices[key])

        hud = p.evaluate('''async()=>{
            const a=PulseApp;await a.startGame('practice',{from:0,to:8,rate:1,loop:false,countClicks:false});a.audio.pause();a.audio.pausedAt=1.5;
            a.gameChart=PulseCore.validateChart({id:'ux36-hold',title:'Information oracle',notes:[{id:'h',time:1,lane:0,type:'hold',duration:2,x:.5,y:.5}]});
            a.engine=new PulseCore.JudgeEngine(a.gameChart);a.engine.press(0,1);a.engine.update(1.5);
            a.settings.vfxIntensity=0;a.settings.reducedEffects=true;a.settings.holdGauge=true;a.settings.hitSound=false;a.applySettings();a.paused=false;
            window.result36=JSON.stringify(a.engine.result());window.inputs36=JSON.stringify(a.replayInputs);window.chart36=JSON.stringify(a.gameChart);
            // Observe the first ready frame here: COOL lasts 520 ms, whereas
            // score and HOLD stay visible on this frozen musical clock.
            return await new Promise(resolve=>{
                let frame,timer;
                const snapshot=ts=>({
                    score:document.getElementById('gameScore').textContent,
                    accuracy:document.getElementById('gameAccuracy').textContent,
                    judgment:document.getElementById('judgment').textContent,
                    hold:document.getElementById('holdMeter34').textContent,
                    holdHidden:document.getElementById('holdMeter34').hidden,
                    lifeWidth:parseFloat(document.getElementById('lifeFill').style.width),
                    judgmentAgeMs:a.lastJudgment?performance.now()-a.lastJudgment.when:null,
                    judgmentFrameAgeMs:a.lastJudgment&&Number.isFinite(ts)?ts-a.lastJudgment.when:null
                });
                const finish=value=>{cancelAnimationFrame(frame);clearTimeout(timer);resolve(value);};
                const observe=ts=>{
                    const value=snapshot(ts);
                    if(value.score==='00001100'&&!value.holdHidden)finish(value);
                    else frame=requestAnimationFrame(observe);
                };
                timer=setTimeout(()=>finish(snapshot()),30000);
                frame=requestAnimationFrame(observe);
            });
        }''')
        print('HUD snapshot '+json.dumps(hud, ensure_ascii=False), flush=True)
        ok('Calm mode keeps score, accuracy, judgment and HOLD information visible with VFX disabled',
           hud['score']=='00001100' and not hud['holdHidden'] and hud['accuracy']=='100.00%'
           and 'COOL' in hud['judgment'] and 'HOLD' in hud['hold'] and hud['lifeWidth']>0)
        p.emulate_media(reduced_motion='no-preference')
        p.wait_for_function('document.documentElement.dataset.reducedMotion==="false"')
        p.emulate_media(reduced_motion='reduce')
        p.wait_for_function('document.documentElement.dataset.reducedMotion==="true"')
        ok('Changing system motion during a frozen-clock HOLD preserves score, replay and chart', p.evaluate('JSON.stringify(PulseApp.engine.result())===result36 && JSON.stringify(PulseApp.replayInputs)===inputs36 && JSON.stringify(PulseApp.gameChart)===chart36'))
        p.set_viewport_size({'width':390,'height':844})
        ok('Essential HOLD gauge remains within the narrow viewport', p.evaluate('''()=>{const r=document.getElementById('holdMeter34').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1;}'''))
        p.evaluate('PulseApp.showView("library")')
        ok('No uncaught browser errors in motion scenarios', not errors)
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
    'nativeHTTP': True, 'nativeIndexedDB': True, 'nativeWebGL': True,
    'scope': 'Actual WebGL uniform submissions, Canvas, HTTP and IndexedDB; system preference is emulated. Original PMX diagnostic fixture, software GPU, no physical-device, imported-video or complete MMD-animation certification.'
}, ensure_ascii=False, indent=2) + '\n')
if failure:
    raise SystemExit(1)
