# dev/serve.py with an overlay directory: a path present under OVERLAY is served from there. Usage: python serve_overlay.py <port> <overlay>
import importlib.util, os, sys, http.server
spec = importlib.util.spec_from_file_location('serve', r'C:/MHGU-Extract/MHGU-Monster-Viewer/dev/serve.py')
S = importlib.util.module_from_spec(spec); sys.argv = [sys.argv[0], sys.argv[1]] + sys.argv[2:]; spec.loader.exec_module(S)
OV = os.path.abspath(sys.argv[2])
class H(S.Handler):
    def translate_path(self, path):
        p = super().translate_path(path)
        rel = os.path.relpath(p, S.DOCS)
        o = os.path.join(OV, rel)
        return o if os.path.isfile(o) else p
os.makedirs(S.SHOTS, exist_ok=True)
http.server.ThreadingHTTPServer.allow_reuse_address = True
srv = http.server.ThreadingHTTPServer(('127.0.0.1', int(sys.argv[1])), H)
srv.serve_forever()
