"""carrysim.py <cases.json> <out.json> (atkfix lane, 2026-10-27): THE CARRY READ FROM THE ACTION MAIN ITSELF, tick by tick.

For each unlocked overrunning attack arm (flags bit 0 set: no motion lock, 0x7ddb8), run the arming action's main under
actmot/amtrace.py (the action census's machine: CLS / EM env as runall.py) from the state the arm left, and step it:
  * while the motion plays (ended 0): the runs under frame 0 / 1 x RET 0 / 1 must agree and leave the state (phase P+0x1a1,
    sub-phase P+0x1a2) unchanged -- a change on a frame test is 'frame-gated', on a stubbed answer 'stub-answer' (the stubs named); an
    unconditional change is stepped (one tick each, the motion still playing);
  * at its end (ended 1, frame 1; RET 0 / 1 must agree): a setMotion -> the next motion (shift = the frames since the arm motion's frame
    0); a phase / sub-phase change with no motion -> stepped one tick more (the motion stays ended); a FOLLOW (the change family, C
    follow) -> the followed action from phase 0, one tick on; another change -> 'change:<kind>'; nothing -> 'waits';
  * a motion set again is a replay (the chain goes on with it); a turn record picking between several motions -> 'turn'.
THE BLEND IS NOT IN THE SHIFT: the layer update 0x94ece4.. advances the frame (+0x4fc, prev +0x500, 0x94eee8..0x94ef08) whether or not
the blend gate +0x4f4 runs (0x94ed14..0x94ed90 only counts the gate down), so a motion's frame 0 is its set tick. (The gate enters
the ARM's own delay instead: 0x7dc88..0x7dd18, start + gate - frame -- see the exporter's `lead`.)
Cases: [{id, cls, em, var, st, n, phase, gate, key, end, clipLen, open}], end = the window's end in the arm motion's frames.
Out: {case index: {kind, hops: [[key, shift]], why}}."""
import sys, os, json
sys.path.insert(0, r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\archive\actmot')
cases = json.load(open(sys.argv[1]))
import amtrace as A

def run(var, st, n, ph, sub, e, f, ret):
    ev, stubs, ob, nph, err = A.run(var, st, n, ph, sub, e, f, ret)
    nsub = A.mu.mem_read(A.P + 0x1a2, 1)[0]
    mains = [x for x in ev if x[0] == 'M']
    chg = [x for x in ev if x[0] == 'C' and not str(x[1]).startswith('default')]
    return {'m': [(x[1], x[5]) for x in mains], 'c': [(x[1], x[2], x[3]) for x in chg], 'ph': nph, 'sub': nsub, 'err': err,
            'stubs': sorted('%#x' % s if isinstance(s, int) else str(s) for s in stubs)}

def key(o):
    return json.dumps([o['m'], o['c'], o['ph'], o['sub']])

def mkey(mid):
    return '%d|Motion[%d]' % (mid >> 8, mid & 0xff)

def sim(c):
    var, st, n = c['var'], c['st'], c['n']
    L, O = c['clipLen'], set(c['open'])
    # the arm's run: the state it leaves
    o = run(var, st, n, c['phase'], 0, 0, 1 if c['gate'] >= 0 else 0, 0)
    state = (o['ph'], o['sub'])
    cur, base, hops = c['key'], 0, []         # base: the arm motion's frame at which `cur` has its frame 0
    act = (st, n)
    for hop in range(24):
        # (A) while `cur` plays (t: ticks since cur's frame 0; the arm motion's first pass starts at the arm's frame gate)
        t = max(0, int(c['gate'])) if cur == c['key'] and not hops else 0
        for tick in range(12):
            t += 1
            outs = {(f, r): run(var, act[0], act[1], state[0], state[1], 0, f, r) for f in (0, 1) for r in (0, 1)}
            ks = {k: key(v) for k, v in outs.items()}
            o0 = outs[(0, 0)]
            if len(set(ks.values())) > 1:
                byf = ks[(0, 0)] != ks[(1, 0)] or ks[(0, 1)] != ks[(1, 1)]
                why = 'frame-gated' if byf else 'stub-answer:' + ','.join(sorted(set(outs[(0, 1)]['stubs']) | set(o0['stubs']))[:6])
                return stop(hops, why)
            fol = [x for x in o0['c'] if x[0] == 'follow']
            if o0['c'] and not fol: return stop(hops, 'change:' + o0['c'][0][0])
            if fol and not o0['m']:
                # handed over on no test while `cur` plays: the followed action's first run, the next tick
                act = (fol[0][1], fol[0][2])
                o2 = {(f, r): run(var, act[0], act[1], 0, 0, 0, f, r) for f in (0, 1) for r in (0, 1)}
                if len({key(v) for v in o2.values()}) > 1: return stop(hops, 'follow-gated:%d:0x%02x' % act)
                oo = o2[(0, 0)]
                if not oo['m']: return stop(hops, 'follow-no-motion:%d:0x%02x' % act)
                k2 = mkey(oo['m'][-1][0]); sh = base + t + 1
                if k2 not in L and k2 not in O: return stop(hops, 'not-in-lists:' + k2)
                if c['end'] - sh <= 0: return ('carried' if hops else 'ends-before', hops, None)
                hops.append([k2, sh]); cur, base = k2, sh; state = (oo['ph'], oo['sub']); t = 0
                if cur in O or c['end'] <= base + L[cur]: return ('carried', hops, None)
                continue
            if o0['m']:
                # set on no test while `cur` still plays: at this tick (cur's frame tick + 1)
                nxt = o0['m'][-1][0]; k2 = mkey(nxt)
                if k2 == cur: return stop(hops, 'reset-each-tick')
                if k2 not in L and k2 not in O: return stop(hops, 'not-in-lists:' + k2)
                sh = base + t
                if c['end'] - sh <= 0: return ('carried' if hops else 'ends-before', hops, None)
                hops.append([k2, sh]); cur, base = k2, sh; state = (o0['ph'], o0['sub']); t = 0
                if cur in O or c['end'] <= base + L[cur]: return ('carried', hops, None)
                continue
            if (o0['ph'], o0['sub']) == state: break
            state = (o0['ph'], o0['sub'])
        else:
            return stop(hops, 'no-settle')
        # (B) `cur` has ended
        extra = 0
        for tick in range(12):
            outs = {r: run(var, act[0], act[1], state[0], state[1], 1, 1, r) for r in (0, 1)}
            if key(outs[0]) != key(outs[1]):
                return stop(hops, 'stub-answer:' + ','.join(sorted(set(outs[0]['stubs']) | set(outs[1]['stubs']))[:6]))
            o = outs[0]
            fol = [x for x in o['c'] if x[0] == 'follow']
            if o['c'] and not fol: return stop(hops, 'change:' + o['c'][0][0])
            if o['m']:
                ms = sorted({m for m, via in o['m']})
                vias = {via for m, via in o['m']}
                if len(ms) > 1 and any(str(v).startswith('turn') for v in vias): return stop(hops, 'turn')
                nxt = o['m'][-1][0]
                k2 = mkey(nxt)
                sh = base + L[cur] + extra
                if k2 not in L and k2 not in O: return stop(hops, 'not-in-lists:' + k2)
                if c['end'] - sh <= 0: return ('carried' if hops else 'ends-before', hops, None)
                hops.append([k2, sh])
                state = (o['ph'], o['sub'])
                if fol: act = (fol[0][1], fol[0][2]); state = (0, 0)
                cur, base = k2, sh
                break
            if fol:
                act = (fol[0][1], fol[0][2]); state = (0, 0); extra += 1
                # the followed action's first run sets its motion with ended 0: (A)-like, unconditional
                o2 = {(f, r): run(var, act[0], act[1], 0, 0, 0, f, r) for f in (0, 1) for r in (0, 1)}
                k2s = {k: key(v) for k, v in o2.items()}
                if len(set(k2s.values())) > 1: return stop(hops, 'follow-gated:%d:0x%02x' % act)
                oo = o2[(0, 0)]
                if not oo['m']: return stop(hops, 'follow-no-motion:%d:0x%02x' % act)
                k2 = mkey(oo['m'][-1][0]); sh = base + L[cur] + extra
                if k2 not in L and k2 not in O: return stop(hops, 'not-in-lists:' + k2)
                if c['end'] - sh <= 0: return ('carried' if hops else 'ends-before', hops, None)
                hops.append([k2, sh]); cur, base = k2, sh; state = (oo['ph'], oo['sub'])
                break
            if (o['ph'], o['sub']) == state: return stop(hops, 'waits')
            state = (o['ph'], o['sub']); extra += 1
        else:
            return stop(hops, 'no-settle')
        if cur in O or c['end'] <= base + L[cur]: return ('carried', hops, None)
    return stop(hops, 'too-long')

def stop(hops, why):
    return ('carried', hops, why) if hops else ('refused', [], why)

res = {}
for i, c in enumerate(cases):
    try:
        k, h, w = sim(c)
    except Exception as ex:
        k, h, w = 'refused', [], 'error:' + str(ex)[:60]
    res[i] = {'kind': k, 'hops': h, 'why': w}
json.dump(res, open(sys.argv[2], 'w'))
print(len(res), 'cases')
