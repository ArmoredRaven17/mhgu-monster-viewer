import sys, struct, capstone
TEXT = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
RODATA = open(r'C:\MHGU-ROM\exefs\main.rodata', 'rb').read()
DATA = open(r'C:\MHGU-ROM\exefs\main.data', 'rb').read()
RO_VA, DA_VA = 0x13EF000, 0x1728000
def u32(va):
    for base, buf in ((0, TEXT), (RO_VA, RODATA), (DA_VA, DATA)):
        if base <= va < base + len(buf) - 3: return struct.unpack_from('<I', buf, va - base)[0]
    return None
def f32(va):
    v = u32(va); return None if v is None else struct.unpack('<f', struct.pack('<I', v))[0]
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
def dis(a0, n):
    out = []
    pend = {}
    for k in range(n):
        a = a0 + 4 * k
        w = TEXT[a:a + 4]
        ins = list(md.disasm(w, a))
        if not ins:
            out.append('%08x  .word   0x%08x' % (a, struct.unpack('<I', w)[0])); continue
        i = ins[0]; note = ''
        s = i.op_str
        if i.mnemonic.startswith('ldr') and '[pc, #' in s:
            try:
                imm = int(s.split('#')[1].rstrip(']'), 16 if '0x' in s.split('#')[1] else 10)
                lit = a + 8 + imm; v = u32(lit)
                rd = s.split(',')[0]
                if '[pc, #' in s and s.count('[') == 1:
                    pend[rd] = v
                    fv = f32(lit)
                    note = '; =0x%x (%g)' % (v, fv)
            except Exception: pass
        elif i.mnemonic == 'ldr' and '[pc, r' in s:
            r = s.split('r')[-1].rstrip(']'); rr = 'r' + r
            if rr in pend:
                ga = a + 8 + pend[rr]; note = '; [0x%x] = 0x%x' % (ga, u32(ga) or 0)
        elif i.mnemonic == 'add' and ', pc, r' in s:
            rr = s.split(', ')[-1]
            if rr in pend: note = '; = 0x%x' % ((a + 8 + pend[rr]) & 0xffffffff)
        out.append('%08x  %-7s %s %s' % (a, i.mnemonic, s, note))
    return out
if __name__ == '__main__':
    for l in dis(int(sys.argv[1], 16), int(sys.argv[2])): print(l)
