import os, sys, json, struct
os.environ['FB_CLASS'] = 'uEm071_00'; os.environ['FB_MON'] = sys.argv[1]
os.environ['FB_WATCH'] = '0xfb63d0,0xfb826c,0xfb8628,0xfb8a50,0xfb8eac,0xfbad04,0xfbc0e8,0xfb700c,0xfb71d4'
v = int(sys.argv[2]); pk = json.loads(json.load(open('gorepokes.json'))[sys.argv[1]])
sys.argv = ['x']
import trgen as T
poke = {T.E + int(k, 0): b for k, b in pk.items()}
for st in (7,):
    for n in range(0x80):
        for ph in range(3):
            r = T.run(st, n, ph, v, 0, stub={0x3a8430: 5}, frame=1, frame2=1, poke=poke)
            w = sorted(set(e[1] for e in r.get('ev', []) if e[0] == 'watch'))
            cr = [tuple(e[1:3]) for e in r.get('ev', []) if e[0] == 'create']
            mot = [e[1] for e in r.get('ev', []) if e[0] == 'mot']
            if w: print(st, hex(n), ph, w, mot, cr, r.get('end'))
