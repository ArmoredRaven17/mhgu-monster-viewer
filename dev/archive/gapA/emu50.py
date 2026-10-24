# emu50.py -- (7, 0x50) 0xd87a18 phase 4 (P+0x1a1 = 4, L4 M4) under trgen's unicorn model with: the RNG 0x7c9234 answered from a list of
# u32s, the ray 0x183664 answered (hit byte [sp] = HIT, s0 = GROUND), the hunter getter 0x27482c -> 0 (no hunter), both timers 0x7206c
# firing. Logs every create (id, mode, +0x10.., +0x20.., +0x30..), the RNG draws, P+0x1bc / P+0x1a2 / ctl+0x3c after, the ray's args.
# Cases: (a) hit, ground 0 -> two sp_01 0x8b mode 9 (the P+0x1bc arm's fallback 0xd88098 and the ctl+0x3c arm 0xd880e4);
# (b) no hit -> none (what the census saw: trgen's ray writes no hit byte); (c) the box (y > 780, 220 < x < 870, 3500 < z < 4200)
# -> (545, y, 3850); (d) timer off -> nothing (control).
import sys, os, struct, json
os.environ['FB_CLASS'] = 'uEm013_00'; os.environ['FB_MON'] = 'em013_02'
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'fb'))
sys.argv = ['x']
import trgen as T
from unicorn.arm_const import *
def wreg(r, v): T.mu.reg_write(r, struct.unpack('<I', struct.pack('<f', v))[0])
RNG = []; HIT = [1]; GROUND = [0.0]; LOG = []
def h(uc, addr, size, ud):
    if addr == 0x7c9234:
        v = RNG.pop(0) if RNG else 0; LOG.append(('rng', v)); uc.reg_write(UC_ARM_REG_R0, v)
    elif addr == 0x183664:
        sp = uc.reg_read(UC_ARM_REG_SP); pf, a1, a2 = struct.unpack('<3I', bytes(uc.mem_read(sp, 12)))
        p = struct.unpack('<3f', bytes(uc.mem_read(uc.reg_read(UC_ARM_REG_R1), 12)))
        LOG.append(('ray', [round(x, 3) for x in p], 'r2', uc.reg_read(UC_ARM_REG_R2), 'r3', uc.reg_read(UC_ARM_REG_R3), 'stack', a1, a2, hex(uc.reg_read(UC_ARM_REG_LR))))
        uc.mem_write(pf, bytes([HIT[0]])); wreg(UC_ARM_REG_S0, GROUND[0])
    elif addr in (0xd87630, 0xd87464): LOG.append(('call', hex(addr), hex(uc.reg_read(UC_ARM_REG_LR))))
# trgen's own hook runs first and returns (PC = LR); these write the results after it (registers / memory only)
for a in (0x7c9234, 0x183664, 0xd87630, 0xd87464): T.mu.hook_add(T.UC_HOOK_CODE, h, begin=a, end=a)
def run(rng, hit, ground, timer=1):
    RNG[:] = list(rng); HIT[0] = hit; GROUND[0] = ground; LOG.clear()
    r = T.run(7, 0x50, 4, 2, 0, fn=0xd87a18, timer=timer)
    P, C = T.P, T.C
    cr = [{'id': e[1], 'mode': e[2], 'p10': e[3], 'w20': e[4], 'lr': e[5]} for e in r.get('ev', []) if e[0] == 'create']
    raw = [x for x in r.get('raw', [])]
    for c, rw in zip(cr, raw):
        b = bytes.fromhex(rw); c['p30'] = list(struct.unpack_from('<3I', b, 0x30)); c['h3c'] = struct.unpack_from('<H', b, 0x3c)[0]
        c['owner_is_e'] = struct.unpack_from('<I', b, 0xc)[0] == T.E; c['w1c'] = struct.unpack_from('<I', b, 0x1c)[0]; c['w2c'] = struct.unpack_from('<I', b, 0x2c)[0]
    return {'log': LOG[:], 'creates': cr,
            'P1bc': struct.unpack('<f', bytes(T.mu.mem_read(P + 0x1bc, 4)))[0], 'P1a2': T.mu.mem_read(P + 0x1a2, 1)[0],
            'ctl3c': struct.unpack('<f', bytes(T.mu.mem_read(C + 0x3c, 4)))[0], 'chg': [e for e in r.get('ev', []) if e[0] == 'chg'], 'end': r.get('end')}
out = {}
# draws: rand % 1000 (< 536 -> the 7000 x 4000 box, else 8500 x 7200), then x's, then z's -- per call
out['a_hit'] = run([100, 12345, 54321, 900, 7777, 99999], 1, 0.0)
out['b_nohit'] = run([100, 12345, 54321, 900, 7777, 99999], 0, 0.0)
out['c_box'] = run([100, 3000, 4500, 100, 3000, 4500], 1, 900.0)      # x = 3000 % 7000 - 2500 = 500, z = 4500 % 4000 - 700 = -200 ..
out['c_box2'] = run([100, 3000, 4500 + 3900, 100, 3000, 8400], 1, 900.0)  # z = 8400 % 4000 - 700 = -300 ; 8400 -> see below
out['e_box'] = run([900, 3000, 4500, 100, 1, 1], 1, 900.0)        # x = 3000 % 8500 - 2500 = 500, z = 4500 % 7200 - 700 = 3800: the box -> (545, 900, 3850)
out['d_notimer'] = run([100, 12345, 54321], 1, 0.0, timer=0)
json.dump(out, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'emu50.json'), 'w'), indent=1)
for k, v in out.items():
    print('==', k, 'P1bc', v['P1bc'], 'P1a2', v['P1a2'], 'ctl3c', round(v['ctl3c'], 4), 'chg', v['chg'], v['end'])
    for l in v['log']: print('   ', l)
    for c in v['creates']: print('    create', c)
