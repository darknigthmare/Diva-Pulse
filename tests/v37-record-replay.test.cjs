'use strict';
// GAME-05: production App/integration methods at controlled transport and commit
// boundaries. Expected scores are literals, not a second scoring engine.
const test = require('node:test');
const A = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const C = require('../src/core.js');
require('../src/creator.js');
require('../src/live-core.js');
require('../src/precision-core.js');
const source = name => fs.readFileSync(path.join(__dirname, '../src', name), 'utf8');
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function element() {
  return { style: {}, dataset: {}, textContent: '', innerHTML: '', hidden: false,
    classList: { add() {}, remove() {}, toggle() {} }, pause() {}, append() {},
    replaceChildren() {}, addEventListener() {}, querySelector() { return null; } };
}
function chart(overrides = {}) {
  return C.validateChart({ id: 'chart-a', title: 'Take A', notes: [{ id: 'one', time: 1, lane: 0 }], ...overrides });
}
function harness({ profile = 'standard', noFail = false, mode = 'play', currentChart = chart() } = {}) {
  const elements = new Map();
  const get = id => { if (!elements.has(id)) elements.set(id, element()); return elements.get(id); };
  const context = { PulseCore: C, PulseServices: {}, PulseStage: {}, structuredClone,
    document: { hidden: false, getElementById: get, querySelectorAll: () => [], createElement: element },
    matchMedia: () => ({ matches: false }), window: { scrollTo() {} } };
  vm.createContext(context);
  const appSource = source('app.js'), marker = '    const app = new App();';
  A.equal(appSource.split(marker).length, 2);
  vm.runInContext(appSource.slice(0, appSource.indexOf(marker)) + '})(globalThis);', context);
  const app = Object.create(context.PulseAppClass.prototype);
  const rows = new Map(), writes = [], messages = [];
  const song = { id: 'song-a', title: 'Song A', duration: 10, demoId: 'test-a', audioHash: 'hash-a',
    charts: [currentChart], lyrics: [], scene: {} };
  const audio = { ctx: { state: 'running' }, rate: 1, playing: false, pausedAt: 0,
    get time() { return this.pausedAt; }, timeAt() { return this.pausedAt; },
    play(buffer, from, rate) { this.playing = true; this.pausedAt = from; this.rate = rate; },
    pause() { this.playing = false; }, stop() { this.playing = false; }, sfx() {} };
  Object.assign(app, { song, songs: [song], scores: [], settings: { judgmentProfile: profile, noFail, inputOffset: 0 },
    selectedChartId: currentChart.id, difficulty: currentChart.difficulty, view: 'library', mode: null,
    audio, buffer: { duration: 10 }, editor: { recording: false }, heldSources: new Map(),
    laneSources: Array.from({ length: 6 }, () => new Set()), padPrevious: new Set(),
    v3State: { id: 'v3-state', sessions: [], setlists: [] }, replayInputs: [], replayCursor: 0,
    async prepareAudio() {}, async prepareVideo() {}, async applyScene() {}, closeModal() {},
    drawTiming() {}, renderSettings() {}, renderLibrary() {}, formatTime: String,
    toast(message) { messages.push(message); },
    store: { async put(store, row) {
      const copy = structuredClone(row); writes.push({ store, row: copy });
      await app.beforeCommit?.(store, copy);
      rows.set(store + '/' + copy.id, copy);
    } } });
  context.app = app; context.C = C; context.$ = get;
  context.wrap = (name, fn) => { const old = app[name].bind(app); app[name] = (...args) => fn(old, ...args); };
  const integration = source('enhancements.js');
  const from = integration.indexOf('  app.pressSource=function'), to = integration.indexOf("  bind('exportReplay'");
  A.ok(from >= 0 && to > from);
  vm.runInContext(integration.slice(from, to), context);
  return { app, elements, rows, writes, messages, context, mode,
    async start(requestedMode = mode) {
      if (requestedMode === 'replay') app.pendingReplay = {
        format: 'DIVA-PULSE-REPLAY', version: 1, engine: C.VERSION, judgmentProfile: profile, noFail,
        chart: structuredClone(currentChart), inputs: [{ time: 1, lane: 0, down: true }, { time: 1.01, lane: 0, down: false }], endTime: 2
      };
      return app.startGame(requestedMode, requestedMode === 'practice' ? { from: 0, to: 5, rate: 1, loop: false } : null);
    } };
}
function hit(app, time = 1, lane = 0) {
  app.audio.pausedAt = time; app.pressSource('test-' + lane, lane);
  app.audio.pausedAt = time + .01; app.releaseSource('test-' + lane);
}
function perfect(app, time = 1) {
  app.engine.press(0, time); app.engine.release(0, time + .01); app.engine.update(2); app.audio.pausedAt = 2;
}
function scoreRows(h) { return [...h.rows.entries()].filter(([key]) => key.startsWith('scores/')).map(([, row]) => row); }
async function waitFor(predicate) {
  for (let i = 0; i < 100; i++) { if (predicate()) return; await new Promise(resolve => setImmediate(resolve)); }
  throw Error('Expected asynchronous boundary was not entered');
}

