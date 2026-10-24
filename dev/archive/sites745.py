import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
T = armdis.TEXT
lo, hi = int(sys.argv[1],16), int(sys.argv[2],16)
imms = {0x7451,0x7452,0x7453}
for a in range(lo, hi, 4):
    w = struct.unpack_from('<I', T, a)[0]
    if (w & 0x0FF00000) == 0x03000000:
        v = ((w >> 4) & 0xF000) | (w & 0xFFF)
        if v in imms:
            rd = (w>>12)&15
            # find the use within next 8
            out=[]
            for b,m,o in armdis.sweep(a, a+0x24):
                if ('r%d'%rd) in o.replace('sb','r9').replace('sl','r10').replace('fp','r11').replace('ip','r12') and b!=a:
                    out.append('%x %s %s'%(b,m,o)); 
            print('%08x #%x  r%d  -> %s' % (a, v, rd, ' | '.join(out[:2])))
