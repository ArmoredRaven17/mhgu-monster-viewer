# initwr.py <ctor> <init> [gid]: run a shell class's ctor then its init (vt+0x13c) under unicorn, natively except the
# ShellParam getters (probe values) and the global id; log every write that lands in shell+0x1580..+0x1700 with the
# writing pc, and every READ of the owner object's bytes (owner = a fake enemy at 0x30000000, returned by 0x4a0f00).
import struct, sys
from unicorn import *
from unicorn.arm_const import *
EX = r'C:\MHGU-ROM\exefs'
T = open(EX + r'\main.text', 'rb').read(); RO = open(EX + r'\main.rodata', 'rb').read(); DA = open(EX + r'\main.data', 'rb').read()
RO_VA, DA_VA = 0x13EF000, 0x1728000
ctor, init = int(sys.argv[1], 16), int(sys.argv[2], 16); gid = int(sys.argv[3], 0) if len(sys.argv) > 3 else 0
OWN = 0x30000000; S = 0x40000000; SET = 0x41000000; STK = 0x50000000; RET = 0x60000000
mu = Uc(UC_ARCH_ARM, UC_MODE_ARM)
pg = lambda n: (n + 0xfff) & ~0xfff
mu.mem_map(0, pg(len(T))); mu.mem_write(0, T)
mu.mem_map(RO_VA, pg(len(RO))); mu.mem_write(RO_VA, RO)
mu.mem_map(DA_VA, pg(len(DA)) + 0x800000); mu.mem_write(DA_VA, DA)
mu.mem_map(OWN, 0x20000); mu.mem_map(S, 0x10000); mu.mem_map(SET, 0x1000); mu.mem_map(STK - 0x40000, 0x80000); mu.mem_map(RET, 0x1000)
# owner: held aura IDs 1 at +0xca88 / +0xca9c, hyper +0xb720 = 1, action +0x4b4
mu.mem_write(OWN + 0xb720, b'\x01'); mu.mem_write(OWN + 0xca88, b'\x01'); mu.mem_write(OWN + 0xca9c, b'\x01')
mu.mem_write(OWN + 0xc, struct.pack("<I", 1)); mu.mem_write(OWN + 0x1052, bytes([1]))
mu.reg_write(UC_ARM_REG_C1_C0_2, mu.reg_read(UC_ARM_REG_C1_C0_2) | (0xf << 20)); mu.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
GET = {0x4a2470: 'int', 0x4a24f8: 'float', 0x4a2584: 'vec', 0x4a22f0: 'ef', 0x4a23f4: 'hit', 0x4a2378: 'snd', 0x4a2224: 'cint', 0x4a2264: 'cfloat', 0x4a22a8: 'cvec'}
log = []
phase = ['ctor']
def hook(uc, addr, sz, ud):
    if addr == RET: uc.emu_stop(); return
    lr = uc.reg_read(UC_ARM_REG_LR)
    if 0x13ec000 <= addr < 0x13ef000:
        log.append((phase[0], 'PLT', hex(addr), 0, uc.reg_read(UC_ARM_REG_R0), hex(lr))); uc.reg_write(UC_ARM_REG_PC, lr); return
    if addr in (0x4a10c8, 0x4a11e4, 0xbe518, 0x43ab74):
        log.append((phase[0], 'STUB', hex(addr), 0, 0, hex(lr))); uc.reg_write(UC_ARM_REG_R0, 0); uc.reg_write(UC_ARM_REG_PC, lr); return
    if addr == 0x4a0ecc:
        uc.reg_write(UC_ARM_REG_R0, gid); uc.reg_write(UC_ARM_REG_PC, lr); return
    if addr == 0x4a0f00:
        uc.reg_write(UC_ARM_REG_R0, OWN); uc.reg_write(UC_ARM_REG_PC, lr); return
    if addr in GET:
        k = uc.reg_read(UC_ARM_REG_R1); kind = GET[addr]
        if kind == 'int': uc.reg_write(UC_ARM_REG_R0, 1000 + k)
        elif kind in ('float', 'cfloat'): uc.reg_write(UC_ARM_REG_S0, struct.unpack('<I', struct.pack('<f', 2000.0 + k))[0])
        elif kind in ('vec', 'cvec'):
            p = SET + 0x900 + 0x10 * (k & 0xf)
            uc.mem_write(p, struct.pack('<3f', 1.0, 1.0, 1.0))
            uc.reg_write(UC_ARM_REG_R0, p)
        else: uc.reg_write(UC_ARM_REG_R0, 3000 + k)
        uc.reg_write(UC_ARM_REG_PC, lr); return
mu.hook_add(UC_HOOK_CODE, hook)
def wr(uc, access, addr, size, value, ud):
    if S + 0x1580 <= addr < S + 0x1700:
        log.append((phase[0], 'W', hex(addr - S), size, value & 0xffffffff, hex(uc.reg_read(UC_ARM_REG_PC))))
mu.hook_add(UC_HOOK_MEM_WRITE, wr)
def rdo(uc, access, addr, size, value, ud):
    if OWN <= addr < OWN + 0x20000:
        log.append((phase[0], 'R-owner', hex(addr - OWN), size, None, hex(uc.reg_read(UC_ARM_REG_PC))))
mu.hook_add(UC_HOOK_MEM_READ, rdo)
def unm(uc, access, addr, size, value, ud):
    try: uc.mem_map(addr & ~0xfff, 0x1000); return True
    except Exception: return False
mu.hook_add(UC_HOOK_MEM_UNMAPPED, unm)
def run(pc, r0, r1, n):
    mu.reg_write(UC_ARM_REG_R0, r0); mu.reg_write(UC_ARM_REG_R1, r1); mu.reg_write(UC_ARM_REG_SP, STK); mu.reg_write(UC_ARM_REG_LR, RET)
    try: mu.emu_start(pc, RET, count=n); return None
    except Exception as e: return '%s at %x' % (str(e)[:40], mu.reg_read(UC_ARM_REG_PC))
print('ctor', run(ctor, S, 0, 200000))
# setup as d16f48 builds it: +4 resource, +8 mode 0, +0xc owner
mu.mem_write(SET + 4, struct.pack('<I', 0x41000800)); mu.mem_write(SET + 8, struct.pack('<I', 0)); mu.mem_write(SET + 0xc, struct.pack('<I', OWN))
mu.mem_write(S + 4, b'\x00')
mu.mem_write(S + 0x1384, struct.pack("<I", SET + 0x800)); mu.mem_write(SET + 0x850, bytes([1]))
phase[0] = 'init'
print('init', run(init, S, SET, 2000000)); print([hex(x) for x in TR]) if 'TR' in globals() else None
for l in log:
    if l[1] in ('W','PLT') or l[0] == 'init': print(l)
print('+0x1620 =', hex(struct.unpack('<I', mu.mem_read(S + 0x1620, 4))[0]), '+0x15bc =', hex(struct.unpack('<I', mu.mem_read(S + 0x15bc, 4))[0]), '+0x15a8 =', hex(struct.unpack('<I', mu.mem_read(S + 0x15a8, 4))[0]))
