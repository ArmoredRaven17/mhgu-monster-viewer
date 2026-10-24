import os, sys, json, struct
os.environ['FB_CLASS'] = 'uEm077_00'; os.environ['FB_MON'] = 'em077_00'
exec(open('trgen.py').read())
for st in range(0, 12):
    for n in range(0, 0x100):
        ctl = None; hit = []
        for ph in range(4):
            r = run(st, n, phase=ph, ended=1, stub={0x3a8430: 5, 0x49930: 10}, **({'ctl': ctl} if ctl else {}))
            ms = [e[1] for e in r.get('ev', []) if e[0] == 'mot']
            if ph == 0: ctl = bytes(mu.mem_read(C, 0x100))
            if any(m in ('L2 M29', 'L2 M48') for m in ms): hit.append((ph, ms))
        if hit:
            print('%d:0x%02x' % (st, n), hit, 'ctl70..7c', struct.unpack_from('<iiiH', ctl, 0x70))
