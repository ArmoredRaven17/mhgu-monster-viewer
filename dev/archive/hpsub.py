"""Find HP decrements: str rX,[rY,#0x370] where rX was produced by a sub within the previous 10 instructions."""
import sys, struct, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from d import TEXT, md
lo = int(sys.argv[1], 16) if len(sys.argv) > 1 else 0
hi = int(sys.argv[2], 16) if len(sys.argv) > 2 else len(TEXT)
for va in range(lo, hi, 4):
    w = struct.unpack_from('<I', TEXT, va)[0]
    if (w & 0x0E500FFF) == 0x04000370 and (w >> 23) & 1 and (w >> 28) != 0xF:
        ins = list(md.disasm(TEXT[va - 40:va + 4], va - 40))
        if not ins or ins[-1].address != va: continue
        rt = ins[-1].op_str.split(',')[0]
        for p in ins[:-1]:
            if p.mnemonic.startswith(('sub', 'rsb', 'vsub')) and p.op_str.split(',')[0] in (rt,):
                print('%08x: %s %s   <- %08x %s %s' % (va, ins[-1].mnemonic, ins[-1].op_str, p.address, p.mnemonic, p.op_str))
