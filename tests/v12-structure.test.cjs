const assert=require('assert');
globalThis.window=globalThis;require('../src/core.js');require('../src/automap-core.js');require('../src/v9-core.js');require('../src/v10-core.js');
const C=globalThis.PulseV10Core;
const song={duration:32}; const chart={bpm:120,sections:[{label:'Intro',from:0,to:8,role:'intro',energy:.2},{label:'Refrain',from:8,to:16,role:'chorus',energy:.9},{label:'Final',from:16,to:32,role:'outro',energy:.5}]};
const d=C.normalizeDirector({duration:32,slots:[{enabled:true,motionAssetId:'m0'}]});
const show=C.autoShow(song,chart,d,['m0','m1','m2','m3','m4']);
assert.equal(show.slots[0].clips.length,3);assert.equal(show.slots[0].clips[0].motionAssetId,'m0');assert.equal(show.slots[0].clips[1].motionAssetId,'m4');assert.ok(show.cuts.length>0);
console.log('V12 structure tests: PASS');
