/* Local image/asset validation. No network fetch is performed by this module. */
(function(root){
'use strict';
function parseTGA(input){
 const b=input instanceof ArrayBuffer?new Uint8Array(input):new Uint8Array(input.buffer,input.byteOffset,input.byteLength);
 const d=new DataView(b.buffer,b.byteOffset,b.byteLength);let o=18;
 const need=n=>{if(n<0||o+n>b.length)throw Error('TGA tronquée.');};
 if(b.length<18)throw Error('En-tête TGA tronqué.');
 const type=b[2],indexed=type===1||type===9,gray=type===3||type===11,rle=type>=9;
 if(![1,2,3,9,10,11].includes(type))throw Error('Type TGA non pris en charge.');
 const width=d.getUint16(12,true),height=d.getUint16(14,true),depth=b[16],desc=b[17],pixels=width*height;
 if(!pixels||pixels>16777216||width>8192||height>8192)throw Error('Dimensions TGA hors limite.');
 if(desc&192)throw Error('TGA entrelacée non prise en charge.');
 if(indexed?![8,16].includes(depth):gray?![8,16].includes(depth):![16,24,32].includes(depth))throw Error('Profondeur TGA non prise en charge.');
 need(b[0]);o+=b[0];const palette=new Map();
 function color(bits,alpha16=false){const bytes=bits/8;need(bytes);let c;if(bits===16){const x=d.getUint16(o,true);c=[Math.round(((x>>10)&31)*255/31),Math.round(((x>>5)&31)*255/31),Math.round((x&31)*255/31),alpha16?(x&32768?255:0):255];}else c=[b[o+2],b[o+1],b[o],bits===32?b[o+3]:255];o+=bytes;return c;}
 if(b[1]){const first=d.getUint16(3,true),count=d.getUint16(5,true),bits=b[7];if(![16,24,32].includes(bits)||!count||first+count>65536)throw Error('Palette TGA invalide.');for(let i=0;i<count;i++)palette.set(first+i,color(bits,false));}
 if(indexed&&!palette.size)throw Error('Palette TGA absente.');
 const data=new Uint8Array(pixels*4);
 function readPixel(){if(indexed){need(depth/8);const index=depth===8?b[o]:d.getUint16(o,true);o+=depth/8;const c=palette.get(index);if(!c)throw Error('Index TGA hors palette.');return c;}if(gray){need(depth/8);const v=b[o],a=depth===16?b[o+1]:255;o+=depth/8;return [v,v,v,a];}return color(depth,!!(desc&15));}
 let i=0;function put(c){const x=i%width,y=Math.floor(i/width),xx=desc&16?width-1-x:x,yy=desc&32?y:height-1-y;data.set(c,(yy*width+xx)*4);i++;}
 while(i<pixels){let count=1,repeat=false;if(rle){need(1);const p=b[o++];count=(p&127)+1;repeat=!!(p&128);}if(i+count>pixels)throw Error('Paquet RLE TGA au-delà de l’image.');if(repeat){const c=readPixel();for(let k=0;k<count;k++)put(c);}else for(let k=0;k<count;k++)put(readPixel());}
 return {width,height,data};
}
function pathKey(x){
 const s=String(x||'').replace(/\\/g,'/');if(/^[a-z]+:|^\/\//i.test(s))throw Error('Chemin de texture externe interdit.');
 const parts=[];for(const p of s.split('/')){if(!p||p==='.')continue;if(p==='..'){if(!parts.length)throw Error('Texture hors du dossier du pack.');parts.pop();}else parts.push(p);}
 return parts.join('/').normalize('NFC').toLowerCase();
}
function resolveTexture(files,modelPath,requested){
 let key,relative;try{const req=String(requested||'').replace(/\\/g,'/');if(!req||/^[a-z]+:|^\//i.test(req)||/[\x00-\x1f]/.test(req))throw Error('Chemin de texture externe interdit.');const dir=String(modelPath||'').replace(/\\/g,'/').split('/').slice(0,-1).join('/');relative=pathKey((dir?dir+'/':'')+req);try{key=pathKey(req);}catch{key=relative;}}catch(e){return {file:null,warning:e.message};}
 const safe=[];for(const f of files){try{safe.push({file:f,key:pathKey(f.name)});}catch{}}
 for(const target of [relative,key]){const matches=safe.filter(f=>f.key===target);if(matches.length===1)return {file:matches[0].file};if(matches.length>1)return {file:null,warning:'Texture ambiguë : '+requested};}
 const base=key.split('/').pop(),matches=safe.filter(f=>f.key.split('/').pop()===base);
 if(matches.length===1)return {file:matches[0].file,warning:'Texture associée par nom seul : '+requested};
 return {file:null,warning:(matches.length?'Texture ambiguë : ':'Texture manquante : ')+requested};
}
function validateModel(m){
 if(!m.vertexCount||m.vertexCount>350000||!m.indices?.length||m.indices.length%3||m.indices.length>1500000)throw Error('Géométrie MMD hors limite ou vide.');
 if(!m.bones?.length||m.bones.length>1024)throw Error('Le runtime attend de 1 à 1024 os.');
 for(const array of [m.positions,m.normals,m.uv,m.weights,m.joints,...[m.sdefC,m.sdefR0,m.sdefR1].filter(Boolean)])for(const v of array)if(!Number.isFinite(v))throw Error('Géométrie MMD non finie.');
 if(m.weightTypes?.some(t=>t===3)&&![m.sdefC,m.sdefR0,m.sdefR1].every(a=>a?.length===m.vertexCount*3))throw Error('Données SDEF manquantes.');
 for(const index of m.indices)if(index<0||index>=m.vertexCount)throw Error('Index de sommet MMD invalide.');
 for(let i=0;i<m.joints.length;i++)if(m.weights[i]>0&&(m.joints[i]<0||m.joints[i]>=m.bones.length))throw Error('Poids lié à un os absent.');
 for(let i=0;i<m.weights.length;i+=4){const sum=m.weights[i]+m.weights[i+1]+m.weights[i+2]+m.weights[i+3];if(Math.abs(sum-1)>.025)throw Error('Somme des poids de sommet invalide.');}for(const mat of m.materials)if(mat.diffuse.some(x=>!Number.isFinite(x)))throw Error('Couleur de matériau non finie.');
 (root.PulseSkeleton||(typeof require==='function'?require('./skeleton.js'):null))?.compile(m.bones);
 const state=new Uint8Array(m.bones.length);
 for(let i=0;i<m.bones.length;i++){let j=i,visited=[];while(j>=0){if(j>=m.bones.length)throw Error('Parent MMD absent.');if(state[j]===1)throw Error('Cycle dans le squelette MMD.');if(state[j]===2)break;state[j]=1;visited.push(j);const b=m.bones[j];if(b.pos.some(v=>!Number.isFinite(v)))throw Error('Position d’os non finie.');j=b.parent;}for(const k of visited)state[k]=2;}
 let total=0;for(const mat of m.materials){if(!Number.isInteger(mat.indexCount)||mat.indexCount<0||mat.indexCount%3)throw Error('Plage de matériau invalide.');total+=mat.indexCount;}
 if(total!==m.indices.length)throw Error('Les matériaux ne couvrent pas les indices.');
 (root.PulseMMDSurface||(typeof require==='function'?require('./mmd-surface.js'):null))?.validate(m);const warnings=[];if(m.weightTypes?.some(t=>t===3||t===4))warnings.push('SDEF/QDEF actifs pour transformations rigides ; fidélité complète sur modèles complexes non certifiée.');
 if(m.morphs?.some(x=>![0,1,2,3,8].includes(x.type)))warnings.push('Morphs UV supplémentaires/flip/impulsion non appliqués.');if(m.morphs?.some(x=>x.type===8))warnings.push('Morphs matériau partiels : diffuse RGBA et teintes texture/sphère actives ; specular, ambient, edge et toon non appliqués.');
 warnings.push('Physique Bullet et soft bodies non intégrés ; toon simplifié.');
 return warnings;
}
root.PulseMMDCompat={parseTGA,pathKey,resolveTexture,validateModel};
if(typeof module!=='undefined')module.exports=root.PulseMMDCompat;
})(typeof window!=='undefined'?window:globalThis);
