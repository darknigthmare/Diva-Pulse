"""Run actual browser flows on the built HTML; no reuse of historical QA output."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import subprocess,os,json,time
R=Path(__file__).resolve().parents[1];Q=R/'qa/v26';Q.mkdir(exist_ok=True);env=dict(os.environ,DISPLAY=':99')
jobs=['v26_browser_test.py',*[f'v26_regression_v{v}_browser.py' for v in range(25,19,-1)],'v26_native_mmd_browser.py','launcher_test.py']
def execute(name):
 start=time.monotonic();file=Q/(name+'.log')
 try:
  with file.open('w') as out:r=subprocess.run(['python',str(R/'tests'/name)],cwd=R,env=env,stdout=out,stderr=out,timeout=600)
  status={'name':name,'returncode':r.returncode,'durationSeconds':round(time.monotonic()-start,2)}
 except Exception as e:status={'name':name,'returncode':None,'error':str(e),'durationSeconds':round(time.monotonic()-start,2)}
 (Q/(name+'.status.json')).write_text(json.dumps(status));print(json.dumps(status),flush=True);return status
with ThreadPoolExecutor(max_workers=1) as executor:results=list(executor.map(execute,jobs))
(Q/'verification-status.json').write_text(json.dumps(results,indent=2))
if any(x.get('returncode')!=0 for x in results):raise SystemExit(1)
