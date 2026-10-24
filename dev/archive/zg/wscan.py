import sys,re
sys.path.insert(0,r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\zg')
from armdis import dis
# find movw rX,#IMM followed within 8 by a store using rX as offset reg
lo,hi,imm=int(sys.argv[1],16),int(sys.argv[2],16),sys.argv[3]
L=dis(lo,hi)
for k,(a,s) in enumerate(L):
    m=re.match(r'movw (\w+), #'+imm+r'$',s)
    if not m: continue
    r=m.group(1)
    for a2,s2 in L[k+1:k+10]:
        if re.match(r'str',s2) and re.search(r'\b'+r+r'\]',s2): print(hex(a),'->',hex(a2),s2)
        if re.match(r'add \w+, \w+, '+r+'$',s2): print(hex(a),'-> add',hex(a2),s2)
