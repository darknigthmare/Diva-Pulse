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
require('../src/v10-core.js');
require('../src/mmd-surface.js');
const D = require('../src/director-core.js');
const A = require('../src/autoshow-core.js');
const G = require('../src/stage.js');
const source = file => fs.readFileSync(path.join(__dirname, '../src', file), 'utf8');
const node = () => ({ p: [0, 0, 0], q: [0, 0, 0, 1], s: [1, 1, 1], children: [], world: G.math.I() });

// Production rendering and camera sampling run unchanged. Only GPU submission is
// instrumented; this harness makes no claim about physical GPU or visual comfort.
function stage() {
  const uniforms = {};
  const gl = new Proxy({
    uniformMatrix4fv(key, transpose, value) { uniforms[key] = Array.from(value); },
    uniform3fv(key, value) { uniforms[key] = Array.from(value); },
    uniform1f(key, value) { uniforms[key] = value; }
  }, { get(target, key) { return target[key] || (() => {}); } });
  const s = Object.assign(Object.create(G.Stage.prototype), {
    available: true, canvas: { clientWidth: 960, clientHeight: 540, width: 960, height: 540 },
    quality: 1, gl, u: { View: 'View', MVP: 'MVP', LightColor: 'LightColor', LightIntensity: 'LightIntensity' },
    reduceMotion: true, stageId: 'arena', cameraMode: 'auto', dance: 'pose', events: [],
    frame: 0, cast: ['miku'], spacing: 1, modelScale: 1, bars: [node(), node()], particles: [node()],
    rigs: [], performers: node(), environment: node(), lights: true, blend: .5,
    setStage(id) { this.stageId = id; }, uniforms
  });
  s.environment.geo = { vao: {}, count: 0 };
  return s;
}
function render(s, time, options = {}) {
  s.render(time, 120, options);
  return {
    eye: [...s.eye], target: [...s.target], matrix: [...s.uniforms.MVP],
    light: s.uniforms.LightColor, intensity: s.uniforms.LightIntensity,
    particles: s.particles.map(p => [...p.p]), bars: s.bars.map(b => [...b.s]), stage: s.stageId
  };
}
const camera = frame => ({ eye: frame.eye, target: frame.target, matrix: frame.matrix });
function mmd() {
  return {
    kind: 'mmd', root: node(), baseScale: [1, 1, 1], basePosition: [0, 0, 0], bones: [],
    pmx: { bones: [], morphs: [], materials: [], positions: new Float32Array(), uv: new Float32Array() },
    geos: [], parts: [], boneTracks: new Map(), morphTracks: new Map(), morphByName: new Map(),
    cameraTracks: [
      { frame: 0, pos: [0, 1.6, 0], rot: [0, 0, 0], distance: 8, fov: 35 },
      { frame: 300, pos: [2, 2, 0], rot: [.4, 1.2, 0], distance: 4, fov: 80 }
    ], useCamera: true, useIK: false, loop: false
  };
}
function director(s, extra = {}) {
  const config = D.normalizeDirector({ duration: 20, count: 1,
    cameraTrack: [
      { time: 0, yaw: 0, pitch: 10, distance: 8, fov: 35 },
      { time: 10, yaw: 90, pitch: 30, distance: 4, fov: 80 }
    ], lightTrack: [
      { time: 0, intensity: .6, color: [.7, .8, 1] },
      { time: 10, intensity: 2.4, color: [1, .2, .3] }
    ], ...extra });
  const model = mmd();
  model.directorClips = [{ start: 0, end: 20, rate: 1, motionStart: 0, transition: 0, loop: false, camera: false,
    motion: { boneTracks: new Map(), morphTracks: new Map(), cameraTracks: [] } }];
  model.directorTransform = { scale: 1 };
  s.director = { models: [model], config };
  return config;
}
function autoShow() {
  return A.generate({ id: 'motion36', title: 'Motion probe', duration: 20, bpm: 120, charts: [],
    scene: { stage: 'arena', cast: ['miku', 'rin', 'len'], costumes: [], camera: 'auto', dance: 'idol', events: [], spacing: 1, lights: true } });
}

for (const kind of ['director', 'vmd', 'builtin-cuts', 'autoshow', 'autoshow-manual-camera', 'director-preview']) {
  test(`V36 reduced motion fixes view and projection for ${kind}, including backward seek`, () => {
    const s = stage();
    if (kind.includes('director') || kind === 'autoshow-manual-camera') director(s);
    if (kind === 'vmd') s.custom = mmd();
    if (kind === 'builtin-cuts') s.events = [{ time: 0, camera: 'front' }, { time: 4, camera: 'close' }, { time: 8, camera: 'high' }];
    if (kind.startsWith('autoshow')) { s.autoShowPlan = autoShow(); s.autoShowPlan.overrides.camera = kind.endsWith('manual-camera'); }
    const before = JSON.stringify({ events: s.events, config: s.director?.config, plan: s.autoShowPlan, cameraTracks: s.custom?.cameraTracks });
    const frames = [0, 9, 2].map(time => { if (kind === 'director-preview') s.directorPreview = time; return camera(render(s, time)); });
    assert.deepEqual(frames[1], frames[0]);
    assert.deepEqual(frames[2], frames[0]);
    assert.equal(JSON.stringify({ events: s.events, config: s.director?.config, plan: s.autoShowPlan, cameraTracks: s.custom?.cameraTracks }), before);
  });
}

