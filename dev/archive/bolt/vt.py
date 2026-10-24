import sys, json, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
C = json.load(open(r'C:\MHGU-Extract\efx\agents\shells-scratch\shellclasses.json'))
def w(va): return armdis.u32(va)
N = 0x1b0 // 4 + 8
bases = {k: v['vtable'] for k, v in C.items() if k.startswith('uShellEmBase')}
print('bases:', {k: hex(v) for k, v in sorted(bases.items())})
cls = ['uShellEm081_sp_00', 'uShellEm081_sp_01', 'uShellEm081_04_01', 'uShellEm081_04_02', 'uShellEm081_04_11',
       'uShellEm081_sp_14', 'uShellEm081_sp_15', 'uShellEm081_04_50']
def slots(vt, n=None):
    out = []
    for i in range(n or 120):
        x = w(vt + 4 * i)
        if x is None: break
        out.append(x)
    return out
for c in cls:
    vt = C[c]['vtable']
    s = slots(vt)
    # best base match
    best = None
    for b, bv in bases.items():
        bs = slots(bv, len(s))
        m = sum(1 for i in range(min(len(s), len(bs))) if s[i] == bs[i])
        if not best or m > best[1]: best = (b, m, bs)
    b, m, bs = best
    # vtable length: stop where entries leave .text
    n = 0
    while n < len(s) and s[n] is not None and s[n] < 0x13EF000: n += 1
    print('%s vt %#x len %d  best %s %d/%d' % (c, vt, n, b, m, n))
    for i in range(n):
        if i < len(bs) and s[i] != bs[i]:
            print('    +%#05x %#x   (base %#x)' % (4 * i, s[i], bs[i]))
