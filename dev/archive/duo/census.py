# census.py <cls> <out.json>: every (status, n) x phase 0..7 x link 0/1 x scenario, the tracer's record of each.
import sys, json
import tracer as t
cls = sys.argv[1]
STAT = [int(x, 0) for x in sys.argv[3].split(',')] if len(sys.argv) > 3 else [0, 1, 2, 3, 4, 6, 7, 8, 10, 11, 12, 13, 16, 17]
SCN = {'none': {}, 'end': {'ended': 1, 'timer': 1, 'frame': 1, 'ptest': 'all'},
       'endnp': {'ended': 1, 'timer': 1, 'frame': 1}, 'frame': {'frame': 1, 'ptest': 'all'}}
out = {}
for s in STAT:
    for n in range(256):
        base = t.run(cls, s, n, phase=0, link=0, extra=[(t.E + 0x7420, b'\1')])
        f = t.fmt(base)
        if any(x.startswith('CHG unhandled') for x in f) and not base.get('motions'):
            continue
        rec = {}
        for ph in range(8):
            for link in (0, 1):
                for sn, scn in SCN.items():
                    r = t.run(cls, s, n, phase=ph, link=link, sc=dict(scn), extra=[(t.E + 0x7420, b'\1')])
                    rec['%d/%d/%s' % (ph, link, sn)] = t.fmt(r)
        out['%d,%#x' % (s, n)] = rec
        print(s, hex(n), f[:2], flush=True)
json.dump(out, open(sys.argv[2], 'w'), indent=0)
