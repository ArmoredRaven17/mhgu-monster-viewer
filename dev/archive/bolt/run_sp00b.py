import struct, emu
from emu import S, E
mem = {S+0x40: struct.pack('<3f', 100, 200, 300), S+0xfe8: struct.pack('<3I', 0x1111, 0x2222, 0x3333), S+0x13dc: struct.pack('<H', 0xabcd),
       E+0xcbc4: 0x156, E+0xcbb0: 0x151, E+0xcbac: 0x150, E+0xcbc0: 0x155}
for m in range(0, 26):
    emu.MODE[0] = m
    log, err, r0 = emu.run(0x1033a90, {'r0': S}, mem)
    if log or err: print('mode', m, err, [(l[0], l[4]['id'], l[4]['mode']) if l[0]=='submit' else l for l in log])
