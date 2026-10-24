"""Dynamic census: every write to enemy +0x1404..+0x140b made by the class's action main (tracec.run, all statuses 0..0x11 x
numbers x phases 0..3 x ended 0/1, follows), reporting the value written and which of bits 20 / 21 / 22 (+0x1404) and bit 0
(+0x1408) it raises. env CLS / EM as tracec.   python latchdyn.py <variant>"""
import sys, os, struct
import tracec as TR
from unicorn import UC_HOOK_MEM_WRITE
seen = {}
def wr(uc, access, addr, size, value, ud):
    if TR.E + 0x1404 <= addr < TR.E + 0x140c:
        old = struct.unpack('<I', uc.mem_read(addr & ~3, 4))[0]
        TR.cur.setdefault('w', []).append((addr - TR.E, size, value & 0xffffffff, old, TR.cur.get('pc', 0)))
TR.mu.hook_add(UC_HOOK_MEM_WRITE, wr)
var = int(sys.argv[1], 0)
for st in range(0, 0x12):
    for n in range(0, 0x100):
        for ph in range(0, 4):
            for e in (0, 1):
                TR.cur.clear()
                ws = []
                orig = TR.cur.clear
                ev = TR.run(var, st, n, ph, e, e, 0, follows=1)
                for (off, size, v, old, pc) in TR.cur.get('w', []):
                    pass
                w14 = struct.unpack('<I', TR.mu.mem_read(TR.E + 0x1404, 4))[0]
                w18 = struct.unpack('<I', TR.mu.mem_read(TR.E + 0x1408, 4))[0]
                if w14 or w18:
                    k = (w14, w18)
                    seen.setdefault(k, []).append((st, n, ph, e))
for (w14, w18), cases in sorted(seen.items()):
    print('+0x1404=%#010x +0x1408=%#010x  bit20=%d bit21=%d bit22=%d 1408.bit0=%d  %d cases, e.g. %s' % (
        w14, w18, (w14 >> 20) & 1, (w14 >> 21) & 1, (w14 >> 22) & 1, w18 & 1, len(cases), cases[:4]))
print('distinct', len(seen))
