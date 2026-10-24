import os, sys, json, struct
os.environ['FB_CLASS'] = 'uEm045_00'; os.environ['FB_MON'] = os.environ.get('MON', 'em045_00')
exec(open('trgen.py').read())
V = int(os.environ.get('VAR', '0'))
pk = {P + 0x40: struct.pack('<3f', 11.0, 22.0, 33.0), E + 0xfe8: struct.pack('<3I', 0x111, 0x2222, 0x333), E + 0x73e8: struct.pack('<H', 0x1357), P + 0xb0a: struct.pack('<H', 0x4321)}
pk.update({E + 0xcb00 + 4 * k: struct.pack('<I', 0x1000 + k) for k in range(12)}); pk[E + 0x40] = struct.pack('<3f', 1.0, 2.0, 3.0)
for n, ph, F in [(0, 1, 180.0), (0x8a, 4, 226.0), (0x8e, 1, 202.0)]:
    r = run(7, n, phase=ph, variant=V, only=F, stub={0x3a8430: 5, 0x49930: 10}, poke=dict(pk))
    for e, raw in zip([e for e in r.get('ev', []) if e[0] == 'create'], r.get('raw', [])):
        b = bytes.fromhex(raw)
        print('7:0x%02x ph %d F %s' % (n, ph, F), 'id', hex(struct.unpack_from('<I', b, 4)[0]), 'mode', struct.unpack_from('<I', b, 8)[0], 'p10', struct.unpack_from('<3f', b, 0x10), 'p20', struct.unpack_from('<3f', b, 0x20), 'p30', [hex(x) for x in struct.unpack_from('<3I', b, 0x30)], 'h3c', hex(struct.unpack_from('<H', b, 0x3c)[0]), e[5], 'raw', raw)
    for ph2 in range(6):
        r = run(7, n, phase=ph2, variant=V, ended=1, stub={0x3a8430: 5, 0x49930: 10})
        ms = [e[1] for e in r.get('ev', []) if e[0] == 'mot']
        if ms: print('   ph', ph2, ms)
