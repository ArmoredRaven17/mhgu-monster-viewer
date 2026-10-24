import os, sys, json, struct
os.environ['FB_CLASS'] = 'uEm080_00'; os.environ['FB_MON'] = 'em080_04'; os.environ['FB_EM'] = '80'
exec(open('trgen.py').read())
for n in [int(x, 16) for x in sys.argv[1:]]:
    out = []
    for ph in range(8):
        for en, la, fr in ((0, 0, 0), (1, 0, 0), (0, 1, 0), (0, 0, 1)):
            r = run(7, n, phase=ph, variant=4, ended=en, landed=la, frame=fr, frame2=fr, stub={0x3a8430: 5, 0x49930: 10})
            nph = mu.mem_read(P + 0x1a1, 1)[0]
            mot = [e[1] for e in r.get('ev', []) if e[0] == 'mot']
            chg = [e[1:3] for e in r.get('ev', []) if e[0] == 'chg']
            if nph != ph or mot or chg: out.append('p%d%s->%d%s%s' % (ph, 'E' if en else 'L' if la else 'F' if fr else '-', nph, mot or '', chg or ''))
    print(hex(n), ' '.join(out))
