# dl.py <lo> <hi> -- word-by-word disassembly of main.text with pc-relative literals (int / f32), GOT loads
# (ldr rX, [pc, rX] after a literal: the word at pc + lit) and pc-relative adds resolved. Read-only.
import sys, struct, re
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis, capstone
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
def f32(w): return struct.unpack('<f', struct.pack('<I', w))[0]
def lines(lo, hi):
    pend = {}
    out = []
    for a in range(lo & ~3, hi, 4):
        ins = next(md.disasm(armdis.TEXT[a:a + 4], a), None)
        if not ins:
            out.append((a, '.word', '%#010x' % armdis.u32(a), '')); continue
        m, o = ins.mnemonic, ins.op_str; note = ''
        mm = re.match(r'(\w+), \[pc, #(-?0x[0-9a-f]+|\d+)\]$', o)
        if m in ('ldr',) and mm:
            lit = armdis.u32(a + 8 + int(mm.group(2), 0))
            if lit is not None:
                pend[mm.group(1)] = lit; note = 'lit 0x%x' % lit
        elif m.startswith('vldr') and mm:
            lit = armdis.u32(a + 8 + int(mm.group(2), 0))
            if lit is not None: note = 'f %r (0x%x)' % (f32(lit), lit)
        else:
            mm2 = re.match(r'(\w+), \[pc, (\w+)\]$', o)
            if m == 'ldr' and mm2 and mm2.group(2) in pend:
                p = (a + 8 + pend[mm2.group(2)]) & 0xffffffff
                v = armdis.u32(p); note = 'GOT [0x%x] = %s' % (p, hex(v) if v is not None else '?')
                pend.pop(mm2.group(2), None)
            mm3 = re.match(r'(\w+), pc, (\w+)$', o)
            if m == 'add' and mm3 and mm3.group(2) in pend:
                p = (a + 8 + pend[mm3.group(2)]) & 0xffffffff; note = '-> 0x%x' % p
                pend.pop(mm3.group(2), None)
            mm4 = re.match(r'(\w+), pc, #(0x[0-9a-f]+|\d+)$', o)
            if m == 'add' and mm4: note = '-> 0x%x' % (a + 8 + int(mm4.group(2), 0))
        out.append((a, m, o, note))
    return out
if __name__ == '__main__':
    lo, hi = int(sys.argv[1], 16), int(sys.argv[2], 16)
    for a, m, o, n in lines(lo, hi):
        print('%08x  %-8s %-36s %s' % (a, m, o, ('; ' + n) if n else ''))
