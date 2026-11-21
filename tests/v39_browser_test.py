"""V39: first-visit entry, one-click start, skip/replay and storage fallback."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
import threading, json, hashlib, os, traceback
R = Path(__file__).resolve().parents[1]
Q = R / 'qa/v39'
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


def ok(name, value):
    checks.append({'name': name, 'passed': bool(value)})
    print(('PASS ' if value else 'FAIL ') + name, flush=True)
    if not value:
        raise AssertionError(name)


def idle(page):
    page.wait_for_function('!PulseApp.busy', timeout=60000)


def boot(page):
    page.goto(f'http://127.0.0.1:{server.server_port}/', wait_until='domcontentloaded')
    page.wait_for_function('window.PulseApp&&document.documentElement.dataset.ready==="true"', timeout=60000)
    idle(page)


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

        ok('V39 boots on native HTTP with the current version',
           page.evaluate('v=>PulseCore.VERSION===v', version) and page.evaluate('PulseApp.store.persistent'))
        ok('First-visit card is visible without blocking the library',
           page.locator('#firstVisitCard').is_visible()
           and page.locator('#playButton').is_enabled()
           and page.locator('#songList .song-card').count() == 5)
        glyph_text = page.locator('#firstVisitCard .first-visit-glyphs').inner_text()
        ok('First-visit card explains the four glyphs and their keys',
           page.locator('#firstVisitCard .first-visit-glyphs li').count() == 4
           and all(symbol in glyph_text for symbol in ('△', '□', '×', '○'))
           and all(label in glyph_text for label in ('Triangle', 'Carré', 'Croix', 'Cercle'))
           and all(key in glyph_text for key in ('D', 'F', 'J', 'K')))
        ok('First-visit card explains HOLD and CHAIN in words',
           'HOLD' in page.locator('#firstVisitCard').inner_text()
           and 'CHAIN' in page.locator('#firstVisitCard').inner_text()
           and 'garde la touche appuyée' in page.locator('#firstVisitCard').inner_text())
        ok('First-visit path counts one click to the first note',
           page.evaluate('PulseFirstVisit.CLICKS_TO_FIRST_NOTE') == 1)

        degraded = page.evaluate('''()=>{const broken={getItem(){throw Error("denied")},setItem(){throw Error("denied")}};
            let read=null,write=null;
            try{read=PulseFirstVisit.readState(broken)}catch(e){read="throw"}
            try{write=PulseFirstVisit.writeState({seen:true},broken)}catch(e){write="throw"}
            return {read,write};}''')
        ok('Hostile or absent storage never blocks the entry',
           degraded['read'] == {'seen': False, 'skipped': False, 'replays': 0, 'available': False} and degraded['write'] is False)

        page.locator('#firstVisitStart').click()
        page.wait_for_function('PulseApp.view==="game"', timeout=60000)
        ok('A single click starts a playable first song',
           page.evaluate('PulseApp.view==="game"&&PulseApp.gameChart.notes.length>0')
           and page.evaluate('document.getElementById("firstVisitCard").hidden===true'))
        page.evaluate('PulseApp.showView("library")')
        idle(page)
        ok('A started visit stays dismissed in the library', page.locator('#firstVisitCard').is_hidden())

        page.reload(wait_until='domcontentloaded')
        boot(page)
        ok('A seen visit is not shown again after reload', page.locator('#firstVisitCard').count() == 0)

        page.evaluate('localStorage.clear()')
        page.reload(wait_until='domcontentloaded')
        boot(page)
        ok('Cleared storage restores the first-visit entry', page.locator('#firstVisitCard').is_visible())

        page.locator('#firstVisitDetail').click()
        ok('The guide lists four ordered steps and both rules',
           page.locator('#modalContent .first-visit-steps li').count() == 4
           and 'HOLD' in page.locator('#modalContent').inner_text()
           and 'CHAIN' in page.locator('#modalContent').inner_text()
           and page.locator('#firstVisitGuideStart').is_visible())
        page.locator('#firstVisitGuideLater').click()
        ok('Leaving the guide dismisses the card without starting a song',
           page.locator('#modal').get_attribute('open') is None and page.locator('#firstVisitCard').is_hidden()
           and page.evaluate('PulseApp.view==="library"'))

        page.reload(wait_until='domcontentloaded')
        boot(page)
        page.locator('#helpButton').click()
        ok('Help offers a replay of the first visit',
           page.locator('#firstVisitReplay').is_visible() and page.locator('#helpClose').is_visible())
        page.locator('#firstVisitReplay').click()
        ok('Replay opens the guide and records the replay count',
           page.locator('#firstVisitGuideStart').is_visible()
           and page.evaluate('PulseFirstVisit.readState().replays') >= 1)
        page.locator('#closeModal').click()

        page.screenshot(path=str(Q / 'premiere-visite.png'), full_page=True, animations='disabled')
        ok('No uncaught page error during the whole scenario', not errors)
        ok('Build bytes were not modified by the scenario',
           hashlib.sha256((R / 'index.html').read_bytes()).hexdigest() == build_sha)
        browser.close()
    server.shutdown()
except Exception:
    failure = traceback.format_exc()
    print(failure, flush=True)

result = {
    'version': version,
    'buildSha256': build_sha,
    'mode': 'http',
    'nativeHTTP': True,
    'buildUnchanged': hashlib.sha256((R / 'index.html').read_bytes()).hexdigest() == build_sha,
    'clicksToFirstNote': 1,
    'passed': sum(1 for c in checks if c['passed']),
    'failed': sum(1 for c in checks if not c['passed']),
    'checks': checks,
    'errors': errors,
    'failure': failure,
    'scope': 'Native HTTP/IndexedDB first visit and entry path. Software GPU and emulated viewport; no physical device, acoustic latency, screen-reader or human comprehension certification.'
}
(Q / 'results.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({k: result[k] for k in ('version', 'passed', 'failed', 'buildSha256')}, indent=2))
if failure or result['failed']:
    raise SystemExit(1)