for (const profile of ['standard', 'accessible', 'precision']) {
  for (const [mode, noFail, eligible] of [['play', false, true], ['play', true, false], ['practice', false, false],
    ['autoplay', false, false], ['replay', false, false], ['pv', false, false]]) {
    test('GAME-05 '+profile+' '+mode+' noFail='+noFail+': only an unassisted live writes a record', async () => {
      const h = harness({ profile, noFail, mode }); await h.start();
      if (mode === 'play') hit(h.app);
      else if (h.app.engine) perfect(h.app);
      h.app.audio.pausedAt = 2;
      await h.app.finish();
      const records = scoreRows(h);
      A.equal(records.length, eligible ? 1 : 0);
      if (eligible) {
        A.equal(records[0].score, 1000); A.equal(records[0].judgmentProfile, profile);
        A.equal(records[0].rulesVersion, 4);
        A.ok(records[0].id.endsWith('/rules4' + (profile === 'standard' ? '' : '/profile-' + profile)));
      }
      if (mode === 'play') {
        A.equal(h.app.lastReplay.noFail, noFail); A.equal(h.app.lastReplay.judgmentProfile, profile);
        A.equal(C.simulateReplay(h.app.lastReplay).score, 1000);
        A.equal(h.app.v3State.sessions[0].mode, noFail ? 'no-fail' : 'play');
      } else A.equal(h.app.lastReplay, undefined);
    });
  }
  for (const noFail of [false, true]) {
    test('GAME-05 '+profile+': eligibility and replay use take noFail='+noFail+', not changed preferences', async () => {
      const h = harness({ profile, noFail }); await h.start(); hit(h.app);
      h.app.settings.noFail = !noFail;
      h.app.settings.judgmentProfile = profile === 'standard' ? 'precision' : 'standard';
      h.app.audio.pausedAt = 2;
      await h.app.finish();
      A.equal(scoreRows(h).length, noFail ? 0 : 1);
      A.equal(h.app.lastReplay.noFail, noFail);
      A.equal(h.app.lastReplay.judgmentProfile, profile);
      A.equal(h.app.v3State.sessions[0].mode, noFail ? 'no-fail' : 'play');
    });
  }
}

