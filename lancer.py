#!/usr/bin/env python3
"""Stable loopback-only origin for DIVA PULSE. No automatic port switching.
No pip, Node, remote server, telemetry, or file upload is required.
"""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from pathlib import Path
from urllib.request import urlopen
import argparse, hashlib, json, sys, threading, webbrowser
ROOT = Path(__file__).resolve().parent
APP = 'DIVA-PULSE-MMD-DIRECTOR'
VERSION = (ROOT / 'VERSION.txt').read_text(encoding='utf-8').strip()
def identity():
    return {'app': APP, 'version': VERSION,
            'build': hashlib.sha256((ROOT / 'index.html').read_bytes()).hexdigest()}
class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Cache-Control', 'no-cache')
        self.send_header('Referrer-Policy', 'no-referrer')
        super().end_headers()
    def do_GET(self):
        if self.path.split('?', 1)[0] == '/pulse-health':
            payload = json.dumps(identity()).encode()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
        else:
            super().do_GET()
    def guess_type(self, path):
        if path.endswith('.webmanifest'):
            return 'application/manifest+json'
        return super().guess_type(path)
def running_identity(port):
    try:
        with urlopen(f'http://127.0.0.1:{port}/pulse-health', timeout=1) as response:
            data=response.read(8192)
            return json.loads(data)
    except Exception:
        return None
def main(argv=None):
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8765,
                        help='Port explicite ; le changer change l’origine de la bibliothèque.')
    parser.add_argument('--no-browser', action='store_true', help='Ne pas ouvrir le navigateur.')
    args=parser.parse_args(argv)
    if not 1024 <= args.port <= 65535:
        parser.error('Le port doit être compris entre 1024 et 65535.')
    url=f'http://127.0.0.1:{args.port}/'
    handler=partial(Handler, directory=str(ROOT))
    try:
        server=ThreadingHTTPServer(('127.0.0.1', args.port), handler)
    except OSError:
        found=running_identity(args.port)
        if found == identity():
            print('Cette même version de DIVA PULSE est déjà ouverte.\n'+url)
            if not args.no_browser:
                webbrowser.open(url)
            return 0
        print(f'Le port {args.port} est occupé par une autre application ou version.\n'
              'Fermez son lanceur puis relancez celui-ci. Aucun port différent n’a été choisi :\n'
              'votre bibliothèque garde ainsi la même adresse. Exportez un .pulsepack\n'
              'avant de changer volontairement de port avec --port.', file=sys.stderr)
        return 2
    print(f'\nDIVA PULSE — SQUELETTES & SAUVEGARDES {VERSION}\n{url}\n'
          'Gardez cette fenêtre ouverte. Ctrl+C pour arrêter.\n'
          'Le serveur écoute uniquement cet ordinateur. Aucun média n’est téléversé.\n', flush=True)
    if not args.no_browser:
        timer=threading.Timer(.5, lambda:webbrowser.open(url));timer.daemon=True;timer.start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nServeur arrêté.')
    finally:
        server.server_close()
    return 0
if __name__ == '__main__':
    sys.exit(main())
