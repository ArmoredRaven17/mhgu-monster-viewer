"""Lao-Shan Lung's per-frame event lists (vt+0x2a8 0xd759f4): table 0x17a50f4, 58 x {list A ptr, list B ptr};
record 0x24 = {+0 action, +4 motion, +8 test, +0xc f0, +0x10 f1, +0x14 a0, +0x18 a1, +0x1c a2} (floats from +0xc).
python evt012.py [all]"""
import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
D, DA = armdis.DATA, armdis.DA_VA
def u(a): return armdis.u32(a)
def f(a): return struct.unpack("<f", struct.pack("<I", armdis.u32(a)))[0]
ACT = {1: 'hit', 2: 'rate', 3: 'flag', 4: 'sound', 5: 'sp01', 6: 'sp13'}
T = 0x17a50f4
allr = len(sys.argv) > 1
for i in range(58):
    for side in (0, 1):
        p = u(T + 8 * i + 4 * side)
        if not p: continue
        recs = []
        while u(p):
            a, m, t = u(p), u(p + 4), u(p + 8)
            fl = [f(p + 0xc + 4 * k) for k in range(5)]
            if allr or a in (5, 6):
                recs.append('%s L%d M%d t%d %s' % (ACT.get(a, a), (m >> 8) & 0xf, m & 0xff, t, ' '.join('%g' % x for x in fl)))
            p += 0x24
        if recs: print('%d%s: %s' % (i, 'AB'[side], ' ; '.join(recs)))
