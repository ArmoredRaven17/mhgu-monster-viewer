import struct, emu
from emu import S, E
mem = {S+0x40: struct.pack('<3f', 100, 200, 300), S+0xfe8: struct.pack('<3I', 0x1111, 0x2222, 0x3333), S+0x13dc: struct.pack('<H', 0xabcd),
       E+0xcbc4: 0x156, E+0xcbb0: 0x151, E+0xcbac: 0x150, E+0xcbc0: 0x155}
for m in range(0, 26):
    emu.MODE[0] = m
    log, err, r0 = emu.run(0x1032f74, {'r0': S}, mem)
    subs = [(l[4]['id'], l[4]['mode'], l[4]['p10'], l[4]['w20'], l[4]['h2e'], l[4]['w30'], l[4]['f30'], l[4]['w3c'], l[4]['b2c']) for l in log if l[0]=='submit']
    other = [l for l in log if l[0] != 'submit']
    print('mode', m, 'err', err)
    for s in subs: print('   submit id %#x mode %d p10 %s w20 %s h2e %#x w30 %s f30 %s w3c %s b2c %d' % s)
    for o in other: print('   ', o)
