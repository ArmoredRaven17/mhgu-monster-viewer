"""carrysim2.py <cases.json> <out.json> (atkfix lane, 2026-10-27): THE CARRY, FRAME BY FRAME, with the data the action reads.

carrysim.py answered every frame test 0 or 1 at once and refused when the answer mattered. This steps the arming action's main
(amtrace_ovr.py: actmot/amtrace.py with answers) one tick per motion frame, from the arm's frame, and answers:
  * the frame tests against the concrete frame: mode 0 (0xb0974 / 0xb09b0, 0x72714 r1 0) a crossing prev < f <= cur; 0xb098c and mode 1
    cur >= f; mode 2 cur < f; modes 3 / 9 f0 <= cur <= f1 (rom-map `0x72714`, `0x72984` / `0x7293c`, fq.py); while the blend gate
    (+0x4f4: the motion's blend less the ticks since its set) is open, modes 1 / 3 / 9 answer 0 and mode 2 compares the frame it was
    set at (row `[unit+0x4f4]`); any other mode -> refused 'frame-mode:<n>';
  * the ended tests: cur >= the clip's length;
  * the action-tune getters 0x6f618 / 0x6f62c / 0x6f640 from the monster's own <id>_actiontune.fup (the thresholds are tune data);
  * the motion getter 0xb0944 (e+0x4b4): the motion playing;
  * FIXED (the simulator's standing-alone answers, each named in the case's `fixed`): see FIX below;
  * every other stubbed call 0 and 1: the two runs must agree, else refused 'stub-answer:<the calls that decide it>' (found by
    flipping each alone).
Each setMotion is the next motion (its frame 0 at that tick); a FOLLOW (C) hands to the followed action at phase 0 the next tick; any
other change -> 'change:<kind>'. A motion set again is a replay (the hop carries `lap`). Stops when the window has run out, at an
_start / _loop motion (it takes the rest), or after 1500 ticks ('waits')."""
import sys, os, json, struct
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import amtrace_ovr as AO
A = AO.A
from unicorn.arm_const import UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_PC, UC_ARM_REG_LR, UC_ARM_REG_S0, UC_ARM_REG_S1

cases = json.load(open(sys.argv[1]))
def f32(uc, r): return struct.unpack('<f', struct.pack('<I', uc.reg_read(r) & 0xffffffff))[0]
def back(uc): uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))
CTX = {}
class FrameMode(Exception): pass

def framefn(addr, uc):
    cur, prev, gate = CTX['t'], CTX['t'] - 1, CTX['gate']
    r1 = uc.reg_read(UC_ARM_REG_R1); s0 = f32(uc, UC_ARM_REG_S0); s1 = f32(uc, UC_ARM_REG_S1)
    if addr in (0xb0974, 0xb09b0): mode = 0
    elif addr == 0xb098c: mode = 1
    else: mode = r1
    # the dispatch 0x728b8 (table 0x728d0): 0 0x7294c crossing; 1 / 6 0x72904 cur >= f0; 2 0x72984 cur < f0; 3 / 7 0x7293c
    # f0 <= cur <= f1; 4 0x72990 f0 < cur <= f1; 5 0x729b0 f0 <= cur < f1; 8 0x729c8 prev < f0; 9 0x729fc f0 <= cur <= f1 (with a share);
    # 10 0x72a24 f0 <= cur <= f1; while the gate is open (0x72714 prologue, rom-map `[unit+0x4f4]`) modes 1 / 3 / 4 / 5 / 9 answer 0
    # and 2 / 6 / 7 / 8 / 10 take prev = cur
    g = gate > 0
    if g: prev = cur
    if mode == 0: return prev < s0 <= cur
    if mode in (1, 3, 4, 5, 9) and g: return 0
    if mode in (1, 6): return cur >= s0
    if mode == 2: return cur < s0
    if mode in (3, 7, 9, 10): return s0 <= cur <= s1
    if mode == 4: return s0 < cur <= s1
    if mode == 5: return s0 <= cur < s1
    if mode == 8: return prev < s0
    CTX['badmode'] = mode
    return 0

