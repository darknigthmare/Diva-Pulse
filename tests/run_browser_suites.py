#!/usr/bin/env python3
"""Run current browser suites sequentially; do not saturate a software GPU.
Prerequisites: Python Playwright, Chromium; xvfb-run on Linux without DISPLAY.
No packages are downloaded, no browser or security policy is changed.
"""
from pathlib import Path
import subprocess, sys, os, shutil, json
R=Path(__file__).resolve().parents[1]
suites=[('regression-v3.py','regression-v3.json'),('advanced_browser_test.py','advanced-results.json'),('creator_browser_test.py','creator-browser-results.json'),('live_browser_test.py','v4-browser-results.json'),('precision_browser_test.py','v5/precision-browser.json'),('automap_browser_test.py','v6/automap-browser.json'),('automap_completion_test.py','v6/completion-browser.json')]
fail=False
for script,result in suites:
 cmd=[sys.executable,str(R/'tests'/script)]
 if sys.platform.startswith('linux') and not os.environ.get('DIVA_USE_DISPLAY'):
  if not shutil.which('xvfb-run'):
   print('Xvfb absent : la scène WebGL peut ne pas être disponible.',file=sys.stderr)
  else:cmd=['xvfb-run','-a',*cmd]
 p=subprocess.run(cmd,cwd=R)
 path=R/'qa'/result
 if p.returncode or not path.exists():fail=True;continue
 data=json.loads(path.read_text());fail|=bool(data.get('failed'))
 print(script,':',data.get('passed'), 'réussis /',data.get('failed'),'échecs')
sys.exit(1 if fail else 0)
