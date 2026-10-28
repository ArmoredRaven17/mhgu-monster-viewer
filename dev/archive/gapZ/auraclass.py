# auraclass.py: for every shell class of the 25 monsters whose .mdd carry ShellElements (docs/hyper-motion.json `shells`), the class
# vtable (the main.data word equal to its reader, SHELL_DATA `reader` = vt+0x14c, minus 0x14c), its init vt+0x13c, and whether that init
# reaches one of the base inits that copy an aura-ID field into +0x15bc (base00 +0x1620 0x3f931c, base01 +0x1610 0x3fae38, base07 +0x15fc
# 0x4028c8, base12 +0x15fc 0x403d2c, base13 +0x1634 0x404d18, base54 +0x1630 0x42b644, base56 +0x15fc 0x42e480) -- the call graph walked
# word by word (B / BL / BLX-imm) from the init, depth 6, over the whole text. Then, the class's READER under unicorn with the ShellParam
# getters answered by probes (int k -> 1000 + k, float k -> 2000 + k, vec / effect / hit / sound -> fixed), and the aura field read back:
# 1000 + k = the mode's int k is the ID; -1 = never set by the reader. Output: auraclass.json.
import json, struct, sys, subprocess
from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM, UC_HOOK_CODE, UC_HOOK_MEM_UNMAPPED
from unicorn.arm_const import *
EX = r'C:\MHGU-ROM\exefs'
T = open(EX + r'\main.text', 'rb').read(); RO = open(EX + r'\main.rodata', 'rb').read(); DA = open(EX + r'\main.data', 'rb').read()
RO_VA, DA_VA = 0x13EF000, 0x1728000
COPY = {0x3f8b80: ('base00', 0x1620), 0x3fa498: ('base01', 0x1610), 0x4022a8: ('base07', 0x15fc), 0x4038cc: ('base12', 0x15fc),
        0x4044d8: ('base13', 0x1634), 0x42aecc: ('base54', 0x1630), 0x42dce4: ('base56', 0x15fc)}
def u32d(va): return struct.unpack_from('<I', DA, va - DA_VA)[0]
def fstart(a):
    while a > 0:
        w = struct.unpack_from('<I', T, a)[0]
        if (w & 0xffff4000) == 0xe92d4000: return a
        a -= 4
def callees(f):
    out = set(); a = f; n = 0
    while n < 4000 and a + 4 <= len(T):
        w = struct.unpack_from('<I', T, a)[0]
        if n > 0 and (w & 0xffff4000) == 0xe92d4000: break
        if (w >> 25) & 7 == 5:
            off = w & 0xffffff
            if off & 0x800000: off -= 0x1000000
            t = a + 8 + off * 4
            if (w >> 28) == 0xf: t += ((w >> 24) & 1) * 2
            out.add(t)
        a += 4; n += 1
    return out
def reaches(init):
    seen = set(); front = {init}; hit = set()
    for depth in range(6):
        nxt = set()
        for f in front:
            if f in seen: continue
            seen.add(f)
            if f in COPY: hit.add(f)
            for t in callees(f):
                if 0 <= t < len(T) - 4 and t not in seen: nxt.add(t)
        front = nxt
    return hit
def vt_of(reader):
    pat = struct.pack('<I', reader); outs = []; i = DA.find(pat)
    while i >= 0:
        if i % 4 == 0: outs.append(DA_VA + i - 0x14c)
        i = DA.find(pat, i + 1)
    return outs
