# up.py addr..: the function holding each address, and its callers in the class band, up to 4 levels (band 0xfad1fc..0xfc40ec)
import sys
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
S = armdis.sweep(int(__import__("os").environ.get("UP_LO","0xfad1fc"),0), int(__import__("os").environ.get("UP_HI","0xfc40ec"),0))
idx = {a: i for i, (a, m, o) in enumerate(S)}
def start(a):
    i = idx[a]
    while i > 0 and not (S[i][1] == 'push' and 'lr' in S[i][2]): i -= 1
    return S[i][0]
def callers(f): return [a for (a, m, o) in S if m in ('bl', 'b', 'blx', 'beq', 'bne') and o == '#0x%x' % f]
def walk(a, d, seen):
    f = start(a)
    if f in seen: return
    seen.add(f)
    cs = callers(f)
    print('  ' * d + '%x in fn %x <- %s' % (a, f, ' '.join('%x' % c for c in cs) or '(none: a table / vtable)'))
    if d < 3:
        for c in cs: walk(c, d + 1, seen)
for x in sys.argv[1:]: walk(int(x, 16), 0, set())
