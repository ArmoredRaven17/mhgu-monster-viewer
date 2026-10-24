import sys, struct
sys.path.insert(0,'.')
import emu88, sweep
def fmt(w, w0):
    return '; '.join('%s %s'%(k[1:] if k[0]=='slot' else k, ','.join('%d-%d'%x for x in v)) for k,v in sorted(w.items(), key=str) if w0.get(k)!=v)
def diff(label, mode=0, extra=(), actions=(), rage=0):
    r0=sweep.run(mode, extra=extra, rage=rage)
    for act in actions:
        r=sweep.run(mode, action=act, extra=extra, rage=rage)
        lines=[]
        for m in sorted(r):
            w0=sweep.windows(r0[m]); w=sweep.windows(r[m])
            if w!=w0: lines.append('  L2 M%d: %s'%(m, fmt(w,w0)))
        if lines: print(label, act); print('\n'.join(lines))
if __name__=='__main__':
    st=int(sys.argv[1])
    diff('mode0', actions=[(st,n) for n in range(0,0x100)])
