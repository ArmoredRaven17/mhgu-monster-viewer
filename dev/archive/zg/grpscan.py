# grpscan.py lo hi: every immediate store of an EMC group number (3..0x14) into e+0x72fc (base pointer form or [rX, r(0x72fc)] form)
import sys, re, collections
from armdis import dis
lo, hi = int(sys.argv[1], 16), int(sys.argv[2], 16)
res = collections.defaultdict(list)
step = 0x40000
for s0 in range(lo, hi, step):
    L = dis(s0, min(hi, s0 + step + 0x400))
    for k, (a, s) in enumerate(L):
        if a >= s0 + step: break
        m = re.match(r'movw (\w+), #0x72fc$', s)
        if not m: continue
        r = m.group(1)
        win = L[max(0, k - 30):k + 30]
        # form 1: strb v, [b, r]
        for b, x in L[k + 1:k + 14]:
            mm = re.match(r'strb (\w+), \[\w+, ' + r + r'\]!?$', x)
            if mm:
                v = mm.group(1)
                for c, y in reversed(win):
                    if c >= b: continue
                    m2 = re.match(r'mov\w* ' + v + r', #(0x[0-9a-f]+|\d+)$', y)
                    if m2: res[int(m2.group(1), 0)].append(hex(b)); break
                break
        # form 2: ldrb x, [base, r]! then later 'mov v, #n ; strb v, [base]'
        for b, x in L[k + 1:k + 4]:
            mm = re.match(r'(?:ldrb|add) \w+, \[?(\w+), ' + r + r'\]?!?$', x) or re.match(r'add (\w+), \w+, ' + r + '$', x)
            if mm:
                base = mm.group(1)
                for j in range(k, min(len(L), k + 60)):
                    c, y = L[j]
                    m3 = re.match(r'strb (\w+), \[' + base + r'\]$', y)
                    if m3:
                        v = m3.group(1)
                        for c2, y2 in reversed(L[max(0, j - 5):j]):
                            m4 = re.match(r'mov\w* ' + v + r', #(0x[0-9a-f]+|\d+)$', y2)
                            if m4: res[int(m4.group(1), 0)].append(hex(c)); break
                break
for v in sorted(res):
    if 3 <= v <= 0x14: print(hex(v), sorted(set(res[v]))[:12])
