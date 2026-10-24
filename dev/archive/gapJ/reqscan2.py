# every call (bl / b / blx reg) in [lo, hi) whose 8 preceding words set r1 = #s and r2 = #n by mov immediates
import struct, sys
T = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
lo, hi = int(sys.argv[1], 16), int(sys.argv[2], 16)
pairs = [tuple(int(x, 16) for x in p.split(',')) for p in sys.argv[3:]]
W = struct.unpack('<%dI' % ((hi - lo) // 4), T[lo:hi])
for i, w in enumerate(W):
    isb = ((w >> 25) & 7) == 5 and (w >> 28) == 0xe
    isblx = (w & 0x0ffffff0) == 0x012fff30 and (w >> 28) == 0xe
    if not (isb or isblx): continue
    prev = W[max(0, i - 8):i]
    r1 = [p & 0xff for p in prev if (p & 0xfffff000) == 0xe3a01000]
    r2 = [p & 0xff for p in prev if (p & 0xfffff000) == 0xe3a02000]
    for s, n in pairs:
        if s in r1 and n in r2:
            tgt = ''
            if isb:
                imm = w & 0xffffff
                if imm & 0x800000: imm -= 0x1000000
                tgt = '%x' % (lo + i * 4 + 8 + imm * 4)
            else: tgt = 'blx r%d' % (w & 0xf)
            print('%08x -> %s  (%#x, %#x)' % (lo + i * 4, tgt, s, n))
