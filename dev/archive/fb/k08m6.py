import os, sys, struct
os.environ['FB_CLASS'] = 'uEm008_00'; os.environ['FB_MON'] = 'em008_00'; os.environ['FB_EM'] = '8'
exec(open('trgen.py').read())
for st in (7,):
    for n in range(0x100):
        for ph in range(5):
            r = run(st, n, phase=ph, frame=1, frame2=1, stub={0x3a8430: 5, 0x49930: 10}, poke={C + 0x10: struct.pack('<f', 16.0)})
            cr = [e for e in r.get('ev', []) if e[0] == 'create']
            if any(e[1] == '0x74' for e in cr):
                print(hex(n), ph, [(e[1], e[2], e[5]) for e in cr], [e[1] for e in r.get('ev', []) if e[0] == 'mot'])
