import http.server, sys, os
DOCS = r'C:/MHGU-Extract/MHGU-Monster-Viewer/docs'
HERE = os.path.dirname(os.path.abspath(__file__))
OV = {'/index.html': os.path.join(HERE, 'head', 'index.html'), '/': os.path.join(HERE, 'head', 'index.html'),
      '/render/monster.js': os.path.join(HERE, 'head', 'monster.js')}
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=DOCS, **k)
    def translate_path(self, path):
        p = path.split('?')[0]
        return OV.get(p, super().translate_path(path))
    def log_message(self, *a): pass
http.server.ThreadingHTTPServer(('127.0.0.1', int(sys.argv[1])), H).serve_forever()
