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
