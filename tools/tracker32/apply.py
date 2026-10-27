"""Transport the inspected workbook and notes byte-for-byte into PR #1.
Workbook content was edited with artifact_tool; this reconstructs hashed bytes.
"""
from pathlib import Path, PurePosixPath
import base64,hashlib,io,json,lzma,os,zipfile
R=Path(__file__).resolve().parents[2];T=Path(__file__).resolve().parent
sha=lambda b:hashlib.sha256(b).hexdigest()
def unpack(encoded,expected,size):
 raw=lzma.decompress(base64.b64decode(encoded,validate=True),memlimit=128*1024*1024)
 assert len(raw)==size and sha(raw)==expected,'Transport digest mismatch'
 return json.loads(raw)
p=unpack(''.join((T/f'part{i}.b64').read_text() for i in range(5)),'789840fb8376b0f7a2f2df397a25f44d225295e3d83ec43d199b584c8721d93a',291588)
c=unpack((T/'correction.b64').read_text(),'ddf931cb6fe1f6383a9d456352adb830be26c45dd31f579070d40fda2cd6c236',59098)
assert p['base']=='f4fa7d6d4baca70313d63622e8e7f0434c89ef97'
def reconstruct(old,spec):
 if spec['before'] is not None:assert sha(old.encode())==spec['before'],'Input bytes changed'
 else:assert old==''
 pieces=[]
 for item in spec['delta']:
  if isinstance(item,str):pieces.append(item)
  else:
   assert isinstance(item,list) and len(item)==2
   a,b=item;assert type(a)==type(b)==int and 0<=a<=b<=len(old)
   pieces.append(old[a:b])
 value=''.join(pieces)
 if 'after' in spec:assert sha(value.encode())==spec['after'],'Output mismatch'
 return value
old=(R/'planning/DIVA_PULSE_MANQUANTS_V30.xlsx').read_bytes()
assert sha(old)==p['baseWorkbookSha256']
entries={}
with zipfile.ZipFile(io.BytesIO(old)) as z:
 for name,spec in p['book'].items():
  path=PurePosixPath(name);assert not path.is_absolute() and '..' not in path.parts
  text=z.read(name).decode() if name in z.namelist() else ''
  entries[name]=reconstruct(text,spec)
for name,spec in c['book'].items():entries[name]=reconstruct(entries[name],spec)
output=io.BytesIO()
with zipfile.ZipFile(output,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for name,text in entries.items():
  info=zipfile.ZipInfo(name,(2026,10,27,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o600<<16
  z.writestr(info,text.encode(),compress_type=zipfile.ZIP_DEFLATED,compresslevel=6)
book=output.getvalue();assert sha(book)==c['workbookSha256']=='0fd254363bfee19542f77fe60e030655b7cc85673983d862c893bb0aac353d01'
files=p['files']
assert set(files)=={'planning/BACKLOG_V32.json','planning/MANQUANTS_V32.csv','planning/V32_RELEASE.json','planning/README.md','docs/V32_BOUCLES_SAUVEGARDES.md','tools/verify_pr32.py'}
for name,spec in c['files'].items():files[name]=reconstruct(files[name],spec)
staged={name:text.encode() for name,text in files.items()}
staged['planning/DIVA_PULSE_MANQUANTS_V32.xlsx']=book
for name,data in staged.items():
 target=R/name;assert not target.is_symlink();target.parent.mkdir(parents=True,exist_ok=True)
 tmp=target.with_name(target.name+'.transfer.tmp');tmp.write_bytes(data);os.replace(tmp,target)
print('Verified workbook and six documentation files reconstructed. Workbook SHA-256:',sha(book))
