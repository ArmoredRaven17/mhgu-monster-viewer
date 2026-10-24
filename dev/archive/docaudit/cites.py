import os, re, sys, json, glob
REPO = r'C:\MHGU-Extract\MHGU-Monster-Viewer'
S = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad'
files = glob.glob(os.path.join(REPO, 'dev', '**', '*.md'), recursive=True)
files += glob.glob(os.path.join(REPO, 'docs', 'render', '**', '*.js'), recursive=True)
files = [f for f in files if 'node_modules' not in f]
pat = re.compile(r'(?:<scratchpad>|(?<![A-Za-z])scratchpad|bbae25d7-[0-9a-f\-.]*[\\/]scratchpad)([\\/][A-Za-z0-9_.\-{}\\/*]*)?', re.I)
cites = []
bare = []
for f in files:
    try:
        txt = open(f, encoding='utf-8').read().split('\n')
    except Exception as e:
        print('ERR', f, e); continue
    for i, line in enumerate(txt, 1):
        for m in pat.finditer(line):
            p = m.group(1)
            rel = os.path.relpath(f, REPO)
            if p and len(p) > 1:
                p2 = p.strip('\\/').rstrip('.').replace('/', '\\')
                cites.append((rel, i, p2))
            else:
                bare.append((rel, i, line[max(0, m.start()-160):m.end()+80]))
out = {}
for rel, i, p in cites:
    out.setdefault(p, []).append(f'{rel}:{i}')
res = []
for p, where in sorted(out.items()):
    full = os.path.join(S, p)
    if '*' in p or '{' in p:
        st = 'GLOB'
    elif os.path.isfile(full):
        st = 'FILE %d' % os.path.getsize(full)
    elif os.path.isdir(full):
        st = 'DIR'
    else:
        st = 'MISSING'
    res.append((p, st, where))
json.dump({'cites': res, 'bare': bare}, open(os.path.join(S, 'docaudit', 'cites.json'), 'w'), indent=1)
for p, st, where in res:
    print(st.ljust(14), p, '|', len(where), where[0])
print('cites', len(cites), 'unique', len(res), 'bare', len(bare))
