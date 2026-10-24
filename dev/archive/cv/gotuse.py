# gotuse.py GOT [off] -- every PIC load of the GOT slot (ldr rX,[pc,#k] ... ldr rX,[pc,rX]) in main.text, then every store / load
# naming #off in the next 24 instructions (the pointer followed loosely: report, then read by hand)
import sys, re, struct, numpy as np, d
sys.path.insert(0, r'C:\MHGU-Extract\efx'); import armdis
GOT = int(sys.argv[1], 16); OFF = sys.argv[2] if len(sys.argv) > 2 else None
W = np.frombuffer(armdis.TEXT[:len(armdis.TEXT)//4*4], dtype='<u4')
idx = np.nonzero((W & 0xffff0ff0) == 0xe79f0000)[0]
hits = []
for i in idx:
    w = int(W[i]); rt = (w >> 12) & 0xf; rm = w & 0xf
    if rt != rm: continue
    b = int(i) * 4
    for j in range(1, 8):
        w2 = int(W[i - j])
        if (w2 & 0xffff0000) == 0xe59f0000 and ((w2 >> 12) & 0xf) == rt:
            lit = armdis.u32(b - 4 * j + 8 + (w2 & 0xfff))
            if lit is not None and ((b + 8 + lit) & 0xffffffff) == GOT: hits.append(b)
            break
print('loads of GOT %#x: %d' % (GOT, len(hits)))
if OFF:
    for b in hits:
        L = d.lines(b, b + 4 * 24)
        for a, s in L:
            if re.search(r'#%s\]' % OFF, s): print('  %#x (load %#x): %s' % (a, b, s))
