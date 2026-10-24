import sys, re
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis, capstone
T = armdis.TEXT
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
md.skipdata = True
want = {'#0x36]': 'h36', '#0x38]': 'h38', '#0x3a]': 'b3a', '#0x3b]': 'b3b', '#0x3c]': 'b3c'}
win = []
hits = {}
lo, hi = 0x60000, 0x200000
for i in md.disasm(T[lo:hi], lo):
    if i.mnemonic.startswith('ldr'):
        for k, v in want.items():
            if i.op_str.endswith(k):
                b = i.address >> 8
                hits.setdefault(i.address & ~0x7f, set()).add(v)
for a, s in sorted(hits.items()):
    if len(s) >= 3: print(hex(a), sorted(s))
