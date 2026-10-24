# emu_kill.py -- his damage step 0x97d20 run on the ROM (everything native; unmapped reads answered with zero pages), with a
# PENDING HIT of kind 0xa (her M79's record 0x23: P+0x444 set, P+0x484 = 0xa) while he is frozen (P+0x3a8 bit 0x80, his 1:0x21),
# in the air (posture P+0x1ba 1), em 0x4c, sub 0 (e+0xb5f4 / +0xb5f7). Cases: the reaction lock P+0x3a2 = 2 (his 1:0x21 sets it
# every frame) and 0 (cleared from her M79 frame 80, 0xc0368). Controls: kind 2 (her 0x2b's kind), no freeze flag, posture 0 with
# em 0x45 (not him). Recorded: HP P+0x370 before / after, the reaction P+0x3ae, P+0x444 after, the action change requests.
import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\notice-scratch')
import armdis, emclasses
from unicorn import *
from unicorn.arm_const import *
T = armdis.TEXT
CLS = emclasses.load()
E = 0x30000000; P = 0x30100000; C = 0x30180000; STOP = 0x50000000
def mk():
    mu = Uc(UC_ARCH_ARM, UC_MODE_ARM)
    try: mu.ctl_set_cpu_model(UC_CPU_ARM_MAX)
    except Exception: pass
    mu.mem_map(0, (len(T) + 0xfff) & ~0xfff); mu.mem_write(0, T)
    ro = armdis.RO_VA & ~0xfff
    mu.mem_map(ro, ((armdis.RO_VA + len(armdis.RODATA) - ro) + 0xfff) & ~0xfff); mu.mem_write(armdis.RO_VA, armdis.RODATA)
    da = armdis.DA_VA & ~0xfff
    mu.mem_map(da, ((armdis.DA_VA + len(armdis.DATA) - da) + 0x800000 + 0xfff) & ~0xfff); mu.mem_write(armdis.DA_VA, armdis.DATA)
    mu.mem_map(E, 0x400000); mu.mem_map(0x40000000, 0x10000); mu.mem_map(STOP, 0x1000)
    mu.reg_write(UC_ARM_REG_C1_C0_2, mu.reg_read(UC_ARM_REG_C1_C0_2) | (0xf << 20)); mu.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
    return mu
def run(kind=0xa, freeze=True, posture=1, em=0x4c, lock=0, hp=3000):
    mu = mk()
    w32 = lambda a, v: mu.mem_write(a, struct.pack('<I', v & 0xffffffff))
    wf = lambda a, v: mu.mem_write(a, struct.pack('<f', v))
    r32 = lambda a: struct.unpack('<i', bytes(mu.mem_read(a, 4)))[0]
    w32(E, CLS['uEm076_00']['vtable']); w32(E + 0x1428, P); w32(E + 0xcac0, C); w32(E + 0xc, 1)
    mu.mem_write(E + 0x73e0, bytes([1, 0x21])); mu.mem_write(E + 0xb5f4, bytes([em, 0, 0, 0]))
    mu.mem_write(E + 0x7420, b'\x01')                       # the unit is live (0x97d54 returns at once when 0)
    w32(P + 0x370, hp); w32(P + 0x374, 3000); wf(P + 0x380, -1.0)
    mu.mem_write(P + 0x444, b'\1'); mu.mem_write(P + 0x484, bytes([kind])); mu.mem_write(P + 0x3a8, bytes([0x80 if freeze else 0]))
    mu.mem_write(P + 0x1ba, bytes([posture])); mu.mem_write(P + 0x3a2, bytes([lock]))
    log = {'changes': [], 'writes': {}}
    def onbad(uc, typ, addr, size, value, ud):
        try: uc.mem_map(addr & ~0xfff, 0x1000); return True
        except Exception: return False
    mu.hook_add(UC_HOOK_MEM_READ_UNMAPPED | UC_HOOK_MEM_WRITE_UNMAPPED | UC_HOOK_MEM_FETCH_UNMAPPED, onbad)
    WATCH = {P + 0x370: 'HP', P + 0x3ae: 'reaction', P + 0x444: 'pending'}
    def mh(uc, access, addr, size, value, ud):
        for a, nm in WATCH.items():
            if addr <= a < addr + size: log['writes'].setdefault(nm, []).append((value, hex(uc.reg_read(UC_ARM_REG_PC))))
    mu.hook_add(UC_HOOK_MEM_WRITE, mh, begin=P, end=P + 0x1000)
    def ch(uc, addr, size, ud):
        if addr in (0x768c8, 0x75230, 0x76098, 0x7699c, 0x76a40):
            log['changes'].append((hex(addr), uc.reg_read(UC_ARM_REG_R1), hex(uc.reg_read(UC_ARM_REG_R2)), hex(uc.reg_read(UC_ARM_REG_LR))))
    mu.hook_add(UC_HOOK_CODE, ch, begin=0x75000, end=0x77000)
    mu.reg_write(UC_ARM_REG_SP, 0x4000f000); mu.reg_write(UC_ARM_REG_R0, E); mu.reg_write(UC_ARM_REG_LR, STOP)
    try:
        mu.emu_start(0x97d20, STOP, count=3000000)
        end = 'ok' if mu.reg_read(UC_ARM_REG_PC) == STOP else 'budget at %#x' % mu.reg_read(UC_ARM_REG_PC)
    except Exception as ex:
        end = 'err %s at %#x' % (ex, mu.reg_read(UC_ARM_REG_PC))
    return {'HP': r32(P + 0x370), 'reaction': struct.unpack('<H', bytes(mu.mem_read(P + 0x3ae, 2)))[0], 'pending': mu.mem_read(P + 0x444, 1)[0],
            'end': end, 'writes': log['writes'], 'changes': log['changes']}
if __name__ == '__main__':
    for name, kw in [('THE CASE: kind 0xa, frozen, air, em 0x4c, lock 0', {}),
                     ('locked (P+0x3a2 = 2, before her M79 f80)', {'lock': 2}),
                     ('control: kind 2 (her 0x2b)', {'kind': 2}),
                     ('control: not frozen', {'freeze': False}),
                     ('control: em 0x45 (her id), air', {'em': 0x45})]:
        print(name, run(**kw))
