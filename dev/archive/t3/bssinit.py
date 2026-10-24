# bssinit.py: who writes the BSS vectors 0x19176e0 / 0x19176f0 / 0x1917700 (the axis constants 0x7dc9a0 reads through the GOT
# 0x1832130 / 0x1832134 / 0x1832184): every 'ldr rX, [pc, #lit]; ...; ldr rX, [pc, rX]' / 'add rX, pc, rX' that resolves into
# 0x19176c0..0x1917720, with the instructions after it
import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis, capstone
T = armdis.TEXT; D = armdis.DATA
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
got = {}
for o in range(0, len(D) - 4, 4):
    v = struct.unpack_from('<I', D, o)[0]
    if 0x19176c0 <= v < 0x1917720: got[armdis.DA_VA + o] = v
print('GOT slots ->', {hex(k): hex(v) for k, v in got.items()})
hits = []
for a in range(0, len(T) - 8, 4):
    w = struct.unpack_from('<I', T, a)[0]
    # ldr rX, [pc, #imm]
    if (w & 0x0f7f0000) == 0x051f0000:
        imm = w & 0xfff; up = (w >> 23) & 1
        lit = a + 8 + (imm if up else -imm)
        if 0 <= lit < len(T) - 4:
            val = struct.unpack_from('<I', T, lit)[0]
            for k in range(1, 4):
                b = a + 4 * k
                i = next(md.disasm(T[b:b+4], b), None)
                if not i: break
                if i.op_str.endswith('[pc, r%d]' % ((w >> 12) & 0xf)) or (i.mnemonic == 'add' and i.op_str.endswith('pc, r%d' % ((w >> 12) & 0xf))):
                    tgt = b + 8 + val
                    tgt = tgt & 0xffffffff
                    if tgt in got or 0x19176c0 <= tgt < 0x1917720: hits.append((a, i.mnemonic, hex(tgt)))
                    break
print(len(hits))
for h in hits[:60]: print(hex(h[0]), h[1], h[2])
