const zlib=require('node:zlib'),fs=require('node:fs'),path=require('node:path'),F=require('./v19-fixtures.cjs'),P=require('../src/mmd-package.js');
function zip(entries,{flags=2048,method=8}={}){
 let offset=0;const body=[],central=[];
 for(const e of entries){const raw=Buffer.from(e.data),name=Buffer.isBuffer(e.name)?e.name:Buffer.from(e.name),m=e.method??method,fl=e.flags??flags,data=m===8?zlib.deflateRawSync(raw):raw,crc=P.crc32(raw),l=Buffer.alloc(30),c=Buffer.alloc(46);
 l.writeUInt32LE(0x04034b50);l.writeUInt16LE(20,4);l.writeUInt16LE(fl,6);l.writeUInt16LE(m,8);l.writeUInt32LE(crc,14);l.writeUInt32LE(data.length,18);l.writeUInt32LE(raw.length,22);l.writeUInt16LE(name.length,26);
 c.writeUInt32LE(0x02014b50);c.writeUInt16LE(20,4);c.writeUInt16LE(20,6);c.writeUInt16LE(fl,8);c.writeUInt16LE(m,10);c.writeUInt32LE(crc,16);c.writeUInt32LE(data.length,20);c.writeUInt32LE(raw.length,24);c.writeUInt16LE(name.length,28);c.writeUInt32LE(offset,42);body.push(l,name,data);central.push(c,name);offset+=30+name.length+data.length;
 }
 const cd=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(entries.length,8);end.writeUInt16LE(entries.length,10);end.writeUInt32LE(cd.length,12);end.writeUInt32LE(offset,16);return Buffer.concat([...body,cd,end]);
}
const entries=()=>[
 {name:'PULSE_PACK/models/BOT_A.pmd',data:F.pmd({robot:true,name:'Pulse bot A',texture:'../tex/DIAG.tga'})},
 {name:'PULSE_PACK/models/BOT_B.pmd',data:F.pmd({robot:true,second:true,name:'Pulse bot B',texture:'../tex/DIAG.tga'})},
 {name:'PULSE_PACK/tex/DIAG.tga',data:F.tga()},
 {name:'PULSE_PACK/motions/DANSE.vmd',data:F.vmd()},
 {name:'PULSE_PACK/README.txt',data:Buffer.from('Original DIVA PULSE technical fixtures. Not a final Vocaloid model. No proprietary model included.')}
];
if(require.main===module){const r=path.join(__dirname,'../examples/v21');fs.mkdirSync(r,{recursive:true});fs.writeFileSync(path.join(r,'TROUPE_ORIGINALE_V21.zip'),zip(entries()));fs.writeFileSync(path.join(r,'TEXTURE_MANQUANTE_V21.zip'),zip(entries().filter(e=>!e.name.endsWith('.tga'))));fs.writeFileSync(path.join(r,'MODEL_INVALIDE_V21.zip'),zip([{name:'invalid.pmx',data:Buffer.from('Not a model')}]))}
module.exports={zip,entries};
function largePmd(count=300){
 const b=F.pmd({texture:''}),nv=b.readUInt32LE(283),oi=287+nv*38,ni=b.readUInt32LE(oi),om=oi+4+ni*2,nm=b.readUInt32LE(om),ob=om+4+nm*70,nb=b.readUInt16LE(ob),head=Buffer.from(b.subarray(0,ob)),number=Buffer.alloc(2),bones=[];number.writeUInt16LE(count);
 for(let i=0;i<nv;i++){head.writeUInt16LE(count-1,287+i*38+32);head.writeUInt16LE(count-1,287+i*38+34);}
 for(let i=0;i<count;i++){const bone=Buffer.alloc(39);bone.write(i===count-1?'head':'b'+i);bone.writeUInt16LE(65535,20);bone.writeUInt16LE(65535,22);bones.push(bone);}
 return Buffer.concat([head,number,...bones,b.subarray(ob+2+nb*39)]);
}
module.exports.largePmd=largePmd;
if(require.main===module){const r=path.join(__dirname,'../examples/v21');const v=F.vmd();v.writeFloatLE(1,54+4*111+19);fs.writeFileSync(path.join(r,'SQUELETTE_300_OS.pmd'),largePmd());fs.writeFileSync(path.join(r,'MOTION_300_OS.vmd'),v);}
