import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\build\hitzone-states')
from meatemu import Run, E, P
VT = 0x17f11fc
def word(motion, g, i, phase, extra):
    eb = {0x73e0: g, 0x73e1: i}; eb.update(extra)
    r = Run(VT, 0x106cae8, mid='em084_00', enemy_bytes=eb, p_bytes={0x1a1: phase}, args=(motion,), budget=20000)
    return hex(struct.unpack('<I', r.mu.mem_read(E + 0x13f4, 4))[0]), sorted(k for k in r.reads if k[0] in 'EP')
for extra, name in (({}, 'zero'), ({0xcac4: 2}, 'stance 2'), ({0xcac4: 1, 0xcadc: 1}, 'stance 1 + charge'), ({0xcb0c: 2, 0xcb0d: 3, 0xcb30: 1}, 'skull forms')):
    print(name, word(0x001, 13, 0, 4, extra)[0], word(0x217, 7, 6, 0, extra)[0], word(0x002, 2, 0, 0, extra)[0])
print('fields read for L0 M1 (13,0):', word(0x001, 13, 0, 4, {})[1])
print('fields read for L2 M23 (7,6):', word(0x217, 7, 6, 0, {})[1])
