"""status-7 cases of uEm037_00: n -> (body, the calls with r1..r3 immediates). python cases.py [fn ...] (filter by called fn)"""
import struct, re, sys, os
H = os.path.dirname(os.path.abspath(__file__))
T = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
L = [l.rstrip() for l in open(os.path.join(H, 'cls.txt'))]
ins = []
for l in L:
    try: ins.append((int(l[:8], 16), l[10:18].strip(), l[19:].strip()))
    except ValueError: pass
idx = {a: i for i, (a, m, o) in enumerate(ins)}
LO, HI = 0xe4fe74, 0xe506d0          # the dispatcher and its case bodies
def walk(t):
    regs = {}; i = idx[t]; calls = []
    for _ in range(80):
        a, m, o = ins[i]
        mm = re.match(r'(r\d), #(0x[0-9a-f]+|\d+)$', o)
        if m in ('mov', 'movw') and mm: regs[mm.group(1)] = int(mm.group(2), 0)
        mm = re.match(r'(r\d), (r\d)$', o)
        if m == 'mov' and mm: regs[mm.group(1)] = regs.get(mm.group(2))
        if m == 'bl': calls.append((int(o[1:], 16), regs.get('r1'), regs.get('r2'), regs.get('r3')))
        if m == 'b':
            x = int(o[1:], 16)
            if LO <= x < HI and x in idx: i = idx[x]; continue
            calls.append((x, regs.get('r1'), regs.get('r2'), regs.get('r3'), 'tail')); return calls
        if m.startswith('pop') and 'pc' in o: return calls
        if m == 'bx': return calls
        i += 1
    return calls + ['?']
flt = set(int(x, 16) for x in sys.argv[1:])
for n in range(1, 0x100):
    w = struct.unpack_from('<i', T, 0xe4fea4 + 4 * (n - 1))[0]; t = 0xe4fea4 + w
    c = walk(t)
    if flt and not any(isinstance(x, tuple) and x[0] in flt for x in c): continue
    print('(7, %#04x) body %#x: %s' % (n, t, ' '.join('%#x(%s)' % (x[0], ','.join(str(v) for v in x[1:])) if isinstance(x, tuple) else x for x in c)))
