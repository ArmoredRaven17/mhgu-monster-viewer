"""cloak13.py (cv, 2026-10-22) -- the (1, 3) cloak body 0xe03b70 on tracec's machine, breaks none / horn / tail / both x the area gate 1 / 0:
does the setter 0xe03c78 run, and what +0x13 does it write. Control: gate 0 -> no setter.  CLS=uEm025_00 EM=25 python cloak13.py"""
import sys, os
sys.path.insert(0, r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\zg')
import tracec as TR
from unicorn import UC_HOOK_CODE, UC_HOOK_MEM_WRITE
from unicorn.arm_const import *
mu = TR.mu; E, P, C = TR.E, TR.P, TR.C
TR.NATIVE |= set(range(0xa3bf4, 0xa3c10))
HIT = []; LV = []
mu.hook_add(UC_HOOK_CODE, lambda u, a, s, d: HIT.append(a), begin=0xe03c78, end=0xe03c78)
def mw(u, acc, addr, size, val, ud):
    if addr == C + 0x13: LV.append(val & 0xff)
mu.hook_add(UC_HOOK_MEM_WRITE, mw, begin=C + 0x13, end=C + 0x13)
ST = {}
mu.hook_add(UC_HOOK_CODE, lambda u, a, s, d: mu.mem_write(P + 0x3b4, bytes([ST['b']])), begin=TR.C_['main'], end=TR.C_['main'])
def gate(u, a, s, d):
    u.reg_write(UC_ARM_REG_R0, ST['g']); u.reg_write(UC_ARM_REG_PC, u.reg_read(UC_ARM_REG_LR))
for g in (0x5bfb8, 0x5c1a8): mu.hook_add(UC_HOOK_CODE, gate, begin=g, end=g)
for bn, b in (('none', 0), ('horn', 2), ('tail', 1), ('both', 3)):
    for g in (1, 0):
        ST.update(b=b, g=g); out = set()
        for ph in (0, 1):
            for fr in (0, 1):
                HIT.clear(); LV.clear()
                TR.run(0, 1, 3, ph, 0, fr, 0, follows=0)
                if HIT: out.add('setter, +0x13=%s' % LV)
        print('(1,3) breaks %-4s gate %d: %s' % (bn, g, sorted(out) or 'no setter'))
