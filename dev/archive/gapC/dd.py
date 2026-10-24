import sys
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis as A, struct, capstone
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
lo = int(sys.argv[1], 16); hi = int(sys.argv[2], 16)
pend = {}
for a in range(lo, hi, 4):
    w = A.TEXT[a:a+4]
    ins = next(md.disasm(w, a), None)
    if not ins:
        v = struct.unpack('<I', w)[0]; f = struct.unpack('<f', w)[0]
        print('%08x  .word    %#010x  (%g)' % (a, v, f)); continue
    m, o = ins.mnemonic, ins.op_str; note = ''
    if m in ('ldr', 'vldr') and '[pc, #' in o:
        try: off = int(o.split('[pc, #')[-1].rstrip(']'), 0)
        except ValueError: off = None
        if off is not None:
            raw = A.rd(a + 8 + off)
            if len(raw) == 4:
                v = struct.unpack('<I', raw)[0]; f = struct.unpack('<f', raw)[0]
                pend[o.split(',')[0].strip()] = v
                note = '   ; lit 0x%x (%g)' % (v, f)
    elif m == 'add' and ', pc, ' in o:
        parts = [x.strip() for x in o.split(',')]
        src = parts[-1]
        if src in pend:
            note = '   ; -> 0x%x' % ((a + 8 + pend[src]) & 0xffffffff)
    print('%08x  %-8s %-40s%s' % (a, m, o, note))
