import sys, struct, re
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import shellef
mon = sys.argv[1]
FT = shellef.load_typed(r'C:\MHGU-Extract\scratch-em\%s\%s.arc' % (mon, mon))
def fupb(b):
    ver, ni, nf, nv = struct.unpack_from('<4I', b, 4); p = 20
    ints = list(struct.unpack_from('<%di' % ni, b, p)); p += 4 * ni
    fl = list(struct.unpack_from('<%df' % nf, b, p)); p += 4 * nf
    return {'ints': ints, 'floats': [round(x, 4) for x in fl], 'vecs': [[round(x, 4) for x in struct.unpack_from('<3f', b, p + 12 * i)] for i in range(nv)]}
for (nm, th), b in FT.items():
    short = nm.split(chr(92))[-1]
    if re.match(r'(em\d{3}_\d{2})_(\d{2}(?:_\d{2})?)$', short) and b[:4] == b'FUP\0' and 'shell' in nm: print(short, fupb(b))
