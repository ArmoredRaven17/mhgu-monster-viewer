# classify every whole-block binding by when the transcribed word turns its bit on.  python classify.py em063_00
import sys, re, itertools
mon = sys.argv[1]

def base(rage, tired):
    return 0x3f | (0xe00 if rage else 0x7000 if tired else 0x1c0)

def w063(v0, motion, action, s):
    r = 0 if s['severed'] else 0x18000000
    if v0:
        if s['emptyR']: r |= 0x180000
        if s['emptyL']: r |= 0x600000
    n = action[1] if action and action[0] == 7 else -1
    if motion == 0x22a and ((0xa1 <= n <= 0xb0 and (0x8025 >> (n - 0xa1)) & 1) or n in (0x14, 8)): r |= 0x60000
    if motion == 0x229 and n == 9: r |= 0x60000
    if motion == 0x00a and not s['sunk']: r |= 0x18000
    return base(s['rage'], s['tired']) | r

def w080(motion, action, s):
    h = s['heat']
    throat = 0x70000000 if h & 0x10 else 0x38000 if h & 4 else 0xc000000
    tail = 0x3000000 if h & 8 else 0xc0000 if h & 2 else 0xc00000 if h & 1 else 0x300000
    return base(s['rage'], s['tired']) | throat | tail

STATES = []
if mon.startswith('em063'):
    v0 = mon == 'em063_00'
    KEYS = ['rage', 'tired', 'severed', 'emptyL', 'emptyR', 'sunk', 'action']
    for rg, td, sv, el, er, sk, a in itertools.product((0, 1), (0, 1), (0, 1), (0, 1), (0, 1), (0, 1),
            (None, (7, 8), (7, 9), (7, 0x14), (7, 0x15), (7, 0x98), (7, 0xa5), (7, 0xa6), (7, 0xb0), (7, 0xb1))):
        if rg and td: continue
        STATES.append(dict(rage=rg, tired=td, severed=sv, emptyL=el, emptyR=er, sunk=sk, action=a))
    W = lambda m, s: w063(v0, m, s['action'], s)
else:
    KEYS = ['rage', 'tired', 'heat']
    # the states each variant reaches in life (states-em080_00.md 1.1 / 3, states-em080_04.md 4): Glavenus bits 0-2
    # (dark and hot exclusive), Hellblade bits 1 and 2 always, 3 / 4 as overheats
    HEATS = [0, 1, 2, 4, 5, 6] if mon == 'em080_00' else [0x6, 0xe, 0x16, 0x1e]
    for rg, td, h in itertools.product((0, 1), (0, 1), HEATS):
        if rg and td: continue
        STATES.append(dict(rage=rg, tired=td, heat=h))
    W = lambda m, s: w080(m, None, s)

def rows(fn):
    out = {}
    for l in open(fn):
        m = re.match(r'L(\d+) M(\d+) b(\d+) (\S+) (\d+) (\S+) on=(.*?) \|.*\| (\S+)$', l.strip())
        if m:
            out[(int(m.group(1)), int(m.group(2)), int(m.group(3)), m.group(4), int(m.group(5)))] = (m.group(6), m.group(8))
    return out

file = rows('rows_%s_file.txt' % mon); whole = rows('rows_%s_whole.txt' % mon)
def desc(ons):
    if all(ons.values()): return 'ALWAYS'
    if not any(ons.values()): return 'NEVER'
    on = [dict(s) for s, v in ons.items() if v]; al = [dict(s) for s in ons]
    parts = []
    for k in KEYS:
        vals = sorted({str(s[k]) for s in on}); allv = sorted({str(s[k]) for s in al})
        if vals != allv: parts.append('%s in %s' % (k, vals))
    return 'GATED: ' + '; '.join(parts)
for k, (arr, efl) in sorted(whole.items()):
    lst, slot, bit = k[:3]
    motion = (lst << 8) | slot
    ons = {tuple(sorted(s.items(), key=lambda x: x[0])): bool((W(motion, s) >> bit) & 1) for s in STATES}
    d = desc(ons)
    tag = 'IN ' if k in file else 'OUT'
    if tag == 'OUT' or d != 'ALWAYS':
        print('%s %-34s %-9s %-14s %s' % (tag, 'L%d M%d b%d %s %d' % k, arr, efl, d))
print('file rows not in whole:', [k for k in file if k not in whole])
