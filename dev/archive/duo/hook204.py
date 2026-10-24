# hook204.py: run each class's on-action-start hook (vtable +0x204) for every (status, n) the census found, with the
# hook's own arguments (r1 = status, r2 = number), link 0 / 1; print what it writes (ctl+0x18 = the partner request
# for the Queen, ctl+0x35 / +0x38 / +0x49 for Seltas, P+0x1bb) and the changes it asks for.
import sys, json
import tracer as t
from unicorn.arm_const import UC_ARM_REG_R1, UC_ARM_REG_R2
cls = sys.argv[1]; cen = json.load(open(sys.argv[2]))
import armdis
ent = armdis.u32(t.CLS[cls]['vtable'] + 0x204)
for k in cen:
    s, n = k.split(','); s = int(s); n = int(n, 16)
    for link in (0, 1):
        r = t.run(cls, s, n, entry=ent, link=link, regs={UC_ARM_REG_R1: s, UC_ARM_REG_R2: n}, extra=[(t.E + 0x7420, b'\1')])
        w = [x for x in t.fmt(r) if x.startswith('WRITE') or x.startswith('CHG') or x.startswith('MOT')]
        if w: print(k, 'link', link, w)
