import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx'); import armdis as A
u32 = lambda a: struct.unpack('<I', A.rd(a))[0]
fl = lambda a: struct.unpack('<f', A.rd(a))[0]
a = 0x17f6420
while True:
    st, nm = A.rd(a, 1)[0], A.rd(a + 1, 1)[0]
    if st == 0xff: print('end at', hex(a)); break
    p = u32(a + 4)
    print('(%d,0x%02x) recs @%#x  raw %s' % (st, nm, p, A.rd(a, 8).hex()))
    r = p
    while True:
        mot, typ = u32(r), struct.unpack('<i', A.rd(r + 4))[0]
        if typ == -1: break
        print('   mot %#x (list %d M%d) type %d f %g sel %d arg %d flags %#x' % (mot, mot >> 8, mot & 0xff, typ, fl(r + 8), u32(r + 0xc), u32(r + 0x10), u32(r + 0x14)))
        r += 0x18
    a += 8
