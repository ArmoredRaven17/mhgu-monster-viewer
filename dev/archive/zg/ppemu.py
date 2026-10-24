"""Run a class's part pass vt+0x210 with every part's break level answered (0x9d36c(e, part) -> LV[part]) and print the sets it
applies (0x72c78 r1). CLS / EM / VAR env; P+0x3b4 from SEVBITS (hex), rage from RAGE, rank from RANK (0x3a8430 answer, default 3).
The .dtp row array is the real file's (e+0x75f0 -> +0x64 rows).   python ppemu.py <mon> 'part:lv,part:lv' ..."""
import sys, struct, os
import tracec as TR
from unicorn import UC_HOOK_CODE
from unicorn.arm_const import *
mu = TR.mu; E, P = TR.E, TR.P
mon = sys.argv[1]
dtp = open(r'C:\MHGU-Extract\scratch-em\%s\enemy\dt_base\%s_dtbparts.dtp' % (mon, mon), 'rb').read()
n = dtp[8]; rows = b''.join(dtp[0x4d + 4 * i:0x4d + 4 * i + 4] for i in range(n))
DT = 0x30190000; ARR = 0x30191000
LV = {}; SETS = []
def h(uc, addr, size, ud):
    if addr == 0x9d36c:
        uc.reg_write(UC_ARM_REG_R0, LV.get(uc.reg_read(UC_ARM_REG_R1), 0)); uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))
    elif addr == 0x72c78:
        SETS.append(uc.reg_read(UC_ARM_REG_R1)); uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))
    elif addr == 0x3a8430:
        uc.reg_write(UC_ARM_REG_R0, int(os.environ.get('RANK', '3'))); uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))
for a in (0x9d36c, 0x72c78, 0x3a8430): mu.hook_add(UC_HOOK_CODE, h, begin=a, end=a)
VT = TR.C_['vtable']; FN = struct.unpack_from('<I', TR.armdis.DATA, VT + 0x210 - TR.armdis.DA_VA)[0]
try: mu.mem_map(DT, 0x2000)
except Exception: pass
for spec in sys.argv[2:]:
    LV.clear(); SETS.clear()
    for kv in filter(None, spec.split(',')):
        k, v = kv.split(':'); LV[int(k)] = int(v)
    mu.mem_write(E, b'\0' * 0x200000)
    mu.mem_write(E, struct.pack('<I', VT)); mu.mem_write(E + 0x1428, struct.pack('<I', P)); mu.mem_write(E + 0xcac0, struct.pack('<I', TR.C))
    mu.mem_write(E + 0xb5f4, bytes([int(os.environ.get('EM', '0')), int(os.environ.get('VAR', '0'))]))
    mu.mem_write(DT, b'\0' * 0x2000); mu.mem_write(DT + 0x64, struct.pack('<I', ARR)); mu.mem_write(ARR, rows)
    mu.mem_write(E + 0x75f0, struct.pack('<I', DT))
    mu.mem_write(P + 0x3b4, struct.pack('<H', int(os.environ.get('SEVBITS', '0'), 16))); mu.mem_write(P + 0x518, bytes([int(os.environ.get('RAGE', '0'))]))
    mu.reg_write(UC_ARM_REG_R0, E); mu.reg_write(UC_ARM_REG_SP, 0x4000f000); mu.reg_write(UC_ARM_REG_LR, TR.STOP)
    try: mu.emu_start(FN, TR.STOP, count=400000); err = ''
    except Exception as ex: err = ' ERR %s pc=%#x' % (ex, mu.reg_read(UC_ARM_REG_PC))
    print('%s fn %#x [%s] -> sets %s%s' % (mon, FN, spec, SETS, err))
