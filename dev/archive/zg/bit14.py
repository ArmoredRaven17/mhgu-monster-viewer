import re, sys
from armdis import dis
lo,hi=int(sys.argv[1],16),int(sys.argv[2],16)
step=0x80000
for s0 in range(lo,hi,step):
    L=dis(s0,min(hi,s0+step+0x100))
    for k,(a,s) in enumerate(L):
        if not re.match(r'movw (\w+), #0x140[89]$',s): continue
        for b,x in L[k+1:k+14]:
            m=re.match(r'(bic|and)\w* \w+, \w+, #(0x[0-9a-f]+)$',x)
            if m:
                v=int(m.group(2),16)
                if (m.group(1)=='bic' and (v>>14)&1) or (m.group(1)=='and' and v>0x3fff and not (v>>14)&1) : print(hex(a),hex(b),x)
            m=re.match(r'bfc \w+, #(\w+), #(\w+)$',x)
            if m:
                l,w=int(m.group(1),0),int(m.group(2),0)
                if l<=14<l+w: print(hex(a),hex(b),x)
