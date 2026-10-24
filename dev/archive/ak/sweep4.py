import sys, struct
sys.path.insert(0,'.')
import emu88, sweep, sweep2
from sweep3 import fmt
D420=sweep2.fakes([0xd420,0xd424,0xd428,0xd42c,0xd430]); D450=sweep2.fakes([0xd450,0xd454,0xd458,0xd45c])
B408=[(emu88.E+0xd408,b'\x01')]
envs={'plain':[], 'd408':B408, 'd420':D420, 'd420+408':D420+B408, 'd450':D450}
acts=[(0,0),(1,5),(1,0xd),(1,0x1c),(1,0x1d),(1,0x1e),(1,0x1f),(1,0x21),(1,0x22),(1,0x23),(1,0x24),(1,0x25)]
T1BC=[(emu88.P+0x1bc, struct.pack('<f',v)) for v in (0.0,)]
for v in (15.0,40.0,80.0,150.0,400.0): envs['p1bc%d'%v]=[(emu88.P+0x1bc, struct.pack('<f',v))]
base=sweep.run(0)
for en,ex in envs.items():
    for a in acts:
        if en.startswith("p1bc") and a!=(1,0x21): continue
        r=sweep.run(0, action=a, extra=ex)
        for m in sorted(r):
            w0=sweep.windows(base[m]); w=sweep.windows(r[m])
            # drop the handle-list threads (u341 via 1014/1015) to keep it compact
            w={k:v for k,v in w.items() if not (k[0]=='slot' and k[2] in (1014,1015))}
            s=fmt(w,w0)
            if s: print(en, a, 'L2 M%d'%m, s)
