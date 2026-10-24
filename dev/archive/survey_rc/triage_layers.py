"""Per monster: the triage's non-PSL layers (shells, class code, shared enemy code) against the export."""
import json, os, re, sys
V = r'C:\MHGU-Extract\MHGU-Monster-Viewer'
out = {}
for mon in sys.argv[1:]:
    t = open(os.path.join(V, 'dev', 'effects-triage', mon + '.md'), encoding='utf-8').read()
    m = re.search(r'Effect lists: `(\w+)` \(u\.pel[^)]*\) and `(\w+)` \(c\.pel\)', t)
    upel, cpel = m.group(1), m.group(2)
    eff = json.load(open(os.path.join(V, 'docs', 'effects', mon + '.json'), encoding='utf-8'))['effects']
    exp = {(e['record']['pel'], e['record']['key']) for e in eff if e.get('record')}
    lay = {'shells': [], 'class': [], 'shared': []}
    for line in t.splitlines():
        c = [x.strip() for x in line.split('|')]
        if len(c) < 11 or c[1] not in ('u', 'c') or not c[3].isdigit():
            continue
        lst, arr, key, efl, fired = c[1], c[2], int(c[3]), c[4], c[9]
        pel = upel if lst == 'u' else cpel
        name = '%s%d' % (lst, key)
        if fired.startswith('shells'):
            k = 'shells'
        elif fired.startswith('nothing found'):
            k = 'class'
        elif fired.startswith('shared'):
            k = 'shared'
        else:
            continue
        lay[k].append((name, efl, (pel, key) in exp, fired[:90]))
    out[mon] = lay
    print('==', mon, upel, cpel)
    for k, v in lay.items():
        ne = [x for x in v if not x[2]]
        print('  %-6s %d records, %d exported, NOT: %s' % (k, len(v), len(v) - len(ne), ' '.join('%s(%s)' % (x[0], x[1]) for x in ne)))
json.dump(out, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'layers.json'), 'w'), indent=1)
