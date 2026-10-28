"""hypermotion/khezutable.py (hyper-motion lane, 2026-10-27; Raven: "Review Khezu's attacks, find the ones that are impacted by hyper
state"): every Khezu clip that arms an attack record (docs/attack-hitshapes.json `arms`) or plays a ModifyData action, per held pair
(1,2 / 1,3 -- group 0 holds only ID 1) and per file (below G / G: em003_00_doumouka.mdd and _g.mdd are byte-identical): the hook's
rates and bursts (hooks.json pairs), ModifyData's speed factor and power (AttackRate / PowerRate) per action, the shell scale
(ShellElements, the -1 rule: class 3 = sp_03 only), the records' power and largest hit radius (unchanged: the shape is never touched).
   python dev/archive/hypermotion/khezutable.py > khezutable.md"""
import json, os, re
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.join(HERE, '..', '..', '..')
A = json.load(open(os.path.join(ROOT, 'docs', 'attack-hitshapes.json')))['em003_00']
T = json.load(open(os.path.join(ROOT, 'docs', 'hyper-motion.json')))['em003_00']
H = json.load(open(os.path.join(HERE, 'hooks.json')))['em003_00']
SHELL_CLIPS = {'2|Motion[3]': 'sp_03 bolts (base03, class 3): x1.3 scale, x1.2 power -- every pair (ID 1 held)',
               '0|Motion[46]': 'sp_01 ground patch mode 4 (class 1): no entry', '2|Motion[64]': 'sp_01 mode 3 (class 1, off): no entry',
               '5|Motion[8]': 'sp_01 drops mode 4 (class 1): no entry', '5|Motion[3]': 'sp_01 drops mode 4 (class 1): no entry'}
act = lambda s: tuple(int(x, 0) for x in re.match(r'(\d+):(0x[0-9a-f]+)', s).groups()) if re.match(r'(\d+):(0x[0-9a-f]+)', s) else None
clips = {}
for clip, arms in A['arms'].items():
    for a in arms:
        ac = act(str(a[4]))
        if ac: clips.setdefault(clip, {}).setdefault(ac, set()).add(a[1])
for a, ms in T['actMotions'].items():
    for m in ms: clips.setdefault(m, {}).setdefault(act(a), set())
for fk in ('normal', 'g'):
    for pr in T[fk]['hooks'].values():
        for m in pr:
            L, Mn = [int(x[1:]) for x in m.split()]
            clips.setdefault('%d|Motion[%d]' % (L, Mn), {})
def mod(fk, pair, ac):
    ids = [int(x) for x in pair.split(',')]
    for i in ids:
        for e in T[fk]['modify'].get(str(i), []):
            if (e[0], e[1]) == ac: return e
    return None
R, S = A['records'], A['sets']
print('| clip | actions (records: power, largest radius) | pair | hook: rates / bursts | ModifyData per action: speed / power | shells |')
print('|---|---|---|---|---|---|')
key = lambda c: [int(x) for x in re.findall(r'\d+', c)]
for clip in sorted(clips, key=key):
    acts = clips[clip]
    L, M = key(clip)
    desc = '; '.join('(%d, %#x)' % ac + (' r' + ','.join('%d p%d %d' % (h, R[h][5], max([s[4] for s in S[R[h][3]]] or [0])) for h in sorted(hs) if h < len(R)) if hs else '') for ac, hs in sorted(acts.items()))
    for pair in ('1,2', '1,3'):
        hk = T['g']['hooks'].get(pair, {}).get('L%d M%d' % (L, M))
        hkn = T['normal']['hooks'].get(pair, {}).get('L%d M%d' % (L, M))
        hs = '--' if not hk else ', '.join(['f%d x%g' % tuple(r) for r in hk['rates']] + ['f%d u %d' % (b[0], 1310 + b[1]) for b in hk['bursts']])
        if hk != hkn: hs += ' (below G: ' + ('--' if not hkn else ', '.join(['f%d x%g' % tuple(r) for r in hkn['rates']] + ['f%d u %d' % (b[0], 1310 + b[1]) for b in hkn['bursts']])) + ')'
        ms = []
        for ac in sorted(acts):
            e = mod('g', pair, ac)
            if e: ms.append('(%d, %#x) x%g / power x%g +%d' % (ac[0], ac[1], min(e[3], e[4]), e[5], e[6]))
        print('| L%d M%d | %s | %s | %s | %s | %s |' % (L, M, desc if pair == '1,2' else '', pair, hs, '; '.join(ms) or '--', SHELL_CLIPS.get(clip, '--') if pair == '1,2' else ''))
