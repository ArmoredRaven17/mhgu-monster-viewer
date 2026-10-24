# callsto.py tgt[,tgt..] [lo hi] -- every bl / b (any cond) to the targets in main.text (raw word scan), with r1 / r2 immediates set in the 12 before
import sys, re, numpy as np, d
sys.path.insert(0, r'C:\MHGU-Extract\efx'); import armdis
W = np.frombuffer(armdis.TEXT[:len(armdis.TEXT)//4*4], dtype='<u4')
tg = [int(x, 16) for x in sys.argv[1].split(',')]
lo = int(sys.argv[2], 16) if len(sys.argv) > 2 else 0; hi = int(sys.argv[3], 16) if len(sys.argv) > 3 else len(armdis.TEXT)
isb = ((W >> 25) & 7) == 5
off = (W & 0xffffff).astype(np.int64); off = np.where(off & 0x800000, off - 0x1000000, off)
pc = np.arange(len(W), dtype=np.int64) * 4
t = pc + 8 + off * 4
for T in tg:
    idx = np.nonzero(isb & (t == T) & (pc >= lo) & (pc < hi))[0]
    print('to %#x: %d' % (T, len(idx)))
    for i in idx:
        a = int(i) * 4
        r = {}
        L = d.lines(a - 48, a)
        for b, s in reversed(L):
            mm = re.match(r'(?:mov|movw)(?:eq|ne|hs|lo|hi|ls|ge|lt|gt|le)? (r1|r2), #(0x[0-9a-f]+|\d+)$', s)
            if mm and mm.group(1) not in r: r[mm.group(1)] = int(mm.group(2), 0)
        yield_ = (a, r)
        print('  %#x r1=%s r2=%s' % (a, hex(r['r1']) if 'r1' in r else '?', hex(r['r2']) if 'r2' in r else '?'))
