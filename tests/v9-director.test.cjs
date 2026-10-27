const test=require('node:test'),assert=require('node:assert/strict');require('../src/v9-core.js');const D=globalThis.PulseV9Core;
test('director clamps dancers and creates slots',()=>{const d=D.normalizeDirector({count:9,spacing:99});assert.equal(d.count,4);assert.equal(d.slots.length,4);assert.equal(d.spacing,4)});
test('director positions are centered',()=>{assert.deepEqual(D.positions(1,1.5),[[0,0,0]]);const p=D.positions(3,2);assert.equal(p[0][0],-2);assert.equal(p[1][0],0);assert.equal(p[2][0],2)});
test('auto cuts follow four bars',()=>{const c=D.autoCuts({duration:40,bpm:120},{bpm:120});assert.deepEqual(c.slice(0,3).map(x=>x.time),[0,8,16]);assert.equal(c.length,5)});
test('validation warns for dense ensembles',()=>{assert.ok(D.validate({count:4,spacing:.5}).warnings.length>=2)});
