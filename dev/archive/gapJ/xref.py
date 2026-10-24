import sys, struct, os
EX = r'C:\MHGU-ROM\exefs'
T = open(os.path.join(EX,'main.text'),'rb').read()
RO = open(os.path.join(EX,'main.rodata'),'rb').read()
DA = open(os.path.join(EX,'main.data'),'rb').read()
targets = [int(a,16) for a in sys.argv[1:]]
n = len(T)//4
ws = struct.unpack('<%dI'%n, T[:n*4])
for i,w in enumerate(ws):
    pc = i*4
    if ((w>>25)&7)==5:  # b/bl (cond!=0xf) or blx imm (cond==0xf)
        imm = w & 0xffffff
        if imm & 0x800000: imm -= 0x1000000
        tgt = pc + 8 + imm*4
        if (w>>28)==0xf: tgt += ((w>>24)&1)*2
        if tgt in targets:
            kind = 'bl' if (w>>24)&1 else 'b'
            print('branch %08x -> %08x %s cond %x' % (pc, tgt, kind, w>>28))
# absolute pointers in data/rodata/text
for name,buf,base in (('text',T,0),('rodata',RO,0x13EF000),('data',DA,0x1728000)):
    m=len(buf)//4
    a=struct.unpack('<%dI'%m, buf[:m*4])
    for i,w in enumerate(a):
        if w in targets:
            print('abs ptr in %s at %08x = %08x' % (name, base+i*4, w))
# PIC literal: value v at literal address L used by add rX, pc, rX at P: P+8+v = target. scan text words v s.t. target - v - 8 is within text near (within 4KB after L)
for i,w in enumerate(ws):
    L=i*4
    for t in targets:
        P = (t - 8 - w) & 0xffffffff
        if 0 < L - P < 4096 or 0 < P - L < 4096:
            # check P is an add rX, pc, rX
            if P%4==0 and P//4 < n:
                iw = ws[P//4]
                if (iw & 0x0fff0ff0) == 0x008f0000 or (iw & 0x0ff0f000)==0x0080f000 or ((iw>>21)&0xf)==4 and ((iw>>16)&0xf)==15:
                    print('pic lit %08x val %08x add at %08x -> %08x' % (L, w, P, t))
