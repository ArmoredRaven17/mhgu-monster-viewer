# hypereye/blsites.py (hyper-eye lane, 2026-10-27): every BL / BLX (immediate) to TARGET in main.text, with the K instructions before it
# -- the census of a callee's call sites and the arguments set up for it (here: who sets the draw context's pass, 0x87cf70(ctx, pass, key)).
#   python dev/archive/hypereye/blsites.py <target hex> [K=4] [lo hi]
import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis as D
import capstone
T = D.TEXT
tgt = int(sys.argv[1], 16)
K = int(sys.argv[2]) if len(sys.argv) > 2 else 4
lo, hi = (int(sys.argv[3], 16), int(sys.argv[4], 16)) if len(sys.argv) > 4 else (0, len(T) & ~3)
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
n = 0
for a in range(lo, hi, 4):
    w = struct.unpack_from('<I', T, a)[0]
    if (w >> 25) & 7 != 5: continue                       # B / BL / BLX imm
    cond = w >> 28
    off = w & 0xffffff
    if off & 0x800000: off -= 0x1000000
    dest = a + 8 + (off << 2)
    if cond == 0xf: dest += ((w >> 24) & 1) << 1          # BLX imm (H bit)
    elif not (w >> 24) & 1: continue                      # B (no link)
    if dest != tgt: continue
    n += 1
    s = max(lo, a - 4 * K)
    ins = list(md.disasm(T[s:a + 4], s))
    print(' | '.join('%08x %s %s' % (i.address, i.mnemonic, i.op_str) for i in ins))
print('sites', n)
