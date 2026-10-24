# picref.py lo hi: every PIC address materialisation (ldr rM, [pc, #i] ... add rD, pc, rM) in main.text resolving into [lo, hi)
import struct, sys
T = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
n = len(T) // 4; W = struct.unpack('<%dI' % n, T[:n * 4])
lo, hi = int(sys.argv[1], 16), int(sys.argv[2], 16)
for i, w in enumerate(W):
    if (w & 0x0fff0ff0) != 0x008f0000: continue
    rm = w & 0xf
    for j in range(i - 1, max(-1, i - 24), -1):
        v = W[j]
        if (v & 0x0f7ff000) == (0x051f0000 | (rm << 12)):   # ldr rm, [pc, #+-imm]
            imm = v & 0xfff
            if not (v >> 23) & 1: imm = -imm
            lit = struct.unpack('<I', T[j * 4 + 8 + imm:j * 4 + 12 + imm])[0]
            tgt = (i * 4 + 8 + lit) & 0xffffffff
            if lo <= tgt < hi: print('%08x  ldr@%08x  -> %08x' % (i * 4, j * 4, tgt))
            break
