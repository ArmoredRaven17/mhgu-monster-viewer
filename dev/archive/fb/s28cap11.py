import os, sys, json, struct
os.environ['FB_CLASS'] = 'uEm077_00'; os.environ['FB_MON'] = 'em077_00'; os.environ['FB_WATCH'] = '0x9d36c'
exec(open('trgen.py').read())
X = E + 0x380000; A = E + 0x380100
ROWS = bytes([6, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 3, 2, 2, 3, 4, 2, 2, 3]) + bytes(12)
DTP = {E + 0x75f0: struct.pack('<I', X), X + 0x64: struct.pack('<I', A), A: ROWS}
def cap(st, n, **kw):
    stub = kw.pop('stub')
    run(st, n, phase=0, frame=0, ended=1, stub=stub, poke=dict(DTP), **kw)
    ctl = bytes(mu.mem_read(C, 0x100)); pb = bytes(mu.mem_read(P, 0x400))
    out = []
    for ph in (1, 2):
        poke = {P: pb, P + 0x1a1: bytes([ph, 0, 0])}; poke.update(DTP)
        r = run(st, n, phase=ph, frame=1, frame2=1, stub=stub, ctl=ctl, poke=poke, **kw)
        out += [(ph, e[2]) for e in r.get('ev', []) if e[0] == 'create' and e[1] == '0x13e']
    return out
L = [(1,0x17),(1,0x18),(1,0x19),(7,4),(7,5),(7,8),(7,0x11),(7,0x12),(7,0x2d),(7,0x3b),(7,0x3f)]
for st, n in L:
    base = cap(st, n, stub={0x3a8430: 5, 0x49930: 10, 0x9d36c: 0})
    for rage in (1,):
        for tired in (0, 1):
            o = cap(st, n, rage=rage, tired=tired, stub={0x3a8430: 5, 0x49930: 10, 0x9d36c: 0})
            print(st, hex(n), 'rage', rage, 'tired', tired, 'same' if o == base else ('DIFF', base, o))
for mot in (0x21d, 0x230):
    for lv in (0, 2):
        r = run(1, 0, fn=0xfddfcc, mot=mot, frame=1, frame2=1, rage=1, stub={0x3a8430: 5, 0x49930: 10, 0x9d36c: lv}, poke=dict(DTP))
        print(hex(mot), lv, [(e[2]) for e in r['ev'] if e[0] == 'create'], [e for e in r['ev'] if e[0] == 'watch'])
