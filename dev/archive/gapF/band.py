# band.py -- derive uEm024_00's code band by recursive descent from its own vtables and its shells' (gapF)
import sys, json, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx'); sys.path.insert(0, '.')
import armdis, rdesc
SC = json.load(open(r'C:\MHGU-Extract\efx\agents\shells-scratch\shellclasses.json'))
LO, HI = 0xcec000, 0x1130000
VLEN = {}
def roots_of(names):
    r = {}
    for nm in names:
        for v in SC[nm]['vtables']:
            n = 0
            while not (armdis.u32(v + n) == 0 and armdis.u32(v + n + 4) == 0): n += 4   # the vtable ends at the next one's (0, 0) header
            VLEN[nm] = n
            for i, w in enumerate(rdesc.vt_words(v, n)):
                if w and LO <= w < HI and (w & 3) == 0: r.setdefault(w, []).append('%s+%#x' % (nm, i * 4))
    return r
K = ['uEm024_00'] + ['uShellEm024_sp_%s' % s for s in ('00', '01', '02', '33', '34', '38')]
R = roots_of(K)
R.setdefault(0xdeee40, []).append('ctor (called from the shared factory 0x4c914)')
for w in (0xdfd46c, 0xdfda7c, 0xdfdd08, 0xdfdf20, 0xdfe3d4, 0xdfe8bc, 0xdfedec): R.setdefault(w, []).append('init_array 0x18435a0..0x18435b8')
seen, ent, ext, unres, tables, fptr = rdesc.walk(list(R), LO, HI)
code = sorted(a for a, (m, o) in seen.items() if m != '.jt')
print('vtable lengths', {k: hex(v) for k, v in VLEN.items()}); print('roots', len(R), 'insns', len(code), 'range %#x..%#x' % (code[0], code[-1] + 4))
print('fptr', sorted((hex(a), hex(t), rdesc.dis(t)[0]) for a, t in fptr))
print('entries', len(ent), 'ext targets', len(ext), 'tables', len(tables), 'unresolved', len(unres))
for u in unres: print('  UNRES %#x %s %s (%s)' % u)
# data words pointing into the derived range that are not roots / entries
lo, hi = code[0], code[-1] + 4
dw = []
for seg, va in ((armdis.DATA, armdis.DA_VA), (armdis.RODATA, armdis.RO_VA)):
    for o in range(0, len(seg) - 3, 4):
        w = struct.unpack_from('<I', seg, o)[0]
        if lo - 0x2000 <= w < hi + 0x2000 and (w & 3) == 0: dw.append((va + o, w))
print('data words into range +-0x2000:', len(dw))
for p, w in dw:
    tag = 'root' if w in R else ('entry' if w in ent else ('reached' if w in seen else 'NOT REACHED'))
    if tag != 'root': print('  [%#x] = %#x %s' % (p, w, tag))
json.dump({'code': code, 'entries': sorted(ent), 'ext': {(hex(k) if isinstance(k, int) else k): sorted(v) for k, v in ext.items()}, 'tables': tables,
           'roots': {hex(k): v for k, v in R.items()}}, open('band024.json', 'w'))
