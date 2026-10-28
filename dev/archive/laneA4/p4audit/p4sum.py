# p4sum.py (effects lane A4): out/*.txt -> p4sum.txt, the reachable phases only (no '?'), for actions that enter posture 4
# (POST 4, a mode-4 script, VT3E8) or write P+0x5c; one block per action, one line per phase (passes merged, distinct
# event lists joined by ' || ').  Identical em files of one class are folded (the first em listed, the others named).
import os, re, collections, sys
H = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(H, 'out')
files = sorted(os.listdir(OUT))
bycls = collections.OrderedDict()
for f in files:
    cls = f.split('_em')[0]
    body = [re.sub(r' em\d+ v\d+ ', ' ', l) for l in open(os.path.join(OUT, f))]
    bycls.setdefault(cls, []).append((f, body))
res = []
for cls, lst in bycls.items():
    groups = collections.OrderedDict()
    for f, body in lst:
        groups.setdefault(''.join(body), []).append(f.replace('.txt', '').split('_', 2)[2])
    for body, ems in groups.items():
        acts = collections.OrderedDict()
        for l in body.splitlines():
            m = re.match(r'(\S+) \((\d+), (0x[0-9a-f]+)\) ph(\d+)([ABC])(\??): (.*)', l)
            if not m: continue
            _, s, n, ph, pb, q, ev = m.groups()
            if q: continue
            acts.setdefault((int(s), int(n, 16)), collections.OrderedDict()).setdefault(int(ph), [])
            L = acts[(int(s), int(n, 16))][int(ph)]
            if ev not in L: L.append(ev)
        keep = []
        for k, phs in acts.items():
            allev = ' '.join(' '.join(v) for v in phs.values())
            if re.search(r'POST 4|m4\b|VT3E8|SET|ADD|W5C|BCA|SH4|W1BA', allev):
                keep.append((k, phs))
        if not keep: continue
        res.append('== %s  [%s]' % (cls, ' '.join(ems)))
        for (s, n), phs in keep:
            res.append('  (%d, %#x)' % (s, n))
            for ph, L in phs.items():
                res.append('     ph%d: %s' % (ph, ' || '.join(L)))
open(os.path.join(H, 'p4sum.txt'), 'w').write('\n'.join(res) + '\n')
print(len(res))
