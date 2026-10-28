"""datacheck.py (hyper audit, 2026-10-28): per hyper monster x .mdd file (normal / g): the viewer's Hyper options (index.html
hyperOptions' rule), every aura u 1300+ID and burst u 1310+ID (docs/hyper-motion.json bursts) against the exported records of
docs/effects/<id>.json (record pel '<id>u', key), the aura's joint vs the monster's joint count, and the efl file present.
    python datacheck.py > datacheck.out"""
import json, os, collections
D = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs'
H = json.load(open(os.path.join(D, 'hyper-auras.json')))
M = json.load(open(os.path.join(D, 'hyper-motion.json')))
mons = {m['id']: m for m in json.load(open(os.path.join(D, 'monsters.json')))['monsters']}
out = {}
for mid in sorted(k for k in H if not k.startswith('_')):
    eff = json.load(open(os.path.join(D, 'effects', mid + '.json')))
    recs = collections.defaultdict(list)
    for r in eff['effects']:
        rec = r.get('record') or {}
        recs[(rec.get('pel'), rec.get('key'))].append(r)
    row = {}
    for fk in ('normal', 'g'):
        f = H[mid].get(fk)
        if not f: row[fk] = None; continue
        g0 = [a for a in f['auras'] if a['group'] == 0]; g1 = [a for a in f['auras'] if a['group'] == 1]
        pairs = [[x['id'] for x in (a, b) if x] for a in (g0 or [None]) for b in (g1 or [None])]
        pairs = [p for p in pairs if p]
        auras = {}
        for a in f['auras']:
            rs = recs.get((mid + 'u', 1300 + a['id']), [])
            auras[a['id']] = {'key': 1300 + a['id'], 'part': a['part'], 'group': a['group'], 'joint': a.get('joint'),
                              'exported': bool(rs), 'when': sorted(set(r.get('when') for r in rs)),
                              'efl': [r['efl'] for r in rs if r.get('efl') and not os.path.isfile(os.path.join(D, 'effects', r['efl']))],
                              'jointsRec': sorted(set(j for r in rs for j in (r.get('joints') or [])))[:6]}
        mf = (M.get(mid) or {}).get(fk) or {}
        bursts = sorted(set(b[1] for hk in (mf.get('hooks') or {}).values() for clip in hk.values() for b in clip.get('bursts', [])))
        bmiss = [1310 + b for b in bursts if not recs.get((mid + 'u', 1310 + b))]
        row[fk] = {'file': f['file'], 'pairs': [','.join(map(str, p)) for p in pairs], 'auras': auras,
                   'bursts': [1310 + b for b in bursts], 'burstsMissing': bmiss}
    # every u 1300..1315 record exported, for the "no ID" list
    row['exportedU13'] = sorted(k for (p, k) in recs if p == mid + 'u' and isinstance(k, int) and 1300 <= k <= 1319)
    out[mid] = row
json.dump(out, open(os.path.join(os.path.dirname(__file__), 'datacheck.json'), 'w'), indent=1)
for mid, row in out.items():
    for fk in ('normal', 'g'):
        r = row[fk]
        if not r: print(mid, fk, 'NO FILE'); continue
        miss = [a['key'] for a in r['auras'].values() if not a['exported']]
        print(mid, fk, r['file'], 'pairs', len(r['pairs']), 'auras', [a['key'] for a in r['auras'].values()],
              'MISSING' if miss else '', miss or '', 'bursts', r['bursts'], 'burstMISSING' if r['burstsMissing'] else '', r['burstsMissing'] or '')
    print(mid, 'u13xx exported', row['exportedU13'])
