"""V33 feedback/gameplay contracts. Native HTTP by default; explicit document
mode for restricted test environments. No physical acoustic/device certification.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
import threading,json,hashlib,os,traceback
R=Path(__file__).resolve().parents[1];Q=R/'qa/v34/feedback';Q.mkdir(parents=True,exist_ok=True)
checks=[];errors=[];failure=None;version=(R/'VERSION.txt').read_text().strip();mode='injected' if os.getenv('PULSE_DOCUMENT_MODE')=='1' else 'http'
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(R)));threading.Thread(target=server.serve_forever,daemon=True).start()
def ok(name,value):
 checks.append({'name':name,'passed':bool(value)});print(('PASS ' if value else 'FAIL ')+name,flush=True)
 if not value:raise AssertionError(name)
def idle():p.wait_for_function('!PulseApp.busy',timeout=90000)
try:
 with sync_playwright() as w:
  b=w.chromium.launch(executable_path=os.getenv('CHROMIUM_PATH','/usr/bin/chromium'),headless=False,args=['--no-sandbox','--disable-dev-shm-usage','--no-proxy-server','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required'])
  p=b.new_page(viewport={'width':1280,'height':900});p.set_default_timeout(20000);p.on('pageerror',lambda e:errors.append(str(e)))
  if mode=='injected':p.set_content((R/'index.html').read_text())
  else:p.goto(f'http://127.0.0.1:{server.server_port}/',wait_until='domcontentloaded')
  p.wait_for_function('document.documentElement.dataset.v28Ready==="true"');idle()
  ok('V33 release and cosmetic module installed',p.evaluate('PulseCore.VERSION')==version and p.evaluate('document.documentElement.dataset.feedback33Ready==="true"'))
  ok('HTTP mode uses real IndexedDB, document mode explicitly temporary',p.evaluate('PulseApp.store.persistent') if mode=='http' else not p.evaluate('PulseApp.store.persistent'))
  # Freeze only the transport clock, not the running AudioContext or game frame.
  # Two real autoplay notes isolate this assertion from runner/rendering speed.
  p.evaluate('''async()=>{const a=PulseApp;a.settings.hitSound=false;a.applySettings();await a.startGame('autoplay');a.audio.pause();a.audio.pausedAt=0;
    a.gameChart=PulseCore.validateChart({title:'Sound probe',bpm:120,notes:[{id:'mute-probe',time:1,lane:0,type:'tap',x:.4,y:.5},{id:'single-probe',time:2,lane:2,type:'tap',x:.5,y:.4}]});
    a.engine=new PulseCore.JudgeEngine(a.gameChart,{noFail:true});a.feedback33.sounds.stop();a.feedback33.effects.clear();window.oldSfx33=a.audio.sfx;window.legacySfx33=0;a.audio.sfx=()=>legacySfx33++;window.audioBaseline33=a.feedback33.sounds.stats.played;a.audio.pausedAt=1;}''')
  p.wait_for_function('PulseApp.engine.processed===1')
  ok('Autoplay respects disabled hit sound on both audio paths',p.evaluate('legacySfx33===0&&PulseApp.feedback33.sounds.stats.played===audioBaseline33'))
  p.evaluate('''const a=PulseApp;a.settings.hitSound=true;a.applySettings();a.audio.pausedAt=2;''')
  p.wait_for_function('PulseApp.engine.processed===2')
  ok('A judged note creates one procedural sound, not a double trigger',p.evaluate('PulseApp.feedback33.sounds.stats.played===audioBaseline33+1&&legacySfx33===0'))
  p.evaluate('PulseApp.audio.sfx=oldSfx33;PulseApp.pause()')
  ok('Pause stops active feedback voices and clears transient effects',p.evaluate('PulseApp.feedback33.sounds.voices.size===0&&PulseApp.feedback33.effects.items.length===0'))
  p.evaluate('PulseApp.pressSource("touch-paused",0,performance.now())')
  ok('Paused input cannot arm a stuck gameplay source',p.evaluate('PulseApp.heldSources.size===0'))
  result=p.evaluate('''async()=>{const a=PulseApp,init=a.audio.init.bind(a.audio);let release;a.audio.init=()=>new Promise(r=>release=r);const pending=a.resume();await new Promise(r=>setTimeout(r,0));await a.showView('library');release(a.audio.ctx);await pending;a.audio.init=init;return !a.audio.playing&&a.view==='library';}''')
  ok('Delayed resume after leaving the song cannot restart hidden audio',result)
  p.evaluate('''async()=>{const a=PulseApp;await a.startGame('practice',{from:0,to:10,rate:1,loop:false});a.audio.pause();a.audio.pausedAt=1;a.engine=new PulseCore.JudgeEngine({title:'Input probe',bpm:120,notes:[{id:'h',time:1,lane:0,type:'hold',duration:2,x:.5,y:.5}]},{noFail:true});a.pressSource('touch-41',0);a.pressSource('key-KeyD',0);}''')
  p.locator('[data-lane="0"]').evaluate('(el)=>el.dispatchEvent(new PointerEvent("lostpointercapture",{pointerId:41,bubbles:true}))')
  ok('Lost touch capture releases only its own source',p.evaluate('!PulseApp.heldSources.has("touch-41")&&PulseApp.heldSources.has("key-KeyD")&&PulseApp.engine.held.has(0)'))
  p.evaluate('PulseApp.releaseSource("key-KeyD")')
  ok('Last device release ends the hold without a duplicate judgment',p.evaluate('PulseApp.heldSources.size===0&&PulseApp.engine.held.size===0&&PulseApp.engine.processed===1'))
  p.evaluate('''const a=PulseApp;window.scoresBefore33=JSON.stringify(a.engine.result());window.chartsBefore33=JSON.stringify(a.song.charts);for(let i=0;i<1000;i++)a.consumeFeedback33({rating:'COOL',note:{lane:i%6,type:'tap',x:.3,y:.3}},performance.now());''')
  ok('Native Web Audio and VFX remain bounded under 1000 feedback events',p.evaluate('PulseApp.feedback33.sounds.voices.size<=12&&PulseApp.feedback33.effects.items.length<=48&&PulseApp.feedback33.sounds.stats.dropped>0'))
  ok('Effects do not mutate result, replay log or charts',p.evaluate('JSON.stringify(PulseApp.engine.result())===scoresBefore33&&JSON.stringify(PulseApp.song.charts)===chartsBefore33'))
  p.evaluate('PulseApp.settings.sfxVolume=0;PulseApp.applySettings()')
  ok('Live zero-volume setting stops feedback voices immediately',p.evaluate('PulseApp.feedback33.sounds.voices.size===0&&!PulseApp.feedback33.sounds.play({rating:"COOL"},PulseApp.settings)'))
  p.evaluate('''window.drawProbe33=()=>{const a=PulseApp;let lines=0,arcs=0;const ctx={save(){},restore(){},beginPath(){},stroke(){},moveTo(){},lineTo(){lines++},arc(){arcs++}};a.feedback33.effects.clear();a.feedback33.effects.push({rating:'COOL',note:{lane:0,x:.5,y:.5}},100);a.drawFeedback33(ctx,{x:0,y:0,width:100,height:100},15,120,1);return {lines,arcs};};PulseApp.settings.reducedEffects=false;PulseApp.settings.reduceMotion=false;PulseApp.settings.graphicsQuality=1.5;PulseApp.settings.vfxIntensity=.7;''')
  ok('COOL success draws halo and bounded spark rays',p.evaluate('drawProbe33().lines===8&&drawProbe33().arcs===1'))
  p.emulate_media(reduced_motion='reduce');p.wait_for_function('matchMedia("(prefers-reduced-motion: reduce)").matches && PulseApp.stage.reduceMotion===true',timeout=5000)
  ok('System reduced-motion disables particles and stage movement',p.evaluate('PulseApp.stage.reduceMotion===true&&drawProbe33().lines===0&&drawProbe33().arcs===1'))
  p.emulate_media(reduced_motion='no-preference');p.evaluate('PulseApp.settings.reduceMotion=true;PulseApp.applySettings()')
  ok('In-game reduced-motion also uses a stationary ring',p.evaluate('drawProbe33().lines===0&&drawProbe33().arcs===1'))
  p.evaluate('PulseApp.settings.reducedEffects=true;PulseApp.applySettings()')
  ok('Reduced-effects option removes extra visuals but leaves judgments intact',p.evaluate('drawProbe33().arcs===0&&JSON.stringify(PulseApp.engine.result())===scoresBefore33'))
  pcm=p.evaluate('''async()=>{const F=PulseFeedback33,ctx=new OfflineAudioContext(1,9600,48000),data=F.pcm(F.soundSpec({rating:'COOL',note:{lane:0}},'pulse'),48000),buffer=ctx.createBuffer(1,data.length,48000);buffer.copyToChannel(data,0);const src=ctx.createBufferSource();src.buffer=buffer;src.connect(ctx.destination);src.start();const out=(await ctx.startRendering()).getChannelData(0);return {finite:out.every(Number.isFinite),peak:Math.max(...out.map(Math.abs)),tail:Math.max(...out.slice(-100).map(Math.abs))};}''')
  ok('Actual offline audio render has a finite signal and silent tail',pcm['finite'] and .01<pcm['peak']<=1 and pcm['tail']==0)
  p.evaluate('''async()=>{const a=PulseApp;a.settings.reducedEffects=false;a.settings.reduceMotion=false;a.settings.sfxVolume=.18;a.applySettings();await a.showView('settings');}''');p.locator('#feedbackSettings33').scroll_into_view_if_needed()
  p.locator('#sfxStyle').select_option('soft');idle()
  ok('New sound preference persists through the real settings handler',p.evaluate('async()=>PulseApp.settings.sfxStyle==="soft"&&(await PulseApp.store.get("settings","preferences")).sfxStyle==="soft"'))
  p.evaluate('''window.put33=PulseApp.store.put;PulseApp.store.put=async function(store,row){if(store==='settings'&&row.id==='preferences')throw Error('QA33 save refusal');return put33.call(this,store,row)};void 0;''')
  p.locator('#sfxStyle').select_option('arcade');idle()
  ok('Refused preference save preserves the saved option and resets the control',p.evaluate('PulseApp.settings.sfxStyle==="soft"&&document.getElementById("sfxStyle").value==="soft"'))
  p.evaluate('PulseApp.store.put=put33;void 0;');p.set_viewport_size({'width':390,'height':844});p.locator('#feedbackSettings33').scroll_into_view_if_needed()
  ok('Feedback settings fit a narrow viewport without clipped controls',p.evaluate('(()=>{const r=document.getElementById("feedbackSettings33").getBoundingClientRect();return r.left>=-1&&r.right<=innerWidth+1})()'))
  p.screenshot(path=str(Q/'settings-mobile.png'),animations='disabled');p.set_viewport_size({'width':1280,'height':900})
  p.evaluate('''async()=>{const a=PulseApp;await a.startGame('practice',{from:0,to:10,rate:1,loop:false});a.audio.pause();a.audio.pausedAt=2;a.settings.hitSound=false;a.settings.reduceMotion=false;a.settings.reducedEffects=false;a.applySettings();a.feedback33.effects.clear();for(let lane=0;lane<6;lane++)a.consumeFeedback33({rating:lane===4?'MISS':lane===5?'FINE':'COOL',note:{lane,x:.18+lane*.125,y:.5,type:lane>3?'slide':'tap'}},performance.now());}''')
  p.screenshot(path=str(Q/'gameplay-impacts.png'),animations='disabled')
  p.evaluate('window.dispatchEvent(new Event("blur"))')
  ok('Losing focus pauses play and clears all inputs and sounds',p.evaluate('PulseApp.paused&&!PulseApp.audio.playing&&PulseApp.heldSources.size===0&&PulseApp.feedback33.sounds.voices.size===0'))
  ok('No unhandled JavaScript error in the full V33 flow',not errors);b.close()
except Exception as e:failure=str(e);print(traceback.format_exc(),flush=True)
finally:server.shutdown();server.server_close()
(Q/'results.json').write_text(json.dumps({'version':version,'buildSha256':hashlib.sha256((R/'index.html').read_bytes()).hexdigest(),'passed':sum(x['passed'] for x in checks),'failed':sum(not x['passed'] for x in checks),'failure':failure,'checks':checks,'errors':errors,'mode':mode,'scope':'Chromium software GPU; actual Web Audio. '+('Injected document and temporary storage; not native persistence.' if mode=='injected' else 'HTTP and native IndexedDB.')+' No physical device or acoustic latency certification.'},ensure_ascii=False,indent=2))
if failure:raise SystemExit(1)
