# fstart.py <addr>..: the function start (the nearest push {.., lr} at or before) and every bl / b / word pointing at it
import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
T = armdis.TEXT; n = len(T)//4
W = struct.unpack('<%dI' % n, T[:4*n])
for s in sys.argv[1:]:
    a = int(s, 16)//4
    while a > 0 and not ((W[a] & 0x0fff4000) == 0x092d4000): a -= 1
    st = 4*a
    calls = []
    for i in range(n):
        w = W[i]
        if (w & 0x0e000000) == 0x0a000000 and (w >> 28) != 0xf:
            off = w & 0xffffff
            if off & 0x800000: off -= 0x1000000
            if 4*i + 8 + 4*off == st: calls.append('%#x' % (4*i))
    data = []
    D = armdis.__dict__.get('DATA')
    print(s, 'start %#x' % st, 'calls', ' '.join(calls[:20]))
