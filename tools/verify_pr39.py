"""V39 gate: exact build, V39 workbook/JSON/CSV, a11y report and fresh browser evidence.

The V37 and V38 workbooks and their evidence remain untouched as historical references.
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
Q = R / 'qa/v39'
A11Y = Q / 'accessibility'
W = R / 'planning/DIVA_PULSE_MANQUANTS_V39.xlsx'
W38 = R / 'planning/DIVA_PULSE_MANQUANTS_V38.xlsx'
W37 = R / 'planning/DIVA_PULSE_MANQUANTS_V37.xlsx'
WORKBOOK = '6ec788e7cb9a175f361595567d048e35f98944f4240a6d211448e58e73ed5043'
WORKBOOK_V38 = '6714d9fbad344e096d0df0589e1cb1f872c692b5dc821fabd9cd0b62f11e06e7'
WORKBOOK_V37 = 'a1177f899a208a88fd18e70946b4f7ed97fdca4acb9f2c30f225e85fc73766ea'
BUILD_SHA = '2d0383890f230b79d9621c705259f93a71fd23f1809b9d4e516b92c09b4f98c5'
LOGIC_COUNT = 1423
BROWSER_CHECKS = 16
A11Y_CHECKS = 8
COUNTS = {'Fait': 52, 'Partiel': 34, 'À faire': 34, 'À valider': 23}

assert hashlib.sha256(W37.read_bytes()).hexdigest() == WORKBOOK_V37, 'Historical V37 workbook changed'
assert hashlib.sha256(W38.read_bytes()).hexdigest() == WORKBOOK_V38, 'Historical V38 workbook changed'
assert hashlib.sha256(W.read_bytes()).hexdigest() == WORKBOOK, 'V39 workbook bytes changed'
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
    rows = [[c.get(f'{chr(65 + i)}{n}', '') for i in range(11)] for n in range(6, 149)]
    assert len({row[0] for row in rows}) == 143 and all(row[0] and row[4] for row in rows)
    counts = dict(Counter(row[3] for row in rows))
    assert counts == COUNTS, counts
backlog = json.loads((R / 'planning/BACKLOG_V39.json').read_text())
assert backlog['rows'] == rows and backlog['statusCounts'] == counts
assert backlog['version'] == '39.0.0'
assert backlog['base'] == '2513453f6b07ef9c4b1cee2a04b22cc3171e61eb'
with (R / 'planning/MANQUANTS_V39.csv').open(encoding='utf-8-sig', newline='') as f:
    assert list(csv.reader(f)) == [backlog['columns']] + rows
previous = json.loads((R / 'planning/BACKLOG_V38.json').read_text())
assert previous['version'] == '38.0.0' and len(previous['rows']) == 136
assert {r[0] for r in previous['rows']} < {r[0] for r in rows}
version = (R / 'VERSION.txt').read_text().strip()
assert version == '39.0.0'
assert json.loads((R / 'package.json').read_text())['version'] == version
assert re.search(r"const VERSION = ['\"]" + re.escape(version), (R / 'src/core.js').read_text())
assert version in (R / 'sw.js').read_text()
assert 'V39' in json.loads((R / 'manifest.webmanifest').read_text())['name']
build = (R / 'index.html').read_bytes()
digest = hashlib.sha256(build).hexdigest()
assert digest == BUILD_SHA, f'index.html changed: {digest}'
assert build == (R / 'DIVA_PULSE_JOUER.html').read_bytes()
assert b'/*__' not in build and b'<?xml' not in build[:20]
report_path = A11Y / 'report.json'
if not report_path.exists():
    raise SystemExit(f'Rapport d’accessibilité absent : {report_path}. Exécuter tools/a11y_report.py sur le build {digest}.')
report = json.loads(report_path.read_text())
assert report['version'] == version and report['buildSha256'] == digest, 'Rapport produit sur un autre build'
assert len(report['checks']) == A11Y_CHECKS, report['checks']
assert report['browserMeasured'] is True and report['summary'] == {'passed': A11Y_CHECKS, 'failed': 0, 'pending': 0, 'total': A11Y_CHECKS}, report['summary']
assert all(item['status'] == 'passed' and item['kind'] == 'browser' for item in report['checks']), report['checks']
results_path = Q / 'results.json'
if not results_path.exists():
    raise SystemExit(f'Preuve navigateur absente : {results_path}. Exécuter tests/v39_browser_test.py sur le build {digest}.')
results = json.loads(results_path.read_text())
if results.get('version') != version:
    raise SystemExit(f"Preuve navigateur pour la version {results.get('version')} au lieu de {version}.")
if results.get('buildSha256') != digest:
    raise SystemExit('Preuve navigateur produite sur un autre build : hash différent de index.html.')
assert results['passed'] == BROWSER_CHECKS and results['failed'] == 0 and not results['failure'] and not results['errors'], results
assert len(results['checks']) == BROWSER_CHECKS and all(x['passed'] for x in results['checks'])
assert results['mode'] == 'http' and results['nativeHTTP'] is True and results['buildUnchanged'] is True
assert results['clicksToFirstNote'] == 1
browser_path = A11Y / 'browser.json'
assert browser_path.exists(), 'Mesures navigateur C1–C8 absentes.'
browser = json.loads(browser_path.read_text())
assert browser['buildSha256'] == digest and browser['version'] == version and browser['failed'] == 0, browser
measured = {item['id']: item for item in browser['checks']}
assert all(measured.get(f'C{i}', {}).get('passed') for i in range(1, 9)), sorted(measured)
text = (Q / 'logic.tap').read_text()
for field, number in [('tests', LOGIC_COUNT), ('pass', LOGIC_COUNT), ('fail', 0), ('skipped', 0), ('cancelled', 0)]:
    assert re.search(r'^# ' + field + ' ' + str(number) + r'$', text, re.M), field
assert 'TOTAL 10 PASS' in (Q / 'launcher.txt').read_text()
release = json.loads((Q / 'release-check.txt').read_text().splitlines()[-1])
assert release['version'] == version and release['sha256'] == digest
assert release['standaloneIdentical'] and release['deterministicBuild']
receipt = {
    'version': version, 'buildSha256': digest, 'workbookSha256': WORKBOOK,
    'logicPassed': LOGIC_COUNT, 'newLogic': LOGIC_COUNT - 1409, 'launcherPassed': 10,
    'firstVisitChecks': BROWSER_CHECKS, 'accessibilityChecks': A11Y_CHECKS,
    'backlogItems': 143, 'done': 52, 'partial': 34, 'todo': 34, 'toValidate': 23, 'open': 91,
    'sheets': 17, 'tables': 16, 'statusCounts': counts, 'backlogExcelJsonCsvIdentical': True,
    'accessibilityReport': 'qa/v39/accessibility/report.json',
    'scope': 'Native HTTP/IndexedDB first visit and measured DOM/viewport accessibility. Software GPU and emulated viewport; no physical device, acoustic latency, screen-reader, colour-vision, human comprehension or WCAG conformance. Historical V37/V38 browser suites are not re-asserted by this gate.'
}
commit_file = Q / 'commit.txt'
if commit_file.exists():
    receipt['commitEvidence'] = commit_file.read_text().strip().splitlines()
(Q / 'verified.json').write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(receipt, ensure_ascii=False, indent=2))
