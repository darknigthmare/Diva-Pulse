from pathlib import Path
from playwright.sync_api import sync_playwright
import json
R=Path(__file__).resolve().parents[1]
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=False,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 p=b.new_page(viewport={'width':1440,'height':1000});p.set_default_timeout(15000);errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
 p.set_content((R/'DIVA_PULSE_JOUER.html').read_text());p.wait_for_function('document.documentElement.dataset.v5Ready==="true"')
 print('init',p.evaluate('({version:PulseCore.VERSION,songs:PulseApp.songs.length,gl:PulseApp.stage.available,persistent:PulseApp.store.persistent})'))
 p.screenshot(path=str(R/'qa/v5/home.png'))
 p.evaluate('PulseApp.showView("settings")');p.screenshot(path=str(R/'qa/v5/settings.png'),full_page=True)
 p.evaluate('PulseApp.showView("editor")');p.wait_for_function('!!PulseApp.editor.chart');p.screenshot(path=str(R/'qa/v5/studio.png'),full_page=True)
 p.evaluate('PulseApp.showView("library")');p.evaluate('PulseApp.practiceDialog()');p.locator('#practicePitch').check();p.locator('#practiceRate').select_option('.75');p.locator('#practiceFrom').fill('2');p.locator('#practiceTo').fill('9');p.locator('#practiceStart').click();p.wait_for_function('PulseApp.view==="game"&&!PulseApp.busy',timeout=45000)
 print('practice',p.evaluate('({rate:PulseApp.audio.rate,renderRate:PulseApp.audio.source.playbackRate.value,stretched:!!PulseApp.audio.stretched,practice:PulseApp.practice,glerror:PulseApp.stage.gl?.getError()})'))
 p.screenshot(path=str(R/'qa/v5/practice.png'));p.evaluate('PulseApp.pause()');p.locator('#leaveGame').click();p.wait_for_function('PulseApp.view==="library"');print('errors',errors)
 (R/'qa/v5/smoke.json').write_text(json.dumps({'errors':errors,'view':p.evaluate('PulseApp.view')},indent=2));b.close()
