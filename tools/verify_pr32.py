"""Evidence gate: exact build, actual suite counts and workbook/backlog agreement."""
from pathlib import Path
import hashlib,json,re,zipfile,xml.etree.ElementTree as ET
R=Path(__file__).resolve().parents[1];Q=R/'qa/v32'
def require(value,message):
    if not value: raise AssertionError(message)
version=(R/'VERSION.txt').read_text().strip();require(version=='32.0.0','wrong version')
digest=hashlib.sha256((R/'index.html').read_bytes()).hexdigest()
require((R/'index.html').read_bytes()==(R/'DIVA_PULSE_JOUER.html').read_bytes(),'standalone differs')
counts={'loops':16,'audition':32,'regression-workflow':18,'regression-director':23,'regression-persistence':14,'transactions':11}
for name,count in counts.items():
    report=json.loads((Q/name/'results.json').read_text())
    require(report['version']==version and report['buildSha256']==digest,f'{name}: stale build')
    require(report['passed']==count and report['failed']==0 and report['failure'] is None,f'{name}: failed')
    require(len(report['checks'])==count and all(c['passed'] is True for c in report['checks']),f'{name}: incomplete')
    require(not report['errors'],f'{name}: unhandled errors')
    if name in ('loops','audition','transactions'): require(report['nativeHTTP'] is True,f'{name}: native origin required')
    if name=='regression-workflow': require(report.get('documentMode') is not True,'workflow: injected origin not accepted')
tap=(Q/'logic.tap').read_text()
for key,count in [('tests',947),('pass',947),('fail',0),('cancelled',0),('skipped',0),('todo',0)]:
    require(re.search(rf'^# {key} {count}$',tap,re.M),f'logic {key}')
require('TOTAL 10 PASS' in (Q/'launcher.txt').read_text(),'launcher evidence missing')
back=json.loads((R/'planning/BACKLOG_V32.json').read_text());tasks=back['tasks']
require(len(tasks)==123 and len({t['id'] for t in tasks})==123,'backlog ids/count')
book=R/'planning/DIVA_PULSE_MANQUANTS_V32.xlsx';bookhash=hashlib.sha256(book.read_bytes()).hexdigest()
release=json.loads((R/'planning/V32_RELEASE.json').read_text())
require(release['buildSha256']==digest and release['workbookSha256']==bookhash,'release digests differ')
N={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
with zipfile.ZipFile(book) as z:
    strings=[]
    if 'xl/sharedStrings.xml' in z.namelist():
        strings=[''.join(si.itertext()) for si in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si',N)]
    names=ET.fromstring(z.read('xl/workbook.xml')).findall('m:sheets/m:sheet',N)
    require(len(names)==13,'workbook sheet count')
    rels={r.attrib['Id']:r.attrib['Target'] for r in ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
    def cells(name):
        sh=next(s for s in names if s.attrib['name']==name);rid=sh.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']
        path=rels[rid];path=path.lstrip('/') if path.startswith('/') else 'xl/'+path
        out={}
        for c in ET.fromstring(z.read(path)).findall('.//m:sheetData/m:row/m:c',N):
            v=c.find('m:v',N);text='' if v is None else v.text
            if c.attrib.get('t')=='s':text=strings[int(text)]
            elif c.attrib.get('t')=='inlineStr':text=''.join(c.find('m:is',N).itertext())
            require(c.attrib.get('t')!='e',f'formula error {name} {c.attrib["r"]}')
            out[c.attrib['r']]=text
        return out
    rows=cells('Manquants')
    for i,t in enumerate(tasks,6):
        require(rows.get(f'A{i}')==t['id'] and rows.get(f'D{i}')==t['status'],f'workbook task {t["id"]}')
    overview=cells('Synthèse');done=sum(t['status']=='Fait' for t in tasks)
    require(float(overview['A11'])==len(tasks) and float(overview['E11'])==done and float(overview['I11'])==len(tasks)-done,'dashboard cached totals')
report={'version':version,'buildSha256':digest,'workbookSha256':bookhash,'logicPassed':947,'launcherPassed':10,'browserChecks':counts,'browserTotal':sum(counts.values()),'backlogItems':len(tasks),'done':done,'open':len(tasks)-done,'sheets':13,'scope':'HTTP/IndexedDB for current workflows, persistence and transaction abort; Director regression remains injected-document. Software GPU; no physical-device certification.'}
(Q/'verified.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False,indent=2))
