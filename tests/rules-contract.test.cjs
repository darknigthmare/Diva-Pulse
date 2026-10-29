'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const C = require('../src/core.js');
require('../src/creator.js');
require('../src/live-core.js');
require('../src/precision-core.js');
const contract = require('./fixtures/rules-contract-v1.json');
const emptyCounts = { COOL: 0, FINE: 0, SAFE: 0, SAD: 0, MISS: 0, WRONG: 0 };

// The expected totals live in the fixture as reviewed literal values. This
// harness only sends inputs to the real engine; it does not calculate scoring.
function chartFor(scenario) {
  return C.validateChart({
    id: 'contract-' + scenario.id,
    title: scenario.title,
    bpm: 120,
    difficulty: 'NORMAL',
    notes: scenario.notes,
    ...scenario.chart
  });
}

function expectedResult(result, expected, engine) {
  assert.deepEqual(result.counts, { ...emptyCounts, ...expected.counts });
  for (const [field, value] of Object.entries(expected)) {
    if (['counts', 'combo', 'states'].includes(field)) continue;
    assert.equal(result[field], value, field);
  }
  if (engine) {
    assert.equal(engine.combo, expected.combo, 'combo');
    assert.deepEqual(engine.notes.map(note => note.state), expected.states, 'note states');
  }
}

function framesFor(scenario, cadence) {
  const from = scenario.reset?.[0] ?? 0;
  if (cadence === 'stalls') {
    return [0, 0.91, 1.83, 2.67, 4.2, 8.8, scenario.endTime]
      .filter(time => time >= from && time <= scenario.endTime)
      .sort((a, b) => a - b);
  }
  if (!cadence) return [];
  const frames = [];
  for (let index = 0; from + index / cadence <= scenario.endTime; index++) {
    frames.push(from + index / cadence);
  }
  return frames;
}

function play(scenario, cadence) {
  const engine = new C.JudgeEngine(chartFor(scenario), scenario.options);
  if (scenario.reset) engine.reset(...scenario.reset);
  const frames = framesFor(scenario, cadence);
  let frame = 0;
  for (const input of scenario.inputs) {
    while (frame < frames.length && frames[frame] <= input.time) engine.update(frames[frame++]);
    if (input.down) engine.press(input.lane, input.time);
    else engine.release(input.lane, input.time);
  }
  while (frame < frames.length) engine.update(frames[frame++]);
  engine.update(scenario.endTime);
  return { engine, result: engine.finish() };
}

for (const [profile, cases] of Object.entries(contract.judgments)) {
  for (const [delta, rating] of cases) {
    test(`rules4 ${profile}: signed boundary ${delta}s is ${rating}`, () => {
      assert.equal(C.judge(delta, profile), rating);
      assert.equal(C.judge(-delta, profile), rating);
    });
  }
}

for (const scenario of contract.scenarios) {
  test(`rules4 ${scenario.id}: ${scenario.title}`, () => {
    const { engine, result } = play(scenario);
    expectedResult(result, scenario.expected, engine);
  });
  if (scenario.replay) {
    test(`rules4 replay ${scenario.id} matches the numeric oracle`, () => {
      const result = C.simulateReplay({
        format: 'DIVA-PULSE-REPLAY', version: 1, engine: '34.0.0',
        judgmentProfile: scenario.options?.judgmentProfile || 'standard',
        chart: chartFor(scenario), inputs: scenario.inputs, endTime: scenario.endTime,
        noFail: !!scenario.options?.noFail
      });
      expectedResult(result, scenario.expected);
    });
  }
  if (scenario.cadence) {
    for (const cadence of [30, 60, 144, 'stalls']) {
      test(`rules4 ${scenario.id} at ${cadence} rendering cadence matches the oracle`, () => {
        const { engine, result } = play(scenario, cadence);
        expectedResult(result, scenario.expected, engine);
      });
    }
  }
}

for (const row of contract.rankCases) {
  test(`rules4 rank: ${row.accuracy}% gives ${row.rank}`, () => {
    const engine = new C.JudgeEngine({
      notes: Array.from({ length: 100 }, (_, i) => ({ time: i + 1, lane: i % 6 }))
    }, { noFail: true });
    for (let i = 0; i < row.cool; i++) {
      engine.press(i % 6, i + 1);
      engine.release(i % 6, i + 1.01);
    }
    engine.update(101);
    const result = engine.finish();
    assert.equal(result.accuracy, row.accuracy);
    assert.equal(result.rank, row.rank);
    assert.equal(result.cleared, row.cleared);
  });
}

