# p4group.py (effects lane A4): p4cond.txt -> p4group.txt, actions with the same posture-4 signature folded into one row
# (signature = the condensed phase chain, sites kept; tail-call sites '@4ffffffc' shown as '@tail').
import os, re, collections
H = os.path.dirname(os.path.abspath(__file__))
out = []; cur = None; g = collections.OrderedDict()
def flush():
    for sig, acts in g.items():
        out.append('  %s :: %s' % (' '.join(acts), sig))
for l in open(os.path.join(H, 'p4cond.txt')).read().splitlines():
    if l.startswith('=='):
        if cur: flush()
        cur = l; g = collections.OrderedDict(); out.append(l); continue
    m = re.match(r'  (\(\d+, 0x[0-9a-f]+\)): (.*)$', l)
    if not m: continue
    sig = m.group(2).replace('@4ffffffc', '@tail')
    if not re.search(r'POST 4|m4\]|\(in 4\)', sig): continue
    g.setdefault(sig, []).append(m.group(1).replace(' ', ''))
flush()
open(os.path.join(H, 'p4group.txt'), 'w').write('\n'.join(out) + '\n')
print(len(out))
