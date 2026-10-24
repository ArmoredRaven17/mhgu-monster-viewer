"""Which thread slots take e+0xd410 and which e+0xd440 (the two web points), by running the thread pass
vt+0x208 (0x10b7644) under emu88b with d410 = (11, 12, 13) and d440 = (41, 42, 43) as markers.
Conditions: object carried 0 / none; 5-anchor web (d420..d430 handles, +4 = 1) with d408 0 / 1; 3- and 4-anchor web
(d450..d45c, +4 bytes all 1 or mixed); actions (0, 0) and (1, 0x1c..0x25). Anchor gates 0x4381d8 / 0x43a388 run
natively. Output: per (motion, slot, id, start kind, end kind) the marker the slot's +0x10 / +0x40 holds."""
import sys, struct, collections
sys.path.insert(0, r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\ak')
import emu88b as emu88
from unicorn.arm_const import *
E = emu88.E
emu88.NATIVE.extend([(0x4381d8, 0x438204), (0x43a388, 0x43a39c)])
emu88.LOG_REQ.update({0x6f640, 0x6f618, 0x6f62c})
f3 = lambda *v: struct.pack('<3f', *v)
MARK = {(11.0, 12.0, 13.0): 'd410', (41.0, 42.0, 43.0): 'd440'}
OBJ = 0x5a5a0000
res = collections.defaultdict(set)
errs = collections.Counter()


def point(b, off):
    v = struct.unpack_from('<3f', b, off)
    if v in MARK: return MARK[v]
    if 900.0 <= v[0] < 1000.0: return 'anchor%d' % int(v[0] - 900)
    return 'other'


for mode in (0, 4):
    for web in ('five', 'five+d408', 'three', 'four', 'four-mixed'):
        for act in [(0, 0)] + [(1, n) for n in range(0x1c, 0x26)]:
            k = emu88.Ka(mode=mode, action=act)
            mu = k.mu
            mu.mem_map(OBJ, 0x10000)
            mu.mem_write(E + 0xd410, f3(11, 12, 13)); mu.mem_write(E + 0xd440, f3(41, 42, 43))
            hs = []
            if web.startswith('five'):
                hs = [(0xd420 + 4 * p, p, 1) for p in range(5)]
                if web.endswith('d408'): mu.mem_write(E + 0xd408, b'\1')
            elif web == 'three':
                hs = [(0xd450 + 4 * p, 5 + p, 1) for p in range(3)]
            elif web == 'four':
                hs = [(0xd450 + 4 * p, 5 + p, 1) for p in range(4)]
            else:
                hs = [(0xd450 + 4 * p, 5 + p, 1 if p % 2 == 0 else 0) for p in range(4)]
            for off, p, st in hs:
                o = OBJ + 0x200 * p
                mu.mem_write(E + off, struct.pack('<I', o))
                mu.mem_write(o + 4, bytes([st, 0]))
                mu.mem_write(o + 0xc, struct.pack('<I', 1))
                mu.mem_write(o + 0x40, f3(900 + p, 0, 0))
            for m in range(0x200, 0x231):
                for f in range(0, 400, 2):
                    k.setframe(m, float(f), 400.0)
                    try:
                        k.call(0x10b7644)
                    except Exception:
                        errs[hex(mu.reg_read(UC_ARM_REG_PC))] += 1
                        continue
                    for s in range(20):
                        b = bytes(mu.mem_read(E + 0xcb20 + 0x70 * s, 0x70))
                        if not b[4]: continue
                        sk, ek = b[0xc], b[0x30]
                        if sk != 3 and ek != 4: continue
                        key = ('L2M%d' % (m - 0x200), s, struct.unpack_from('<I', b, 8)[0], sk,
                               point(b, 0x10) if sk == 3 else '-', ek, point(b, 0x40) if ek == 4 else '-')
                        res[key].add((web, '%d,%#x' % act, 'obj%d' % mode, f))
                    # clear the slots' active flags so each frame shows only its own marks
                    for s in range(20):
                        mu.mem_write(E + 0xcb20 + 0x70 * s + 4, b'\0')
import pickle; pickle.dump(dict(res), open("slotpts.pkl", "wb"))
agg = collections.defaultdict(lambda: [set(), set(), set(), []])
for key, ws in res.items():
    m, s, idn, sk, sp, ek, ep = key
    a = agg[(s, idn, sk, sp, ek, ep)]
    a[0].add(m)
    for w, act, ob, f in ws:
        a[1].add(w); a[2].add(act); a[3].append(f)
for (s, idn, sk, sp, ek, ep), (ms, webs, acts, fs) in sorted(agg.items()):
    print('slot %2d id %d (u %s) start %d %-8s end %d %-8s | motions %s | webs %s | actions %s' % (
        s, idn, {1011: 340, 1012: 343, 1013: 342, 1014: 341, 1015: 341, 1016: 342, 1017: 343, 1018: 344}.get(idn, '?'),
        sk, sp, ek, ep, sorted(ms, key=lambda x: int(x[3:])), sorted(webs), sorted(acts)))
print('errors', errs.most_common(5))
