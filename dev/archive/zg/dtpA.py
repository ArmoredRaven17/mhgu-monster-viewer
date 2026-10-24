import sys
for m in sys.argv[1:]:
    b=open(r'C:\MHGU-Extract\scratch-em\%s\enemy\dt_base\%s_dtbparts.dtp'%(m,m),'rb').read()
    n=b[8]; print(m,'A',[tuple(b[0x4d+4*i:0x4d+4*i+4]) for i in range(n)])
