import os, sys, json
os.environ['FB_CLASS'] = 'uEm077_00'; os.environ['FB_MON'] = 'em077_00'
sys.argv = ['x']
exec(open('trgen.py').read())
for st, n in [(1, 0x17), (1, 0x18), (1, 0x19), (7, 0), (7, 3), (7, 0x3a), (7, 4), (7, 5), (7, 8), (7, 0x3f), (7, 0xb), (7, 0xc), (7, 0x2d), (7, 0x2e)]:
    for ph in range(4):
        for fr in (0, 1):
            r = run(st, n, phase=ph, frame=fr, frame2=fr, stub={0x3a8430: 5, 0x49930: 10})
            ev = [e for e in r.get('ev', []) if e[0] in ('mot', 'create', 'chg')]
            if ev: print(st, hex(n), 'ph', ph, 'fr', fr, json.dumps(ev)[:600], r.get('end', ''))
