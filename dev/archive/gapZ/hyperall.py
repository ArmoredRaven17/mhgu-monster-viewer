# hyperall.py <auraclass.py> <classes.json> <modes.json> <hyper-motion.json> <out.json>
# The GU Hyper ShellElements audit, every shell class of the monsters whose .mdd carry ShellElements, by the path the ROM takes:
#   0x43a8b0 (vt+0x140) runs the second half when +0x15ac != 0, owner +0xb720, and 0xcad9c(owner, +0x15bc) == 1 -- which is TRUE
#   for +0x15bc == -1 (cad9c 0xcadb4 `cmnne r1, #1; beq -> return 1`), 0 never, else == held +0xca88 / +0xca9c; then 0xcaa30
#   (owner, +0x15a8, +0x15bc): -1 takes the FIRST entry with byte +4 == +0x15a8 in element 1's table (+0xca98), else element 2's
#   (+0xcaac) (0xcabac..0xcacd0); an ID takes the first entry in the table whose held ID byte == it.
# Per class: its vtable (reader word - 0x14c), its ctor (the function that stores vt-8+8 into [r0], found by the PIC
# `ldr rX,[pc,#i]; ldr rX,[pc,rX]; add rX,rX,#8` pattern), the ctor run under unicorn -> +0x15a8 / +0x15ac / +0x15bc and the
# aura fields; vt+0x140 (== 0x43a8b0?); the init's copy (auraclass.json) and, per mode, the reader run with that mode's ints /
# floats (modes.json) -> the aura field and the base's flag word that clears +0x15ac:
#   base00 +0x15e8 & 0x800 (0x3f9308), base01 +0x15ec & 0x1000 (0x3fae20), base07 [sp+0x1c]=? & 0x10 (0x4028b4),
#   base12 +0x15e0 & 1 (0x403d18), base13 +0x15e0 & 0x400 (0x404d00: sb = +0x15e0 from 0x404610), base54 +0x1614 & 0x80 (0x42b630),
#   base56 & 0x20 (0x42e46c). Bases without a copy: +0x15bc stays the ctor's -1 and +0x15ac its 1.
import json, struct, sys
from unicorn import *
from unicorn.arm_const import *
EX = r'C:\MHGU-ROM\exefs'
T = open(EX + r'\main.text', 'rb').read(); RO = open(EX + r'\main.rodata', 'rb').read(); DA = open(EX + r'\main.data', 'rb').read()
RO_VA, DA_VA = 0x13EF000, 0x1728000
def rdw(va):
    if DA_VA <= va < DA_VA + len(DA) - 3: return struct.unpack_from('<I', DA, va - DA_VA)[0]
    if RO_VA <= va < RO_VA + len(RO) - 3: return struct.unpack_from('<I', RO, va - RO_VA)[0]
    return None
def fstart(a):
    while a > 0:
        w = struct.unpack_from('<I', T, a)[0]
        if (w & 0xffff4000) == 0xe92d4000: return a
        a -= 4
    return 0
# vt -> ctor/dtor candidates
vtfn = {}
for a in range(4, len(T) - 8, 4):
    w = struct.unpack_from('<I', T, a)[0]
    if (w & 0xffff0ff0) != 0xe79f0000: continue      # ldr rX, [pc, rM]
    rx = (w >> 12) & 0xf; rm = w & 0xf
    p = struct.unpack_from('<I', T, a - 4)[0]
    if (p & 0xffff0000) != 0xe59f0000 or ((p >> 12) & 0xf) != rm: continue
    lit = struct.unpack_from('<I', T, a - 4 + 8 + (p & 0xfff))[0]
    got = (a + 8 + lit) & 0xffffffff
    V = rdw(got)
    if V is None: continue
    n = struct.unpack_from('<I', T, a + 4)[0]
    if (n & 0xfffff000) != (0xe2800000 | (rx << 16) | (rx << 12)) or (n & 0xfff) != 8: continue
    vtfn.setdefault(V + 8, set()).add(fstart(a))
