"""immsites.py <imm hex> [lo hi] -- every instruction in main.text whose operands name the immediate (#0x...), word by word.
Flashed read 2026-10-25. A pointer register left by a post-indexed load is NOT followed (trap): read the hits' neighbourhoods."""
import sys, struct, capstone
T = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
imm = int(sys.argv[1], 16)
lo = int(sys.argv[2], 16) if len(sys.argv) > 2 else 0
hi = int(sys.argv[3], 16) if len(sys.argv) > 3 else len(T) & ~3
pat = ['#0x%x' % imm, '#%d' % imm]
n = 0; dec = 0
for a in range(lo, hi, 4):
    for i in md.disasm(T[a:a+4], a):
        dec += 1
        s = i.op_str
        for p in pat:
            k = s.find(p)
            if k >= 0 and (k + len(p) == len(s) or not s[k+len(p)].isalnum()):
                print('%08x  %s %s' % (a, i.mnemonic, s)); n += 1; break
print('# %d hits, %d of %d words decoded' % (n, dec, (hi - lo) // 4), file=sys.stderr)
