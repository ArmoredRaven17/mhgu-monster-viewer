# actscan.py <status> [lo hi]: every action-change call (bl/b to 0x76098 / 0x768c8 / 0x754b8 / 0x75230, or ldr [rX,#0x3d0] + blx) with
# the r1 / r2 immediates set in the 10 instructions before it; prints those whose r1 is <status>
import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx'); import armdis
T = armdis.TEXT
st = int(sys.argv[1], 0); lo = int(sys.argv[2], 0) if len(sys.argv) > 2 else 0; hi = int(sys.argv[3], 0) if len(sys.argv) > 3 else len(T)
TG = {0x76098: '76098', 0x768c8: '768c8', 0x754b8: '754b8', 0x75230: '75230'}
W = lambda a: struct.unpack_from('<I', T, a)[0]
def movimm(w, rd):
    # mov rd, #imm (A1) / movw rd, #imm16
    if (w & 0x0fef0000) == 0x03a00000 and ((w >> 12) & 0xf) == rd:
        rot = (w >> 8) & 0xf; imm = w & 0xff; return ((imm >> (2 * rot)) | (imm << (32 - 2 * rot))) & 0xffffffff
    if (w & 0x0ff00000) == 0x03000000 and ((w >> 12) & 0xf) == rd: return ((w >> 4) & 0xf000) | (w & 0xfff)
    return None
hits = []
for a in range(lo, hi - 4, 4):
    w = W(a); kind = None
    if (w >> 25) & 7 == 5:
        off = w & 0xffffff
        if off & 0x800000: off -= 0x1000000
        t = a + 8 + off * 4
        if t in TG: kind = TG[t]
    elif (w & 0x0ffffff0) == 0x012fff30:   # blx rm
        rm = w & 0xf
        for b in range(a - 4, a - 24, -4):
            v = W(b)
            if (v & 0x0fff0fff) == (0x05900000 | 0x3d0) & 0x0fff0fff and ((v >> 12) & 0xf) == rm and (v & 0xfff) == 0x3d0: kind = 'vt3d0'; break
    if not kind: continue
    r1 = r2 = None
    for b in range(a - 4, a - 44, -4):
        v = W(b)
        if r1 is None: r1 = movimm(v, 1)
        if r2 is None: r2 = movimm(v, 2)
    hits.append((a, kind, r1, r2))
print(len(hits), 'action-change calls')
for a, k, r1, r2 in hits:
    if r1 == st: print('%#x %s r1=%s r2=%s' % (a, k, r1, r2))
