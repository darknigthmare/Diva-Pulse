"""Run current release browser regression paths sequentially, preserving exit codes."""
from pathlib import Path
import subprocess,json,time
R=Path(__file__).resolve().parents[1];Q=R/'qa/v27';out=[]
for n in range(20,27):
 cmd=['xvfb-run','-a','python',f'tests/v27_regression_v{n}_browser.py'];start=time.time()
 with (Q/f'regression-v{n}.txt').open('w') as log:
  try:code=subprocess.run(cmd,cwd=R,stdout=log,stderr=subprocess.STDOUT,timeout=220).returncode
  except subprocess.TimeoutExpired:code=124
 out.append({'command':cmd,'returncode':code,'seconds':round(time.time()-start,3)})
 (Q/'regression-exits.json').write_text(json.dumps(out,indent=2))
print(json.dumps(out));raise SystemExit(any(x['returncode'] for x in out))
