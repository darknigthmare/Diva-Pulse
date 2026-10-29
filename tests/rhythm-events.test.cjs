const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../src/core.js');

const note = (id, time, lane, type = 'tap', duration = 0) => ({ id, time, lane, type, duration });
const engine = (notes, options = {}, offset = 0) => new C.JudgeEngine({ id: 'event-timing', bpm: 120, offset, notes }, options);
const down = (time, lane) => ({ time, lane, down: true });
const up = (time, lane) => ({ time, lane, down: false });

function playTimeline(notes, inputs, { fps = 0, end = 2, offset = 0, options = {} } = {}) {
    const e = engine(notes, options, offset);
    const steps = inputs.map((input, order) => ({ ...input, order: order + 1 }));
    if (fps) {
        for (let frame = 0; frame / fps <= end; frame++) {
            steps.push({ time: frame / fps, frame: true, order: 0 });
        }
    }
    steps.sort((a, b) => a.time - b.time || a.order - b.order);
    for (const step of steps) {
        if (step.frame) e.update(step.time);
        else if (step.down) e.press(step.lane, step.time);
        else e.release(step.lane, step.time);
    }
    e.update(end);
    return { result: e.result(), combo: e.combo, held: [...e.held], states: e.notes.map(n => [n.id, n.state]) };
}

test('Rhythm: release settles a crossed chain even when no frame was drawn', () => {
    const e = engine([note('head', 1, 4, 'slide'), note('chain', 1.02, 4, 'chain', .3)]);
    e.press(4, 1);
    e.release(4, 1.03);
    e.update(1.2);
    assert.equal(e.counts.COOL, 2);
    assert.equal(e.counts.MISS, 0);
    assert.equal(e.holdBonus, 2);
    assert.equal(e.result().score, 2002);
    assert.deepEqual(e.log.map(x => x.noteId), ['head', 'chain']);
    assert.equal(e.log[1].time, 1.02);
    assert.equal(e.held.size, 0);
});

test('Rhythm: a new press settles held chains before judging that input', () => {
    const e = engine([note('head', 1, 4, 'slide'), note('chain', 1.02, 4, 'chain', .3), note('tap', 1.03, 0)]);
    e.press(4, 1);
    assert.equal(e.press(0, 1.03).note.id, 'tap');
    assert.deepEqual(e.log.map(x => x.noteId), ['head', 'chain', 'tap']);
    e.release(4, 1.05);
    assert.equal(e.counts.COOL, 3);
    assert.equal(e.holdBonus, 6);
});

test('Rhythm: repeated held press advances time without another note or WRONG', () => {
    const e = engine([note('head', 1, 4, 'slide'), note('chain', 1.02, 4, 'chain', .3), note('future', 1.08, 4, 'slide')]);
    e.press(4, 1);
    assert.equal(e.press(4, 1.03), null);
    assert.equal(e.counts.COOL, 2);
    assert.equal(e.counts.WRONG, 0);
    assert.equal(e.notes[2].state, 'pending');
    assert.equal(e.heldSince.get(4), 1);
});

for (const offset of [-.25, 0, .25]) {
    for (const delta of [-.0001, 0, .0001]) {
        test(`Rhythm: chain release boundary offset=${offset} delta=${delta}`, () => {
            const e = engine([note('head', 1, 4, 'slide'), note('chain', 1.02, 4, 'chain', .3)], {}, offset);
            e.press(4, 1 + offset);
            e.release(4, 1.02 + offset + delta);
            e.update(2);
            assert.equal(e.counts.COOL, delta < 0 ? 1 : 2);
            assert.equal(e.counts.MISS, delta < 0 ? 1 : 0);
            assert.equal(e.holdBonus, 0);
        });
    }
}

test('Rhythm: simultaneous chains settle together before release and tap at their boundary', () => {
    const e = engine([
        note('left', 1, 4, 'slide'), note('right', 1, 5, 'slide'),
        note('left-chain', 1.02, 4, 'chain', .3), note('right-chain', 1.02, 5, 'chain', .3), note('tap', 1.02, 0)
    ]);
    e.press(4, 1);
    e.press(5, 1);
    e.release(4, 1.02);
    e.press(0, 1.02);
    e.release(5, 1.03);
    assert.equal(e.counts.COOL, 5);
    assert.equal(e.counts.WRONG, 0);
    assert.equal(e.result().score, 5002);
    assert.deepEqual(e.log.map(x => x.noteId), ['left', 'right', 'left-chain', 'right-chain', 'tap']);
});

test('Rhythm: held input without a successful head does not arm modern chains', () => {
    const notes = [note('head', 1, 4, 'slide'), note('chain', 1.02, 4, 'chain', .3)];
    const modern = engine(notes);
    modern.press(4, .5);
    modern.release(4, 1.2);
    modern.update(2);
    assert.equal(modern.counts.COOL, 0);
    assert.equal(modern.counts.MISS, 2);
    const legacy = engine(notes, { legacyChains: true });
    legacy.press(4, .5);
    legacy.release(4, 1.2);
    legacy.update(2);
    assert.equal(legacy.counts.COOL, 1);
    assert.equal(legacy.counts.MISS, 1);
    assert.equal(legacy.holdBonus, 36);
});

