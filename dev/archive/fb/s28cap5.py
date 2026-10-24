import os, sys, json, struct
os.environ['FB_CLASS'] = 'uEm077_00'; os.environ['FB_MON'] = 'em077_00'
exec(open('trgen.py').read())
L = [(1,0x17),(1,0x18),(1,0x19),(1,0x1b),(7,0),(7,3),(7,4),(7,5),(7,8),(7,0xb),(7,0xc),(7,0x11),(7,0x12),(7,0x2d),(7,0x2e),(7,0x2f),(7,0x30),(7,0x38),(7,0x39),(7,0x3a),(7,0x3b),(7,0x3e),(7,0x3f),(7,0x40)]
res = {}
SEV = int(os.environ.get("SEV", "0"))
for st, n in L:
    mots = []
    for ph in range(3):
        r = run(st, n, phase=ph, ended=1, stub={0x3a8430: 5, 0x49930: 10})
        mots.append([(e[1], e[3]) for e in r.get('ev', []) if e[0] == 'mot'])
    rows = {}
    for rank in (3, 5):
        for ph in (1, 2):
            r = run(st, n, phase=ph, frame=1, frame2=1, stub={0x3a8430: rank, 0x49930: 10, 0xa3bf4: SEV})
            cr = [e for e in r.get('ev', []) if e[0] == 'create' and e[1] == '0x13e']
            out = []
            for e, raw in zip([e for e in r.get('ev', []) if e[0] == 'create'], r.get('raw', [])):
                if e[1] != '0x13e': continue
                b = bytes.fromhex(raw)
                out.append((e[2], struct.unpack_from('<i', b, 0x10)[0], b[0x1c], struct.unpack_from('<i', b, 0x20)[0], e[6]))
            rows[(rank, ph)] = out
    print('%d:0x%02x' % (st, n), mots, 'r3p1', rows[(3,1)], 'r3p2', rows[(3,2)], 'r5p1', rows[(5,1)], 'r5p2', rows[(5,2)])