BASECTOR = {'base00': 0x3f8a04, 'base01': 0x3fa2f8, 'base02': 0x3fb7f8, 'base03': 0x3fd830, 'base04': 0x3ff080, 'base05': 0x40098c, 'base11': 0x402f80,
            'base12': 0x4033e0, 'base13': 0x404350, 'base14': 0x405d70, 'base15': 0x406f6c, 'base16': 0x407de8, 'base18': 0x4088fc}
COPYFIELD = {'base00': 0x1620, 'base01': 0x1610, 'base07': 0x15fc, 'base12': 0x15fc, 'base13': 0x1634, 'base54': 0x1630, 'base56': 0x15fc}
FLAG = {'base00': (0x15e8, 0x800), 'base01': (0x15ec, 0x1000), 'base12': (0x15e0, 1), 'base13': (0x15e0, 0x400), 'base54': (0x1614, 0x80)}
GET = {0x4a2470: 'int', 0x4a24f8: 'float', 0x4a2584: 'vec', 0x4a22f0: 'ef', 0x4a23f4: 'hit', 0x4a2378: 'snd', 0x4a2224: 'cint', 0x4a2264: 'cfloat', 0x4a22a8: 'cvec'}
def emu(pc, S_init=None, ints=None, floats=None, gid=0, count=400000):
    mu = Uc(UC_ARCH_ARM, UC_MODE_ARM); pg = lambda n: (n + 0xfff) & ~0xfff
    mu.mem_map(0, pg(len(T))); mu.mem_write(0, T); mu.mem_map(RO_VA, pg(len(RO))); mu.mem_write(RO_VA, RO)
    mu.mem_map(DA_VA, pg(len(DA)) + 0x800000); mu.mem_write(DA_VA, DA)
    S, BUF, STK, RET = 0x40000000, 0x41000000, 0x50000000, 0x60000000
    mu.mem_map(S, 0x10000); mu.mem_map(BUF, 0x1000); mu.mem_map(STK - 0x40000, 0x80000); mu.mem_map(RET, 0x1000)
    if S_init: mu.mem_write(S, S_init)
    mu.reg_write(UC_ARM_REG_C1_C0_2, mu.reg_read(UC_ARM_REG_C1_C0_2) | (0xf << 20)); mu.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
    seen = set()
    def hook(uc, addr, sz, ud):
        if addr == RET: uc.emu_stop(); return
        lr = uc.reg_read(UC_ARM_REG_LR)
        if addr in (0x43a78c,): seen.add(addr)
        if 0x13ec000 <= addr < 0x13ef000: uc.reg_write(UC_ARM_REG_PC, lr); return
        if addr == 0x4a0ecc: uc.reg_write(UC_ARM_REG_R0, gid); uc.reg_write(UC_ARM_REG_PC, lr); return
        if ints is not None and addr in GET:
            k = uc.reg_read(UC_ARM_REG_R1); kind = GET[addr]; dflt = uc.reg_read(UC_ARM_REG_R2)
            if kind == 'int': uc.reg_write(UC_ARM_REG_R0, (ints[k] if k < len(ints) else dflt) & 0xffffffff)
            elif kind == 'float':
                v = floats[k] if k < len(floats) else 0.0
                uc.reg_write(UC_ARM_REG_S0, struct.unpack('<I', struct.pack('<f', v))[0])
            elif kind == 'cfloat': uc.reg_write(UC_ARM_REG_S0, 0)
            elif kind in ('vec', 'cvec'):
                p = BUF + 0x100 + 0x10 * (k & 0xf); uc.mem_write(p, struct.pack('<3f', 1, 1, 1)); uc.reg_write(UC_ARM_REG_R0, p)
            else: uc.reg_write(UC_ARM_REG_R0, 0)
            uc.reg_write(UC_ARM_REG_PC, lr); return
        if ints is not None and not (0xcec000 <= addr < 0x1100000 or 0x3f0000 <= addr < 0x440000):
            uc.reg_write(UC_ARM_REG_R0, 0); uc.reg_write(UC_ARM_REG_PC, lr)
    mu.hook_add(UC_HOOK_CODE, hook)
    def unm(uc, access, addr, size, value, ud):
        try: uc.mem_map(addr & ~0xfff, 0x1000); return True
        except Exception: return False
    mu.hook_add(UC_HOOK_MEM_UNMAPPED, unm)
    mu.reg_write(UC_ARM_REG_R0, S); mu.reg_write(UC_ARM_REG_SP, STK); mu.reg_write(UC_ARM_REG_LR, RET)
    err = None
    try: mu.emu_start(pc, RET, count=count)
    except Exception as e: err = str(e)[:40]
    return bytes(mu.mem_read(S, 0x2000)), seen, err
