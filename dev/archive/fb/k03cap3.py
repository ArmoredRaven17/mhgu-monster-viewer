import os, sys, json, struct
os.environ['FB_CLASS'] = 'uEm003_00'; os.environ['FB_MON'] = 'em003_00'
exec(open('trgen.py').read())
pk = {P + 0x40: struct.pack('<3f', 11.0, 22.0, 33.0), E + 0xfe8: struct.pack('<3I', 0x111, 0x2222, 0x333), P + 0xb0a: struct.pack('<H', 0x1234), E + 0xcac8: struct.pack('<I', 0x66)}
for n, ph, kw in ((0x18, 1, {'ended': 1}), (0x1a, 2, {'landed': 1}), (0x41, 1, {'frame': 1})):
    r = run(3, n, phase=ph, stub={0x3a8430: 5, 0x49930: 10}, poke=dict(pk), **kw)
    for raw in r.get('raw', []):
        b = bytes.fromhex(raw)
        print(hex(n), 'id', hex(struct.unpack_from('<I', b, 4)[0]), 'mode', struct.unpack_from('<I', b, 8)[0], 'p10', struct.unpack_from('<3f', b, 0x10), 'p20', struct.unpack_from('<3f', b, 0x20), 'p30', [hex(x) for x in struct.unpack_from('<3I', b, 0x30)], 'p3c', hex(struct.unpack_from('<H', b, 0x3c)[0]))
for n in (0x3c, 0x40, 0x4c):
    for ph in (0, 1, 2):
        r = run(7, n, phase=ph, frame=1, stub={0x3a8430: 5, 0x49930: 10}, poke=dict(pk))
        for e, raw in zip([e for e in r['ev'] if e[0] == 'create'], r.get('raw', [])):
            b = bytes.fromhex(raw)
            print('7', hex(n), ph, e[5], 'mode', struct.unpack_from('<I', b, 8)[0], 'p10', struct.unpack_from('<3f', b, 0x10), 'p30', [hex(x) for x in struct.unpack_from('<3I', b, 0x30)], hex(struct.unpack_from('<H', b, 0x3c)[0]))
