"""Branch xrefs: every B / BL (any condition) in main.text to the given targets. python xref.py t1 t2 ..."""
import sys, numpy as np
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
T = np.frombuffer(armdis.TEXT[:len(armdis.TEXT) & ~3], dtype='<u4')
A = np.arange(len(T), dtype=np.int64) * 4
isb = ((T & 0x0e000000) == 0x0a000000) & ((T >> 28) != 0xf)
off = (T & 0xffffff).astype(np.int64)
off = np.where(off & 0x800000, off - 0x1000000, off)
dst = A + 8 + off * 4
for t in sys.argv[1:]:
    t = int(t, 16)
    idx = np.nonzero(isb & (dst == t))[0]
    print('%#x: %d' % (t, len(idx)), ' '.join('%#x%s' % (A[i], 'L' if T[i] & 0x01000000 else 'B') for i in idx))
