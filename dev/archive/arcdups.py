import sys, zlib, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import arclist
SEP = chr(92)
def fup(raw):
    ver_, ni, nf, nv = struct.unpack_from('<4I', raw, 4)
    p = 20
    ints = list(struct.unpack_from('<%di' % ni, raw, p)); p += 4 * ni
    fl = list(struct.unpack_from('<%df' % nf, raw, p)); p += 4 * nf
    vecs = [list(struct.unpack_from('<3f', raw, p + 12 * i)) for i in range(nv)]
    return ints, fl, vecs
for arc in sys.argv[1:]:
    d = open(arc, 'rb').read()
    ver, rows = arclist.entries(arc)
    seen = {}
    for nm, th, comp, dec, off in rows:
        seen.setdefault(nm, []).append(th)
    for nm, th, comp, dec, off in rows:
        if len(seen[nm]) > 1 and 'shell' in nm.lower():
            raw = d[off:off + comp]
            try: raw = zlib.decompress(raw)
            except Exception: pass
            extra = ('FUP ints %s floats %s vecs %s' % fup(raw)) if th == '496f8f22' else ''
            print(arc.split(SEP)[-1], th, nm, len(raw), extra)
