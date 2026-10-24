# sites materialising 0x72fc / 0x72fd / 0x72f8 (the EMC current group / stream / cursor) by movw
import struct, sys
T = open(r'C:\MHGU-ROM\exefs\main.text','rb').read()
n = len(T)//4
W = struct.unpack('<%dI' % n, T[:n*4])
want = {int(x,16) for x in sys.argv[1].split(',')}
for i,w in enumerate(W):
    if (w & 0x0FF00000) == 0x03000000:  # movw
        imm = ((w >> 4) & 0xF000) | (w & 0xFFF)
        if imm in want: print('%08x movw r%d, #%#x' % (i*4, (w>>12)&15, imm))
