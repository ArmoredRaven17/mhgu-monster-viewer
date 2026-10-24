import sys, struct
T = open(r'C:\MHGU-ROM\exefs\main.text','rb').read()
n=len(T)//4; W=struct.unpack('<%dI'%n,T[:n*4])
want=set(int(x,16) for x in sys.argv[1:])
for i,w in enumerate(W):
    c=w>>28
    if c==0xf: continue
    # ldr/str imm12 (single data transfer, I=0)
    if (w>>26)&3==1 and not (w>>25)&1:
        imm=w&0xfff
        if imm in want: print(hex(i*4),'ldst', hex(w), 'imm',hex(imm), 'rn r%d'%((w>>16)&15), 'L' if (w>>20)&1 else 'S', 'B' if (w>>22)&1 else 'W')
    # vldr/vstr imm8*4
    if (w & 0x0e000e00)==0x0c000a00 and (w>>24)&1 and not (w>>21)&1:
        imm=(w&0xff)*4
        if imm in want: print(hex(i*4),'vfp', hex(w),'imm',hex(imm),'rn r%d'%((w>>16)&15))
    # add rd, rn, #imm (data proc imm, opcode add=4)
    if (w>>25)&7==1 and ((w>>21)&15)==4:
        rot=((w>>8)&15)*2; v=w&0xff; v=((v>>rot)|(v<<(32-rot)))&0xffffffff
        if v in (0x1580,0x1590,0x1500,0x1594,0x158c): print(hex(i*4),'add',hex(w),'#',hex(v),'rn r%d'%((w>>16)&15))
