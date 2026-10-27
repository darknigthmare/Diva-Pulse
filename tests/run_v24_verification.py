from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import subprocess,os,json,time
R=Path(__file__).resolve().parents[1];Q=R/'qa/v24';env=dict(os.environ,DISPLAY=':99')
jobs=['v24_browser_test.py','v24_regression_v23_browser.py','v24_regression_v22_browser.py','v24_regression_v21_browser.py','v24_regression_v20_browser.py','v24_native_mmd_browser.py','launcher_test.py']
def execute(name):
 t=time.monotonic();f=Q/(name+'.log')
 try:
  with f.open('w') as out:r=subprocess.run(['python',str(R/'tests'/name)],cwd=R,env=env,stdout=out,stderr=out,timeout=600)
  status={'name':name,'returncode':r.returncode,'durationSeconds':round(time.monotonic()-t,2)}
 except Exception as e:status={'name':name,'returncode':None,'error':str(e),'durationSeconds':round(time.monotonic()-t,2)}
 (Q/(name+'.status.json')).write_text(json.dumps(status));return status
with ThreadPoolExecutor(max_workers=2) as executor:results=list(executor.map(execute,jobs))
(Q/'verification-status.json').write_text(json.dumps(results,indent=2));print(json.dumps(results,indent=2))
