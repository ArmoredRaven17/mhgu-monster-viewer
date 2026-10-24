import sys, struct, re
sys.path.insert(0, r'C:\MHGU-Extract\efx')
from armdis import u32, rd, cstr
import capstone
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
from armdis import TEXT
def f32(v): return struct.unpack('<f', struct.pack('<I', v))[0]
def dis(lo, hi):
    out = []; pend = {}
    for a in range(lo & ~3, hi, 4):
        ins = next(md.disasm(TEXT[a:a+4], a), None)
        if not ins:
            w = u32(a); out.append('%08x  .word    %#010x   ; f %g' % (a, w, f32(w))); continue
        m, o = ins.mnemonic, ins.op_str; note = ''
        mm = re.search(r'\[pc, #(-?0x[0-9a-f]+|-?\d+)\]', o)
        if mm and m in ('ldr',):
            lit = u32(a + 8 + int(mm.group(1), 0)); reg = o.split(',')[0]
            pend[reg] = lit; note = ' ; lit 0x%x' % lit
        elif mm and m.startswith('vldr'):
            lit = u32(a + 8 + int(mm.group(1), 0)); note = ' ; =%g (0x%x)' % (f32(lit), lit)
        elif m == 'add' and ', pc, ' in o:
            parts = [x.strip() for x in o.split(',')]
            if parts[-1] in pend:
                ad = (a + 8 + pend[parts[-1]]) & 0xffffffff; s = cstr(ad)
                note = ' ; -> 0x%x%s' % (ad, (' "%s"' % s) if s else '')
        elif m == 'ldr' and re.match(r'(\w+), \[pc, (\w+)\]', o):
            r = re.match(r'(\w+), \[pc, (\w+)\]', o).group(2)
            if r in pend:
                ad = (a + 8 + pend[r]) & 0xffffffff; v = u32(ad)
                note = ' ; GOT 0x%x -> 0x%x' % (ad, v if v is not None else 0)
        out.append('%08x  %-8s %-36s%s' % (a, m, o, note))
    return out
if __name__ == '__main__':
    print('\n'.join(dis(int(sys.argv[1], 16), int(sys.argv[2], 16))))
