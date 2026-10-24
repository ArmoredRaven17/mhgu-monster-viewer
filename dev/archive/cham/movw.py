import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx'); import armdis
T = armdis.TEXT
def find(imm):
    pat = 0x03000000 | ((imm >> 12) << 16) | (imm & 0xfff)
    out = []
    for a in range(0, len(T) - 3, 4):
        w = struct.unpack_from('<I', T, a)[0]
        if (w & 0x0fff0fff) == pat: out.append(a)
    return out
for x in sys.argv[1:]:
    r = find(int(x, 16)); print(x, len(r), ' '.join(hex(a) for a in r[:80]))
