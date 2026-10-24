import sys, os
sys.argv=['x']
import trgen as T
for n in [int(x,0) for x in os.environ['NN'].split(',')]:
    for ph in range(7):
        for scn in ({}, {'ended': 1}, {'frame':1,'frame2':1}):
            r = T.run(7, n, ph, 0, 0, stub={0x3a8430: 5}, **scn)
            ev = [e for e in r.get('ev', []) if e[0] in ('mot','chg')]
            if ev: print(hex(n), ph, scn, ev[:4])
