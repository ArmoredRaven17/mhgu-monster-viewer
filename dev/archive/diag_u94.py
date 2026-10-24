# Diagnostic: run vecdrawsched for Nakarkos u 94 under a scratch set name, with code hooks on the mode-4 camera lookup.
import os, sys, runpy, struct
EFX = r'C:\MHGU-Extract\efx'
os.chdir(EFX); sys.path.insert(0, EFX)
import effects_triage as T
import efx_emu
from unicorn import UC_HOOK_CODE
from unicorn.arm_const import UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3, UC_ARM_REG_SP

seen = {}
OUT = open(r'C:/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad/diag_u94.out', 'w')
def P(*a): OUT.write(' '.join(map(str, a)) + chr(10)); OUT.flush()
def hook(x):
    uc = x.e.uc
    def cb(u, a, s, ud):
        n = seen.get(a, 0)
        if n >= 4: return
        seen[a] = n + 1
        sp = u.reg_read(UC_ARM_REG_SP)
        rd = lambda o: struct.unpack('<I', u.mem_read(sp + o, 4))[0]
        P('HOOK %#x r0=%#x r1=%#x r2=%#x r3=%#x [sp+38]=%#x [sp+3c]=%#x' % (a, u.reg_read(UC_ARM_REG_R0), u.reg_read(UC_ARM_REG_R1),
              u.reg_read(UC_ARM_REG_R2), u.reg_read(UC_ARM_REG_R3), rd(0x38), rd(0x3c)))
    for a in (0x31d228, 0x31d298, 0x31d2a0, 0x31d38c, 0x31d394, 0x31d398, 0x31d470, 0x31f194, 0x31f198, 0x31f1a0, 0x31f4a4, 0x7c8f04):
        uc.hook_add(UC_HOOK_CODE, cb, begin=a, end=a)
    G = x.e.u32(0x211f504)
    P('DIAG G=%#x vp0 active=%d cam=%#x' % (G, x.e.uc.mem_read(G + 0x60, 1)[0], x.e.u32(G + 0x54)))
_orig_init = efx_emu.EfxEmu.__init__
def _init(self, *a, **k):
    _orig_init(self, *a, **k)
    hook(self)
efx_emu.EfxEmu.__init__ = _init

efl = T.efl_path('em084_00_060').replace(os.sep, '/')
os.environ.update(PARENT_JOINTS='joints/em084_00_viewer_rest.json', MODEL_MATERIAL_STUB='1', ED4_BACKOUT='1', GPU_DRAW_ROM='1')
sys.argv = ['vecdrawsched.py', 'diag_u94', '120', sys.argv[1] if len(sys.argv) > 1 else '1', '0:%s:em084_00u:94:UNIQUE' % efl]
runpy.run_path('vecdrawsched.py', run_name='__main__')
