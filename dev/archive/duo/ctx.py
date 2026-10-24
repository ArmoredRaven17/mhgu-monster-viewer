# ctx.py <census.json> <emc.json> <cls>: the LINK CONTEXT of every action -- the EMC's issue tags (emclink.py)
# propagated along the actions' own changes (follow / set / req recorded by the tracer, each under the link side it
# was recorded on), then per motion the union of the contexts of the actions that set it.
# Status 10 / 11 / 12 / 13 / 16 / 17 (reactions, death, revival, demo, event, base) are entered by the shared code
# from either context: they are seeded {0, 1}. Actions no table issues and nothing chains to are 'unentered'.
import sys, json, re
cen = json.load(open(sys.argv[1])); em = json.load(open(sys.argv[2])); cls = sys.argv[3]
mot_re = re.compile(r'MOT L(\d+) M(\d+) \((0x[0-9a-f]+)\) b([-\d.e]+) s([-\d.e]+) (\S+) @(0x[0-9a-f]+)')
chg_re = re.compile(r'CHG (\w+) \((0x[0-9a-f]+), (0x[0-9a-f]+)\) @(0x[0-9a-f]+)')
def key(s, n): return '%d,%#x' % (s, n)
ctx = {}
src = {}
for k, v in em.items():
    ctx[k] = set(int(x) for x in v['streams'].keys()); src.setdefault(k, set()).add('emc')
for k in cen:
    st = int(k.split(',')[0])
    if st in (10, 11, 12, 13, 16, 17):
        ctx.setdefault(k, set()).update({0, 1}); src.setdefault(k, set()).add('shared')
edges = {}
for k, rec in cen.items():
    for kk, lines in rec.items():
        ph, link, sn = kk.split('/'); link = int(link)
        for l in lines:
            m = chg_re.match(l)
            if m and m.group(1) in ('follow', 'set', 'req', 'hold', 'changeAction'):
                t = key(int(m.group(2), 16), int(m.group(3), 16))
                if t == '0,0x0' and m.group(4) in ('0xf8e5d8',): continue
                edges.setdefault(k, set()).add((t, link, m.group(4)))
changed = True
while changed:
    changed = False
    for a, es in edges.items():
        for (t, link, pc) in es:
            c = ctx.get(a, set()) & {link}
            if c - ctx.get(t, set()):
                ctx.setdefault(t, set()).update(c); src.setdefault(t, set()).add('from %s @%s' % (a, pc)); changed = True
motions = {}
for k, rec in cen.items():
    for kk, lines in rec.items():
        ph, link, sn = kk.split('/'); link = int(link)
        for l in lines:
            m = mot_re.match(l)
            if m:
                mid = 'L%s M%s' % (m.group(1), m.group(2))
                c = ctx.get(k, set()) & {link}
                motions.setdefault(mid, {}).setdefault(k, {'ctx': set(), 'how': set()})
                motions[mid][k]['ctx'] |= c
                motions[mid][k]['how'].add('p%s b%s s%s %s@%s' % (ph, m.group(4), m.group(5), m.group(6) if m.group(6).startswith('layer') else '', m.group(7)))
out = {}
def tag(c): return {frozenset({0, 1}): 'both', frozenset({1}): 'COMBINED', frozenset({0}): 'solo', frozenset(): 'unentered'}[frozenset(c)]
for mid in sorted(motions, key=lambda x: (int(x.split()[0][1:]), int(x.split()[1][1:]))):
    acts = motions[mid]
    allc = set().union(*[a['ctx'] for a in acts.values()])
    print('%-8s %-9s %s' % (mid, tag(allc), ' ; '.join('(%s)%s %s' % (a, tag(v['ctx']), '/'.join(sorted(v['how']))[:90]) for a, v in sorted(acts.items()))))
    out[mid] = {'tag': tag(allc), 'actions': {a: {'ctx': tag(v['ctx']), 'how': sorted(v['how']), 'src': sorted(src.get(a, []))} for a, v in acts.items()}}
json.dump(out, open(cls + '_motion_ctx.json', 'w'), indent=0)
json.dump({k: sorted(v) for k, v in ctx.items()}, open(cls + '_action_ctx.json', 'w'), indent=0)
