# p4entry.py (effects lane A4): the non-action entries that set posture 4, under p4trace.py's machine:
#   vt+0x1d8(e, mode)  for mode 0..3 (the reset / spawn; uEm045_00's mode 2 sets posture 4 and action (6, 5) -- 0xe8f28c)
#   vt+0x224(e, &status, &number)  (uEm043_00 0xe80e68: e+0x1404 |= 0x40000, posture 4, out (12, 0))
# 0x769f4 / 0x76a40 / 0x75230 / 0x76098 are logged with r1 / r2 and NOT stopped at (the reset goes on).
# usage: p4entry.py [class ...]  -> stdout
import sys, struct, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import p4trace as X
from unicorn.arm_const import *
SETA = (0x769f4, 0x76a40, 0x75230, 0x76098, 0x768c8, 0x7699c)
for a in SETA:
    X.CHG.pop(a, None)
def act(uc, addr):
    X.ev('ACT %#x(%d,%#x)' % (addr, uc.reg_read(UC_ARM_REG_R1) & 0xff, uc.reg_read(UC_ARM_REG_R2) & 0xff))
    X.ret(uc)
for a in SETA:
    X.EXTRA[a] = act

def call(cls, fn, r1, r2=0, r3=0, em=0, var=0):
    c = X.CLS[cls]
    X.rng[0], X.rng[1] = c['lo'], c['hi']
    X.mu.mem_write(X.E, b'\0' * 0x200000)
    X.mu.mem_write(X.E, struct.pack('<I', c['vtable']))
    X.mu.mem_write(X.E + 0x1428, struct.pack('<I', X.P))
    X.mu.mem_write(X.E + 0xcac0, struct.pack('<I', X.C))
    X.mu.mem_write(X.E + 0x75e8, struct.pack('<I', X.D - 0x98))
    X.mu.mem_write(X.D + 0x10, struct.pack('<f', X.MOG))
    X.mu.mem_write(X.E + 0xb5f4, bytes([em, var]))
    X.mu.reg_write(UC_ARM_REG_R0, X.E); X.mu.reg_write(UC_ARM_REG_R1, r1)
    X.mu.reg_write(UC_ARM_REG_R2, r2); X.mu.reg_write(UC_ARM_REG_R3, r3)
    X.mu.reg_write(UC_ARM_REG_SP, 0x4000f000); X.mu.reg_write(UC_ARM_REG_LR, X.STOP)
    X.st['passB'] = False; X.st['lastmot'] = 0
    X.cur.clear(); X.cur['ev'] = []
    try:
        X.mu.emu_start(fn, X.STOP, count=300000)
    except Exception as ex:
        X.ev('ERR %s @%#x' % (ex, X.mu.reg_read(UC_ARM_REG_PC)))
    return X.cur['ev']

if __name__ == '__main__':
    names = sys.argv[1:] or sorted(X.CLS)
    for cls in names:
        vt = X.CLS[cls]['vtable']
        for slot in (0x1d8, 0x224):
            fn = X.armdis.u32(vt + slot)
            if fn is None or not (X.CLS[cls]['lo'] <= fn < X.CLS[cls]['hi']):
                continue
            modes = range(4) if slot == 0x1d8 else [0]
            for md in modes:
                if slot == 0x224:
                    X.mu.mem_write(0x40008000, b'\0' * 8)
                    evs = call(cls, fn, 0x40008000, 0x40008004)
                    out = X.mu.mem_read(0x40008000, 8)
                    evs = evs + ['OUT (%d, %#x)' % (out[0], out[4])]
                else:
                    evs = call(cls, fn, md)
                if any(('POST 4' in e) or e.startswith(('SET', 'ADD', 'BCA', 'W5C', 'VT3E8', 'SH4')) for e in evs):
                    print('%s vt+%#x %#x mode %d: %s' % (cls, slot, fn, md, ' | '.join(evs)))
