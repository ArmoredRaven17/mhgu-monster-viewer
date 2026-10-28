# does uEm082_00 vt+0x1fc remap any request (st, n) into (10, 0xaf)? every st 0..15 x n 0..255, previous action (0, 0), not tired
import sys
sys.argv = ['x']
sys.path.insert(0, r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\laneA3\sub082')
import fc082
changed = []; into = []
for var in (0, 4):
    for st in range(16):
        for n in range(256):
            s, after, hit = fc082.run((st, n), (0, 0), var)
            if after != (st, n): changed.append((var, st, n, after))
            if after == (10, 0xaf) and (st, n) != (10, 0xaf): into.append((var, st, n))
print('remapped requests:', len(changed), changed[:40])
print('into (10,0xaf):', into)
