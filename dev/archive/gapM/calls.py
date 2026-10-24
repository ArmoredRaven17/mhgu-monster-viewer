import sys, struct
T = open(r'C:\MHGU-ROM\exefs\main.text','rb').read()
tg = [int(x,16) for x in sys.argv[1:]]
for a in range(0, len(T)-3, 4):
    w = struct.unpack_from('<I', T, a)[0]
    if (w >> 24) & 0xe in (0xa,) or ((w>>25)&7)==5:
        if ((w >> 25) & 7) != 5: continue
        off = w & 0xffffff
        if off & 0x800000: off -= 0x1000000
        t = a + 8 + off*4
        if t in tg: print(hex(a), '->', hex(t), 'bl' if (w>>24)&1 else 'b')
