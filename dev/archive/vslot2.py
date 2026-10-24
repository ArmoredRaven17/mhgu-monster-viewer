from scan import *
import armdis
def ldr_imm(imm):
    return [i*4 for i, w in enumerate(W) if (w & 0x0ff00000) == 0x05900000 and (w & 0xfff) == imm]
A0 = ldr_imm(0xa0)
A4 = set(ldr_imm(0xa4))
A9c = set(ldr_imm(0x9c))
cnt = 0
for a in A0:
    # must be followed by blx within 3 instrs
    ins = list(armdis.sweep(a, a + 0x10))
    if not any(m == 'blx' for _, m, _ in ins):
        continue
    near = [b for b in range(a + 4, a + 0x30, 4) if b in A4]
    if not near:
        continue
    ins2 = list(armdis.sweep(near[0], near[0] + 0x10))
    if not any(m == 'blx' for _, m, _ in ins2):
        continue
    cnt += 1
    print('=====', hex(a))
    for x, m, o in armdis.sweep(a - 0x18, near[0] + 0x10):
        print('  ', hex(x), m, o)
print(cnt)
