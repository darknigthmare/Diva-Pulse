"""Verify current, independently rerun evidence plus the exact reviewed workbook.
Use --tracker-only to regenerate human-readable JSON/CSV from the reviewed cells;
this never edits the workbook. Full mode requires native HTTP for current tests.
"""
from pathlib import Path
import csv,hashlib,json,re,sys,zipfile,xml.etree.ElementTree as ET
from collections import Counter
R=Path(__file__).resolve().parents[1];Q=R/'qa/v33';Q.mkdir(parents=True,exist_ok=True)
W=R/'planning/DIVA_PULSE_MANQUANTS_V33.xlsx'
BUILD='0b5962898eb04806a6f9fbf5917809f9631b1b1115803929b59434832cdc4d3d'
WORKBOOK='79aca4e1a1f8835a3b70e82ed40956b12d62f647a3aeafb47f94595f92768565'
assert hashlib.sha256(W.read_bytes()).hexdigest()==WORKBOOK
ns={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
with zipfile.ZipFile(W) as z:
 book=ET.fromstring(z.read('xl/workbook.xml'));assert len(book.find('s:sheets',ns))==15
 strings=[]
 if 'xl/sharedStrings.xml' in z.namelist():
  strings=[''.join(si.itertext()) for si in ET.fromstring(z.read('xl/sharedStrings.xml'))]
 def cells(path):
  out={}
  for c in ET.fromstring(z.read(path)).findall('.//s:sheetData/s:row/s:c',ns):
   assert c.attrib.get('t')!='e','Workbook formula error'
   v=c.find('s:v',ns);value=v.text if v is not None else ''
   if c.attrib.get('t')=='inlineStr':value=''.join(t.text or '' for t in c.findall('.//s:t',ns))
   elif c.attrib.get('t')=='s':value=strings[int(value)]
   out[c.attrib['r']]=value or ''
  return out
 c=cells('xl/worksheets/sheet2.xml');summary=cells('xl/worksheets/sheet1.xml')
 columns=[c.get(f'{chr(65+i)}5','') for i in range(11)]
 rows=[[c.get(f'{chr(65+i)}{r}','') for i in range(11)] for r in range(6,138)]
 assert len(rows)==132 and len({r[0] for r in rows})==132 and all(r[0] and r[4] for r in rows)
 counts=dict(Counter(r[3] for r in rows))
 assert counts=={'Fait':44,'Partiel':24,'À faire':39,'À valider':25},counts
 assert [int(float(summary[k])) for k in ['A10','D10','G10']]==[132,44,88]
 if '--tracker-only' in sys.argv:
  data={'version':'33.0.0','base':'55b620f77a4084b2304987aec1c037db37fe1607','columns':columns,'rows':rows,'statusCounts':counts,'scope':'Completed items are limited to the stated acceptance criteria. Local V33 browser evidence is injected-document; native evidence must be read separately in qa/v33/verified.json.'}
  (R/'planning/BACKLOG_V33.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
  with (R/'planning/MANQUANTS_V33.csv').open('w',encoding='utf-8-sig',newline='') as f:
   w=csv.writer(f);w.writerow(columns);w.writerows(rows)
  print('Reviewed tracker:',counts);raise SystemExit(0)
assert (R/'VERSION.txt').read_text().strip()=='33.0.0'
digest=hashlib.sha256((R/'index.html').read_bytes()).hexdigest();assert digest==BUILD
assert (R/'index.html').read_bytes()==(R/'DIVA_PULSE_JOUER.html').read_bytes()
data=json.loads((R/'planning/BACKLOG_V33.json').read_text());assert data['rows']==rows and data['statusCounts']==counts
expected={'feedback':22,'loops':16,'audition':32,'regression-workflow':18,'regression-director':23,'regression-persistence':14,'transactions':11}
for name,count in expected.items():
 report=json.loads((Q/name/'results.json').read_text())
 assert report['version']=='33.0.0' and report['buildSha256']==digest,(name,'build')
 assert report['passed']==count and report['failed']==0 and report.get('failure') is None,(name,report)
 assert len(report['checks'])==count and all(x['passed'] for x in report['checks']) and not report['errors']
 if name=='feedback':assert report['mode']=='http'
 if name in ['loops','audition','regression-workflow']:assert report.get('nativeHTTP') is True,(name,'injected run is not native evidence')
tap=(Q/'logic.tap').read_text();assert re.search(r'^# pass 995$',tap,re.M) and re.search(r'^# fail 0$',tap,re.M)
assert re.search(r'^# skipped 0$',tap,re.M)
assert 'TOTAL 10 PASS' in (Q/'launcher.txt').read_text()
receipt={'version':'33.0.0','buildSha256':digest,'workbookSha256':WORKBOOK,'logicPassed':995,'newLogic':48,'launcherPassed':10,'browserChecks':expected,'browserTotal':sum(expected.values()),'newBrowser':22,'backlogItems':132,'done':44,'open':88,'sheets':15,'scope':'Current feedback/audio tests and persistence use HTTP and native browser APIs. Director regression uses an injected document. Synthetic event-load tests are not physical-device performance or acoustic latency certification.'}
(Q/'verified.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n');print(json.dumps(receipt,ensure_ascii=False,indent=2))
