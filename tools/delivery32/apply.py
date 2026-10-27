"""Apply the inspected V31+V32 source delta; every input and output is hashed.
Only known project source paths are allowed. This writes no workflows or secrets.
"""
from pathlib import Path, PurePosixPath
import base64, hashlib, json, lzma, os
R=Path(__file__).resolve().parents[2]
D=Path(__file__).resolve().parent
encoded=''.join((D/f'part{i}.b64').read_text() for i in range(4))
raw=lzma.decompress(base64.b64decode(encoded,validate=True),memlimit=128*1024*1024)
assert len(raw)==85545
assert hashlib.sha256(raw).hexdigest()=='80d895b33192a04045e5c0278925bef7900a7a5a843631ca4d8237bdf024d9e0'
payload=json.loads(raw)
assert payload['base']=='034221662b07d1669fe48ef63c04f65c1f770551' and payload['version']=='32.0.0'
staged=[]
for name,spec in payload['files'].items():
 p=PurePosixPath(name)
 assert not p.is_absolute() and '..' not in p.parts and '\\' not in name
 assert not any(x in ('.git','.github','.env') for x in p.parts)
 assert p.parts[0] in ('src','tests','tools','build.py','VERSION.txt','package.json','manifest.webmanifest','sw.js')
 target=R/name
 assert not target.is_symlink()
 if spec['before'] is None:
  assert not target.exists(),f'Unexpected existing file: {name}'
  old=''
 else:
  before=target.read_bytes()
  assert hashlib.sha256(before).hexdigest()==spec['before'],f'Base changed: {name}'
  old=before.decode('utf-8')
 out=[]
 for edit in spec['delta']:
  if isinstance(edit,str):out.append(edit)
  else:
   assert isinstance(edit,list) and len(edit)==2
   a,b=edit
   assert isinstance(a,int) and isinstance(b,int) and 0<=a<=b<=len(old)
   out.append(old[a:b])
 data=''.join(out).encode('utf-8')
 assert hashlib.sha256(data).hexdigest()==spec['after'],f'Output mismatch: {name}'
 staged.append((target,data))
assert len(staged)==29
for target,data in staged:
 target.parent.mkdir(parents=True,exist_ok=True)
 tmp=target.with_name(target.name+'.delivery32.tmp')
 tmp.write_bytes(data);os.replace(tmp,target)
print('Applied 29 reviewed source files with matching pre/post hashes.')
