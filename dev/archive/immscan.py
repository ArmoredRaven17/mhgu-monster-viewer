"""Scan main.text for word loads/stores (LDR/STR imm12) with a given offset. python immscan.py OFF [L|S] [lo hi]"""
import sys, struct
sys.path.insert(0, __file__.rsplit('\\', 1)[0])
from d import TEXT, md
off = int(sys.argv[1], 16)
kind = sys.argv[2] if len(sys.argv) > 2 else 'L'
lo = int(sys.argv[3], 16) if len(sys.argv) > 3 else 0
hi = int(sys.argv[4], 16) if len(sys.argv) > 4 else len(TEXT)
want_l = 1 if kind == 'L' else 0
for va in range(lo & ~3, hi, 4):
    w = struct.unpack_from('<I', TEXT, va)[0]
    if (w & 0x0E500FFF) == (0x04000000 | (want_l << 20) | off) and (w >> 23) & 1 and (w >> 28) != 0xF:
        ins = next(md.disasm(TEXT[va:va + 4], va), None)
        if ins: print('%08x: %s %s' % (va, ins.mnemonic, ins.op_str))
