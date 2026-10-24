# st3a8.py <off,off..> [lo hi]: every STORE (str/strb imm12, strh/strd imm8, and movw #off + reg-offset store within 6)
# to the given field offsets, whole main.text by default.
import sys, struct, os
EX = r'C:\MHGU-ROM\exefs'
T = open(os.path.join(EX, 'main.text'), 'rb').read()
offs = [int(x, 0) for x in sys.argv[1].split(',')]
lo = int(sys.argv[2], 0) if len(sys.argv) > 2 else 0; hi = int(sys.argv[3], 0) if len(sys.argv) > 3 else len(T)
n = len(T) // 4
W = struct.unpack('<%dI' % n, T[:4 * n])
hits = []
for i in range(lo // 4, min(hi // 4, n)):
    w = W[i]; c = w >> 28
    if c == 0xf: continue
    a = 4 * i
    # str/strb imm12, U=1, L=0
    if (w & 0x0e000000) == 0x04000000 and (w & 0xfff) in offs and (w >> 23) & 1 and not (w >> 20) & 1:
        hits.append((a, 'st%s #%#x' % ('b' if (w >> 22) & 1 else '', w & 0xfff)))
        continue
    # strh/strd imm8: bits 27-25 000, bit22 1 (imm), bit 7 1, bit 4 1; L=0
    if (w & 0x0e400090) == 0x00400090 and (w >> 23) & 1 and not (w >> 20) & 1:
        im = ((w >> 4) & 0xf0) | (w & 0xf)
        if im in offs: hits.append((a, 'sth/d #%#x' % im)); continue
    # movw rX, #off then a register-offset store using rX within 6
    if (w & 0x0ff00000) == 0x03000000:
        v = ((w >> 4) & 0xf000) | (w & 0xfff)
        if v in offs:
            rd = (w >> 12) & 0xf
            for j in range(1, 7):
                w2 = W[i + j]
                # str/strb reg offset: bits 27-25 011, L=0, Rm = rd
                if (w2 & 0x0e000010) == 0x06000000 and not (w2 >> 20) & 1 and (w2 & 0xf) == rd:
                    hits.append((a + 4 * j, 'movw%#x+st reg' % v)); break
                # strh reg offset: bits 27-25 000, bit22 0, bits 7..4 1011, L=0
                if (w2 & 0x0e4000f0) == 0x000000b0 and not (w2 >> 20) & 1 and (w2 & 0xf) == rd:
                    hits.append((a + 4 * j, 'movw%#x+strh reg' % v)); break
print(len(hits))
for h in hits: print('%#x %s' % h)
