"""Audio -> dynamic skeleton -> pause -> full PV/Autoplay regression on shipped HTML."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import hashlib,json,traceback
R=Path(__file__).resolve().parents[1];Q=R/'qa/v27/playback';Q.mkdir(parents=True,exist_ok=True);html=(R/'index.html').read_text();checks=[];errors=[];failure=None

def ok(name,v=True):
 checks.append({'name':name,'passed':bool(v)});print(('PASS ' if v else 'FAIL ')+name,flush=True)
 if not v:raise AssertionError(name)
try:
 with sync_playwright() as w:
  b=w.chromium.launch(executable_path='/usr/bin/chromium',headless=False,args=['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']);p=b.new_page(viewport={'width':800,'height':520});p.on('pageerror',lambda e:errors.append(str(e)));p.set_default_timeout(25000)
  p.set_content(html);p.wait_for_function('document.documentElement.dataset.v27Ready==="true"');p.wait_for_function('!PulseApp.busy');p.locator('#audioInput').set_input_files(str(R/'examples/v19/TRIPLE_PULSE.wav'));p.wait_for_function('!PulseApp.busy&&PulseApp.song.duration<10')
  p.evaluate('PulseApp.showView("wardrobe");document.getElementById("mmdPanel").open=true');p.locator('#mmdInput').set_input_files([str(R/'examples/v27/PENDULE.pmx'),str(R/'examples/v27/ANCRAGE.vmd')]);p.wait_for_selector('#miCommit');p.locator('#miCommit').click();p.wait_for_function('!PulseApp.busy&&PulseApp.stage.director?.models.length===1')
  p.evaluate('window.charts27=JSON.stringify(PulseApp.song.charts)');p.locator('#physicsOpen27').click();p.locator('#physicsEnabled27').check();p.locator('#physicsSave27').click();p.wait_for_function('!PulseApp.busy&&!document.getElementById("modal").open')
  p.evaluate('PulseApp.showView("library")');p.locator('#pvButton').click();p.wait_for_function('PulseApp.view==="game"&&PulseApp.audio.time>.7&&PulseApp.stage.director.models[0].secondaryWorld?.stats.steps>20')
  ok('Actual PV starts audio and the physics world',p.evaluate('PulseApp.audio.playing&&PulseApp.stage.secondarySettings.enabled'))
  motion_sample=p.wait_for_function('()=>{const m=PulseApp.stage.director.models[0],q=m?.bones[1].q[2];return PulseApp.view==="game"&&Math.abs(q)>.02?{q,time:PulseApp.audio.time,steps:m.secondaryWorld?.stats.steps,resets:m.secondaryWorld?.stats.resets}:false}',timeout=15000).json_value()
  ok('PV mesh receives a nonzero simulated bone rotation in an observed frame',abs(motion_sample['q'])>.02)
  (Q/'motion-sample.json').write_text(json.dumps(motion_sample,indent=2))
  p.locator('#pauseButton').click();p.wait_for_function('PulseApp.paused&&Math.abs(PulseApp.stage.director.models[0].secondaryWorld.inputTime-Math.max(0,PulseApp.audio.time))<1e-6');p.evaluate('window.t27=PulseApp.audio.time;window.stepsPV27=PulseApp.stage.director.models[0].secondaryWorld.stats.steps;window.posePV27=JSON.stringify(PulseApp.stage.director.models[0].bones.map(b=>[b.p,b.q]))');p.wait_for_timeout(300)
  ok('Game pause holds audio time and physical steps',p.evaluate('PulseApp.paused&&PulseApp.audio.time===t27&&PulseApp.stage.director.models[0].secondaryWorld.stats.steps===stepsPV27'))
  ok('Paused PV skeleton remains unchanged',p.evaluate('JSON.stringify(PulseApp.stage.director.models[0].bones.map(b=>[b.p,b.q]))===posePV27'))
  p.evaluate('PulseApp.resume()');p.wait_for_function('PulseApp.audio.time>t27+.3');ok('Resume advances same song transport',p.evaluate('!PulseApp.paused&&PulseApp.audio.playing'))
  p.screenshot(path=str(Q/'pv-dynamics.png'));p.wait_for_function('PulseApp.view==="library"',timeout=25000)
  ok('Full PV reaches song end without a score',p.evaluate('PulseApp.mode==="pv"&&PulseApp.audio.time>=PulseApp.song.duration'))
  ok('PV leaves charts byte-identical',p.evaluate('JSON.stringify(PulseApp.song.charts)===charts27'))
  p.locator('#autoButton').click();p.wait_for_function('PulseApp.view==="results"',timeout=25000)
  ok('Complete Autoplay with dynamics reaches 100 percent',p.evaluate('PulseApp.lastResult.accuracy===100'))
  ok('Autoplay does not change charts or turn physics off',p.evaluate('JSON.stringify(PulseApp.song.charts)===charts27&&PulseApp.song.scene.secondaryPhysics27.enabled'))
  p.evaluate('PulseApp.showView("wardrobe");document.getElementById("mmdPanel").open=true');p.locator('#physicsOpen27').click();p.locator('#physicsPlay27').click();p.wait_for_function('PulseApp.stage.director.models[0].secondaryWorld?.stats.steps>10')
  p.evaluate('window.faultCount27=0;PulseApp.stage.director.models[0].secondaryWorld.update=()=>{faultCount27++;throw Error("QA27 forced solver fault")};void 0;');p.wait_for_function('!!PulseApp.stage.director.models[0].secondaryError');p.wait_for_timeout(300)
  ok('Physics fault is isolated and latched instead of retrying each frame',p.evaluate('faultCount27===1&&!PulseApp.stage.director.models[0].secondaryWorld&&!PulseApp.frameError'))
  ok('Physics fault is visible in diagnostic panel','QA27 forced solver fault' in p.locator('#physicsLive27').inner_text())
  p.locator('#physicsReset27').click();p.wait_for_function('!PulseApp.stage.director.models[0].secondaryError&&PulseApp.stage.director.models[0].secondaryWorld?.stats.steps>5')
  ok('Explicit reset recovers without reimporting the model',p.evaluate('!PulseApp.stage.director.models[0].secondaryError'))
  ok('No unhandled JavaScript exception',not errors);ok('No application frame failure',p.evaluate('!PulseApp.frameError'))
  b.close()
except Exception as e:failure=str(e);print(traceback.format_exc(),flush=True)
(Q/'browser-final.json').write_text(json.dumps({'version':'27.0.0','buildSha256':hashlib.sha256(html.encode()).hexdigest(),'passed':sum(c['passed'] for c in checks),'failed':sum(not c['passed'] for c in checks),'checks':checks,'failure':failure,'errors':errors,'scope':'Opaque temporary document; SwiftShader; actual decoded original 8-second audio and original PMX. Playback window 800x520: larger software-rendered viewport previously triggered conservative slow-frame resets.'},indent=2,ensure_ascii=False))
if failure:raise SystemExit(1)
