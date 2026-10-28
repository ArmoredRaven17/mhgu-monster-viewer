# laneB3/ptrscan.py (lane B3, 2026-10-25): every aligned word in main.text / .rodata / .data whose value lies in [lo, hi) --
# the GOT entries and literal-pool words that point into a table, i.e. where a table's readers get it from (a table's extent
# ends where the next pointed-at object begins). Then, for each GOT hit, the text's PIC loads of it (ldr rX,[pc,#d]; ldr rX,[pc,rX]).
#   python dev/archive/laneB3/ptrscan.py <lo> <hi>          (hex)
# Control: the Nakarkos body u table 0x16a2858 must show its GOT 0x183f8b4 and vt+0x1d0's load at 0x106f8cc (dev/em084-class-effects.md 0).
import sys, struct, capstone
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis as D
lo, hi = int(sys.argv[1], 16), int(sys.argv[2], 16)
secs = [('text', 0, D.TEXT), ('rodata', D.RO_VA, D.RODATA), ('data', D.DA_VA, D.DATA)]
hits = []
for name, base, buf in secs:
    n = len(buf) // 4
    for i in range(n):
        v = struct.unpack_from('<I', buf, 4 * i)[0]
        if lo <= v < hi: hits.append((name, base + 4 * i, v))
for h in hits: print('%-6s %08x -> %08x' % h)
# PIC loads: ldr rX, [pc, #d] whose literal + (pc of the second ldr + 8) == a GOT hit address
got = {a for (n, a, v) in hits if n == 'data'}
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM); md.skipdata = True
T = D.TEXT
for a in range(0, len(T) - 8, 4):
    w = struct.unpack_from('<I', T, a)[0]
    if (w & 0x0f7f0000) != 0x051f0000: continue          # ldr rX, [pc, #+-imm]
    imm = w & 0xfff; up = (w >> 23) & 1
    lit = a + 8 + (imm if up else -imm)
    if not (0 <= lit < len(T) - 4): continue
    off = struct.unpack_from('<I', T, lit)[0]
    rd = (w >> 12) & 0xf
    for k in range(1, 4):                                  # the add/ldr [pc, rX] within 3 words
        b = a + 4 * k
        w2 = struct.unpack_from('<I', T, b)[0]
        if (w2 & 0x0fffffff) == (0x079f0000 | (rd << 12) | rd):   # ldr rd, [pc, rd]
            tgt = (b + 8 + off) & 0xffffffff
            if tgt in got: print('PIC load %08x (lit %08x) .. %08x -> GOT %08x' % (a, lit, b, tgt))
            break
