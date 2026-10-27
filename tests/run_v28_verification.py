"""Run explicit release suites on immutable rebuilt HTML; never borrow historical totals."""
from pathlib import Path
import subprocess,time,json,hashlib,sys
R=Path(__file__).resolve().parents[1];Q=R/'qa/v28';Q.mkdir(exist_ok=True)
plan=[('logic',['node','--test']+[str(f.relative_to(R)) for f in sorted((R/'tests').glob('*.test.cjs'))]),('launcher',['python','tests/launcher_test.py']),('timing',['node','tests/v28_timing_benchmark.cjs']),('native',['xvfb-run','-a','python','tests/v28_native_mmd_browser.py']),('features',['xvfb-run','-a','python','tests/v28_browser_test.py']),('playback',['xvfb-run','-a','python','tests/v28_playback_browser_test.py'])]+[(f'regression-v{v}',['xvfb-run','-a','python',f'tests/v28_regression_v{v}_browser.py']) for v in [20,24,25,26,27]]
commands=[];sha=hashlib.sha256((R/'index.html').read_bytes()).hexdigest()
if '--resume' in sys.argv:
 prior=json.loads((Q/'release-commands.json').read_text());assert prior['htmlSha256']==sha
 commands=[x for x in prior['commands'] if x['returncode']==0]
 done={x['name'] for x in commands};plan=[x for x in plan if x[0] not in done]
for name,command in plan:
 start=time.time()
 with (Q/(name+'-final.txt')).open('w') as f:
  try:rc=subprocess.run(command,cwd=R,stdout=f,stderr=subprocess.STDOUT,timeout=240).returncode
  except subprocess.TimeoutExpired:rc=124
 commands.append({'name':name,'command':command,'returncode':rc,'seconds':round(time.time()-start,3)})
 (Q/'release-commands.json').write_text(json.dumps({'htmlSha256':sha,'commands':commands},indent=2))
 print(name,rc,round(time.time()-start,1),flush=True)
 if rc:raise SystemExit(rc)
print('FINISHED',flush=True)
