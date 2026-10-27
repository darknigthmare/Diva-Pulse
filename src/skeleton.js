/* V24: deterministic append transforms and bounded XYZ IK limits.
 * Independent implementation; coordinate convention matches PulseStage (Z reflected).
 * Local/world append and post-physics dependencies stay diagnosed, not approximated silently.
 */
(function(root){'use strict';
const ident=()=>[0,0,0,1], clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function normal(q){const l=Math.hypot(...q);if(!Number.isFinite(l)||l<1e-9)throw Error('Quaternion de squelette invalide.');return q.map(x=>x/l);}
function multiply(a,b){return normal([a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]]);}
function power(q,t){q=normal(q);if(q[3]<0)q=q.map(x=>-x);const a=Math.acos(clamp(q[3],-1,1)),s=Math.sin(a);if(Math.abs(s)<1e-8)return ident();return normal([...q.slice(0,3).map(x=>x/s*Math.sin(a*t)),Math.cos(a*t)]);}
function fromEuler([x,y,z]){const a=Math.cos(x/2),b=Math.cos(y/2),c=Math.cos(z/2),u=Math.sin(x/2),v=Math.sin(y/2),w=Math.sin(z/2);return [u*b*c+a*v*w,a*v*c-u*b*w,a*b*w+u*v*c,a*b*c-u*v*w];}
function toEuler(q){const [x,y,z,w]=normal(q),m13=2*(x*z+y*w),m23=2*(y*z-x*w),m33=1-2*(x*x+y*y),m12=2*(x*y-z*w),m11=1-2*(y*y+z*z);if(Math.abs(m13)<.9999999)return [Math.atan2(-m23,m33),Math.asin(clamp(m13,-1,1)),Math.atan2(-m12,m11)];return [Math.atan2(2*(x*y+z*w),1-2*(x*x+z*z)),Math.asin(clamp(m13,-1,1)),0];}
function limits(min,max){if(!Array.isArray(min)||!Array.isArray(max)||min.length!==3||max.length!==3||[...min,...max].some(x=>!Number.isFinite(x))||min.some((v,i)=>v>max[i]))throw Error('Limites IK invalides.');return {min:[...min],max:[...max]};}
function reflectLimits(min,max){limits(min,max);return {min:[-max[0],-max[1],min[2]],max:[-min[0],-min[1],max[2]]};}
function constrain(q,min,max){limits(min,max);const e=toEuler(q),nearest=(x,a,b)=>{const candidates=[x,x-2*Math.PI,x+2*Math.PI];let best=clamp(x,a,b),distance=Infinity;for(const c of candidates){const bounded=clamp(c,a,b),d=Math.abs(c-bounded);if(d<distance){best=bounded;distance=d;}}return best;};return normal(fromEuler(e.map((v,i)=>nearest(v,min[i],max[i]))));}
function compile(bones){
 if(!Array.isArray(bones)||bones.length>1024)throw Error('Squelette hors limite.');const state=new Uint8Array(bones.length),order=[],warnings=[];
 for(let i=0;i<bones.length;i++){
  const b=bones[i],g=b.grant;
  if(g&&(!Number.isInteger(g.parent)||g.parent<0||g.parent>=bones.length||g.parent===i||!Number.isFinite(g.ratio)||Math.abs(g.ratio)>100))throw Error('Héritage MMD invalide : '+b.name);
  if(g&&(b.flags&0x80))warnings.push('Héritage local/monde non appliqué : '+b.name);
  if(g&&(b.flags&0x1000))warnings.push('Héritage après physique évalué sans physique : '+b.name);
  if(b.localAxes)warnings.push('Axes locaux spécifiques non reproduits : '+b.name);
  if(b.ik){const ik=b.ik;if(!Number.isInteger(ik.target)||ik.target<0||ik.target>=bones.length||!Number.isInteger(ik.loops)||ik.loops<0||ik.loops>10000||!Number.isFinite(ik.limit)||ik.limit<0||!Array.isArray(ik.links))throw Error('Chaîne IK invalide : '+b.name);for(const l of ik.links){if(!Number.isInteger(l.bone)||l.bone<0||l.bone>=bones.length)throw Error('Lien IK absent.');if(l.limited)limits(l.min,l.max);}}
 }
 function visit(i){if(state[i]===2)return;if(state[i]===1)throw Error('Cycle dans les héritages MMD.');state[i]=1;const g=bones[i].grant;if(g)visit(g.parent);state[i]=2;order.push(i);}
 [...bones.keys()].sort((a,b)=>(bones[a].layer||0)-(bones[b].layer||0)||a-b).forEach(visit);return {order,warnings};
}
function apply(bones,nodes,plan=compile(bones)){
 // Called once after the unmodified animated/morphed pose has been installed each frame.
 // Sources already evaluated in this pass include chained non-local append transforms.
 for(const i of plan.order){const b=bones[i],g=b.grant,n=nodes[i];if(!g||(b.flags&0x80))continue;const source=nodes[g.parent];if(g.rotation)n.q=multiply(n.q,power(source.q,g.ratio));if(g.translation)n.p=n.p.map((v,k)=>v+(source.p[k]-source.baseP[k])*g.ratio);}
}
root.PulseSkeleton={compile,apply,reflectLimits,constrain,fromEuler,toEuler,power,multiply,normal};if(typeof module!=='undefined')module.exports=root.PulseSkeleton;
})(typeof window!=='undefined'?window:globalThis);
