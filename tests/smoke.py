from playwright.sync_api import sync_playwright
import json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 page=browser.new_page(viewport={'width':1440,'height':900},device_scale_factor=1)
 errors=[]
 page.on('pageerror',lambda e: errors.append(str(e)))
 page.on('console',lambda m: print('CONSOLE',m.type,m.text[:300]) if m.type in ['error','warning'] else None)
 page.set_content((root/'DIVA_PULSE_JOUER.html').read_text(),wait_until='load')
 page.wait_for_timeout(1500)
 print('READY',page.locator('html').get_attribute('data-ready'))
 print('BODY',page.locator('body').inner_text()[:1800])
 print('ERRORS',errors)
 print('STAGE',page.evaluate('({stage:PulseApp.stage.available,songs:PulseApp.songs.length,charts:PulseApp.song.charts.length})') if not errors else 'error')
 page.screenshot(path=str(root/'qa/01-accueil.png'),full_page=True)
 browser.close()
