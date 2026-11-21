'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const F = require('../src/first-visit.js');
const memory = () => {
  const store = new Map();
  return {
    getItem: key => store.has(key) ? store.get(key) : null,
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: key => store.delete(key)
  };
};
test('V39 first visit starts unseen and never invents a stored state', () => {
  const state = F.readState(memory());
  assert.equal(state.seen, false);
  assert.equal(state.skipped, false);
  assert.equal(state.replays, 0);
  assert.equal(state.available, true);
});
test('V39 skipping or starting persists only the visit flags', () => {
  const store = memory();
  assert.equal(F.writeState({ seen: true, skipped: true }, store), true);
  assert.deepEqual(F.readState(store), { seen: true, skipped: true, replays: 0, available: true });
  assert.equal(F.writeState({ replays: 2 }, store), true);
  assert.equal(F.readState(store).replays, 2);
  assert.equal(F.writeState({ seen: false, skipped: false }, store), true);
  assert.equal(F.readState(store).seen, false);
});
test('V39 a missing or hostile storage degrades to an unseen visit', () => {
  const broken = { getItem() { throw Error('denied'); }, setItem() { throw Error('denied'); } };
  assert.deepEqual(F.readState(broken), { seen: false, skipped: false, replays: 0, available: false });
  assert.equal(F.writeState({ seen: true }, broken), false);
  assert.equal(F.writeState({ seen: true }, null), false);
  assert.equal(F.readState(undefined).seen, false);
});
test('V39 corrupt stored JSON is ignored instead of blocking the library', () => {
  const store = memory();
  store.setItem(F.KEY, '{not json');
  assert.deepEqual(F.readState(store), { seen: false, skipped: false, replays: 0, available: false });
  store.setItem(F.KEY, JSON.stringify({ seen: 'yes', skipped: 1, replays: -4 }));
  assert.deepEqual(F.readState(store), { seen: false, skipped: false, replays: 0, available: true });
});
test('V39 one click is enough to reach the first note', () => {
  assert.equal(F.CLICKS_TO_FIRST_NOTE, 1);
  assert.ok(F.CLICKS_TO_FIRST_NOTE <= 3);
});
test('V39 four glyphs map to four distinct lanes and keys', () => {
  assert.equal(F.GLYPHS.length, 4);
  assert.deepEqual(F.GLYPHS.map(g => g.symbol), ['△', '□', '×', '○']);
  assert.deepEqual(F.GLYPHS.map(g => g.key), ['D', 'F', 'J', 'K']);
  assert.equal(new Set(F.GLYPHS.map(g => g.lane)).size, 4);
  assert.ok(F.GLYPHS.every(g => g.label && g.label.length > 2));
});
test('V39 HOLD and CHAIN are explained once each', () => {
  assert.deepEqual(F.RULES.map(r => r.id), ['hold', 'chain']);
  const hold = F.RULES.find(r => r.id === 'hold'), chain = F.RULES.find(r => r.id === 'chain');
  assert.match(hold.text, /garde la touche appuyée/i);
  assert.match(hold.text, /cinq secondes/i);
  assert.match(chain.text, /MISS/i);
  assert.ok(!/minuteur/i.test(hold.text + chain.text));
});
