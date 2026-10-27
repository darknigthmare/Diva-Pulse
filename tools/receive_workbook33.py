"""Byte-only delivery of a reviewed artifact_tool workbook.
No cells/styles/formulas are generated here: the patch restores the inspected
XML byte-for-byte. Zstd uses the tracked V32 workbook as its local dictionary.
No URL, credential or external service is involved.
"""
from pathlib import Path
import base64,hashlib,subprocess,tempfile,zipfile
R=Path(__file__).resolve().parents[1]
BASE='0fd254363bfee19542f77fe60e030655b7cc85673983d862c893bb0aac353d01'
DELTA='e96cb631324d8e10c318069bda4022d912d386db30142fade0821697febfc545'
STORED='68d51583b645c2811aa04c01d0bbd33f8dd2ea5b8e78b5cc99fa3cd105451745'
FINAL='79aca4e1a1f8835a3b70e82ed40956b12d62f647a3aeafb47f94595f92768565'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def repack(src,dest,method):
 with zipfile.ZipFile(src) as a,zipfile.ZipFile(dest,'w',compression=method,compresslevel=9 if method else None) as b:
  assert len(a.infolist())<=60 and sum(i.file_size for i in a.infolist())<2_000_000
  for i in a.infolist():
   assert not i.filename.startswith('/') and '..' not in Path(i.filename).parts and '\\' not in i.filename
   assert i.file_size<1_000_000
   zi=zipfile.ZipInfo(i.filename,(2026,10,27,0,0,0));zi.external_attr=0o644<<16;zi.create_system=3;zi.compress_type=method
   b.writestr(zi,a.read(i),compresslevel=9 if method else None)
base=R/'planning/DIVA_PULSE_MANQUANTS_V32.xlsx'
assert sha(base)==BASE,'The reviewed workbook base changed; stop instead of overwriting it.'
encoded=(R/'tools/data/workbook33.zst.b64').read_text().strip()
assert len(encoded)<20000
# Correct one identified duplicated transport token; the original digest below
# remains mandatory, so this cannot silently change any workbook content.
encoded=encoded.replace('N7GhaJuJu42','N7GhaJu42')
patch=base64.b64decode(encoded,validate=True)
assert hashlib.sha256(patch).hexdigest()==DELTA
with tempfile.TemporaryDirectory(prefix='diva-workbook33-') as tmp:
 tmp=Path(tmp);a=tmp/'base.zip';b=tmp/'reviewed.zip';p=tmp/'delta.zst';out=tmp/'final.xlsx'
 repack(base,a,zipfile.ZIP_STORED);p.write_bytes(patch)
 assert sha(a)=='366f96567ce2475274db790cd37cdb9f58b5f17dcf4ab1dd8f860a47376826fe'
 subprocess.run(['zstd','--patch-from='+str(a),'-d',str(p),'-o',str(b)],check=True,timeout=30)
 assert sha(b)==STORED
 repack(b,out,zipfile.ZIP_DEFLATED);assert sha(out)==FINAL
 dest=R/'planning/DIVA_PULSE_MANQUANTS_V33.xlsx';dest.write_bytes(out.read_bytes())
print('Reviewed V33 workbook restored:',FINAL)
