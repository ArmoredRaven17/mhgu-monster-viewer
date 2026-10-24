import struct, json, fwread as f
cls = json.load(open(r'C:\MHGU-Extract\efx\agents\notice-scratch\emclasses.json'))
it = cls.items() if isinstance(cls, dict) else [(c['name'], c) for c in cls]
rng = [(v['lo'], v['hi'], k) for k, v in it]
def owner(a):
    o = [k for lo, hi, k in rng if lo <= a < hi]
    return ','.join(o) or '?'
T = f.T; TGT = 0xc2274
for a in range(0, len(T) - 4, 4):
    w = struct.unpack_from('<I', T, a)[0]
    if (w >> 24) & 0xf in (0xb,) and (w >> 28) != 0xf:
        off = w & 0xffffff
        if off & 0x800000: off -= 0x1000000
        if a + 8 + off * 4 == TGT:
            r3 = r1 = None
            for i in f.md.disasm(T[a - 40:a], a - 40):
                if i.mnemonic.startswith('mov') and i.op_str.startswith('r3, #'): r3 = i.op_str[5:]
                if i.mnemonic.startswith('mov') and i.op_str.startswith('r1, #'): r1 = i.op_str[5:]
            print('%x %-12s slot r1=%s kind r3=%s %s' % (a, owner(a), r1, r3, 'bl' if (w>>24)&1 else 'b'))
