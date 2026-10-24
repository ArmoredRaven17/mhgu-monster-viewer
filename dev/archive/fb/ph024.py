import sys, os
os.environ['FB_CLASS'] = 'uEm024_00'; os.environ['FB_MON'] = 'em024_00'
acts = [tuple(int(x, 0) for x in a.split(':')) for a in sys.argv[1].split(',')]
sys.argv = ['x']
import trgen as T
for a, nm in ((0xb00b4, 'b00b4'), (0xb0174, 'b0174'), (0xb0230, 'b0230'), (0xb03f8, 'b03f8'), (0xb04d0, 'b04d0'), (0xb0004, 'b0004')): T.MOT[a] = nm
for st, n in acts:
  for ph in range(1, 5):
    for sc in ({'only': 106.0}, {'only': 106.0, 'landed': 1}, {'ended': 1}, {'landed': 1}, {'timer': 1}, {'only': 46.0}, {'frame': 1, 'frame2': 1, 'ended': 1}):
        r = T.run(st, n, ph, 0, 0, stub={0x3a8430: 5}, **sc)
        ms = sorted(set(e[1] for e in r.get('ev', []) if e[0] == 'mot')); ch = [e for e in r.get('ev', []) if e[0] == 'chg']
        np = T.mu.mem_read(T.P + 0x1a1, 1)[0]
        if np != ph or ms or ch: print('%d:%#x p%d %s -> p%d %s %s' % (st, n, ph, sc, np, ms, ch[:2]))
