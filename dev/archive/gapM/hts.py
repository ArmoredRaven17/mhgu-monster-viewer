import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import shellef as s
mon = sys.argv[1]; pat = sys.argv[2] if len(sys.argv) > 2 else 'hitsize'
F = s.load_typed(r'C:\MHGU-Extract\scratch-em\%s\%s.arc' % (mon, mon))
for (nm, th), b in sorted(F.items()):
    if nm.endswith(pat):
        print(nm, th, len(b))
        for o in range(0, min(len(b), int(sys.argv[3], 0) if len(sys.argv) > 3 else 0x100), 16):
            ws = struct.unpack_from('<4I', b + b'\0' * 16, o)
            fs = struct.unpack_from('<4f', b + b'\0' * 16, o)
            print('  %04x  %s   %s' % (o, b[o:o+16].hex(' '), ' '.join('%g' % x for x in fs)))
