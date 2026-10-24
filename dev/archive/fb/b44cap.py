import os, sys, json, struct
os.environ['FB_CLASS'] = 'uEm044_00'; os.environ['FB_MON'] = 'em044_00'
exec(open('trgen.py').read())
pk = {P + 0x40: struct.pack('<3f', 11.0, 22.0, 33.0), E + 0x40: struct.pack('<3f', 1.0, 2.0, 3.0), E + 0xfe8: struct.pack('<3I', 0x111, 0x2222, 0x333)}
for n in (0, 3, 0xe, 0xf, 0x31):
    for ph in range(3):
        r = run(7, n, phase=ph, frame=1, frame2=1, stub={0x3a8430: 5, 0x49930: 10}, poke=dict(pk))
        ms = [(e[1], e[3]) for e in r.get('ev', []) if e[0] == 'mot']
        for e, raw in zip([e for e in r.get('ev', []) if e[0] == 'create'], r.get('raw', [])):
            b = bytes.fromhex(raw)
            print('7:0x%02x ph %d' % (n, ph), 'mode', struct.unpack_from('<I', b, 8)[0], 'F', e[6], e[5], 'raw', raw)
        if ms: print('7:0x%02x ph %d mot' % (n, ph), ms)
