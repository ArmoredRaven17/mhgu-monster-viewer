import sys, os, struct
sys.argv = ['x']
os.environ.setdefault('FB_CLASS', 'uEm068_00'); os.environ.setdefault('FB_MON', 'em068_00')
import trgen as T
STUB = {0x3a8430: 5}
poke = {T.P + 0x40: list(struct.pack('<3f', 11.0, 22.0, 33.0)), T.E + 0x40: list(struct.pack('<3f', 44.0, 55.0, 66.0))}
for st, n, ph, L in ((7, 0x18, 1, 140.0), (7, 0x1e, 2, 50.0), (7, 0x1f, 2, 50.0), (1, 0, 1, 190.0), (2, 0x1e, 1, 35.0), (2, 0x44, 2, 30.0), (2, 0x46, 2, 30.0), (6, 0, 1, 100.0)):
    r = T.run(st, n, ph, 0, 0, stub=STUB, only=L, poke=poke)
    blk = struct.unpack('<B', bytes(T.mu.mem_read(T.C + 0x14, 1)))[0], struct.unpack('<H', bytes(T.mu.mem_read(T.C + 0x16, 2)))[0], struct.unpack('<5f', bytes(T.mu.mem_read(T.C + 0x20, 20)))
    print(st, hex(n), blk, r.get('end'))
