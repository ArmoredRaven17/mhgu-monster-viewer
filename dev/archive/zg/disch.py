import trace as TR
acts = [l.split()[0:2] for l in open('act_v0_s17.txt')] 
import re
seen=set()
for v in (0, 4):
    for line in open('act_v%d_s17.txt' % v):
        m = re.match(r'\((\d+), (0x[0-9a-f]+)\)', line)
        st, n = int(m.group(1)), int(m.group(2), 16)
        for ph in range(0, 6):
            for e in (0, 1):
                ev = TR.run(v, st, n, ph, e, e, 1)
                hits = [x for x in ev if 'HIT' in x and 'shell' not in x] 
                sh = [x for x in ev if 'HIT' in x and 'shell' in x]
                if hits or sh:
                    key = (v, st, n, ph, tuple(hits), len(sh))
                    if key in seen: continue
                    seen.add(key)
                    print('v%d (%d,%#x) ph%d e%d:' % (v, st, n, ph, e), ' | '.join(x.strip() for x in ev)[:400])
