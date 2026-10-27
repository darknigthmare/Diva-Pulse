"""Loopback launcher checks only; this does not test browser IndexedDB or SW installation."""
import importlib.util, threading, tempfile, hashlib, json, socket, subprocess, sys, time
from pathlib import Path
from urllib.request import urlopen
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
R=Path(__file__).resolve().parents[1];checks=[]
def ok(name,value):
    assert value,name
    checks.append({'name':name,'passed':True});print('PASS',name,flush=True)
def port():
    with socket.socket() as s:s.bind(('127.0.0.1',0));return s.getsockname()[1]
def run(n):return subprocess.run([sys.executable,str(R/'lancer.py'),'--port',str(n),'--no-browser'],cwd=R,text=True,capture_output=True,timeout=8)
n=port();log=open(R/'qa/v4-launcher-server.log','w');p=subprocess.Popen([sys.executable,str(R/'lancer.py'),'--port',str(n),'--no-browser'],cwd=R,stdout=log,stderr=log)
try:
    for i in range(60):
        try:
            with urlopen(f'http://127.0.0.1:{n}/pulse-health',timeout=1) as r:health=json.load(r)
            break
        except OSError:time.sleep(.05)
    else:raise AssertionError('server start')
    ok('Loopback health identifies current build',health=={'app':'DIVA-PULSE-MMD-DIRECTOR','version':(R/'VERSION.txt').read_text().strip(),'build':hashlib.sha256((R/'index.html').read_bytes()).hexdigest()})
    with urlopen(f'http://127.0.0.1:{n}/') as r:
        body=r.read();headers=r.headers
    ok('Launcher serves standalone game bytes exactly',body==(R/'index.html').read_bytes())
    ok('Launcher adds no-cache, nosniff and no-referrer headers',headers.get('Cache-Control')=='no-cache' and headers.get('X-Content-Type-Options')=='nosniff' and headers.get('Referrer-Policy')=='no-referrer')
    r=run(n);ok('Same running build is reused on the same explicit port',r.returncode==0 and 'déjà ouverte' in r.stdout)
    with urlopen(f'http://127.0.0.1:{n}/manifest.webmanifest') as r:mt=r.headers.get_content_type();manifest=json.load(r)
    ok('Manifest is served with manifest JSON MIME and correct icons',mt=='application/manifest+json' and len(manifest['icons'])==2)
    for url in ['sw.js','icons/icon-192.png','icons/icon-512.png']:
        with urlopen(f'http://127.0.0.1:{n}/'+url) as r:ok('Offline shell file is locally available: '+url,r.status==200 and len(r.read())>100)
finally:p.terminate();p.wait(timeout=5);log.close()
class Foreign(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200);self.end_headers();self.wfile.write(b'{"app":"ANOTHER-APP"}')
    def log_message(self,*a):pass
server=ThreadingHTTPServer(('127.0.0.1',0),Foreign);thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
try:
    r=run(server.server_port);ok('Foreign application collision fails instead of silently changing port',r.returncode==2 and 'Aucun port différent' in r.stderr)
finally:server.shutdown();server.server_close();thread.join()
r=run(80);ok('Invalid non-user port is rejected',r.returncode==2 and '1024' in r.stderr)
(R/'qa/v4-launcher-results.json').write_text(json.dumps({'passed':len(checks),'failed':0,'checks':checks,'scope':'Python loopback HTTP only; browser installation and persistence not tested'},indent=2,ensure_ascii=False));print('TOTAL',len(checks),'PASS')
