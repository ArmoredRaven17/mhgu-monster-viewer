# ratediff.py: trap 169's audit -- every handler the air lane ran through emu_takeoff (dev/air-height.md 1.3 / 2 / 5.2), run again in the
# same process twice: emu_takeoff.Run as it was (frame += 1) and the rate-stepped run (frame += 0xb0900 = e+0x50c, the speed's factors
# P+0x38c / +0x394 / +0x398 seeded 1.0 in both). Per case: the rates the run saw, and the unit height / drawn height against the MOTION
# FRAME in each, compared at the same (motion, frame) -- the viewer's rows are indexed by the clip frame.
import sys, struct, json, importlib.util
spec = importlib.util.spec_from_file_location('emu_takeoff', r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\archive\air\emu_takeoff.py')
M = importlib.util.module_from_spec(spec); sys.argv, _a = ['x'], sys.argv; spec.loader.exec_module(M); sys.argv = _a
from unicorn.arm_const import UC_ARM_REG_S0
class Base(M.Run):
    RATE = False
    def step(self):
        self.wf(M.E + 0x500, self.frame)
        fresh = getattr(self, 'fresh', False); self.fresh = False; self.fresh_now = fresh
        self.wf(M.E + 0x13ac, self.frame if fresh else self.frame - 1.0); self.wf(M.E + 0x13b4, 0.0 if fresh else 1.0)
        for o in (0x1380, 0x1384, 0x1388, 0x138c): self.w(M.E + o, 0)
        self.call(self.handler, args=M.ARGS)
        self.call(0xa5db8); self.call(0xbf284)
        y = self.rf(M.P + 0x44) - self.rf(M.P + 0x5b4)
        d = y + self.rf(M.E + 0x1384)
        f = self.frame
        self.call(0xb0900); r = self.sf(UC_ARM_REG_S0)
        self.frame += r if self.RATE else 1.0
        return f, r, y, d
class Rate(Base): RATE = True
def lensOf(mon):
    s = open(r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\gapY\lens_%s.txt' % mon).read().strip()
    return {int(k, 16): float(v) for k, v in (kv.split(':') for kv in s.split(','))}
def run(cls, h, ph, fo, sz, lens, n, args, init, ret):
    M.ARGS[:] = args; M.RET1.clear(); M.RET1.update(ret); M.FRAMETEST[0] = True
    R = cls(h, ph, fo, sz, lens=lens, **init)
    R.wf(M.DTB + 0x64, 1.0)
    for o in (0x398, 0x38c, 0x394): R.wf(M.P + o, 1.0)
    R.ended = False; rows = []
    for k in range(n):
        try: f, r, y, d = R.step()
        except Exception as e: rows.append(('FAULT', str(e)[:40])); break
        rows.append((hex(R.motion) if R.motion is not None else '-', round(f, 3), round(r, 3), round(y, 2), round(d, 2), R.rb(M.P + 0x1ba)))
        R.log.clear()
        if R.ended: break
    return rows
CASES = [
  ('em077_00 (3,0) takeoff', 'em077_00', 0xfe2b7c, 0, 500, 1.0, 400, [], {}, {}),
  ('em077_00 (3,1)', 'em077_00', 0xfe2ce4, 0, 500, 1.0, 300, [], {}, {}),
  ('em077_00 (3,0x50) ledge climb', 'em077_00', 0xfe6f38, 0, 500, 1.0, 300, [], {}, {}),
  ('em001_00 (3,0) takeoff', 'em001_00', 0xcf49ec, 0, 500, 1.0, 400, [], {}, {}),
  ('em001_00 (0,6) hover idle', 'em001_00', 0xcf2ba0, 0, 500, 1.0, 200, [], {'posture': 3}, {}),
  ('em001_00 (4,4) hover turn', 'em001_00', 0xcfad9c, 0, 500, 1.0, 200, [], {'posture': 3}, {}),
  ('em001_00 (4,5)', 'em001_00', 0xcfb160, 0, 500, 1.0, 200, [], {'posture': 3}, {}),
  ('em001_00 (4,0xc)', 'em001_00', 0xcfbb98, 0, 500, 1.0, 200, [], {'posture': 3}, {}),
  ('em001_00 (4,3) descent', 'em001_00', 0xcfab98, 0, 500, 1.0, 300, [], {'posture': 1, 'y0': 985.5}, {}),
  ('em001_00 (7,0x24) L4 M26', 'em001_00', 0xcfd898, 0, 500, 1.0, 300, [1], {'posture': 3}, {}),
  ('em001_00 (7,0x78) d02a74(2)', 'em001_00', 0xd02a74, 0, 500, 1.0, 300, [2], {'posture': 3}, {}),
  ('em001_00 (7,0x2d) dive', 'em001_00', 0xcff66c, 0, 500, 1.0, 300, [1, 3], {'posture': 1, 'y0': 985.5}, {}),
  ('em081_00 takeoff 0x101d348', 'em081_00', 0x101d348, 0, 500, 1.0, 400, [], {}, {}),
  ('em081_00 takeoff 0x101d494', 'em081_00', 0x101d494, 0, 500, 1.0, 400, [], {}, {}),
  ('em081_00 L4 M26 0x10247ec', 'em081_00', 0x10247ec, 0, 500, 1.0, 300, [], {'posture': 3}, {}),
  ('em079_00 takeoff 0xff3ec4', 'em079_00', 0xff3ec4, 0, 300, 1.0, 400, [], {}, {}),
]
res = {}
for name, mon, h, ph, fo, sz, n, args, init, ret in CASES:
    lens = lensOf(mon)
    a = run(Base, h, ph, fo, sz, lens, n, args, init, ret); b = run(Rate, h, ph, fo, sz, lens, n, args, init, ret)
    rates = sorted(set(r[2] for r in b if r[0] != 'FAULT'))
    # compare at the same (motion, frame): the base run's integer frames against the rate run's, nearest
    ib = {}
    for r in b:
        if r[0] == 'FAULT': continue
        ib.setdefault(r[0], []).append(r)
    md = 0.0; mdd = 0.0; where = None
    for r in a:
        if r[0] == 'FAULT': continue
        cand = ib.get(r[0])
        if not cand: continue
        q = min(cand, key=lambda x: abs(x[1] - r[1]))
        if abs(q[1] - r[1]) > 0.51: continue
        if abs(q[3] - r[3]) > md: md = abs(q[3] - r[3]); where = (r[0], r[1], r[3], q[3])
        mdd = max(mdd, abs(q[4] - r[4]))
    res[name] = {'rates': rates, 'max_unit_diff': round(md, 2), 'max_drawn_diff': round(mdd, 2), 'at': where,
                 'steps': [len(a), len(b)], 'faults': [x for x in (a[-1], b[-1]) if x[0] == 'FAULT'], 'base': a, 'rate': b}
    print('%-34s rates %-26s unit diff %8.2f drawn diff %8.2f at %s steps %s %s' % (name, rates, md, mdd, where, [len(a), len(b)], res[name]['faults']))
json.dump(res, open(r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\gapY\ratediff.json', 'w'))
