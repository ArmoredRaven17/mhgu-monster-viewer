# wrapscan.py (effects lane, 2026-10-25): the wrapper side of uidscan.py. Every `bl T` in main.text 0x40000..0x1130000 whose r1 / r2 was
# set by an immediate 47..58 (the base-table ids of u 1300..1315) in the 8 instructions before, kept only when T (or T's own `b` / `bl`
# within its first 64 instructions) reaches one of uidscan's register-id request sites (vt+0x1d0 / +0x1cc, 0xa3ddc / 0xa3dc0).
# Control: the same scan with ids 0..1 must find the callers of the shared puff path, or any wrapper that takes a u id; reported as counts.
import sys, capstone
sys.path.insert(0, r'C:\MHGU-Extract\efx'); import armdis
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM); T = armdis.TEXT
ids = set(range(int(sys.argv[1]), int(sys.argv[2]) + 1))
reqsites = [int(l.split()[1], 16) for l in open('uids.txt') if l.split()[2] == '-']
def fn_reaches(t, depth=2):
    # the function at t: walk 400 instructions or to its return; a request site inside, or a bl/b to a function that has one
    k = 0
    for i in md.disasm(T[t:t + 1600], t):
        if i.address in rs: return True
        if depth and i.mnemonic in ('bl', 'b') and i.op_str.startswith('#0x'):
            u = int(i.op_str[1:], 16)
            if u != t and 0x40000 <= u < 0x1130000 and fn_reaches(u, depth - 1): return True
        if (i.mnemonic == 'pop' and 'pc' in i.op_str) or (i.mnemonic == 'bx' and i.op_str == 'lr'): return False
        k += 1
        if k > 400: return False
    return False
rs = set(reqsites)
cache = {}
hits = []
a, lo, hi = 0x40000, 0x40000, 0x1130000
win = []
while a < hi:
    n = 0
    for i in md.disasm(T[a:min(hi, a + 0x10000)], a):
        n = i.address + 4
        win.append(i); win = win[-9:]
        if i.mnemonic == 'bl' and i.op_str.startswith('#0x'):
            t = int(i.op_str[1:], 16)
            for j in reversed(win[:-1]):
                if j.mnemonic.startswith('mov') and (j.op_str.startswith('r1, #') or j.op_str.startswith('r2, #')):
                    v = int(j.op_str.split('#')[1], 0)
                    if v in ids:
                        if t not in cache: cache[t] = fn_reaches(t)
                        if cache[t]: hits.append((i.address, j.address, j.op_str, t))
                    break
    a = max(n, a + 4) if n else a + 4
for h in hits: print('%08x  %08x %-12s -> %08x' % h)
print('total', len(hits), 'targets checked', len(cache), 'reaching', sum(cache.values()))
