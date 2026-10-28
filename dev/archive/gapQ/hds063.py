# the em063 shells' HDS (hitdata) and HTS (hitsize) records: HDS 0x38 B from +0x10 (delay s16 +0, duration s16 +2, kind +6, group +0x19)
import sys, struct
sys.path.insert(0, 'C:/MHGU-Extract/efx')
import shellef
BS = chr(92)
for mon in ('em063_00', 'em063_05'):
    T = shellef.load_typed(BS.join(['C:', 'MHGU-Extract', 'scratch-em', mon, mon + '.arc']))
    for (nm, th), b in sorted(T.items()):
        if nm.endswith('_hitdata') and b[:4] == b'HDS\0':
            n = struct.unpack_from('<I', b, 8)[0]
            recs = []
            for k in range(n):
                o = 0x10 + 0x38 * k
                d, du = struct.unpack_from('<hh', b, o)
                recs.append((d, du, b[o + 6], b[o + 0x19]))
            print(mon, nm.split(BS)[-1], 'n', n, 'len', len(b), 'exact', len(b) == 0x10 + 0x38 * n)
            print('   ', [(k, r) for k, r in enumerate(recs)])
