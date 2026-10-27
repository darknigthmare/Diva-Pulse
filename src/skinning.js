/* V23: rigid-transform SDEF and normalized dual-quaternion QDEF.
 * Pure mathematical reference used by tests; GPU formula lives in glsl.
 * SDEF center correction follows the PMX equations documented by OpenMMD.
 * This does not implement bone inheritance, physics, or retargeting. */
(function(root){'use strict';
const mul=(a,b)=>[a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]];
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),unit=q=>{const n=Math.hypot(...q);return n>1e-10?q.map(v=>v/n):[0,0,0,1];};
function rotation(m){const c=[0,4,8].map(i=>Math.hypot(m[i],m[i+1],m[i+2])||1),a=m.map((v,i)=>i<12&&i%4<3?v/c[Math.floor(i/4)]:v),t=a[0]+a[5]+a[10];let q,s;
 if(t>0){s=Math.sqrt(t+1)*2;q=[(a[6]-a[9])/s,(a[8]-a[2])/s,(a[1]-a[4])/s,s/4];}
 else if(a[0]>a[5]&&a[0]>a[10]){s=Math.sqrt(1+a[0]-a[5]-a[10])*2;q=[s/4,(a[4]+a[1])/s,(a[8]+a[2])/s,(a[6]-a[9])/s];}
 else if(a[5]>a[10]){s=Math.sqrt(1+a[5]-a[0]-a[10])*2;q=[(a[4]+a[1])/s,s/4,(a[9]+a[6])/s,(a[8]-a[2])/s];}
 else{s=Math.sqrt(1+a[10]-a[0]-a[5])*2;q=[(a[8]+a[2])/s,(a[9]+a[6])/s,s/4,(a[1]-a[4])/s];}return unit(q);
}
const rotate=(q,p)=>mul(mul(q,[...p,0]),[-q[0],-q[1],-q[2],q[3]]).slice(0,3);
const point=(m,p)=>[0,1,2].map(i=>m[i]*p[0]+m[i+4]*p[1]+m[i+8]*p[2]+m[i+12]);
function slerp(a,b,t){let d=dot(a,b);if(d<0){b=b.map(v=>-v);d=-d;}if(d>.9995)return unit(a.map((v,i)=>v+(b[i]-v)*t));const th=Math.acos(Math.max(-1,Math.min(1,d))),s=Math.sin(th);return unit(a.map((v,i)=>(v*Math.sin((1-t)*th)+b[i]*Math.sin(t*th))/s));}
function deform({position:p,normal=[0,1,0],matrices:m,weights:w,type=0,c=[0,0,0],r0=[0,0,0],r1=[0,0,0]}){
 if(type===3){const b=w[1],a=w[0],r=c.map((_,i)=>r0[i]*a+r1[i]*b),x=point(m[0],c.map((v,i)=>v+(r0[i]-r[i])*.5)),y=point(m[1],c.map((v,i)=>v+(r1[i]-r[i])*.5)),q=slerp(rotation(m[0]),rotation(m[1]),b),v=rotate(q,p.map((v,i)=>v-c[i]));return {position:v.map((v,i)=>v+a*x[i]+b*y[i]),normal:rotate(q,normal)};}
 if(type===4){let qr=[0,0,0,0],qd=[0,0,0,0],ref=null;for(let i=0;i<w.length;i++){if(!w[i])continue;let q=rotation(m[i]);ref||=q;const sign=dot(ref,q)<0?-1:1,d=mul([...m[i].slice(12,15),0],q).map(v=>v*.5);for(let k=0;k<4;k++){qr[k]+=sign*w[i]*q[k];qd[k]+=sign*w[i]*d[k];}}const len=Math.hypot(...qr);if(len<1e-10)return {position:[...p],normal:[...normal]};qr=qr.map(v=>v/len);qd=qd.map(v=>v/len);const x=dot(qr,qd);qd=qd.map((v,i)=>v-qr[i]*x);const t=mul(qd,[-qr[0],-qr[1],-qr[2],qr[3]]);return {position:rotate(qr,p).map((v,i)=>v+2*t[i]),normal:rotate(qr,normal)};}
 const out=[0,0,0],n=[0,0,0];for(let i=0;i<w.length;i++){if(!w[i])continue;const v=point(m[i],p);for(let j=0;j<3;j++){out[j]+=w[i]*v[j];n[j]+=w[i]*(m[i][j]*normal[0]+m[i][j+4]*normal[1]+m[i][j+8]*normal[2]);}}return {position:out,normal:n};
}
const glsl=`
vec4 dqMul(vec4 a,vec4 b){return vec4(a.w*b.xyz+b.w*a.xyz+cross(a.xyz,b.xyz),a.w*b.w-dot(a.xyz,b.xyz));}
vec3 dqRotate(vec4 q,vec3 p){return p+2.0*cross(q.xyz,cross(q.xyz,p)+q.w*p);}
vec4 matRotation(mat4 m){mat3 r=mat3(m);r[0]=normalize(r[0]);r[1]=normalize(r[1]);r[2]=normalize(r[2]);float t=r[0][0]+r[1][1]+r[2][2];vec4 q;float s;
 if(t>0.0){s=sqrt(t+1.0)*2.0;q=vec4((r[1][2]-r[2][1])/s,(r[2][0]-r[0][2])/s,(r[0][1]-r[1][0])/s,s*.25);}
 else if(r[0][0]>r[1][1]&&r[0][0]>r[2][2]){s=sqrt(1.0+r[0][0]-r[1][1]-r[2][2])*2.0;q=vec4(s*.25,(r[1][0]+r[0][1])/s,(r[2][0]+r[0][2])/s,(r[1][2]-r[2][1])/s);}
 else if(r[1][1]>r[2][2]){s=sqrt(1.0+r[1][1]-r[0][0]-r[2][2])*2.0;q=vec4((r[1][0]+r[0][1])/s,s*.25,(r[2][1]+r[1][2])/s,(r[2][0]-r[0][2])/s);}
 else{s=sqrt(1.0+r[2][2]-r[0][0]-r[1][1])*2.0;q=vec4((r[2][0]+r[0][2])/s,(r[2][1]+r[1][2])/s,s*.25,(r[0][1]-r[1][0])/s);}return normalize(q);}
vec4 quatMix(vec4 a,vec4 b,float t){float d=dot(a,b);if(d<0.0){b=-b;d=-d;}if(d>.9995)return normalize(mix(a,b,t));float th=acos(clamp(d,-1.0,1.0));return normalize(a*sin((1.0-t)*th)+b*sin(t*th));}
void advancedSkin(inout vec3 p,inout vec3 n){
 if(skinType>2.5&&skinType<3.5){mat4 a=bone(int(joints.x)),b=bone(int(joints.y));float w0=weights.x,w1=weights.y;vec3 rw=sdefR0*w0+sdefR1*w1;vec3 c0=sdefC+(sdefR0-rw)*.5,c1=sdefC+(sdefR1-rw)*.5;vec4 q=quatMix(matRotation(a),matRotation(b),w1);p=dqRotate(q,p-sdefC)+(a*vec4(c0,1.0)).xyz*w0+(b*vec4(c1,1.0)).xyz*w1;n=dqRotate(q,n);}
 else if(skinType>3.5){vec4 qr=vec4(0.0),qd=vec4(0.0),ref=vec4(0.0);bool found=false;for(int i=0;i<4;i++){if(weights[i]<=0.0)continue;mat4 m=bone(int(joints[i]));vec4 q=matRotation(m);if(!found){ref=q;found=true;}float sg=dot(ref,q)<0.0?-1.0:1.0;qr+=q*weights[i]*sg;qd+=dqMul(vec4(m[3].xyz,0.0),q)*(.5*weights[i]*sg);}float len=length(qr);if(len>1e-8){qr/=len;qd/=len;qd-=qr*dot(qr,qd);p=dqRotate(qr,p)+2.0*dqMul(qd,vec4(-qr.xyz,qr.w)).xyz;n=dqRotate(qr,n);}}
 else{mat4 s=bone(int(joints.x))*weights.x+bone(int(joints.y))*weights.y+bone(int(joints.z))*weights.z+bone(int(joints.w))*weights.w;p=(s*vec4(p,1.0)).xyz;n=mat3(s)*n;}}
`;
root.PulseSkinning={deform,rotation,slerp,mul,glsl};if(typeof module!=='undefined')module.exports=root.PulseSkinning;
})(globalThis);
