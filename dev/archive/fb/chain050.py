# chain013.py <variant>: the actions the variant's EMC issues (emcv<v>.txt) closed over the set-action calls their phases make
# (0x75230 / 0x768c8 / 0x76098 (e, st, n), every phase 0..5 x the frame / ended / landed scenarios)
import sys, os
v = int(sys.argv[1])
os.environ['FB_CLASS'] = 'uEm050_00'; os.environ['FB_MON'] = 'em050_00'
sys.argv = ['x']
import trgen as T
SP = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad'
todo = [tuple(int(x, 0) for x in a.split(':')) for a in open(SP + r'\emcv050.txt').read().split()]
seen = set(todo); edges = []
while todo:
    st, n = todo.pop()
    for ph in range(6):
        for sc in ({}, {'frame': 1, 'frame2': 1}, {'ended': 1}, {'landed': 1, 'ended': 1}):
            r = T.run(st, n, ph, v, 0, stub={0x3a8430: 5}, **sc)
            for e in r.get('ev', []):
                if e[0] == 'chg':
                    t = (e[1] & 0xff, e[2] & 0xff)
                    if t not in seen: seen.add(t); todo.append(t); edges.append('%d:%#04x->%d:%#04x' % (st, n, t[0], t[1]))
print(' '.join('%d:%#04x' % a for a in sorted(seen)))
print('#', ' '.join(edges))
