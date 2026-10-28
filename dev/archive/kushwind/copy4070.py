"""kushwind/copy4070.py: places that copy a vector from base+0x40 to base+0x70 of the same base register (a camera's position into
its +0x70), or compute +0x70 from +0x40 with an add: a load of [b, #0x40] and a store to [b, #0x70] within 8 instructions."""
import sys, re
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis, capstone
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM); md.skipdata = True
ins = list((i.address, i.mnemonic, i.op_str) for i in md.disasm(armdis.TEXT, 0))
for k, (a, m, o) in enumerate(ins):
    mm = re.match(r'v?ldr\s*', m)
    if not (m in ('ldr', 'vldr') and o.endswith('#0x40]')): continue
    b = o.split('[')[1].split(',')[0]
    if b == 'sp': continue
    for a2, m2, o2 in ins[k + 1:k + 9]:
        if m2 in ('str', 'vstr') and o2.endswith('[%s, #0x70]' % b):
            print('%08x %s %s  ->  %08x %s %s' % (a, m, o, a2, m2, o2)); break
