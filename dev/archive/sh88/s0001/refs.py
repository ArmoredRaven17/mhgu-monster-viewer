# refs.py ADDR: every B/BL (any cond) to ADDR in TEXT, and every data word == ADDR in DATA / RODATA (vtable slots)
import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
T = armdis.TEXT; t = int(sys.argv[1], 16)
for a in range(0, len(T) - 4, 4):
    w = struct.unpack_from('<I', T, a)[0]
    if (w & 0x0e000000) == 0x0a000000 and (w >> 28) != 0xf:
        off = w & 0xffffff
        if off & 0x800000: off -= 0x1000000
        if a + 8 + off * 4 == t: print('  %s %#x' % ('bl' if w & 0x01000000 else 'b ', a))
for name, buf, va in (('DATA', armdis.DATA, armdis.DA_VA), ('RODATA', armdis.RODATA, armdis.RO_VA)):
    for a in range(0, len(buf) - 4, 4):
        if struct.unpack_from('<I', buf, a)[0] == t: print('  word in %s at %#x' % (name, va + a))