def motion_get(uc):
    uc.reg_write(UC_ARM_REG_R0, CTX['mid']); back(uc)

def hit_live(uc):
    # 0x168ebc(H): H+5 and H+0x5c <= 0 -- the slot's hit armed and its delay run out (READ). H = P+0x998 + slot x 0xb8 (0x7dd2c). The
    # simulator knows the arm it carries: its slot is live from its window's start to its end, in the arm motion's frames; another
    # slot is unarmed for a monster standing alone (FIXED, named in the case)
    h = uc.reg_read(UC_ARM_REG_R0); off = h - (A.P + 0x998)
    sl, w = CTX['arm']
    live = int(off % 0xb8 == 0 and off // 0xb8 == sl and w is not None and w[0] <= CTX['kt'] < w[1])
    if off % 0xb8 or off // 0xb8 != sl: CTX['other_slot'] = True
    uc.reg_write(UC_ARM_REG_R0, live); back(uc)
FIX = {0x168ebc: ('hit-live', hit_live)}

def mid_of(key):
    L, M = key.split('|'); return (int(L) << 8) | int(M[7:-1])
def key_of(m): return '%d|Motion[%d]' % (m >> 8, m & 0xff)

def run(var, act, state, ended, RET, flip=None):
    A.OVR.pop('flip', None)
    saved = None
    if flip is not None:
        saved = A.OVR.get(flip)
        A.OVR[flip] = (lambda v: (lambda uc: (uc.reg_write(UC_ARM_REG_R0, v), uc.reg_write(UC_ARM_REG_S0, struct.unpack('<I', struct.pack('<f', v * 999.0))[0]), back(uc))))(1 - RET)
    A.CALLS.clear(); CTX.pop('badmode', None)
    ev, stubs, ob, nph, err = A.run(CTX['var'], act[0], act[1], state[0], state[1], ended, 0, RET)
    if flip is not None:
        if saved is None: A.OVR.pop(flip, None)
        else: A.OVR[flip] = saved
    nsub = A.mu.mem_read(A.P + 0x1a2, 1)[0]
    ms = [x for x in ev if x[0] == 'M']
    ch = [x for x in ev if x[0] == 'C' and not str(x[1]).startswith('default')]
    return {'m': [(x[1], x[5]) for x in ms], 'bl': [x[2] for x in ms], 'c': [(x[1], x[2], x[3]) for x in ch], 'ph': nph, 'sub': nsub, 'stubs': sorted(stubs),
            'bad': CTX.get('badmode'), 'err': err}
def k(o): return json.dumps([o['m'], o['c'], o['ph'], o['sub']])

def sim(c):
    T = AO.load_tune(c['id'])
    AO.install_tune(T)
    A.FRAMEFN = framefn
    A.OVR[0xb0944] = motion_get
    for a, (nm, fn) in FIX.items(): A.OVR[a] = fn
    CTX['var'] = c['var']
    Lk, O = c['clipLen'], set(c['open'])
    act = (c['st'], c['n']); cur = c['key']; base = 0
    t = max(0, int(c['gate'])); blend = c.get('blend', 0.0)
    CTX.update(t=t, gate=blend - t, tset=0, mid=mid_of(cur), arm=(c['slot'], c.get('win')), kt=t)
    o = run(c['var'], act, (c['phase'], 0), int(t >= Lk[cur]), 0)
    state = (o['ph'], o['sub'])
    hops, seen, end = [], {cur: 1}, c['end']
    tick_since_set = t; follow_pending = None; idle = 0
    for tick in range(1500):
        t += 1; tick_since_set += 1
        if base + t >= end: return ('carried' if hops else 'ends-before', hops, None)
        CTX.update(t=t, gate=blend - tick_since_set, mid=mid_of(cur), kt=base + t)
        if follow_pending: act, state = follow_pending, (0, 0); follow_pending = None
        ended = int(cur in Lk and t >= Lk[cur])
        o0 = run(c['var'], act, state, ended, 0); o1 = run(c['var'], act, state, ended, 1)
        if o0['bad'] is not None or o1['bad'] is not None: return stop(hops, 'frame-mode:%s' % (o0['bad'] if o0['bad'] is not None else o1['bad']))
        if k(o0) != k(o1):
            dec = [s for s in sorted(set(o0['stubs']) | set(o1['stubs'])) if k(run(c['var'], act, state, ended, 0, flip=s)) != k(o0)]
            return stop(hops, 'stub-answer:' + ','.join('%#x' % s for s in dec) + '@%s' % key_of(mid_of(cur)) + ':f%d' % t)
        fol = [x for x in o0['c'] if x[0] == 'follow']
        if o0['c'] and not fol: return stop(hops, 'change:' + o0['c'][0][0])
        if o0['m']:
            vias = {v for m_, v in o0['m']}
            ms = sorted({m_ for m_, v in o0['m']})
            if len(ms) > 1 and any(str(v).startswith('turn') for v in vias): return stop(hops, 'turn')
            nm = o0['m'][-1][0]; k2 = key_of(nm)
            if k2 not in Lk and k2 not in O: return stop(hops, 'not-in-lists:' + k2)
            sh = base + t
            if sh >= end: return ('carried' if hops else 'ends-before', hops, None)
            hops.append([k2, sh, seen.get(k2, 0)]); seen[k2] = seen.get(k2, 0) + 1
            base, cur, t, tick_since_set = sh, k2, 0, 0
            blend = abs(o0['bl'][-1] or 0.0)
            if cur in O: return ('carried', hops, None)
        idle = idle + 1 if (ended and not o0['m'] and not fol and (o0['ph'], o0['sub']) == state) else 0
        if idle > 90: return stop(hops, 'waits')
        state = (o0['ph'], o0['sub'])
        if fol: follow_pending = (fol[0][1], fol[0][2])
    return stop(hops, 'waits')

def stop(hops, why):
    return ('carried', hops, why) if hops else ('refused', [], why)

def lead_t(j):
    """THE ARM'S FRAME for an arm whose motion was set in an earlier phase with no frame gate asked: step from the setMotion's run
    (phase pk, frame 0, gate = the blend) until a run starts at the arm's phase pa; t = that frame."""
    T = AO.load_tune(j['id']); AO.install_tune(T)
    A.FRAMEFN = framefn; A.OVR[0xb0944] = motion_get
    CTX['var'] = j['var']; act = (j['st'], j['n']); key = j['key']; L = j['len']
    CTX.update(t=0, gate=j['b'], tset=0, mid=mid_of(key))
    o = run(j['var'], act, (j['pk'], j['sk']), 0, 0); state = (o['ph'], o['sub'])
    for t in range(1, 400):
        if state[0] == j['pa']: return ('t', t - 1 if False else t, None)
        CTX.update(t=t, gate=j['b'] - t)
        o0 = run(j['var'], act, state, int(t >= L), 0); o1 = run(j['var'], act, state, int(t >= L), 1)
        if k(o0) != k(o1): return ('refused', None, 'stub-answer')
        if o0['bad'] is not None: return ('refused', None, 'frame-mode:%s' % o0['bad'])
        if o0['m'] and o0['m'][-1][0] != mid_of(key): return ('refused', None, 'motion-changed')
        if o0['c']: return ('refused', None, 'change')
        state = (o0['ph'], o0['sub'])
    return ('refused', None, 'never-reached')

res = {}
if '--lead' in sys.argv:
    for i, j in enumerate(cases):
        try: res[i] = dict(zip(('kind', 't', 'why'), lead_t(j)))
        except Exception as ex: res[i] = {'kind': 'refused', 't': None, 'why': 'error:' + str(ex)[:80]}
    json.dump(res, open(sys.argv[2], 'w')); print(len(res), 'lead jobs'); sys.exit(0)
for i, c in enumerate(cases):
    try:
        kk, h, w = sim(c)
    except Exception as ex:
        kk, h, w = 'refused', [], 'error:' + str(ex)[:80]
    res[i] = {'kind': kk, 'hops': h, 'why': w}
json.dump(res, open(sys.argv[2], 'w'))
print(len(res), 'cases')
