# mk012.py: Lao-Shan Lung's shells.js block (lao.js) from the event table 0x17a50f4, the EMC's op-0xa3 picks and his actiontune
import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
def u(a): return armdis.u32(a)
def fl(a): return struct.unpack('<f', struct.pack('<I', armdis.u32(a)))[0]
b = open(r'C:\MHGU-Extract\scratch-em\em012_00\enemy\action_tune\em012_00_actiontune.fup', 'rb').read()
ver, ni, nf, nv = struct.unpack_from('<4I', b, 4)
TF = list(struct.unpack_from('<%df' % nf, b, 20 + 4 * ni))
TV = [struct.unpack_from('<3f', b, 20 + 4 * ni + 4 * nf + 12 * i) for i in range(nv)]
# the EMC's op 0xa3 (0, idx) before each do-action (fb/emcidx.py on em012_00_cmdtbl.emc), the random pairs read by hand
PICK = {25: (7, 0), 26: (7, 0), 47: (7, 0), 48: (7, 0), 27: (7, 2), 28: (7, 2), 29: (7, 3), 30: (7, 3), 31: (7, 3), 32: (7, 3),
        33: (7, 3), 34: (7, 3), 35: (7, 3), 36: (7, 3), 37: (7, 4), 38: (7, 4), 43: (7, 5), 44: (7, 5), 45: (7, 5), 46: (7, 5),
        50: (1, 4), 51: (1, 4), 52: (1, 4), 53: (1, 4), 54: (1, 4), 55: (1, 4), 56: (1, 1), 57: (1, 1)}
T = 0x17a50f4
rows, usedV, usedF = [], set(), set()
for i in range(58):
    sp = []
    clip = None
    for side in (0, 1):
        p = u(T + 8 * i + 4 * side)
        if not p: continue
        while u(p):
            a, m, t = u(p), u(p + 4), u(p + 8)
            if a in (5, 6):
                assert t == 1, (i, a, t)
                c = ((m >> 8) & 0xf, m & 0xff)
                assert clip in (None, c); clip = c
                f0 = fl(p + 0xc)
                x, y, z = int(fl(p + 0x14)), int(fl(p + 0x18)), int(fl(p + 0x1c))
                if a == 5:
                    sp.append("{ frame: %.1f, s01: [%d, %d, %d] }" % (f0, x, y, z)); usedV.add(y); usedF.add(z)
                else:
                    sp.append("{ frame: %.1f, s13: [%d, %d, %d] }" % (f0, x, y, z)); usedV.update((x, y)); usedF.add(z)
            p += 0x24
    if not sp: continue
    if i not in PICK:
        rows.append("  // (entry %d: L%d M%d -- no EMC op 0xa3 and no class store names it: not listed)" % (i, clip[0], clip[1])); continue
    st, n = PICK[i]
    rows.append("  act012(%d, 0x%02x, '%d', 'Motion[%d]', %d, [%s])," % (st, n, clip[0], clip[1], i, ', '.join(sp)))
def F(x): return repr(float(struct.unpack('<f', struct.pack('<f', x))[0]))
vt = ', '.join('%d: [%s, %s, %s]' % ((k,) + tuple(F(c) for c in TV[k])) for k in sorted(usedV))
ft = ', '.join('%d: %s' % (k, F(TF[k])) for k in sorted(usedF))
src = open(sys.argv[1], encoding='utf8').read()
src = src.replace('/*TUNEV*/', vt).replace('/*TUNEF*/', ft).replace('/*ROWS*/', '\n'.join(rows))
open(sys.argv[2], 'w', encoding='utf8').write(src)
print(len(rows), 'rows;', len(usedV), 'vecs', sorted(usedF))
