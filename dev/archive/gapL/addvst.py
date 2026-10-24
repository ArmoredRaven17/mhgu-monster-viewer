# addvst.py <off> lo hi: add rX, rN, #k (k <= off) then, within 10 words, a vstr/str [rX, #(off - k)] or a post/pre-indexed store landing on off
import sys, struct
T = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read(); n = len(T) // 4; W = struct.unpack('<%dI' % n, T[:4 * n])
off = int(sys.argv[1], 0); lo = int(sys.argv[2], 0); hi = int(sys.argv[3], 0)
def rot(w):
    r = 2 * ((w >> 8) & 0xf); v = w & 0xff
    return ((v >> r) | (v << (32 - r))) & 0xffffffff if r else v
for i in range(lo // 4, hi // 4):
    w = W[i]
    if w >> 28 == 0xf or (w & 0x0fe00000) != 0x02800000: continue
    k = rot(w & 0xfff); rd = (w >> 12) & 0xf
    if k > off or off - k > 0x3fc: continue
    rest = off - k
    for j in range(1, 11):
        w2 = W[i + j]
        if ((w2 >> 16) & 0xf) != rd: continue
        if (w2 & 0x0f300e00) == 0x0d000a00 and (w2 >> 23) & 1 and (w2 & 0xff) * 4 == rest: print('%#x add #%#x -> vstr +%#x at %#x' % (4 * i, k, rest, 4 * (i + j))); break
        if (w2 & 0x0e100000) == 0x04000000 and (w2 >> 23) & 1 and (w2 & 0xfff) == rest and rest: print('%#x add #%#x -> str +%#x at %#x' % (4 * i, k, rest, 4 * (i + j))); break
        if rest == 0 and ((w2 & 0x0f300e00) == 0x0d000a00 and (w2 & 0xff) == 0 or (w2 & 0x0e100fff) == 0x04000000): print('%#x add #%#x -> store [rX] at %#x' % (4 * i, k, 4 * (i + j))); break
