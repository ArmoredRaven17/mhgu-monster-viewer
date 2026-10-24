"""Every movw rD,#IMM in main.text, with the next 3 instructions. python movwscan.py IMM [lo hi]"""
import sys, struct, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from d import TEXT, md
imm = int(sys.argv[1], 16)
lo = int(sys.argv[2], 16) if len(sys.argv) > 2 else 0
hi = int(sys.argv[3], 16) if len(sys.argv) > 3 else len(TEXT)
for va in range(lo, hi, 4):
    w = struct.unpack_from('<I', TEXT, va)[0]
    if (w & 0x0FF00000) == 0x03000000 and (((w >> 4) & 0xF000) | (w & 0xFFF)) == imm and (w >> 28) != 0xF:
        ins = list(md.disasm(TEXT[va:va + 16], va))
        print(' | '.join('%08x %s %s' % (i.address, i.mnemonic, i.op_str) for i in ins))