test('GAME-05 record replacement preserves other profiles, legacy rules and changed-chart signatures', async () => {
  const h = harness({ profile: 'accessible' }); await h.start(); hit(h.app); h.app.audio.pausedAt = 2;
  const prefix = 'song-a/chart-a/' + C.chartSignature(h.app.gameChart);
  const older = [
    { id: prefix + '/rules4', score: 777, marker: 'standard' },
    { id: prefix + '/rules4/profile-accessible', score: 750, marker: 'replace this only' },
    { id: prefix + '/rules4/profile-precision', score: 888, marker: 'precision' },
    { id: prefix + '/rules3', score: 9999, marker: 'historical' },
    { id: 'song-a/chart-a/' + C.chartSignature(chart({ offset: .01 })) + '/rules4/profile-accessible', score: 9999, marker: 'other chart' }
  ];
  h.app.scores = structuredClone(older);
  for (const row of older) h.rows.set('scores/' + row.id, structuredClone(row));
  await h.app.finish();
  A.equal(h.app.scores.find(row => row.id === older[1].id).score, 1000);
  for (const row of older.filter((_, i) => i !== 1)) A.deepEqual(h.app.scores.find(value => value.id === row.id), row);
});
for (const previousScore of [1000, 1100]) {
  test('GAME-05 a '+previousScore+'-point record survives a tied/lower new 1000-point live', async () => {
    const h = harness(); await h.start(); hit(h.app); h.app.audio.pausedAt = 2;
    const previous = { id: h.app.scoreKey(h.app.gameChart), score: previousScore, marker: 'unchanged' };
    h.app.scores = [structuredClone(previous)]; h.rows.set('scores/' + previous.id, structuredClone(previous));
    await h.app.finish();
    A.equal(h.writes.filter(write => write.store === 'scores').length, 0);
    A.deepEqual(h.app.scores, [previous]);
  });
}

test('GAME-05 leaving during a record commit preserves the chosen view and finalizes the original replay/history', async () => {
  const h = harness({ profile: 'accessible' }); await h.start(); hit(h.app); h.app.audio.pausedAt = 2;
  const gate = deferred(); h.app.beforeCommit = store => store === 'scores' ? gate.promise : undefined;
  const done = h.app.finish(); await waitFor(() => h.writes.some(write => write.store === 'scores'));
  await h.app.showView('settings');
  h.app.song = { id: 'other-song', title: 'Other Song', duration: 10, charts: [] };
  h.app.settings.noFail = true; h.app.settings.judgmentProfile = 'precision';
  gate.resolve(); const completion = await done;
  A.equal(h.app.view, 'settings'); A.equal(h.app.engine, null);
  A.equal(completion.replay.songId, 'song-a'); A.equal(completion.replay.chart.id, 'chart-a');
  A.equal(completion.replay.noFail, false); A.equal(completion.replay.judgmentProfile, 'accessible');
  A.equal(C.simulateReplay(completion.replay).score, 1000);
  A.equal(h.app.v3State.sessions[0].songId, 'song-a');
  A.equal(h.app.v3State.sessions[0].mode, 'play');
});

test('GAME-05 a late old finish cannot change the new engine, audio, inputs, result or finishing state', async () => {
  const h = harness(); await h.start(); hit(h.app); h.app.audio.pausedAt = 2;
  const gate = deferred(); h.app.beforeCommit = store => store === 'scores' ? gate.promise : undefined;
  const old = h.app.finish(); await waitFor(() => h.writes.some(write => write.store === 'scores'));
  await h.app.showView('library');
  const next = chart({ id: 'chart-b', title: 'Take B', notes: [{ id: 'two', time: 3, lane: 1 }] });
  h.app.song = { id: 'song-b', title: 'Song B', duration: 10, charts: [next] };
  h.app.selectedChartId = next.id; h.app.settings.noFail = true; h.app.settings.judgmentProfile = 'precision';
  await h.app.startGame('play');
  const engine = h.app.engine, inputs = h.app.replayInputs, state = JSON.stringify(engine.result()), last = h.app.lastResult;
  gate.resolve(); const completion = await old;
  A.equal(h.app.view, 'game'); A.equal(h.app.engine, engine); A.equal(h.app.audio.playing, true);
  A.equal(h.app.finishing, false); A.equal(h.app.replayInputs, inputs);
  A.equal(h.app.lastResult, last); A.equal(JSON.stringify(engine.result()), state);
  A.equal(completion.replay.title, 'Song A'); A.equal(completion.replay.result.score, 1000);
  A.equal(scoreRows(h)[0].songId, 'song-a');
});

