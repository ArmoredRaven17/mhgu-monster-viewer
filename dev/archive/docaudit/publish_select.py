"""Select what of the archive goes into the repo's dev/archive/ (dry run prints totals; --copy copies; writes the lists)."""
import os, re, sys, shutil, json, collections
A = r'C:\MHGU-RE\offline\decode\monster-viewer-scratch'
OUT = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\archive'
COPY = '--copy' in sys.argv
CAP = 200 * 1024
SCRIPTS = {'.py', '.mjs', '.js', '.sh', '.ps1', '.bat', '.cjs'}
NOTES = {'.md'}
TEXTS = {'.txt', '.out', '.tsv', '.csv'}
DATA = {'.json'}
HEX = re.compile(r'^\s*(0x)?[0-9a-fA-F]{4,8}:?\s+([0-9a-fA-F]{2}\s+){8,}')
inc, exc = [], []
def reason_text(p, sz):
    if sz > CAP: return 'over 200 KB (a dump or census output)'
    try: t = open(p, encoding='utf-8', errors='replace').read()
    except Exception: return 'unreadable'
    lines = t.splitlines() or ['']
    if sum(1 for l in lines if HEX.match(l)) > 0.3 * len(lines): return 'hex dump (ROM bytes)'
    if '\x00' in t: return 'binary content'
    return None
for r, d, fs in os.walk(A):
    rel_r = os.path.relpath(r, A)
    if rel_r.split(os.sep)[0] in ('__pycache__',) or '__pycache__' in rel_r.split(os.sep) or 'node_modules' in rel_r:
        for f in fs: exc.append((os.path.join(rel_r, f), os.path.getsize(os.path.join(r, f)), 'python cache'));
        continue
    for f in fs:
        p = os.path.join(r, f); rel = os.path.normpath(os.path.join(rel_r, f)); sz = os.path.getsize(p)
        ext = os.path.splitext(f)[1].lower()
        why = None
        if ext in SCRIPTS or ext in NOTES:
            if sz > CAP: why = 'over 200 KB (a generated file or a copy of viewer code)'
        elif ext in TEXTS:
            why = reason_text(p, sz)
        elif ext in DATA:
            if sz > CAP: why = 'json data dump over 200 KB'
            else: why = reason_text(p, sz)
        else:
            why = 'not a script or note (%s)' % (ext or 'no extension')
        if why: exc.append((rel, sz, why))
        else: inc.append((rel, sz))
tot = sum(s for _, s in inc)
print('include', len(inc), '%.2f MB' % (tot / 1048576))
c = collections.Counter(os.path.splitext(f)[1].lower() for f, _ in inc); print(c.most_common())
r = collections.Counter(w.split(' (')[0] for _, _, w in exc); print('excluded', len(exc), '%.1f MB' % (sum(s for _, s, _ in exc) / 1048576), r.most_common())
big = sorted(inc, key=lambda x: -x[1])[:15]; print('largest included', [(f, s // 1024) for f, s in big])
json.dump({'included': inc, 'excluded': exc}, open(os.path.join(os.path.dirname(__file__), 'publish_lists.json'), 'w'), indent=0)
if COPY:
    for rel, sz in inc:
        dst = os.path.join(OUT, rel); os.makedirs(os.path.dirname(dst), exist_ok=True); shutil.copy2(os.path.join(A, rel), dst)
    print('copied')
