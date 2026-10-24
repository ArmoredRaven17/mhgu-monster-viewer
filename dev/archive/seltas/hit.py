import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import shellef
for m in ['em069_00','em076_00']:
    F = shellef.load_typed(r'C:\MHGU-Extract\scratch-em\%s\%s.arc' % (m, m))
    for (n, t), b in sorted(F.items()):
        if n.endswith('_hitdata'):
            cnt = (len(b) - 0x10) // 0x38
            print(m, n.split(chr(92))[-1], b[:16].hex(), [struct.unpack_from('<hh', b, 0x10 + 0x38 * i) for i in range(cnt)])
