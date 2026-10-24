# st3c.py [suffix..] -- every store (default '#0x3c]'; '#0x9c]' = P+0x60+0x3c, ctl = P+0x60 (ctor 0xd7d5d4)) to [rX, #0x3c] / #0x40 in uEm013_00's band (per-word disassembly), with the 4 instructions before: which of them
# store into the class control block [e+0xcac0] (ctl+0x3c, the storm's second timer)
import sys
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
from capstone import *
md = Cs(CS_ARCH_ARM, CS_MODE_ARM); T = armdis.TEXT
lo, hi = 0xd7d578, 0xd8e5c0
SUF = sys.argv[1:] or ['#0x3c]']
ins = []
for a in range(lo, hi, 4):
    d = list(md.disasm(T[a:a + 4], a)); ins.append((a, d[0].mnemonic, d[0].op_str) if d else (a, '.word', ''))
for k, (a, m, o) in enumerate(ins):
    if m.startswith(('str', 'vstr', 'stm')) and any(o.endswith(x) for x in SUF):
        print(' | '.join('%x %s %s' % j for j in ins[max(0, k - 5):k + 1]))
print('-- loads of 0xcac0 offsets:', sum(1 for a, m, o in ins if '#0xcac0' in o))
