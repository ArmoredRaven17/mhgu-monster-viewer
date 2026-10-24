# debug wrapper for vecdrawsched.py: prints every stop call and every 0x327e7c entry's unit state (no change to the recorder)
import sys, os, runpy, struct
EFX = 'C:/MHGU-Extract/efx'
sys.path.insert(0, EFX); sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); os.chdir(EFX)
import vectors_dbg
sys.modules["vectors"] = vectors_dbg
import efx_draw
import proofunit
from unicorn import UC_HOOK_CODE
from unicorn.arm_const import UC_ARM_REG_R0, UC_ARM_REG_LR
orig = proofunit._call
hooked = {}
def u32(uc, a): return struct.unpack('<I', bytes(uc.mem_read(a, 4)))[0]
def u8(uc, a): return bytes(uc.mem_read(a, 1))[0]
def _call(x, addr, args, label):
    if id(x) not in hooked:
        hooked[id(x)] = 1
        def cb(uc, a, sz, ud):
            r0 = uc.reg_read(UC_ARM_REG_R0)
            print('END327e7c u %#x vt %#x +c %#x +118 %#x +29b %d +364 %d +368 %d lr %#x' % (r0, u32(uc, r0), u32(uc, r0 + 0xc), u32(uc, r0 + 0x118),
                  u8(uc, r0 + 0x29b), u8(uc, r0 + 0x364), u32(uc, r0 + 0x368), uc.reg_read(UC_ARM_REG_LR)), file=sys.stderr, flush=True)
        x.e.uc.hook_add(UC_HOOK_CODE, cb, begin=0x327e7c, end=0x327e7c)
    if addr == 0x329c40:
        print('STOPCALL %s core %#x' % (label, args[0]), file=sys.stderr, flush=True)
    return orig(x, addr, args, label)
proofunit._call = _call
sys.argv = ['vecdrawsched.py'] + sys.argv[1:]
runpy.run_path('vecdrawsched.py', run_name='__main__')
