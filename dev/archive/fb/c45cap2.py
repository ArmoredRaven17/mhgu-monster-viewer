import os, sys, json, struct
os.environ['FB_CLASS'] = 'uEm045_00'; os.environ['FB_MON'] = 'em045_04'; os.environ['FB_EM'] = '45'
exec(open('trgen.py').read())
for n in (0x00, 0x8a, 0x8e, 0xe5, 0xe6, 0xe7, 0xea, 0xeb, 0xf4, 0xf8, 0xfe):
    out = []
    for ph in range(7):
        for kw in ({'ended': 1}, {'landed': 1, 'ended': 1}, {'timer': 1, 'ended': 1}):
            r = run(7, n, phase=ph, variant=4, stub={0x3a8430: 5, 0x49930: 10}, **kw)
            ms = [(e[1], e[3]) for e in r.get('ev', []) if e[0] == 'mot']
            if ms: out.append((ph, list(kw), ms, bytes(mu.mem_read(P + 0x1a1, 1))[0]))
    print('7:0x%02x' % n, out[:12])
