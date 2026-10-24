import struct, emu
from emu import S, E
mem = {S+0x40: struct.pack('<3f', 100, 200, 300), S+0xfe8: struct.pack('<3I', 0x1111, 0x2222, 0x3333), S+0x13dc: struct.pack('<H', 0xabcd),
       E+0xcbb4: 0x152, E+0xcbb0: 0x151, E+0xcbac: 0x150, E+0xcbc0: 0x155, E+0xcbc8: 0x157}
for m in range(0, 16):
    emu.MODE[0] = m
    log, err, r0 = emu.run(0x1032858, {'r0': S}, mem)
    print('mode', m, err)
    for l in log:
        if l[0]=='submit':
            d=l[4]; print('   submit id %#x mode %d p10 %s p20 %s w30 %s w3c %s' % (d['id'], d['mode'], d['p10'], d['f30'] and d['p20'], d['w30'], d['w3c']))
        else: print('   ', l)
