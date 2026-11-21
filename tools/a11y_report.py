"""V39 accessibility report: checks C1-C8 tied to the exact build hash.

Static checks read the shipped theme and sources. Browser checks come from
tests/v39_a11y_browser.py (qa/v39/accessibility/browser.json); without that
file the report exists but marks the measured checks as pending.
"""
from pathlib import Path
import hashlib
import json
import re
import subprocess

R = Path(__file__).resolve().parents[1]
Q = R / 'qa/v39/accessibility'
Q.mkdir(parents=True, exist_ok=True)
CSS = (R / 'src/style.css').read_text(encoding='utf-8')
APP = (R / 'src/app.js').read_text(encoding='utf-8')
FIRST = (R / 'src/first-visit.js').read_text(encoding='utf-8')
VERSION = (R / 'VERSION.txt').read_text().strip()
BUILD = hashlib.sha256((R / 'index.html').read_bytes()).hexdigest()
try:
    COMMIT = subprocess.run(['git', 'rev-parse', 'HEAD'], cwd=R, capture_output=True, text=True, check=True).stdout.strip() or None
except Exception:
    COMMIT = None


def token(name):
    match = re.search(r'--' + re.escape(name) + r':(#[0-9a-fA-F]{6})', CSS)
    if not match:
        raise SystemExit(f'Token de thème absent : --{name}')
    return match.group(1)


def channel(value):
    part = int(value, 16) / 255
    return part / 12.92 if part <= 0.03928 else ((part + 0.055) / 1.055) ** 2.4


def luminance(hex_colour):
    r, g, b = (channel(hex_colour[i:i + 2]) for i in (1, 3, 5))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(foreground, background):
    a, b = luminance(foreground), luminance(background)
    return (max(a, b) + 0.05) / (min(a, b) + 0.05)


def colour(value):
    return value if value.startswith('#') else token(value)


TEXT_PAIRS = [
    (colour('ink'), colour('bg')),
    (colour('muted'), colour('bg')),
    (colour('accent'), colour('bg')),
    (colour('pink'), colour('bg')),
    ('#c3d3dd', '#0d2226'),
    ('#9df7e7', '#0d2226'),
    ('#b7f7ec', '#0d2226'),
]
NON_TEXT_PAIRS = [(colour('accent'), colour('bg')), (colour('accent'), colour('panel'))]

browser = None
browser_path = Q / 'browser.json'
if browser_path.exists():
    raw = json.loads(browser_path.read_text(encoding='utf-8'))
    if raw.get('version') == VERSION and raw.get('buildSha256') == BUILD and not raw.get('failure'):
        browser = raw
browser_checks = {item['id']: item for item in (browser or {}).get('checks', [])}

checks = []


def add(check_id, name, static_ok, detail, pending_without_browser=False):
    status = 'passed' if static_ok else 'failed'
    kind = 'static'
    if not static_ok:
        detail = 'Échec statique : ' + detail
    if browser is not None:
        item = browser_checks.get(check_id)
        if item is not None:
            status = 'passed' if item.get('passed') else 'failed'
            kind = 'browser'
            detail = f"{item.get('name', '')} · {item.get('detail', '')}".strip(' ·')
    elif pending_without_browser and static_ok:
        status = 'pending'
        detail = 'Mesure navigateur non exécutée : ' + detail
    checks.append({'id': check_id, 'name': name, 'kind': kind, 'status': status, 'detail': detail})


add('C1', 'Contraste texte 4,5:1', all(contrast(f, b) >= 4.5 for f, b in TEXT_PAIRS),
    ' / '.join(f'{f} sur {b} = {contrast(f, b):.2f}:1' for f, b in TEXT_PAIRS))
add('C2', 'Focus visible 2 px', bool(re.search(r':focus-visible[^{]*\{[^}]*outline:2px solid var\(--accent\)', CSS)),
    'règle :focus-visible avec contour 2 px')
add('C3', 'Cibles 24 px / actions 44 px', all(pattern in CSS for pattern in (
    '.first-visit-actions button{min-height:44px;min-width:44px}',
    'input[type=checkbox]{width:24px;height:24px;min-height:24px}',
    'input[type=range]{height:24px;min-height:24px}')),
    'déclarations de taille dans src/style.css')
add('C4', 'Reflow 320 px', '@media (max-width:720px){' in CSS and 'overflow-x:hidden' not in CSS,
    'règles de reflow déclarées', pending_without_browser=True)
add('C5', 'Zoom 200 %', True, 'aucune base statique : mesure navigateur', pending_without_browser=True)
add('C6', 'État sans couleur seule', all(item in APP + FIRST for item in (
    "setAttribute('aria-current', 'page')", 'aria-pressed', 'aria-labelledby="firstVisitTitle"')),
    'attributs aria dans les sources')
add('C7', 'Contraste non textuel 3:1', all(contrast(f, b) >= 3 for f, b in NON_TEXT_PAIRS),
    ' / '.join(f'{f} sur {b} = {contrast(f, b):.2f}:1' for f, b in NON_TEXT_PAIRS))
add('C8', 'Absence de piège de focus', True, 'aucune base statique : mesure navigateur', pending_without_browser=True)

summary = {
    'passed': sum(1 for c in checks if c['status'] == 'passed'),
    'failed': sum(1 for c in checks if c['status'] == 'failed'),
    'pending': sum(1 for c in checks if c['status'] == 'pending'),
    'total': len(checks),
}
report = {
    'version': VERSION,
    'buildSha256': BUILD,
    'commit': COMMIT,
    'kind': 'rapport technique de mesures',
    'audit': False,
    'browserMeasured': browser is not None,
    'checks': checks,
    'summary': summary,
    'scope': "Mesures DOM et viewport émulé : le canvas, les lecteurs d’écran, le daltonisme réel et les appareils physiques restent hors preuve. Aucune conformité WCAG n’est revendiquée.",
}
(Q / 'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'version': VERSION, 'buildSha256': BUILD, 'summary': summary}, ensure_ascii=False, indent=2))
if summary['failed']:
    raise SystemExit(1)
