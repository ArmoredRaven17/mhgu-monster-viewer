import sys, collections, struct
sys.path.insert(0,'.')
import emu88b as emu88
from unicorn import UC_HOOK_MEM_READ
LEN={1:147,2:171,3:171,4:403,5:89,6:191,7:89,8:191,9:127,10:169,11:127,12:169,13:171,14:265,15:97,16:257,17:233,19:129,20:229,21:155,22:37,23:249,24:301,25:55,26:33,27:63,28:301,29:101,30:25,31:99,32:101,33:25,34:99,35:273,36:335,37:129,38:229,39:661,40:127,41:285,42:127,43:285,44:155,45:37,46:249,47:97,48:57}
def run(mode, d3e1=4, action=(0,0), rage=0, extra=(), motions=None, reads=None):
    res={}
    for m in (motions or sorted(LEN)):
        k=emu88.Ka(mode=mode, d3e1=d3e1, action=action, rage=rage, extra=extra)
        if reads is not None:
            def rh(uc, acc, addr, size, val, ud):
                if emu88.E<=addr<emu88.E+0x40000: reads[addr-emu88.E]+=1
                elif emu88.G<=addr<emu88.G+0x1000: reads[('G',addr-emu88.G)]+=1
                elif emu88.P<=addr<emu88.P+0x40000: reads[('P',addr-emu88.P)]+=1
            k.mu.hook_add(UC_HOOK_MEM_READ, rh)
        fr=[]
        for f in range(LEN[m]):
            k.setframe(0x200+m, float(f), float(LEN[m]))
            lg=k.call(0x10b7644)
            fr.append((tuple(sorted(k.slots())), tuple(sorted(set((x[0],x[1]) for x in lg if x[0]!='slot')))))
        res[m]=fr
    return res
def windows(fr):
    # per (slot,id,kinds) the frame ranges
    d=collections.defaultdict(list)
    for f,(sl,other) in enumerate(fr):
        for s in sl: d[('slot',)+s].append(f)
        for o in other: d[o].append(f)
    out={}
    for key,fs in d.items():
        rng=[];a=b=fs[0]
        for x in fs[1:]:
            if x==b+1: b=x
            else: rng.append((a,b)); a=b=x
        rng.append((a,b)); out[key]=rng
    return out
if __name__=='__main__':
    reads=collections.Counter()
    r=run(int(sys.argv[1]), reads=reads, motions=[int(x) for x in sys.argv[2:]] or None)
    for m in sorted(r):
        w=windows(r[m])
        print('L2 M%d'%m, '; '.join('%s %s'%(k, ','.join('%d-%d'%x for x in v)) for k,v in sorted(w.items(), key=str)))
    print(sorted((('E',hex(k)) if isinstance(k,int) else (k[0],hex(k[1])),c) for k,c in reads.items() if not (isinstance(k,int) and 0xcb20<=k<0xd3e0)))
