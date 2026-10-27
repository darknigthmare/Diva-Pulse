"""Controlled DOM keyboard/gamepad simulations and real media decoding in Chromium."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,traceback,os
R=Path(__file__).resolve().parents[1];Q=R/'qa';checks=[];errors=[];observations={}
def ok(name,value=True):
 assert value,name
 checks.append({'name':name,'passed':True});print('PASS',name,flush=True)
def idle(p):p.wait_for_function('window.PulseApp&&!PulseApp.busy',timeout=15000)
def nav(p,v):p.locator(f'nav [data-view="{v}"]').click();p.wait_for_function('(v)=>PulseApp.view===v',arg=v)
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=os.environ.get('CHROMIUM','/usr/bin/chromium'),headless=False,args=['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 p=b.new_page(viewport={'width':1280,'height':800});p.set_default_timeout(10000);p.on('pageerror',lambda e:errors.append(str(e)))
 try:
  p.set_content((R/'DIVA_PULSE_JOUER.html').read_text());p.wait_for_function('window.PulseApp && document.documentElement.dataset.v4Ready==="true"');p.mouse.click(20,190)
  p.locator('#audioInput').set_input_files(str(R/'examples/CONTROLE_120_BPM.wav'));idle(p)
  p.locator('#chartInput').set_input_files(str(R/'examples/CONTROLE_120_BPM.json'));idle(p)
  nav(p,'wardrobe');p.locator('#stageGrid button').nth(1).click();p.wait_for_timeout(200)
  ok('Menu preview is not overridden by a time-zero PV event',p.evaluate('PulseApp.stage.stageId==="rooftop"'))
  p.locator('#sceneCamera').select_option('close');p.locator('#sceneDance').select_option('wave');p.wait_for_function('PulseApp.stage.cameraMode==="close"&&PulseApp.stage.dance==="wave"&&Math.abs(PulseApp.stage.rigs[0].parts.arms[0].q[2])>.3')
  ok('Module preview uses chosen camera and animated dance',p.evaluate('PulseApp.stage.cameraMode==="close"&&PulseApp.stage.dance==="wave"&&Math.abs(PulseApp.stage.rigs[0].parts.arms[0].q[2])>.3'))
  nav(p,'settings');p.locator('#showTouch').check();p.locator('#graphicsQuality').select_option('0');nav(p,'library');p.locator('#playButton').click();idle(p);p.wait_for_function('PulseApp.view==="game"')
  p.keyboard.down('d');p.keyboard.down('ArrowUp');p.keyboard.up('d')
  ok('Two keyboard aliases: releasing one preserves the other HOLD',p.evaluate('PulseApp.engine.held.has(0)&&PulseApp.laneSources[0].size===1'))
  p.keyboard.up('ArrowUp');ok('Releasing last alias clears held input',p.evaluate('!PulseApp.engine.held.has(0)'))
  p.evaluate('''()=>{window.fakePad={id:'Simulated standard pad (QA)',buttons:Array.from({length:16},()=>({pressed:false,value:0})),axes:[0,0]};Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[fakePad]});fakePad.buttons[5].pressed=true;}''')
  p.wait_for_function('PulseApp.engine.held.has(5)');ok('Gamepad adapter maps R1 to right slide (simulated)')
  p.evaluate('fakePad.buttons[5].pressed=false');p.wait_for_function('!PulseApp.engine.held.has(5)');ok('Gamepad release clears input (simulated)')
  p.keyboard.press('Escape');p.locator('#leaveGame').click();p.wait_for_function('PulseApp.view==="library"')
  p.locator('#playButton').click();idle(p)
  # Trigger the real keyDown/keyUp handlers on the audio clock. Not a physical performance.
  p.evaluate('''()=>{const a=PulseApp, keys=['KeyD','KeyF','KeyJ','KeyK','KeyS','KeyL'];let events=[];a.gameChart.notes.forEach(n=>{events.push({t:n.time,code:keys[n.lane],down:true});events.push({t:n.time+(n.type==='hold'?.8:.08),code:keys[n.lane],down:false});});events.sort((a,b)=>a.t-b.t);let i=0;function tick(){if(a.view!=='game')return;while(i<events.length&&a.audio.time>=events[i].t){let e=events[i++];document.dispatchEvent(new KeyboardEvent(e.down?'keydown':'keyup',{code:e.code,key:e.code.slice(3).toLowerCase(),bubbles:true,cancelable:true}));}requestAnimationFrame(tick);}requestAnimationFrame(tick);}''')
  p.wait_for_function('PulseApp.view==="results"',timeout=14000)
  observations['simulatedKeyboardResult']=p.evaluate('PulseApp.lastResult')
  ok('Normal mode receives timed keyboard events and clears the song (fixed-stage mode)',p.evaluate('PulseApp.lastResult.cleared&&PulseApp.lastResult.counts.COOL>0'))
  ok('Normal eligible clear writes one local record',p.evaluate('PulseApp.scores.length===1'))
  p.locator('#resultBack').click();p.locator('#practiceButton').click();p.locator('#practiceFrom').fill('1');p.locator('#practiceTo').fill('2');p.locator('#practiceStart').click();idle(p)
  p.wait_for_function('PulseApp.audio.time>1.65');p.wait_for_function('PulseApp.audio.time<.5',timeout=6000)
  ok('Practice actually loops the chosen audio segment',p.evaluate('PulseApp.mode==="practice"&&PulseApp.practice.loop&&PulseApp.scores.length===1'))
  p.locator('#pauseButton').click();p.locator('#leaveGame').click();nav(p,'editor');p.locator('#editorNew').click();p.wait_for_function('PulseApp.editor.chart.notes.length===0')
  p.locator('#editorRecord').click();idle(p);p.wait_for_function('PulseApp.editor.recording');p.wait_for_timeout(160);p.keyboard.down('d');p.wait_for_timeout(460);p.keyboard.up('d');p.keyboard.press('f');p.locator('#editorStop').click()
  ok('Live manual recording captures taps and held durations',p.evaluate('PulseApp.editor.chart.notes.length===2&&PulseApp.editor.chart.notes.some(n=>n.type==="hold"&&n.duration>.35)'))
  p.locator('#editorSave').click();idle(p)
  ok('Recorded chart is independently saved',p.evaluate('PulseApp.chart.source==="manual"&&PulseApp.chart.notes.length===2'))
  nav(p,'settings');p.locator('#keyBindings button').first.click();p.keyboard.press('q')
  ok('Keyboard remapping updates the active binding',p.evaluate('PulseApp.settings.keys[0]==="KeyQ"'))
  p.locator('#resetBindings').click();ok('Bindings can be restored',p.evaluate('PulseApp.settings.keys[0]==="KeyD"'))
  p.locator('#noFail').check();nav(p,'library');p.locator('#playButton').click();idle(p)
  p.evaluate('''async()=>{PulseApp.engine.update(9,true);await PulseApp.finish();}''')
  ok('No-fail session does not create or replace normal records',p.evaluate('PulseApp.scores.length===1&&document.getElementById("resultMode").textContent.includes("NO FAIL")'))
  p.locator('#resultEdit').click();p.locator('#videoInput').set_input_files(str(R/'examples/CLIP_CONTROLE.mp4'));idle(p)
  ok('Local MP4 decodes and is associated to the song',p.evaluate('!!PulseApp.song.videoAsset'))
  nav(p,'library');p.locator('#pvButton').click();idle(p);p.wait_for_function('PulseApp.audio.time>1')
  ok('PV viewer plays actual MP4 without rhythm notes',p.evaluate('PulseApp.mode==="pv"&&PulseApp.engine===null&&document.getElementById("notesCanvas").hidden&&!document.getElementById("pvVideo").paused'))
  p.screenshot(path=str(Q/'08-pv-video.png'))
  p.locator('#pauseButton').click();ok('PV pause also pauses its video',p.evaluate('document.getElementById("pvVideo").paused'))
  p.locator('#leaveGame').click();nav(p,'wardrobe');p.locator('#modelInput').set_input_files({'name':'broken.glb','mimeType':'model/gltf-binary','buffer':b'not a valid glb file here'});idle(p)
  ok('Invalid GLB reports an error while preserving the built-in stage',p.evaluate('PulseApp.stage.available&&!PulseApp.stage.custom&&document.getElementById("toast").classList.contains("error")'))
  ok('No uncaught errors in advanced scenarios',not errors and p.evaluate('!PulseApp.frameError'))
 except Exception as e:
  print(traceback.format_exc());checks.append({'name':'Interrupted advanced workflow','passed':False,'error':str(e)});p.screenshot(path=str(Q/'advanced-failure.png'),full_page=True)
 finally:
  result={'checks':checks,'passed':sum(x['passed'] for x in checks),'failed':sum(not x['passed'] for x in checks),'errors':errors,'observations':observations,'scope':'Opaque local-content browser test, software GPU. Keyboard DOM and Gamepad adapter inputs are simulations, not physical peripherals.'}
  (Q/'advanced-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print('RESULT',result['passed'],'passed /',result['failed'],'failed',flush=True);b.close()
