import os, sys, json, struct
os.environ['FB_CLASS'] = 'uEm077_00'; os.environ['FB_MON'] = 'em077_00'
exec(open('trgen.py').read())
for st, n, ph in [(1, 0x17, 1), (7, 0x2d, 1), (7, 0xb, 2)]:
    print(st, hex(n), [(rank, len([e for e in run(st, n, phase=ph, frame=1, frame2=1, stub={0x3a8430: rank, 0x49930: 10}).get('ev', []) if e[0] == 'create'])) for rank in range(0, 8)])
r = run(1, 0x17, phase=1, frame=1, frame2=1, stub={0x3a8430: 5, 0x49930: 10})
print([e for e in r['ev'] if e[0] != 'tune'][:30])