for (const noFail of [false, true]) {
  test(`rules4 life reaches 1 after nine misses, then 0; noFail=${noFail}`, () => {
    const engine = new C.JudgeEngine({
      notes: Array.from({ length: 10 }, (_, i) => ({ time: i + 1, lane: i % 6 }))
    }, { noFail });
    engine.update(9.2);
    assert.equal(engine.life, 1);
    assert.equal(engine.failed, false);
    engine.update(10.2);
    assert.equal(engine.life, 0);
    assert.equal(engine.failed, !noFail);
    assert.equal(engine.result().counts.MISS, 10);
    assert.equal(engine.result().score, 0);
  });
}

test('rules4 life is capped at 255 without capping the base score', () => {
  const engine = new C.JudgeEngine({
    notes: Array.from({ length: 65 }, (_, i) => ({ time: i + 1, lane: i % 6 }))
  });
  engine.update(66, true);
  assert.equal(engine.life, 255);
  assert.equal(engine.result().baseScore, 65000);
  assert.equal(engine.result().accuracy, 100);
});

test('rules4 full combo permits FINE and does not mean 100% accuracy', () => {
  const engine = new C.JudgeEngine({ notes: [{ time: 1, lane: 0 }] });
  engine.press(0, 1.05);
  const result = engine.finish();
  assert.equal(result.baseScore, 750);
  assert.equal(result.accuracy, 75);
  assert.equal(result.fullCombo, true);
  assert.equal(result.cleared, true);
  assert.equal(result.rank, 'C');
});

test('rules4 a FINE hold earns its declared duration from the actual press', () => {
  const engine = new C.JudgeEngine({ notes: [{ time: 1, lane: 0, type: 'hold', duration: 1 }] });
  engine.press(0, 1.05);
  engine.release(0, 2.05);
  const result = engine.finish();
  assert.equal(result.counts.FINE, 1);
  assert.equal(result.baseScore, 750);
  assert.equal(result.holdBonus, 200);
  assert.equal(result.score, 950);
  assert.equal(result.accuracy, 75);
  assert.equal(result.fullCombo, true);
});

test('rules4 chart offset shifts the target without changing the stored note time', () => {
  const source = { offset: 0.2, notes: [{ time: 1, lane: 0 }] };
  const engine = new C.JudgeEngine(source);
  engine.press(0, 1.2);
  assert.equal(engine.result().counts.COOL, 1);
  assert.equal(engine.result().score, 1000);
  assert.equal(source.notes[0].time, 1);
  assert.equal(engine.notes[0].time, 1);
});

test('rules4 difficulty labels do not secretly replace the chosen judgment profile', () => {
  for (const difficulty of ['EASY', 'NORMAL', 'HARD', 'EXTREME', 'EX EXTREME']) {
    const engine = new C.JudgeEngine({ difficulty, notes: [{ time: 1, lane: 0 }] }, { judgmentProfile: 'accessible' });
    engine.press(0, 1.04);
    assert.equal(engine.result().counts.COOL, 1, difficulty);
    assert.equal(engine.result().baseScore, 1000, difficulty);
  }
});

test('rules4 unknown judgment profile is refused', () => {
  assert.throws(() => new C.JudgeEngine({ notes: [] }, { judgmentProfile: 'official' }), /Profil/);
});

test('rules4 compatibility: a zero-duration held head currently defaults to five seconds', () => {
  for (const type of ['hold', 'chain']) {
    const engine = new C.JudgeEngine({ notes: [{ time: 1, lane: 5, type, duration: 0 }] });
    engine.press(5, 1);
    engine.release(5, 2);
    assert.equal(engine.result().holdBonus, 200, type);
    assert.equal(engine.result().score, 1200, type);
  }
});

test('rules4 V3 replay compatibility is explicit, not silently used for current play', () => {
  const fixture = contract.scenarios.find(row => row.id === 'CHAIN-03');
  const base = { format: 'DIVA-PULSE-REPLAY', chart: chartFor(fixture), inputs: fixture.inputs, endTime: 2 };
  const historical = C.simulateReplay({ ...base, engine: '3.0.0' });
  assert.deepEqual(historical.counts, { ...emptyCounts, COOL: 2 });
  assert.equal(historical.baseScore, 2000);
  assert.equal(historical.holdBonus, 100);
  assert.equal(historical.score, 2100);
  expectedResult(C.simulateReplay({ ...base, engine: '34.0.0' }), fixture.expected);
});

