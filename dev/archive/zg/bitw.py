# bitw.py <lo> <hi> <field> <maskregex>: movw #field followed (within 10) by orr/bic/and/eor/bfi using the mask, and a store
import sys, re
from armdis import dis
lo,hi=int(sys.argv[1],16),int(sys.argv[2],16); fld=sys.argv[3]; mk=re.compile(sys.argv[4])
L=dis(lo,hi)
for k,(a,s) in enumerate(L):
    if not re.match(r'movw \w+, #'+fld+'$', s): continue
    w=L[k+1:k+12]
    ops=[(b,x) for b,x in w if re.match(r'(orr|bic|and|eor|bfi|bfc|mvn)',x) and mk.search(x)]
    st=[(b,x) for b,x in w if x.startswith('str')]
    if ops and st: print(hex(a), ' ; '.join('%s %s'%(hex(b),x) for b,x in ops+st[:1]))
