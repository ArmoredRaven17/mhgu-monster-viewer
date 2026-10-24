import sys, struct, itertools
sys.path.insert(0,'.')
import emu88b as emu88, sweepb as sweep
from sweep3 import fmt
emu88.NATIVE.append((0x43a374,0x43a39c))
def objs(base, offs, states):
    ex=[]
    for i,(o,st) in enumerate(zip(offs,states)):
        a=emu88.NES+0x2000+0x400*(i+ (0 if base==0xd420 else 8))
        ex += [(a+0x40, struct.pack('<fff',1,2,3)), (a+4, bytes([st])), (emu88.E+o, struct.pack('<I',a))]
    return ex
base=sweep.run(0)
D420=objs(0xd420,[0xd420,0xd424,0xd428,0xd42c,0xd430],[1]*5)
for states in itertools.product((0,1),repeat=4):
    for d420 in (0,1):
        ex=objs(0xd450,[0xd450,0xd454,0xd458,0xd45c],states)+[(emu88.E+0xd408,b'\x01')]+(D420 if d420 else [])
        r=sweep.run(0, extra=ex)
        for m in sorted(r):
            w0=sweep.windows(base[m]); w=sweep.windows(r[m])
            w={k:v for k,v in w.items() if not (k[0]=='slot' and k[2] in (1014,1015))}
            s=fmt(w,w0)
            if s: print('st%s d420=%d'%(''.join(map(str,states)),d420), 'L2 M%d'%m, s)
