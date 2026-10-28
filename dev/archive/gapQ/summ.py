# summ.py <cen file...>: per action, each create / maker call with the frame literals (only=L passes) and the phases / rage it needs
import sys, json, re, collections
for p in sys.argv[1:]:
    for line in open(p):
        m = re.match(r'(\d+) (\d+) (\S+) (\[.*?\]) (\{.*\})$', line.strip())
        if not m: continue
        var, ss, act, mots, d = m.group(1), m.group(2), m.group(3), m.group(4), json.loads(m.group(5))
        rows = collections.defaultdict(lambda: collections.defaultdict(set))
        for k, v in d.items():
            kk, fr = k.rsplit(' f', 1)
            if fr.startswith('ALL'): continue
            if kk.startswith('spend') or kk.startswith('probe'): continue
            for x in v:
                ph, rg = x.split()[0], x.split()[1]
                rows[kk][fr].add(ph + rg)
        if not rows:
            # fALL only
            rows2 = sorted(set(k.rsplit(' f', 1)[0] for k in d if not k.startswith('spend') and not k.startswith('probe')))
            if rows2: print('v%s s%s %s %s ALLONLY %s' % (var, ss, act, mots, rows2))
            continue
        print('v%s s%s %s %s' % (var, ss, act, mots))
        for kk in sorted(rows):
            print('    %-60s %s' % (kk, '  '.join('f%s[%s]' % (fr, ','.join(sorted(s))) for fr, s in sorted(rows[kk].items(), key=lambda t: float(t[0])))))
