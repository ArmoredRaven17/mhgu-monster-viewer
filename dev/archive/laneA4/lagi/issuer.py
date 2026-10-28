# laneA4/lagi/issuer.py (lane A4, 2026-10-26): every b / bl / blx with r1 = S and r2 = N set by immediates within the 6 instructions
# before it, over a range. usage: issuer.py S N lo hi.  Control: issuer.py 2 0xc 0xe9f000 0xeb0000 finds Lagiacrus's own (2, 0xc)
# change at 0xea1cc8 (the (2, 0x1e) handler's neighbour arm).
import sys, re, capstone
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
S, N, lo, hi = (int(x, 0) for x in sys.argv[1:5])
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM); md.skipdata = True
ins = list(md.disasm(armdis.TEXT[lo:hi], lo))
for k, i in enumerate(ins):
    if i.mnemonic in ('b', 'bl', 'blx', 'bx'):
        r1 = r2 = None
        for j in ins[max(0, k - 6):k]:
            m = re.match(r'^(r1|r2), #(\w+)$', j.op_str)
            if j.mnemonic in ('mov', 'movw') and m:
                if m.group(1) == 'r1': r1 = int(m.group(2), 0)
                else: r2 = int(m.group(2), 0)
        if r1 == S and r2 == N: print('%#x %s %s' % (i.address, i.mnemonic, i.op_str))
