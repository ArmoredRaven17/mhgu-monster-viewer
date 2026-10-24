# band025.py -- derive uEm025_00's code band by recursive descent (copy of gapF/band.py for Chameleos; cv = cloak verify 2026-10-22)
import sys, json, struct
G = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\gapF'
sys.path.insert(0, r'C:\MHGU-Extract\efx'); sys.path.insert(0, G)
import armdis, rdesc
SC = json.load(open(r'C:\MHGU-Extract\efx\agents\shells-scratch\shellclasses.json'))
LO, HI = 0xcec000, 0x1130000
def roots_of(names):
    r = {}
    for nm in names:
        for v in SC[nm]['vtables']:
            n = 0
            while not (armdis.u32(v + n) == 0 and armdis.u32(v + n + 4) == 0): n += 4
            for i, w in enumerate(rdesc.vt_words(v, n)):
                if w and LO <= w < HI and (w & 3) == 0: r.setdefault(w, []).append('%s+%#x' % (nm, i * 4))
    return r
K = ['uEm025_00'] + ['uShellEm025_sp_%s' % s for s in ('00', '01', '13', '39')]
R = roots_of(K)
R.setdefault(0xdfeec4, []).append('ctor')
seen, ent, ext, unres, tables, fptr = rdesc.walk(list(R), LO, HI)
code = sorted(a for a, (m, o) in seen.items() if m != '.jt')
print('roots', len(R), 'insns', len(code), 'range %#x..%#x' % (code[0], code[-1] + 4))
print('unresolved', len(unres))
for u in unres[:20]: print('  UNRES', u)
# outliers: code outside a contiguous run
srt = code; gaps = [(srt[i], srt[i+1]) for i in range(len(srt)-1) if srt[i+1]-srt[i] > 0x400]
print('big gaps', [(hex(a), hex(b)) for a, b in gaps][:20])
lo, hi = code[0], code[-1] + 4
dw = []
for seg, va in ((armdis.DATA, armdis.DA_VA), (armdis.RODATA, armdis.RO_VA)):
    for o in range(0, len(seg) - 3, 4):
        w = struct.unpack_from('<I', seg, o)[0]
        if lo - 0x2000 <= w < hi + 0x2000 and (w & 3) == 0 and w not in seen and w not in R: dw.append((va + o, w))
print('data words into range +-0x2000 not reached:', len(dw), [(hex(p), hex(w)) for p, w in dw[:30]])
json.dump({'code': code}, open('band025.json', 'w'))