test('GAME-05 an older commit cannot replace a newer completed no-fail replay', async () => {
  const h = harness(); await h.start(); hit(h.app); h.app.audio.pausedAt = 2;
  const gate = deferred(); h.app.beforeCommit = store => store === 'scores' ? gate.promise : undefined;
  const old = h.app.finish(); await waitFor(() => h.writes.some(write => write.store === 'scores'));
  await h.app.showView('library'); h.app.settings.noFail = true; await h.app.startGame('play');
  hit(h.app, 1.04); h.app.audio.pausedAt = 2; await h.app.finish();
  const newerReplay = h.app.lastReplay, newerResult = h.app.lastResult;
  A.equal(newerReplay.result.score, 750); A.equal(newerReplay.noFail, true);
  gate.resolve(); await old;
  A.equal(h.app.lastReplay, newerReplay); A.equal(h.app.lastResult, newerResult);
  A.equal(h.app.v3State.sessions.length, 2);
  A.deepEqual([...h.app.v3State.sessions.map(session => session.mode)].sort(), ['no-fail', 'play']);
});

for (const scores of [[1000, 750], [750, 1000]]) for (const reverseRelease of [false, true]) {
  test('GAME-05 overlapping '+scores.join(' then ')+' records, '+(reverseRelease?'second':'first')+' release first: best wins', async () => {
    const h = harness(); await h.start(); hit(h.app, scores[0] === 1000 ? 1 : 1.04); h.app.audio.pausedAt = 2;
    const first = deferred(), second = deferred(); let commits = 0;
    h.app.beforeCommit = store => store === 'scores' ? [first, second][commits++].promise : undefined;
    const old = h.app.finish(); await waitFor(() => commits === 1);
    await h.app.showView('library'); await h.app.startGame('play');
    hit(h.app, scores[1] === 1000 ? 1 : 1.04); h.app.audio.pausedAt = 2;
    const current = h.app.finish();
    if (reverseRelease) { second.resolve(); await Promise.resolve(); first.resolve(); }
    else { first.resolve(); await Promise.resolve(); second.resolve(); }
    await Promise.all([old, current]);
    A.equal(scoreRows(h).length, 1); A.equal(scoreRows(h)[0].score, 1000);
    A.equal(h.app.scores[0].score, 1000); A.equal(h.app.lastResult.score, scores[1]);
    A.equal(h.app.lastReplay.result.score, scores[1]);
    A.equal(h.app.v3State.sessions.length, 2);
  });
}

test('GAME-05 a refused record commit leaves the old record intact and keeps the actual replay', async () => {
  const h = harness(); await h.start(); hit(h.app); h.app.audio.pausedAt = 2;
  const previous = { id: h.app.scoreKey(h.app.gameChart), score: 750 };
  h.app.scores = [structuredClone(previous)]; h.rows.set('scores/' + previous.id, structuredClone(previous));
  h.app.beforeCommit = store => { if (store === 'scores') throw Error('Deliberate commit refusal'); };
  await h.app.finish();
  A.deepEqual(h.app.scores, [previous]); A.deepEqual(scoreRows(h), [previous]);
  A.equal(h.app.lastReplay.result.score, 1000);
  A.ok(h.messages.some(message => message.includes('record')));
});

test('GAME-05 a cancelled replay launch leaves the library and active take input log intact', async () => {
  const h = harness(); await h.start(); hit(h.app); const oldLog = h.app.replayInputs;
  const oldCharts = h.app.song.charts, beforeCharts = JSON.stringify(oldCharts), owner = h.app.song;
  h.app.pendingReplay = { format: 'DIVA-PULSE-REPLAY', version: 1, engine: C.VERSION, noFail: true,
    judgmentProfile: 'precision', chart: chart({ id: 'recorded-chart' }), inputs: [], endTime: 2 };
  const gate = deferred(); let entered = false;
  h.app.prepareVideo = () => { entered = true; return gate.promise; };
  const pending = h.app.startGame('replay'); await waitFor(() => entered);
  const other = { id: 'song-b', title: 'Song B', charts: [chart({ id: 'chart-b' })] };
  h.app.song = other; h.app.selectedChartId = 'chart-b';
  gate.resolve(); A.equal(await pending, false);
  A.equal(owner.charts, oldCharts); A.equal(JSON.stringify(owner.charts), beforeCharts);
  A.equal(other.charts[0].id, 'chart-b'); A.equal(h.app.selectedChartId, 'chart-b');
  A.equal(h.app.replayInputs, oldLog);
});

