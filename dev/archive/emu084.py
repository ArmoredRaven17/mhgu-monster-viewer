import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\build\hitzone-states')
from meatemu import Run, E, P
VT = 0x17f11fc
FN = 0x106cae8
def word(motion, g=0, i=0, phase=0, rage=0, tired=False):
    eb = {0x73e0: g, 0x73e1: i}
    pb = {0x1a1: phase}
    if tired: pb[0x505] = 2
    r = Run(VT, FN, mid='em084_00', enraged=rage, enemy_bytes=eb, p_bytes=pb, args=(motion,), budget=20000)
    w = struct.unpack('<I', r.mu.mem_read(E + 0x13f4, 4))[0]
    return w, r.err
cases = [
 ('L0 M1 idle, action (0,0)', 0x001, 0, 0, 0),
 ('L0 M1, action (13,0) phase 3', 0x001, 13, 0, 3),
 ('L0 M1, action (13,0) phase 4', 0x001, 13, 0, 4),
 ('L0 M1, action (13,0) phase 5', 0x001, 13, 0, 5),
 ('L0 M1, action (13,1) phase 4', 0x001, 13, 1, 4),
 ('L0 M2', 0x002, 2, 0, 0), ('L0 M8 (7,0x0a)', 0x008, 7, 0x0a, 0), ('L0 M51', 0x033, 0, 0, 0),
 ('L2 M24 (7,4)', 0x218, 7, 4, 0), ('L3 M1', 0x301, 10, 0x14, 0),
 ('L3 M63 (11,1)', 0x33f, 11, 1, 0),
]
for i in range(0, 9):
    cases.append(('L2 M23 (7,%d)' % i, 0x217, 7, i, 0))
cases.append(('L2 M23 (6,0)', 0x217, 6, 0, 0))
for name, m, g, i, ph in cases:
    w, err = word(m, g, i, ph)
    print('%-32s 0x%08x %s' % (name, w, err or ''))
print('state controls on L0 M2: calm 0x%x enraged 0x%x tired 0x%x' % (word(2)[0], word(2, rage=1)[0], word(2, tired=True)[0]))
