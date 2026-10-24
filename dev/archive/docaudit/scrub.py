import json, os, re, sys
A = r'C:\MHGU-RE\offline\decode\monster-viewer-scratch'
base = sys.argv[1] if len(sys.argv) > 1 else A
d = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'publish_final.json')))
PAT = {
 'email': re.compile(r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}'),
 'url-with-credentials': re.compile(r'[a-z]+://[^/\s:@]+:[^/\s@]+@'),
 'token/key': re.compile(r'(?i)(api[_-]?key|secret|token|passwd|password|bearer|authorization)\s*[:=]\s*[\'"]?[A-Za-z0-9_\-\.]{8,}'),
 'github-token': re.compile(r'gh[pousr]_[A-Za-z0-9]{20,}'),
 'aws-key': re.compile(r'AKIA[0-9A-Z]{16}'),
 'private-key': re.compile(r'-----BEGIN [A-Z ]*PRIVATE KEY-----'),
 'anthropic/openai key': re.compile(r'sk-[A-Za-z0-9_\-]{20,}'),
}
TEMP = re.compile(r'AppData[\\/]+Local[\\/]+Temp', re.I)
hits = []; ntemp = 0; ftemp = 0
for f, s in d['included']:
    p = os.path.join(base, f)
    t = open(p, encoding='utf-8', errors='replace').read()
    for k, r in PAT.items():
        for m in r.finditer(t):
            hits.append((f, k, m.group(0)[:80]))
    c = len(TEMP.findall(t)); ntemp += c; ftemp += 1 if c else 0
print('files', len(d['included']), 'hits', len(hits))
for h in hits: print(h)
print('temp-scratchpad absolute paths: %d occurrences in %d files' % (ntemp, ftemp))