test('GAME-05 replay launch snapshots its recorded chart/options/inputs before awaited preparation', async () => {
  const h = harness(); const originalCharts = h.app.song.charts;
  h.app.pendingReplay = { format: 'DIVA-PULSE-REPLAY', version: 1, engine: C.VERSION, noFail: true,
    judgmentProfile: 'accessible', chart: chart({ id: 'recorded-chart' }),
    inputs: [{ time: 1, lane: 0, down: true }, { time: 1.01, lane: 0, down: false }], endTime: 2 };
  const gate = deferred(); let entered = false;
  h.app.prepareVideo = () => { entered = true; return gate.promise; };
  const pending = h.app.startGame('replay'); await waitFor(() => entered);
  h.app.pendingReplay = { ...h.app.pendingReplay, noFail: false, judgmentProfile: 'precision', inputs: [] };
  gate.resolve(); await pending;
  A.equal(h.app.song.charts, originalCharts); A.equal(h.app.selectedChartId, 'chart-a');
  A.equal(h.app.engine.profile, 'accessible'); A.equal(h.app.engine.options.noFail, true);
  h.app.advanceReplay(2);
  A.equal(h.app.engine.result().score, 1000); A.equal(h.app.gameChart.id, 'recorded-chart');
});

for (const profile of ['standard', 'accessible', 'precision']) {
  test('GAME-05 '+profile+': captured HOLD/chord/chain replay has the independent 4170-point oracle', async () => {
    const notes = [{ id: 'hold', time: 1, lane: 0, type: 'hold', duration: 1 },
      { id: 'chord', time: 1, lane: 1 }, { id: 'slide', time: 1.2, lane: 4, type: 'slide' },
      { id: 'chain', time: 1.4, lane: 4, type: 'chain', duration: .3 }];
    const h = harness({ profile, currentChart: chart({ notes }) }); await h.start();
    for (const [time, lane, down] of [[1, 0, true], [1, 1, true], [1.02, 1, false], [1.2, 4, true],
      [1.5, 4, false], [1.75, 0, false]]) {
      h.app.audio.pausedAt = time;
      if (down) h.app.pressSource('test-' + lane, lane); else h.app.releaseSource('test-' + lane);
    }
    h.app.engine.update(2); h.app.audio.pausedAt = 2; await h.app.finish();
    for (const result of [h.app.lastResult, C.simulateReplay(h.app.lastReplay)]) {
      A.equal(result.score, 4170); A.equal(result.holdBonus, 170); A.equal(result.maxCombo, 4);
      A.equal(result.counts.COOL, 4); A.equal(result.counts.MISS, 0);
    }
    A.equal(h.app.lastReplay.version, 1); A.equal(h.app.lastReplay.engine, C.VERSION);
  });
}

function installOuterFinishes(h) {
  require('../src/academy.js');
  const { app, context } = h;
  app.practiceTakes = []; app.v4State = { id: 'v4-state', practice: [] };
  app.v5State = { id: 'v5-state', academy: {} };
  context.lessonPassed = C.lessonPassed;
  const live = source('live-app.js');
  const remember = live.indexOf(' app.rememberPractice=function'), rememberEnd = live.indexOf('\n', remember);
  vm.runInContext(live.slice(remember, rememberEnd), context);
  const lf = live.indexOf(" wrap('finish',async prev=>{"), le = live.indexOf('\n', lf);
  vm.runInContext(live.slice(lf, le), context);
  const academy = source('academy.js'), af = academy.indexOf(' const finish=app.finish.bind(app);'), ae = academy.indexOf('\n };', af) + 4;
  vm.runInContext(academy.slice(af, ae), context);
  const director = source('director-app.js'), df = director.indexOf(" wrap('finish',async old=>{"), de = director.indexOf('\n', df);
  vm.runInContext(director.slice(df, de), context);
}

test('GAME-05 every active finish wrapper propagates the captured result/profile', async () => {
  const h = harness({ profile: 'accessible' }); installOuterFinishes(h);
  await h.start(); hit(h.app); h.app.audio.pausedAt = 2;
  const completion = await h.app.finish();
  A.equal(completion.result.score, 1000); A.equal(completion.profile, 'accessible');
  A.equal(completion.current(), true);
  A.ok(h.elements.get('resultMode').textContent.endsWith(' · ACCESSIBLE'));
});

