"""Apply the reviewed V33 source changes; never touches browser user data."""
from pathlib import Path
import json,re
R=Path(__file__).resolve().parents[1]
changes={}
assert (R/'VERSION.txt').read_text().strip() in ('32.0.0','33.0.0'), 'Unexpected source version'
if (R/'VERSION.txt').read_text().strip()=='33.0.0':
 raise SystemExit('V33 already applied; use build.py to rebuild.')
def patch(name,old,new):
 p=R/name;s=changes.get(p,p.read_text());assert s.count(old)==1,(name,old[:100],s.count(old));changes[p]=s.replace(old,new)
patch('build.py',"{'DIRECTORAUDIO31':", "{'FEEDBACK33':'feedback33.js','DIRECTORAUDIO31':")
patch('src/template.html','<script>/*__APP__*/</script>','<script>/*__FEEDBACK33__*/</script><script>/*__APP__*/</script>')
patch('src/app.js','    root.PulseV27.install(app);','    root.PulseV27.install(app);\n    root.PulseFeedback33.install(app);')
patch('src/app.js','this.bursts.push({ ...event, when: ts });','if(this.consumeFeedback33)this.consumeFeedback33(event,ts);else this.bursts.push({ ...event, when: ts });')
patch('src/app.js',"if (this.mode === 'autoplay' && event.rating !== 'MISS')","if (!this.consumeFeedback33 && this.settings.hitSound && this.mode === 'autoplay' && event.rating !== 'MISS')")
patch('src/enhancements.js','this.engine?.press(lane,t);if(this.settings.hitSound)this.audio.sfx(lane);','this.engine?.press(lane,t);if(this.settings.hitSound&&!this.consumeFeedback33)this.audio.sfx(lane);')
patch('src/app.js','            const e = this.engine;','            this.drawFeedback33?.(ctx,rect,rad,ts,time-this.settings.inputOffset/1000*this.audio.rate);\n            const e = this.engine;')
patch('src/app.js',"async resume() { if (!this.paused)\n            return; await this.audio.init(); this.audio.resume(); this.paused = false; this.closeModal(); }", """async resume() { if (!this.paused || this.view !== 'game' || this.finishing)
            return; const chart = this.gameChart; await this.audio.init();
            if (!this.paused || this.view !== 'game' || this.finishing || this.gameChart !== chart) return;
            this.clearSources(); this.audio.resume(); this.paused = false; this.closeModal(); }""")
patch('src/core.js','        press(lane, time) {\n            this.accrueHolds(time);','        press(lane, time) {\n            if (!Number.isInteger(lane)||lane<0||lane>5||!Number.isFinite(time)) return null;\n            this.accrueHolds(time);')
patch('src/core.js','release(lane,time=this.lastTime) { this.accrueHolds(time);','release(lane,time=this.lastTime) { if(!Number.isInteger(lane)||lane<0||lane>5||!Number.isFinite(time))return; this.accrueHolds(time);')
# Cosmetic version, never the saved chart or replay schema.
patch('src/core.js',"const VERSION = '32.0.0';","const VERSION = '33.0.0';")
p=R/'src/template.html';s=changes.get(p,p.read_text());s=re.sub(r'<title>.*?</title>','<title>DIVA PULSE — Impacts & précision V33</title>',s);s=s.replace('<b>32.0</b>','<b>33.0</b>');changes[p]=s
changes[R/'VERSION.txt']='33.0.0\n'
p=R/'package.json';d=json.loads(p.read_text());d['version']='33.0.0';d['scripts']['test:browser:feedback']='python3 tests/v33_browser_test.py';changes[p]=json.dumps(d,ensure_ascii=False,indent=2)+'\n'
p=R/'sw.js';s=p.read_text();s=re.sub(r'DIVA-PULSE-MMD-DIRECTOR-\d+\.0\.0','DIVA-PULSE-MMD-DIRECTOR-33.0.0',s);changes[p]=s
p=R/'manifest.webmanifest';d=json.loads(p.read_text());d['name']='DIVA PULSE — Impacts & précision V33';changes[p]=json.dumps(d,ensure_ascii=False,indent=2)+'\n'
# Preserve regression behavior, but put fresh evidence under the current release.
for name in ['v29_browser_test.py','v29_persistence_test.py','v30_browser_test.py','v31_browser_test.py','v32_browser_test.py','v32_transactions_test.py']:
 p=R/'tests'/name;v=p.read_text().replace('qa/v32/','qa/v33/').replace('32.0.0','33.0.0')
 changes[p]=v
# All unique anchors were checked before the first source file was touched.
for p,value in changes.items():p.write_text(value,encoding='utf-8')
print('V33 runtime wiring and evidence paths applied. Run the build and tests.')
