"""actmot/ambig.py [docs dir]: the Hyper ModifyData 'census' branch (index.html hyperMotionAt, a play with no named action) counted
offline, BEFORE (the actions known to set a clip = attack-hitshapes.json `arms` + hyper-motion.json `actMotions`) and AFTER (the same
plus docs/action-motions.json `motions`, the full census). Per monster x file (normal / g) x every held pair the viewer offers
(hyper-motion.json `hooks` keys) x every clip the census or the old sources name: 'census' = one factor != 1 (applied), 'ambiguous'
= the actions disagree (the viewer plays 1), 'one' = all agree on 1. hyperModifyFactor transcribed (index.html)."""
import sys, os, json
D = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'docs')
HM = json.load(open(os.path.join(D, 'hyper-motion.json'))); HA = json.load(open(os.path.join(D, 'hyper-auras.json')))
AT = json.load(open(os.path.join(D, 'attack-hitshapes.json'))); AM = json.load(open(os.path.join(D, 'action-motions.json')))


import re


def actionOf(s):                                     # psl-mask.js actionOf: names it cannot parse are filtered out
    m = re.match(r'^(\d+):0x([0-9a-f]+)(?: #\d+)?$', s or '', re.I); return (int(m.group(1)), int(m.group(2), 16)) if m else None


def factor(h, f, pair, act):
    ids = [int(x) for x in pair.split(',')]
    g = [next((i for i in ids if any(a['id'] == i and a['group'] == k for a in h['auras'])), None) for k in (0, 1)]
    if g[0] is None or g[1] is None or str(g[0]) not in f['modify'] or str(g[1]) not in f['modify']: return 1
    for i in g:
        for e in f['modify'][str(i)]:
            if e[0] == act[0] and e[1] == act[1] and e[2] > 0: return min(e[3], e[4])
    return 1


tot = {'before': {}, 'after': {}}; rows = []
for mon, M in HM.items():
    if mon.startswith('_'): continue
    arms = (AT.get(mon) or {}).get('arms') or {}
    am = M.get('actMotions') or {}
    full = (AM.get(mon) or {}).get('motions') or {}
    for fk in ('normal', 'g'):
        f = M.get(fk); h = (HA.get(mon) or {}).get(fk)
        if not f or not h: continue
        clips = set(arms) | {k for v in am.values() for k in v} | set(full)
        for pair in f['hooks']:
            for mk in sorted(clips):
                old = {a[4] for a in arms.get(mk, [])} | {a for a, v in am.items() if mk in v}
                new = old | set(full.get(mk, []))
                for tag, names in (('before', old), ('after', new)):
                    fs = sorted({factor(h, f, pair, actionOf(a)) for a in names if actionOf(a)})
                    how = 'none' if not fs else 'ambiguous' if len(fs) > 1 else ('census' if fs[0] != 1 else 'one')
                    tot[tag][how] = tot[tag].get(how, 0) + 1
                    if how == 'ambiguous' or (tag == 'after' and how == 'census'):
                        rows.append((tag, mon, fk, pair, mk, how, fs))
print(json.dumps(tot))
# the ambiguous clips (one line per monster x file x clip, the pairs listed), and what changed
from collections import defaultdict
g = defaultdict(set)
for tag, mon, fk, pair, mk, how, fs in rows: g[(tag, how, mon, fk, mk)].add(pair)
for k in sorted(g):
    if len(sys.argv) > 2: print(k, sorted(g[k]))
print('distinct (monster, file, clip): ' + json.dumps({'%s %s' % (t, h): len({(m, f, c) for (tt, hh, m, f, c) in g if tt == t and hh == h})
                                                       for t in ('before', 'after') for h in ('ambiguous', 'census')}))