test('Rhythm: MISS deadlines are settled before later chains on a long frame', () => {
    const e = engine([note('head', .5, 4, 'chain', .5), note('missed', .7, 0), note('chain', 1, 4, 'chain', .3)]);
    e.press(4, .5);
    e.update(1.4);
    assert.deepEqual(e.log.map(x => x.noteId), ['head', 'missed', 'chain']);
    assert.equal(e.log[1].time, .7 + e.windows[3]);
    assert.equal(e.maxCombo, 1);
    assert.equal(e.combo, 1);
    assert.equal(e.holdBonus, 160);
});

test('Rhythm: exact MISS boundary remains open before a simultaneous held chain', () => {
    const deadline = .5 + C.JUDGMENT_PROFILES.standard[3];
    const e = engine([note('head', .4, 4, 'slide'), note('missed', .5, 0), note('chain', deadline, 4, 'chain', .3)]);
    e.press(4, .4);
    e.update(deadline);
    assert.equal(e.notes.find(n => n.id === 'missed').state, 'pending');
    e.update(deadline + .001);
    assert.deepEqual(e.log.map(x => x.noteId), ['head', 'chain', 'missed']);
    assert.equal(e.maxCombo, 2);
});

for (const profile of ['standard', 'accessible', 'precision']) {
    test(`Rhythm: HOLD rounding, chains, MISS and score are frame-independent (${profile})`, () => {
        const offset = .125;
        const notes = [
            note('long-hold', .2, 0, 'hold', 5), note('short-hold', .35, 1, 'hold', .47),
            note('head', .5, 4, 'chain', .3), note('missed', .6, 2),
            note('chain-a', .73, 4, 'chain', .3), note('chain-b', .91, 4, 'chain', .3), note('tap', 1.1, 3)
        ];
        const inputs = [down(.2, 0), down(.35, 1), down(.5, 4), down(.65, 0), up(.801, 1), up(.947, 4), down(1.12, 3), up(1.16, 3), up(5.337, 0)]
            .map(x => ({ ...x, time: x.time + offset }));
        const run = fps => playTimeline(notes, inputs, { fps, end: 6, offset, options: { judgmentProfile: profile } });
        const expected = run(144);
        assert.equal(expected.result.counts.COOL, 6);
        assert.equal(expected.result.counts.MISS, 1);
        assert.equal(expected.result.holdBonus, 1179);
        for (const fps of [0, 30, 60]) assert.deepEqual(run(fps), expected, `same timestamps at ${fps || 'no intermediate'} FPS`);
    });
}

test('Rhythm: autoplay handles simultaneous notes and chained HOLDs without reentrant input advancement', () => {
    const notes = [
        note('head', 1, 4, 'chain', .3), note('long-hold', 1, 2, 'hold', 5),
        note('chain-a', 1.2, 4, 'chain', .3), note('tap-a', 1.2, 0),
        note('chain-b', 1.4, 4, 'chain', .3), note('tap-b', 1.4, 1)
    ];
    const bulk = engine(notes);
    assert.doesNotThrow(() => bulk.update(7, true));
    const expected = bulk.result();
    assert.equal(expected.counts.COOL, notes.length);
    assert.equal(expected.counts.WRONG, 0);
    assert.equal(expected.holdBonus, 1140);
    assert.equal(expected.score, 7140);
    bulk.update(7, true);
    assert.deepEqual(bulk.result(), expected);
    for (const fps of [30, 60, 144]) {
        const e = engine(notes);
        for (let frame = 0; frame <= 7 * fps; frame++) e.update(frame / fps, true);
        assert.deepEqual(e.result(), expected, `autoplay at ${fps} FPS`);
    }
});

test('Rhythm: invalid input remains a complete no-op, including automatic settlement', () => {
    const e = engine([note('head', 1, 4, 'slide'), note('chain', 1.02, 4, 'chain', .3)]);
    e.press(4, 1);
    const before = JSON.stringify(e);
    for (const [lane, time] of [[-1, 1.1], [6, 1.1], [.5, 1.1], [4, NaN], [4, Infinity]]) {
        e.press(lane, time);
        e.release(lane, time);
        assert.equal(JSON.stringify(e), before);
    }
});

test('Rhythm: delayed release and repeated press do not rewind the settled horizon', () => {
    const e = engine([note('hold', 1, 0, 'hold', 1)]);
    e.press(0, 1);
    e.update(1.1);
    const log = structuredClone(e.log);
    assert.equal(e.press(0, 1.05), null);
    assert.equal(e.lastTime, 1.1);
    assert.equal(e.heldSince.get(0), 1);
    e.release(0, 1.05);
    assert.equal(e.lastTime, 1.1);
    assert.equal(e.held.size, 0);
    assert.deepEqual(e.log, log);
    // Determinism assumes chronological delivery: committed HOLD credit is not
    // rolled back when a hardware event arrives behind an already rendered time.
    assert.equal(e.holdBonus, 20);
});

test('Rhythm: a delayed new press still uses its own timestamp for judgment', () => {
    const e = engine([note('hold', 1, 0, 'hold', 1), note('tap', 1.04, 1)]);
    e.press(0, 1);
    e.update(1.1);
    const result = e.press(1, 1.04);
    assert.equal(result.rating, 'COOL');
    assert.equal(result.delta, 0);
    assert.equal(e.log.at(-1).time, 1.04);
    assert.equal(e.holdBonus, 20);
});
