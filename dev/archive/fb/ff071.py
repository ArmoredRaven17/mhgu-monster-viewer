# ff071.py <mon> <variant> <gauge> [em]: every call of the Gore line's footfall helper 0xfb700c(e, joint, frame s0, x s1, z s2) per action
import os, sys, json, struct
mon, v, gauge = sys.argv[1], int(sys.argv[2]), float(sys.argv[3])
os.environ['FB_CLASS'] = 'uEm071_00'; os.environ['FB_MON'] = mon
if len(sys.argv) > 4: os.environ['FB_EM'] = sys.argv[4]
pk = json.loads(json.load(open('gorepokes.json'))[mon]); sys.argv = ['x']
import trgen as T
from unicorn.arm_const import *
from unicorn import UC_HOOK_CODE
poke = {T.E + int(k, 0): b for k, b in pk.items()}
ctl = {'0x84': list(struct.pack('<f', gauge))}
CALLS = []
def f32(r): return round(struct.unpack('<f', struct.pack('<I', T.mu.reg_read(r) & 0xffffffff))[0], 4)
def h(uc, a, s, d): CALLS.append((uc.reg_read(UC_ARM_REG_R1), f32(UC_ARM_REG_S0), f32(UC_ARM_REG_S1), f32(UC_ARM_REG_S2), hex(uc.reg_read(UC_ARM_REG_LR))))
T.mu.hook_add(UC_HOOK_CODE, h, begin=0xfb700c, end=0xfb700c)
for st in (7,):
    for n in range(0x80):
        seen = set()
        for ph in range(3):
            for sc in ({'frame': 1, 'frame2': 1}, {'frame': 1, 'frame2': 1, 'ended': 1}):
                CALLS.clear()
                r = T.run(st, n, ph, v, 0, stub={0x3a8430: int(os.environ.get('FB_RANKQ', '5'))}, poke={**poke, T.C + 0x84: ctl["0x84"]}, **sc)
                for c in CALLS: seen.add((ph,) + c)
        if seen: print(st, hex(n), sorted(seen))
