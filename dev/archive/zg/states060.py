import sys, re, tracec as TR
var=int(sys.argv[1]); acts=[(10,0x1b),(10,0x1d),(10,0x1e),(10,0x1f),(10,0x20),(10,0x6e),(10,7),(10,0x14),(10,0xe),(10,0x72),(10,0x2a),(10,0x2b),(0,0),(0,1),(0,2),(11,0),(11,7),(11,0x10),(11,0x12)]+[(1,n) for n in range(0,0x20)]
for st,n in acts:
    out=[]
    for ph in range(0,3):
        for e in (0,1):
            for part in (0,):
                ev=TR.run(var,st,n,ph,e,e,0,follows=1)
                for x in ev:
                    if x.startswith(('MOT','SCRIPT','U1400')) :
                        k='ph%d '%ph + re.sub(r' b5f8=\S+ act=\S+ @\S+','',x)
                        if k not in out: out.append(k)
    if out: print((st,hex(n)), ' | '.join(out)[:260])
