# act35.py: what action (3, 5) plays on uEm037_00 (and controls (3, 4) / (3, 6)) -- the action main under trgen, phases 0..3,
# every frame test answered 0 then 1, ended 0 / 1: the setMotion calls and the action changes
import os, sys
os.environ['FB_CLASS'] = 'uEm037_00'; os.environ['FB_MON'] = 'em037_00'; os.environ['FB_EM'] = '37'
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'fb'))
sys.argv = ['x']
import trgen as T
for n in (4, 5, 6):
    for var in (0, 4):
        seen = []
        for ph in range(4):
            for fr in (0, 1):
                for en in (0, 1):
                    r = T.run(3, n, ph, var, 0, frame=fr, frame2=fr, ended=en, stub={0x3a8430: 5, 0x49930: 10})
                    ev = [tuple(map(str, e[:2])) for e in r.get('ev', []) if e[0] in ('mot', 'chg')]
                    for e in ev:
                        if e not in seen: seen.append(e)
        print('(3, %d) var %d:' % (n, var), seen)
