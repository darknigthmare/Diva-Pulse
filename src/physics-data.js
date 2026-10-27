/* V27: bounded PMX/PMD physics-tail reader. The renderer never executes unknown records. */
(function (root) {
'use strict';
const MAX_BODIES=4096, MAX_JOINTS=8192;
function reader(buffer, offset, encoding) {
 const view=new DataView(buffer), bytes=new Uint8Array(buffer);let at=offset;
 const need=n=>{if(!Number.isSafeInteger(n)||n<0||at+n>bytes.length)throw Error('Bloc physique MMD tronqué.');};
 const api={get at(){return at},get left(){return bytes.length-at},need,skip:n=>{need(n);at+=n},u:()=>{need(1);return view.getUint8(at++)},u16:()=>{need(2);const n=view.getUint16(at,true);at+=2;return n},i:()=>{need(4);const n=view.getInt32(at,true);at+=4;return n},u32:()=>{need(4);const n=view.getUint32(at,true);at+=4;return n},f:()=>{need(4);const x=view.getFloat32(at,true);at+=4;if(!Number.isFinite(x))throw Error('Paramètre physique MMD non fini.');return x}};
 api.index=(size)=>{need(size);const n=size===1?view.getInt8(at):size===2?view.getInt16(at,true):view.getInt32(at,true);at+=size;return n};
 api.fixed=n=>{need(n);const value=new TextDecoder('shift-jis').decode(bytes.subarray(at,at+n)).replace(/\0.*$/s,'').trim();at+=n;return value};
 api.string=()=>{const n=api.i();if(n<0||n>1048576)throw Error('Nom physique MMD hors limite.');need(n);const s=new TextDecoder(encoding).decode(bytes.subarray(at,at+n));at+=n;return s};
 api.vec=()=>[api.f(),api.f(),api.f()];
 api.count=(max,minBytes=0)=>{const n=api.i();if(n<0||n>max||(minBytes&&n>api.left/minBytes))throw Error('Nombre de données physiques MMD hors limite.');return n};
 return api;
}
const position=v=>[v[0],v[1],-v[2]], rotation=v=>[-v[0],-v[1],v[2]];
function range(lo,hi,angular){if(lo.some((x,i)=>x>hi[i]))throw Error('Bornes d’articulation MMD inversées.');return angular?{min:[-hi[0],-hi[1],lo[2]],max:[-lo[0],-lo[1],hi[2]]}:{min:[lo[0],lo[1],-hi[2]],max:[hi[0],hi[1],-lo[2]]};}
function validateBody(b,bones){
 if(b.bone< -1||b.bone>=bones.length||!Number.isInteger(b.bone))throw Error('Corps physique lié à un os absent.');
 if(b.group>15||b.shape>2||b.mode>2)throw Error('Type ou groupe de corps physique inconnu.');
 if(b.size.some(x=>x<0||x>100000)||b.size[0]<=0||(b.shape===1&&b.size.some(x=>x<=0)))throw Error('Dimensions de collision invalides.');
 if(b.mass<0||b.mass>1000000||b.linearDamping<0||b.linearDamping>1||b.angularDamping<0||b.angularDamping>1||b.restitution<0||b.restitution>1||b.friction<0||b.friction>10000)throw Error('Masse, amortissement ou friction hors limite.');
 if([...b.position,...b.rotation].some(x=>Math.abs(x)>1000000))throw Error('Transformation physique hors limite.');return b;
}
function readBody(r,{pmd=false,boneSize=2,bones=[]}={}){
 const name=pmd?r.fixed(20):r.string(), nameEn=pmd?'':r.string();
 let bone=pmd?r.u16():r.index(boneSize);if(pmd&&bone===65535)bone=-1;
 const group=r.u(),mask=r.u16(),shape=r.u(),size=r.vec(),p=position(r.vec()),rot=rotation(r.vec());
 if(pmd&&bones[bone])for(let k=0;k<3;k++)p[k]+=bones[bone].pos[k];
 return validateBody({name,nameEn,bone,group,mask,shape,size,position:p,rotation:rot,mass:r.f(),linearDamping:r.f(),angularDamping:r.f(),restitution:r.f(),friction:r.f(),mode:r.u()},bones);
}
function readJoint(r,{pmd=false,rigidSize=2,bodies=[]}={}){
 const name=pmd?r.fixed(20):r.string(),nameEn=pmd?'':r.string(),type=pmd?0:r.u();
 if(type>5)throw Error('Type d’articulation MMD inconnu.');
 const a=pmd?r.u32():r.index(rigidSize),b=pmd?r.u32():r.index(rigidSize);
 if([a,b].some(n=>n< -1||n>=bodies.length))throw Error('Articulation liée à un corps absent.');
 const p=position(r.vec()),rot=rotation(r.vec()),linear=range(r.vec(),r.vec(),false),angular=range(r.vec(),r.vec(),true),springPosition=r.vec(),springRotation=r.vec();
 if([...springPosition,...springRotation].some(x=>x<0||x>10000000))throw Error('Raideur d’articulation hors limite.');
 return {name,nameEn,type,a,b,position:p,rotation:rot,linear,angular,springPosition,springRotation};
}
function readPmx(buffer,offset,info){
 const r=reader(buffer,offset,info.enc),out={bodies:[],joints:[],softBodies:0,trailingBytes:0,warnings:[],format:'pmx'};
 // Old diagnostic models were permitted to end directly after morphs. Keep that compatibility.
 if(!r.left)return out;
 const frames=r.count(10000,13);for(let i=0;i<frames;i++){r.string();r.string();r.u();const n=r.count(100000,2);for(let k=0;k<n;k++){const tag=r.u();if(tag>1)throw Error('Groupe d’affichage PMX invalide.');r.index(tag?info.morphSize:info.boneSize);}}
 if(!r.left)return out;
 const nb=r.count(MAX_BODIES,62);for(let i=0;i<nb;i++)out.bodies.push(readBody(r,{boneSize:info.boneSize,bones:info.bones}));
 if(!r.left){if(nb)out.warnings.push('Table d’articulations absente.');return out;}
 const nj=r.count(MAX_JOINTS,107);for(let i=0;i<nj;i++)out.joints.push(readJoint(r,{rigidSize:info.rigidSize,bodies:out.bodies}));
 if(info.version>2.05&&r.left){out.softBodies=r.count(4096);if(out.softBodies)out.warnings.push('Corps souples PMX 2.1 non simulés.');}
 out.trailingBytes=r.left;
 if(out.joints.some(j=>j.type!==0))out.warnings.push('Seules les articulations ressort 6 axes (type 0) sont utilisées par la dynamique secondaire.');
 return out;
}
function readPmd(buffer,offset,info){
 const r=reader(buffer,offset,'shift-jis'),out={bodies:[],joints:[],softBodies:0,trailingBytes:0,warnings:[],format:'pmd'};
 if(!r.left)return out;
 const morphDisplays=r.u();r.skip(morphDisplays*2);const frames=r.u();r.skip(frames*50);const displayCount=r.count(100000,3);r.skip(displayCount*3);
 if(!r.left)return out;
 const english=r.u();if(english>1)throw Error('En-tête anglais PMD invalide.');if(english)r.skip(20+256+info.bones.length*20+Math.max(0,info.rawMorphCount-1)*20+frames*50);
 if(!r.left)return out;
 r.skip(1000);if(!r.left)return out;
 const nb=r.count(MAX_BODIES,83);for(let i=0;i<nb;i++)out.bodies.push(readBody(r,{pmd:true,bones:info.bones}));
 if(!r.left){if(nb)out.warnings.push('Table d’articulations absente.');return out;}
 const nj=r.count(MAX_JOINTS,124);for(let i=0;i<nj;i++)out.joints.push(readJoint(r,{pmd:true,bodies:out.bodies}));out.trailingBytes=r.left;return out;
}
root.PulsePhysicsData={readPmx,readPmd,range,validateBody,MAX_BODIES,MAX_JOINTS};
if(typeof module!=='undefined')module.exports=root.PulsePhysicsData;
})(typeof window!=='undefined'?window:globalThis);
