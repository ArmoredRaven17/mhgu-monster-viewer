"""A class's frame handler (vt+0x208) or action main, with every class key request logged as id -> key (the key the class's vt+0x1d0
passes to 0x6feb8 / 0x6fdd4 in r2), 0xa499c (r1), stops 0x329c40. Scenario: motion (e+0x4b4), action (e+0x73e0/1), rage (P+0x518),
tired (P+0x505), frame gates (sc frame), the 'ended' flag, posture, a ctl byte poke list.
   CLS=uEmNNN_00 EM=NN python classreq.py <fn: 208|main> <motion hex> <st> <n> [rage] [frame] [ended] [poke=off:val,...]"""
import sys, struct, os
import tracec as TR
from unicorn import UC_HOOK_CODE
from unicorn.arm_const import *
mu = TR.mu; E, P, C = TR.E, TR.P, TR.C
EV = []
def h(uc, addr, size, ud):
    if addr in (0x6feb8, 0x6fdd4): EV.append('KEY %d (arr %d)' % (uc.reg_read(UC_ARM_REG_R2), uc.reg_read(UC_ARM_REG_R1)))
    elif addr == 0xa499c: EV.append('A499C %d' % uc.reg_read(UC_ARM_REG_R1))
    elif addr == 0x329c40: EV.append('STOP')
    elif addr == 0xa3ddc: EV.append('BASEKEY id %d' % uc.reg_read(UC_ARM_REG_R1))
for a in (0x6feb8, 0x6fdd4, 0xa499c, 0x329c40, 0xa3ddc): mu.hook_add(UC_HOOK_CODE, h, begin=a, end=a)
ANS = {}
def hans(uc, addr, size, ud):
    if addr in ANS: uc.reg_write(UC_ARM_REG_R0, ANS[addr]); uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))
for a in (0x81670, 0x81614, 0xb0944, 0x7fed4): mu.hook_add(UC_HOOK_CODE, hans, begin=a, end=a)
# the class's own vt+0x1d0 runs natively (in band); 0x6feb8 / 0x6fdd4 are stubbed after the log
VT = TR.C_['vtable']
fn, motion, st, n = sys.argv[1], int(sys.argv[2], 16), int(sys.argv[3], 0), int(sys.argv[4], 0)
rage = int(sys.argv[5]) if len(sys.argv) > 5 else 0
frame = int(sys.argv[6]) if len(sys.argv) > 6 else 0
ended = int(sys.argv[7]) if len(sys.argv) > 7 else 0
pokes = [tuple(int(x, 0) for x in kv.split(':')) for kv in (sys.argv[8].split(',') if len(sys.argv) > 8 and sys.argv[8] else [])]
FN = struct.unpack_from('<I', TR.armdis.DATA, VT + 0x208 - TR.armdis.DA_VA)[0] if fn == '208' else TR.C_['main']
TR.sc = dict(ended=ended, frame=frame)
ANS[0x81670] = rage; ANS[0x81614] = int(os.environ.get('TIRED', '0')); ANS[0xb0944] = motion; ANS[0x7fed4] = int(os.environ.get('DYING', '0'))
mu.mem_write(E, b'\0' * 0x200000)
mu.mem_write(E, struct.pack('<I', VT)); mu.mem_write(E + 0x1428, struct.pack('<I', P)); mu.mem_write(E + 0xcac0, struct.pack('<I', C))
mu.mem_write(E + 0xb5f4, bytes([int(os.environ.get('EM', '0')), int(os.environ.get('VAR', '0'))]))
mu.mem_write(E + 0x73e0, bytes([st, n])); mu.mem_write(E + 0x4b4, struct.pack('<H', motion)); mu.mem_write(P + 0x518, bytes([rage]))
for off, val in pokes:
    base = E if off < 0x100000 else 0
    mu.mem_write(E + off, bytes([val]))
for kv in [x for x in os.environ.get('PPOKE', '').split(',') if x]:
    off, val = (int(x, 0) for x in kv.split(':')); mu.mem_write(P + off, bytes([val]))
mu.reg_write(UC_ARM_REG_R0, E); mu.reg_write(UC_ARM_REG_SP, 0x4000f000); mu.reg_write(UC_ARM_REG_LR, TR.STOP)
TR.cur.clear()
try: mu.emu_start(FN, TR.STOP, count=600000); err = ''
except Exception as ex: err = ' ERR %s pc=%#x' % (ex, mu.reg_read(UC_ARM_REG_PC))
print('%s %#x mot %#x act (%d,%#x) rage %d frame %d ended %d %s: %s%s' % (fn, FN, motion, st, n, rage, frame, ended, pokes, ' '.join(EV), err))
