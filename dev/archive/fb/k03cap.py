import os, sys, json, struct
os.environ['FB_CLASS'] = 'uEm003_00'; os.environ['FB_MON'] = 'em003_00'
exec(open('trgen.py').read())
for n in (0x18, 0x23, 0x5b, 0x1a, 0x41, 0x4e, 0x57):
    for ph in range(4):
        for fr, en in ((0, 0), (1, 0), (0, 1)):
            r = run(3, n, phase=ph, frame=fr, frame2=fr, ended=en, stub={0x3a8430: 5, 0x49930: 10})
            ev = [e for e in r.get('ev', []) if e[0] in ('mot', 'create', 'chg', 'ftest')]
            if any(e[0] in ('mot', 'create', 'chg') for e in ev):
                print('3:0x%02x ph %d fr %d en %d' % (n, ph, fr, en), json.dumps(ev)[:700], r.get('end', ''))
