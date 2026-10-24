import sys; sys.path.insert(0, r'C:\MHGU-Extract\efx'); import armdis as A
lo=int(sys.argv[1],16); hi=int(sys.argv[2],16)
for a,m,o in A.sweep(lo,hi): print('%08x  %-9s %s'%(a,m,o))
