import struct, sys
T=open(r'C:\MHGU-ROM\exefs\main.text','rb').read()
N=len(T)//4
W=struct.unpack('<%dI'%N, T[:N*4])
lo, hi = int(sys.argv[1],16), int(sys.argv[2],16)
out=[]
for i,w in enumerate(W):
    # add Rd, pc, Rm  /  ldr Rd, [pc, Rm]
    if (w & 0x0fff0ff0) in (0x008f0000, 0x079f0000):
        rm = w & 0xf; a = i*4
        for j in range(i-1, max(0,i-24), -1):
            v = W[j]
            if (v & 0x0f7f0000) == 0x051f0000 and ((v>>12)&0xf) == rm:
                imm = v & 0xfff; up = (v>>23)&1
                la = j*4 + 8 + (imm if up else -imm)
                if 0 <= la < len(T)-4:
                    lit = struct.unpack_from('<I', T, la)[0]
                    t = (lit + a + 8) & 0xffffffff
                    if lo <= t < hi: out.append((hex(a), hex(t), 'ldr' if (w & 0x0fff0ff0)==0x079f0000 else 'add'))
                break
for o in out: print(*o)
