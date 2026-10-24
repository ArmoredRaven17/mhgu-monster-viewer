# cenring068.py <status> -- Najarala: every action's writes to the ring block [e+0xcac0]+0x14 / +0x30 and P+0x1bb, with each frame
# literal answered alone (cengen11's method), plus its motions
import sys, json, os, struct
st = int(sys.argv[1], 0)
sys.argv = ['x']
os.environ.setdefault('FB_CLASS', 'uEm068_00'); os.environ.setdefault('FB_MON', 'em068_00')
import trgen as T
from unicorn import UC_HOOK_MEM_WRITE
from unicorn.arm_const import *
def wr(uc, acc, addr, size, value, ud):
    if addr == T.C + 0x14 and size == 1 or addr == T.C + 0x30 or addr == T.P + 0x1bb:
        v = value & 0xffffffff
        if addr == T.C + 0x30: v = round(struct.unpack('<f', struct.pack('<I', v))[0], 1)
        T.cur.setdefault('ev', []).append(['w', hex(addr - (T.C if addr < T.P else T.P)), v, hex(uc.reg_read(UC_ARM_REG_PC)), T.cur.get('lastF')])
T.mu.hook_add(UC_HOOK_MEM_WRITE, wr, begin=T.C, end=T.P + 0x200)
STUB = {0x3a8430: int(os.environ.get('FB_RANK', '5'))}
for n in range(256):
    seen = {}; mots = set()
    for ph in range(9):
        lits = set()
        for scn in ({'frame': 1, 'frame2': 1}, {'frame': 1, 'frame2': 1, 'ended': 1}, {'frame': 0, 'frame2': 0}):
            r = T.run(st, n, ph, 0, 0, stub=STUB, **scn)
            for e in r.get('ev', []):
                if e[0] == 'mot': mots.add((ph, e[1]))
                if e[0] == 'ftest': lits.add(e[1])
                if e[0] == 'ftest2': lits.add(e[2][1])
        for L in sorted(x for x in lits if x is not None):
            r = T.run(st, n, ph, 0, 0, stub=STUB, only=L)
            for e in r.get('ev', []):
                if e[0] == 'w': seen.setdefault('p%d %s=%s %s' % (ph, e[1], e[2], e[3]), set()).add(str(L))
    if seen: print('%d:%#04x' % (st, n), sorted(mots), {k: sorted(v) for k, v in sorted(seen.items())}, flush=True)
