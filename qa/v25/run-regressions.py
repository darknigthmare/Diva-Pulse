from pathlib import Path
import subprocess,time,json
R=Path(__file__).resolve().parents[2];rows=[]
for name in ['v25_browser_test.py','v25_regression_v24_browser.py','v25_regression_v23_browser.py','v25_regression_v22_browser.py','v25_regression_v21_browser.py','v25_regression_v20_browser.py','v25_native_mmd_browser.py','launcher_test.py']:
 start=time.monotonic();log=R/'qa/v25'/('final-'+name+'.log');print('RUN',name,flush=True)
 with log.open('w') as f:
  try:r=subprocess.run(['xvfb-run','-a','python',str(R/'tests'/name)],cwd=R,stdout=f,stderr=subprocess.STDOUT,timeout=240);code=r.returncode
  except subprocess.TimeoutExpired:code=124
 rows.append({'name':name,'exit':code,'seconds':round(time.monotonic()-start,2),'log':str(log.relative_to(R))});print(rows[-1],flush=True);(R/'qa/v25/commands-final.json').write_text(json.dumps(rows,indent=2))
 if code:break
