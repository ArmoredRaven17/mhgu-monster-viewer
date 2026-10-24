import sys, struct, json
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
T = armdis.TEXT
cls = json.load(open(r'C:\MHGU-Extract\efx\agents\notice-scratch\emclasses.json'))
def owner(a):
    o = [k for k, v in cls.items() if v['lo'] <= a < v['hi']]
    return ','.join(o) or 'shared'
tgt = int(sys.argv[1], 16)
for a in range(0, len(T) - 4, 4):
    w = struct.unpack_from('<I', T, a)[0]
    if (w & 0x0E000000) == 0x0A000000 and (w >> 28) != 0xF:
        off = w & 0xFFFFFF
        if off & 0x800000: off -= 0x1000000
        if a + 8 + off * 4 == tgt:
            o = owner(a)
            if o == 'shared' or (len(sys.argv) > 2 and sys.argv[2] in o):
                print('%#x %s %s' % (a, o, 'bl' if w & 0x01000000 else 'b'))
