"""Containing function (nearest preceding push {.., lr}) of each address, and its callers (B/BL), up the chain.
python fn.py addr ..."""
import sys, re, subprocess, os
H = os.path.dirname(os.path.abspath(__file__))
L = [l.rstrip() for l in open(os.path.join(H, 'cls.txt'))]
ins = []
for l in L:
    try: ins.append((int(l[:8], 16), l[10:18].strip(), l[19:].strip()))
    except ValueError: pass
idx = {a: i for i, (a, m, o) in enumerate(ins)}
sys.path.insert(0, H)
import numpy as np
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
T = np.frombuffer(armdis.TEXT[:len(armdis.TEXT) & ~3], dtype='<u4')
A = np.arange(len(T), dtype=np.int64) * 4
isb = ((T & 0x0e000000) == 0x0a000000) & ((T >> 28) != 0xf)
off = (T & 0xffffff).astype(np.int64); off = np.where(off & 0x800000, off - 0x1000000, off)
dst = A + 8 + off * 4
def callers(t): return [(int(A[i]), 'L' if T[i] & 0x01000000 else 'B') for i in np.nonzero(isb & (dst == t))[0]]
def start(a):
    i = idx[a]
    while i > 0:
        _, m, o = ins[i]
        if m.startswith('push') and 'lr' in o: return ins[i][0]
        i -= 1
def chain(a, depth=0, seen=None):
    seen = seen if seen is not None else set()
    s = start(a)
    print('  ' * depth + '%#x in fn %s' % (a, hex(s) if s else '?'))
    if s is None or s in seen or depth > 5: return
    seen.add(s)
    for c, k in callers(s):
        if c in idx: chain(c, depth + 1, seen)
        else: print('  ' * (depth + 1) + '%#x%s (outside band)' % (c, k))
if __name__ == '__main__':
    for x in sys.argv[1:]: chain(int(x, 16))
