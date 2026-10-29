from pathlib import Path
import json,hashlib,subprocess,re,sys
R=Path(__file__).resolve().parents[1]
version=(R/'VERSION.txt').read_text().strip()
assert json.loads((R/'package.json').read_text())['version']==version
assert re.search(r"const VERSION = ['\"]"+re.escape(version), (R/'src/core.js').read_text())
assert version in (R/'sw.js').read_text()
assert 'V'+version.split('.')[0] in json.loads((R/'manifest.webmanifest').read_text())['name']
before=(R/'index.html').read_bytes()
subprocess.run([sys.executable,'build.py'],cwd=R,check=True)
assert before==(R/'index.html').read_bytes()==(R/'DIVA_PULSE_JOUER.html').read_bytes()
assert b'/*__' not in before
assert re.search(r'<title>[^<]*\bV'+re.escape(version.split('.')[0])+r'</title>', before.decode('utf-8'))
print(json.dumps({'version':version,'buildBytes':len(before),'sha256':hashlib.sha256(before).hexdigest(),'standaloneIdentical':True,'deterministicBuild':True}))
