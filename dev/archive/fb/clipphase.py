# clipphase.py <class> <mon> <variant> <census files..>: for every create in a census, the motion current at its phase (phases run in
# order with the motion ended, each phase's last setMotion kept), against the census's phase-0 motion
import sys, re, os
cls, mon, v = sys.argv[1], sys.argv[2], int(sys.argv[3]); files = sys.argv[4:]
os.environ['FB_CLASS'] = cls; os.environ['FB_MON'] = mon; sys.argv = ['x']
import trgen as T
KEY = re.compile(r"'(0x[0-9a-f]+) m(\d+) f([^ ]+) (0x[0-9a-f]+)': \[([^\]]*)\]")
seen = {}
for fn in files:
    for l in open(fn):
        p = l.split(' ', 2)
        st, n = p[1].split(':'); st = int(st); n = int(n, 16)
        m0 = re.match(r"(\[[^\]]*\])", p[2]).group(1)
        for m in KEY.finditer(p[2]):
            for ph in set(re.findall(r'p(\d)', m.group(5))): seen.setdefault((st, n, int(ph), m0), set()).add((m.group(1), int(m.group(2)), m.group(3)))
for (st, n, ph, m0), ks in sorted(seen.items()):
    cur = None
    for q in range(ph + 1):
        for e in (0, 1) if q < ph else (0,):
            r = T.run(st, n, q, v, 0, ended=e, stub={0x3a8430: 5})
            mm = [x[1] for x in r.get('ev', []) if x[0] == 'mot']
            if mm and (e == 1 or q == ph): cur = mm[-1]
    flag = '' if m0 == "['%s']" % cur else '   <-- NOT the phase-0 clip'
    print('%d:%#04x p%d phase-0 %s, at the create %s %s%s' % (st, n, ph, m0, cur, sorted(set((k[0], k[1]) for k in ks))[:4], flag))
