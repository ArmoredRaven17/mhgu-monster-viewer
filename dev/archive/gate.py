# classify each whole-block binding by the class word over the states; read-only
import sys, re
mon, fn = sys.argv[1], sys.argv[2]
def base(st): return 0x3f | (0xe00 if st=='rage' else 0x7000 if st=='tired' else 0x1c0)
def em033(m, sev, sunk):
    if m in (0x215, 0x203): return 0x7000000 if sev else 0xe00000
    if m == 0x002: return 0x1c0000 if sunk else 0x38000
    return 0
def em032(m, sev, sunk): return 0
W = {'em033_00': em033, 'em032_00': em032, 'em032_04': em032}[mon]
for line in open(fn):
    mm = re.match(r'L(\S+) M(\d+) b(\d+) (\S+) (\S+) (\S+)', line)
    if not mm: continue
    lst, slot, bit = mm.group(1), int(mm.group(2)), int(mm.group(3))
    if not lst.isdigit(): continue
    m = (int(lst) << 8) | slot
    on = []
    for st in ('calm','rage','tired'):
        for sev in (0,1):
            for sunk in (0,1):
                w = base(st) | W(m, sev, sunk)
                if mon == 'em033_00' and m not in (0x203, 0x215) and sev: continue
                if (w >> bit) & 1: on.append((st, sev, sunk))
    if bit < 6: cls = 'always'
    elif not on: cls = 'NEVER'
    else:
        sts = sorted({o[0] for o in on}); sevs = sorted({o[1] for o in on}); sk = sorted({o[2] for o in on})
        cls = 'states=%s sever=%s sunk=%s' % ('/'.join(sts), sevs, sk)
    print('%-40s %s' % (line.split(' on=')[0], cls))
