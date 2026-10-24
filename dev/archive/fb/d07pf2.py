import os, sys, json, struct
os.environ['FB_CLASS'] = 'uEm007_00'; os.environ['FB_MON'] = os.environ.get('MON', 'em007_00'); os.environ['FB_EM'] = '7'
exec(open('trgen.py').read())
V = int(os.environ.get('VAR', '0'))
pk = {P + 0x40: struct.pack('<3f', 11.0, 22.0, 33.0), E + 0x40: struct.pack('<3f', 1.0, 2.0, 3.0), E + 0xfe8: struct.pack('<3I', 0x111, 0x2222, 0x333)}
for mid in (0x018, 0x021, 0x02b, 0x101, 0x104, 0x111, 0x113):
    for kw in ({}, {'rage': 1}, {'tired': 1}):
        r = run(7, 1, variant=V, fn=0xd35a94, mot=mid, frame=1, frame2=1, stub={0x3a8430: 5, 0x49930: 10}, poke=dict(pk), **kw)
        out = []
        for e, raw in zip([e for e in r.get('ev', []) if e[0] == 'create'], r.get('raw', [])):
            b = bytes.fromhex(raw)
            out.append((hex(struct.unpack_from('<I', b, 4)[0]), struct.unpack_from('<I', b, 8)[0], e[6], struct.unpack_from('<3f', b, 0x10), [hex(x) for x in struct.unpack_from('<3I', b, 0x30)], hex(struct.unpack_from('<H', b, 0x3c)[0])))
        print('L%d M%d' % (mid >> 8, mid & 0xff), kw, out, [e[1:3] for e in r['ev'] if e[0] in ('ftest', 'ftest2')][:6])
