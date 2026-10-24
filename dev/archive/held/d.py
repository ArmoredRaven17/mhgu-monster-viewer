import sys, os, struct, capstone
EX = r'C:\MHGU-ROM\exefs'
TEXT = open(os.path.join(EX, 'main.text'), 'rb').read()
RODATA = open(os.path.join(EX, 'main.rodata'), 'rb').read()
DATA = open(os.path.join(EX, 'main.data'), 'rb').read()
RO_VA, DA_VA = 0x13EF000, 0x1728000
def rd(va, n=4):
    if 0 <= va < len(TEXT): return TEXT[va:va + n]
    if RO_VA <= va < RO_VA + len(RODATA): return RODATA[va - RO_VA:va - RO_VA + n]
    if DA_VA <= va < DA_VA + len(DATA): return DATA[va - DA_VA:va - DA_VA + n]
    return b''
def u32(va):
    b = rd(va); return struct.unpack('<I', b)[0] if len(b) == 4 else None
def f32(va):
    b = rd(va); return struct.unpack('<f', b)[0] if len(b) == 4 else None
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
md.detail = False
def dis(lo, hi):
    va = lo
    while va < hi:
        w = rd(va)
        ins = list(md.disasm(w, va))
        if not ins:
            print('%08x: .word %08x  (f %g)' % (va, u32(va), f32(va))); va += 4; continue
        i = ins[0]
        note = ''
        if i.mnemonic.startswith('ldr') and '[pc, #' in i.op_str:
            try:
                imm = int(i.op_str.split('#')[1].rstrip(']'), 0)
                a = va + 8 + imm; v = u32(a)
                note = '  ; [%x]=%08x (f %g)' % (a, v, f32(a))
            except Exception: pass
        if i.mnemonic.startswith('vldr') and 'pc' in i.op_str:
            try:
                imm = int(i.op_str.split('#')[1].rstrip(']'), 0)
                a = va + 8 + imm
                note = '  ; [%x] f %g' % (a, f32(a))
            except Exception: pass
        print('%08x: %08x  %-8s %s%s' % (va, u32(va), i.mnemonic, i.op_str, note))
        va += 4
if __name__ == '__main__':
    for a in sys.argv[1:]:
        lo, hi = a.split(':')
        dis(int(lo, 16), int(hi, 16)); print('----')
