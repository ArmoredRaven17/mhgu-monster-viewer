# drip070.py: every action of all 16 statuses, phases 0..4, with the countdown 0x7206c answered 1 (the timer scenario): the creates
import sys, os
sys.argv = ['x']
os.environ.setdefault('FB_CLASS', 'uEm070_00'); os.environ.setdefault('FB_MON', 'em070_00')
import trgen as T
for a, nm in ((0xb00b4, 'b00b4'), (0xb0174, 'b0174'), (0xb0230, 'b0230'), (0xb03f8, 'b03f8'), (0xb04d0, 'b04d0'), (0xb0004, 'b0004')): T.MOT[a] = nm
for st in range(16):
    for n in range(256):
        out = set()
        for ph in range(5):
            for sc in ({'timer': 1}, {'timer': 1, 'frame': 1, 'frame2': 1}):
                for rk in (1, 3, 5):
                    r = T.run(st, n, ph, 0, 0, stub={0x3a8430: rk}, **sc)
                    ms = [e[1] for e in r.get('ev', []) if e[0] == 'mot']
                    for e in r.get('ev', []):
                        if e[0] == 'create' and e[1] in ('0x12a', '0x12b'): out.add('p%d r%d %s m%d %s mot %s' % (ph, rk, e[1], e[2], e[5], ms))
        if out: print('%d:%#04x' % (st, n), sorted(out), flush=True)
