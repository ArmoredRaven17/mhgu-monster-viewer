from gotrefs import *
import armdis, re, sys
slot = int(sys.argv[1], 16)
offs = [int(x, 16) for x in sys.argv[2].split(',')]
us = got_users(slot)
for a in us:
    w = W[a // 4]
    rt = (w >> 12) & 0xf
    # next: ldr rG,[rt] (deref the slot) -> the singleton pointer
    ins = list(armdis.sweep(a + 4, a + 0x60))
    regs = set()
    for x, m, o in ins[:3]:
        mm = re.match(r'(r\d+|sb|sl|fp|ip|lr), \[r%d\]$' % rt, o)
        if m == 'ldr' and mm:
            regs.add(mm.group(1)); break
    if not regs:
        continue
    for x, m, o in ins:
        for off in offs:
            for r in regs:
                if m.startswith('str') and o.endswith('[%s, #0x%x]' % (r, off)):
                    print(hex(a), hex(x), m, o)
