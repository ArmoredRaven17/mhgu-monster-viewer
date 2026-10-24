# the sp_00 0 spawn point (joint 3 + (0,-80,140) through joint 3's world 3x3) and its fall, size 1, unit at the origin (the ground)
import sys; sys.argv = ['x', 'em025_00', '2', 'Motion[45]']
exec(open(__file__.replace('spawn45.py', 'jpos.py')).read().split('if __name__')[0])
import numpy as np
for F in (69, 70, 71):
    P, world = pose(F / 60.0)
    M = world(names['7:3'])
    o = M[:3, :3] @ np.array([0, -80, 140]) / 100 * 100      # 3x3 in metres-per-metre: offset (game units) stays game units
    p = M[:3, 3] * 100 + o
    print('f%d j3' % F, np.round(M[:3, 3] * 100, 1), 'offset turned', np.round(o, 1), 'spawn', np.round(p, 1),
          '3x3 col norms', np.round(np.linalg.norm(M[:3, :3], axis=0), 3))
