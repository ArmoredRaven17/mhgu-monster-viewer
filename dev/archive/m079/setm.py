import re
S=r'C:/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad/m079/'
L=[l.rstrip() for l in open(S+'band.txt')]
ins=[(int(l[:8],16),l[10:18].strip(),l[19:].strip()) for l in L]
tg=set()
from collections import Counter
c=Counter()
for i,(a,m,o) in enumerate(ins):
    if m in('bl','b','blx') and o.startswith('#0x'):
        c[o]+=1
SETM=['#0xafe84','#0xafe8c','#0xafe80','#0xafe88','#0xafce8','#0xafcf0','#0xafd00']
for k in SETM: print(k,c[k])
for i,(a,m,o) in enumerate(ins):
    if m in('bl','b') and o in SETM:
        src=None
        for j in range(i-1,max(0,i-20),-1):
            aj,mj,oj=ins[j]
            if re.match(r'r1, ',oj) and mj not in('cmp','str','strb','strh','ldrb','tst') and not mj.startswith('v'):
                src=(hex(aj),mj,oj); break
            if mj in ('bl','blx') : src=('call-before',hex(aj),oj); break
        if not src or not (src[1].startswith("mov") and "#" in src[2]):
            print(hex(a),m,o,'r1<-',src)
