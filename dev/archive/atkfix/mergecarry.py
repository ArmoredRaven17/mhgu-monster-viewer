"""mergecarry.py <sim dir> <carry_report.txt (the census-JSON rule's)> <out carries.json> <out report>: the carry per arm.
The simulator's (carrysim.py) answer, except where the census-JSON rule (zg/atkcarry.py) refused it as `several` / `action-ends` /
`per-frame`: those stay refused by name (the coordinator, 2026-10-27: they depend on the AI or have no action) -- the simulator's
answer for them is written into the report beside the refusal, not applied.
Each hop: [key, shift, lap]; lap = how many times that motion already played in the chain (the arm motion counts), so a motion the
action plays again is shown on the viewer's matching lap of that clip."""
import sys, os, json, glob, re
S, OLD, OUT, REP = sys.argv[1:5]
old = {}
for l in open(OLD):
    m = re.match(r'(\S+) (\S+) (\S+) id (\d+) flags (\S+) phase (\d+): (\S+) ?(.*?)(?: -- (\S+))?$', l.strip())
    if m: old[(m[1], m[2], m[3], int(m[4]), int(m[5], 16))] = (m[7], m[9])
KEEP = ('several', 'action-ends', 'per-frame')
res, rep = {}, []
for f in sorted(glob.glob(os.path.join(S, 'cases_*.json'))):
    mid = os.path.basename(f)[6:-5]
    cs = json.load(open(f))
    run = [x for x in cs if 'refuse' not in x]
    out = json.load(open(os.path.join(S, 'out_%s.json' % mid))) if run else {}
    k = 0
    for x in cs:
        rk = x['rk']; p = rk.split('|'); key = p[0] + '|' + p[1]; hid = int(p[3]); fl = int(p[4]); act = p[6]
        if 'refuse' in x:
            r = {'kind': 'refused', 'hops': [], 'why': x['refuse']}
        else:
            o = out[str(k)]; k += 1
            r = {'kind': o['kind'], 'hops': o['hops'], 'why': o['why']}
        oo = old.get((mid, key, act, hid, fl))
        note = ''
        if oo and oo[0] == 'refused' and oo[1] and oo[1].split(':')[0] in KEEP and r['kind'] != 'refused':
            note = '  [simulator: %s %s%s -- not applied]' % (r['kind'], ' '.join('%s+%d' % tuple(h) for h in r['hops']), (' -- ' + r['why']) if r['why'] else '')
            r = {'kind': 'refused', 'hops': [], 'why': oo[1].split(':')[0]}
        elif oo and oo[0] == 'refused' and oo[1] and oo[1].split(':')[0] in KEEP:
            r['why'] = oo[1].split(':')[0] + ' (simulator: ' + (r['why'] or '') + ')'
        seen = {key: 1}; hops = []
        for kk, sh in r['hops']:
            hops.append([kk, sh, seen.get(kk, 0)]); seen[kk] = seen.get(kk, 0) + 1
        r['hops'] = hops
        res.setdefault(mid, {})[rk] = r
        rep.append('%s %s: %s %s%s%s' % (mid, rk, r['kind'], ' '.join('%s+%d%s' % (h[0], h[1], ('@lap%d' % h[2]) if h[2] else '') for h in hops),
                                          (' -- ' + r['why']) if r['why'] else '', note))
json.dump(res, open(OUT, 'w'), indent=0)
open(REP, 'w').write('\n'.join(rep) + '\n')
import collections
c = collections.Counter((v['kind'], (v['why'] or '').split(':')[0].split(' ')[0] if v['kind'] != 'carried' else ('short:' + v['why'].split(':')[0] if v['why'] else ''))
                        for m in res.values() for v in m.values())
for kv, n in sorted(c.items()): print(n, *kv)
