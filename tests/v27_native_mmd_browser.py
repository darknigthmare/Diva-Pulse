from pathlib import Path
from playwright.sync_api import sync_playwright
import base64, os, json, hashlib
R=Path(__file__).resolve().parents[1];Q=R/'qa/v27/native-mmd';Q.mkdir(parents=True,exist_ok=True)
HTML=(R/'DIVA_PULSE_JOUER.html').read_text();BUILD_SHA=hashlib.sha256(HTML.encode()).hexdigest()
pmx=base64.b64encode((R/'tests/assets/minimal.pmx').read_bytes()).decode();vmd=base64.b64encode((R/'tests/assets/minimal.vmd').read_bytes()).decode();checks=[];errors=[]
def ok(n,v=True):
 assert v,n;checks.append(n);print('PASS',n,flush=True)
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=not bool(os.environ.get('DISPLAY')),args=['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 p=b.new_page(viewport={'width':1280,'height':800});p.on('pageerror',lambda e:errors.append(str(e)));p.set_content(HTML);p.wait_for_function('document.documentElement.dataset.ready==="true"');p.mouse.click(30,190)
 p.evaluate('''async x=>{const dec=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0)).buffer;window.mmdInfo=await PulseApp.stage.loadMMD(dec(x.pmx),[dec(x.vmd)],null,[],"QA MMD");PulseApp.stage.custom.offsetMs=0;PulseApp.stage.custom.rate=1;PulseApp.stage.render(.5,120,{preview:true});}''',{'pmx':pmx,'vmd':vmd})
 ok('PMX diagnostic model is rendered by native runtime',p.evaluate('PulseApp.stage.custom?.kind==="mmd"&&mmdInfo.bones===1&&mmdInfo.triangles===1'))
 p.evaluate('PulseApp.stage.animateMMD(PulseApp.stage.custom,.5)');x0=p.evaluate('PulseApp.stage.custom.bones[0].p[0]');p.evaluate('PulseApp.stage.animateMMD(PulseApp.stage.custom,1)');x1=p.evaluate('PulseApp.stage.custom.bones[0].p[0]');ok('VMD changes the PMX bone transform',x1>x0+.2)
 ok('WebGL remains error-free after MMD draw',p.evaluate('PulseApp.stage.gl.getError()===0'))
 p.evaluate('PulseApp.showView("wardrobe")')
 ok('MMD runtime controls expose camera, IK and looping',p.evaluate('document.getElementById("mmdCamera")&&document.getElementById("mmdIk")&&document.getElementById("mmdLoop")'))
 p.screenshot(path=str(Q/'mmd-runtime.png'),full_page=True)
 b.close()
assert not errors,errors
print(json.dumps({'buildSha256':BUILD_SHA,'passed':len(checks),'errors':errors}))
