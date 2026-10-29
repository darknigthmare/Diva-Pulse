"""V35 gate: exact release/workbook and fresh behavior evidence.
Reads workbook XML only; never converts or mutates the spreadsheet.
"""
from pathlib import Path
from collections import Counter
import csv
import hashlib
import json
import re
import zipfile
import xml.etree.ElementTree as ET

R = Path(__file__).resolve().parents[1]
Q = R / 'qa/v35'
W = R / 'planning/DIVA_PULSE_MANQUANTS_V35.xlsx'
WORKBOOK = 'ee0ebe849d4aaea09296be9b0a773f7cafaa6935de4dfbba884699390c220ed2'
assert hashlib.sha256(W.read_bytes()).hexdigest() == WORKBOOK, 'Workbook bytes changed'
ns = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
with zipfile.ZipFile(W) as z:
    sheets = ET.fromstring(z.read('xl/workbook.xml')).find('s:sheets', ns)
    assert len(sheets) == 17
    strings = [''.join(si.itertext()) for si in ET.fromstring(z.read('xl/sharedStrings.xml'))] if 'xl/sharedStrings.xml' in z.namelist() else []
    def cells(name):
        out = {}
        for c in ET.fromstring(z.read(name)).findall('.//s:sheetData/s:row/s:c', ns):
            assert c.attrib.get('t') != 'e', ('Formula error', name, c.attrib['r'])
            v = c.find('s:v', ns)
            value = v.text if v is not None else ''
            if c.attrib.get('t') == 'inlineStr':
                value = ''.join(t.text or '' for t in c.findall('.//s:t', ns))
            elif c.attrib.get('t') == 's':
                value = strings[int(value)]
            out[c.attrib['r']] = value or ''
        return out
    c = cells('xl/worksheets/sheet2.xml')
    summary = cells('xl/worksheets/sheet1.xml')
    for i in range(1, 18):
        cells(f'xl/worksheets/sheet{i}.xml')
    rows = [[c.get(f'{chr(65+i)}{n}', '') for i in range(11)] for n in range(6, 142)]
    assert len({row[0] for row in rows}) == 136 and all(row[0] and row[4] for row in rows)
    counts = dict(Counter(row[3] for row in rows))
    assert counts == {'Fait': 49, 'Partiel': 26, 'À faire': 36, 'À valider': 25}
    assert [int(float(summary[k])) for k in ['A10', 'D10', 'G10']] == [136, 49, 87]
backlog = json.loads((R / 'planning/BACKLOG_V35.json').read_text())
assert backlog['rows'] == rows and backlog['statusCounts'] == counts
assert backlog['version'] == '35.0.0'
assert backlog['base'] == '633ead8bce01f383c016a4e155f02961e934fdba'
with (R / 'planning/MANQUANTS_V35.csv').open(encoding='utf-8-sig', newline='') as f:
    assert list(csv.reader(f)) == [backlog['columns']] + rows
previous = json.loads((R / 'planning/BACKLOG_V34.json').read_text())
assert [r[0] for r in previous['rows']] == [r[0] for r in rows]
for old, new in zip(previous['rows'], rows):
    allowed = {3, 6, 8, 10} if old[0] == 'GAME-01' else {6, 8, 10} if old[0] in {'GAME-03', 'GAME-04', 'UX-03'} else set()
    assert all(a == b for i, (a, b) in enumerate(zip(old, new)) if i not in allowed), old[0]
version = (R / 'VERSION.txt').read_text().strip()
assert version == '35.0.0'
build = (R / 'index.html').read_bytes()
digest = hashlib.sha256(build).hexdigest()
assert build == (R / 'DIVA_PULSE_JOUER.html').read_bytes()
expected = {'vault-live': 28, 'feedback': 22, 'loops': 16, 'audition': 32,
            'regression-workflow': 18, 'regression-director': 23,
            'regression-persistence': 14, 'transactions': 11, 'playback': 22}
for name, count in expected.items():
    path = (Q if name == 'playback' else R / 'qa/v34') / name / 'results.json'
    result = json.loads(path.read_text())
    assert result['version'] == version and result['buildSha256'] == digest, (name, 'build')
    assert result['passed'] == count and result['failed'] == 0 and not result['failure'] and not result['errors'], (name, result)
    assert len(result['checks']) == count and all(x['passed'] for x in result['checks'])
    if name in {'vault-live', 'feedback'}:
        assert result['mode'] == 'http'
    if name == 'vault-live':
        assert result['nativeAbortExecuted'] is True
    if name in {'loops', 'audition', 'playback'}:
        assert result['nativeHTTP'] is True
    if name == 'playback':
        assert result['nativeAudio'] is True
    if name == 'regression-workflow':
        assert result['documentMode'] is False
text = (Q / 'logic.tap').read_text()
for field, number in [('tests', 1200), ('pass', 1200), ('fail', 0), ('skipped', 0), ('cancelled', 0)]:
    assert re.search(r'^# ' + field + ' ' + str(number) + r'$', text, re.M), field
assert 'TOTAL 10 PASS' in (Q / 'launcher.txt').read_text()
release = json.loads((Q / 'release-check.txt').read_text().splitlines()[-1])
assert release['version'] == version and release['sha256'] == digest
assert release['standaloneIdentical'] and release['deterministicBuild']
receipt = {
    'version': version, 'buildSha256': digest, 'workbookSha256': WORKBOOK,
    'logicPassed': 1200, 'newLogic': 158, 'launcherPassed': 10,
    'browserChecks': expected, 'browserTotal': sum(expected.values()),
    'backlogItems': 136, 'done': 49, 'open': 87, 'sheets': 17,
    'statusCounts': counts, 'backlogExcelJsonCsvIdentical': True,
    'scope': 'HTTP/IndexedDB and native Web Audio; transactional abort after deletion. Playback boundaries deliberately deferred and visibility events injected; real WSOLA worker. 23 inherited Director checks use an injected document. Software GPU and emulated viewports; no acoustic, physical-device or full MMD-corpus certification.'
}
commit_file = Q / 'commit.txt'
if commit_file.exists():
    receipt['commitEvidence'] = commit_file.read_text().strip().splitlines()
(Q / 'verified.json').write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(receipt, ensure_ascii=False, indent=2))
