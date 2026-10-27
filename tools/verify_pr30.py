"""Fail closed on stale/missing CI evidence, including injected-document mode."""
from pathlib import Path
import hashlib,json,re,zipfile
R=Path(__file__).resolve().parents[1]
digest=hashlib.sha256((R/'index.html').read_bytes()).hexdigest()
expected={'workflow':18,'regression-director':23,'regression-persistence':14}
for suite,count in expected.items():
    report=json.loads((R/f'qa/v30/{suite}/results.json').read_text())
    assert report['version']=='30.0.0' and report['buildSha256']==digest, suite+' stale build'
    assert report['passed']==count and report['failed']==0 and report['failure'] is None,suite
    assert len(report['checks'])==count and all(c['passed'] for c in report['checks']),suite
    assert not report['errors'],suite
    if suite=='workflow':assert report.get('documentMode') is False,'Native HTTP evidence required'
tap=(R/'qa/v30/logic.tap').read_text()
assert re.search(r'^# pass 862$',tap,re.M) and re.search(r'^# fail 0$',tap,re.M)
assert 'TOTAL 10 PASS' in (R/'qa/v30/launcher.txt').read_text()
with zipfile.ZipFile(R/'planning/DIVA_PULSE_MANQUANTS_V30.xlsx') as z:
    assert z.testzip() is None
    assert 'xl/workbook.xml' in z.namelist()
backlog=json.loads((R/'planning/BACKLOG_V30.json').read_text())
assert len(backlog['tasks'])==114 and len({t['id'] for t in backlog['tasks']})==114
receipt={'version':'30.0.0','buildSha256':digest,'logic':862,'launcher':10,'browser':expected,
         'nativeWorkflow':True,'xlsxSha256':hashlib.sha256((R/'planning/DIVA_PULSE_MANQUANTS_V30.xlsx').read_bytes()).hexdigest(),
         'scope':'CI Chromium/SwiftShader; no physical device or universal MMD certification.'}
(R/'qa/v30/verified.json').write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps(receipt,indent=2))
