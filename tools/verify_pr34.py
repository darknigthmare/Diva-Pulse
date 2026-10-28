"""V34 independent gate: exact build, exact workbook, freshly executed evidence.
Read workbook XML only; no spreadsheet conversion or mutation is performed."""
from pathlib import Path
from collections import Counter
import hashlib,json,re,zipfile,xml.etree.ElementTree as ET
R=Path(__file__).resolve().parents[1];Q=R/'qa/v34'
W=R/'planning/DIVA_PULSE_MANQUANTS_V34.xlsx'
WORKBOOK='cc26466281078c00bddb86272cba432edf715295c1c2cea74cd3c8acc735a359'
assert hashlib.sha256(W.read_bytes()).hexdigest()==WORKBOOK
ns={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
with zipfile.ZipFile(W) as z:
 assert len(ET.fromstring(z.read('xl/workbook.xml')).find('s:sheets',ns))==17
 strings=[''.join(si.itertext())for si in ET.fromstring(z.read('xl/sharedStrings.xml'))] if 'xl/sharedStrings.xml'in z.namelist() else []
 def cells(name):
  out={}
  for c in ET.fromstring(z.read(name)).findall('.//s:sheetData/s:row/s:c',ns):
   assert c.attrib.get('t')!='e','Formula error'
   v=c.find('s:v',ns);value=v.text if v is not None else ''
   if c.attrib.get('t')=='inlineStr':value=''.join(t.text or '' for t in c.findall('.//s:t',ns))
   elif c.attrib.get('t')=='s':value=strings[int(value)]
   out[c.attrib['r']]=value or ''
  return out
 c=cells('xl/worksheets/sheet2.xml');summary=cells('xl/worksheets/sheet1.xml')
 rows=[[c.get(f'{chr(65+i)}{n}','')for i in range(11)]for n in range(6,142)]
 assert len({r[0]for r in rows})==136 and all(r[0]and r[4]for r in rows)
 counts=dict(Counter(r[3]for r in rows));assert counts=={'Fait':49,'Partiel':25,'À faire':37,'À valider':25}
 assert [int(float(summary[k]))for k in ['A10','D10','G10']]==[136,49,87]
backlog=json.loads((R/'planning/BACKLOG_V34.json').read_text());assert backlog['rows']==rows and backlog['statusCounts']==counts
version=(R/'VERSION.txt').read_text().strip();assert version=='34.0.0'
digest=hashlib.sha256((R/'index.html').read_bytes()).hexdigest()
assert (R/'index.html').read_bytes()==(R/'DIVA_PULSE_JOUER.html').read_bytes()
expected={'vault-live':28,'feedback':22,'loops':16,'audition':32,'regression-workflow':18,'regression-director':23,'regression-persistence':14,'transactions':11}
for name,count in expected.items():
 r=json.loads((Q/name/'results.json').read_text())
 assert r['version']==version and r['buildSha256']==digest,(name,'build')
 assert r['passed']==count and r['failed']==0 and not r['failure'] and not r['errors'],(name,r)
 assert len(r['checks'])==count and all(x['passed']for x in r['checks'])
 if name in ['vault-live','feedback']:assert r['mode']=='http'
 if name=='vault-live':assert r['nativeAbortExecuted']is True
 if name in ['loops','audition']:assert r['nativeHTTP']is True
 if name=='regression-workflow':assert r['documentMode']is False
text=(Q/'logic.tap').read_text()
for field,n in [('pass',1042),('fail',0),('skipped',0),('cancelled',0)]:assert re.search(r'^# '+field+' '+str(n)+r'$',text,re.M)
assert 'TOTAL 10 PASS' in (Q/'launcher.txt').read_text()
receipt={'version':version,'buildSha256':digest,'workbookSha256':WORKBOOK,'logicPassed':1042,'newLogic':47,'launcherPassed':10,'browserChecks':expected,'browserTotal':sum(expected.values()),'backlogItems':136,'done':49,'open':87,'sheets':17,'scope':'HTTP/IndexedDB for current flows, native abort after deletion. 23 Director regression checks use injected document. Real Web Audio API but software GPU, no acoustic or physical-device certification.'}
(Q/'verified.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n');print(json.dumps(receipt,indent=2))
