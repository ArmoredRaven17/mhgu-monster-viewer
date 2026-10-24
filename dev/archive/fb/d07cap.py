import os, sys, json, struct
os.environ['FB_CLASS'] = 'uEm007_00'; os.environ['FB_MON'] = 'em007_04'; os.environ['FB_EM'] = '7'
exec(open('trgen.py').read())
pk = {P + 0x40: struct.pack('<3f', 11.0, 22.0, 33.0), E + 0x40: struct.pack('<3f', 1.0, 2.0, 3.0), E + 0xfe8: struct.pack('<3I', 0x111, 0x2222, 0x333), P + 0xb0a: struct.pack('<H', 0x1234), E + 0xcac8: struct.pack('<I', 0x71), E + 0xcac4: struct.pack('<I', 0x71)}
for n in (0xb4, 0xb6, 0xb8):
    for ph in range(4):
        for kw in ({'ended': 1}, {'frame': 1, 'frame2': 1}, {'landed': 1, 'ended': 1}):
            r = run(7, n, phase=ph, variant=4, stub={0x3a8430: 5, 0x49930: 10}, poke=dict(pk), **kw)
            ev = [e for e in r.get('ev', []) if e[0] in ('mot', 'create', 'chg')]
            if ev: print('7:0x%02x ph %d %s' % (n, ph, kw), json.dumps(ev)[:300], 'ph->', bytes(mu.mem_read(P + 0x1a1, 1))[0], r.get('end',''))
            for raw in r.get('raw', []):
                b = bytes.fromhex(raw); print('    setup id', hex(struct.unpack_from('<I', b, 4)[0]), 'mode', struct.unpack_from('<I', b, 8)[0], 'p10', struct.unpack_from('<3f', b, 0x10), 'p20', struct.unpack_from('<3f', b, 0x20), 'p30', [hex(x) for x in struct.unpack_from('<3I', b, 0x30)], hex(struct.unpack_from('<H', b, 0x3c)[0]))
