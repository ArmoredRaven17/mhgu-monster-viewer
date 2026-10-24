import sys, os
os.environ['FB_CLASS'] = sys.argv[1]; os.environ['FB_MON'] = sys.argv[2]; st, n = [int(x, 0) for x in sys.argv[3].split(':')]; var = int(sys.argv[4])
sys.argv = ['x']
import trgen as T
for a, nm in ((0xb00b4, 'b00b4'), (0xb0174, 'b0174'), (0xb0230, 'b0230'), (0xb03f8, 'b03f8'), (0xb04d0, 'b04d0'), (0xb0004, 'b0004')): T.MOT[a] = nm
for ph in range(6):
    for sc in ({}, {'frame': 1, 'frame2': 1}, {'ended': 1}, {'landed': 1}, {'timer': 1}, {'frame': 1, 'frame2': 1, 'ended': 1, 'landed': 1}):
        r = T.run(st, n, ph, var, 0, stub={0x3a8430: 5}, **sc)
        ms = sorted(set(e[1] for e in r.get('ev', []) if e[0] == 'mot')); cr = [(e[1], e[2]) for e in r.get('ev', []) if e[0] == 'create']
        ft = sorted(set(e[1] for e in r.get('ev', []) if e[0] == 'ftest'))
        print('p%d %s -> p%d %s %s ftests %s' % (ph, sc, T.mu.mem_read(T.P + 0x1a1, 1)[0], ms, cr, ft))
