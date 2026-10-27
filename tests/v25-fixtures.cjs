/* Original flat robot + movable mouth and eyelids, no proprietary assets. */
const fs=require('fs'),path=require('path');
function W(){const a=[];return {b(v){a.push(Buffer.from(v));},u(v){a.push(Buffer.from([v&255]));},i(v){const b=Buffer.alloc(4);b.writeInt32LE(v);a.push(b);},f(v){const b=Buffer.alloc(4);b.writeFloatLE(v);a.push(b);},t(s){const b=Buffer.from(s);this.i(b.length);this.b(b);},fixed(s,n){const b=Buffer.alloc(n);Buffer.from(s).copy(b);this.b(b);},done(){return Buffer.concat(a);}};}
function pmx(){const w=W();w.fixed('PMX ',4);w.f(2);w.u(8);w.b([1,0,1,1,1,1,1,1]);w.t('Pulse Face Robot');w.t('Original V25');w.t('Mouth, eyelids and safe facial override diagnostic');w.t('');
 const vs=[],groups=[];function quad(x0,y0,x1,y1,z,color){const at=vs.length;vs.push([x0,y0,z],[x1,y0,z],[x1,y1,z],[x0,y1,z]);groups.push({indices:[at,at+2,at+1,at,at+3,at+2],color});return at;}
 quad(-.5,.7,.5,1.8,0,[.08,.6,.58,1]);quad(-.65,1.85,.65,3.05,0,[.7,.93,.86,1]);quad(-.43,0,-.12,.7,0,[.05,.3,.4,1]);quad(.12,0,.43,.7,0,[.05,.3,.4,1]);quad(-.85,.7,-.52,1.65,0,[.08,.6,.58,1]);quad(.52,.7,.85,1.65,0,[.08,.6,.58,1]);
 const mouth=quad(-.25,2.16,.25,2.19,-.025,[.12,.04,.07,1]),left=quad(-.42,2.62,-.18,2.77,-.025,[.02,.06,.12,1]),right=quad(.18,2.62,.42,2.77,-.025,[.02,.06,.12,1]);
 w.i(vs.length);for(const p of vs){[...p,0,0,-1,0,0].forEach(x=>w.f(x));w.u(0);w.u(0);w.f(1);}w.i(groups.length*6);for(const g of groups)g.indices.forEach(x=>w.u(x));w.i(0);w.i(groups.length);
 for(const [i,g]of groups.entries()){w.t('robot-'+i);w.t('');[...g.color,0,0,0,1,0,0,0].forEach(x=>w.f(x));w.u(1);[0,0,0,1,0].forEach(x=>w.f(x));w.u(255);w.u(255);w.u(0);w.u(1);w.u(0);w.t('');w.i(6);}
 w.i(1);w.t('root');w.t('');[0,0,0].forEach(x=>w.f(x));w.u(255);w.i(0);w.b([0,0]);[0,1,0].forEach(x=>w.f(x));
 w.i(3);w.t('mouthOpen');w.t('');w.u(3);w.u(1);w.i(2);for(const i of [mouth,mouth+1]){w.u(i);[0,-.32,0].forEach(x=>w.f(x));}
 w.t('blink');w.t('');w.u(2);w.u(1);w.i(4);for(const i of [left+2,left+3,right+2,right+3]){w.u(i);[0,-.14,0].forEach(x=>w.f(x));}
 w.t('Talk');w.t('');w.u(4);w.u(0);w.i(1);w.u(0);w.f(1);w.i(0);w.i(0);w.i(0);return w.done();}
function vmd(name='mouthOpen',value=0){const w=W();w.fixed('Vocaloid Motion Data 0002',30);w.fixed('Face Robot',20);w.i(0);w.i(2);for(const f of [0,240]){w.fixed(name,15);w.i(f);w.f(value);}for(let i=0;i<4;i++)w.i(0);return w.done();}
function wav(){const sr=16000,duration=8,b=Buffer.alloc(44+sr*duration*2);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(sr,24);b.writeUInt32LE(sr*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(b.length-44,40);for(let i=0;i<sr*duration;i++){const t=i/sr,part=t%1,active=t>=1&&t<7&&part<.55;const envelope=active?Math.sin(Math.PI*part/.55)**2:0;const x=.3*(Math.sin(t*2*Math.PI*180)+.4*Math.sin(t*2*Math.PI*720))*envelope;b.writeInt16LE(Math.round(x*26000),44+i*2);}return b;}
if(require.main===module){const dir=path.resolve(__dirname,'../examples/v25');fs.mkdirSync(dir,{recursive:true});for(const [name,bytes]of Object.entries({'FACE_ROBOT.pmx':pmx(),'BOUCHE_VMD_ZERO.vmd':vmd(),'GROUPE_VMD_ZERO.vmd':vmd('Talk'),'VOIX_SYNTHETIQUE_TEST.wav':wav()}))fs.writeFileSync(path.join(dir,name),bytes);}
module.exports={pmx,vmd,wav};
