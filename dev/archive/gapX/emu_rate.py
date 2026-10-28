# emu_rate.py <handler> <phase> <frames> <flyofs> <size> [len=..] [ftest]: the air lane's emu_takeoff.Run (dev/archive/air), its frame
# advanced by the motion's own rate -- 0xb0900(e) after each step (the factor 0xc1010 multiplies the curve by; 0xb07b4 sets P+0x398),
# not by 1.0. emu_takeoff steps frame += 1 whatever the rate, which holds Alatreon's (7, 5) L2 M2 (rate 0.6 / 0.9) wrongly.
import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\archive\air')
sys.argv_saved = sys.argv
import importlib.util
spec = importlib.util.spec_from_file_location('emu_takeoff', r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\archive\air\emu_takeoff.py')
M = importlib.util.module_from_spec(spec)
sys.argv = ['x']
spec.loader.exec_module(M)
sys.argv = sys.argv_saved
from unicorn.arm_const import UC_ARM_REG_S0
class RateRun(M.Run):
    def step(self):
        self.wf(M.E + 0x500, self.frame)
        fresh = getattr(self, 'fresh', False); self.fresh = False; self.fresh_now = fresh
        self.wf(M.E + 0x13ac, self.frame if fresh else self.frame - 1.0); self.wf(M.E + 0x13b4, 0.0 if fresh else 1.0)
        for o in (0x1380, 0x1384, 0x1388, 0x138c): self.w(M.E + o, 0)
        self.call(self.handler, args=M.ARGS)
        self.call(0xa5db8)
        self.call(0xbf284)
        y = self.rf(M.P + 0x44)
        self.call(0xb0900)                      # the motion's rate (P+0x398 x the speed)
        r = self.sf(UC_ARM_REG_S0)
        self.rate = r
        self.frame += r
        return y
h = int(sys.argv[1], 16); ph = int(sys.argv[2]); n = int(sys.argv[3]); fo = float(sys.argv[4]); sz = float(sys.argv[5])
lens = {}
for a in sys.argv[6:]:
    if a == 'ftest': M.FRAMETEST[0] = True
    if a.startswith('len='):
        for kv in a[4:].split(','): k, v = kv.split(':'); lens[int(k, 16)] = float(v)
R = RateRun(h, ph, fo, sz, lens=lens)
R.wf(M.DTB + 0x64, 1.0); R.wf(M.P + 0x398, 1.0); R.wf(M.P + 0x38c, 1.0); R.wf(M.P + 0x394, 1.0)   # the speed's factors (0xb07b4: P+0x38c x +0x394 x +0x398)
R.ended = False
for k in range(n):
    y = R.step()
    print('step %3d motion %s frame %7.2f rate %.2f posture %d phase %d above %8.2f vy %7.2f drawn %8.2f' % (k, hex(R.motion) if R.motion is not None else '-',
          R.frame - R.rate, R.rate, R.rb(M.P + 0x1ba), R.rb(M.P + 0x1a1), y - R.rf(M.P + 0x5b4), R.rf(M.P + 0x14), y + R.rf(M.E + 0x1384) - R.rf(M.P + 0x5b4)))
    while R.log: print('   ', R.log.pop(0))
    if R.ended: break
