import sys, os, io, contextlib
sys.path.insert(0, r'C:\MHGU-Extract\efx'); os.chdir(r'C:\MHGU-Extract\efx')
import efx_emu
from efx_load import LoadedEffect
from unicorn import UC_HOOK_CODE
from unicorn.arm_const import *
path = sys.argv[1]
hits = []
def before(x):
    uc = x.e.uc
    def _x(u, addr, size, ud):
        if len(hits) < 5:
            r = [u.reg_read(k) for k in (UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_LR, UC_ARM_REG_SP)]
            try: vt = int.from_bytes(bytes(u.mem_read(r[0], 4)), 'little')
            except Exception: vt = None
            st = []
            for i in range(400):
                try: st.append(int.from_bytes(bytes(u.mem_read(r[4] + 4 * i, 4)), 'little'))
                except Exception: break
            hits.append((r, vt, st))
    uc.hook_add(UC_HOOK_CODE, _x, begin=0, end=0)
efx_emu.PRE_OWNER_HOOKS[:] = [before]
sink = io.StringIO()
with contextlib.redirect_stdout(sink):
    x = LoadedEffect(path)
    r = x.start()
print('start', r, 'fault', x.e.fault)
for (r0, r1, r2, lr, sp), vt, st in hits:
    print('NULL CALL r0 %#x [r0] %s r1 %#x r2 %#x lr %#x sp %#x' % (r0, hex(vt) if vt else vt, r1, r2, lr, sp))
    print('  stack code-like words:', ' '.join(hex(w) for w in st if 0x10000 < w < 0x1600000))
