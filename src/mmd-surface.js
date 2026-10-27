/* V22: bounded PMX surface morphs; UV0, diffuse RGBA and texture/sphere tints.
 * This does not implement specular/ambient/edge/toon or extra UV rendering. */
(function(root){'use strict';
const finite=(a,n,label)=>{if(!Array.isArray(a)||a.length!==n||a.some(v=>!Number.isFinite(v)))throw Error(label+' non fini ou incomplet.');};
function validate(model){
 const morphs=model.morphs||[];let items=0;
 for(const m of morphs){
  if(!Array.isArray(m.items))throw Error('Éléments de morph absents.');
  items+=m.items.length;if(items>2000000)throw Error('Trop d’éléments de morph pour ce runtime.');
  for(const it of m.items){
   const max=m.type===0?morphs.length:m.type===2?model.bones.length:m.type===8?model.materials.length:model.vertexCount;
   if([0,1,2,3,4,5,6,7,8].includes(m.type)&&(!Number.isInteger(it.index)||it.index<(m.type===8?-1:0)||it.index>=max))throw Error('Référence de morph hors modèle.');
   if(m.type===0&&!Number.isFinite(it.weight))throw Error('Poids de groupe non fini.');
   if(m.type===1)finite(it.offset,3,'Sommet de morph');
   if(m.type===2){finite(it.translation,3,'Translation de morph');finite(it.rotation,4,'Rotation de morph');}
   if(m.type>=3&&m.type<=7)finite(it.offset,4,'UV de morph');
   if(m.type===8){
    if(![0,1].includes(it.operation))throw Error('Opération de matériau inconnue.');
    for(const [k,n] of [['diffuse',4],['specular',3],['ambient',3],['edgeColor',4],['textureTint',4],['sphereTint',4],['toonTint',4]])finite(it[k],n,k);
    if(!Number.isFinite(it.specPower)||!Number.isFinite(it.edgeSize))throw Error('Paramètre de matériau non fini.');
   }
  }
 }
 const state=new Uint8Array(morphs.length);
 for(let i=0;i<morphs.length;i++){
  const stack=[[i,0]];
  while(stack.length){const [j,exit]=stack.pop();if(exit){state[j]=2;continue;}if(state[j]===2)continue;if(state[j]===1)throw Error('Cycle de groupes de morphs.');state[j]=1;stack.push([j,1]);if(morphs[j].type===0)for(const it of morphs[j].items)stack.push([it.index,0]);}
 }
 return true;
}
function baseMaterial(m){return {diffuse:[...m.diffuse],textureMul:[1,1,1,1],textureAdd:[0,0,0,0],sphereMul:[1,1,1,1],sphereAdd:[0,0,0,0]};}
function evaluate(model,weights){
 let uv=null,materials=null,accum=null;
 for(const [m,w] of weights){
  if(!Number.isFinite(w)||Math.abs(w)<1e-7)continue;
  if(m.type===3){uv||=new Float32Array(model.uv);for(const it of m.items){uv[it.index*2]+=it.offset[0]*w;uv[it.index*2+1]-=it.offset[1]*w;}}
  if(m.type===8){
   accum||=model.materials.map(()=>({dm:[1,1,1,1],da:[0,0,0,0],tm:[1,1,1,1],ta:[0,0,0,0],sm:[1,1,1,1],sa:[0,0,0,0]}));
   for(const it of m.items){const targets=it.index===-1?accum:[accum[it.index]];
    for(const a of targets)for(const [field,prefix] of [['diffuse','d'],['textureTint','t'],['sphereTint','s']])for(let k=0;k<4;k++){
     if(it.operation===0)a[prefix+'m'][k]*=1+(it[field][k]-1)*w;
     else a[prefix+'a'][k]+=it[field][k]*w;
    }
   }
  }
 }
 if(accum)materials=accum.map((a,i)=>({diffuse:model.materials[i].diffuse.map((v,k)=>v*a.dm[k]+a.da[k]),textureMul:a.tm,textureAdd:a.ta,sphereMul:a.sm,sphereAdd:a.sa}));
 return {uv,materials};
}
root.PulseMMDSurface={validate,evaluate,baseMaterial};if(typeof module!=='undefined')module.exports=root.PulseMMDSurface;
})(typeof window!=='undefined'?window:globalThis);
