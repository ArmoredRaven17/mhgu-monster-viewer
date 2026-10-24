"""vtref.py VT -- GOT slots in .data holding VT-8 (or VT), then every text site that PIC-loads that slot"""
import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
T=armdis.TEXT; D=armdis.DATA; DV=armdis.DA_VA
for vt in [int(x,16) for x in sys.argv[1:]]:
    slots=[DV+i for i in range(0,len(D)-4,4) if struct.unpack_from('<I',D,i)[0] in (vt-8, vt)]
    print('vt %#x slots %s'%(vt,[hex(s) for s in slots]))
    for a in range(0,len(T)-8,4):
        w=struct.unpack_from('<I',T,a)[0]
        if (w&0x0FFF0FF0)!=0x079F0000: continue
        rx=(w>>12)&0xf
        if (w&0xf)!=rx: continue
        for b in range(a-4,a-40,-4):
            v=struct.unpack_from('<I',T,b)[0]
            if (v&0x0FFF0000)==0x059F0000 and ((v>>12)&0xf)==rx:
                lit=struct.unpack_from('<I',T,b+8+(v&0xfff))[0]
                if ((a+8+lit)&0xffffffff) in slots: print('   site %#x'%a)
                break
