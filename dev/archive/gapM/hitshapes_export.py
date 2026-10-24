# hitshapes_export.py (gapM, 2026-10-22): every shell folder's _hitdata (HDS) records and _hitsize (HTS) groups, from the
# monsters' .arc files, as the fields the hit manager reads:
#   HDS record (0x38 B from +0x10): s16 +0 delay, s16 +2 duration (0x168a68..0x168a84), byte +6 kind -> H+0x3a (0 -> 1,
#     0x168a90..0x168ae8), byte +0x19 the hitsize group (0x4a1bbc: used when the registration's r3 is -1)
#   HTS: u32 +8 group count; table at +0x10 of (u32 count, u32 offset); records 0x30 B: u16 +0 j0, u16 +2 j1, u16 +4 code,
#     u16 +6 flags (bit 12 -> desc+6), f32 +0xc radius, vec3 +0x10 off0, vec3 +0x20 off1 (0x16d980..0x16d9f4)
import sys, os, struct, json
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import shellef as s
root = r'C:\MHGU-Extract\scratch-em'
out = {}
for mon in sorted(os.listdir(root)):
    p = os.path.join(root, mon, mon + '.arc')
    if not os.path.exists(p): continue
    F = s.load_typed(p)
    for (nm, th), b in sorted(F.items()):
        if not nm.startswith('shell'): continue
        folder = nm.rsplit(chr(92), 1)[0]
        if nm.endswith('_hitdata') and b[:4] == b'HDS\0':
            n = struct.unpack_from('<I', b, 8)[0]
            recs = []
            for k in range(n):
                o = 0x10 + 0x38 * k
                d, du = struct.unpack_from('<2h', b, o)
                recs.append([d, du, b[o + 6] or 1, b[o + 0x19]])
            out.setdefault(folder, {})['hitrec'] = recs
        elif nm.endswith('_hitsize') and b[:4] == b'HTS\0':
            ng = struct.unpack_from('<I', b, 8)[0]
            groups = []
            for g in range(ng):
                n, off = struct.unpack_from('<2I', b, 0x10 + 8 * g)
                recs = []
                for k in range(n):
                    o = off + 0x30 * k
                    j0, j1, code, fl = struct.unpack_from('<4H', b, o)
                    r = struct.unpack_from('<f', b, o + 0xc)[0]
                    recs.append({ 'j0': j0, 'j1': j1, 'code': code, 'flags': fl, 'r': r,
                                  'o0': list(struct.unpack_from('<3f', b, o + 0x10)),
                                  'o1': list(struct.unpack_from('<3f', b, o + 0x20)) })
                groups.append(recs)
            out.setdefault(folder, {})['hitsize'] = groups
dst = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'hitshapes.json')
json.dump(out, open(dst, 'w'), indent=0)
print(len(out), 'shell folders ->', dst)
