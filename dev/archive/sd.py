import sys
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
lo=int(sys.argv[1],16); hi=int(sys.argv[2],16)
for a,m,o in armdis.sweep(lo,hi):
    note=''
    if m=='ldr' and '[pc, #' in o:
        try:
            off=int(o.split('[pc, #')[-1].rstrip(']'),0); v=armdis.u32(a+8+off); note='  ; lit 0x%x'%v
        except Exception: pass
    if m=='vldr' and '[pc, #' in o:
        import struct
        try:
            off=int(o.split('[pc, #')[-1].rstrip(']'),0)
            if 'd' in o.split(',')[0]:
                note='  ; %r'%struct.unpack('<d',armdis.rd(a+8+off,8))[0]
            else:
                note='  ; %r'%struct.unpack('<f',armdis.rd(a+8+off,4))[0]
        except Exception as e: note=str(e)
    print('%08x  %-8s %s%s'%(a,m,o,note))
