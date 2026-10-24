import re, sys, itertools, collections
VAR = {'em001_00': (0, 0x001), 'em001_02': (2, 0x201), 'em001_04': (4, 0x401)}
TAILM = {0x406, 0x432, 0x434, 0x437, 0x441, 0x902, 0x906}
def word(v, idd, m, act, rage, tired, sev, lvl, ql=10, rank=5):
    w = 0x3f | (0xe00 if rage else 0x7000 if tired else 0x1c0)
    def tail():
        if sev: return 0xe00000
        if v != 4: return 0x38000
        if lvl >= 2: return 0x1c0000
        return 0x1c0000 if (ql & 0xffffffff) <= 5 else 0x38000
    if m in (0x10, 0x11): w |= 0xc0000 if act in ((1, 7), (1, 8)) else 0
    elif m in (0x203, 0x204): w |= tail()
    elif m == 0x201: w |= 0x7000000 if idd in (0x201, 0x202, 0x401) and not tired else 0
    elif m in TAILM:
        w |= 0xe00000 if sev else tail()
        if m == 0x441 and sev: w &= ~2
    elif m == 0x426 and act == (7, 0xf5): w = (w & 0x3fffe03f) | 0xc0000000
    return w
mon = sys.argv[1]; v, idd = VAR[mon]
ql = int(sys.argv[2]) if len(sys.argv) > 2 else 10
filek = set(l.split(' on=')[0] for l in open(mon + '_file.txt'))
groups = collections.defaultdict(list)
for l in open(mon + '_whole.txt'):
    k = l.split(' on=')[0]
    mm = re.match(r'L(\w+) M(\d+) b(\d+) (\S+) (\d+) (\S+) on=(.*?) \| clip: (.*?) \| (.*?) \| (\S+)', l)
    L, M, b, pel, key, arr, on, clip, st, efl = mm.groups()
    if not L.isdigit(): continue
    m = (int(L) << 8) | int(M); b = int(b)
    S = []
    for rage, tired, sev, lvl, act in itertools.product((0, 1), (0, 1), (0, 1), (0, 2) if v == 4 else (0,), ((0, 0), (1, 7), (7, 0xf5))):
        if rage and tired: continue
        if (word(v, idd, m, act, rage, tired, sev, lvl, ql) >> b) & 1: S.append((rage, tired, sev, lvl, act))
    allS = [(r, t, s, lv, a) for r, t, s, lv, a in itertools.product((0, 1), (0, 1), (0, 1), (0, 2) if v == 4 else (0,), ((0, 0), (1, 7), (7, 0xf5))) if not (r and t)]
    def desc():
        if len(S) == len(allS): return 'always'
        if not S: return 'never'
        parts = []
        conds = []
        for name, idx, vals in (('rage', 0, (0, 1)), ('tired', 1, (0, 1)), ('sev', 2, (0, 1)), ('lvl7', 3, (0, 2)), ('act', 4, ((0, 0), (1, 7), (7, 0xf5)))):
            pass
        sset = set(S)
        # simple descriptors
        st = {}
        for r, t, s, lv, a in sset: st.setdefault((r, t), set()).add((s, lv, a))
        out = []
        statename = {(0, 0): 'calm', (1, 0): 'enraged', (0, 1): 'tired'}
        for kk in ((0, 0), (1, 0), (0, 1)):
            if kk in st:
                rest = st[kk]
                full = set((s, lv, a) for (r, t, s, lv, a) in allS if (r, t) == kk)
                if rest == full: out.append(statename[kk])
                else:
                    sv = sorted(set((s, lv) for s, lv, a in rest)); ac = sorted(set(a for s, lv, a in rest))
                    out.append(statename[kk] + ' ' + ','.join(('sev' if s else ('broken' if lv else 'intact')) for s, lv in sv) + ('' if len(ac) == 3 else ' act' + str(ac)))
        return ' / '.join(out)
    tag = '*' if k not in filek else ' '
    groups[desc()].append('%s%s M%s b%d %s%s' % (tag, 'L' + L, M, b, ('c ' if pel.endswith('c') else 'u ') + key, '' if arr != 'None' else ' (no rec)'))
for d, xs in sorted(groups.items()):
    if d == 'always' and all(x[0] == ' ' for x in xs): print('always (in mask):', len(xs)); continue
    print('==', d, len(xs)); print('   ', '; '.join(xs))
