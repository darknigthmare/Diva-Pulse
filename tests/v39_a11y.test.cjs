'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const R = path.join(__dirname, '..');
const css = fs.readFileSync(path.join(R, 'src/style.css'), 'utf8');
const firstVisit = fs.readFileSync(path.join(R, 'src/first-visit.js'), 'utf8');
const app = fs.readFileSync(path.join(R, 'src/app.js'), 'utf8');
const template = fs.readFileSync(path.join(R, 'src/template.html'), 'utf8');

const block = (selector) => {
  const start = css.indexOf(selector);
  if (start < 0) return '';
  const open = css.indexOf('{', start), close = css.indexOf('}', open);
  return css.slice(open + 1, close);
};
const root = block(':root');
const token = (name) => {
  const match = root.match(new RegExp('--' + name + ':(#[0-9a-fA-F]{6})'));
  assert.ok(match, `token --${name} must be a hex colour`);
  return match[1];
};
const channel = value => {
  const c = parseInt(value, 16) / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};
const luminance = hex => {
  const parts = [1, 3, 5].map(i => channel(hex.slice(i, i + 2)));
  return 0.2126 * parts[0] + 0.7152 * parts[1] + 0.0722 * parts[2];
};
const contrast = (a, b) => {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

test('V39 text pairs declared by the theme reach 4.5:1', () => {
  const pairs = [
    [token('ink'), token('bg')],
    [token('muted'), token('bg')],
    [token('accent'), token('bg')],
    [token('pink'), token('bg')],
    ['#c3d3dd', '#0d2226'],
    ['#9df7e7', '#0d2226'],
    ['#b7f7ec', '#0d2226']
  ];
  for (const [foreground, background] of pairs) {
    const ratio = contrast(foreground, background);
    assert.ok(ratio >= 4.5, `${foreground} on ${background} = ${ratio.toFixed(2)}:1`);
  }
});
test('V39 declared non-text surfaces reach 3:1', () => {
  for (const [foreground, background] of [[token('accent'), token('bg')], [token('accent'), token('panel')]]) {
    const ratio = contrast(foreground, background);
    assert.ok(ratio >= 3, `${foreground} on ${background} = ${ratio.toFixed(2)}:1`);
  }
});
test('V39 keyboard focus is visible with a 2px outline', () => {
  assert.match(css, /:focus-visible[^{]*\{[^}]*outline:2px solid var\(--accent\)/);
  assert.match(css, /outline-offset:3px/);
});
test('V39 interactive targets declare 24px and primary actions 44px', () => {
  assert.match(css, /\.first-visit-actions button\{min-height:44px;min-width:44px\}/);
  assert.match(css, /input\[type=checkbox\]\{width:24px;height:24px;min-height:24px\}/);
  assert.match(css, /input\[type=range\]\{height:24px;min-height:24px\}/);
  assert.match(css, /\.text-link,\.library-actions button,\.library-footer button,\.sub-actions button\{min-height:24px;min-width:24px/);
  assert.match(css, /\.binding button\{min-height:24px;min-width:24px\}/);
  assert.match(css, /\.result-actions button\{min-height:44px\}/);
});
test('V39 reflow rules cover narrow viewports without hiding overflow', () => {
  assert.match(css, /@media \(max-width:720px\)\{/);
  for (const selector of ['.song-detail{position:static', '.settings-grid,.editor-work,.editor-meta,.two-col,.result-counts', '.library-footer{position:static']) {
    assert.ok(css.includes(selector), selector);
  }
  assert.ok(!/overflow-x:\s*hidden/.test(css), 'overflow must not be hidden to fake reflow');
});
test('V39 active states carry a DOM attribute, not colour alone', () => {
  assert.match(app, /setAttribute\('aria-current', 'page'\)/);
  assert.match(app, /setAttribute\('aria-pressed', d === this\.difficulty\)/);
  assert.match(app, /setAttribute\('aria-pressed', !!this\.favoriteFilter\)/);
  assert.match(firstVisit, /aria-labelledby="firstVisitTitle"/);
  assert.match(firstVisit, /aria-label="Glyphes et touches"/);
});
test('V39 first visit is wired into the build before the app boots', () => {
  assert.ok(template.indexOf('/*__FIRSTVISIT__*/') > template.indexOf('/*__UISTATES__*/'));
  assert.ok(template.indexOf('/*__FIRSTVISIT__*/') < template.indexOf('/*__APP__*/'));
  assert.match(app, /root\.PulseFirstVisit\.install\(app\)/);
  assert.match(firstVisit, /CLICKS_TO_FIRST_NOTE=1/);
});
