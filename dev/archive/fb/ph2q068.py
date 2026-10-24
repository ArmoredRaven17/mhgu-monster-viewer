import sys, os, struct
sys.argv = ['x']
os.environ.setdefault('FB_CLASS', 'uEm068_00'); os.environ.setdefault('FB_MON', 'em068_00')
import trgen as T
for a, nm in ((0xb00b4, 'b00b4'), (0xb0174, 'b0174'), (0xb0230, 'b0230'), (0xb03f8, 'b03f8'), (0xb04d0, 'b04d0'), (0xb0004, 'b0004')): T.MOT[a] = nm
for n in (0x44, 0x45, 0x46, 0x47, 0x1e, 0x1f):
    for occ in (0, 1):
        for turn in (0.0, 1.0):
            poke = {T.C + 4: list(struct.pack('<I', 0x30200000 if occ else 0))}
            poke[T.C + 0x48] = list(struct.pack('<f', turn))
            r = T.run(2, n, 0, 0, 0, stub={0x3a8430: 5}, poke=poke)
            ph = T.mu.mem_read(T.P + 0x1a1, 1)[0]
            ms = [e[1] for e in r.get('ev', []) if e[0] == 'mot']
            print('2:%#04x occ %d turn %.1f -> phase %d %s' % (n, occ, turn, ph, ms))
