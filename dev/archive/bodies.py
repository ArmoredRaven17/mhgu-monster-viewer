"""For each action body: its setMotion literals (r1 before bl/b 0xafe84/0xafce8/0xafef0/0xafe8c/0xafe30) and every call
to the shell helpers with the r1 literal and the last frame-gate float before it (vldr/vmov s0 then bl 0xb0974/0xb0968/0xb09b0)."""
import sys, re, json, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
lines = open(sys.argv[1]).read().splitlines()
rx = re.compile(r'^([0-9a-f]{8})\s+(\S+)\s*(.*)$')
P = []
for l in lines:
    m = rx.match(l)
    if m: P.append((int(m.group(1), 16), m.group(2), m.group(3)))
idx = {a: i for i, (a, _, _) in enumerate(P)}
starts = sorted(a for a, mn, op in P if mn == 'push' and 'lr' in op)
SETM = {0xafe84: 'setMotion0', 0xafce8: 'setMotion', 0xafef0: 'setMotionL', 0xafe8c: 'setMotionC', 0xafe30: 'setMotion?'}
HELP = {0x102fd04: 'sh00(tbl)', 0x1031080: 'sh00(tbl r5)', 0x1030024: 'sh00 7c..db', 0x1030b48: 'sh00 91/92', 0x1030cc8: 'sh00 95..9f',
        0x102fdd8: 'sh01 mode=r1', 0x10306cc: 'sh01 0/16', 0x10308f8: 'sh01 1/17', 0x103047c: 'sh11/sh01', 0x103034c: 'sh14',
        0x102ff4c: 'sh50 mode=r1', 0x102feb4: 'sh02 beam', 0x102fa88: 'sh14/01'}
def lit_float(i):
    for j in range(i, max(0, i - 8), -1):
        a, mn, op = P[j]
        m = re.match(r's0, \[pc, #(0x[0-9a-f]+)\]', op)
        if mn == 'vldr' and m:
            return struct.unpack('<f', armdis.rd(a + 8 + int(m.group(1), 16)))[0]
        m = re.match(r's0, #(\S+)', op)
        if mn == 'vmov.f32' and m: return float(m.group(1))
    return None
for b in [int(x, 16) for x in sys.argv[2:]]:
    nxt = next((s for s in starts if s > b), b + 0x2000)
    i0 = idx.get(b)
    if i0 is None: print(hex(b), 'not in band'); continue
    out, lastgate = [], None
    i = i0
    while i < len(P) and P[i][0] < nxt:
        a, mn, op = P[i]
        if mn in ('bl', 'b') and op.startswith('#'):
            t = int(op[1:], 16)
            if t in (0xb0974, 0xb0968, 0xb09b0):
                lastgate = lit_float(i - 1)
            if t in SETM or t in HELP:
                r1 = None
                for j in range(i - 1, max(i0, i - 10), -1):
                    m = re.match(r'r1, #(0x[0-9a-f]+|\d+)$', P[j][2])
                    if P[j][1] in ('mov', 'movw') and m: r1 = int(m.group(1), 0); break
                if t in SETM:
                    out.append('%s %s' % (SETM[t], ('L%d M%d' % (r1 >> 8, r1 & 0xff)) if r1 is not None else 'r1=?'))
                else:
                    out.append('%s(r1=%s) gate~%s @%x' % (HELP[t], r1, lastgate, a))
        i += 1
    print(hex(b), ' | '.join(out))
