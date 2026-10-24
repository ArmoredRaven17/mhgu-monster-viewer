import json, os, re, io, sys
V = r'C:\MHGU-Extract\MHGU-Monster-Viewer'
out = {}
for mon in sys.argv[1:]:
    eff = json.load(open(os.path.join(V, 'docs', 'effects', mon + '.json'), encoding='utf-8'))['effects']
    got = {(x['record']['pel'], x['record']['key']) for x in eff}
    txt = io.open(os.path.join(V, 'dev', 'effects-triage', mon + '.md'), encoding='utf-8', errors='replace').read()
    h = re.search(r'Effect lists: `(\w+)` \(u\.pel[^`]*`(\w+)` \(c\.pel\)', txt)
    pel = {'u': h.group(1), 'c': h.group(2)}
    rows = []
    for l in txt.split('\n'):
        if not (l.startswith('| u |') or l.startswith('| c |')): continue
        f = [x.strip() for x in l.strip('|').split('|')]
        if not f[2].isdigit(): continue
        k = int(f[2])
        if (pel[f[0]], k) in got: continue
        if 'no motion fires it' in f[8]: continue
        rows.append(f)
    out[mon] = rows
    print('##', mon, pel, len(rows))
    for f in rows: print(' | '.join(f))
json.dump(out, open(os.path.join(os.path.dirname(__file__), 'unexp.json'), 'w'), indent=1)
