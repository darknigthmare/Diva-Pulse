/* Original small strip using two independent bones: no proprietary model. */
const fs=require('node:fs'),path=require('node:path');
function writer(){const a=[];return {b(x){a.push(Buffer.from(x));},u(x){this.b([x&255]);},i(x){const b=Buffer.alloc(4);b.writeInt32LE(x);this.b(b);},f(x){const b=Buffer.alloc(4);b.writeFloatLE(x);this.b(b);},t(x){const b=Buffer.from(x);this.i(b.length);this.b(b);},fixed(x,n){const b=Buffer.alloc(n);Buffer.from(x).copy(b);this.b(b);},done(){return Buffer.concat(a);}};}
function pmx(type=3){const w=writer();w.fixed('PMX ',4);w.f(type===4?2.1:2);w.u(8);w.b([1,0,1,1,1,1,1,1]);w.t('Pulse skin diagnostic');w.t('');w.t('Original fixture for SDEF/QDEF regression, not a character.');w.t('');
 const vertices=[[-.5,0,0],[.5,0,0],[.5,1,0],[-.5,1,0],[.5,1,0],[-.5,2,0]];w.i(vertices.length);
 for(const p of vertices){[...p,0,0,1,0,0].forEach(x=>w.f(x));w.u(type);if(type===3){w.u(0);w.u(1);w.f(.5);[0,.5,.25,-.5,.5,.25,.5,.5,.25].forEach(x=>w.f(x));}else{w.b([0,1,0,0]);[.5,.5,0,0].forEach(x=>w.f(x));}w.f(1);}
 w.i(6);[0,1,2,3,4,5].forEach(x=>w.u(x));w.i(0);w.i(2);
 for(let i=0;i<2;i++){w.t('surface'+i);w.t('');[i?.3:.9,i?.9:.3,.6,1,0,0,0,1,0,0,0].forEach(x=>w.f(x));w.u(1);[0,0,0,1,0].forEach(x=>w.f(x));w.u(255);w.u(255);w.u(0);w.u(1);w.u(0);w.t('');w.i(3);}
 w.i(2);for(const name of ['boneA','boneB']){w.t(name);w.t('');[0,0,0].forEach(x=>w.f(x));w.u(255);w.i(0);w.b([0,0]);[0,1,0].forEach(x=>w.f(x));}
 w.i(0);w.i(0);w.i(0);w.i(0);if(type===4)w.i(0);return w.done();
}
function vmd(){const w=writer();w.fixed('Vocaloid Motion Data 0002',30);w.fixed('Pulse skin diagnostic',20);w.i(6);for(const [name,sg] of [['boneA',1],['boneB',-1]])for(const [f,ang] of [[0,0],[30,sg*Math.PI/3],[60,0]]){w.fixed(name,15);w.i(f);[0,0,0,0,0,Math.sin(ang/2),Math.cos(ang/2)].forEach(x=>w.f(x));const q=Buffer.alloc(64);for(let i=0;i<4;i++){q[i]=20;q[i+4]=20;q[i+8]=107;q[i+12]=107;}w.b(q);}for(let i=0;i<5;i++)w.i(0);return w.done();}
if(require.main===module){const dir=path.resolve(__dirname,'../examples/v23');fs.mkdirSync(dir,{recursive:true});for(const [n,b]of Object.entries({'SDEF_STRIP.pmx':pmx(3),'QDEF_STRIP.pmx':pmx(4),'BEND.vmd':vmd()}))fs.writeFileSync(path.join(dir,n),b);}
module.exports={pmx,vmd,writer};
