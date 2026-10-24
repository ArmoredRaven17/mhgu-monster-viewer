import sys, struct
sys.path.insert(0,'.')
import emu88b as emu88, sweepb as sweep
from sweep3 import fmt
OBJ=emu88.NES+0x1000
def fakes(offs): return [(OBJ+0x40, struct.pack('<fff',1,2,3))]+[(emu88.E+o, struct.pack('<I',OBJ)) for o in offs]
D450=fakes([0xd450,0xd454,0xd458,0xd45c]); D420=fakes([0xd420,0xd424,0xd428,0xd42c,0xd430]); B408=[(emu88.E+0xd408,b'\x01')]
base=sweep.run(0)
for rv in (1,2):
    emu88.RETVAL[0x43a388]=rv
    for en,ex in (('d450+408',D450+B408),('d450',D450),('d420+450+408',D420+D450+B408)):
        r=sweep.run(0, extra=ex)
        for m in sorted(r):
            w0=sweep.windows(base[m]); w=sweep.windows(r[m])
            w={k:v for k,v in w.items() if not (k[0]=='slot' and k[2] in (1014,1015))}
            s=fmt(w,w0)
            if s: print('43a388=%d'%rv, en, 'L2 M%d'%m, s)
