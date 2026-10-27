/* V27 secondary dynamics: bounded, model-local position based dynamics.
 * This is NOT Bullet. Dynamic shapes use bounding spheres; kinematic boxes/capsules
 * are projected analytically. Joint rotation weights use scalar mass, not inertia tensors.
 * Physics is deliberately opt-in. V28 queues sampled targets across slow frames.
 * A bounded catch-up budget preserves momentum; explicit seeks still reset history.
 */
(function(root){
'use strict';
const S=root.PulseSkeleton||(typeof require==='function'?require('./skeleton.js'):null);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const add=(a,b)=>a.map((x,i)=>x+b[i]),sub=(a,b)=>a.map((x,i)=>x-b[i]),mul=(v,s)=>v.map(x=>x*s),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),length=v=>Math.hypot(...v);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const qi=q=>[-q[0],-q[1],-q[2],q[3]], qm=S.multiply;
function rotate(q,v){const [x,y,z,w]=q,tx=2*(y*v[2]-z*v[1]),ty=2*(z*v[0]-x*v[2]),tz=2*(x*v[1]-y*v[0]);return [v[0]+w*tx+y*tz-z*ty,v[1]+w*ty+z*tx-x*tz,v[2]+w*tz+x*ty-y*tx];}
const compose=(a,b)=>({p:add(a.p,rotate(a.q,b.p)),q:qm(a.q,b.q)});
const inverse=a=>{const q=qi(a.q);return {p:rotate(q,mul(a.p,-1)),q};};
const mix=(a,b,t)=>({p:a.p.map((v,k)=>v+(b.p[k]-v)*t),q:qm(S.power(qm(b.q,qi(a.q)),t),a.q)});
function rotationVector(q){q=S.normal(q);if(q[3]<0)q=q.map(x=>-x);const n=length(q.slice(0,3));if(n<1e-10)return [0,0,0];return mul(q.slice(0,3),2*Math.atan2(n,q[3])/n);}
function rotationFromVector(v){const n=length(v);return n<1e-10?[0,0,0,1]:[...mul(v,Math.sin(n/2)/n),Math.cos(n/2)];}
function bounded(v,max){const n=length(v);return n>max?mul(v,max/n):v;}
function normalize(raw={}){
 const n=(key,d,lo,hi)=>{const v=raw[key]===undefined?d:Number(raw[key]);if(!Number.isFinite(v)||v<lo||v>hi)throw Error('Dynamique secondaire : '+key+' hors plage.');return v;};
 return {version:27,enabled:raw.enabled===true,gravity:n('gravity',9.8,0,100),damping:n('damping',.08,0,.95),iterations:Math.round(n('iterations',6,2,12)),ground:raw.ground===true,collisions:raw.collisions!==false,strength:n('strength',1,0,1)};
}
const radius=b=>b.shape===0?b.size[0]:b.shape===1?length(b.size):b.size[0]+b.size[1]/2;
function collisionAllowed(a,b){return !!((a.mask&(1<<b.group))&&(b.mask&(1<<a.group)));}
function projectSphere(point,r,shape,pose){
 const local=rotate(qi(pose.q),sub(point,pose.p));let normal,depth;
 if(shape.shape===1){
  const closest=local.map((v,k)=>clamp(v,-shape.size[k],shape.size[k])),delta=sub(local,closest),dist=length(delta);
  if(dist>1e-9){if(dist>=r)return null;normal=mul(delta,1/dist);depth=r-dist;}
  else{let axis=0;for(let k=1;k<3;k++)if(shape.size[k]-Math.abs(local[k])<shape.size[axis]-Math.abs(local[axis]))axis=k;normal=[0,0,0];normal[axis]=local[axis]<0?-1:1;depth=r+shape.size[axis]-Math.abs(local[axis]);}
 }else{
  const closest=shape.shape===2?[0,clamp(local[1],-shape.size[1]/2,shape.size[1]/2),0]:[0,0,0],delta=sub(local,closest),dist=length(delta),limit=r+shape.size[0];if(dist>=limit)return null;
  normal=dist>1e-9?mul(delta,1/dist):[1,0,0];depth=limit-dist;
 }
 return {normal:rotate(pose.q,normal),depth};
}
function hierarchy(bones,local){
 const result=Array(bones.length),seen=new Uint8Array(bones.length),order=[];
 function visit(i){if(seen[i]===2)return result[i];if(seen[i]===1)throw Error('Cycle de squelette physique.');seen[i]=1;const a={p:[...local[i].p],q:S.normal(local[i].q)},parent=bones[i].parent;result[i]=parent>=0?compose(visit(parent),a):a;seen[i]=2;order.push(i);return result[i];}
 for(let i=0;i<bones.length;i++)visit(i);return {world:result,order};
}
function inspect(data){
 const bodies=data?.bodies||[],joints=data?.joints||[],warnings=[...(data?.warnings||[])];
 const dynamic=bodies.filter(b=>b.mode!==0&&b.mass>0).length;
 if(bodies.length>128||joints.length>256)warnings.push('Limite de simulation : 128 corps / 256 articulations par modèle. Le modèle reste affichable sans dynamique.');
 if(bodies.some(b=>b.mode!==0&&b.shape!==0))warnings.push('Les corps dynamiques boîte/capsule utilisent une enveloppe sphérique conservatrice.');
 if(bodies.some(b=>b.mode!==0&&b.mass===0))warnings.push('Un corps dynamique de masse nulle reste fixe.');
 if(joints.some(j=>j.type!==0||j.a<0||j.b<0||j.a===j.b))warnings.push('Articulations non standard, fixes au monde ou auto-liées ignorées.');
 if(data?.softBodies)warnings.push('Les corps souples ne sont pas simulés.');
 const counts=new Map();for(const b of bodies)if(b.mode&&b.mass>0&&b.bone>=0)counts.set(b.bone,(counts.get(b.bone)||0)+1);
 if([...counts.values()].some(n=>n>1))warnings.push('Plusieurs corps pilotent le même os : seul le premier est réinjecté dans le squelette.');
 return {bodies:bodies.length,dynamic,kinematic:bodies.length-dynamic,joints:joints.length,supportedJoints:joints.filter(j=>j.type===0&&j.a>=0&&j.b>=0&&j.a!==j.b).length,softBodies:data?.softBodies||0,canSimulate:dynamic>0&&bodies.length<=128&&joints.length<=256,warnings:[...new Set(warnings)]};
}
class World{
 constructor(data,bones,settings={}){
  this.settings=normalize(settings);this.data=data||{bodies:[],joints:[]};this.report=inspect(data);if(!this.report.canSimulate)throw Error('Aucun corps dynamique simulable, ou budget dépassé.');
  this.bones=bones;this.h=1/60;this.maxStepsPerUpdate=12;this.maxBacklog=1;this.frames=[];this.stats={steps:0,resets:0,reason:'initial',contacts:0,stepsThisFrame:0,backlogSeconds:0,maxBacklogSeconds:0,catchUpFrames:0,overloadResets:0};this.disposed=false;this.inputTime=null;this.simTime=null;
  this.items=this.data.bodies.map(b=>({info:b,bind:{p:[...b.position],q:S.fromEuler(b.rotation)},offset:{p:sub(b.position,b.bone>=0?bones[b.bone].pos:[0,0,0]),q:S.fromEuler(b.rotation)},radius:radius(b),invMass:b.mode&&b.mass>0?1/b.mass:0,invAngular:b.mode&&b.mass>0?1/(b.mass*Math.max(.01,.4*radius(b)**2)):0,positionMass:b.mode===1&&b.mass>0?1/b.mass:0,p:[...b.position],q:S.fromEuler(b.rotation),v:[0,0,0],w:[0,0,0]}));
  this.joints=this.data.joints.filter(j=>j.type===0&&j.a>=0&&j.b>=0&&j.a!==j.b).map(j=>{const pose={p:j.position,q:S.fromEuler(j.rotation)};return {...j,frameA:compose(inverse(this.items[j.a].bind),pose),frameB:compose(inverse(this.items[j.b].bind),pose)};});
 }
 targets(local){const {world,order}=hierarchy(this.bones,local);this.order=order;return this.items.map(b=>b.info.bone>=0?compose(world[b.info.bone],b.offset):b.bind);}
 reset(time,targets,reason='reset'){
  this.items.forEach((b,i)=>{b.p=[...targets[i].p];b.q=[...targets[i].q];b.v=[0,0,0];b.w=[0,0,0];});this.inputTime=time;this.simTime=time;this.previousTargets=targets;this.frames=[{time,targets}];this.stats.resets++;this.stats.reason=reason;this.stats.contacts=0;this.stats.stepsThisFrame=0;this.stats.backlogSeconds=0;
 }
 joint(j){
  const a=this.items[j.a],b=this.items[j.b];let fa=compose(a,j.frameA),fb=compose(b,j.frameB);
  const relative=rotate(qi(fa.q),sub(fb.p,fa.p));
  const goal=relative.map((v,k)=>{let x=clamp(v,j.linear.min[k],j.linear.max[k]);const spring=clamp(j.springPosition[k]*this.h*this.h,0,.35);return x*(1-spring);});
  const correction=rotate(fa.q,sub(relative,goal)),distance=length(correction);
  if(distance>1e-9){
   const n=mul(correction,1/distance),ra=sub(fa.p,a.p),rb=sub(fb.p,b.p),ca=cross(ra,n),cb=cross(rb,n),sum=a.positionMass+b.positionMass+a.invAngular*dot(ca,ca)+b.invAngular*dot(cb,cb);
   if(sum>1e-12){const lambda=distance/sum;a.p=add(a.p,mul(n,lambda*a.positionMass));b.p=sub(b.p,mul(n,lambda*b.positionMass));a.q=qm(rotationFromVector(bounded(mul(ca,lambda*a.invAngular),.35)),a.q);b.q=qm(rotationFromVector(bounded(mul(cb,-lambda*b.invAngular),.35)),b.q);}
  }
  fa=compose(a,j.frameA);fb=compose(b,j.frameB);
  const relq=qm(qi(fa.q),fb.q),limited=S.constrain(relq,j.angular.min,j.angular.max),angles=S.toEuler(limited).map((v,k)=>v*(1-clamp(j.springRotation[k]*this.h*this.h,0,.35))),desired=qm(fa.q,S.fromEuler(angles)),delta=qm(desired,qi(fb.q)),angularSum=a.invAngular+b.invAngular;
  if(angularSum>0){a.q=qm(S.power(delta,-a.invAngular/angularSum),a.q);b.q=qm(S.power(delta,b.invAngular/angularSum),b.q);}
 }
 collide(){
  for(let i=0;i<this.items.length;i++){
   const a=this.items[i];if(!a.positionMass)continue;
   if(this.settings.ground&&a.p[1]<a.radius){a.p[1]=a.radius;a.contact=[0,1,0];this.stats.contacts++;}
   if(!this.settings.collisions)continue;
   for(let j=0;j<this.items.length;j++){
    if(i===j)continue;const b=this.items[j];if(!collisionAllowed(a.info,b.info))continue;
    if(b.positionMass&&j<i)continue;
    // Conservative broad phase avoids local shape transforms for distant pairs.
    const rr=a.radius+b.radius,dx=a.p[0]-b.p[0],dy=a.p[1]-b.p[1],dz=a.p[2]-b.p[2];
    if(dx*dx+dy*dy+dz*dz>=rr*rr)continue;
    let hit;
    if(!b.positionMass)hit=projectSphere(a.p,a.radius,b.info,b);
    else{const delta=sub(a.p,b.p),d=length(delta),gap=a.radius+b.radius-d;if(gap>0)hit={normal:d>1e-9?mul(delta,1/d):[1,0,0],depth:gap};}
    if(!hit)continue;const total=a.positionMass+b.positionMass;a.p=add(a.p,mul(hit.normal,hit.depth*a.positionMass/total));if(b.positionMass)b.p=sub(b.p,mul(hit.normal,hit.depth*b.positionMass/total));a.contact=hit.normal;b.contact=mul(hit.normal,-1);this.stats.contacts++;
   }
  }
 }
 tick(targets){
  const h=this.h;this.stats.contacts=0;
  for(let i=0;i<this.items.length;i++){
   const b=this.items[i];b.oldP=[...b.p];b.oldQ=[...b.q];b.contact=null;
   if(!b.invMass){b.p=[...targets[i].p];b.q=[...targets[i].q];continue;}
   if(b.positionMass){b.v[1]-=this.settings.gravity*h;b.p=add(b.p,mul(b.v,h));}else b.p=[...targets[i].p];
   b.q=qm(rotationFromVector(mul(b.w,h)),b.q);
  }
  for(let i=0;i<this.settings.iterations;i++){for(const j of this.joints)this.joint(j);this.collide();}
  for(const b of this.items){if(!b.invMass)continue;
   b.v=bounded(mul(sub(b.p,b.oldP),1/h),100);b.w=bounded(mul(rotationVector(qm(b.q,qi(b.oldQ))),1/h),30);
   b.v=mul(b.v,Math.pow(1-b.info.linearDamping, h)*(1-this.settings.damping));b.w=mul(b.w,Math.pow(1-b.info.angularDamping,h)*(1-this.settings.damping));
   if(b.contact){const speed=dot(b.v,b.contact);if(speed<0)b.v=sub(b.v,mul(b.contact,(1+b.info.restitution)*speed));const n=mul(b.contact,dot(b.v,b.contact));b.v=add(n,mul(sub(b.v,n),1-clamp(b.info.friction*.03,0,.8)));}
   if([...b.p,...b.q,...b.v,...b.w].some(x=>!Number.isFinite(x)||Math.abs(x)>1000000))throw Error('Dynamique arrêtée : sortie non finie ou hors limite.');
  }
  this.stats.steps++;
 }
 update(time,local){
  if(this.disposed)throw Error('Simulation fermée.');if(!Number.isFinite(time))throw Error('Horloge physique invalide.');
  const targets=this.targets(local),delta=this.inputTime===null?0:time-this.inputTime;
  this.stats.stepsThisFrame=0;
  if(this.inputTime===null||delta< -1e-8||delta>this.maxBacklog+1e-8){
   this.reset(time,targets,this.inputTime===null?'initial':delta<0?'retour / boucle':'saut temporel');
  }else if(targets.some((t,i)=>length(sub(t.p,this.previousTargets[i].p))>Math.max(5,this.items[i].radius*12))){
   this.reset(time,targets,'déplacement discontinu');
  }else if(delta>1e-8){
   // Keep the poses bracketing simulation time, not just the two latest render frames.
   // A paused timestamp never drains a debt: audio pause must also freeze the pose.
   this.frames.push({time,targets});
   if(time-this.simTime>this.maxBacklog+1e-8||this.frames.length>128){
    this.stats.overloadResets++;this.reset(time,targets,'surcharge : retard supérieur à 1 s');
   }else{
    while(this.simTime+this.h<=time+1e-8&&this.stats.stepsThisFrame<this.maxStepsPerUpdate){
     const next=this.simTime+this.h;
     while(this.frames.length>2&&this.frames[1].time<=next+1e-8)this.frames.shift();
     const first=this.frames[0],last=this.frames[1]||first;
     const alpha=last.time>first.time?clamp((next-first.time)/(last.time-first.time),0,1):1;
     this.tick(first.targets.map((v,i)=>mix(v,last.targets[i],alpha)));
     this.simTime=next;this.stats.stepsThisFrame++;
    }
    this.inputTime=time;this.previousTargets=targets;
    this.stats.backlogSeconds=Math.max(0,time-this.simTime);
    this.stats.maxBacklogSeconds=Math.max(this.stats.maxBacklogSeconds,this.stats.backlogSeconds);
    if(this.stats.backlogSeconds>=this.h-1e-8)this.stats.catchUpFrames++;
   }
  }
  const output=local.map(t=>({p:[...t.p],q:[...t.q]})),animated=hierarchy(this.bones,local).world,physical=new Map();
  for(const b of this.items){if(!b.invMass||b.info.bone<0||physical.has(b.info.bone))continue;let t=compose(b,inverse(b.offset));if(b.info.mode===2)t.p=[...animated[b.info.bone].p];physical.set(b.info.bone,mix(animated[b.info.bone],t,this.settings.strength));}
  const evaluated=[];for(const i of this.order){const parent=this.bones[i].parent,base=parent>=0?evaluated[parent]:{p:[0,0,0],q:[0,0,0,1]};if(physical.has(i)){evaluated[i]=physical.get(i);output[i]=compose(inverse(base),evaluated[i]);}else evaluated[i]=compose(base,output[i]);}
  return output;
 }
 dispose(){this.items.length=0;this.joints.length=0;this.previousTargets=null;this.frames.length=0;this.disposed=true;}
}
root.PulseSecondaryPhysics={World,normalize,inspect,projectSphere,collisionAllowed,hierarchy,math:{add,sub,mul,rotate,compose,inverse,mix,rotationVector,rotationFromVector}};
if(typeof module!=='undefined')module.exports=root.PulseSecondaryPhysics;
})(typeof window!=='undefined'?window:globalThis);
