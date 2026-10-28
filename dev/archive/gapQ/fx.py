# gapQ helpers: function start (the push before), callers (bl / b to an address, whole main.text, numpy scan), vtable refs
import sys, struct
sys.path.insert(0, 'C:/MHGU-Extract/efx')
import armdis, numpy as np
T = armdis.TEXT
W = np.frombuffer(T[:len(T) & ~3], dtype='<u4')

def fstart(a):
    """the nearest `push {.., lr}` at or before a (stmdb sp! with lr)"""
    i = a >> 2
    while i > 0:
        w = int(W[i])
        if (w & 0xffff4000) == 0xe92d4000: return i << 2
        i -= 1

def callers(t, lo=0, hi=None):
    """every bl / b (any cond) whose target is t"""
    hi = hi or len(T)
    idx = np.arange(lo >> 2, hi >> 2)
    w = W[lo >> 2:hi >> 2]
    isb = (w & 0x0e000000) == 0x0a000000
    off = (w & 0x00ffffff).astype(np.int64)
    off = np.where(off & 0x800000, off - 0x1000000, off)
    tgt = idx * 4 + 8 + off * 4
    return [int(i) * 4 for i in idx[isb & (tgt == t)]]

def words(v):
    """every aligned word equal to v in text / rodata / data (vtable slots, pointers)"""
    out = []
    for base, blob in ((0, armdis.TEXT), (armdis.RO_VA, armdis.RODATA), (armdis.DA_VA, armdis.DATA)):
        a = np.frombuffer(blob[:len(blob) & ~3], dtype='<u4')
        out += [base + int(i) * 4 for i in np.nonzero(a == v)[0]]
    return out

def dis(lo, hi):
    return ['%08x  %-8s %s' % x for x in armdis.sweep(lo, hi)]

if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'start':
        for x in sys.argv[2:]: print(x, hex(fstart(int(x, 16))))
    elif cmd == 'callers':
        for x in sys.argv[2:]:
            t = int(x, 16); print(x, [hex(c) + '(in %#x)' % fstart(c) for c in callers(t)])
    elif cmd == 'words':
        for x in sys.argv[2:]: print(x, [hex(c) for c in words(int(x, 16))])
    elif cmd == 'dis':
        print('\n'.join(dis(int(sys.argv[2], 16), int(sys.argv[3], 16))))
