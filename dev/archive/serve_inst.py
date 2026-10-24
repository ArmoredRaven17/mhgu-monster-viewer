"""Serve docs/ with the instrumented index.html copy (inst/index.html) and caching off. Usage: python serve_inst.py <port>"""
import http.server, os, sys, urllib.parse
DOCS = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs'
INST = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'inst', 'index.html')
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=DOCS, **k)
    def log_message(self, *a): pass
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store'); super().end_headers()
    def do_GET(self):
        rel = urllib.parse.unquote(urllib.parse.urlparse(self.path).path)
        if rel in ('/', '/index.html'):
            body = open(INST, 'rb').read()
            self.send_response(200); self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(body))); self.end_headers(); self.wfile.write(body); return
        return super().do_GET()
http.server.ThreadingHTTPServer(('127.0.0.1', int(sys.argv[1])), H).serve_forever()
