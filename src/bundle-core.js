/* V25 binary backup: bounded manifest + individually SHA-256 checked 1 MiB chunks.
   Media are Blob slices, never a library-sized base64 string. This is not a signature. */
(function(root){'use strict';
const C=root.PulseCore||(typeof require==='function'?require('./hash-core.js'):{});
const MAGIC='PULSEB25',HEADER=44,CHUNK=1048576,MAX_BODY=1073741824,MAX_META=16777216;
const abort=signal=>{if(signal?.aborted)throw new DOMException('Opération annulée.','AbortError');};
async function digest(bytes){if(root.crypto?.subtle){const b=await root.crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(b),v=>v.toString(16).padStart(2,'0')).join('');}return C.sha256Hex(bytes);}
async function hashes(blob,{signal,onProgress=()=>{},base=0,total=blob.size}={}){const out=[];for(let i=0;i<blob.size;i+=CHUNK){abort(signal);out.push(await digest(await blob.slice(i,i+CHUNK).arrayBuffer()));onProgress(Math.min(total,base+i+CHUNK),total);await new Promise(r=>setTimeout(r,0));}abort(signal);return out;}
function mediaCheck(rows){if(!Array.isArray(rows)||rows.length>1000)throw Error('Maximum 1 000 médias par sauvegarde.');let total=0;const seen=new Set();for(const a of rows){if(!a||typeof a!=='object'||Array.isArray(a))throw Error('Description média invalide.');for(const [key,limit]of [['name',512],['kind',80],['type',255]])if(typeof a[key]!=='string'||a[key].length>limit)throw Error('Métadonnée média invalide : '+key);if(typeof a.id!=='string'||!a.id||seen.has(a.id))throw Error('Identifiant média invalide ou dupliqué.');seen.add(a.id);if(!Number.isSafeInteger(a.size)||a.size<0)throw Error('Taille de média invalide.');total+=a.size;if(total>MAX_BODY)throw Error('Sauvegarde binaire limitée à 1 Gio de médias.');if(!Array.isArray(a.hashes)||a.hashes.length!==Math.ceil(a.size/CHUNK)||a.hashes.some(h=>typeof h!=='string'||!/^[a-f\d]{64}$/.test(h)))throw Error('Empreintes média invalides.');}return total;}
async function pack(raw,assets,opts={}){
 if(raw?.format!=='DIVA-PULSE-LIBRARY'||!Array.isArray(assets)||assets.length>1000)throw Error('Bibliothèque invalide.');
 const total=assets.reduce((n,a)=>n+(a.blob?.size??MAX_BODY+1),0);if(total>MAX_BODY)throw Error('Sauvegarde binaire limitée à 1 Gio de médias.');
 let done=0;const descriptors=[];for(const a of assets){if(!(a.blob instanceof Blob))throw Error('Média sans contenu.');const hs=await hashes(a.blob,{...opts,base:done,total});done+=a.blob.size;descriptors.push({id:a.id,name:String(a.name||'').slice(0,512),kind:String(a.kind||'').slice(0,80),type:a.blob.type,size:a.blob.size,hashes:hs});}mediaCheck(descriptors);
 const meta={format:'DIVA-PULSE-BUNDLE',version:1,chunkSize:CHUNK,library:{...structuredClone(raw),assets:descriptors}},bytes=new TextEncoder().encode(JSON.stringify(meta));if(bytes.length>MAX_META)throw Error('Métadonnées trop volumineuses.');
 const head=new Uint8Array(HEADER);head.set(new TextEncoder().encode(MAGIC));new DataView(head.buffer).setUint32(8,bytes.length,true);const h=await digest(bytes);head.set(Uint8Array.from(h.match(/../g),s=>parseInt(s,16)),12);abort(opts.signal);
 return new Blob([head,bytes,...assets.map(a=>a.blob)],{type:'application/octet-stream'});
}
async function unpack(file,opts={}){
 if(file.size<HEADER||file.size>HEADER+MAX_META+MAX_BODY)throw Error('Taille de sauvegarde binaire invalide.');abort(opts.signal);
 const head=new Uint8Array(await file.slice(0,HEADER).arrayBuffer());if(new TextDecoder().decode(head.slice(0,8))!==MAGIC)throw Error('Signature .pulsebundle inconnue.');const size=new DataView(head.buffer).getUint32(8,true);if(size>MAX_META||HEADER+size>file.size)throw Error('Longueur du manifeste invalide.');
 const bytes=await file.slice(HEADER,HEADER+size).arrayBuffer(),expected=Array.from(head.slice(12),v=>v.toString(16).padStart(2,'0')).join('');if(await digest(bytes)!==expected)throw Error('Manifeste altéré : empreinte différente.');
 let meta;try{meta=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{throw Error('Manifeste illisible.');}
 if(meta.format!=='DIVA-PULSE-BUNDLE'||meta.version!==1||meta.chunkSize!==CHUNK||meta.library?.format!=='DIVA-PULSE-LIBRARY')throw Error('Format binaire non pris en charge.');const raw=meta.library,total=mediaCheck(raw.assets);if(file.size!==HEADER+size+total)throw Error('Médias tronqués ou données supplémentaires.');
 const blobs=new Map();let at=HEADER+size,done=0;for(const a of raw.assets){const blob=file.slice(at,at+a.size,a.type),hs=await hashes(blob,{...opts,base:done,total});if(hs.some((h,i)=>h!==a.hashes[i]))throw Error('Média altéré : '+a.name);blobs.set(a.id,blob);at+=a.size;done+=a.size;}abort(opts.signal);
 return {raw,blobs,totalBytes:total};
}
const api={MAGIC,HEADER,CHUNK,MAX_BODY,MAX_META,digest,hashes,pack,unpack,mediaCheck};root.PulseBundle=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
