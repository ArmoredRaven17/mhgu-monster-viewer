# hypereye/picrefs.py (hyper-eye lane, 2026-10-27): every PIC address materialisation in main.text (`ldr rX, [pc, #imm]` then
# `add rX, pc, rX` within 12 instructions) that resolves into [LO, HI) -- the users of a .data / .bss object (here the model mesh draw's
# pass table holder 0x21208c0, read at 0xc46018).
#   python dev/archive/hypereye/picrefs.py <lo hex> <hi hex>
import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis as D
T = D.TEXT
LO, HI = int(sys.argv[1], 16), int(sys.argv[2], 16)
n = 0
for a in range(0, len(T) - 4, 4):
    w = struct.unpack_from('<I', T, a)[0]
    # add rd, pc, rm  (cond AL): 1110 0000 1000 1111 dddd 0000 0000 mmmm
    if (w & 0xffff0ff0) != 0xe08f0000: continue
    rd, rm = (w >> 12) & 0xf, w & 0xf
    for b in range(a - 4, max(0, a - 48), -4):
        v = struct.unpack_from('<I', T, b)[0]
        # ldr rm, [pc, #+-imm]
        if (v & 0xff7f0000) == 0xe51f0000 and ((v >> 12) & 0xf) == rm:
            imm = v & 0xfff
            lit = b + 8 + (imm if (v >> 23) & 1 else -imm)
            off = struct.unpack_from('<I', T, lit)[0] if 0 <= lit < len(T) else None
            if off is None: break
            tgt = (a + 8 + off) & 0xffffffff
            if LO <= tgt < HI:
                n += 1; print('%08x -> %08x (r%d)' % (a, tgt, rd))
            break
print('refs', n)
