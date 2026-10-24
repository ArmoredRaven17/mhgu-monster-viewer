# python -I dis.py <va> <count>  -- ARM32 disassembly of main.text with literal-pool words resolved
import sys, os, struct
from capstone import Cs, CS_ARCH_ARM, CS_MODE_ARM
EX = r'C:\MHGU-ROM\exefs'
TEXT = open(os.path.join(EX, 'main.text'), 'rb').read()
RODATA = open(os.path.join(EX, 'main.rodata'), 'rb').read()
DATA = open(os.path.join(EX, 'main.data'), 'rb').read()
RO_VA, DA_VA = 0x13EF000, 0x1728000
def w(va):
    if va >= DA_VA: return struct.unpack_from('<I', DATA, va - DA_VA)[0]
    if va >= RO_VA: return struct.unpack_from('<I', RODATA, va - RO_VA)[0]
    return struct.unpack_from('<I', TEXT, va)[0]
def cstr(va):
    b = RODATA if va >= RO_VA and va < DA_VA else None
    if b is None: return None
    o = va - RO_VA; e = b.find(b'\0', o)
    s = b[o:e]
    return s.decode('latin1') if 0 < len(s) < 60 and all(32 <= c < 127 for c in s) else None
md = Cs(CS_ARCH_ARM, CS_MODE_ARM)
va = int(sys.argv[1], 0); n = int(sys.argv[2], 0)
for i in md.disasm(TEXT[va:va + 4 * n], va):
    note = ''
    if i.mnemonic.startswith('ldr') and '[pc, #' in i.op_str:
        try:
            off = int(i.op_str.split('[pc, #')[1].split(']')[0], 0)
            lit = i.address + 8 + off
            v = w(lit)
            f = struct.unpack('<f', struct.pack('<I', v))[0]
            s = cstr(v)
            note = '  ; =%#x (%g)%s' % (v, f, (' "' + s + '"') if s else '')
        except Exception: pass
    if i.mnemonic.startswith('vldr') and '[pc, #' in i.op_str:
        try:
            off = int(i.op_str.split('[pc, #')[1].split(']')[0], 0)
            lit = ((i.address + 8) & ~3) + off
            note = '  ; =%g' % struct.unpack('<f', struct.pack('<I', w(lit)))[0]
        except Exception: pass
    print('%08x  %-8s %s%s' % (i.address, i.mnemonic, i.op_str, note))
