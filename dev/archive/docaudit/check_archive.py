import os, re, glob, json, sys
REPO = r'C:\MHGU-Extract\MHGU-Monster-Viewer'
A = r'C:\MHGU-RE\offline\decode\monster-viewer-scratch'
files = glob.glob(os.path.join(REPO, 'dev', '**', '*.md'), recursive=True)
files += glob.glob(os.path.join(REPO, 'docs', 'render', '**', '*.js'), recursive=True)
files = [f for f in files if 'node_modules' not in f]
# basenames available anywhere in the archive, in efx, and in the repo dev/
names = set()
for root in (A, r'C:\MHGU-Extract\efx', os.path.join(REPO, 'dev'), r'C:\MHGU-RE\offline\decode'):
    for r, d, fs in os.walk(root):
        if 'node_modules' in r: continue
        for f in fs: names.add(f.lower())
P = re.compile(r'<archive>(?:[\\/]|[ :]+\(?`?)([A-Za-z0-9_{}.*\-\\/]+)')
FN = re.compile(r'[A-Za-z0-9_\-]+\.(?:py|mjs|txt|json|md|sh|out|pkl|js)\b')
direct_missing, named_missing, ok = [], [], 0
for f in files:
    rel = os.path.relpath(f, REPO)
    for i, line in enumerate(open(f, encoding='utf-8').read().split('\n'), 1):
        if '<archive>' not in line: continue
        for m in P.finditer(line):
            p = m.group(1).rstrip('.,`)').replace('/', '\\').strip('\\')
            if not p: continue
            full = os.path.join(A, p)
            if any(c in p for c in '*{'):
                base = os.path.dirname(full)
                st = os.path.isdir(base) and os.listdir(base)
            elif os.path.isdir(full):
                st = bool(os.listdir(full))
            else:
                st = os.path.isfile(full)
            if st: ok += 1
            else: direct_missing.append((rel, i, p))
        for m in FN.finditer(line):
            n = m.group(0).lower()
            if n not in names:
                named_missing.append((rel, i, m.group(0)))
json.dump({'direct_missing': direct_missing, 'named_missing': named_missing}, open(os.path.join(os.path.dirname(__file__), 'missing.json'), 'w'), indent=0)
print('direct ok', ok, 'direct missing', len(direct_missing), 'named-file missing', len(named_missing))
for x in direct_missing: print('D', *x)
for x in named_missing: print('N', *x)
