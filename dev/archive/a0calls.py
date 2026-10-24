from scan import *
import armdis, sys
lo, hi = int(sys.argv[1], 16), int(sys.argv[2], 16)
slot = int(sys.argv[3], 16) if len(sys.argv) > 3 else 0xa0
def ldr_imm(imm):
    return [i*4 for i, w in enumerate(W) if (w & 0x0ff00000) == 0x05900000 and (w & 0xfff) == imm]
for a in ldr_imm(slot):
    if not (lo <= a < hi): continue
    ins = list(armdis.sweep(a, a + 0x14))
    if not any(m in ('blx', 'bx') for _, m, _ in ins): continue
    print('=====', hex(a))
    for x, m, o in armdis.sweep(a - 0x20, a + 0x14):
        print('  ', hex(x), m, o)
