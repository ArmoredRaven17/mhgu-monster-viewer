import os, re, glob, json
REPO = r'C:\MHGU-Extract\MHGU-Monster-Viewer'
A = r'C:\MHGU-RE\offline\decode\monster-viewer-scratch'
BOARD = r'C:\Coding Repos\MHGU-TASKS.md'
HEX = re.compile(r'0x[0-9a-fA-F]{5,8}\b')
def norm(h): return '0x' + h[2:].lower().lstrip('0')
# corpus: rom-map, every dev note, render comments, board, decode notes
corpus_files = glob.glob(os.path.join(REPO, 'dev', '**', '*.md'), recursive=True)
corpus_files += glob.glob(os.path.join(REPO, 'docs', 'render', '**', '*.js'), recursive=True)
corpus_files += [BOARD]
romap = open(os.path.join(REPO, 'dev', 'rom-map.md'), encoding='utf-8').read()
romap_hex = set(norm(h) for h in HEX.findall(romap))
all_hex = set(romap_hex)
cited_text = romap
for f in corpus_files:
    if 'node_modules' in f: continue
    try: t = open(f, encoding='utf-8', errors='replace').read()
    except Exception: continue
    all_hex |= set(norm(h) for h in HEX.findall(t))
    if f.endswith('.md'): cited_text += t
for r, d, fs in os.walk(r'C:\MHGU-RE\offline\decode\notes'):
    for fn in fs:
        if fn.endswith(('.md', '.txt')):
            all_hex |= set(norm(h) for h in HEX.findall(open(os.path.join(r, fn), encoding='utf-8', errors='replace').read()))
rows = []
for r, d, fs in os.walk(A):
    if os.path.relpath(r, A).split(os.sep)[0] in ('docaudit', 'node_modules'): continue
    for fn in fs:
        low = fn.lower()
        if not (low.endswith('.md') or low.startswith('result') or low in ('notes.txt', 'findings.txt', 'summary.txt')): continue
        p = os.path.join(r, fn); rel = os.path.relpath(p, A)
        t = open(p, encoding='utf-8', errors='replace').read()
        hx = set(norm(h) for h in HEX.findall(t))
        miss_map = sorted(hx - romap_hex)
        miss_all = sorted(hx - all_hex)
        relf = rel.replace('\\', '/')
        cited = (relf in cited_text.replace('\\', '/')) or (('/' in relf) and relf.split('/')[0] + '/' + fn in cited_text.replace('\\', '/'))
        rows.append(dict(rel=rel, size=len(t), hex=len(hx), miss_map=len(miss_map), miss_all=len(miss_all), cited=cited, miss_all_list=miss_all[:40], miss_map_list=miss_map[:40]))
rows.sort(key=lambda x: -x['miss_all'])
json.dump(rows, open(os.path.join(os.path.dirname(__file__), 'coverage.json'), 'w'), indent=0)
print('notes', len(rows), 'cited', sum(r['cited'] for r in rows))
for x in rows:
    print('%-55s %6d hex %4d notInMap %4d notAnywhere %4d cited=%s' % (x['rel'][:55], x['size'], x['hex'], x['miss_map'], x['miss_all'], x['cited']))
