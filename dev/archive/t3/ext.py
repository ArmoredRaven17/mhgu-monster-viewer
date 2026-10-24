# ext.py: the extent of each function (to its last return before the next function's push) and the mnemonic set used
import sys, re
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis, capstone
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM); md.detail = False
FN = [0x7dc9a0, 0x806ce4, 0x7db964, 0x7ebfd8, 0x80017c, 0x80448c, 0x8060ac, 0x8069d8]
def extent(a):
    # walk all reachable instructions by following branches inside; stop at returns
    seen = set(); todo = [a]; insn = {}
    while todo:
        p = todo.pop()
        while p not in seen:
            seen.add(p)
            i = next(md.disasm(armdis.TEXT[p:p+4], p))
            insn[p] = i
            m, o = i.mnemonic, i.op_str
            if m.startswith('pop') and 'pc' in o:
                if m in ('pop',): break
                todo.append(p + 4); break
            if m == 'bx' and o == 'lr': break
            if re.match(r'^b(eq|ne|hs|lo|mi|pl|vs|vc|hi|ls|ge|lt|gt|le|cs|cc)?$', m) and o.startswith('#'):
                t = int(o[1:], 16)
                if m == 'b':
                    if t in FN or t < a or t > a + 0x4000: break   # a tail call
                    p = t; continue
                todo.append(t)
            if m == 'add' and o.startswith('pc,'): raise Exception('jump table at %#x' % p)
            p += 4
    return insn
allm = set()
for a in FN:
    I = extent(a)
    calls = sorted({int(i.op_str[1:], 16) for i in I.values() if i.mnemonic in ('bl', 'blx') and i.op_str.startswith('#')})
    tails = sorted({int(i.op_str[1:], 16) for i in I.values() if i.mnemonic == 'b' and i.op_str.startswith('#') and (int(i.op_str[1:], 16) in FN)})
    print('%#x: %d insns, %#x..%#x, calls %s tails %s' % (a, len(I), min(I), max(I), [hex(c) for c in calls], [hex(c) for c in tails]))
    allm |= {i.mnemonic for i in I.values()}
print(sorted(allm))
