# sw7.py: uEm043_00's status-7 switch 0xe7b1d4 (table 0xe7b200, number byte e+0x73e1, cases 0..0xa5) under unicorn, one run per
# number: the registers at the ONE call of the rock maker, `bl 0xe78e34` at 0xe7c084 (callers.py: its only caller), or where the
# case leaves the switch. A call out of the switch band (bl) is stepped over with r0 = 0 and reported, so a case whose path depends
# on a helper's answer is listed, not guessed.
import struct, sys
from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM, UC_HOOK_CODE
from unicorn.arm_const import *
import capstone
T = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
LO, HI = 0xe7b1d4, 0xe7c0d0
CALL = 0xe7c084
ENEMY, STACK = 0x40000000, 0x50000000
def run(n):
    mu = Uc(UC_ARCH_ARM, UC_MODE_ARM)
    size = (len(T) + 0xfff) & ~0xfff
    mu.mem_map(0, size); mu.mem_write(0, T)
    mu.mem_map(ENEMY, 0x20000); mu.mem_map(STACK - 0x10000, 0x20000)
    mu.mem_write(ENEMY + 0x73e0, bytes([7, n]))
    mu.reg_write(UC_ARM_REG_R0, ENEMY); mu.reg_write(UC_ARM_REG_SP, STACK); mu.reg_write(UC_ARM_REG_LR, 0xdead0000)
    out = {'n': n, 'calls': [], 'end': None}
    def hook(uc, addr, sz, ud):
        if addr == CALL:
            sp = uc.reg_read(UC_ARM_REG_SP)
            out['end'] = ('ROCK', uc.reg_read(UC_ARM_REG_R1), uc.reg_read(UC_ARM_REG_R2), uc.reg_read(UC_ARM_REG_R3), struct.unpack('<i', uc.mem_read(sp, 4))[0])
            uc.emu_stop(); return
        if not (LO <= addr < HI):
            out['end'] = ('LEFT', hex(addr)); uc.emu_stop(); return
        i = next(md.disasm(bytes(uc.mem_read(addr, 4)), addr), None)
        if i and i.mnemonic in ('bl', 'blx') and i.op_str.startswith('#'):
            t = int(i.op_str[1:], 16)
            if not (LO <= t < HI):
                out['calls'].append(hex(t)); uc.reg_write(UC_ARM_REG_R0, 0); uc.reg_write(UC_ARM_REG_PC, addr + 4)
    mu.hook_add(UC_HOOK_CODE, hook)
    try: mu.emu_start(LO, 0xdead0000, count=4000)
    except Exception as e: out['end'] = out['end'] or ('FAULT', str(e)[:40])
    return out
issued = set(int(x, 16) for x in sys.argv[1].split(',')) if len(sys.argv) > 1 else set()
rock = []
for n in range(0, 0xa6):
    o = run(n)
    e = o['end']
    if e and e[0] == 'ROCK':
        rock.append(n)
        print('(7, %#04x) ROCK r1 %d index %d kind %d sub %d%s%s' % (n, e[1], e[2], e[3], e[4], '  ISSUED' if n in issued else '', ('  calls ' + ' '.join(o['calls'])) if o['calls'] else ''))
print('rock cases', len(rock))
