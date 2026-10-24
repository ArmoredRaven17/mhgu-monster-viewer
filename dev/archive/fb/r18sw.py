import os, sys, struct, json
os.environ['FB_CLASS'] = 'uEm018_00'; os.environ['FB_MON'] = os.environ.get('MON','em018_00'); os.environ['FB_EM'] = '18'
exec(open('trgen.py').read())
E2 = json.load(open('emcreach.json')).get(os.environ.get('MON','em018_00'), [])
ctl = struct.pack('<f', 1000.0) * 0x30
seen = {}
for st in range(0, 16):
    for n in range(0x100):
        for ph in range(6):
            for prime in (0, 1):
                kw = dict(phase=ph, frame=1, frame2=1, stub={0x3a8430: 5, 0x49930: 10})
                if prime: kw['ctl'] = ctl
                r = run(st, n, variant=int(os.environ.get('VAR','0')), **kw)
                cr = [(e[1], e[2], e[5]) for e in r.get('ev', []) if e[0] == 'create']
                if cr:
                    key = (st, n, ph)
                    if key not in seen or (prime and len(cr) > len(seen[key][1])):
                        seen[key] = (prime, cr)
for (st, n, ph), (pr, cr) in sorted(seen.items()):
    inr = ('%d:0x%02x' % (st, n)) in E2
    print('%d:0x%02x ph%d prime%d reach%d' % (st, n, ph, pr, inr), cr)
