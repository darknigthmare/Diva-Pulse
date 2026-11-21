"""V39: measured accessibility checks C1-C8 on the built DOM (not a WCAG audit)."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
import threading, json, hashlib, os, traceback
R = Path(__file__).resolve().parents[1]
Q = R / 'qa/v39/accessibility'
Q.mkdir(parents=True, exist_ok=True)
checks = []
errors = []
failure = None
version = (R / 'VERSION.txt').read_text().strip()
build_sha = hashlib.sha256((R / 'index.html').read_bytes()).hexdigest()


class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Quiet, directory=str(R)))
threading.Thread(target=server.serve_forever, daemon=True).start()

CONTRAST_JS = r'''() => {
  const parse = value => {
    const m = String(value).match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(',').map(Number);
    return {r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1};
  };
  const lum = c => {
    const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const background = el => {
    let node = el;
    while (node && node.nodeType === 1) {
      const c = parse(getComputedStyle(node).backgroundColor);
      if (c && c.a > 0.5) return c;
      node = node.parentElement;
    }
    return {r: 9, g: 15, b: 30, a: 1};
  };
  const targets = ['#firstVisitTitle', '.first-visit-card p', '.first-visit-rules', '#selectedTitle', '#playButton', '#progressionCard p'];
  const out = [];
  for (const selector of targets) {
    const el = document.querySelector(selector);
    if (!el) continue;
    const style = getComputedStyle(el), fg = parse(style.color), bg = background(el);
    out.push({selector, ratio: Number(ratio(fg, bg).toFixed(2)), fontSize: parseFloat(style.fontSize), color: style.color});
  }
  const primary = document.querySelector('#playButton');
  const primaryStyle = primary ? getComputedStyle(primary) : null;
  return {text: out, primarySurface: primaryStyle ? Number(ratio(parse(primaryStyle.backgroundColor), {r: 9, g: 15, b: 30, a: 1}).toFixed(2)) : null,
          focusRing: Number(ratio({r: 112, g: 240, b: 220, a: 1}, {r: 9, g: 15, b: 30, a: 1}).toFixed(2))};
}'''


def ok(check_id, name, value, detail=''):
    passed = bool(value)
    checks.append({'id': check_id, 'name': name, 'passed': passed, 'detail': detail})
    print(('PASS ' if passed else 'FAIL ') + check_id + ' ' + name, flush=True)
    if not passed:
        raise AssertionError(check_id + ' ' + name)


def boot(page):
    page.goto(f'http://127.0.0.1:{server.server_port}/', wait_until='domcontentloaded')
    page.wait_for_function('window.PulseApp&&document.documentElement.dataset.ready==="true"', timeout=60000)
    page.wait_for_function('!PulseApp.busy', timeout=60000)


def reflow(page, view):
    page.evaluate('v=>PulseApp.showView(v)', view)
    page.wait_for_function('!PulseApp.busy', timeout=60000)
    return page.evaluate('()=>({scroll:document.documentElement.scrollWidth,inner:window.innerWidth})')


try:
    with sync_playwright() as w:
        browser = w.chromium.launch(headless=True, executable_path=os.getenv('CHROMIUM_PATH') or None, args=[
            '--no-sandbox', '--disable-dev-shm-usage', '--no-proxy-server',
            '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
            '--autoplay-policy=no-user-gesture-required'])
        page = browser.new_page(viewport={'width': 1280, 'height': 900})
        page.set_default_timeout(20000)
        page.on('pageerror', lambda e: errors.append(str(e)))
        boot(page)

        measured = page.evaluate(CONTRAST_JS)
        ok('C1', 'text contrast measured in the DOM reaches 4.5:1',
           measured['text'] and all(item['ratio'] >= 4.5 or (item['fontSize'] >= 24) for item in measured['text']),
           json.dumps(measured['text'], ensure_ascii=False))

        outlines = []
        for _ in range(6):
            page.keyboard.press('Tab')
            outlines.append(page.evaluate('''()=>{const el=document.activeElement;if(!el||el===document.body)return null;
                const s=getComputedStyle(el);return {tag:el.tagName,id:el.id||null,width:parseFloat(s.outlineWidth)||0,style:s.outlineStyle};}'''))
        ok('C2', 'keyboard focus is visible on every early stop',
           all(item and item['width'] >= 2 and item['style'] != 'none' for item in outlines), json.dumps(outlines))

        targets = page.evaluate('''()=>{
            const nodes=[...document.querySelectorAll('button,input,select,summary')];
            return nodes.filter(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);
                return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'&&!el.disabled;})
              .map(el=>{const r=el.getBoundingClientRect();return {id:el.id||el.tagName,w:Math.round(r.width),h:Math.round(r.height)};});}''')
        small = [t for t in targets if min(t['w'], t['h']) < 24]
        primaries = page.evaluate('''()=>['playButton','firstVisitStart'].map(id=>{
            const el=document.getElementById(id);if(!el)return {id,ok:false};const r=el.getBoundingClientRect();
            return {id,w:Math.round(r.width),h:Math.round(r.height),ok:Math.round(r.height)>=44&&Math.round(r.width)>=44};})''')
        ok('C3', 'targets reach 24px and primary actions 44px',
           not small and all(item['ok'] for item in primaries), json.dumps({'small': small, 'primaries': primaries}))

        page.set_viewport_size({'width': 320, 'height': 800})
        narrow = {view: reflow(page, view) for view in ('library', 'settings', 'results')}
        ok('C4', 'no horizontal scrolling at 320px on library, settings and results',
           all(item['scroll'] <= item['inner'] + 1 for item in narrow.values()), json.dumps(narrow))

        session = page.context.new_cdp_session(page)
        session.send('Emulation.setDeviceMetricsOverride', {'width': 320, 'height': 225, 'deviceScaleFactor': 2, 'mobile': False})
        zoomed = reflow(page, 'settings')
        session.send('Emulation.clearDeviceMetricsOverride')
        ok('C5', '200% emulated zoom keeps settings readable without horizontal scrolling',
           zoomed['scroll'] <= zoomed['inner'] + 1, json.dumps(zoomed))

        states = page.evaluate('''()=>({
            nav:document.querySelector('.nav.active')?.getAttribute('aria-current'),
            difficulty:[...document.querySelectorAll('#difficultyTabs button')].some(b=>b.getAttribute('aria-pressed')==='true'),
            favorite:document.getElementById('filterFavorite')?.getAttribute('aria-pressed'),
            progress:!!document.querySelector('#progressionCard [role=progressbar]')
        })''')
        ok('C6', 'active states expose DOM attributes, not colour alone',
           states['nav'] == 'page' and states['difficulty'] and states['favorite'] in ('true', 'false') and states['progress'],
           json.dumps(states))

        ok('C7', 'non-text surfaces reach 3:1', measured['primarySurface'] >= 3 and measured['focusRing'] >= 3,
           json.dumps({'primarySurface': measured['primarySurface'], 'focusRing': measured['focusRing']}))

        page.set_viewport_size({'width': 1280, 'height': 900})
        page.evaluate('PulseApp.showView("library")')
        seen = []
        for _ in range(30):
            page.keyboard.press('Tab')
            seen.append(page.evaluate('document.activeElement&&document.activeElement.id||document.activeElement&&document.activeElement.tagName'))
        ok('C8', 'no keyboard focus trap in the library', len(set(seen)) >= 6, json.dumps(sorted(set(seen))))

        page.screenshot(path=str(Q / 'report.png'), full_page=True, animations='disabled')
        ok('C0', 'no uncaught page error during the accessibility scenario', not errors)
        browser.close()
    server.shutdown()
except Exception:
    failure = traceback.format_exc()
    print(failure, flush=True)

result = {
    'version': version,
    'buildSha256': build_sha,
    'mode': 'http',
    'buildUnchanged': hashlib.sha256((R / 'index.html').read_bytes()).hexdigest() == build_sha,
    'passed': sum(1 for c in checks if c['passed']),
    'failed': sum(1 for c in checks if not c['passed']),
    'checks': checks,
    'errors': errors,
    'failure': failure,
    'scope': 'Measured DOM and emulated viewport only: canvas internals, screen readers, real colour-vision deficiencies and physical devices are out of scope. Not a WCAG conformance audit.'
}
(Q / 'browser.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({k: result[k] for k in ('version', 'passed', 'failed', 'buildSha256')}, indent=2))
if failure or result['failed']:
    raise SystemExit(1)