test('V36 normal Director camera and FOV return after reduced motion is disabled', () => {
  const s = stage(); director(s);
  const calm = camera(render(s, 0));
  s.reduceMotion = false;
  const start = camera(render(s, 0)), end = camera(render(s, 9));
  assert.notDeepEqual(end, start);
  s.reduceMotion = true;
  assert.deepEqual(camera(render(s, 9)), calm);
});

test('V36 decorative particles, bars and Director light stay still despite musical energy changes', () => {
  const s = stage(); director(s);
  const first = render(s, 0, { energy: .1 }), later = render(s, 9, { energy: .9 });
  for (const field of ['particles', 'bars', 'light', 'intensity']) assert.deepEqual(later[field], first[field], field);
});

test('V36 automated stage changes stop in calm mode and return in normal mode', () => {
  const s = stage(); s.events = [{ time: 0, stage: 'arena' }, { time: 4, stage: 'sakura' }];
  render(s, 0); render(s, 5); assert.equal(s.stageId, 'arena');
  s.reduceMotion = false; render(s, 5); assert.equal(s.stageId, 'sakura');
});

test('V36 a portrait calm view contains the entire declared group over all formations', () => {
  const s = stage(); s.canvas.clientWidth = 390; s.canvas.clientHeight = 844;
  director(s, { count: 4, formations: [
    { time: 0, positions: [[-6, 0, 0], [-2, 0, 0], [2, 0, 0], [6, 0, 0]] },
    { time: 5, positions: [[-8, 0, -2], [-3, 0, 1], [3, 0, 1], [8, 0, -2]] }
  ] });
  const f = render(s, 0);
  for (const form of s.director.config.formations) for (const p of form.positions) for (const height of [0, 3]) {
    const v = [p[0], p[1] + height, p[2], 1], m = f.matrix;
    const clip = [0, 1, 2, 3].map(i => m[i] * v[0] + m[i + 4] * v[1] + m[i + 8] * v[2] + m[i + 12]);
    assert(clip[3] > 0);
    assert(Math.abs(clip[0] / clip[3]) < 1 && Math.abs(clip[1] / clip[3]) < 1, 'performer remains in view');
  }
  assert.deepEqual(camera(render(s, 8)), camera(f));
});

test('V36 camera calming does not freeze the MMD choreography clock', () => {
  const s = stage(); s.custom = mmd();
  const times = [], animate = s.animateMMD;
  s.animateMMD = function(model, time, samples) { times.push(time); return animate.call(this, model, time, samples); };
  for (const time of [0, 2, 4]) render(s, time);
  assert.deepEqual(times, [0, 2, 4]);
});

test('V36 changing presentation preserves literal TAP/HOLD scores, replay and chart data', () => {
  const chart = C.validateChart({ id: 'rules-motion', title: 'Presentation oracle', notes: [
    { id: 'hold', time: 1, lane: 0, type: 'hold', duration: 2 }, { id: 'tap', time: 2, lane: 1 }
  ] });
  const original = JSON.stringify(chart), signature = C.chartSignature(chart), results = [];
  for (const reduced of [false, true]) {
    const s = stage(); director(s); s.reduceMotion = reduced;
    const e = new C.JudgeEngine(chart), replay = [{ time: 1, lane: 0, down: true }, { time: 1.75, lane: 0, down: false }, { time: 2, lane: 1, down: true }];
    const savedReplay = JSON.stringify(replay);
    for (const input of replay) { render(s, input.time); input.down ? e.press(input.lane, input.time) : e.release(input.lane, input.time); }
    e.update(3); const result = e.finish();
    assert.equal(result.score, 2150); assert.equal(result.holdBonus, 150); assert.equal(result.accuracy, 100); assert.equal(result.fullCombo, true);
    assert.deepEqual(result.counts, { COOL: 2, FINE: 0, SAFE: 0, SAD: 0, MISS: 0, WRONG: 0 });
    assert.equal(JSON.stringify(replay), savedReplay); assert.equal(JSON.stringify(chart), original); assert.equal(C.chartSignature(chart), signature);
    results.push(JSON.stringify(result));
  }
  assert.equal(results[0], results[1]);
});

