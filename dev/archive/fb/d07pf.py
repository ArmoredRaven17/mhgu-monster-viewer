import os, sys, json, struct
os.environ['FB_CLASS'] = 'uEm007_00'; os.environ['FB_MON'] = os.environ.get('MON', 'em007_00'); os.environ['FB_EM'] = '7'
exec(open('trgen.py').read())
V = int(os.environ.get('VAR', '0'))
seen = {}
for st in (6,):
  for n in range(0, 0x40):
    for mot in (0x9ff,):
        r = run(st, n, variant=V, fn=0xd35a94, mot=mot, frame=1, frame2=1, ctl=bytes(0x24) + bytes([1, 0, 0, 0]), stub={0x3a8430: 5, 0x49930: 10})
        cr = [(e[1], e[2], e[6], e[5]) for e in r.get('ev', []) if e[0] == 'create']
        if cr: print('st %d n 0x%02x' % (st, n), cr, [e for e in r['ev'] if e[0] in ('ftest', 'ftest2')][:3])
