/* V21 bounded local ZIP reader. Only data files are returned; no code is run. */
(function(root){'use strict';
const MB=1024*1024,MAX={archive:180*MB,total:180*MB,file:80*MB,entries:1200,files:200};
const EXT=/\.(pmx|pmd|vmd|vpd|png|jpe?g|bmp|tga|sph|spa|webp)$/i;
const CRC_TABLE=Uint32Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function crc32(b){let crc=0xffffffff;for(const v of b)crc=CRC_TABLE[(crc^v)&255]^(crc>>>8);return (crc^0xffffffff)>>>0;}
function safePath(s){s=String(s).replace(/\\/g,'/');if(!s||s.length>1024||/[\x00-\x1f\x7f]/.test(s)||/^\/|^[a-z]:|^[a-z]+:/i.test(s)||s.split('/').includes('..'))throw Error('Chemin ZIP non sûr : '+s.slice(0,80));return s.split('/').filter(p=>p&&p!=='.').join('/').normalize('NFC');}
function decodeName(bytes,flags,encoding){if(flags&2048||encoding==='utf-8')return new TextDecoder('utf-8',{fatal:true}).decode(bytes);if(encoding==='auto'){try{return new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{}}return new TextDecoder(encoding==='auto'?'shift-jis':encoding,{fatal:true}).decode(bytes);}
function listZip(input,{encoding='auto',limits={}}={}){
 const L={...MAX,...limits},b=input instanceof Uint8Array?input:new Uint8Array(input),d=new DataView(b.buffer,b.byteOffset,b.byteLength);
 if(b.length<22||b.length>L.archive)throw Error('ZIP vide, invalide ou au-delà de 180 Mo.');
 const need=(o,n)=>{if(o<0||n<0||o+n>b.length)throw Error('Archive ZIP tronquée.');};let end=-1;
 for(let o=b.length-22;o>=Math.max(0,b.length-65557);o--)if(d.getUint32(o,true)===0x06054b50&&o+22+d.getUint16(o+20,true)===b.length){end=o;break;}
 if(end<0)throw Error('ZIP non reconnu. Décompresse les RAR/7z avant d’importer leur dossier.');
 const count=d.getUint16(end+10,true),size=d.getUint32(end+12,true),start=d.getUint32(end+16,true);
 if(d.getUint16(end+4,true)||d.getUint16(end+6,true)||d.getUint16(end+8,true)!==count)throw Error('ZIP multi-volumes non pris en charge.');
 if(count===65535||size===0xffffffff||start===0xffffffff)throw Error('ZIP64 non pris en charge ; importer le dossier décompressé.');
 if(count>L.entries||start+size>end)throw Error('Répertoire ZIP hors limite.');
 let o=start,total=0,kept=0;const names=new Set(),entries=[],ignored=[];
 for(let i=0;i<count;i++){
  need(o,46);if(d.getUint32(o,true)!==0x02014b50)throw Error('Répertoire ZIP corrompu.');
  const flags=d.getUint16(o+8,true),method=d.getUint16(o+10,true),crc=d.getUint32(o+16,true),compressed=d.getUint32(o+20,true),length=d.getUint32(o+24,true),nl=d.getUint16(o+28,true),el=d.getUint16(o+30,true),cl=d.getUint16(o+32,true),local=d.getUint32(o+42,true),attrs=d.getUint32(o+38,true);
  need(o+46,nl+el+cl);if(flags&1||flags&64)throw Error('ZIP protégé par mot de passe non pris en charge.');
  if([compressed,length,local].includes(0xffffffff))throw Error('Entrée ZIP64 non prise en charge.');
  if(((attrs>>>16)&0xf000)===0xa000)throw Error('Liens symboliques ZIP refusés.');
  let raw=decodeName(b.subarray(o+46,o+46+nl),flags,encoding);
  // Info-ZIP Unicode Path, trusted only with its CRC of the original name.
  for(let x=o+46+nl;x<o+46+nl+el;){if(x+4>o+46+nl+el)throw Error('Champ ZIP incomplet.');const tag=d.getUint16(x,true),n=d.getUint16(x+2,true);x+=4;if(x+n>o+46+nl+el)throw Error('Champ ZIP tronqué.');if(tag===0x7075&&n>=5&&b[x]===1&&d.getUint32(x+1,true)===crc32(b.subarray(o+46,o+46+nl)))raw=new TextDecoder('utf-8',{fatal:true}).decode(b.subarray(x+5,x+n));x+=n;}
  const name=safePath(raw),key=name.toLowerCase();o+=46+nl+el+cl;
  if(raw.endsWith('/'))continue;if(names.has(key))throw Error('Chemin dupliqué dans le ZIP : '+name);names.add(key);
  total+=length;if(total>L.total||length>L.file)throw Error('Taille décompressée du ZIP hors limite.');
  const keep=EXT.test(name)&&!name.startsWith('__MACOSX/')&&!name.split('/').some(p=>p.startsWith('._'));
  if(!keep){ignored.push(name);continue;}if(++kept>L.files)throw Error('Le pack dépasse 200 fichiers MMD/textures.');
  if(![0,8].includes(method))throw Error('Compression ZIP non prise en charge : '+method+'. Importer le dossier décompressé.');
  need(local,30);if(d.getUint32(local,true)!==0x04034b50)throw Error('En-tête ZIP local absent.');
  const lf=d.getUint16(local+6,true),lm=d.getUint16(local+8,true),ln=d.getUint16(local+26,true),le=d.getUint16(local+28,true),data=local+30+ln+le;
  need(local+30,ln+le);if(lf!==flags||lm!==method||ln!==nl||!b.subarray(local+30,local+30+ln).every((v,k)=>v===b[o-46-nl-el-cl+46+k]))throw Error('En-têtes ZIP incohérents.');
  if(data+compressed>start)throw Error('Données ZIP hors de leur zone.');need(data,compressed);
  entries.push({name,flags,method,crc,length,compressed,data});
 }
 if(o!==start+size)throw Error('Taille du répertoire ZIP incohérente.');
 return {entries,ignored,total,bytes:b,encoding};
}
async function inflateBounded(b,expected,signal){
 if(signal?.aborted)throw Error('Import annulé.');let ds;try{ds=new DecompressionStream('deflate-raw');}catch{throw Error('Ce navigateur ne décompresse pas le ZIP. Décompresse-le puis importe son dossier.');}
 const reader=new Blob([b]).stream().pipeThrough(ds).getReader(),chunks=[];let size=0;
 try{for(;;){if(signal?.aborted)throw Error('Import annulé.');const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>expected||size>MAX.file)throw Error('ZIP : taille décompressée différente de l’en-tête.');chunks.push(value);}}catch(e){await reader.cancel().catch(()=>{});throw e;}
 if(size!==expected)throw Error('ZIP tronqué après décompression.');const out=new Uint8Array(size);let o=0;for(const c of chunks){out.set(c,o);o+=c.length;}return out;
}
async function unpackZip(file,opts={}){
 if(file.size>MAX.archive)throw Error('Archive limitée à 180 Mo.');const z=listZip(await file.arrayBuffer(),opts),files=[];
 for(const e of z.entries){if(opts.signal?.aborted)throw Error('Import annulé.');let b=z.bytes.subarray(e.data,e.data+e.compressed);if(e.method===8)b=await inflateBounded(b,e.length,opts.signal);if(b.length!==e.length||crc32(b)!==e.crc)throw Error('Intégrité ZIP incorrecte : '+e.name);
  const f=new File([b],e.name.split('/').pop(),{type:'application/octet-stream'});Object.defineProperty(f,'webkitRelativePath',{value:e.name});files.push(f);opts.progress?.(files.length,z.entries.length);await new Promise(r=>setTimeout(r,0));
 }
 return {files,ignored:z.ignored,archive:file.name,encoding:z.encoding,bytes:z.total};
}
root.PulseMMDPackage={MAX,EXT,crc32,safePath,listZip,unpackZip};if(typeof module!=='undefined')module.exports=root.PulseMMDPackage;
})(globalThis);
