import sys, os, struct
sys.argv = ['x']
os.environ.setdefault('FB_CLASS', 'uEm068_00'); os.environ.setdefault('FB_MON', 'em068_00')
import trgen as T
for a, nm in ((0xb00b4, 'b00b4'), (0xb0174, 'b0174'), (0xb0230, 'b0230'), (0xb03f8, 'b03f8'), (0xb04d0, 'b04d0'), (0xb0004, 'b0004')): T.MOT[a] = nm
for n in (0x1e, 0x1f, 0x28):
    for ph in (0, 1, 2):
        for sc in ({'frame': 0, 'frame2': 0}, {'frame': 1, 'frame2': 1}, {'ended': 1}):
            for k44 in (0, 2, 3):
                r = T.run(7, n, ph, 0, 0, stub={0x3a8430: 5}, poke={T.C + 0x44: [k44]}, **sc)
                print('7:%#04x p%d %s k44 %d -> phase %d %s' % (n, ph, sc, k44, T.mu.mem_read(T.P + 0x1a1, 1)[0], [e[1] for e in r.get('ev', []) if e[0] == 'mot']))
