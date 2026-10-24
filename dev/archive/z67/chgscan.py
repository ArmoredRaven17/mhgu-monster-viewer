# every call in Zamtrios's class band to the changeAction family with r1 / r2 set by an immediate in the 10 instructions
# before it (same basic block not checked -- a candidate list, each site read by hand where it matters)
import sys, capstone, bisect
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
T = armdis.TEXT
LO, HI = 0xf65ba4, 0xf78400
CHG = {0x768c8: 'follow', 0x7699c: 'hold', 0x76a40: 'req', 0x75230: 'set', 0x76088: 'default', 0x76094: 'default2', 0x76098: 'changeAction'}
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM); md.skipdata = True
ins = list(md.disasm(T[LO:HI], LO))
starts = sorted(i.address for i in ins if i.mnemonic.startswith('push') and 'lr' in i.op_str)
want = None
if len(sys.argv) > 1: want = set(tuple(int(y, 0) for y in x.split(',')) for x in sys.argv[1:])
for k, i in enumerate(ins):
    if i.mnemonic not in ('bl', 'b') or not i.op_str.startswith('#'): continue
    t = int(i.op_str[1:], 16)
    if t not in CHG: continue
    r1 = r2 = None
    for j in range(k - 1, max(0, k - 12), -1):
        p = ins[j]
        if p.mnemonic in ('bl', 'blx', 'b', 'bx', 'pop') : break
        if p.mnemonic in ('mov', 'movw') and p.op_str.startswith('r1, #') and r1 is None: r1 = int(p.op_str.split('#')[1], 0)
        if p.mnemonic in ('mov', 'movw') and p.op_str.startswith('r2, #') and r2 is None: r2 = int(p.op_str.split('#')[1], 0)
    if want and (r1, r2) not in want: continue
    f = starts[bisect.bisect_right(starts, i.address) - 1]
    print('%#x fn %#x %s (%s, %s)' % (i.address, f, CHG[t], r1, hex(r2) if r2 is not None else None))
