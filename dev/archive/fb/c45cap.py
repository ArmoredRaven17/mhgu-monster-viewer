import os, sys, json, struct
os.environ['FB_CLASS'] = 'uEm045_00'; os.environ['FB_MON'] = 'em045_04'; os.environ['FB_EM'] = '45'
exec(open('trgen.py').read())
pk = {P + 0x40: struct.pack('<3f', 11.0, 22.0, 33.0), E + 0x40: struct.pack('<3f', 1.0, 2.0, 3.0), E + 0xfe8: struct.pack('<3I', 0x111, 0x2222, 0x333), E + 0x73e8: struct.pack('<H', 0x1357), P + 0xb0a: struct.pack('<H', 0x4321)}
pk.update({E + 0xcb00 + 4 * k: struct.pack('<I', 0x1000 + k) for k in range(12)})
cases = [(0x00, 1, 180.0), (0x8a, 4, 226.0), (0x8e, 1, 202.0), (0xe5, 5, 226.0), (0xe5, 2, 110.0), (0xe5, 2, 100.0), (0xe6, 1, 114.0), (0xe7, 1, 114.0), (0xea, 1, 114.0), (0xeb, 1, 114.0)] + [(n, 1, 202.0) for n in range(0xf4, 0x100)]
for n, ph, F in cases:
    r = run(7, n, phase=ph, variant=4, only=F, stub={0x3a8430: 5, 0x49930: 10}, poke=dict(pk))
    for e, raw in zip([e for e in r.get('ev', []) if e[0] == 'create'], r.get('raw', [])):
        b = bytes.fromhex(raw)
        print('7:0x%02x ph %d F %s' % (n, ph, F), 'id', hex(struct.unpack_from('<I', b, 4)[0]), 'mode', struct.unpack_from('<I', b, 8)[0], 'p10', [round(x, 2) for x in struct.unpack_from('<3f', b, 0x10)], 'w20', [hex(x) for x in struct.unpack_from('<3I', b, 0x20)], 'w30', [hex(x) for x in struct.unpack_from('<4I', b, 0x30)], e[5])
