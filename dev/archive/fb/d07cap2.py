import os, sys, json, struct
os.environ['FB_CLASS'] = 'uEm007_00'; os.environ['FB_MON'] = 'em007_04'; os.environ['FB_EM'] = '7'
exec(open('trgen.py').read())
for n in (0xb4, 0xb6, 0xb8):
  for ph in (1, 2, 3):
    for kw in ({}, {'ended': 1}, {'landed': 1}, {'timer': 1}, {'frame': 1, 'frame2': 1}, {'ended': 1, 'landed': 1, 'timer': 1}):
        r = run(7, n, phase=ph, variant=4, stub={0x3a8430: 5, 0x49930: 10}, **kw)
        ev = [e for e in r.get('ev', []) if e[0] in ('mot', 'create', 'chg', 'ftest', 'ftest2')]
        print('7:0x%02x ph %d %s' % (n, ph, kw), json.dumps(ev)[:250], 'ph->', bytes(mu.mem_read(P + 0x1a1, 1))[0])
