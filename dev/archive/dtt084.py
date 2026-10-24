import sys, struct, os
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import shellef
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'e84arc')
os.makedirs(OUT, exist_ok=True)
A = shellef.load_typed(r'C:\MHGU-ROM\romfs\nativeNX\arc\enemy\em084_00.arc')
for (nm, th), raw in sorted(A.items()):
    if any(k in nm for k in ('dt_', 'body_data', 'hit_data', 'ems099')):
        fn = nm.replace(chr(92), '__') + '.' + th
        open(os.path.join(OUT, fn), 'wb').write(raw)
        print('%-60s %s %6d' % (nm, th, len(raw)))

def walk(d, name):
    magic, ver = struct.unpack_from('<4sI', d, 0)
    hdr8, hdr12 = d[8], d[0x12]
    print('=== %s len %d magic %r ver 0x%08x preamble %d hdr12 %d -> %d tables' % (name, len(d), magic, ver, hdr8, hdr12, 2 if hdr12 == 0 else 1))
    print('  header', d[:0x38].hex(' '))
    o = 0x38
    print('  0x%03x u32 %08x' % (o, struct.unpack_from('<I', d, o)[0])); o += 4
    for r in range(8):
        print('   part %d: %s' % (r, ' '.join('%5d' % v for v in struct.unpack_from('<5H', d, o + 10 * r))))
    o += 80
    print('  0x%03x preamble %d bytes: %s' % (o, hdr8, d[o:o + hdr8].hex(' '))); o += hdr8
    for t in range(2 if hdr12 == 0 else 1):
        print('  0x%03x TABLE %d' % (o, t))
        for r in range(8):
            print('     row %d  %s' % (r, ' '.join('%3d' % b for b in d[o + 10 * r: o + 10 * r + 10])))
        o += 80
    print('  rest from 0x%03x: %s' % (o, d[o:].hex(' ')))

for (nm, th), raw in A.items():
    if nm.endswith('dttune'):
        walk(raw, nm)
