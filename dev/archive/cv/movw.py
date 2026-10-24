# movw.py imm[,imm..] -- every movw rX, #imm in main.text (raw word scan, any condition); prints address and the next 6 instructions
import sys, numpy as np, d
sys.path.insert(0, r'C:\MHGU-Extract\efx'); import armdis
W = np.frombuffer(armdis.TEXT[:len(armdis.TEXT)//4*4], dtype='<u4')
imms = [int(x, 16) for x in sys.argv[1].split(',')]
ctx = int(sys.argv[2]) if len(sys.argv) > 2 else 6
mw = ((W >> 20) & 0xff) == 0x30
imm = ((W >> 4) & 0xf000) | (W & 0xfff)
for v in imms:
    idx = np.nonzero(mw & (imm == v))[0]
    print('movw #%#x: %d sites' % (v, len(idx)))
    for i in idx:
        a = int(i) * 4
        print('  %#x  %s' % (a, ' ; '.join(s for _, s in d.lines(a, a + 4 * ctx))))
