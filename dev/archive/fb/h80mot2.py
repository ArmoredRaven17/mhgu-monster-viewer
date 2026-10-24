import os, sys, json, struct
os.environ['FB_CLASS'] = 'uEm080_00'; os.environ['FB_MON'] = 'em080_04'; os.environ['FB_EM'] = '80'
os.environ['FB_WATCH'] = '0x7a258,0x7a284,0x7a2b0,0x7a27c,0x7a2a8,0x7a2d4'
exec(open('trgen.py').read())
for n in [int(x, 16) for x in sys.argv[1:]]:
    out = []
    for ph in range(8):
        for en in (0, 1):
            r = run(7, n, phase=ph, variant=4, ended=en, stub={0x3a8430: 5, 0x49930: 10})
            ev = [(e[0], e[1], e[2] if e[0] == 'watch' else e[2]) for e in r.get('ev', []) if e[0] in ('mot', 'watch', 'chg')]
            ev = [(a, b, hex(c) if isinstance(c, int) else c) for a, b, c in ev]
            if ev: out.append((ph, en, ev))
    print(hex(n), out)
