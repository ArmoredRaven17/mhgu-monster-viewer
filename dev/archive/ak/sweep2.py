import sys, struct, collections
sys.path.insert(0,'.')
import emu88, sweep
OBJ=emu88.NES+0x1000
def fakes(which):
    ex=[(OBJ+0x40, struct.pack('<fff',1.0,2.0,3.0))]
    for off in which: ex.append((emu88.E+off, struct.pack('<I',OBJ)))
    return ex
if __name__=='__main__':
  pass
cases={
 'd420s': fakes([0xd420,0xd424,0xd428,0xd42c,0xd430]),
 'd450s': fakes([0xd450,0xd454,0xd458,0xd45c]),
 'd420+d408': fakes([0xd420,0xd424,0xd428,0xd42c,0xd430])+[(emu88.E+0xd408,b'\x01')],
}
def _main():
    base={}
    for mode in (0,):
        r0=sweep.run(mode)
        for name,ex in cases.items():
            r=sweep.run(mode, extra=ex)
            for m in sorted(r):
                w0=sweep.windows(r0[m]); w=sweep.windows(r[m])
                if w!=w0:
                    print(name,'L2 M%d'%m, '; '.join('%s %s'%(k, ','.join('%d-%d'%x for x in v)) for k,v in sorted(w.items(), key=str) if w0.get(k)!=v))
if __name__=='__main__':
    _main()
