# every movw rd, #v in main.text, for each v in argv (hex)
import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
T = armdis.TEXT; n = len(T)//4
W = struct.unpack('<%dI' % n, T[:n*4])
for a in sys.argv[1:]:
    v = int(a, 16)
    hits = [i*4 for i,w in enumerate(W) if (w & 0xfff00000) == 0xe3000000 and ((w>>16)&0xf) == (v>>12) and (w & 0xfff) == (v & 0xfff)]
    print(hex(v), len(hits), ' '.join(hex(h) for h in hits))
