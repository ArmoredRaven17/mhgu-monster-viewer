"""cloakact.py -- a Chameleos action's main run on the ROM (tracec) per phase with a latched cloak up, horn / tail as given:
the motion it sets and ctl+0xc / +0x13 / +0x16 after, plus every write to ctl+0xc.  CLS=uEm025_00 EM=25 python cloakact.py st n"""
import sys, struct
import tracec as TR
from unicorn import UC_HOOK_MEM_WRITE
from unicorn.arm_const import *
mu = TR.mu; E, P, C = TR.E, TR.P, TR.C
W = []
def mw(u, acc, addr, size, val, ud):
    if addr in (C + 0xc, C + 0x13, C + 0x16): W.append((hex(addr - C), val, hex(u.reg_read(UC_ARM_REG_PC))))
mu.hook_add(UC_HOOK_MEM_WRITE, mw, begin=C, end=C + 0x20)
st, n = int(sys.argv[1], 0), int(sys.argv[2], 0)
horn, tail = int(sys.argv[3]) if len(sys.argv) > 3 else 0, int(sys.argv[4]) if len(sys.argv) > 4 else 0
orig = TR.run
for ph in range(6):
    for fr in (0, 1):
        W.clear()
        # TR.run zeroes E; poke the cloak in its hook: patch mem after its own writes via the scenario dict
        TR.sc_pre = None
        out = []
        mu.mem_write(E, b'\0' * 0x200000)
        def pre():
            mu.mem_write(C + 0xc, bytes([1])); mu.mem_write(C + 0x13, bytes([2])); mu.mem_write(C + 0x15, bytes([2])); mu.mem_write(C + 0x16, bytes([1]))
            mu.mem_write(P + 0x3b4, bytes([(2 if horn else 0) | (1 if tail else 0)]))
        # run(): writes E fresh, so hook its first instruction
        from unicorn import UC_HOOK_CODE
        h = mu.hook_add(UC_HOOK_CODE, lambda u, a, s, d: pre(), begin=TR.C_['main'], end=TR.C_['main'])
        ev = TR.run(0, st, n, ph, 0, fr, 0, follows=0)
        mu.hook_del(h)
        mots = [e for e in ev if 'MOT' in e]
        print('phase %d frame %d: %s | ctl writes %s | after c=%d 13=%d 16=%d' % (ph, fr, ' / '.join(m.split(' start')[0] for m in mots)[:80], W,
              mu.mem_read(C + 0xc, 1)[0], mu.mem_read(C + 0x13, 1)[0], mu.mem_read(C + 0x16, 1)[0]))
