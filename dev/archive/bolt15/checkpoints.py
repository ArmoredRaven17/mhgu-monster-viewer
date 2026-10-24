"""ROM checkpoints for a JS transcriber: base15's move run on the ROM (emu) from the init state of real Boltreaver modes.
Start: request point (0,0,0) on a floor at y 0, request words (0,0,0), owner Y word 0, h73e8 0, dt 1, owner size 1.0.
The init state is built by the formula run_full_init.py verified against the ROM chain (36/36)."""
import math, json, re, copy
import numpy as np
from run_move import emu_step, xs_seed, xs_step, f, mla, P32, step, sinf, cosf
from run_move import K
txt = open(r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\bolt\shl2.txt').read()
sec = txt.split('=== shell15')[1].split('===')[0]
MODES = {}
for m in re.finditer(r'\[\s*(\d+)\] scale \S+ ef (\[.*?\]\]) sh (\{.*?\}) hit \[(\d+)\]', sec):
    MODES[int(m.group(1))] = json.loads(m.group(3))
def init_state(mode):
    sh = MODES[mode]; fl = [f(x) for x in sh['floats']]; it = sh['ints']
    Y = int(math.trunc(float(np.float32(0.5) + np.float32(np.float32(fl[0]) * np.float32(182.04444885253906))))) & 0xffff
    sY, cY = sinf(f(Y * K)), cosf(f(Y * K))
    vx, vy, vz = [f(x) for x in sh['vecs'][1]]
    o = [mla(f(vx * cY), vz, sY), vy, f(f(vz * cY) - f(vx * sY))]
    p = [o[0], 0.0, o[2]]
    vel = [f(fl[1] * sY), 0.0, f(fl[1] * cY)]
    every, i3 = it[4], it[3]
    rng = xs_seed((0 + (0x12345678 if i3 != -1 else 0)) & 0xffffffff)
    M = dict(sub=1, dt=1.0, pos=p[:], vel=vel, speed=fl[1], f15f8=0.0, timer=fl[2], every=every, i1704=i3,
             f1708=fl[4], f170c=fl[3], A=fl[5], acc=fl[6], f1718=fl[7], f171c=fl[8], track=p[:], off=0.0, half=0.0,
             vlat=(fl[5] if i3 == -1 else f(-fl[5])), count=0, delay=0.0, wX=0, wY=0, wZ=0, angles=[0, Y, 0], rng=rng)
    # the init's amplitude draw (count 1)
    M['count'] = 1
    if every >= 1 and 1 % every == 0: a = M['f1718'] if M['f1718'] > 0 else M['f1708']
    else: a = mla(M['f170c'], f(M['f1708'] - M['f170c']), f(f(xs_step(M['rng'])) * P32))
    M['half'] = f(a * 0.5)
    return M
for mode in (0, 1, 2, 3, 6, 9, 13, 20, 22):
    M = init_state(mode); out = []
    for i in range(int(M['timer']) + 2):
        log, err, R = emu_step(M)
        Mm = copy.deepcopy(M); ev = step(Mm, M['dt'])
        assert R['pos'] == Mm['pos'] and R['sub'] == Mm['sub'] and R['angles'] == Mm['angles'], (mode, i, R, Mm)
        calls = [l[1] for l in log if l[0] == 'call']
        if ev or i in (0, 1, 10, 50, 100, 200) or 'end' in ev:
            sp = math.sqrt(sum(x * x for x in Mm['vel']))
            out.append('m%d:%s pos(%.2f,%.2f,%.2f) |v| %.3f off %.2f vlat %.3f W(%#x,%#x) %s' % (i, ''.join(','.join(ev)), *Mm['pos'], sp, Mm['off'], Mm['vlat'], Mm['angles'][0], Mm['angles'][1], calls))
        M = Mm
        if 'end' in ev: break
    print('== mode', mode, 'start', init_state(mode)['pos'], 'vel', init_state(mode)['vel'], 'half', init_state(mode)['half'])
    for l in out[:14]: print('   ', l)
    if len(out) > 14: print('    ...', len(out), 'lines;', out[-1])
