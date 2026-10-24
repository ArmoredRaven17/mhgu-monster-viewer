import struct, zlib, sys
ro = open(r'C:\MHGU-ROM\exefs\main.rodata','rb').read()
BASE = 0x13ef000
def ent(i, size=8):
    a = 0x159daa0 + i*size - BASE
    return struct.unpack_from('<II', ro, a)
def jam(p): return (~zlib.crc32(p.lower().encode())) & 0xffffffff
for rid, path in [(0x7bc4, 'enemy\em043\em043_05\mod\em043_05_tail'),
                  (0x8413, 'enemy\em004\em004_00\mod\em004_00_tail'),
                  (0x7c0d, 'enemy\em046\em046_00\mod\em046_00_tail'),
                  (0x7c0c, 'enemy\em046\em046_00\mod\em046_00_tail'),
                  (0x7c0e, 'enemy\em_option\mot\em001_00_option'),
                  (0x7c0f, 'enemy\em_option\mot\em001_00_option')]:
    h, t = ent(rid)
    print(hex(rid), hex(h), hex(t), 'path hash', hex(jam(path)), h == jam(path), path)
