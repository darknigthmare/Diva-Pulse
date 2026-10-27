from pathlib import Path
from playwright.sync_api import sync_playwright
import json
R=Path(__file__).resolve().parents[1]
with sync_playwright() as w:
 b=w.chromium.launch(executable_path='/usr/bin/chromium',headless=False,args=['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 p=b.new_page(viewport={'width':1440,'height':1000});err=[];console=[]
 p.on('pageerror',lambda e:err.append(str(e)));p.on('console',lambda e:console.append(e.text) if e.type=='error' else None)
 p.set_content((R/'index.html').read_text());p.wait_for_timeout(3000)
 print(json.dumps({'errors':err,'console':console,'version':p.evaluate('PulseCore.VERSION'),'quality':p.evaluate('document.documentElement.dataset.qualityReady'),'ready':p.evaluate('!!window.PulseApp?.stage'),'gl':p.evaluate('!!PulseApp.stage?.available'),'stageError':p.evaluate('PulseApp.stage?.initError?.message||PulseApp.frameError||null')},ensure_ascii=False),flush=True)
 p.screenshot(path=str(R/'qa/v23/01-initial-v23.png'))
 b.close()
