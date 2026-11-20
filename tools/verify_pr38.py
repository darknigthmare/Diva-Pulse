"""V38 gate: exact build, V38 workbook/JSON/CSV and fresh V38 browser evidence.

The V37 workbook and its evidence remain untouched as historical references.
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
Q = R / 'qa/v38'
W = R / 'planning/DIVA_PULSE_MANQUANTS_V38.xlsx'
W37 = R / 'planning/DIVA_PULSE_MANQUANTS_V37.xlsx'
WORKBOOK = '6714d9fbad344e096d0df0589e1cb1f872c692b5dc821fabd9cd0b62f11e06e7'
WORKBOOK_V37 = 'a1177f899a208a88fd18e70946b4f7ed97fdca4acb9f2c30f225e85fc73766ea'
LOGIC_COUNT = 1409
BROWSER_CHECKS = 17
assert hashlib.sha256(W37.read_bytes()).hexdigest() == WORKBOOK_V37, 'Historical V37 workbook changed'
assert hashlib.sha256(W.read_bytes()).hexdigest() == WORKBOOK, 'V38 workbook bytes changed'
ns = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
with zipfile.ZipFile(W) as z:
    sheets = ET.fromstring(z.read('xl/workbook.xml')).find('s:sheets', ns)
    assert len(sheets) == 17
    assert len([n for n in z.namelist() if re.fullmatch(r'xl/tables/table[0-9]+\.xml', n)]) == 16
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
    for i in range(1, 18):
        cells(f'xl/worksheets/sheet{i}.xml')
    rows = [[c.get(f'{chr(65+i)}{n}', '') for i in range(11)] for n in range(6, 142)]
    assert len({row[0] for row in rows}) == 136 and all(row[0] and row[4] for row in rows)
    counts = dict(Counter(row[3] for row in rows))
    assert counts == {'Fait': 52, 'Partiel': 30, 'À faire': 31, 'À valider': 23}, counts
backlog = json.loads((R / 'planning/BACKLOG_V38.json').read_text())
assert backlog['rows'] == rows and backlog['statusCounts'] == counts
assert backlog['version'] == '38.0.0'
assert backlog['base'] == 'fc8e453d102c62c75b65d9a2a33dc076d2511330'
with (R / 'planning/MANQUANTS_V38.csv').open(encoding='utf-8-sig', newline='') as f:
    assert list(csv.reader(f)) == [backlog['columns']] + rows
previous = json.loads((R / 'planning/BACKLOG_V37.json').read_text())
assert previous['version'] == '37.0.0' and len(previous['rows']) == 136
changed = {'GAME-06', 'GAME-08', 'ART-06', 'UX-06', 'PUB-05'}
assert {r[0] for r in previous['rows']} == {r[0] for r in rows}
for old, new in zip(previous['rows'], rows):
    allowed = {3, 6, 8, 10} if old[0] in changed else set()
    assert all(a == b for i, (a, b) in enumerate(zip(old, new)) if i not in allowed), old[0]
version = (R / 'VERSION.txt').read_text().strip()
assert version == '38.0.0'
build = (R / 'index.html').read_bytes()
digest = hashlib.sha256(build).hexdigest()
assert build == (R / 'DIVA_PULSE_JOUER.html').read_bytes()
assert b'/*__' not in build and b'<?xml' not in build[:20]
results_path = Q / 'results.json'
if not results_path.exists():
    raise SystemExit(f'Preuve navigateur absente : {results_path}. Exécuter tests/v38_browser_test.py sur le build {digest}.')
results = json.loads(results_path.read_text())
if results.get('version') != version:
    raise SystemExit(f"Preuve navigateur pour la version {results.get('version')} au lieu de {version}.")
if results.get('buildSha256') != digest:
    raise SystemExit('Preuve navigateur produite sur un autre build : hash différent de index.html.')
assert results['passed'] == BROWSER_CHECKS and results['failed'] == 0 and not results['failure'] and not results['errors'], results
assert len(results['checks']) == BROWSER_CHECKS and all(x['passed'] for x in results['checks'])
assert results['mode'] == 'http' and results['nativeHTTP'] is True and results['buildUnchanged'] is True
text = (Q / 'logic.tap').read_text()
for field, number in [('tests', LOGIC_COUNT), ('pass', LOGIC_COUNT), ('fail', 0), ('skipped', 0), ('cancelled', 0)]:
    assert re.search(r'^# ' + field + ' ' + str(number) + r'$', text, re.M), field
assert 'TOTAL 10 PASS' in (Q / 'launcher.txt').read_text()
release = json.loads((Q / 'release-check.txt').read_text().splitlines()[-1])
assert release['version'] == version and release['sha256'] == digest
assert release['standaloneIdentical'] and release['deterministicBuild']
receipt = {
    'version': version, 'buildSha256': digest, 'workbookSha256': WORKBOOK,
    'logicPassed': LOGIC_COUNT, 'newLogic': LOGIC_COUNT - 1398, 'launcherPassed': 10,
    'browserChecks': BROWSER_CHECKS, 'backlogItems': 136, 'done': 52, 'partial': 30,
    'todo': 31, 'toValidate': 23, 'open': 84, 'sheets': 17, 'tables': 16,
    'statusCounts': counts, 'backlogExcelJsonCsvIdentical': True,
    'scope': 'Native HTTP/IndexedDB boot and V38 UI states. Software GPU and emulated viewport; no physical device, acoustic latency, screen-reader, legacy-library or MMD-corpus certification. Historical V37 browser suites are not re-asserted by this gate.'
}
commit_file = Q / 'commit.txt'
if commit_file.exists():
    receipt['commitEvidence'] = commit_file.read_text().strip().splitlines()
(Q / 'verified.json').write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(receipt, ensure_ascii=False, indent=2))
