# reqscan.py: every b / bl to an action requester (the functions calling the shared request core 0x76098, listed in
# reqfuncs.txt, plus Neset's 0x10ade4c and Ka's 0x10bc334 wrappers and 0x6d564) whose 8 preceding words set r1 = #1 and
# r2 = #n (n in argv, hex), over the whole main.text. Usage: reqscan.py 11 12 ...
import struct, sys, os
T = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
n = len(T) // 4; W = struct.unpack('<%dI' % n, T[:n * 4])
HERE = os.path.dirname(os.path.abspath(__file__))
REQ = set(int(x, 16) for x in open(os.path.join(HERE, 'reqfuncs.txt')).read().split()) | {0x6d564, 0x10ade4c, 0x10bc334}
want = [int(x, 16) for x in sys.argv[1:]]
for i, w in enumerate(W):
    if ((w >> 25) & 7) != 5 or (w >> 28) != 0xe: continue
    imm = w & 0xffffff
    if imm & 0x800000: imm -= 0x1000000
    tgt = i * 4 + 8 + imm * 4
    if tgt not in REQ: continue
    prev = W[max(0, i - 8):i]
    r1 = [p & 0xff for p in prev if (p & 0xfffff000) == 0xe3a01000]
    r2 = [p & 0xff for p in prev if (p & 0xfffff000) == 0xe3a02000]
    for v in want:
        if 1 in r1 and v in r2: print('%08x -> %x  (1, %#x)' % (i * 4, tgt, v))