test('GAME-05 the outer finish chain does not append stale profile text after navigation', async () => {
  const h = harness(); installOuterFinishes(h);
  await h.start(); hit(h.app); h.app.audio.pausedAt = 2;
  const gate = deferred(); h.app.beforeCommit = store => store === 'scores' ? gate.promise : undefined;
  const pending = h.app.finish(); await waitFor(() => h.writes.some(write => write.store === 'scores'));
  await h.app.showView('settings');
  h.context.$('resultMode').textContent = 'KEEP NEW UI';
  gate.resolve(); const completion = await pending;
  A.equal(completion.result.score, 1000); A.equal(completion.current(), false);
  A.equal(h.elements.get('resultMode').textContent, 'KEEP NEW UI');
});

test('GAME-05 actual practice finish keeps its captured result and writes no normal record', async () => {
  const h = harness({ mode: 'practice' }); installOuterFinishes(h);
  await h.start(); perfect(h.app);
  const completion = await h.app.finish();
  A.equal(completion.result.score, 1000); A.equal(completion.mode, 'practice');
  A.equal(h.app.practiceTakes.length, 1); A.equal(h.app.practiceTakes[0].accuracy, 100);
  A.equal(h.writes.filter(write => write.store === 'scores').length, 0);
});

test('GAME-05 an awaited academy commit cannot show an old medal on a newer take', async () => {
  const h = harness({ mode: 'practice', currentChart: chart({ id: 'academy-v5-pulse' }) });
  installOuterFinishes(h); h.app.activeLesson = C.LESSONS.find(lesson => lesson.id === 'pulse');
  await h.start(); perfect(h.app);
  const gate = deferred(); h.app.beforeCommit = (store, row) => row.id === 'v5-state' ? gate.promise : undefined;
  const pending = h.app.finish(); await waitFor(() => h.writes.some(write => write.row.id === 'v5-state'));
  await h.app.showView('library'); h.app.activeLesson = null; await h.app.startGame('play');
  const engine = h.app.engine, stats = h.elements.get('performanceStats').innerHTML;
  gate.resolve(); const completion = await pending;
  A.equal(completion.mode, 'practice'); A.equal(completion.current(), false);
  A.equal(h.app.engine, engine); A.equal(h.app.view, 'game'); A.equal(h.app.audio.playing, true);
  A.equal(h.elements.get('performanceStats').innerHTML, stats);
  A.equal(h.app.v5State.academy.pulse.completed, true);
});

test('GAME-05 final source release is included in the replay snapshot and caps the live HOLD', async () => {
  const h = harness({ currentChart: chart({ notes: [{ id: 'hold', time: 1, lane: 0, type: 'hold', duration: 2 }] }) });
  await h.start(); h.app.audio.pausedAt = 1; h.app.pressSource('test-0', 0);
  h.app.audio.pausedAt = 1.5; await h.app.finish();
  A.equal(h.app.lastResult.score, 1100); A.equal(C.simulateReplay(h.app.lastReplay).score, 1100);
  A.equal(h.app.lastReplay.inputs.at(-1).down, false); A.equal(h.app.lastReplay.inputs.at(-1).time, 1.5);
});

test('GAME-05 a refused history commit does not manufacture a saved session', async () => {
  const h = harness(); await h.start(); hit(h.app); h.app.audio.pausedAt = 2;
  h.app.beforeCommit = (store, row) => { if (row.id === 'v3-state') throw Error('History commit refused'); };
  await h.app.finish();
  A.equal(h.app.v3State.sessions.length, 0); A.equal(h.rows.has('settings/v3-state'), false);
  A.equal(h.app.lastReplay.result.score, 1000);
});

