"""kushwind/feats.py <mon> <model substring>: an effect model's materials' shader features and states, from docs/effects/<mon>.json."""
import json, sys
mon, sub = sys.argv[1], sys.argv[2]
d = json.load(open(r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\effects\%s.json' % mon))
for k, r in d['resources'].items():
    if sub not in k: continue
    print(k, 'meshCount', r.get('meshCount'))
    for i, m in enumerate(r['materials']):
        print(' ', i, m.get('features'), m.get('state'))
