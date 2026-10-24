# movwscan.py: every `movw rX, #imm` in main.text for each hex imm in argv (positive control: pass a known one)
import struct, sys
T = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
n = len(T) // 4; W = struct.unpack('<%dI' % n, T[:n * 4])
for a in sys.argv[1:]:
    imm = int(a, 16); pat = 0xe3000000 | ((imm >> 12) << 16) | (imm & 0xfff)
    hits = [i * 4 for i, w in enumerate(W) if (w & 0xffff0fff) == pat]
    print(hex(imm), len(hits), ' '.join('%x' % h for h in hits[:80]))
