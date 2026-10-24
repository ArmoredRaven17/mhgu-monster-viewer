# band.py <vtable>: the class's own methods = the vtable entries clustered around vt+0x13c (gap > 0x20000 splits)
import struct, sys
sys.path.insert(0, r'C:\MHGU-Extract\efx'); import armdis
vt=int(sys.argv[1],16)
ws=[]
for k in range(400):
    w=armdis.u32(vt+4*k)
    if not w or w>0x13eed18: break
    ws.append(w)
anchor=ws[0x13c//4]
s=sorted(set(ws)); lo=hi=anchor
while True:
    c=[w for w in s if lo-0x20000<=w<lo]
    if not c: break
    lo=min(c)
while True:
    c=[w for w in s if hi<w<=hi+0x20000]
    if not c: break
    hi=max(c)
print('entries',len(ws),'anchor',hex(anchor),'own methods',hex(lo),'..',hex(hi),'count',sum(1 for w in ws if lo<=w<=hi))
