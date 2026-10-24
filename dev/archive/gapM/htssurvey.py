import sys, os, struct, collections, json
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import shellef as s
root = r'C:\MHGU-Extract\scratch-em'
cnt = collections.Counter(); rows = []
for mon in sorted(os.listdir(root)):
    p = os.path.join(root, mon, mon + '.arc')
    if not os.path.exists(p): continue
    try: F = s.load_typed(p)
    except Exception as e: print('ERR', mon, e); continue
    for (nm, th), b in sorted(F.items()):
        if not (nm.startswith('shell') and nm.endswith('_hitsize')): continue
        if b[:4] != b'HTS\0': print('BAD', nm); continue
        ng = struct.unpack_from('<I', b, 8)[0]
        for g in range(ng):
            n, off = struct.unpack_from('<2I', b, 0x10 + 8 * g)
            for k in range(n):
                o = off + 0x30 * k
                j0, j1, code, fl = struct.unpack_from('<4H', b, o)
                w8 = struct.unpack_from('<I', b, o + 8)[0]
                r = struct.unpack_from('<f', b, o + 0xc)[0]
                o0 = struct.unpack_from('<3f', b, o + 0x10); o1 = struct.unpack_from('<3f', b, o + 0x20)
                cnt[(j0, j1, code)] += 1
                rows.append((nm.split('\\')[-1], g, k, j0, j1, code, fl, hex(w8), r, o0, o1))
for k, v in sorted(cnt.items()): print('j0 %d j1 %d code %d : %d' % (k[0], k[1], k[2], v))
json.dump(rows, open(os.path.join(os.path.dirname(__file__), 'hts_rows.json'), 'w'))
for r in rows:
    if not (r[3] == 1001 and r[4] != 2001): print(r)
