import os, sys, json, struct
os.environ['FB_CLASS'] = 'uEm003_00'; os.environ['FB_MON'] = 'em003_00'
exec(open('trgen.py').read())
for n in (0x1a, 0x18):
    for ph in range(1, 5):
        for kw in ({'landed': 1}, {'landed': 1, 'ended': 1}, {'ended': 1}, {'frame': 1, 'frame2': 1}):
            r = run(3, n, phase=ph, stub={0x3a8430: 5, 0x49930: 10}, **kw)
            ev = [e for e in r.get('ev', []) if e[0] in ('mot', 'create', 'chg', 'ftest', 'ftest2')]
            print('3:0x%02x ph %d %s' % (n, ph, kw), json.dumps(ev)[:400], 'ph->', bytes(mu.mem_read(P + 0x1a1, 1))[0])
