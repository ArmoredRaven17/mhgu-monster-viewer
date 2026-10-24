import sys, os
sys.argv = ['x']
os.environ.setdefault('FB_CLASS', 'uEm070_00'); os.environ.setdefault('FB_MON', 'em070_00')
import trgen as T
for a, nm in ((0xb00b4, 'b00b4'), (0xb0174, 'b0174'), (0xb0230, 'b0230'), (0xb03f8, 'b03f8'), (0xb04d0, 'b04d0'), (0xb0004, 'b0004')): T.MOT[a] = nm
T.WATCH.update({0xfa2610, 0xfa2930, 0xfa280c})
for n in range(256):
    r = T.run(3, n, 0, 0, 0, stub={0x3a8430: 5})
    ms = [e[1] for e in r.get('ev', []) if e[0] == 'mot']; w = [e[1] for e in r.get('ev', []) if e[0] == 'watch']
    r1 = T.run(3, n, 1, 0, 0, stub={0x3a8430: 5}, timer=1)
    w1 = [e[1] for e in r1.get('ev', []) if e[0] == 'watch']; c1 = [(e[1], e[2]) for e in r1.get('ev', []) if e[0] == 'create']
    if ms or c1: print('3:%#04x p0 %s %s | p1 %s %s' % (n, ms, w, w1, c1))
