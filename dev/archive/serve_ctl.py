# serve_ctl.py <port>: docs/ as dev/serve.py serves it, but index.html with FLOOR_AT_UNIT emptied (the control: the old floor rule)
import http.server, os, sys
DOCS = 'C:/MHGU-Extract/MHGU-Monster-Viewer/docs'
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=DOCS, **k)
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store'); super().end_headers()
    def log_message(self, *a): pass
    def do_GET(self):
        p = self.path.split('?')[0]
        if p in ('/', '/index.html'):
            t = open(os.path.join(DOCS, 'index.html'), encoding='utf8').read()
            a = "const FLOOR_AT_UNIT = new Set(["
            assert t.count(a) == 1
            t = t.replace(a, "const FLOOR_AT_UNIT = new Set([]), FLOOR_AT_UNIT_OFF = new Set([")
            b = t.encode('utf8')
            self.send_response(200); self.send_header('Content-Type', 'text/html; charset=utf-8'); self.send_header('Content-Length', str(len(b)))
            self.end_headers(); self.wfile.write(b); return
        return super().do_GET()
http.server.ThreadingHTTPServer(('127.0.0.1', int(sys.argv[1])), H).serve_forever()
