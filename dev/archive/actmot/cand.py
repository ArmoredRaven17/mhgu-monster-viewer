"""actmot/cand.py <clipactions.json> [out.md]: the clips several actions play that DIFFER in something the viewer shows -- the
posture (0xbc7f4 / 0xbc984 / 0xbca24 before the setMotion, or the posture an earlier phase set), the rate (0xb07b4 after it), the
PSL enable word (vt+0x13c with that action, shared calls answered 0) -- from docs/action-motions.json, per monster. CANDIDATES for
Raven (a CLIP_ACTIONS copy or a menu entry), never applied here. <clipactions.json> = psl-mask.js CLIP_ACTIONS dumped (keys only
matter: a clip that already has entries is marked `has`)."""
import sys, os, json
H = os.path.dirname(os.path.abspath(__file__))
AM = json.load(open(os.path.join(H, '..', '..', '..', 'docs', 'action-motions.json')))
CA = json.load(open(sys.argv[1]))
out = open(sys.argv[2], 'w') if len(sys.argv) > 2 else sys.stdout


def postures(r):
    s = set()
    for p in r['posture']:
        if isinstance(p, int): s.add(p)
        elif p.startswith('in:'): s |= {int(x) for x in p[3:].split('/')}
    return frozenset(s)


tot = {'posture': 0, 'rate': 0, 'psl': 0, 'clips': 0, 'has': 0}
seen = {}
rows = []
for mon, M in AM.items():
    if mon.startswith('_'): continue
    for mk, acts in M['motions'].items():
        if len(acts) < 2: continue
        sig = {}
        for a in acts:
            rs = [r for r in M['actions'].get(a, []) if r['m'] == mk]
            P = frozenset().union(*[postures(r) for r in rs]); R = frozenset(x for r in rs for x in r.get('rate', []) if x != 1.0)       # (1.0 = setMotion's own reset)
            W = frozenset(r['psl'][0] for r in rs if r.get('psl') and r['psl'][0] is not None)
            sig[a] = (P, R, W)
        diff = []
        Ps = {s[0] for s in sig.values() if s[0]}; Rs = {s[1] for s in sig.values()}; Ws = {s[2] for s in sig.values() if s[2]}
        if len(Ps) > 1: diff.append('posture')
        if len(Rs) > 1: diff.append('rate')
        if len(Ws) > 1: diff.append('psl')
        if not diff: continue
        has = mk in (CA.get(mon) or {})
        key = (M['cls'], mk, json.dumps({a: [sorted(s[0]), sorted(s[1]), sorted(s[2])] for a, s in sorted(sig.items())}))
        if key in seen: seen[key].append(mon); continue           # a variant with the identical answer: listed once
        seen[key] = [mon]
        tot['clips'] += 1; tot['has'] += has
        for d in diff: tot[d] += 1
        groups = {}
        for a, s in sorted(sig.items()):
            groups.setdefault(('/'.join(map(str, sorted(s[0]))) or '?', '/'.join(map(str, sorted(s[1]))) or '-', '/'.join(sorted(s[2])) or '-'), []).append(a)
        rows.append((seen[key], mk, diff, has, groups))
out.write('| monster(s) | clip | differs in | CLIP_ACTIONS has it | actions by (posture; rate; PSL word) |\n|---|---|---|---|---|\n')
for mons, mk, diff, has, groups in rows:
    out.write('| %s | %s | %s | %s | %s |\n' % (' / '.join(mons), mk, ', '.join(diff), 'yes' if has else '--',
              '; '.join('(%s; %s; %s): %s' % (k[0], k[1], k[2], ' '.join(v)) for k, v in groups.items())))
print(json.dumps(tot), file=sys.stderr)
