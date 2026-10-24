import sys, zlib, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
B = chr(92)
names = []
for base in ('em081_00', 'em081_04'):
    for s in ('00', '01', '01_02', '02', '11', '14', '15', '50'):
        names.append('shell' + B + 'em' + B + '%s_shell%s' % (base, s) + B + '%s_%s' % (base, s))
h = {(~zlib.crc32(n.encode()) & 0xffffffff): n for n in names}
h.update({(zlib.crc32(n.encode()) & 0xffffffff): n + ' (plain crc)' for n in names})
for res in range(0x8a99, 0x8aa5):
    a = 0x159daa0 + res * 8
    w0, w1 = armdis.u32(a), armdis.u32(a + 4)
    print(hex(res), hex(w0 or 0), hex(w1 or 0), h.get(w0, '?'))
