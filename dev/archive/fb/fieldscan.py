# fieldscan.py <off> [lo hi]: every instruction in the text that can address object field +off (2026-10-19): movw rX, #off; ldr/str
# (word / byte) [rN, #off] (imm12); ldrh/strh / ldrd [rN, #off] (imm8, off < 0x100); add rX, rN, #base with a following memory op at
# #(off - base) within 8 instructions (base = off & ~0xff, off & ~0xfff); add rX, rN, #off exactly
import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
T = armdis.TEXT
off = int(sys.argv[1], 0)
lo = int(sys.argv[2], 0) if len(sys.argv) > 2 else 0; hi = int(sys.argv[3], 0) if len(sys.argv) > 3 else len(T)
n = len(T) // 4
W = struct.unpack('<%dI' % n, T[:4 * n])
def imm_rot(w):
    rot = (w >> 8) & 0xf; v = w & 0xff
    r = (2 * rot) % 32
    return ((v >> r) | (v << (32 - r))) & 0xffffffff
hits = []
for i in range(lo // 4, min(hi // 4, n)):
    w = W[i]; c = w >> 28
    if c == 0xf: continue
    a = 4 * i
    # movw rX, #imm16
    if (w & 0x0ff00000) == 0x03000000 and (((w >> 4) & 0xf000) | (w & 0xfff)) == off: hits.append((a, 'movw')); continue
    # ldr/str/ldrb/strb immediate
    if (w & 0x0e000000) == 0x04000000 and (w & 0xfff) == off and (w >> 23) & 1: hits.append((a, 'ldst12')); continue
    # ldrh/strh/ldrd/strd immediate (imm8 split)
    if (w & 0x0e400090) == 0x00400090 and (((w >> 4) & 0xf0) | (w & 0xf)) == off and (w >> 23) & 1: hits.append((a, 'ldsth')); continue
    # add rX, rN, #imm
    if (w & 0x0fe00000) == 0x02800000:
        v = imm_rot(w & 0xfff)
        if v == off: hits.append((a, 'add=off')); continue
        if v and v < off and off - v < 0x1000:
            rd = (w >> 12) & 0xf; rest = off - v
            for j in range(1, 9):
                w2 = W[i + j]
                if (w2 & 0x0e000000) == 0x04000000 and ((w2 >> 16) & 0xf) == rd and (w2 & 0xfff) == rest and (w2 >> 23) & 1: hits.append((a, 'add+%#x' % rest)); break
                if rest < 0x100 and (w2 & 0x0e400090) == 0x00400090 and ((w2 >> 16) & 0xf) == rd and (((w2 >> 4) & 0xf0) | (w2 & 0xf)) == rest: hits.append((a, 'addh+%#x' % rest)); break
print(off and hex(off), len(hits)); print(' '.join('%#x:%s' % h for h in hits))
