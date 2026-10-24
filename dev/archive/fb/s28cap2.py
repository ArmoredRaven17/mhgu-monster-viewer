import os, sys, json, struct
os.environ['FB_CLASS'] = 'uEm077_00'; os.environ['FB_MON'] = 'em077_00'
exec(open('trgen.py').read())
for st, n in [(1, 0x17), (1, 0x19), (7, 0), (7, 4), (7, 5), (7, 8), (7, 0x3f), (7, 0x2d)]:
    for ph in range(4):
        r = run(st, n, phase=ph, ended=1, stub={0x3a8430: 5, 0x49930: 10})
        ev = [e for e in r.get('ev', []) if e[0] in ('mot', 'chg')]
        print(st, hex(n), 'ph', ph, json.dumps(ev)[:300], 'phase->', bytes(mu.mem_read(P + 0x1a1, 1))[0], r.get('end', ''))
