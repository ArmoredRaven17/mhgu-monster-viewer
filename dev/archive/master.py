import json, sys, collections
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import effects_triage as T
B = chr(92)
d = json.load(open(r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\effects\em081_04.json'))
exp = {}
for e in d['effects']:
    r = e['record']
    exp[(r['pel'], r['index'], r['key'], r['path'].split(B)[-1])] = e['when']
recs = T.pel('em081_04u') + T.pel('em081_00c')
idx = {}
rows = []
for r in recs:
    k = (r['pel'], r['array']); i = idx.get(k, 0); idx[k] = i + 1
    w = exp.get((r['pel'], i, r['key'], r['efl']))
    rows.append((r['pel'], r['array'], i, r['key'], r['efl'], r['joint'], r['mode'], r['sub'], w))
print(collections.Counter((p, a) for p, a, *_ in rows))
print('exported matched', sum(1 for r in rows if r[8]), 'of', len(exp))
for r in rows:
    print('%s %-8s %2d %5d %-16s j%-4d m%d/%d %s' % r)
