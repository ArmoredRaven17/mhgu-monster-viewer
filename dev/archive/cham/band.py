import sys
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis, capstone, struct
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
lo, hi = int(sys.argv[1],16), int(sys.argv[2],16)
pend = {}
for a in range(lo, hi, 4):
    ins = next(md.disasm(armdis.TEXT[a:a+4], a), None)
    if not ins:
        print('%08x  .word %#010x' % (a, struct.unpack('<I', armdis.TEXT[a:a+4])[0])); continue
    m, o = ins.mnemonic, ins.op_str; note = ''
    if m == 'ldr' and '[pc, #' in o:
        reg = o.split(',')[0].strip()
        try:
            off = int(o.split('[pc, #')[-1].rstrip(']'), 0)
            lit = armdis.u32(a + 8 + off); pend[reg] = lit; note = '   ; lit 0x%x' % lit
        except Exception: pass
    elif m == 'add' and ', pc, ' in o:
        parts = [x.strip() for x in o.split(',')]
        src = parts[-1]
        if src in pend:
            addr = (a + 8 + pend[src]) & 0xffffffff
            s = armdis.cstr(addr); note = '   ; -> 0x%x%s' % (addr, ('  "%s"' % s) if s else '')
    elif m.startswith('b') and '#0x' in o:
        try:
            t = int(o.split('#')[-1], 16)
            if t in armdis.KNOWN: note = '   ; ' + armdis.KNOWN[t]
        except ValueError: pass
    print('%08x  %-8s %-40s%s' % (a, m, o, note))
