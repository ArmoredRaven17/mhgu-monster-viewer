# every whole-block binding of Khezu / Gravios against the ROM word (emu_kg), per play (the proposed CLIP_ACTIONS,
# with their rage / tired forms) x calm / enraged / tired x parts. Prints, per binding, where it fires.
import sys, re, collections, emu_kg as g
mon = sys.argv[1]
rows = [l for l in open(mon + '_whole.txt') if l.strip()]
filemask = {tuple(l.split()[:3]) for l in open(mon + '_file.txt') if l.strip()}
VT = {'em003_00': 0x17958f0, 'em005_00': 0x1797c8c}[mon]
EM = {'em003_00': 3, 'em005_00': 5}[mon]
NONE = {'action': None}
if mon == 'em003_00':
    M4 = [{'action': (7, 0x00), 'rage': (7, 0x09)}, {'action': (7, 0x4e), 'rage': (7, 0x4f)}, {'action': (7, 0x11)},
          {'action': (7, 0x57)}]
    PLAYS = {
        (0, 6): [{'action': (2, 0x05)}, {'action': (2, 0x07), 'rage': (7, 0x0b)}],
        (2, 4): M4, (2, 5): M4 + [{'action': (7, 0x12)}, {'action': (3, 0x43)}],
        (2, 39): M4 + [{'action': (7, 0x12)}, {'action': (3, 0x43)}],
        (2, 10): [{'action': (7, 0x02), 'rage': (7, 0x0a)}],
        (2, 74): [{'action': (7, 0x0f), 'rage': (7, 0x10)}],
        (2, 37): [{'action': (7, 0x2c)}, {'action': (7, 0x52), 'phase': 1}, {'action': (7, 0x52), 'phase': 3}],
        (2, 38): [{'action': (7, 0x2c)}, {'action': (7, 0x52)}],
    }
    PARTS = {'-': {}}
else:
    GAS = [{'action': (7, 0x0a)}, {'action': (7, 0x07)}, {'action': (7, 0x05), 'tired': (7, 0x0f)},
           {'action': (7, 0x15), 'tired': (7, 0x10)}]
    PLAYS = {(2, 3): GAS, (2, 4): GAS,
             (2, 30): [{'action': (7, 0x32)}], (2, 31): [{'action': (7, 0x32)}], (2, 32): [{'action': (7, 0x32)}],
             (2, 33): [{'action': (7, 0x0e), 'tired': (7, 0x0d)}],
             (2, 24): [{'action': (7, 0x11), 'tired': (7, 0x0c)}],
             (4, 59): [{'action': (7, 0x34), 'tired': (7, 0x38)}]}
    # G rank (rank byte 5): back row 0 level 2, belly row 2 level 2
    PARTS = {'intact': dict(lv=[0, 0, 0, 0, 0, 0, 0, 0], ctl24=0), 'belly': dict(lv=[0, 0, 0, 0, 0, 0, 2, 0], ctl24=2),
             'back': dict(lv=[2, 0, 0, 0, 0, 0, 0, 0], ctl24=4), 'both': dict(lv=[2, 0, 0, 0, 0, 0, 2, 0], ctl24=6)}
STATES = {'calm': (0, 0), 'rage': (1, 0), 'tired': (0, 1)}
cache = {}
def word(m, play, st, part):
    rage, tired = STATES[st]
    a = play.get('action')
    if rage and play.get('rage'): a = play['rage']
    elif tired and not rage and play.get('tired'): a = play['tired']
    s, n = a if a else (0, 0xff)
    key = (m, s, n, st, part, play.get('phase', 0))
    if key not in cache:
        cache[key] = g.run(VT, m=m, st=s, n=n, rage=rage, tired=tired, em=EM, phase=play.get('phase', 0), rank=5,
                           dtp=mon, **PARTS[part])
    return cache[key], a
for l in rows:
    f = l.split()
    lst, slot, bit = int(f[0][1:]), int(f[1][1:]), int(f[2][1:])
    m = (lst << 8) | slot
    plays = PLAYS.get((lst, slot), [NONE])
    on = collections.OrderedDict()
    for play in plays:
        for st in STATES:
            for part in PARTS:
                w, a = word(m, play, st, part)
                if (w >> bit) & 1:
                    on.setdefault('%s' % (('(%d,%#x)' % a) if a else 'none'), []).append(st + ('' if part == '-' else '/' + part))
    tag = 'FILE' if tuple(f[:3]) in filemask else 'OUT '
    desc = '; '.join('%s: %s' % (k, ','.join(v)) for k, v in on.items()) or 'NEVER'
    print('%s %-14s %s %s %s  ->  %s' % (tag, ' '.join(f[:3]), f[3], f[4], f[6].split('|')[0] if len(f) > 6 else '', desc))
