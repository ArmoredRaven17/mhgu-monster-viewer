import os, sys, json, struct
os.environ['FB_CLASS'] = 'uEm007_00'; os.environ['FB_MON'] = 'em007_04'; os.environ['FB_EM'] = '7'
exec(open('trgen.py').read())
pk = {E + 0xcac4 + 4 * k: struct.pack('<I', 0x1000 + k) for k in range(8)}
for n in (0x62, 0xa0, 0xa1, 0xa2, 0xa3, 0xc8, 0xb8, 0x77, 0x79, 0x7a, 0x7b):
    for ph in range(6):
        r = run(7, n, phase=ph, variant=4, frame=1, frame2=1, stub={0x3a8430: 5, 0x49930: 10}, poke=dict(pk))
        cr = [(e[1], e[2], e[6], e[5]) for e in r.get('ev', []) if e[0] == 'create']
        ms = [e[1] for e in r.get('ev', []) if e[0] == 'mot']
        if cr: print('7:0x%02x ph %d' % (n, ph), cr, ms)
