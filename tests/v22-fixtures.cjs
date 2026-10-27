/* Original two-material PMX / UV / opacity control; no third-party character. */
const fs=require('fs'),path=require('path');
function W(){const a=[];return {b(v){a.push(Buffer.from(v));},u(v){a.push(Buffer.from([v&255]));},i(v){const b=Buffer.alloc(4);b.writeInt32LE(v);a.push(b);},f(v){const b=Buffer.alloc(4);b.writeFloatLE(v);a.push(b);},t(s){const b=Buffer.from(s);this.i(b.length);this.b(b);},fixed(s,n){const b=Buffer.alloc(n);Buffer.from(s).copy(b);this.b(b);},done(){return Buffer.concat(a);}};}
function materialItem({index=-1,operation=0,alpha=0,red=1}={}){return {index,operation,diffuse:[red,1,1,alpha],specular:[1,1,1],specPower:1,ambient:[1,1,1],edgeColor:[1,1,1,1],edgeSize:1,textureTint:[1,1,1,1],sphereTint:[1,1,1,1],toonTint:[1,1,1,1]};}
function pmx({badUV=false,badOperation=false}={}){
 const w=W();w.fixed('PMX ',4);w.f(2);w.u(8);w.b([1,0,1,1,1,1,1,1]);w.t('Pulse surface V22');w.t('Original sample');w.t('UV and material diagnostic');w.t('');
 const verts=[[-1,0,0],[0,0,0],[-.5,1,0],[.1,0,0],[1.1,0,0],[.6,1,0]];w.i(verts.length);
 for(const p of verts){[...p,0,0,1,.125,.25].forEach(x=>w.f(x));w.u(0);w.u(0);w.f(1);}
 w.i(6);[0,1,2,3,4,5].forEach(x=>w.u(x));w.i(1);w.t('COLOR.tga');w.i(2);
 for(let i=0;i<2;i++){w.t('material'+i);w.t('');[1,1,1,1,0,0,0,1,0,0,0].forEach(x=>w.f(x));w.u(1);[0,0,0,1,0].forEach(x=>w.f(x));w.u(0);w.u(255);w.u(0);w.u(1);w.u(0);w.t('');w.i(3);}
 w.i(1);w.t('root');w.t('');[0,0,0].forEach(x=>w.f(x));w.u(255);w.i(0);w.b([0,0]);[0,1,0].forEach(x=>w.f(x));
 w.i(3);w.t('UVShift');w.t('');w.u(4);w.u(3);w.i(6);for(let i=0;i<6;i++){w.u(badUV?60:i);[.5,.25,0,0].forEach(x=>w.f(x));}
 w.t('Fade');w.t('');w.u(4);w.u(8);w.i(1);const m=materialItem({operation:badOperation?4:0});w.u(m.index);w.u(m.operation);for(const k of ['diffuse','specular','specPower','ambient','edgeColor','edgeSize','textureTint','sphereTint','toonTint'])for(const x of [m[k]].flat())w.f(x);
 w.t('Group');w.t('');w.u(4);w.u(0);w.i(2);w.u(0);w.f(.5);w.u(1);w.f(.5);w.i(0);w.i(0);w.i(0);return w.done();
}
function vmd(name='Fade'){const w=W();w.fixed('Vocaloid Motion Data 0002',30);w.fixed('Pulse surface',20);w.i(0);w.i(3);for(const [f,v] of [[0,0],[30,1],[60,0]]){w.fixed(name,15);w.i(f);w.f(v);}for(let i=0;i<4;i++)w.i(0);return w.done();}
function tga(){const b=Buffer.alloc(42);b[2]=2;b.writeUInt16LE(4,12);b.writeUInt16LE(2,14);b[16]=24;b[17]=32;for(let i=0;i<8;i++)b.set(i%4<2?[30,40,245]:[60,235,30],18+i*3);return b;}
if(require.main===module){const dir=path.resolve(__dirname,'../examples/v22');fs.mkdirSync(dir,{recursive:true});for(const [n,b] of Object.entries({'SURFACE_TEST.pmx':pmx(),'UV_SHIFT.vmd':vmd('UVShift'),'FADE.vmd':vmd('Fade'),'GROUP.vmd':vmd('Group'),'COLOR.tga':tga()}))fs.writeFileSync(path.join(dir,n),b);}
module.exports={pmx,vmd,tga,materialItem};
