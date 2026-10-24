# vchain.py <lo> <hi> (hex) (2026-10-19): every action change a class band makes -- direct b / bl to the change family (0x768c8 /
# 0x75230 / 0x76098) AND the virtual vt+0x3d0 (`ldr rX, [rY, #0x3d0]` then blx / bx; uEnemy's 0x6c178 = b 0x768c8) -- with r1 / r2 from
# the 12 instructions before (mov / movw immediates; '?' when computed) and the containing function (the nearest push {.., lr})
import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
T = armdis.TEXT; m = len(T)//4; X = struct.unpack('<%dI' % m, T[:4*m])
lo, hi = int(sys.argv[1], 16), int(sys.argv[2], 16)
def tgt(i):
    w = X[i]
    if (w & 0x0e000000) != 0x0a000000 or (w >> 28) == 0xf: return None
    off = w & 0xffffff
    if off & 0x800000: off -= 0x1000000
    return 4*i + 8 + 4*off
def regs(i):
    r = {}
    for j in range(1, 13):
        w = X[i-j]
        if (w >> 28) == 0xf: continue
        rd = (w >> 12) & 0xf
        if (w & 0x0fef0000) == 0x03a00000:
            rot = (w >> 8) & 0xf; v = w & 0xff; v = ((v >> (2*rot)) | (v << (32 - 2*rot))) & 0xffffffff
            r.setdefault(rd, v)
        elif (w & 0x0ff00000) == 0x03000000: r.setdefault(rd, ((w >> 4) & 0xf000) | (w & 0xfff))
        elif rd not in r and (w & 0x0c000000) in (0x00000000, 0x04000000) and not (w & 0x0e000010) == 0x00000010: r.setdefault(rd, '?')
    return r
def fstart(i):
    while i > 0 and (X[i] & 0x0fff4000) != 0x092d4000: i -= 1
    return 4*i
for i in range(lo//4, hi//4):
    w = X[i]; kind = None
    t = tgt(i)
    if t in (0x768c8, 0x75230, 0x76098): kind = '%#x' % t
    elif (w & 0x0e500fff) == 0x041003d0 and (w >> 23) & 1 and (w >> 28) != 0xf and ((w >> 16) & 0xf) != 15: kind = 'vt+0x3d0'
    if kind:
        r = regs(i)
        f = lambda x: x if x == '?' or x is None else hex(x)
        print('%#x in %#x: %s (%s, %s)' % (4*i, fstart(i), kind, f(r.get(1)), f(r.get(2))))
