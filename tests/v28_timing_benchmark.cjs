/* Reproducible comparison against the actual shipped V27 implementation. */
const fs=require('fs'),path=require('path'),vm=require('vm'),{performance}=require('node:perf_hooks');
const F=require('./v27-fixtures.cjs'),M=require('../src/mmd-core.js'),now=require('../src/secondary-physics.js');
const context={module:{exports:{}},require:id=>require(path.resolve(__dirname,'../src',id))};vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'reference/secondary-physics-v27.js'),'utf8'),context);const old=context.module.exports;
function run(P,fps){const bytes=F.pmx(),model=M.parsePmx(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),{full:true}),world=new P.World(model.physics,model.bones,{enabled:true}),pose=model.bones.map(b=>({p:b.parent>=0?b.pos.map((x,k)=>x-model.bones[b.parent].pos[k]):b.pos.slice(),q:[0,0,0,1]}));let output;const start=performance.now();for(let i=0;i<=2*fps;i++)output=world.update(i/fps,pose);return {fps,steps:world.stats.steps,resets:world.stats.resets,rotationZ:output[1].q[2],backlog:world.stats.backlogSeconds||0,milliseconds:performance.now()-start};}
const report={scope:'Synthetic two-body original fixture, two seconds, constant target. Runtime CPU only; not measured display FPS.',v27:[5,10,30,60].map(f=>run(old,f)),v28:[5,10,30,60].map(f=>run(now,f))};
const filename=path.resolve(__dirname,'../qa/v28/timing-comparison.json');fs.writeFileSync(filename,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
if(report.v28.some(x=>x.steps!==120||x.resets!==1))process.exit(1);
