import os, sys, json, struct
os.environ['FB_CLASS'] = 'uEm077_00'; os.environ['FB_MON'] = 'em077_00'
exec(open('trgen.py').read())
def show(st, n, ph, rank, **kw):
    r = run(st, n, phase=ph, frame=1, frame2=1, stub={0x3a8430: rank, 0x49930: 10}, **kw)
    out = []
    cr = [e for e in r.get('ev', []) if e[0] == 'create']
    for e, raw in zip(cr, r.get('raw', [])):
        b = bytes.fromhex(raw)
        out.append((e[2], struct.unpack_from('<i', b, 0x10)[0], b[0x1c], struct.unpack_from('<i', b, 0x20)[0], e[6], e[5]))
    print(st, hex(n), 'ph', ph, 'rank', rank, out)
for st, n, ph in [(1, 0x17, 1), (1, 0x17, 2), (1, 0x18, 1), (1, 0x18, 2), (7, 0xc, 1), (7, 0xb, 1), (1, 0x19, 2), (7, 4, 1), (7, 5, 1), (7, 8, 2), (7, 0x3f, 2), (7, 0x2d, 1), (7, 0x2e, 1)]:
    for rank in (3, 5): show(st, n, ph, rank)
