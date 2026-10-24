"""Derive the code extents of the classes around a boundary from their vtables and the transitive bl/b closure.
   python -I bands.py  (prints per family: vtables, slot targets in the window, closure min/max, overlaps)"""
import sys, struct, json, re
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis, capstone
T = armdis.TEXT; DA, DV = armdis.DATA, armdis.DA_VA
RO, RV = armdis.RODATA, armdis.RO_VA
names = json.load(open(r'C:\MHGU-Extract\efx\dti-names.json'))
byname = {v: int(k, 16) for k, v in names.items()}
FAM = {'050': [n for n in byname if re.match(r'u(Shell)?Em050_', n)],
       '055': [n for n in byname if re.match(r'u(Shell)?Em055_', n)]}
# getDTI thunks: ldr r0,[pc,#imm] / ldr r0,[pc,r0] / bx lr  -> DTI
thunk_of = {}
for a in range(0, len(T) - 12, 4):
    w0, w1, w2 = struct.unpack_from('<III', T, a)
    if (w0 & 0xFFFFF000) != 0xE59F0000 or w1 != 0xE79F0000 or w2 != 0xE12FFF1E: continue
    lit = armdis.u32(a + 8 + (w0 & 0xFFF))
    if lit is None: continue
    dti = armdis.u32((a + 4 + 8 + lit) & 0xffffffff)
    if dti: thunk_of.setdefault(dti, []).append(a)
# .data words -> slots
words = {}
for i in range(0, len(DA) - 4, 4):
    w = struct.unpack_from('<I', DA, i)[0]
    words.setdefault(w, []).append(DV + i)
def is_code(w): return 0x1000 <= w < len(T) and w % 4 == 0
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
md.detail = True
from capstone import arm_const as AC
def callees(f, lim=0x6000):
    out = set(); maxt = f
    for ins in md.disasm(T[f:f + lim], f):
        m, o = ins.mnemonic, ins.op_str
        tgt = None
        if m.startswith('b') and '#0x' in o and m not in ('bic', 'bics'):
            tgt = int(o.split('#')[-1], 16)
            out.add(tgt)
            if f <= tgt < f + lim and tgt > maxt and m not in ('bl', 'blx'): maxt = tgt
        al = ins.cc in (AC.ARM_CC_AL, AC.ARM_CC_INVALID)
        ret = (m.startswith('pop') and 'pc' in o) or (m == 'bx' and o == 'lr') or (m.startswith('ldm') and 'pc' in o)
        tail = m == 'b' and tgt is not None and not (f <= tgt <= ins.address + 4 + 0x2000 and tgt > ins.address)
        if al and (ret or tail) and ins.address >= maxt: break
    return out
LO, HI = 0xec0000, 0xee4000
res = {}
for fam, ns in FAM.items():
    fns = {}
    for n in sorted(ns):
        dti = byname[n]
        for th in thunk_of.get(dti, []):
            for slot in words.get(th, []):
                vt = slot - 0x14
                # walk the vtable up to 0x4a0 or until a non-code word
                for o in range(0, 0x4a0, 4):
                    w = struct.unpack_from('<I', DA, vt + o - DV)[0]
                    if not is_code(w): break
                    if LO <= w < HI: fns.setdefault(w, set()).add('%s vt%#x+%#x' % (n, vt, o))
    # closure inside the window
    todo = list(fns); seen = set(fns)
    while todo:
        f = todo.pop()
        for c in callees(f):
            if LO <= c < HI and c not in seen:
                seen.add(c); fns.setdefault(c, set()).add('call'); todo.append(c)
    res[fam] = fns
    ks = sorted(fns)
    print(fam, 'classes', sorted(ns))
    print('  functions in window', len(ks), 'min %#x max %#x' % (ks[0], ks[-1]) if ks else '')
for fam in res:
    for a in sorted(res[fam]):
        if 0xed0000 <= a <= 0xed1000: print(fam, hex(a), sorted(res[fam][a])[:3])
a50 = max(res['050']); a55 = min(res['055'])
print('050 max %#x, 055 min %#x' % (a50, a55))
inter = [a for a in res['050'] if a >= a55] + [a for a in res['055'] if a <= a50]
print('interleaved', [hex(x) for x in sorted(inter)][:20])
