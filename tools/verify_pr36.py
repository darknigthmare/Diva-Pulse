"""V36 gate: exact release/workbook and fresh behavior evidence.
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
Q = R / 'qa/v36'
W = R / 'planning/DIVA_PULSE_MANQUANTS_V36.xlsx'
WORKBOOK = '542be34ce1ba2724cd822724d1bf8bb994b7253de0af085273e070deffd9884d'
LOGIC_COUNT = 1291
ARCHIVE_CHECKS = 76
MOTION_CHECKS = 22
assert LOGIC_COUNT > 1200 and ARCHIVE_CHECKS > 0 and MOTION_CHECKS > 0
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
    assert counts == {'Fait': 50, 'Partiel': 25, 'À faire': 36, 'À valider': 25}
    assert [int(float(summary[k])) for k in ['A10', 'D10', 'G10']] == [136, 50, 86]
backlog = json.loads((R / 'planning/BACKLOG_V36.json').read_text())
assert backlog['rows'] == rows and backlog['statusCounts'] == counts
assert backlog['version'] == '36.0.0'
assert backlog['base'] == 'b3d9aaee1b7db4f342161f18682915f4d2517dd3'
with (R / 'planning/MANQUANTS_V36.csv').open(encoding='utf-8-sig', newline='') as f:
    assert list(csv.reader(f)) == [backlog['columns']] + rows
previous = json.loads((R / 'planning/BACKLOG_V35.json').read_text())
assert [r[0] for r in previous['rows']] == [r[0] for r in rows]
for old, new in zip(previous['rows'], rows):
    allowed = {3, 6, 8, 10} if old[0] == 'SAV-10' else {6, 8, 10} if old[0] in {'GAME-05', 'ARC-04', 'UX-05'} else set()
    assert all(a == b for i, (a, b) in enumerate(zip(old, new)) if i not in allowed), old[0]
version = (R / 'VERSION.txt').read_text().strip()
assert version == '36.0.0'
build = (R / 'index.html').read_bytes()
digest = hashlib.sha256(build).hexdigest()
assert build == (R / 'DIVA_PULSE_JOUER.html').read_bytes()
expected = {'vault-live': 28, 'feedback': 22, 'loops': 16, 'audition': 32,
            'regression-workflow': 18, 'regression-director': 23,
            'regression-persistence': 14, 'transactions': 11, 'playback': 22, 'archive': ARCHIVE_CHECKS, 'motion': MOTION_CHECKS}
for name, count in expected.items():
    path = (Q if name in {'archive', 'motion'} else R / ('qa/v35' if name == 'playback' else 'qa/v34')) / name / 'results.json'
    result = json.loads(path.read_text())
    assert result['version'] == version and result['buildSha256'] == digest, (name, 'build')
    assert result['passed'] == count and result['failed'] == 0 and not result['failure'] and not result['errors'], (name, result)
    assert len(result['checks']) == count and all(x['passed'] for x in result['checks'])
    if name in {'vault-live', 'feedback'}:
        assert result['mode'] == 'http'
    if name in {'vault-live', 'archive'}:
        assert result['nativeAbortExecuted'] is True
    if name in {'loops', 'audition', 'playback', 'archive', 'motion'}:
        assert result['nativeHTTP'] is True
    if name == 'archive':
        assert result['nativeIndexedDB'] is True and result['buildUnchanged'] is True
    if name == 'motion':
        assert result['nativeWebGL'] is True and result['nativeIndexedDB'] is True and result['buildUnchanged'] is True
    if name == 'playback':
        assert result['nativeAudio'] is True
    if name == 'regression-workflow':
        assert result['documentMode'] is False
text = (Q / 'logic.tap').read_text()
for field, number in [('tests', LOGIC_COUNT), ('pass', LOGIC_COUNT), ('fail', 0), ('skipped', 0), ('cancelled', 0)]:
    assert re.search(r'^# ' + field + ' ' + str(number) + r'$', text, re.M), field
assert 'TOTAL 10 PASS' in (Q / 'launcher.txt').read_text()
release = json.loads((Q / 'release-check.txt').read_text().splitlines()[-1])
assert release['version'] == version and release['sha256'] == digest
assert release['standaloneIdentical'] and release['deterministicBuild']
receipt = {
    'version': version, 'buildSha256': digest, 'workbookSha256': WORKBOOK,
    'logicPassed': LOGIC_COUNT, 'newLogic': LOGIC_COUNT - 1200, 'launcherPassed': 10,
    'browserChecks': expected, 'browserTotal': sum(expected.values()),
    'backlogItems': 136, 'done': 50, 'open': 86, 'sheets': 17,
    'statusCounts': counts, 'backlogExcelJsonCsvIdentical': True,
    'scope': 'HTTP/IndexedDB and native Web Audio; archive rejection before writes, valid restoration and reload, reduced-motion preferences, transactional abort after deletion. Playback boundaries deliberately deferred and visibility events injected; real WSOLA worker. 23 inherited Director checks use an injected document. Software GPU and emulated viewports; no acoustic, physical-device or full MMD-corpus certification.'
}
commit_file = Q / 'commit.txt'
if commit_file.exists():
    receipt['commitEvidence'] = commit_file.read_text().strip().splitlines()
(Q / 'verified.json').write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(receipt, ensure_ascii=False, indent=2))
