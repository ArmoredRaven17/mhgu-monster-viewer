import os, sys, json, struct
os.environ['FB_CLASS'] = 'uEm080_00'; os.environ['FB_MON'] = 'em080_04'; os.environ['FB_EM'] = '80'
exec(open('trgen.py').read())
for n, top in ((0xe6, 9), (0xfa, 5), (0xfc, 6), (0xfd, 6), (0x8e, 4)):
    ms = []
    for ph in range(top):
        r = run(7, n, phase=ph, variant=4, ended=1, stub={0x3a8430: 5, 0x49930: 10})
        m = [(e[1], e[3]) for e in r.get('ev', []) if e[0] == 'mot']
        ms.append((ph, m, [e[0] for e in r.get('ev', [])][:8]))
    print(hex(n), ms)
