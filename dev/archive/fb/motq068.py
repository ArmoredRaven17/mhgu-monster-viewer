import sys, os
sys.argv = ['x']
os.environ.setdefault('FB_CLASS', 'uEm068_00'); os.environ.setdefault('FB_MON', 'em068_00')
import trgen as T
for a, nm in ((0xb00b4, 'b00b4'), (0xb0174, 'b0174'), (0xb0230, 'b0230'), (0xb03f8, 'b03f8'), (0xb04d0, 'b04d0'), (0xb0004, 'b0004')): T.MOT[a] = nm
STUB = {0x3a8430: 5}
for st, n in ((7, 0x1e), (7, 0x25), (7, 0x1f), (7, 0x28), (1, 0), (1, 0x16), (2, 0x1e), (2, 0x1f), (2, 0x44), (2, 0x45), (2, 0x46), (2, 0x47), (2, 0x4a), (2, 0x4b), (6, 0), (6, 0xa), (7, 0x18), (7, 0x1a), (7, 0x26), (7, 0x27), (7, 0x3c), (7, 0x3d), (7, 0x17), (7, 0x1c), (7, 0x22), (7, 0x24)):
    out = []
    for ph in range(5):
        for sub in (0, 1, 2):
            for fr in (0, 1):
                r = T.run(st, n, ph, 0, sub, stub=STUB, frame=fr, frame2=fr)
                ms = [e[1] + ('@' + e[4]) for e in r.get('ev', []) if e[0] == 'mot']
                if ms: out.append('p%d s%d f%d %s' % (ph, sub, fr, ' '.join(sorted(set(ms)))))
    print('%d:%#04x' % (st, n), ' | '.join(sorted(set(out))))
