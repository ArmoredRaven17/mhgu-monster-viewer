import struct,sys,re
T=open(r'C:\MHGU-ROM\exefs\main.text','rb').read()
S=r'C:/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad/m079/band.txt'
L=[l.rstrip() for l in open(S)]
idx={int(l[:8],16):i for i,l in enumerate(L)}
def at(a,n=4): i=idx[a]; return ' | '.join(x[10:].strip() for x in L[i:i+n])
tab=int(sys.argv[1],16); n=int(sys.argv[2],16)+1; base0=int(sys.argv[3]) if len(sys.argv)>3 else 1
for k in range(n):
    w=struct.unpack_from('<i',T,tab+4*k)[0]; t=tab+w
    print('%3d (0x%02x) -> %06x : %s'%(k+base0,k+base0,t,at(t)))
