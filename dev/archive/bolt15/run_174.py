import struct
import emu
from emu import S, E
mem = {S: 0x17ee2f8, S + 0x40: struct.pack('<3f', 100, 200, 300), S + 0x1754: struct.pack('<3I', 0x1111, 0x2222, 0x3333),
       S + 0xfe8: struct.pack('<3I', 0xaaaa, 0xbbbb, 0xcccc), S + 0x13dc: struct.pack('<H', 0xabcd), E + 0xcbc4: 0x156}
for m in range(0, 26):
    emu.MODE[0] = m
    log, err, r0 = emu.run(0x10348b0, {'r0': S}, mem)
    subs = [(l[4]['id'], l[4]['mode'], l[4]['owner'], l[4]['p10'], l[4]['w20'], l[4]['h2e'], l[4]['w30'], l[4]['w3c'], l[4]['b2c'], l[4]['raw'][0x40*2:0x42*2], l[3]) for l in log if l[0] == 'submit']
    other = [l for l in log if l[0] != 'submit']
    if subs or other or err:
        print('mode', m, 'err', err)
        for s in subs: print('   submit id %#x mode %d owner %s p10 %s w20 %s h2e %#x w30 %s w3c %s b2c %d b40 %s' % s[:10])
        for o in other: print('   ', o)
