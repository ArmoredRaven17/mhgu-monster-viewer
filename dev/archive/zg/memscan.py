# memscan.py <imm12> [ldr|str] [b|w|h]: every ARM load/store with immediate offset imm (pre-indexed, no writeback, both + and -), fast (numpy)
import sys, numpy as np
T=np.frombuffer(open(r'C:\MHGU-ROM\exefs\main.text','rb').read()[:0x13eed18//4*4],dtype='<u4')
imm=int(sys.argv[1],16); kind=sys.argv[2] if len(sys.argv)>2 else 'str'; sz=sys.argv[3] if len(sys.argv)>3 else 'b'
L=1 if kind=='ldr' else 0
if sz in 'bw':
    B=1 if sz=='b' else 0
    # cond 01 I=0 P=1 U=1 B W=0 L
    want=(0b0101<<24)|(1<<23)|(B<<22)|(L<<20)|imm
    m=(T&0x0FF00FFF)==want
else:
    # halfword: cond 000 P=1 U=1 I=1 W=0 L Rn Rt imm4H 1011 imm4L
    want=(1<<24)|(1<<23)|(1<<22)|(L<<20)|((imm>>4&0xf)<<8)|0xb0|(imm&0xf)
    m=(T&0x0FF00FFF)==want
idx=np.nonzero(m)[0]
for i in idx: print(hex(i*4))
