import sys, struct, json
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
T = armdis.TEXT
cls = json.load(open(r'C:\MHGU-Extract\efx\agents\notice-scratch\emclasses.json'))
def owner(a):
    o = [k for k, v in cls.items() if v['lo'] <= a < v['hi']]
    return ','.join(o) or 'shared'
imm = int(sys.argv[1], 16)
want = 0x03000000 | ((imm >> 12) << 16) | (imm & 0xfff)
hits = []
for a in range(0, len(T) - 4, 4):
    w = struct.unpack_from('<I', T, a)[0]
    if (w & 0x0FFF0FFF) == want and (w >> 28) != 0xF:
        hits.append(a)
for a in hits:
    print('%#x %s' % (a, owner(a)))
print(len(hits), 'hits')
