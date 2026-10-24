# hitd37.py: em037_00 / em037_04 shell01 hitdata (HDS: records of 0x38 bytes from +0x10, s16 delay, s16 duration) from the arcs
import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import shellef as sf
for mon in ('em037_00', 'em037_04', 'em032_00'):
    F = sf.load(r'C:\MHGU-Extract\scratch-em\%s\%s.arc' % (mon, mon))
    for nm, (th, b) in sorted(F.items()):
        if nm.endswith('_01_hitdata') or (mon == 'em037_00' and nm.endswith('_00_hitdata')):
            print(mon, nm, b[:4], 'ver %#x' % struct.unpack_from('<I', b, 4)[0], 'n', struct.unpack_from('<I', b, 8)[0], 'len', len(b))
            n = (len(b) - 0x10) // 0x38
            print('   ', [struct.unpack_from('<hh', b, 0x10 + 0x38 * i) for i in range(n)])
