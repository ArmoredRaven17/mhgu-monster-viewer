"""Dynamic census of writes to e+0xd3f8..+0xd420 (d3fc, d400, d404, d408, d40c, d410..d418) under the
emu88b harness (class band + shared layer native, everything else a stub returning 0).
Sentinel 0x7fc0dead in d40c..d41c so a write of anything (zeros included) is seen.
A: action starts 0x10b4828 (status, n);  B: the action main 0x10b3f74 for that action, 80 frames on the motion the
start set;  C: vt+0x1dc 0x10b345c, frame update 0x10b4024, vt+0x208 0x10b7644 on L2 M0..M48 x frames;  D: vt+0x218
0x10bae18 (EMC op 0xa3) b1 0..12 x b2 0..15."""
import sys, struct, collections
sys.path.insert(0, r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\ak')
import emu88b as emu88
from unicorn import UC_HOOK_MEM_WRITE
from unicorn.arm_const import *
E = emu88.E
emu88.LOGN.update({0xafe84, 0xafef0, 0xafce8})
emu88.RETVAL[0x48b884] = 0x5a5a0000
emu88.LOG_REQ.update({0x6f640, 0x6f618, 0x6f62c})   # tune getters: their table pointer is not set up -> stubbed (0)
SENT = struct.pack('<I', 0x7fc0dead)
W = collections.defaultdict(set)      # field -> {(pc, value, where)}
ERR = collections.Counter()
STARTERR = []
FIELDS = [(0xd3fc, 1, 'd3fc'), (0xd400, 4, 'd400'), (0xd404, 4, 'd404'), (0xd408, 1, 'd408'), (0xd409, 3, 'd409..b'),
          (0xd40c, 4, 'd40c'), (0xd410, 12, 'd410..d41b'), (0xd41c, 4, 'd41c'), (0xd440, 12, 'd440..d44b'), (0xd44c, 4, 'd44c')]


def mk(where, **kw):
    k = emu88.Ka(mode=kw.pop('mode', 0), **kw)
    k.mu.mem_map(0x5a5a0000, 0x10000)                 # the stub spawn's / fake anchor's object
    k.mu.mem_write(0x5a5a000c, struct.pack('<I', 1))
    for off in list(range(0xd40c, 0xd420, 4)) + list(range(0xd440, 0xd450, 4)):
        k.mu.mem_write(E + off, SENT)

    def wh(uc, acc, a, size, val, ud):
        for lo, n, name in FIELDS:
            if a < E + lo + n and a + size > E + lo:
                W[name].add((uc.reg_read(UC_ARM_REG_PC), val & 0xffffffff, where[0]))
    k.mu.hook_add(UC_HOOK_MEM_WRITE, wh)
    return k


def safe(k, fn, *a):
    try:
        return k.call(fn, *a)
    except Exception:
        ERR[(hex(fn), hex(k.mu.reg_read(UC_ARM_REG_PC)))] += 1
        if fn == 0x10b4828: STARTERR.append(where[0])
        return k.log


which = sys.argv[1] if len(sys.argv) > 1 else 'ABCD'
if 'A' in which or 'B' in which:
    for st in (0, 1, 2, 7, 10, 11):
        for n in range(0, 0xc8 if st == 10 else 0x40):
            for mode in (0, 4):
                where = ['A(%d,%#x)m%d' % (st, n, mode)]
                k = mk(where, mode=mode, action=(st, n))
                k.mu.mem_write(E + 0xd470, bytes([1, 2]))
                lg = safe(k, 0x10b4828, st, n)
                mot = [x[2] for x in lg if x[0] == 'call' and x[1] in (0xafe84, 0xafef0, 0xafce8)]
                if 'B' not in which:
                    continue
                m = mot[-1] if mot else 0x200
                for f in range(0, 400, 5):
                    where[0] = 'B(%d,%#x)m%d f%d' % (st, n, mode, f)
                    k.setframe(m, float(f), 400.0)
                    lg = safe(k, 0x10b3f74)
                    mot = [x[2] for x in lg if x[0] == 'call' and x[1] in (0xafe84, 0xafef0, 0xafce8)]
                    if mot:
                        m = mot[-1]
if 'C' in which:
    for mode in (0, 4):
        for m in range(0x200, 0x231):
            where = ['C L2M%d m%d' % (m - 0x200, mode)]
            k = mk(where, mode=mode)
            for p in range(5):
                k.mu.mem_write(E + 0xd420 + 4 * p, struct.pack('<I', 0x5a5a0000))
            for f in range(0, 300, 3):
                k.setframe(m, float(f), 400.0)
                safe(k, 0x10b345c); safe(k, 0x10b4024); safe(k, 0x10b7644)
if 'D' in which:
    for b1 in range(0, 13):
        for b2 in range(0, 16):
            where = ['D a3(%d,%d)' % (b1, b2)]
            k = mk(where)
            safe(k, 0x10bae18, b1, b2)
for name in [f[2] for f in FIELDS]:
    s = W.get(name, set())
    byp = collections.defaultdict(list)
    for pc, v, w in s:
        byp[(pc, v)].append(w)
    print('==', name, len(s), 'writes')
    for (pc, v), ws in sorted(byp.items()):
        print('   pc %#x val %#x  x%d  e.g. %s' % (pc, v, len(ws), sorted(ws)[:4]))
print('errors', len(ERR), ERR.most_common(8))
print('start errors', STARTERR)
