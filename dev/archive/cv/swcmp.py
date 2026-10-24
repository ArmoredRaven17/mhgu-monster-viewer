"""swcmp.py (cv, 2026-10-22) -- the EMC switch compare 0x8e088(e, cursor, op, kind) run natively on unicorn for a synthetic block
`op 00 | op 01 CASE | 39 | op 02 | 39 | op ff` and every value v (the switch value on the stack): which values take the case.
   python swcmp.py op kind case_hex [case2 ...]"""
import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
from unicorn import *
from unicorn.arm_const import *
op = int(sys.argv[1], 16); kind = int(sys.argv[2], 16); cases = [bytes.fromhex(c) for c in sys.argv[3:]]
T = armdis.TEXT
mu = Uc(UC_ARCH_ARM, UC_MODE_ARM)
try: mu.ctl_set_cpu_model(UC_CPU_ARM_MAX)
except Exception: pass
mu.mem_map(0, (len(T) + 0xfff) & ~0xfff); mu.mem_write(0, T)
ro = armdis.RO_VA & ~0xfff
mu.mem_map(ro, ((armdis.RO_VA + len(armdis.RODATA) - ro) + 0xfff) & ~0xfff); mu.mem_write(armdis.RO_VA, armdis.RODATA)
da = armdis.DA_VA & ~0xfff
mu.mem_map(da, ((armdis.DA_VA + len(armdis.DATA) - da) + 0x800000 + 0xfff) & ~0xfff); mu.mem_write(armdis.DA_VA, armdis.DATA)
E = 0x30000000; BUF = 0x40000000; STK = 0x41000000; STOP = 0x50000000
mu.mem_map(E, 0x400000); mu.mem_map(BUF, 0x10000); mu.mem_map(STK, 0x10000); mu.mem_map(STOP, 0x1000)
mu.reg_write(UC_ARM_REG_C1_C0_2, mu.reg_read(UC_ARM_REG_C1_C0_2) | (0xf << 20)); mu.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
blk = bytes([op, 0])
for c in cases: blk += bytes([op, 1]) + c + bytes([0x39])
blk += bytes([op, 2, 0x39, op, 0xff])
mu.mem_write(BUF, blk)
outs = {}
for v in range(-256, 0x10000):
    if v > 0x100 and v & 0xff: continue
    sp = STK + 0x8000
    mu.mem_write(sp, struct.pack('<i', v))
    mu.reg_write(UC_ARM_REG_SP, sp); mu.reg_write(UC_ARM_REG_LR, STOP)
    mu.reg_write(UC_ARM_REG_R0, E); mu.reg_write(UC_ARM_REG_R1, BUF + 1); mu.reg_write(UC_ARM_REG_R2, op); mu.reg_write(UC_ARM_REG_R3, kind)
    try:
        mu.emu_start(0x8e088, STOP, count=200000); r = mu.reg_read(UC_ARM_REG_R0)
    except UcError as ex:
        r = 'ERR %s @%#x' % (ex, mu.reg_read(UC_ARM_REG_PC))
    outs.setdefault(r, []).append(v)
print('block', blk.hex(' '))
for r, vs in outs.items():
    small = [x for x in vs if -256 <= x < 0x100]
    print('advance', r, 'for', len(vs), 'values; in -256..255:', (small if len(small) < 40 else '%d values (%d..%d)' % (len(small), small[0], small[-1])), 'big:', [hex(x) for x in vs if x >= 0x100][:12])
