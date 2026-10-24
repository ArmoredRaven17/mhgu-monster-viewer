import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
T = armdis.TEXT
n = len(T)//4
words = struct.unpack('<%dI' % n, T[:n*4])
# movw rX,#0x1053 : cond 1110 0011 0000 imm4 Rd imm12 ; imm16=0x1053 -> imm4=1, imm12=0x053
hits=[]
for i,w in enumerate(words):
    if (w & 0x0ff00000)==0x03000000 and ((w>>16)&0xf)==1 and (w&0xfff)==0x053:
        hits.append(i*4)
print('movw #0x1053:', len(hits))
# bl / b to 0x6bb2c, 0x6bb20
tg = {0x6bb2c:'set1053',0x6bb20:'get1053',0x6bb38:'set1054'}
for i,w in enumerate(words):
    if (w & 0x0e000000)==0x0a000000 and (w>>28)!=0xf:
        off = w & 0xffffff
        if off & 0x800000: off -= 0x1000000
        t = i*4+8+off*4
        if t in tg: print('branch', hex(i*4), tg[t], 'bl' if w&0x01000000 else 'b')
# data refs
for name,buf,base in (('ro',armdis.RODATA,armdis.RO_VA),('da',armdis.DATA,armdis.DA_VA)):
    m=len(buf)//4
    ws=struct.unpack('<%dI'%m, buf[:m*4])
    for i,w in enumerate(ws):
        if w in tg: print('dataref', name, hex(base+i*4), tg[w])
import pickle; pickle.dump(hits, open(r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\h1053.pkl','wb'))
