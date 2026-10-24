# serves C:\MHGU-Extract\MHGU-Monster-Viewer\docs as dev/serve.py does, except /render/rom/effect/proof.js, which comes from the
# committed version (proof_head.js beside this file) -- the A/B of the GPU pool stand-in's allocator
import http.server, os, sys, functools
DOCS = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs'
OLD = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'proof_head.js')
class H(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        p = path.split('?', 1)[0].split('#', 1)[0]
        if p == '/render/rom/effect/proof.js': return OLD
        return super().translate_path(path)
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()
    def log_message(self, *a): pass
H.extensions_map.update({'.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.wasm': 'application/wasm'})
port = int(sys.argv[1])
http.server.ThreadingHTTPServer(('127.0.0.1', port), functools.partial(H, directory=DOCS)).serve_forever()
