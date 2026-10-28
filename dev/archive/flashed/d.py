"""d.py <lo> <hi> -- word-by-word ARM disassembly of main.text (skips data words), with pc-literal values.
Flashed-state read (2026-10-25). Usage: python -I d.py a3ef0 a4000"""
import sys, struct, capstone
TEXT = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
RO = open(r'C:\MHGU-ROM\exefs\main.rodata', 'rb').read(); RO_VA = 0x13EF000
DA = open(r'C:\MHGU-ROM\exefs\main.data', 'rb').read(); DA_VA = 0x1728000
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
def u32(va):
    if va + 4 <= len(TEXT): return struct.unpack_from('<I', TEXT, va)[0]
    if RO_VA <= va < RO_VA + len(RO): return struct.unpack_from('<I', RO, va - RO_VA)[0]
    if DA_VA <= va < DA_VA + len(DA): return struct.unpack_from('<I', DA, va - DA_VA)[0]
def dis(lo, hi):
    out = []
    for a in range(lo, hi, 4):
        ins = list(md.disasm(TEXT[a:a+4], a))
        if not ins: out.append((a, '.word', '0x%08x' % u32(a), '')); continue
        i = ins[0]; note = ''
        if i.mnemonic.startswith('ldr') and '[pc, #' in i.op_str:
            try:
                off = int(i.op_str.split('#')[1].rstrip(']!'), 0)
                lit = a + 8 + off; v = u32(lit)
                f = struct.unpack('<f', struct.pack('<I', v))[0] if v is not None else None
                note = '; =0x%08x (%g)' % (v, f) if v is not None else ''
            except Exception: pass
        out.append((a, i.mnemonic, i.op_str, note))
    return out
if __name__ == '__main__':
    lo = int(sys.argv[1], 16); hi = int(sys.argv[2], 16)
    for a, m, o, n in dis(lo, hi): print('%08x  %-8s %s %s' % (a, m, o, n))
