import sys, json
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
C = json.load(open(r'C:\MHGU-Extract\efx\agents\shells-scratch\shellclasses.json'))
allvt = sorted({v for c in C.values() for v in c.get('vtables', []) if v})
def length(vt):
    nxt = min([x for x in allvt if x > vt] or [vt + 0x200])
    return (nxt - vt) // 4
def slots(vt, n): return [armdis.u32(vt + 4 * i) for i in range(n)]
cands = ['uShellEmBase00', 'uShellEmBase01', 'uShellEmBase02', 'uShellEmBase03', 'uShellEmBase11', 'uShellEmBase14', 'uShellEmBase15', 'uShellEmBase50']
cls = sys.argv[1:] or ['uShellEm081_sp_00', 'uShellEm081_sp_01', 'uShellEm081_04_01', 'uShellEm081_04_02', 'uShellEm081_04_11',
       'uShellEm081_sp_14', 'uShellEm081_sp_15', 'uShellEm081_04_50']
for c in cls:
    vt = C[c]['vtable']; n = length(vt); s = slots(vt, n)
    res = []
    for b in cands:
        bv = C[b]['vtable']; bn = length(bv); bs = slots(bv, bn)
        m = sum(1 for i in range(min(n, bn)) if s[i] == bs[i])
        res.append((m, b, bn))
    res.sort(reverse=True)
    m, b, bn = res[0]
    print('%s vt %#x n %d (=%#x B) | best %s %d/%d (base n %d) | next %s' % (c, vt, n, 4 * n, b, m, n, bn, ['%s %d' % (x[1][11:], x[0]) for x in res[1:4]]))
    bs = slots(C[b]['vtable'], bn)
    for i in range(n):
        if i >= bn or s[i] != bs[i]:
            print('    +%#05x %#x   (base %s)' % (4 * i, s[i], hex(bs[i]) if i < bn else '-'))
