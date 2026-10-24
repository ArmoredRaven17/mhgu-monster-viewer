# acts.py -- the clips each (status, n) of uEm024_00 sets (trgen: the action main at phases 0..5, ended 0 / 1, posture 0 / 1)
import sys, os, json
os.environ['FB_CLASS'] = 'uEm024_00'; os.environ['FB_MON'] = 'em024_00'
sys.path.insert(0, r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb')
sys.argv = ['x']
import trgen as T
want = {0: range(0, 0x40), 1: [2, 3, 0x13], 2: [3, 8, 9, 10, 11, 13, 20, 21, 22, 23], 4: [3, 5, 7, 9, 11, 12, 13, 14, 15, 16, 23],
        7: [0xf, 0x10, 0x11, 0x30]}
out = {}
for st, ns in want.items():
    for n in ns:
        mots = []; ends = set()
        for ph in range(6):
            for ended in (0, 1):
                for post in (0, 1):
                    r = T.run(st, n, phase=ph, ended=ended, poke={T.P + 0x1ba: [post]})
                    for e in r.get('ev', []):
                        if e[0] == 'mot' and e[1] not in mots: mots.append(e[1])
                    if r.get('end'): ends.add(r['end'][:40])
        if mots: out['%d:0x%02x' % (st, n)] = mots
        print('%d:0x%02x' % (st, n), mots, sorted(ends)[:2] if ends and not mots else '')
json.dump(out, open('acts024.json', 'w'), indent=0)