i32 = lambda b, o: struct.unpack_from('<i', b, o)[0]
u32 = lambda b, o: struct.unpack_from('<I', b, o)[0]
auraclass = json.load(open(sys.argv[1].replace('.py', '.json')))
classes = json.load(open(sys.argv[2])); modes = json.load(open(sys.argv[3])); hm = json.load(open(sys.argv[4]))
out = {}
for key, c in classes.items():
    r = c.get('reader'); rec = {'base': c['base'], 'cls': c.get('cls')}
    if not isinstance(r, int): rec['why'] = 'no reader in SHELL_DATA'; out[key] = rec; print(key, rec); continue
    vts = []
    pat = struct.pack('<I', r); i = DA.find(pat)
    while i >= 0:
        if i % 4 == 0: vts.append(DA_VA + i - 0x14c)
        i = DA.find(pat, i + 1)
    if len(vts) != 1: rec['why'] = 'vtables %d' % len(vts); out[key] = rec; continue
    vt = vts[0]; rec['vt'] = hex(vt); rec['vt140'] = hex(rdw(vt + 0x140)); rec['init'] = hex(rdw(vt + 0x13c))
    cands = sorted(vtfn.get(vt, ()))
    rec['ctorCands'] = [hex(x) for x in cands]
    got = None
    for cf in cands:
        S, seen, err = emu(cf)
        if 0x43a78c in seen and u32(S, 0) == vt: got = (cf, S, err); break
    if not got:
        # no own ctor found by the PIC pattern: the base's ctor (each derived ctor seen calls it first and writes only the
        # vtable after), then the class's vtable stored in word 0
        bc = BASECTOR.get(c['base'])
        if bc is None: rec['why'] = 'no ctor ran 0x43a78c and left the vtable'; out[key] = rec; print(key, rec); continue
        S, seen, err = emu(bc); S = struct.pack('<I', vt) + S[4:]; got = (bc, S, err); rec['ctorVia'] = 'base'
    cf, S, err = got
    rec.update({'ctor': hex(cf), 'cls15a8': i32(S, 0x15a8), 'hit15ac': S[0x15ac], 'aura15bc': i32(S, 0x15bc), 'ctorErr': err})
    ac = auraclass.get(key, {})
    rec['copies'] = ac.get('copies', [])
    base = c['base']
    mrecs = {}
    for mi, m in (modes.get(key) or {}).items():
        ints = m.get('ints') or m.get('i') or []; floats = m.get('floats') or m.get('f') or []
        S2, _, err2 = emu(r, S_init=S, ints=ints, floats=floats, gid=c.get('id') or 0)
        mr = {}
        if rec['copies']:
            fo = COPYFIELD[rec['copies'][0]]
            mr['aura'] = i32(S2, fo)
        else: mr['aura'] = rec['aura15bc']
        if base in FLAG and rec['copies']:
            fo, bit = FLAG[base]; mr['flagWord'] = u32(S2, fo); mr['hitSide'] = not (u32(S2, fo) & bit)
        else: mr['hitSide'] = bool(rec['hit15ac'])
        if err2: mr['err'] = err2
        mrecs[mi] = mr
    rec['modes'] = mrecs
    out[key] = rec
    print(key, json.dumps({k: rec[k] for k in ('base', 'ctor', 'cls15a8', 'hit15ac', 'aura15bc', 'vt140', 'copies')}),
          'modes', len(mrecs), 'auras', sorted(set(m['aura'] for m in mrecs.values())), 'hitSide', sorted(set(m['hitSide'] for m in mrecs.values())))
json.dump(out, open(sys.argv[5], 'w'), indent=1)
