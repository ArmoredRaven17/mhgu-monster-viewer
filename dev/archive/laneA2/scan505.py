"""scan505.py (effects lane A2, 2026-10-26): every word of main.text that can write the tired byte P+0x505 or reach the stamina
routines, decoded word by word (a data word does not stop it):
  - LDR/STR(B/H) immediate forms whose offset is 0x505 (any P/W: a pre-indexed `[rX, #0x505]!` leaves a pointer -- trap 3),
  - movw rX, #0x505 (a register offset),
  - every BL / B (any condition) to 0xbd0c8 (set P+0x505 = r1), 0xbd1a4 (the stamina updater), 0xbd3d8, 0x7112c ([tune+0x30]),
    with the last write of r1 before it.
Control: the six writers states-em033_00.md 6 lists (0xb9530 0xba910 0xbd0f4 0xbd250 0xbd2d4 0xbd328) must all appear."""
import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis, capstone
T = armdis.TEXT
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
def dis1(a):
    i = next(md.disasm(T[a:a + 4], a), None)
    return (i.mnemonic + ' ' + i.op_str) if i else '.word'
TGT = {0xbd0c8: 'set505', 0xbd1a4: 'stamUpd', 0xbd3d8: 'bd3d8', 0x7112c: 'tune30'}
hits = []
n = len(T) // 4
W = struct.unpack_from('<%dI' % n, T)
for k, w in enumerate(W):
    a = k * 4
    cond = w >> 28
    if cond == 0xf: continue
    # single data transfer imm: bits 27-26 = 01, I (25) = 0
    if (w >> 26) & 3 == 1 and not (w >> 25) & 1 and (w & 0xfff) == 0x505:
        hits.append((a, 'imm505', dis1(a)))
    # halfword / signed transfer imm: bits 27-25 = 000, bit 22 = 1, bit 7 = 1, bit 4 = 1
    elif (w >> 25) & 7 == 0 and (w >> 22) & 1 and (w & 0x90) == 0x90 and (w & 0x60) and (((w >> 4) & 0xf0) | (w & 0xf)) == 0x505:
        hits.append((a, 'h505', dis1(a)))
    elif (w & 0x0ff00000) == 0x03000000 and (((w >> 4) & 0xf000) | (w & 0xfff)) == 0x505:
        hits.append((a, 'movw505', dis1(a)))
    elif (w >> 25) & 7 == 5:
        off = w & 0xffffff
        if off & 0x800000: off -= 0x1000000
        t = a + 8 + off * 4
        if t in TGT:
            # r1's last write within 8 instructions back
            r1 = ''
            for b in range(a - 4, a - 36, -4):
                d = dis1(b)
                if d.split(' ')[0] in ('mov', 'movw', 'movne', 'moveq', 'ldr', 'ldrb', 'add', 'sub', 'movwne', 'movweq', 'and', 'orr') and d.split(' ', 1)[1].startswith('r1,'):
                    r1 = '%x: %s' % (b, d); break
            hits.append((a, TGT[t], dis1(a) + '   | r1 <- ' + r1))
for h in hits: print('%08x %-8s %s' % h)
ctl = {0xb9530, 0xba910, 0xbd0f4, 0xbd250, 0xbd2d4, 0xbd328}
got = {h[0] for h in hits}
print('CONTROL six known writers found:', sorted(hex(x) for x in ctl & got), 'missing:', sorted(hex(x) for x in ctl - got))
