# every data-processing immediate add/sub whose value is in [0x5c00, 0x5d00] (a base near P+0x5cfc), any class or shared
import sys, struct, json
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
T = armdis.TEXT
cls = json.load(open(r'C:\MHGU-Extract\efx\agents\notice-scratch\emclasses.json'))
def owner(a):
    o = [k for k, v in cls.items() if v['lo'] <= a < v['hi']]
    return ','.join(o) or 'shared'
def rimm(w):
    imm = w & 0xff; rot = ((w >> 8) & 0xf) * 2
    return ((imm >> rot) | (imm << (32 - rot))) & 0xffffffff
LO, HI = int(sys.argv[1],16), int(sys.argv[2],16)
n = 0
for a in range(0, len(T) - 4, 4):
    w = struct.unpack_from('<I', T, a)[0]
    if (w >> 28) == 0xF: continue
    if (w & 0x0FE00000) in (0x02800000,) and (w & 0x02000000):   # add imm
        v = rimm(w)
        if LO <= v <= HI:
            n += 1
            if owner(a) == 'shared' or 'uEm070' in owner(a): print('%#x %s add #%#x' % (a, owner(a), v))
print(n, 'total')
