# actpost.py: Alatreon's action main vt+0x1f4 0xeccc1c under unicorn, for every (status 0..0x11, number 0..0xff) and phase byte
# [e+0x1428]+0x1a1 = 0..7: the posture setter calls (0xbc7f4 r1 = the posture; 0xbc984 = posture 1, s0 its lift) and the setMotion calls
# (0xafce8 / 0xafe84 / 0xafef0 / 0xafe8c r1 = the motion id) each phase's run reaches, in order. Every call out of the class band
# 0xec4890..0xed0834 returns at once with r0 = RET (run twice: 0 and 1, so the "motion ended" / "frame passed" tests go both ways); the
# vt calls through the enemy's vtable resolve to the real class vtable 0x17c7254 (main.data). A run stops at the action main's return.
import struct, sys, json
from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM, UC_HOOK_CODE, UC_HOOK_MEM_UNMAPPED, UC_PROT_ALL
from unicorn.arm_const import *
EX = r'C:\MHGU-ROM\exefs'
T = open(EX + r'\main.text', 'rb').read(); RO = open(EX + r'\main.rodata', 'rb').read(); DA = open(EX + r'\main.data', 'rb').read()
RO_VA, DA_VA = 0x13EF000, 0x1728000
LO, HI = 0xec4890, 0xed0834
MAIN = 0xeccc1c
VT = 0x17c7254
ENEMY, BLK, STACK, RETA = 0x40000000, 0x41000000, 0x50000000, 0x60000000
POST = {0xbc7f4, 0xbc984}; MOT = {0xafce8, 0xafe84, 0xafef0, 0xafe8c}
def page(n): return (n + 0xfff) & ~0xfff
MU = None
HOOK = [None]
SUB = [0]
def mk():
    mu = Uc(UC_ARCH_ARM, UC_MODE_ARM)
    mu.mem_map(0, page(len(T))); mu.mem_write(0, T)
    mu.mem_map(RO_VA, page(len(RO))); mu.mem_write(RO_VA, RO)
    mu.mem_map(DA_VA, page(len(DA)) + 0x200000); mu.mem_write(DA_VA, DA)
    mu.mem_map(ENEMY, 0x20000); mu.mem_map(BLK, 0x10000); mu.mem_map(STACK - 0x20000, 0x40000); mu.mem_map(RETA, 0x1000)
    return mu
ZE, ZB = bytes(0x20000), bytes(0x10000)
def run(st, n, ph, RET):
    global MU
    if MU is None:
        MU = mk()
        def unm(uc, access, addr, size, value, ud):
            try: uc.mem_map(addr & ~0xfff, 0x1000); return True
            except Exception: return False
        MU.hook_add(UC_HOOK_MEM_UNMAPPED, unm)
        MU.hook_add(UC_HOOK_CODE, lambda uc, addr, sz, ud: HOOK[0](uc, addr, sz, ud))
    mu = MU
    mu.mem_write(ENEMY, ZE); mu.mem_write(BLK, ZB)
    mu.mem_write(ENEMY, struct.pack('<I', VT))
    mu.mem_write(ENEMY + 0x1428, struct.pack('<I', BLK))
    mu.mem_write(ENEMY + 0x73e0, bytes([st, n]))
    mu.mem_write(BLK + 0x1a1, bytes([ph, SUB[0]]))
    for r in (UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3, UC_ARM_REG_R4, UC_ARM_REG_R5, UC_ARM_REG_R6, UC_ARM_REG_R7, UC_ARM_REG_R8): mu.reg_write(r, 0)
    mu.reg_write(UC_ARM_REG_R0, ENEMY); mu.reg_write(UC_ARM_REG_SP, STACK); mu.reg_write(UC_ARM_REG_LR, RETA)
    mu.reg_write(UC_ARM_REG_C1_C0_2, mu.reg_read(UC_ARM_REG_C1_C0_2) | (0xf << 20)); mu.reg_write(UC_ARM_REG_FPEXC, 0x40000000)   # VFP on
    ev = []
    def hook(uc, addr, sz, ud):
        if addr == RETA: uc.emu_stop(); return
        if LO <= addr < HI: return
        if addr in POST:
            if addr == 0xbc7f4: ev.append(('P', uc.reg_read(UC_ARM_REG_R1)))
            else: ev.append(('P', 1))
        elif addr in MOT:
            m = uc.reg_read(UC_ARM_REG_R1) & 0xffff
            ev.append(('M', m))
        # any call out of the band: return at once
        uc.reg_write(UC_ARM_REG_R0, RET)
        uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))
    HOOK[0] = hook
    try: mu.emu_start(MAIN, RETA, count=200000)
    except Exception as e: ev.append(('ERR', str(e)[:30]))
    newph = mu.mem_read(BLK + 0x1a1, 1)[0]
    return ev, newph
res = {}
# pass 1: phase 0, RET 0 -- which (status, number) do anything (an event, or a phase written)
live = []
for st in range(0, 0x12):
    for n in range(0, 0x100):
        ev, nph = run(st, n, 0, 0)
        if ev or nph != 0: live.append((st, n))
print('live actions', len(live))
# pass 2: phases 0..7 x sub-phase +0x1a2 0..3 x RET 0 / 1
for st, n in live:
    rows = []
    for ph in range(0, 8):
        for sub in range(0, 4):
            for RET in (0, 1):
                SUB[0] = sub
                ev, nph = run(st, n, ph, RET)
                if any(e[0] in ('P', 'M') for e in ev): rows.append({'ph': ph, 'sub': sub, 'ret': RET, 'ev': ev, 'next': nph})
    SUB[0] = 0
    if rows: res['%d:%#x' % (st, n)] = rows
json.dump(res, open(sys.argv[1], 'w'))
print(len(res), 'actions with posture / motion calls')
