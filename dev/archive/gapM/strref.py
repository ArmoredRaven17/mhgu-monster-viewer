import sys, struct
T = open(r'C:\MHGU-ROM\exefs\main.text','rb').read()
tg = set(int(x,16) for x in sys.argv[1:])
n = len(T)//4
W = struct.unpack('<%dI' % n, T[:n*4])
for i in range(n):
    w = W[i]
    if (w & 0x0FEF0FF0) == 0x008F0000:
        rd = (w >> 12) & 15; rm = w & 15; A = i*4
        for j in range(1, 10):
            v = W[i-j]
            if (v & 0x0F7F0000) == 0x051F0000 and ((v >> 12) & 15) == rm:
                imm = v & 0xfff; imm = imm if (v >> 23) & 1 else -imm
                lit = (i-j)*4 + 8 + imm
                L = W[lit//4]
                t = (A + 8 + L) & 0xffffffff
                if t in tg: print(hex(A), hex(t))
                break
