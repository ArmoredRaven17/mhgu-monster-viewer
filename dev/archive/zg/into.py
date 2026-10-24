"""Branches (direct, and relative jump-table entries) into [lo, hi] within a band.  python into.py band_lo band_hi lo hi"""
import sys, struct, re; sys.path.insert(0, r'C:\MHGU-Extract\efx'); import armdis, capstone
T = armdis.TEXT; md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
blo, bhi, lo, hi = [int(x, 16) for x in sys.argv[1:5]]
L = {}
for a in range(blo, bhi, 4):
    i = next(md.disasm(T[a:a + 4], a), None)
    if i: L[a] = i
for a, i in L.items():
    if i.mnemonic.startswith('b') and i.op_str.startswith('#') and lo <= int(i.op_str[1:], 16) <= hi: print('%x %s %s' % (a, i.mnemonic, i.op_str))
    if i.mnemonic == 'add' and i.op_str.startswith('pc, r0, r1'):
        base = n = None
        for b in range(a - 4, a - 48, -4):
            j = L.get(b)
            if not j: continue
            m = re.match(r'r1, pc, #(0x[0-9a-f]+|\d+)', j.op_str)
            if j.mnemonic == 'add' and m and base is None: base = b + 8 + int(m.group(1), 0)
            m = re.match(r'(r\d+), #(0x[0-9a-f]+|\d+)', j.op_str)
            if j.mnemonic == 'cmp' and m and n is None: n = int(m.group(2), 0)
        if base is None or n is None: continue
        for k in range(n + 1):
            e = (base + struct.unpack_from('<i', T, base + 4 * k)[0]) & 0xffffffff
            if lo <= e <= hi: print('%x table[%d] -> %x' % (a, k, e))
