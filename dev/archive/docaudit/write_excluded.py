import json, os, collections
H = os.path.dirname(os.path.abspath(__file__))
d = json.load(open(os.path.join(H, 'publish_final.json')))
OUT = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\archive\EXCLUDED.md'
by = collections.defaultdict(list)
for f, s, w in d['excluded']: by[w.split(' (')[0] if w.startswith('not a script') else w].append((f.replace('\\', '/'), s))
L = ['# What was left out of dev/archive/, and why', '',
     'Generated 2026-10-24 by the doc audit (`docaudit/publish_select.py` + `docaudit/publish_filter.py`). Everything listed here is in',
     'the full local copy `C:\\MHGU-RE\\offline\\decode\\monster-viewer-scratch\\` at the same relative path, except the five bulk inputs',
     'over 20 MB that were never copied (rom-map "2. Tooling" names them and the scripts that rewrite them). Sizes in KB.', '',
     '| reason | files | MB |', '|---|---|---|']
order = sorted(by, key=lambda k: -len(by[k]))
for k in order: L.append('| %s | %d | %.1f |' % (k, len(by[k]), sum(s for _, s in by[k]) / 1048576))
L.append('')
L.append('Also never copied anywhere: the repo snapshots `headtree/` and `staged_tree/` (every file is a blob in this repo\'s git history).')
L.append('')
for k in order:
    items = sorted(by[k])
    L.append('## %s (%d files)' % (k, len(items))); L.append('')
    if len(items) > 400:
        # aggregate by folder and extension
        agg = collections.defaultdict(lambda: [0, 0])
        for f, s in items:
            dd = f.rsplit('/', 1)[0] if '/' in f else '.'
            e = os.path.splitext(f)[1].lower() or '(none)'
            a = agg[(dd, e)]; a[0] += 1; a[1] += s
        L.append('Listed by folder and extension (count, KB):'); L.append('')
        for (dd, e), (n, s) in sorted(agg.items()): L.append('- `%s/` `*%s`: %d, %d KB' % (dd, e, n, s // 1024))
    else:
        for f, s in items: L.append('- `%s` (%d KB)' % (f, s // 1024))
    L.append('')
open(OUT, 'w', encoding='utf-8', newline='\n').write('\n'.join(L))
print(os.path.getsize(OUT))
