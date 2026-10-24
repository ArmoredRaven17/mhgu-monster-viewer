"""scrcensus.py <variant> <statuses>: every action whose action main starts a status script (0xa1290), with the script and mode.
   CLS / EM env."""
import sys, collections
import tracec as TR
v = int(sys.argv[1]); sts = [int(x, 0) for x in sys.argv[2].split(',')]
res = collections.defaultdict(set)
for st in sts:
    for n in range(0x100):
        for ph in (0, 1, 2):
            try: ev = TR.run(v, st, n, ph, 0, 0, 0, follows=0)
            except Exception: continue
            for x in ev:
                if x.startswith('SCRIPT'): res[x.split()[1]].add('(%d,%#x)' % (st, n))
for s, a in sorted(res.items()): print(s, ' '.join(sorted(a)))
