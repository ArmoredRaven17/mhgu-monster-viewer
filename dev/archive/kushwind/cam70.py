"""kushwind/cam70.py <vtable> [depth]: in every function of a class vtable (slots 0..0x200) and its direct callees to `depth`, the
stores to this +0x70 / +0x74 / +0x78 -- 'this' tracked from r0 at entry through movs (and passed on as r0 to callees).
Control: the same over +0x40 finds the camera's mCameraPos writers."""
import sys, re
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis, capstone
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM); md.skipdata = True
vt = int(sys.argv[1], 16); depth = int(sys.argv[2]) if len(sys.argv) > 2 else 2
offs = [int(x, 16) for x in (sys.argv[3].split(',') if len(sys.argv) > 3 else ['70', '74', '78'])]
T = armdis.TEXT
seen = set(); hits = []
def walk(f, d, path):
    if f in seen or not (0 < f < len(T)): return
    seen.add(f)
    this = {'r0'}
    for ins in md.disasm(T[f:f + 0x2000], f):
        m, op = ins.mnemonic, ins.op_str
        mm = re.match(r'(\w+), (\w+)$', op)
        if m == 'mov' and mm:
            if mm.group(2) in this: this.add(mm.group(1))
            elif mm.group(1) in this: this.discard(mm.group(1))
        if m in ('str', 'vstr', 'strd'):
            for o in offs:
                for t in this:
                    if op.endswith('[%s, #0x%x]' % (t, o)): hits.append('%s  %x %s %s' % ('/'.join(path), ins.address, m, op))
        if m == 'bl' and d > 0 and 'r0' in this:
            tgt = int(op.lstrip('#'), 16); walk(tgt, d - 1, path + [hex(tgt)])
        if (m == 'pop' and 'pc' in op) or (m == 'bx' and op == 'lr'): break
for s in range(0, 0x200, 4):
    f = armdis.u32(vt + s)
    if f and f < len(T): walk(f, depth, ['vt+%x=%x' % (s, f)])
print('\n'.join(hits) or 'none')
