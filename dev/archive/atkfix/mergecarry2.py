"""mergecarry2.py <sim dir> <out carries.json> <out report> (atkfix lane, 2026-10-27): carrysim2.py's answers, every one applied (the
coordinator: the census-JSON refusals `several` / `action-ends` were the AI's only where the ROM says so; the simulator decides),
plus the cases refused when built (not-in-lists, per-frame). Names: `held` = the window runs out while the action holds the ended
motion (no next motion to carry onto, nothing past the clip in the viewer)."""
import sys, os, json, glob, collections
S, OUT, REP = sys.argv[1:4]
NAMES = {'0x168ebc': 'hit-live', '0xbf52c': 'ground-contact', '0xbf4e4': 'ground-contact', '0xbf0bc': 'ground-contact',
         '0x78b78': 'arrival'}
res, rep = {}, []
for f in sorted(glob.glob(os.path.join(S, 'cases_*.json'))):
    mid = os.path.basename(f)[6:-5]
    cs = json.load(open(f))
    run = [x for x in cs if 'refuse' not in x]
    out = json.load(open(os.path.join(S, 'out2_%s.json' % mid))) if run else {}
    k = 0
    for x in cs:
        if 'refuse' in x: r = {'kind': 'refused', 'hops': [], 'why': x['refuse']}
        else:
            o = out[str(k)]; k += 1
            r = {'kind': o['kind'], 'hops': o['hops'], 'why': o['why']}
            if r['kind'] == 'ends-before': r = {'kind': 'held', 'hops': [], 'why': None}
            if r['why'] and r['why'].startswith('stub-answer:'):
                calls = r['why'].split(':')[1].split('@')[0].split(',')
                r['why'] = 'stub-answer:' + '+'.join(NAMES.get(c, c) for c in calls) + ':' + r['why'].split(':', 1)[1]
        res.setdefault(mid, {})[x['rk']] = r
        rep.append('%s %s: %s %s%s' % (mid, x['rk'], r['kind'], ' '.join('%s+%d%s' % (h[0], h[1], ('@lap%d' % h[2]) if h[2] else '') for h in r['hops']),
                                       (' -- ' + r['why']) if r['why'] else ''))
json.dump(res, open(OUT, 'w'), indent=0)
open(REP, 'w').write('\n'.join(rep) + '\n')
c = collections.Counter()
for m in res.values():
    for v in m.values():
        w = (v['why'] or '').split(':')
        c[(v['kind'], (w[0] + (':' + w[1] if w[0] == 'stub-answer' else '')) if v['why'] else '')] += 1
for kv, n in sorted(c.items()): print(n, *kv)
