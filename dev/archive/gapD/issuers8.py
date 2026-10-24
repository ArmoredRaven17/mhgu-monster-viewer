"""issuers.py <lo> <hi>: every action-change call in a code range with the (r1, r2) immediates found in the 30 instructions before.
Counts BOTH forms (2026-10-19, after the shells agent's find):
  * a direct b / bl to the change family (0x768c8 follow, 0x76a40, 0x7699c, 0x75230, 0x76098, 0x754b8, 0x76088, 0x76094, 0x7fba0);
  * the VIRTUAL vt+0x3d0 -- `ldr rX, [rY, #0x3d0]` then `blx rX` / `bx rX` within 4 -- which every enemy vtable fills with 0x6c178
    = `b 0x768c8` (the follow). The old version saw only the first form, so a chain through vt+0x3d0 (Amatsu's (7, 0xf) ->
    (7, 0x19) -> (7, 0x1a) -> (7, 0x1b)) read as "no issuer".
Output: 'calls N top ...' then one tuple (addr, r1, r2, form) per call."""
import capstone, struct, sys
from collections import Counter
T = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
CH = {0x768c8, 0x76a40, 0x7699c, 0x75230, 0x76098, 0x754b8, 0x76088, 0x76094, 0x7fba0}
lo, hi = int(sys.argv[1], 16), int(sys.argv[2], 16)
def dec(a):
    return next(md.disasm(T[a:a + 4], a), None)
def regs_before(a):
    r1 = r2 = None
    for b in range(a - 120, a, 4):
        i = dec(b)
        if not i or not i.mnemonic.startswith('mov'): continue
        if i.op_str.startswith('r1, #'): r1 = int(i.op_str[5:], 0)
        if i.op_str.startswith('r2, #'): r2 = int(i.op_str[5:], 0)
    return r1, r2
c = Counter(); hits = []
for a in range(lo, hi, 4):
    w = struct.unpack_from('<I', T, a)[0]
    # form 1: b / bl to the family
    if (w >> 25) & 7 == 5 and (w >> 28) != 0xf:
        off = w & 0xffffff
        if off & 0x800000: off -= 0x1000000
        if a + 8 + off * 4 in CH:
            r1, r2 = regs_before(a); c[(r1, r2)] += 1; hits.append((hex(a), r1, r2, 'b')); continue
    # form 2: ldr rX, [rY, #0x3d0] (cond 01 0 11001, imm12 0x3d0) then blx / bx rX
    if (w & 0x0FF00FFF) == 0x059003d0:
        rx = (w >> 12) & 0xf
        for k in range(1, 9):
            w2 = struct.unpack_from('<I', T, a + 4 * k)[0]
            if (w2 & 0x0FFFFFF0) in (0x012FFF30, 0x012FFF10) and (w2 & 0xf) == rx:
                r1, r2 = regs_before(a + 4 * k); c[(r1, r2)] += 1; hits.append((hex(a + 4 * k), r1, r2, 'vt+0x3d0')); break
print('calls', sum(c.values()), 'top', c.most_common(8))
for h in hits: print(h)