function dom() {
  const elements = new Map(), mediaListeners = [];
  const media = { matches: false, addEventListener(name, fn) { mediaListeners.push(fn); } };
  function el(id) {
    if (!elements.has(id)) elements.set(id, { id, checked: false, disabled: false, type: 'checkbox', style: {}, dataset: {}, listeners: {},
      addEventListener(name, fn) { (this.listeners[name] ||= []).push(fn); }, insertAdjacentHTML() {}, classList: { remove() {}, add() {} } });
    return elements.get(id);
  }
  const document = { documentElement: { dataset: {} }, getElementById: el, querySelectorAll: () => [], addEventListener() {} };
  const context = { PulseCore: C, PulseServices: {}, PulseStage: G, document, matchMedia: () => media,
    window: { addEventListener() {} }, devicePixelRatio: 1, structuredClone };
  vm.createContext(context);
  return { el, document, context, media, setSystem(value) { media.matches = value; mediaListeners.forEach(fn => fn()); } };
}
function feedback() {
  const d = dom();
  const app = { settings: { reduceMotion: false, graphicsQuality: 1.5, hitSound: false, vfxIntensity: .7, sfxStyle: 'pulse', missSound: false },
    stage: { reduceMotion: false }, audio: {}, view: 'library' };
  for (const name of ['applySettings', 'renderSettings', 'frame', 'startGame', 'showView', 'pause', 'finish', 'pressSource', 'releaseSource']) app[name] = () => {};
  vm.runInContext(source('feedback33.js'), d.context); d.context.PulseFeedback33.install(app); app.applySettings();
  return { ...d, app };
}

test('V36 effective system preference reaches CSS without changing the saved user preference', () => {
  const d = feedback(), before = JSON.stringify(d.app.settings);
  d.setSystem(true);
  assert.equal(d.app.stage.reduceMotion, true);
  assert.equal(d.document.documentElement.dataset.reducedMotion, 'true');
  assert.equal(JSON.stringify(d.app.settings), before);
  d.setSystem(false);
  assert.equal(d.document.documentElement.dataset.reducedMotion, 'false');
  d.app.settings.reduceMotion = true; d.app.applySettings(); d.setSystem(true); d.setSystem(false);
  assert.equal(d.app.stage.reduceMotion, true); assert.equal(d.document.documentElement.dataset.reducedMotion, 'true');
});

test('V36 Canvas fallback uses the same effective system preference', () => {
  const d = feedback(), text = source('live-app.js');
  d.app.song = { scene: { stage: 'arena', cast: ['miku'], costumes: [], lights: true, spacing: 1 } };
  d.context.app = d.app; d.context.root = d.context;
  vm.runInContext(text.slice(text.indexOf(' app.drawFallback=function'), text.indexOf(" wrap('help',", text.indexOf(' app.drawFallback=function'))), d.context);
  const calls = [], context = new Proxy({ createLinearGradient() { return { addColorStop() {} }; } }, { get(t, key) { return t[key] || ((...args) => calls.push([key, ...args])); } });
  const canvas = { clientWidth: 960, clientHeight: 540, width: 960, height: 540, getContext: () => context };
  d.setSystem(true);
  d.app.drawFallback(canvas, 1000); const first = JSON.stringify(calls); calls.length = 0;
  d.app.drawFallback(canvas, 4000); assert.equal(JSON.stringify(calls), first);
});

function preferenceHarness() {
  const d = dom(), text = source('app.js');
  vm.runInContext(text.slice(0, text.indexOf('    const app = new App();')) + '})(globalThis);', d.context);
  let stored = { id: 'preferences', reduceMotion: false, musicVolume: .42 }, resolve, reject;
  const app = Object.assign(Object.create(d.context.PulseAppClass.prototype), {
    settings: { ...stored }, applied: 0, errors: [],
    applySettings() { this.applied++; }, toast(message) { this.errors.push(message); },
    store: { put(name, next) { return new Promise((yes, no) => { resolve = () => { stored = structuredClone(next); yes(); }; reject = no; }); } }
  });
  app.bind(); const control = d.el('reduceMotion');
  return { ...d, app, control, get stored() { return stored; }, resolve: () => resolve(), reject: () => reject(Error('QA save refusal')),
    change(value) { control.checked = value; control.listeners.change[0]({}); } };
}
const settle = () => new Promise(resolve => setImmediate(resolve));

test('V36 motion checkbox applies only after a successful settings commit', async () => {
  const h = preferenceHarness(); h.change(true);
  assert.equal(h.app.settings.reduceMotion, false); assert.equal(h.app.applied, 0);
  h.resolve(); await settle();
  assert.equal(h.app.settings.reduceMotion, true); assert.equal(h.stored.reduceMotion, true);
  assert.equal(h.app.settings.musicVolume, .42); assert.equal(h.control.checked, true); assert.equal(h.control.disabled, false);
});

test('V36 refused motion preference save restores the checkbox and preserves settings', async () => {
  const h = preferenceHarness(), before = JSON.stringify(h.app.settings); h.change(true); h.reject(); await settle();
  assert.equal(JSON.stringify(h.app.settings), before); assert.equal(h.stored.reduceMotion, false);
  assert.equal(h.control.checked, false); assert.equal(h.control.disabled, false); assert.equal(h.app.applied, 0);
  assert.deepEqual(h.app.errors, ['QA save refusal']);
});