# the reader under unicorn
GET = {0x4a2470: 'int', 0x4a24f8: 'float', 0x4a2584: 'vec', 0x4a22f0: 'ef', 0x4a23f4: 'hit', 0x4a2378: 'snd', 0x4a2224: 'cint', 0x4a2264: 'cfloat', 0x4a22a8: 'cvec'}
def run_reader(reader, field, base=1000, vt=0, gid=0):
    mu = Uc(UC_ARCH_ARM, UC_MODE_ARM)
    pg = lambda n: (n + 0xfff) & ~0xfff
    mu.mem_map(0, pg(len(T))); mu.mem_write(0, T)
    mu.mem_map(RO_VA, pg(len(RO))); mu.mem_write(RO_VA, RO)
    mu.mem_map(DA_VA, pg(len(DA)) + 0x400000); mu.mem_write(DA_VA, DA)
    S, STK, RET = 0x40000000, 0x50000000, 0x60000000
    mu.mem_map(S, 0x10000); mu.mem_map(STK - 0x20000, 0x40000); mu.mem_map(RET, 0x1000)
    mu.mem_write(S + field, struct.pack('<i', -1))
    mu.mem_write(S, struct.pack('<I', vt))
    mu.reg_write(UC_ARM_REG_C1_C0_2, mu.reg_read(UC_ARM_REG_C1_C0_2) | (0xf << 20)); mu.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
    calls = []
    def hook(uc, addr, sz, ud):
        if addr == RET: uc.emu_stop(); return
        if addr == 0x4a0ecc:                                  # the shell's global id
            uc.reg_write(UC_ARM_REG_R0, gid); uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR)); return
        if addr in GET:
            k = uc.reg_read(UC_ARM_REG_R1); kind = GET[addr]; calls.append((kind, k))
            if kind == 'int': uc.reg_write(UC_ARM_REG_R0, base + k)
            elif kind == 'cint': uc.reg_write(UC_ARM_REG_R0, 5000 + k)
            elif kind == 'cfloat': uc.reg_write(UC_ARM_REG_S0, struct.unpack('<I', struct.pack('<f', 6000.0 + k))[0])
            elif kind == 'float': uc.reg_write(UC_ARM_REG_S0, struct.unpack('<I', struct.pack('<f', 2000.0 + k))[0])
            elif kind in ('vec', 'cvec'):
                p = uc.reg_read(UC_ARM_REG_R2)
                try: uc.mem_write(p, struct.pack('<3f', 0, 0, 0))
                except Exception: pass
                uc.reg_write(UC_ARM_REG_R0, p)
            else: uc.reg_write(UC_ARM_REG_R0, 3000 + k)
            uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR)); return
        if not (0xcec000 <= addr < 0x1100000 or 0x3f0000 <= addr < 0x440000):   # out of the class bands and the shell bases: return 0
            uc.reg_write(UC_ARM_REG_R0, 0); uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))
    mu.hook_add(UC_HOOK_CODE, hook)
    def unm(uc, access, addr, size, value, ud):
        try: uc.mem_map(addr & ~0xfff, 0x1000); return True
        except Exception: return False
    mu.hook_add(UC_HOOK_MEM_UNMAPPED, unm)
    mu.reg_write(UC_ARM_REG_R0, S); mu.reg_write(UC_ARM_REG_SP, STK); mu.reg_write(UC_ARM_REG_LR, RET)
    err = None
    try: mu.emu_start(reader, RET, count=200000)
    except Exception as e: err = str(e)[:40]
    v = struct.unpack('<i', mu.mem_read(S + field, 4))[0]
    return v, calls, err
classes = json.load(open(sys.argv[1]))
out = {}
for key, c in classes.items():
    r = c.get('reader')
    if not r: out[key] = {'why': 'no reader in SHELL_DATA'}; continue
    vts = vt_of(r)
    if len(vts) != 1: out[key] = {'why': 'vtable search found %d' % len(vts), 'vts': [hex(v) for v in vts]}; continue
    vt = vts[0]; init = u32d(vt + 0x13c)
    hit = reaches(init)
    rec = {'vt': hex(vt), 'init': hex(init), 'copies': [COPY[h][0] for h in hit]}
    if hit:
        field = COPY[sorted(hit)[0]][1]
        v, calls, err = run_reader(r, field, 1000, vt, c.get('id') or 0)
        v2, calls2, err2 = run_reader(r, field, 0x7ff00, vt, c.get('id') or 0)
        v3 = [run_reader(r, field, b3, vt, c.get('id') or 0)[0] for b3 in (0xff0, 0x7fffff00, 0x10, 0x20, 0x40, 0x80)]   # more flag patterns
        rec['probes'] = v3
        rec['alt'] = {'value': v2, 'int': (v2 - 0x7ff00) if 0x7ff00 <= v2 < 0x7ff40 else None, 'err': err2}
        rec.update({'field': hex(field), 'value': v, 'int': (v - 1000) if 1000 <= v < 1100 else None, 'cint': (v - 5000) if 5000 <= v < 5100 else None, 'err': err,
                    'ints_read': sorted(set(k for kind, k in calls if kind == 'int'))})
    out[key] = rec
    print(key, json.dumps(rec))
json.dump(out, open(sys.argv[2], 'w'), indent=1)
