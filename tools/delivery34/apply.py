"""One-time, hash-checked delivery. Patch is plain text; workbook data is never
executed. Reconstructs the exact artifact_tool export rather than editing cells."""
from pathlib import Path, PurePosixPath
import base64,csv,hashlib,io,json,subprocess,zlib,zipfile
R=Path(__file__).resolve().parents[2];T=Path(__file__).resolve().parent
sha=lambda b:hashlib.sha256(b).hexdigest()
subprocess.run(['git','merge-base','--is-ancestor','093e80b64d2bc14a0990f067fab007a6e94e7647','HEAD'],cwd=R,check=True)
assert (R/'VERSION.txt').read_text().strip()=='33.0.0','Already integrated or different source'
patch=b''.join((T/f'source-{i}.patch').read_bytes() for i in range(1,6))
# Normalize the single identified transcription in the transport, then require
# the original reviewed patch hash. This does not change the reviewed sources.
patch=patch.replace(b'v.clean(r=await other.review()',b'v.clean(await other.review()')
assert sha(patch)=='97354475b49c9d42290dc287bd63dee5be511b925d695c28cc075587a02d267f','Source transfer mismatch'
paths=[]
for line in patch.decode().splitlines():
 if line.startswith('+++ b/'):
  name=line[6:];p=PurePosixPath(name)
  assert not p.is_absolute() and '..' not in p.parts and '\\' not in name
  assert p.parts[0] in {'src','tests','tools','docs','planning','README.md','VERSION.txt','build.py','manifest.webmanifest','package.json','sw.js'}
  assert name not in paths;paths.append(name)
subprocess.run(['git','apply','--check','-'],cwd=R,input=patch,check=True)
subprocess.run(['git','apply','-'],cwd=R,input=patch,check=True)
# Native IDB returns the same object-store wrapper on repeated access. The test
# intentionally aborts once; duplicate instrumentation must not abort it twice.
test=R/'tests/v34_browser_test.py';text=test.read_text()
old="req.addEventListener('success',()=>{aborted=true;tx.abort();},{once:true});"
new="req.addEventListener('success',()=>{if(aborted)return;aborted=true;tx.abort();},{once:true});"
assert text.count(old)==1
test.write_text(text.replace(old,new))
base=R/'planning/BACKLOG_V33.json'
assert sha(base.read_bytes())=='85124106390d65f8c7d4f54b4a7a04abf4e336338469b54ad5b9f45da18dc1cb'
a=json.loads(base.read_text());u=json.loads((T/'tracking.json').read_text());updates={r[0]:r for r in u.pop('replacementRows')}
rows=[updates.pop(r[0],r)for r in a['rows']]+list(updates.values())
out={k:rows if k=='rows'else u[k]for k in a};data=(json.dumps(out,ensure_ascii=False,indent=2)+'\n').encode()
assert sha(data)=='c7474fcdd6d8df490e07418a273f0f65dca8ac49bd5fe059164116c901c49a9f'
(R/'planning/BACKLOG_V34.json').write_bytes(data)
with (R/'planning/MANQUANTS_V34.csv').open('w',encoding='utf-8-sig',newline='') as f:
 w=csv.writer(f);w.writerow(out['columns']);w.writerows(rows)
encoded=''.join((T/f'workbook-{i}.b64').read_text().strip()for i in range(1,5));assert len(encoded)==12692
compressed=base64.b64decode(encoded,validate=True);dec=zlib.decompressobj();raw=dec.decompress(compressed,100000)
assert dec.eof and not dec.unconsumed_tail and sha(raw)=='641900ae92b617d93060d09831678a34cbf6161a4baa7afa271d772366f65248'
recipe=json.loads(raw);assert recipe['format']=='DIVA-XLSX-DELTA-1'
old=R/'planning/DIVA_PULSE_MANQUANTS_V33.xlsx';assert sha(old.read_bytes())==recipe['baseSha256']
new=R/'planning/DIVA_PULSE_MANQUANTS_V34.xlsx';assert len(recipe['entries'])<100
with zipfile.ZipFile(old) as za,zipfile.ZipFile(new,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as zb:
 for name,spec in recipe['entries'].items():
  p=PurePosixPath(name);assert not p.is_absolute()and '..'not in p.parts and '\\'not in name
  data=za.read(name)if name in za.namelist()else b''
  if not spec.get('copy'):
   chunks=[]
   for op in spec['ops']:
    if isinstance(op,list):
     assert len(op)==2 and all(type(i)is int for i in op)and op[0]>=0 and op[1]>=0 and sum(op)<=len(data)
     chunks.append(data[op[0]:sum(op)])
    else:assert isinstance(op,str);chunks.append(op.encode())
   data=b''.join(chunks);assert len(data)<5000000 and sha(data)==spec['sha256']
  info=zipfile.ZipInfo(name,date_time=(2026,10,27,0,0,0));info.create_system=3;info.external_attr=0o600<<16;info.compress_type=zipfile.ZIP_DEFLATED
  zb.writestr(info,data,compress_type=zipfile.ZIP_DEFLATED,compresslevel=9)
assert sha(new.read_bytes())=='cc26466281078c00bddb86272cba432edf715295c1c2cea74cd3c8acc735a359'
Q=R/'qa/v34';Q.mkdir(parents=True,exist_ok=True);(Q/'delivery-paths.json').write_text(json.dumps(paths+['planning/BACKLOG_V34.json','planning/MANQUANTS_V34.csv','planning/DIVA_PULSE_MANQUANTS_V34.xlsx','index.html','DIVA_PULSE_JOUER.html','qa/v34']))
print('Reviewed source patch, tracker and exact workbook reconstructed.')
