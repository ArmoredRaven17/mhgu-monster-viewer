"""Serve docs/ as it stood at HEAD without copying it: files changed since HEAD come from `git show HEAD:<path>`, files
added since HEAD answer 404, everything else from the working tree. Usage: python serve_head.py <port>"""
import http.server, os, subprocess, sys, mimetypes, urllib.parse
REPO = r'C:\MHGU-Extract\MHGU-Monster-Viewer'
DOCS = os.path.join(REPO, 'docs')
def git(*a):
    return subprocess.run(['git', '-C', REPO] + list(a), capture_output=True).stdout
changed = set(git('diff', '--name-only', 'HEAD', '--', 'docs').decode().split())
added = set(git('ls-files', '--others', '--exclude-standard', '--', 'docs').decode().split())
mimetypes.add_type('application/javascript', '.js'); mimetypes.add_type('application/javascript', '.mjs')
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=DOCS, **k)
    def log_message(self, *a): pass
    def do_GET(self):
        rel = urllib.parse.unquote(urllib.parse.urlparse(self.path).path).lstrip('/') or 'index.html'
        key = 'docs/' + rel
        if key in added: self.send_error(404); return
        if key in changed:
            body = git('show', 'HEAD:' + key)
            self.send_response(200)
            self.send_header('Content-Type', mimetypes.guess_type(rel)[0] or 'application/octet-stream')
            self.send_header('Content-Length', str(len(body))); self.send_header('Cache-Control', 'no-store'); self.end_headers()
            self.wfile.write(body); return
        return super().do_GET()
print('changed', len(changed), 'added', len(added), flush=True)
http.server.ThreadingHTTPServer(('127.0.0.1', int(sys.argv[1])), H).serve_forever()
