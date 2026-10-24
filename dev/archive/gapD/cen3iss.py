# who issues status 3: statuses 0 / 1 / 2 / 7 / 10 / 12 / 13 numbers 0..N, phases 0..6, with the area-point queries answered in sequence
# (0xa6c48: Q1 then Q2; 0xa6c1c: Q3) -- trgen answers every stub with one value, so 0x1095114's (3, 2 / 3 / 4) arms were never taken
import os, sys
FB = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb'
os.environ['FB_CLASS'] = 'uEm086_00'; os.environ['FB_MON'] = 'em086_00'
sys.path.insert(0, FB); args = sys.argv[1:]; sys.argv = ['x']
import trgen as T
class Seq(dict):
    def __init__(s, base, seqs): super().__init__(base); s.seqs = {k: list(v) for k, v in seqs.items()}
    def get(s, k, d=None):
        if k in s.seqs and s.seqs[k]: return s.seqs[k].pop(0) if len(s.seqs[k]) > 1 else s.seqs[k][0]
        return super().get(k, d)
M1 = 0xffffffff
ANS = {'Q1 -1, Q2 found': {0xa6c48: [M1, 0]}, 'Q1 found, Q3 -1': {0xa6c48: [0], 0xa6c1c: [M1]}, 'both -1': {0xa6c48: [M1]}, 'all 0': {}}
SC = ({}, {'frame': 1, 'frame2': 1}, {'ended': 1}, {'landed': 1}, {'timer': 1}, {'frame': 1, 'frame2': 1, 'ended': 1, 'timer': 1, 'landed': 1})
want = set(int(x, 0) for x in args[2].split(',')) if len(args) > 2 else {3, 13}
for st in [int(x, 0) for x in args[0].split(',')]:
    for n in range(0, int(args[1], 0)):
        out = set()
        for nm, seq in ANS.items():
            for ph in range(8):
                for sc in SC:
                    for rg in (0, 1):
                        r = T.run(st, n, ph, 0, 0, stub=Seq({0x3a8430: 5}, seq), rage=rg, **sc)
                        for e in r.get('ev', []):
                            if e[0] == 'chg' and (e[1] & 0xff) in want: out.add('p%d %s -> (%d, %#x) @%s' % (ph, nm, e[1] & 0xff, e[2] & 0xff, e[3]))
        if out: print('(%d,%#x)' % (st, n), sorted(out))