function installVisibilityLifecycle(h) {
  const a = h.app, doc = h.context.document, listeners = new Map();
  const listen = (name, fn) => { const list = listeners.get(name) || []; list.push(fn); listeners.set(name, list); };
  doc.addEventListener = listen; doc.documentElement = { dataset: {} };
  const make = doc.createElement; doc.createElement = (...args) => ({ ...make(...args), setAttribute() {} });
  for (const id of ['feedbackSettings33', 'game']) h.context.$(id).insertAdjacentHTML = () => {};
  h.context.window.addEventListener = listen;
  a.audio.init = async () => a.audio.ctx;
  a.openModal = () => { h.modalOpen = true; }; a.closeModal = () => { h.modalOpen = false; };
  vm.runInContext(source('live-feedback34.js'), h.context);
  h.context.PulseLive34.install(a);
  // The real base blur registration is evaluated unchanged; no second copy of
  // its behavior or of Live34's visibility callback is authored in this test.
  const base = source('app.js'), from = base.indexOf("            window.addEventListener('blur',"),
    to = base.indexOf("            document.addEventListener('visibilitychange',", from);
  A.ok(from >= 0 && to > from);
  vm.runInContext('(function(){' + base.slice(from, to) + '}).call(app);', h.context);
  return name => { for (const callback of listeners.get(name) || []) callback(); };
}
for (const event of ['visibilitychange', 'blur']) {
  test('GAME-05 '+event+' during commit preserves the completed take and never restarts audio', async () => {
    const h = harness(); installOuterFinishes(h); const dispatch = installVisibilityLifecycle(h);
    await h.start(); hit(h.app); h.app.audio.pausedAt = 2;
    const gate = deferred(); h.app.beforeCommit = store => store === 'scores' ? gate.promise : undefined;
    const pending = h.app.finish(); await waitFor(() => h.writes.some(write => write.store === 'scores'));
    const takeEpoch = h.app.liveTakeEpoch();
    if (event === 'visibilitychange') h.context.document.hidden = true;
    dispatch(event); gate.resolve(); const completion = await pending;
    A.equal(h.app.liveTakeEpoch(), takeEpoch); A.equal(completion.current(), true);
    A.equal(h.app.view, 'results'); A.equal(h.app.audio.playing, false);
    A.equal(completion.result.score, 1000); A.equal(completion.replay.result.score, 1000);
    h.context.document.hidden = false; dispatch('visibilitychange');
    A.equal(h.app.audio.playing, false);
  });
}

test('GAME-05 a new preparation invalidates an older finish before replacing its engine', async () => {
  const h = harness(); installOuterFinishes(h); installVisibilityLifecycle(h);
  await h.start(); hit(h.app); h.app.audio.pausedAt = 2;
  const commit = deferred(), video = deferred(); let preparing = false;
  h.app.beforeCommit = store => store === 'scores' ? commit.promise : undefined;
  const old = h.app.finish(); await waitFor(() => h.writes.some(write => write.store === 'scores'));
  const oldEngine = h.app.engine;
  h.app.prepareVideo = () => { preparing = true; return video.promise; };
  const next = h.app.startGame('play'); await waitFor(() => preparing);
  h.context.$('resultMode').textContent = 'NEXT PREPARATION';
  commit.resolve(); const completion = await old;
  A.equal(completion.current(), false); A.equal(h.app.view, 'game'); A.equal(h.app.engine, oldEngine);
  A.equal(h.elements.get('resultMode').textContent, 'NEXT PREPARATION');
  video.resolve(); await next;
  A.notEqual(h.app.engine, oldEngine); A.equal(h.app.finishing, false); A.equal(h.app.audio.playing, true);
});

test('GAME-05 real navigation invalidates the finishing take independently of audio interruptions', async () => {
  const h = harness(); installOuterFinishes(h); installVisibilityLifecycle(h);
  await h.start(); hit(h.app); h.app.audio.pausedAt = 2;
  const commit = deferred(); h.app.beforeCommit = store => store === 'scores' ? commit.promise : undefined;
  const pending = h.app.finish(); await waitFor(() => h.writes.some(write => write.store === 'scores'));
  const before = h.app.liveTakeEpoch(); await h.app.showView('settings');
  A.ok(h.app.liveTakeEpoch() > before); commit.resolve(); const completion = await pending;
  A.equal(completion.current(), false); A.equal(h.app.view, 'settings');
  A.equal(h.app.engine, null); A.equal(h.app.audio.playing, false);
});
