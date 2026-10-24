import json, os, glob, re, collections
R = r'C:\MHGU-Extract\MHGU-Monster-Viewer'
d = json.load(open('publish_lists.json'))
blob = ''
for f in glob.glob(os.path.join(R, 'dev', '**', '*.md'), recursive=True) + glob.glob(os.path.join(R, 'docs', 'render', '**', '*.js'), recursive=True):
    if os.sep + 'archive' + os.sep in f: continue
    blob += open(f, encoding='utf-8', errors='replace').read()
blob += open(r'C:\Coding Repos\MHGU-TASKS.md', encoding='utf-8', errors='replace').read()
repo_names = set(os.path.basename(f).lower() for f in glob.glob(os.path.join(R, 'docs', '**', '*.*'), recursive=True) + glob.glob(os.path.join(R, 'dev', '**', '*.*'), recursive=True) if 'archive' not in f)
inc, exc = [], list(map(tuple, d['excluded']))
for f, s in d['included']:
    b = os.path.basename(f); e = os.path.splitext(b)[1].lower(); lo = b.lower()
    why = None
    if e in ('.py', '.mjs', '.js', '.sh') and re.search(r'\.(pre[\w-]*|orig|new[\w-]*|bak\d*|before[\w-]*|cur|patched|old\d*)\.(py|mjs|js|sh)$', lo):
        why = 'superseded backup of a script kept beside it (the live version is included)'
    elif e in ('.py', '.mjs', '.js') and lo in repo_names:
        why = 'copy of a repo file (git has the real file)'
    elif e == '.js':
        if f.lower().startswith('three' + os.sep) or 'gltfloader' in lo: why = 'third-party library copy (three.js)'
        elif lo in repo_names or re.search(r'\.(before|bak|pre[\w-]*|orig|new[\w-]*|patched)\.js$', lo) or 'docs' + os.sep + 'render' in f.lower(): why = 'copy or patched copy of viewer code (git has the real file)'
    elif e in ('.txt', '.out', '.json', '.tsv', '.csv'):
        if not (b in blob or os.path.splitext(b)[0] in ('RESULT', 'result', 'notes', 'summary', 'findings')):
            why = 'uncited run output (census / disassembly / trace), regenerable by its script'
    if why: exc.append((f, s, why))
    else: inc.append((f, s))
tot = sum(s for _, s in inc)
c = collections.defaultdict(int); n = collections.Counter()
for f, s in inc: e = os.path.splitext(f)[1].lower(); c[e] += s; n[e] += 1
print('include', len(inc), '%.2f MB' % (tot / 1048576), {e: (n[e], round(c[e] / 1048576, 2)) for e in c})
print('excluded', len(exc), collections.Counter(w.split(' (')[0] for _, _, w in exc).most_common())
json.dump({'included': inc, 'excluded': exc}, open('publish_final.json', 'w'), indent=0)
