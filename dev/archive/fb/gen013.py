# gen013.py <variant>: the Fatalis line's action spawns as viewer rows (JSON). For each action of acts013_v<v>.txt: phases 0..5 under
# the scenarios none / frame / ended / landed; a phase's clip = the motion set on entering it; the helpers' arguments by hook --
# 0xd81e80 the aim (limit, vec, raise), 0xd82024 the fireball (mode sel, X / Y word offsets), 0xd7ffcc the dust (kind, vec, scale),
# 0xd80e74 the meteor; sp_51 / sp_01 creates made inline (the action's own code) by their create. A spawn under 'frame' -> the
# phase's clip at the frame test's literal; under 'ended' -> that clip's last frame; in phase 0 -> the next phase's clip at its start.
import sys, os, struct, json, re
v = int(sys.argv[1])
os.environ['FB_CLASS'] = 'uEm013_00'; os.environ['FB_MON'] = 'em013_0%d' % v
SP = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad'
acts = [tuple(int(x, 0) for x in a.split(':')) for a in open(SP + r'\acts013_v%d.txt' % v).read().split(',')]
sys.argv = ['x']
import trgen as T
from unicorn.arm_const import *
for a, nm in ((0xb00b4, 'b00b4'), (0xb0174, 'b0174'), (0xb0230, 'b0230'), (0xb03f8, 'b03f8'), (0xb04d0, 'b04d0'), (0xb0004, 'b0004')): T.MOT[a] = nm
EV = []
def h(uc, addr, size, ud):
    lf = T.cur.get('lastF')
    if addr == 0xd81e80:
        EV.append({'k': 'aim', 'limit': uc.reg_read(UC_ARM_REG_R1), 'v': T.rdf(uc.reg_read(UC_ARM_REG_R2), 3), 'raise': T.f32r(UC_ARM_REG_S0)})
    elif addr == 0xd82024:
        EV.append({'k': 'fire', 'sel': uc.reg_read(UC_ARM_REG_R1), 'dx': uc.reg_read(UC_ARM_REG_R2), 'dy': uc.reg_read(UC_ARM_REG_R3), 'f': lf})
    elif addr == 0xd7ffcc:
        EV.append({'k': 'dust', 'kind': uc.reg_read(UC_ARM_REG_R1), 'v': T.rdf(uc.reg_read(UC_ARM_REG_R2), 3), 'scale': T.f32r(UC_ARM_REG_S0), 'f': lf})
    elif addr == 0xd80e74:
        EV.append({'k': 'meteor', 'r1': uc.reg_read(UC_ARM_REG_R1), 'r2': uc.reg_read(UC_ARM_REG_R2), 'r3': uc.reg_read(UC_ARM_REG_R3), 'f': lf})
for a in (0xd81e80, 0xd82024, 0xd80e74, 0xd7ffcc): T.mu.hook_add(T.UC_HOOK_CODE, h, begin=a, end=a)
CTL = 0x1234
out = {}
for st, n in acts:
    clip = {}; rows = []
    runs = {}
    for ph in range(6):
        for nm, sc in (('0', {}), ('F', {'frame': 1, 'frame2': 1}), ('E', {'ended': 1}), ('L', {'landed': 1})):
            EV.clear()
            r = T.run(st, n, ph, v, 0, stub={0x3a8430: 5}, ctl=list(struct.pack('<I', CTL)), **sc)
            nph = T.mu.mem_read(T.P + 0x1a1, 1)[0]
            ms = [e[1] for e in r.get('ev', []) if e[0] == 'mot']
            if ms and nph != ph and nph not in clip: clip[nph] = ms[-1]
            if ms and ph == 0 and nph not in clip: clip[nph] = ms[-1]
            cr = [e for e in r.get('ev', []) if e[0] == 'create']
            runs[(ph, nm)] = {'ev': list(EV), 'creates': [[e[1], e[2], e[6]] for e in cr], 'next': nph, 'mot': ms}
    # the spawns: the 'frame' / 'ended' / phase-0 runs whose events are not also in the plain run
    for (ph, nm), R in sorted(runs.items()):
        base = runs[(ph, '0')]
        if nm != '0' and R['ev'] == base['ev'] and R['creates'] == base['creates']: continue
        if nm == '0' and ph != 0: continue
        if nm == 'L' and ph != 0: pass
        evs = [e for e in R['ev'] if e['k'] != 'aim' or nm == '0' or True]
        cs = R['creates']
        if not cs and not any(e['k'] in ('fire', 'dust', 'meteor') for e in evs): continue
        where = {'phase': ph, 'scen': nm, 'clip': clip.get(ph if ph > 0 else 1), 'next': R['next'], 'mot': R['mot']}
        rows.append({'at': where, 'ev': evs, 'creates': cs})
    out['%d:%#04x' % (st, n)] = {'clips': clip, 'rows': rows, 'aim0': [e for e in runs[(0, '0')]['ev'] if e['k'] == 'aim']}
json.dump(out, open(SP + r'\gen013_v%d.json' % v, 'w'), indent=1)
print(len(out), 'actions')
