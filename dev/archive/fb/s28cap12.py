import os, sys, json, struct
os.environ['FB_CLASS'] = 'uEm077_00'; os.environ['FB_MON'] = 'em077_00'; os.environ['FB_WATCH'] = '0x9d36c'
exec(open('trgen.py').read())
for st, n, ph in [(1, 0x19, 2), (7, 0x3b, 2), (7, 8, 2), (7, 0x3f, 2), (7, 0x40, 2), (7, 0x2d, 1), (7, 0x2e, 1)]:
    r = run(st, n, phase=ph, frame=1, frame2=1, stub={0x3a8430: 5, 0x49930: 10})
    print(st, hex(n), [e for e in r['ev'] if e[0] == 'watch'], sorted(set(e[5] for e in r['ev'] if e[0] == 'create')))
