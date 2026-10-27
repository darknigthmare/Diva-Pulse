"""Replay the recovered regression scenarios on the current standalone build."""
from pathlib import Path
import subprocess,sys,json,time
R=Path(__file__).resolve().parents[1];Q=R/'qa/v29/regressions';Q.mkdir(parents=True,exist_ok=True)
names=['v28_browser_test.py','v28_native_mmd_browser.py','v28_playback_browser_test.py']+[p.name for p in sorted((R/'tests').glob('v28_regression*_browser.py'))]
results=[]
for name in names:
 start=time.monotonic()
 with (Q/(name+'.log')).open('w') as log:
  try:code=subprocess.run(['xvfb-run','-a',sys.executable,'tests/'+name],cwd=R,stdout=log,stderr=subprocess.STDOUT,timeout=240).returncode
  except subprocess.TimeoutExpired:code=124
 results.append({'test':name,'exit':code,'seconds':round(time.monotonic()-start,2)})
 (Q/'runner.json').write_text(json.dumps(results,indent=2));print(name,code,flush=True)
print(json.dumps(results,indent=2));raise SystemExit(any(r['exit'] for r in results))
