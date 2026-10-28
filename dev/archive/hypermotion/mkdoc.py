"""hypermotion/mkdoc.py (hyper-motion lane, 2026-10-27): the per-monster list of clips a held Hyper aura changes, for
dev/hyper-states.md 6, from hooks.json (per aura ID, the class hook) and docs/hyper-motion.json (ModifyData factors + actMotions).
   python dev/archive/hypermotion/mkdoc.py > out.md"""
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
H = json.load(open(os.path.join(HERE, 'hooks.json')))
T = json.load(open(os.path.join(HERE, '..', '..', '..', 'docs', 'hyper-motion.json')))
A = json.load(open(os.path.join(HERE, '..', '..', '..', 'docs', 'hyper-auras.json')))
M = {m['id']: m.get('name', m['id']) for m in json.load(open(os.path.join(HERE, '..', '..', '..', 'docs', 'monsters.json')))['monsters']}


def row(c):
    ev = [(f, 'x%g' % x) for f, x in c['rates']] + [(f, 'u %d' % (1310 + i)) for f, i in c['bursts']]
    return ', '.join('f%d %s' % e for e in sorted(ev))


def hooks(tab):
    return '; '.join('**%s** %s' % (m, row(c)) for m, c in sorted(tab.items(), key=lambda kv: [int(v[1:]) for v in kv[0].split()]))


print('| monster (class; hook below G / G) | aura ID (group, part) | the class hook: motion -- frame: rate / burst (below G) | at G, where it differs | ModifyData factor != 1: actions (-> motions) |')
print('|---|---|---|---|---|')
for mid, h in H.items():
    if 'error' in h: continue
    aur = {}
    for fk in ('normal', 'g'):
        for a in (((A.get(mid) or {}).get(fk)) or {}).get('auras', []): aur.setdefault(a['id'], a)
    first = True
    for i in sorted(aur):
        a = aur[i]
        n = h.get('normal', {}).get('table', {}).get(str(i), {})
        g = h.get('g', {}).get('table', {}).get(str(i), {})
        gd = {m: c for m, c in g.items() if n.get(m, {}).get('rates') != c['rates'] or n.get(m, {}).get('bursts') != c['bursts']}
        mods = []
        for fk, tag in (('normal', ''), ('g', ' (G)')):
            F = T.get(mid, {}).get(fk)
            if not F: continue
            for e in F['modify'].get(str(i), []):
                fac = min(e[3], e[4])
                if fac != 1:
                    ms = T[mid].get('actMotions', {}).get('%d:0x%02x' % (e[0], e[1]), [])
                    mods.append('(%d, %#x) x%g%s -> %s' % (e[0], e[1], fac, tag, ' / '.join(m.replace('|Motion[', ' M').replace(']', '').replace('', 'L', 1) for m in ms) or 'no motion found'))
        # one line per file is enough: collapse identical normal / G entries
        seen, ml = set(), []
        for x in mods:
            k = x.replace(' (G)', '')
            if k in seen: continue
            seen.add(k); ml.append(x)
        mon = ('%s %s (%s; %s / %s)' % (M.get(mid, mid), mid, h['class'], h['hook']['normal'], h['hook']['g'])) if first else ''
        first = False
        print('| %s | %d (g%d, part %d) | %s | %s | %s |' % (mon, i, a['group'], a['part'], hooks(n) or '--', hooks(gd) or '--', '; '.join(ml) or '--'))
