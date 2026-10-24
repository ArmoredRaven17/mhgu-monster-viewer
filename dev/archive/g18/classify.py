# classify every whole-block binding of em018_00 / em018_04 by when the enable word (the transcription below, which the
# emulator agrees with) turns its bit on. python classify.py em018_04
import sys, re, itertools
mon = sys.argv[1]; V4 = mon == 'em018_04'

def base(rage, tired):
    return 0x3f | (0xe00 if rage else 0x7000 if tired else 0x1c0)

def word(motion, action, rage, tired, severed, lvl7):
    w = base(rage, tired)
    if motion == 0x007:
        if V4 and action and action[0] == 7 and 0xe3 <= action[1] <= 0xe5: w |= 0x38000000
    elif motion == 0x168: w |= 0x7000000
    elif motion == 0x202: w &= ~0x1240
    elif motion in (0x20c, 0x441, 0x44d):
        w |= 0xe00000 if severed else (0x1c0000 if (V4 and lvl7 >= 2) else 0x38000)
    return w

STATES = []
for rage, tired, severed, lvl7, act in itertools.product((0, 1), (0, 1), (0, 1), (0, 2) if V4 else (0,), (None, (7, 0xe5), (2, 2))):
    if rage and tired: continue
    STATES.append(dict(rage=rage, tired=tired, severed=severed, lvl7=lvl7, action=act))

def rows(fn):
    out = {}
    for l in open(fn):
        m = re.match(r'L(\d+) M(\d+) b(\d+) (\S+) (\d+) (\S+) on=(.*?) \|', l)
        if m:
            k = (int(m.group(1)), int(m.group(2)), int(m.group(3)), m.group(4), int(m.group(5)))
            out[k] = l.strip()
    return out

file = rows('rows_%s_file.txt' % mon); whole = rows('rows_%s_whole.txt' % mon)
def desc(ons):
    if all(ons.values()): return 'ALWAYS'
    if not any(ons.values()): return 'NEVER'
    keys = ['rage', 'tired', 'severed', 'lvl7', 'action']
    on = [s for s, v in ons.items() if v]
    # summarise by which inputs vary among the on-states
    parts = []
    for k in keys:
        vals = sorted({dict(s)[k] for s in on}, key=str)
        allv = sorted({dict(s)[k] for s in ons}, key=str)
        if vals != allv: parts.append('%s in %s' % (k, vals))
    return 'GATED: ' + '; '.join(parts)

res = {}
for k, l in sorted(whole.items()):
    lst, slot, bit = k[:3]
    motion = (lst << 8) | slot
    ons = {}
    for s in STATES:
        ons[tuple(sorted(s.items(), key=lambda x: x[0]))] = bool((word(motion, s['action'], s['rage'], s['tired'], s['severed'], s['lvl7']) >> bit) & 1)
    d = desc(ons)
    tag = 'IN ' if k in file else 'OUT'
    if tag == 'OUT' or d != 'ALWAYS':
        print('%s %-48s %s' % (tag, 'L%d M%d b%d %s %d' % (lst, slot, bit, k[3], k[4]), d))
missing = [k for k in file if k not in whole]
print('file rows not in whole:', missing)
