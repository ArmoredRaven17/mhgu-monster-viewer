# laneB3/immsites.py (lane B3, 2026-10-25): every instruction in main.text (or [lo, hi)) whose operands carry the immediate N,
# with the next K instructions -- the quick census of a field's users (a `movw rX, #off` then `ldrb/strb [rB, rX]`, or `[rB, #off]`).
#   python dev/archive/laneB3/immsites.py <imm hex> [K=3] [lo hi]
# Caveat: a field reached through a pointer left by a post-indexed / pre-indexed load never names its offset again (CLAUDE.md 2);
# a negative from this scan alone is not a negative.
import sys, re, capstone
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis as D
T = D.TEXT
imm = int(sys.argv[1], 16)
K = int(sys.argv[2]) if len(sys.argv) > 2 else 3
lo, hi = (int(sys.argv[3], 16), int(sys.argv[4], 16)) if len(sys.argv) > 4 else (0, len(T) & ~3)
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM); md.skipdata = True
pat = re.compile(r'#(0x[0-9a-f]+|\d+)\b')
ins = list(md.disasm(T[lo:hi], lo))
n = 0
for i, a in enumerate(ins):
    vals = [int(v, 0) for v in pat.findall(a.op_str)]
    if imm in vals:
        n += 1
        print(' | '.join('%08x %s %s' % (b.address, b.mnemonic, b.op_str) for b in ins[i:i + 1 + K]))
print('sites', n)
