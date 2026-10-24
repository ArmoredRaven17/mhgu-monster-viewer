import sys, fwread as f
for vt in [0x17bfd1c, 0x17c1434, 0x17c257c, 0x17c8768]:
    own = []
    for i in range(0x180):
        p = f.u32(vt + 4*i)
        if p is None: break
        if 0xd00000 <= p < 0x1100000: own.append((i*4, p))
    ps = [p for _, p in own]
    print(hex(vt), len(own), hex(min(ps)), hex(max(ps)))
