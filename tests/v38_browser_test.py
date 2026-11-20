"""V38: native HTTP boot, progression, academy, new demos and uniform UI states."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
import threading, json, hashlib, os, traceback
R = Path(__file__).resolve().parents[1]
Q = R / 'qa/v38'
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

try:
    with sync_playwright() as w:
        browser = w.chromium.launch(headless=True, executable_path=os.getenv('CHROMIUM_PATH') or None, args=[
            '--no-sandbox', '--disable-dev-shm-usage', '--no-proxy-server',
            '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
            '--autoplay-policy=no-user-gesture-required'])
        page = browser.new_page(viewport={'width': 1280, 'height': 900})
        page.set_default_timeout(20000)
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.goto(f'http://127.0.0.1:{server.server_port}/', wait_until='domcontentloaded')
        page.wait_for_function('window.PulseApp&&document.documentElement.dataset.ready==="true"', timeout=60000)
        idle(page)

        ok('V38 modules boot on native HTTP storage', page.evaluate('document.documentElement.dataset.ready==="true"&&PulseApp.store.persistent'))
        ok('Five original demo songs are available locally', page.evaluate('PulseApp.songs.length===5&&document.getElementById("songCount").textContent==="05"'))
        ok('Progression card is visible with a first level', page.locator('#progressionCard').is_visible() and 'NIVEAU 1' in page.locator('#progressionCard').inner_text())

        page.locator('#progressionButton').click()
        ok('Progression dialog lists every objective', page.locator('#modalContent .objective').count() == 8)
        ok('Progression dialog states the local derivation', 'Aucun compte' in page.locator('#modalContent').inner_text())
        page.locator('#closeModal').click()

        ok('Academy advertises eight lessons', '8' in page.locator('#academyButton').inner_text() and 'LEÇON' in page.locator('#academyButton').inner_text().upper())
        page.locator('#academyButton').click()
        ok('Academy renders eight lessons and the calibration guide', page.locator('#modalContent [data-lesson]').count() == 8 and page.locator('#academySettings').is_visible() and page.locator('#academyBackup').is_visible())
        page.locator('#closeModal').click()

        page.locator('#searchSongs').fill('aucun-resultat-38')
        ok('Empty search produces an actionable empty state', page.locator('#songList .empty-list strong').inner_text() == 'AUCUN RÉSULTAT' and page.locator('[data-empty="clear"]').is_visible())
        page.locator('[data-empty="clear"]').click()
        ok('Empty-state action restores the library list', page.locator('#songList .song-card').count() == 5)

        page.evaluate('PulseApp.run(()=>{throw Error("QA erreur uniforme 38")})')
        ok('Failed action keeps the legacy toast and adds the uniform error panel', 'QA erreur uniforme 38' in page.locator('#toast').inner_text() and page.locator('#errorState').is_visible() and 'QA erreur uniforme 38' in page.locator('#errorState').inner_text())
        ok('Error panel offers retry, detail and close', page.locator('[data-error-act="retry"]').is_visible() and page.locator('[data-error-act="detail"]').is_visible())
        page.locator('[data-error-act="close"]').click()
        ok('Error panel closes without altering the view', page.locator('#errorState').is_hidden() and page.evaluate('PulseApp.view==="library"'))

        derived = page.evaluate('''()=>{const scores=[],sessions=[];for(let i=0;i<5;i++)scores.push({songId:"s"+i,chartId:"c"+i,accuracy:99,fullCombo:true,holdBonus:700});for(const d of PulseCore.DIFFICULTIES)sessions.push({songId:"s"+d,difficulty:d,mode:"play"});const a=PulseProgression.evaluate({scores,sessions,academy:{pulse:{completed:true},holds:{completed:true},slides:{completed:true}}});return {xp:a.xp,level:a.level,unlocked:a.unlocked,done:a.objectives.filter(o=>o.done).length,chartKeys:a.objectives.find(o=>o.id==="ten-clears").count};}''')
        ok('Derived progression reaches level 5 and unlocks AURORA only', derived['level'] >= 5 and derived['unlocked'] == ['aurora'] and derived['chartKeys'] == 5)
        ok('Five distinct scores never forge ten clears', derived['chartKeys'] == 5)

        page.evaluate('PulseApp.showView("wardrobe")')
        idle(page)
        ok('Wardrobe exposes six modules with locked progression rewards', page.locator('#costumeGrid button').count() == 6 and page.locator('#costumeGrid button').nth(4).is_disabled() and page.locator('#costumeGrid button').nth(5).is_disabled())
        page.evaluate('PulseApp.showView("library")')
        idle(page)
        page.screenshot(path=str(Q / 'progression.png'), full_page=True, animations='disabled')

        ok('No uncaught page error during the whole scenario', not errors)
        ok('Build bytes were not modified by the scenario', hashlib.sha256((R / 'index.html').read_bytes()).hexdigest() == build_sha)
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
    'passed': sum(1 for c in checks if c['passed']),
    'failed': sum(1 for c in checks if not c['passed']),
    'checks': checks,
    'errors': errors,
    'failure': failure,
    'scope': 'Native HTTP/IndexedDB boot and UI states. Software GPU and emulated viewport; no physical device, acoustic latency or screen-reader certification.'
}
(Q / 'results.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({k: result[k] for k in ('version', 'passed', 'failed', 'buildSha256')}, indent=2))
if failure or result['failed']:
    raise SystemExit(1)
