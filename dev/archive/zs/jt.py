import sys, re
sys.path.insert(0, r'C:\MHGU-Extract\efx'); import armdis as A
import fn
def cases(base, n, band):
    L, idx = fn.B[band]
    out = {}
    for k in range(n):
        t = base + A.u32(base + 4*k)
        # follow straight-line to the first b/bl and collect r1/r2 movs
        i = idx[t]; regs = {}; tgt = None
        for j in range(i, i+12):
            l = L[j]
            m = re.match(r'(\w{8})\s+(\w+)\s+(.*)', l)
            if not m: continue
            mn, op = m.group(2), m.group(3)
            mm = re.match(r'(r[12]), #(\S+)$', op)
            if mn == 'mov' and mm: regs[mm.group(1)] = mm.group(2)
            if mn in ('b', 'bl') :
                tgt = op; 
                if mn == 'b' : 
                    a2 = int(op[1:],16)
                    # follow if target is inside this table body (shared tails)
                    if base < a2 < base + 0x800 and a2 in idx: 
                        i2 = idx[a2]
                        for j2 in range(i2, i2+8):
                            m2 = re.match(r'(\w{8})\s+(\w+)\s+(.*)', L[j2])
                            mm2 = re.match(r'(r[12]), #(\S+)$', m2.group(3))
                            if m2.group(2)=='mov' and mm2: regs[mm2.group(1)] = mm2.group(2)
                            if m2.group(2) in ('b','bl'): tgt = m2.group(3); break
                break
        out[k] = (hex(t), tgt, regs)
    return out
if __name__ == '__main__':
    base = int(sys.argv[1],16); n = int(sys.argv[2]); band = sys.argv[3]
    for k, v in cases(base, n, band).items(): print(hex(k), v)
