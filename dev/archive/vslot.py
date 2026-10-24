from scan import *
# ldr Rt,[Rn,#imm] P=1 U=1 B=0 W=0 L=1
def ldr_imm(imm):
    return [i*4 for i, w in enumerate(W) if (w & 0x0ff00000) == 0x05900000 and (w & 0xfff) == imm]
A0 = ldr_imm(0xa0)
A4 = set(ldr_imm(0xa4))
pairs = []
for a in A0:
    near = [b for b in range(a - 0x60, a + 0x60, 4) if b in A4]
    if near:
        pairs.append((a, near))
print(len(A0), len(A4), len(pairs))
for a, nb in pairs:
    print(hex(a), [hex(b) for b in nb])
