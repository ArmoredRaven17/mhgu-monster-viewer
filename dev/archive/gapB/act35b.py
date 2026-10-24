import os, sys
os.environ['FB_CLASS'] = 'uEm037_00'; os.environ['FB_MON'] = 'em037_00'; os.environ['FB_EM'] = '37'
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'fb'))
sys.argv = ['x']
import trgen as T
for ph in range(3):
    for fr, en in ((0, 0), (1, 1)):
        r = T.run(3, 5, ph, 0, 0, frame=fr, frame2=fr, ended=en, landed=en, timer=en, stub={0x3a8430: 5, 0x49930: 10})
        print('ph', ph, 'fr', fr, 'end', r.get('end'), [e for e in r.get('ev', [])][:20])
