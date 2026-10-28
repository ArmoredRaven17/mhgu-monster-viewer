# p4cond.py (effects lane A4): p4sum.txt -> p4cond.txt, one line per action that is ever in posture 4: the reachable phases
# walked in order with the posture carried (entry posture from the phase that stored P+0x1a1 = k; ph0 enters with 0 unless
# the action ran with posture 4 already, which the line marks '[p4 in]' when the action itself never sets a posture).
# Shown: each phase's events (passes merged, distinct lists joined by ' || ') while the posture is 4, and the phase that leaves.
import os, re, collections
H = os.path.dirname(os.path.abspath(__file__))
lines = open(os.path.join(H, 'p4sum.txt')).read().splitlines()
out = []
cls = None
acts = collections.OrderedDict()

def flush():
    for (s, n), phs in acts.items():
        # posture after each phase (last POST in any pass; a mode-4 script counts; BCA / P1 -> 1)
        def after(evs, p):
            for e in evs.split(' | '):
                m = re.match(r'POST (\d+)', e)
                if m: p = int(m.group(1))
                if e.startswith(('BCA', 'P1')): p = 1
                if re.match(r'S 0x[0-9a-f]+ m(\d+)', e): p = int(re.match(r'S 0x[0-9a-f]+ m(\d+)', e).group(1))
                if e.startswith('VT3E8'): p = 4
            return p
        entry = {0: 0}
        order = sorted(phs)
        for _ in range(3):
            for ph in order:
                if ph not in entry: continue
                for evs in phs[ph]:
                    p = after(evs, entry[ph])
                    for e in evs.split(' | '):
                        if e.startswith('PH '):
                            k = int(e.split()[1])
                            if k not in entry or (p == 4 and entry[k] != 4): entry[k] = p
        any4 = any(after(evs, entry.get(ph, 0)) == 4 or entry.get(ph, 0) == 4 for ph in phs for evs in phs[ph])
        if not any4 and not any('SET' in e or 'ADD' in e or 'W5C' in e for v in phs.values() for e in v):
            continue
        seg = []
        for ph in order:
            if ph not in entry: continue
            show = entry[ph] == 4 or any(after(evs, entry[ph]) == 4 for evs in phs[ph]) or \
                   any(re.search(r'SET|ADD|W5C|BCA', evs) for evs in phs[ph])
            if show:
                seg.append('ph%d%s[%s]' % (ph, '(in 4)' if entry[ph] == 4 else '', ' || '.join(phs[ph])))
        if seg:
            out.append('  (%d, %#x): %s' % (s, n, '  ->  '.join(seg)))

for l in lines:
    if l.startswith('=='):
        if cls: flush()
        acts = collections.OrderedDict(); cls = l
        out.append(l); continue
    m = re.match(r'  \((\d+), (0x[0-9a-f]+)\)$', l)
    if m:
        key = (int(m.group(1)), int(m.group(2), 16)); acts[key] = collections.OrderedDict(); continue
    m = re.match(r'     ph(\d+): (.*)$', l)
    if m:
        acts[key][int(m.group(1))] = m.group(2).split(' || ')
flush()
open(os.path.join(H, 'p4cond.txt'), 'w').write('\n'.join(out) + '\n')
print(len(out))
