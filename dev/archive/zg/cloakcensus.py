"""cloakcensus.py -- every action Chameleos's command table issues (op 00 st n, t3/em025_emc.txt) run on the ROM (tracec: phases 0..7
x frame gate 0 / 1 x ended 0 / 1, follows 3) with the area gate answered 1 / 0 and the breaks none / horn / tail / both: which cloak
setter it reaches (0xe03c78 (1,3)/(1,0x11), 0xe0496c (1,0x16), 0xe06b04 (2,0x14), 0xe0a910 (status 7, L2 M30), 0xe0d5e8 demo,
0xe0def4 vt+0x3cc) and the level it writes (+0x13).   CLS=uEm025_00 EM=25 python cloakcensus.py"""
import sys, struct, re, collections, os
import tracec as TR
from unicorn import UC_HOOK_CODE, UC_HOOK_MEM_WRITE
from unicorn.arm_const import *
mu = TR.mu; E, P, C = TR.E, TR.P, TR.C
TR.NATIVE |= set(range(0xa3bf4, 0xa3c10))      # vt+0x370 (the part-broken test) runs natively: P+0x3b4 & mask
SET = {0xe03c78: '(1,3)/(1,0x11) 0xe03b70', 0xe0496c: '(1,0x16) 0xe045b8', 0xe06b04: '(2,0x14) 0xe06a0c', 0xe0a910: 'st7 0xe0a098 L2 M30',
       0xe0d5e8: 'demo 0xe0d308', 0xe0def4: 'vt+0x3cc'}
HIT = []
def hs(u, a, s, d): HIT.append(a)
for a in SET: mu.hook_add(UC_HOOK_CODE, hs, begin=a, end=a)
LV = []
def mw(u, acc, addr, size, val, ud):
    if addr == C + 0x13: LV.append(val & 0xff)
mu.hook_add(UC_HOOK_MEM_WRITE, mw, begin=C + 0x13, end=C + 0x13)
BRK = {'none': 0, 'horn': 2, 'tail': 1, 'both': 3}
STATE = {}
def pre(u, a, s, d):
    mu.mem_write(P + 0x3b4, bytes([STATE['brk']]))
mu.hook_add(UC_HOOK_CODE, pre, begin=TR.C_['main'], end=TR.C_['main'])
# the area gate 0x5bfb8 / 0x5c1a8: answered
def gate(u, a, s, d):
    u.reg_write(UC_ARM_REG_R0, STATE['gate']); u.reg_write(UC_ARM_REG_PC, u.reg_read(UC_ARM_REG_LR))
for g in (0x5bfb8, 0x5c1a8): mu.hook_add(UC_HOOK_CODE, gate, begin=g, end=g)
acts = sorted({tuple(int(x, 16) for x in m.split()[1:3]) for m in re.findall(r'\b00 0[0-9a-d] [0-9a-f]{2}\b', open(os.path.join(os.path.dirname(__file__), '..', 't3', 'em025_emc.txt')).read())})
acts += [(1, 0x11), (2, 0x14), (7, 0xf), (7, 0x11), (7, 0x26), (7, 0x2a), (13, 0)]
res = collections.defaultdict(set)
for st, n in acts:
    for bname, b in BRK.items():
        for gt in (1, 0):
            STATE.update(brk=b, gate=gt)
            for ph in range(8):
                for en in (0, 1):
                    for fr in (0, 1):
                        HIT.clear(); LV.clear()
                        TR.run(0, st, n, ph, en, fr, 0, follows=3)
                        for h in HIT: res[(st, n, SET[h])].add((bname, gt, tuple(LV)))
for (st, n, s), v in sorted(res.items()):
    by = collections.defaultdict(set)
    for bname, gt, lv in v: by[(bname, gt)].add(lv)
    print('(%d, %#x) -> %s : %s' % (st, n, s, '; '.join('%s gate%d lv%s' % (k[0], k[1], sorted(v2)) for k, v2 in sorted(by.items()))))
