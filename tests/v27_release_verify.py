"""Reproducible release verification; return codes and delivered bytes are captured."""
from pathlib import Path
import subprocess,json,hashlib,time,re
R=Path(__file__).resolve().parents[1];Q=R/'qa/v27';commands=[]
plan=[('logic-final',['node','--test']+[str(p.relative_to(R)) for p in sorted((R/'tests').glob('*.test.cjs'))]),('launcher-final',['python','tests/launcher_test.py']),('native-final',['xvfb-run','-a','python','tests/v27_native_mmd_browser.py']),('features-final',['xvfb-run','-a','python','tests/v27_browser_test.py'])]+[(f'regression-v{i}',['xvfb-run','-a','python',f'tests/v27_regression_v{i}_browser.py']) for i in range(20,27)]
for name,cmd in plan:
 start=time.time()
 with (Q/(name+'.txt')).open('w') as log:
  try:rc=subprocess.run(cmd,cwd=R,stdout=log,stderr=subprocess.STDOUT,timeout=240).returncode
  except subprocess.TimeoutExpired:rc=124
 commands.append({'name':name,'command':cmd,'returncode':rc,'seconds':round(time.time()-start,3)})
 (Q/(name+'.exit')).write_text(str(rc)+'\n');(Q/'release-exits.json').write_text(json.dumps(commands,indent=2));print(name,rc,flush=True)
 if rc:raise SystemExit(rc)
print('Release verification commands complete.',flush=True)