// Evaluate the actual App class without its browser bootstrap. No methods are
// rewritten: drawGame below is the production method, with an observed canvas
// and lightweight DOM stand-ins instead of a GPU/browser performance claim.
function appDrawingHarness(profile, { offset = 0, visualOffset = 0, speed = 1, noteTime = 1 } = {}) {
  const elements = new Map();
  const ctx = new Proxy({}, { get(target, property) { return property in target ? target[property] : () => {}; } });
  const canvas = { clientWidth: 960, clientHeight: 540, width: 960, height: 540, getContext: () => ctx };
  elements.set('notesCanvas', canvas);
  const document = { getElementById(id) {
    if (!elements.has(id)) elements.set(id, { style: {}, textContent: '', innerHTML: '' });
    return elements.get(id);
  } };
  const source = fs.readFileSync(path.join(__dirname, '../src/app.js'), 'utf8');
  const marker = '    const app = new App();';
  assert.equal(source.split(marker).length, 2, 'App bootstrap marker must be unique');
  const context = { PulseCore: C, PulseServices: {}, PulseStage: {}, document, matchMedia: () => ({ matches: false }), devicePixelRatio: 1 };
  vm.runInNewContext(source.slice(0, source.indexOf(marker)) + '})(globalThis);', context, { filename: 'app-class-contract.js' });
  const app = Object.create(context.PulseAppClass.prototype);
  const chart = C.validateChart({ id: 'render-contract', offset, notes: [{ id: 'target', time: noteTime, lane: 0, x: 0.5, y: 0.5, approach: 1.6 }] });
  app.engine = new C.JudgeEngine(chart, { judgmentProfile: profile });
  app.gameChart = chart;
  app.settings = { noteScale: 1, approachSpeed: speed, visualOffset, inputOffset: 0, reducedEffects: true, judgmentProfile: 'precision' };
  app.audio = { rate: 1 };
  app.song = { id: 'render-song', duration: 10, lyrics: [] };
  app.bursts = [];
  app.rect = () => ({ x: 0, y: 0, width: 960, height: 540 });
  let glyphs = [];
  app.drawGlyph = (...args) => glyphs.push(args);
  return { app, draw(time) { glyphs = []; app.drawGame(time, 2000); return glyphs; } };
}

for (const [profile, window] of [['standard', 0.14], ['accessible', 0.18], ['precision', 0.1]]) {
  test(`render ${profile}: target remains visible through its inclusive late boundary`, () => {
    const harness = appDrawingHarness(profile);
    const before = JSON.stringify(harness.app.engine.result());
    assert.equal(harness.draw(1 + window).length, 1);
    assert.equal(harness.draw(1 + window + 0.0001).length, 0);
    assert.equal(JSON.stringify(harness.app.engine.result()), before, 'rendering never judges a note');
  });
  test(`render ${profile}: candidate selection includes the full chosen window`, () => {
    const notes = [{ time: 1, lane: 0 }];
    assert.equal(C.visibleNotes(notes, 1 + window, 0, 1, window).length, 1);
    assert.equal(C.visibleNotes(notes, 1 + window + 0.002, 0, 1, window).length, 0);
  });
}

test('render accessible: a pending target at +170ms is visible and still judged SAD', () => {
  const { app, draw } = appDrawingHarness('accessible');
  app.engine.update(1.17);
  assert.equal(app.engine.notes[0].state, 'pending');
  assert.equal(draw(1.17).length, 1);
  assert.equal(app.engine.press(0, 1.17).rating, 'SAD');
  assert.equal(app.engine.result().baseScore, 100);
});

test('render: chart offset and visual calibration retain their separate meaning', () => {
  const { draw } = appDrawingHarness('accessible', { offset: 0.2, visualOffset: 50 });
  assert.equal(draw(1.42).length, 1);
  assert.equal(draw(1.431).length, 0);
});

test('render: approach speed still sets the same incoming-note start', () => {
  const { draw } = appDrawingHarness('standard', { noteTime: 3, speed: 2 });
  assert.equal(draw(2.1999).length, 0);
  assert.ok(draw(2.2).length >= 1);
});

test('render: conservative candidate selection retains the longest legal approach', () => {
  const notes = [{ time: 31, lane: 0, approach: 15 }];
  assert.equal(C.visibleNotes(notes, 1, 0, 0.5, 0.18).length, 1);
});

test('rules4 record keys use the take profile even after settings change', () => {
  const { app } = appDrawingHarness('accessible');
  app.view = 'game';
  assert.ok(app.scoreKey(app.gameChart).endsWith('/rules4/profile-accessible'));
  app.view = 'library';
  assert.ok(app.scoreKey(app.gameChart).endsWith('/rules4/profile-precision'));
  app.settings.judgmentProfile = 'standard';
  assert.ok(app.scoreKey(app.gameChart).endsWith('/rules4'));
});
