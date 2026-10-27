const test=require('node:test'),assert=require('node:assert/strict');
global.PulseCore=require('../src/core.js');
const {Stage}=require('../src/stage.js');
const S=Object.create(Stage.prototype);
test('V11 MMD bezier keeps endpoints and curves midpoint',()=>{
  assert.equal(S._mmdBezier(0.2,0.2,0.8,0.8,0),0);
  assert.ok(Math.abs(S._mmdBezier(0.2,0.2,0.8,0.8,1)-1)<1e-8);
  const curved=S._mmdBezier(0.1,0.9,0.2,1,0.5);
  assert.ok(curved>0.5&&curved<1);
});
test('V11 bone sampling uses per-channel VMD interpolation',()=>{
  const linear=new Array(64).fill(0); for(let c=0;c<4;c++){linear[c]=20;linear[c+4]=20;linear[c+8]=107;linear[c+12]=107;}
  const ease=new Array(64).fill(0); for(let c=0;c<4;c++){ease[c]=13;ease[c+4]=114;ease[c+8]=25;ease[c+12]=127;}
  const a={frame:0,pos:[0,0,0],rot:[0,0,0,1],interp:linear},b={frame:30,pos:[10,10,10],rot:[0,0,0,1],interp:ease};
  const s=S._mmdSample([a,b],15,'bone'); assert.ok(s.pos[0]>5,'easing should differ from linear midpoint');
});
test('V11 camera sampling accepts six interpolation channels',()=>{
 const i=[];for(let c=0;c<6;c++)i.push(20,20,107,107);
 const a={frame:0,pos:[0,0,0],rot:[0,0,0],distance:5,fov:30,perspective:true,interp:i};
 const b={frame:30,pos:[2,4,6],rot:[1,1,1],distance:9,fov:50,perspective:true,interp:i};
 const s=S._mmdSample([a,b],15,'camera'); assert.ok(s.pos.every(Number.isFinite));assert.ok(Number.isFinite(s.fov));
});
