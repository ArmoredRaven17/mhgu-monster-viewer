import sys
from armdis import dis
for x in sys.argv[1:]:
    a=int(x,16)
    b=a
    while b>a-0x2000:
        s=dis(b,b+4)[0][1]
        if s.startswith('push') and 'lr' in s: break
        b-=4
    print(x,'fn',hex(b),dis(b,b+4)[0][1])
