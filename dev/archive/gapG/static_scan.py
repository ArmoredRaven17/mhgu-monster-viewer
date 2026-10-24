# static scan of uEm083_00's band for every shell create (0x48b884): the setup's id (+4) and mode (+8) sources
import re, sys
B = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb\band_uEm083_00.txt'
L = []
for ln in open(B):
    p = ln.split(None, 2)
    if len(p) >= 2:
        try: L.append((int(p[0], 16), p[1], p[2].strip() if len(p) > 2 else ''))
        except ValueError: pass
idx = {a: i for i, (a, _, _) in enumerate(L)}
def src(i, reg, lim=40):
    # nearest preceding write of reg (mov / movw / ldr / add)
    for j in range(i - 1, max(0, i - lim), -1):
        a, m, o = L[j]
        if o.split(',')[0].strip() == reg and m.split('.')[0] in ('mov', 'movw', 'ldr', 'add', 'mvn', 'uxtb', 'ldrb', 'sub', 'orr'):
            return '%x %s %s' % (a, m, o)
    return '(arg/entry %s)' % reg
for i, (a, m, o) in enumerate(L):
    if m in ('bl', 'b') and o == '#0x3fa2bc':
        # the setup is r0 after the alloc; it is moved to r1 (mov r1, r0); find the stores [r1, #4] / [r1, #8] up to the maker
        out = []
        for j in range(i + 1, min(len(L), i + 80)):
            aj, mj, oj = L[j]
            mm = re.match(r'(\w+), \[r1, #(4|8)\]$', oj)
            if mj == 'str' and mm: out.append(('id' if mm.group(2) == '4' else 'mode', src(j, mm.group(1))))
            if mj in ('bl', 'b') and oj == '#0x48b884': out.append(('maker', '%x' % aj)); break
        print('%x alloc:' % a, out)
    if m in ('bl', 'b') and o == '#0x48b884':
        pass
