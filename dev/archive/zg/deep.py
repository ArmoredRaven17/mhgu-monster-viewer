"""Deeper per-action probe over tracec: phases 0..9 x ended {0,1} x frame {0,1,20,40,80,160,999}, plus the landing physics
answered: 0xbf52c (the ground hit) returns HIT, and the float getter 0xc1010 returns s0 = PZ (what P+0x14, the vertical
speed, is stored from) -- unanswered, s0 is the previous run's leftover, so a plain sweep's landings depend on run order. Prints each distinct
MOT / SCRIPT / U1400 / follow line set with the first (phase, ended, frame) that produced it.
   CLS=uEmNNN_00 EM=NN [HIT=1] [PZ=-1] [MOTNOW=0x235] [FORCE=0x78b78=1,...] [PB=0x1a2=4,...] python deep.py var st n"""
import sys, re, os, struct, tracec as TR
from unicorn.arm_const import UC_ARM_REG_PC, UC_ARM_REG_S0
v, st, n = [int(x, 0) for x in sys.argv[1:4]]
HIT = int(os.environ.get('HIT', '0')); MOTNOW = int(os.environ.get('MOTNOW', '0'), 0);
FORCE = {int(a, 0): int(b, 0) for a, b in (x.split('=') for x in os.environ.get('FORCE', '').split(',') if x)}; PZ = float(os.environ.get('PZ', '0'))
_ret = TR.ret
def ret(uc, val):
    pc = uc.reg_read(UC_ARM_REG_PC)
    if HIT and pc == 0xbf52c: val = 1
    if MOTNOW and pc == 0xb0944: val = MOTNOW                  # the current-motion getter
    if pc in FORCE: val = FORCE[pc]                            # any stubbed callee's answer, FORCE=0xaddr=v,...
    if PZ and pc == 0xc1010: uc.reg_write(UC_ARM_REG_S0, struct.unpack('<I', struct.pack('<f', PZ))[0])   # the float getter: s0 = PZ
    _ret(uc, val)
TR.ret = ret
PB = {int(a, 0): int(b, 0) for a, b in (x.split('=') for x in os.environ.get('PB', '').split(',') if x)}   # P+off bytes, PB=0x1a2=4,...
_w = TR.mu.mem_write
def mw(addr, data):
    _w(addr, data)
    if addr == TR.E and len(data) == 0x200000:
        if PZ: _w(TR.P + 0x14, struct.pack('<f', PZ))
        for o, b in PB.items(): _w(TR.P + o, bytes([b]))
TR.mu.mem_write = mw
seen = {}
for ph in range(10):
    for e in (0, 1):
        for fr in (0, 1, 20, 40, 80, 160, 999):
            ev = [re.sub(r' start .*? b5f8=\d+', '', x) for x in TR.run(v, st, n, ph, e, fr, 0, follows=1)
                  if 'MOT' in x or 'SCRIPT' in x or 'U1400' in x or 'follow' in x]
            k = tuple(ev)
            if k and k not in seen: seen[k] = (ph, e, fr)
for k, w in seen.items(): print('ph%d e%d f%d' % w, ' || '.join(k))
