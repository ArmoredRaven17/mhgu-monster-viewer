# emc023.py <file.emc> <variant> [st,n ...]: the command table walked with op 0x92 (variant switch on e+0xb5f5) EVALUATED for
# <variant>, every other block op walked both ways; op 0x20 n -> g0 sN, op 0x14 n -> g1 sN. Roots: g0 s0 and every stream of
# groups >= 2. Prints, for each asked (st, n), the reachable streams issuing it (op 0x00 st n), and what reaches them.
import sys
sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\zamtrios-scratch')
import emc
ver, groups = emc.load(sys.argv[1]); VAR = int(sys.argv[2], 0)
want = [tuple(int(x, 0) for x in a.split(',')) for a in sys.argv[3:]]
def live(seq):
    out = []; stack = []; act = True
    for b in seq:
        if b[0] == 0x92:
            sub = b[1]
            if sub == 0x00: stack.append([False, False, act]); act = False
            elif sub == 0x01:
                top = stack[-1]; top[1] = top[2] and not top[0] and b[2] == VAR
                if top[1]: top[0] = True
                act = top[1]
            elif sub == 0x02:
                top = stack[-1]; top[1] = top[2] and not top[0]; top[0] = True; act = top[1]
            elif sub == 0xff:
                top = stack.pop(); act = top[2]
            continue
        if act: out.append(b)
    return out
ops = {(g, k): live([[int(x, 16) for x in o.split(' ')] for o in emc.parse(s) if not o.startswith('?')])
       for g, ss in enumerate(groups) for k, s in enumerate(ss)}
seen = set(); issued = {}; by = {}
def walk(key, frm):
    by.setdefault(key, set()).add(frm)
    if key in seen: return
    seen.add(key)
    for b in ops.get(key, []):
        if b[0] == 0xff: break
        if b[0] == 0x00 and len(b) == 3: issued.setdefault((b[1], b[2]), set()).add(key)
        elif b[0] == 0x20 and len(b) == 2: walk((0, b[1]), key)
        elif b[0] == 0x14 and len(b) == 2: walk((1, b[1]), key)
walk((0, 0), 'root')
for (g, k) in ops:
    if g >= 2: walk((g, k), 'root')
# control: the raw (unfiltered) issuers, to show the filter is what removes a stream
raw = {}
for g, ss in enumerate(groups):
    for k, s in enumerate(ss):
        for o in emc.parse(s):
            if o.startswith('?'): continue
            b = [int(x, 16) for x in o.split(' ')]
            if b[0] == 0x00 and len(b) == 3: raw.setdefault((b[1], b[2]), set()).add((g, k))
for w in want:
    print('variant %d (%d, %#x): issued by %s  (raw issuers %s)' % (VAR, w[0], w[1],
          ', '.join('g%ds%d <- %s' % (g, k, ','.join(x if isinstance(x, str) else 'g%ds%d' % x for x in sorted(by[(g, k)], key=str)))
                    for g, k in sorted(issued.get(w, ()))) or 'NONE',
          ','.join('g%ds%d' % x for x in sorted(raw.get(w, ())))))
