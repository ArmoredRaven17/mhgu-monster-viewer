"""kushwind/vstm70.py: block stores to base+0x70 (`add rX, rY, #0x70` then vstmia / vst1 / stm to rX within 4) over main.text --
the form a camera's +0x40 / +0x60 vectors are written in (0x1e044 / 0x1e05c: add r0, r6, #0x40; vstmia r0, {s0, s1, s2})."""
import sys, re
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis, capstone
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM); md.skipdata = True
off = int(sys.argv[1], 16) if len(sys.argv) > 1 else 0x70
ins = list((i.address, i.mnemonic, i.op_str) for i in md.disasm(armdis.TEXT, 0))
for k, (a, m, o) in enumerate(ins):
    mm = re.match(r'(\w+), (\w+), #0x%x$' % off, o)
    if m != 'add' or not mm or mm.group(2) == 'sp': continue
    r = mm.group(1)
    for a2, m2, o2 in ins[k + 1:k + 5]:
        if re.match(r'(vstm|vst1|stm)', m2) and (o2.startswith(r + ',') or o2.startswith(r + '!') or ('[%s' % r) in o2):
            print('%08x %s %s ; %08x %s %s' % (a, m, o, a2, m2, o2)); break
