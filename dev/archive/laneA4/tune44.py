# laneA4/tune44.py (lane A4, 2026-10-26): every read of dttune +0x44 (tune obj +0x64 +0x44 = obj+0xa8, obj = [e+0x75ec]):
# a movw #0x75ec followed within 4 instructions by a load [rX, #0xa8] off the register it loaded. Control: the same scan for
# +0x94 (tune+0x30) must find 0x7112c.
import sys, capstone
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
T = armdis.TEXT
def scan(off):
    hits = []
    lo, hi = 0x40000, 0x1130000
    for a in range(lo, hi, 4):
        w = int.from_bytes(T[a:a+4], 'little')
        # movw: cond 0011 0000 imm4 Rd imm12
        if (w & 0x0ff00000) != 0x03000000: continue
        imm = ((w >> 4) & 0xf000) | (w & 0xfff)
        if imm != 0x75ec: continue
        seq = list(md.disasm(T[a:a+24], a))
        for i in seq[1:6]:
            if i.mnemonic.startswith('ldr') and ('#%#x]' % off) in i.op_str:
                hits.append((a, i.address, i.mnemonic, i.op_str)); break
    return hits
for off in (0x94, 0xa8):
    h = scan(off)
    print('tune obj +%#x: %d' % (off, len(h)))
    for x in h: print('  %#x  %#x %s %s' % x)
