# agg.py <census.json>: per action, the motions it sets with the link bit clear / set (union over phases and
# scenarios), the changes it makes, the partner tests, and the P+0x1bb read sites inside the action (the action
# main's own tail read 0xf99900 / the Seltas equivalent is left out).
import sys, json, re
d = json.load(open(sys.argv[1]))
TAIL = {'0xf99900'}
mot_re = re.compile(r'MOT L(\d+) M(\d+) \((0x[0-9a-f]+)\) b([-\d.e]+) s([-\d.e]+) (\S+) @(0x[0-9a-f]+)')
for act, rec in d.items():
    by = {0: {}, 1: {}}
    chg = {0: set(), 1: set()}
    reads = set(); pt = set(); wr = set()
    for k, lines in rec.items():
        ph, link, sn = k.split('/'); link = int(link)
        for l in lines:
            m = mot_re.match(l)
            if m:
                key = 'L%s M%s' % (m.group(1), m.group(2))
                by[link].setdefault(key, set()).add('p%s b%s s%s %s @%s' % (ph, m.group(4), m.group(5), m.group(6) if m.group(6).startswith('layer') else '', m.group(7)))
            elif l.startswith('CHG'):
                chg[link].add(l[4:] + ' p' + ph)
            elif l.startswith('READ'):
                for x in l[5:].split():
                    if x.split('@')[1] not in TAIL: reads.add(x)
            elif l.startswith('PTEST'):
                for x in l[6:].split(): pt.add(x.rsplit('=', 1)[0])
            elif l.startswith('WRITE'):
                for x in l[6:].split():
                    if not x.startswith('phase'): wr.add(x)
    m0, m1 = set(by[0]), set(by[1])
    tag = '' if m0 == m1 else '  <-- LINK DIFFERS'
    print('== (%s)%s' % (act, tag))
    for key in sorted(m0 | m1):
        side = 'both' if key in m0 and key in m1 else ('solo' if key in m0 else 'LINKED')
        print('   %-8s %-6s %s' % (key, side, '; '.join(sorted(by[0].get(key, set()) | by[1].get(key, set())))[:200]))
    c0, c1 = {re.sub(r' p\d$', '', x) for x in chg[0]}, {re.sub(r' p\d$', '', x) for x in chg[1]}
    for c in sorted(c0 | c1):
        side = 'both' if c in c0 and c in c1 else ('solo' if c in c0 else 'LINKED')
        print('   chg %-6s %s' % (side, c))
    if reads: print('   reads', ' '.join(sorted(reads)))
    if pt: print('   ptests', ' '.join(sorted(pt)))
    if wr: print('   writes', ' '.join(sorted(wr))[:300])
