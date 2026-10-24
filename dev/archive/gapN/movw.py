import sys, struct
T = open(r'C:\MHGU-ROM\exefs\main.text','rb').read()
want = set(int(x,16) for x in sys.argv[1:])
for a in range(0, len(T)-3, 4):
    w = struct.unpack_from('<I', T, a)[0]
    if (w & 0x0ff00000) == 0x03000000 and (w>>28) != 0xf:
        imm = ((w>>16)&0xf)<<12 | (w & 0xfff)
        if imm in want: print(hex(a), 'r%d'%((w>>12)&0xf), hex(imm))
