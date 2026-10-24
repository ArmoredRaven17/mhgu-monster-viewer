import os, sys, json, struct
os.environ['FB_CLASS'] = 'uEm044_00'; os.environ['FB_MON'] = 'em044_00'
exec(open('trgen.py').read())
pk = {E + 0xfe8: struct.pack('<3I', 0, 0, 0), E + 0x73e8: struct.pack('<H', 0x1357)}
for n in range(0, 0x40):
    for ph in (1, 2):
        for F in (102.0, 106.0, 132.0):
            r = run(7, n, phase=ph, only=F, stub={0x3a8430: 5, 0x49930: 10}, poke=dict(pk))
            for e, raw in zip([e for e in r.get('ev', []) if e[0] == 'create'], r.get('raw', [])):
                b = bytes.fromhex(raw)
                if struct.unpack_from('<I', b, 4)[0] != 0xdd: continue
                print('7:0x%02x ph %d F %s' % (n, ph, F), 'mode', struct.unpack_from('<I', b, 8)[0], 'p10', struct.unpack_from('<3f', b, 0x10), 'words', [hex(x) for x in struct.unpack_from('<3I', b, 0x20)], 'b2c', b[0x2c], 'h2e', hex(struct.unpack_from('<H', b, 0x2e)[0]), 'h30', hex(struct.unpack_from('<H', b, 0x30)[0]), 'b32', b[0x32], e[5])
