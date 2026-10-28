# auramodes.py: for the classes whose reader writes an aura ID (auraclass.json), each MODE's reader run with that mode's own ShellParam
# ints / floats (SHELL_DATA via modes.json): the aura-ID field and the flags word the base init tests for the hit side's +0x15ac
# (base00: +0x15e8 bit 0x800 at 0x3f9308; base01: +0x15ec bit 0x1000 = +0x15ed bit 4 at 0x3fae20; base13: none read -> eligible).
import json, struct, sys, importlib.util
spec = importlib.util.spec_from_file_location('ac', sys.argv[1]); src = open(sys.argv[1], encoding='utf8').read()
src = src[:src.index('classes = json.load')]
ns = {'__name__': 'ac'}; exec(compile(src, 'ac', 'exec'), ns)
from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM, UC_HOOK_CODE, UC_HOOK_MEM_UNMAPPED
from unicorn.arm_const import *
T, RO, DA, RO_VA, DA_VA = ns['T'], ns['RO'], ns['DA'], ns['RO_VA'], ns['DA_VA']
def run(reader, vt, gid, ints, floats, fields):
    mu = Uc(UC_ARCH_ARM, UC_MODE_ARM); pg = lambda n: (n + 0xfff) & ~0xfff
    mu.mem_map(0, pg(len(T))); mu.mem_write(0, T); mu.mem_map(RO_VA, pg(len(RO))); mu.mem_write(RO_VA, RO)
    mu.mem_map(DA_VA, pg(len(DA)) + 0x400000); mu.mem_write(DA_VA, DA)
    S, STK, RET = 0x40000000, 0x50000000, 0x60000000
    mu.mem_map(S, 0x10000); mu.mem_map(STK - 0x20000, 0x40000); mu.mem_map(RET, 0x1000)
    for fo, dv in fields.items(): mu.mem_write(S + fo, struct.pack('<i', dv))
    mu.mem_write(S, struct.pack('<I', vt))
    mu.reg_write(UC_ARM_REG_C1_C0_2, mu.reg_read(UC_ARM_REG_C1_C0_2) | (0xf << 20)); mu.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
    def hook(uc, addr, sz, ud):
        if addr == RET: uc.emu_stop(); return
        if addr == 0x4a0ecc: uc.reg_write(UC_ARM_REG_R0, gid); uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR)); return
        if addr == 0x4a2470:
            k = uc.reg_read(UC_ARM_REG_R1); dflt = uc.reg_read(UC_ARM_REG_R2)
            uc.reg_write(UC_ARM_REG_R0, (ints[k] if k < len(ints) else dflt) & 0xffffffff); uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR)); return
        if addr == 0x4a24f8:
            k = uc.reg_read(UC_ARM_REG_R1); v = floats[k] if k < len(floats) else 0.0
            uc.reg_write(UC_ARM_REG_S0, struct.unpack('<I', struct.pack('<f', v))[0]); uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR)); return
        if addr in (0x4a2584, 0x4a22a8):
            p = uc.reg_read(UC_ARM_REG_R2)
            try: uc.mem_write(p, struct.pack('<3f', 0, 0, 0))
            except Exception: pass
            uc.reg_write(UC_ARM_REG_R0, p); uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR)); return
        if addr in (0x4a22f0, 0x4a23f4, 0x4a2378, 0x4a2224, 0x4a2264):
            uc.reg_write(UC_ARM_REG_R0, 0); uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR)); return
        if not (0xcec000 <= addr < 0x1100000 or 0x3f0000 <= addr < 0x440000):
            uc.reg_write(UC_ARM_REG_R0, 0); uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))
    mu.hook_add(UC_HOOK_CODE, hook)
    def unm(uc, access, addr, size, value, ud):
        try: uc.mem_map(addr & ~0xfff, 0x1000); return True
        except Exception: return False
    mu.hook_add(UC_HOOK_MEM_UNMAPPED, unm)
    mu.reg_write(UC_ARM_REG_R0, S); mu.reg_write(UC_ARM_REG_SP, STK); mu.reg_write(UC_ARM_REG_LR, RET)
    try: mu.emu_start(reader, RET, count=200000)
    except Exception: pass
    return {fo: struct.unpack('<i', mu.mem_read(S + fo, 4))[0] for fo in fields}
ac = json.load(open(sys.argv[2])); modes = json.load(open(sys.argv[3])); classes = json.load(open(sys.argv[4]))
FL = {'base00': (0x15e8, 0x800), 'base01': (0x15ec, 0x1000)}
out = {}
for key, r in ac.items():
    if r.get('int') is None: continue
    c = classes[key]; base = r['copies'][0]; afield = int(r['field'], 16)
    fl = FL.get(base)
    rows = {}
    for mi, sh in modes[key].items():
        fields = {afield: -1}
        if fl: fields[fl[0]] = 0
        v = run(c['reader'], int(r['vt'], 16), c['id'] or 0, sh['ints'], sh['floats'], fields)
        hitSide = (v[fl[0]] & fl[1]) == 0 if fl else True
        rows[mi] = {'aura': v[afield], 'flags': (v[fl[0]] if fl else None), 'hitSide': hitSide}
    out[key] = {'base': base, 'baseNum': int(''.join(ch for ch in base if ch.isdigit())), 'modes': rows}
    print(key, base, json.dumps(rows))
json.dump(out, open(sys.argv[5], 'w'), indent=1)
