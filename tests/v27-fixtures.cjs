/* Original hanging armature. No third-party character/media. */
const fs=require('fs'),path=require('path'),{writer}=require('./v23-fixtures.cjs');
const vec=(w,a)=>a.forEach(x=>w.f(x));
function bodies(){return [
 {name:'anchor',bone:0,group:0,mask:65535,shape:0,size:[.18,0,0],position:[0,3,0],rotation:[0,0,0],mass:0,linearDamping:.04,angularDamping:.04,restitution:0,friction:.4,mode:0},
 {name:'pendulum',bone:1,group:1,mask:65535,shape:0,size:[.24,0,0],position:[.8,2.4,0],rotation:[0,0,0],mass:1,linearDamping:.03,angularDamping:.03,restitution:.1,friction:.4,mode:1}];}
function joints(){return [{name:'hinge',a:0,b:1,type:0,position:[0,3,0],rotation:[0,0,0],linear:{min:[0,0,0],max:[0,0,0]},angular:{min:[0,0,-2.5],max:[0,0,2.5]},springPosition:[0,0,0],springRotation:[0,0,0]}];}
function writeBody(w,b,pmd=false){if(pmd)w.fixed(b.name,20);else{w.t(b.name);w.t('');}pmd?w.b([b.bone&255,(b.bone>>8)&255]):w.u(b.bone);w.u(b.group);w.b([b.mask&255,b.mask>>8]);w.u(b.shape);vec(w,b.size);vec(w,b.position);vec(w,b.rotation);vec(w,[b.mass,b.linearDamping,b.angularDamping,b.restitution,b.friction]);w.u(b.mode);}
function writeJoint(w,j,pmd=false){if(pmd)w.fixed(j.name,20);else{w.t(j.name);w.t('');w.u(j.type);}pmd?(w.i(j.a),w.i(j.b)):(w.u(j.a),w.u(j.b));for(const v of [j.position,j.rotation,j.linear.min,j.linear.max,j.angular.min,j.angular.max,j.springPosition,j.springRotation])vec(w,v);}
function pmx(options={}){
 const w=writer();w.fixed('PMX ',4);w.f(2);w.u(8);w.b([1,0,1,1,1,1,1,1]);w.t('DYNAMIQUE - PENDULE');w.t('');w.t('Original diagnostic for opt-in secondary dynamics. Not Bullet.');w.t('');
 const vertices=[[-.12,3.12,0],[.12,2.9,0],[1.04,2.4,0],[-.12,3.12,0],[1.04,2.4,0],[.82,2.18,0],[-.35,3.35,0],[.35,3.35,0],[.35,2.95,0],[-.35,3.35,0],[.35,2.95,0],[-.35,2.95,0]];
 w.i(vertices.length);vertices.forEach((p,i)=>{vec(w,[...p,0,0,1,0,0]);w.u(0);w.u(i<6?1:0);w.f(1);});w.i(vertices.length);vertices.forEach((_,i)=>w.u(i));w.i(0);w.i(2);
 for(let i=0;i<2;i++){w.t(i?'anchor':'swing');w.t('');vec(w,[i?.16:.92,i?.8:.46,i?.84:.35,1,0,0,0,1,0,0,0]);w.u(1);vec(w,[0,0,0,1,0]);w.u(255);w.u(255);w.u(0);w.u(1);w.u(0);w.t('');w.i(6);}
 w.i(2);for(let i=0;i<2;i++){w.t(i?'swing':'root');w.t('');vec(w,[0,3,0]);w.u(i?0:255);w.i(0);w.b([0,0]);vec(w,[0,1,0]);}
 w.i(0);w.i(0);const bs=options.bodies||bodies(),js=options.joints||joints();w.i(bs.length);bs.forEach(b=>writeBody(w,b));w.i(js.length);js.forEach(j=>writeJoint(w,j));return w.done();
}
function pmd(){const F=require('./v19-fixtures.cjs'),base=F.pmd({robot:true,texture:''}),w=writer();w.b(base.subarray(0,-8));const bs=bodies();bs[1].bone=2;bs[0].position=[0,3,0];bs[1].position=[0,-.6,0];w.i(bs.length);bs.forEach(b=>writeBody(w,b,true));w.i(1);writeJoint(w,joints()[0],true);return w.done();}
function vmd(){const w=writer();w.fixed('Vocaloid Motion Data 0002',30);w.fixed('Pulse secondary',20);w.i(5);for(const frame of [0,30,60,90,120]){w.fixed('root',15);w.i(frame);vec(w,[frame===30?.4:frame===90?-.4:0,0,0,0,0,0,1]);const b=Buffer.alloc(64);for(let i=0;i<4;i++){b[i]=20;b[i+4]=20;b[i+8]=107;b[i+12]=107;}w.b(b);}for(let i=0;i<5;i++)w.i(0);return w.done();}
if(require.main===module){const dir=path.resolve(__dirname,'../examples/v27');fs.mkdirSync(dir,{recursive:true});for(const [name,data]of Object.entries({'PENDULE.pmx':pmx(),'PHYSIQUE_PMD.pmd':pmd(),'ANCRAGE.vmd':vmd()}))fs.writeFileSync(path.join(dir,name),data);fs.writeFileSync(path.join(dir,'LIRE.txt'),'Diagnostics originaux. Active le mode secondaire dans Modules > MMD Stage > Dynamique.\nLe pendule doit osciller sous gravite; pause et retour au debut testent la remise a zero.\nPHYSIQUE_PMD sert a controler les positions de corps relatives aux os PMD, pas a montrer un personnage final.\n');}
module.exports={pmx,pmd,vmd,bodies,joints};
