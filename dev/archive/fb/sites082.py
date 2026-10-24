import re
L = [l.rstrip('\n') for l in open(r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb\band082.txt')]
A = [int(l[:8], 16) for l in L]
def fn_start(i):
    while i > 0 and not re.search(r'\bpush\s+\{.*lr\}', L[i]): i -= 1
    return A[i]
def regs_before(i, n=14):
    r = {}
    for j in range(i - 1, max(0, i - n), -1):
        m = re.match(r'[0-9a-f]+\s+(mov|movw|mvn)\s+(r[0-3]), #(-?0x[0-9a-f]+|-?\d+)$', L[j].strip())
        if m and m.group(2) not in r:
            v = int(m.group(3), 0); r[m.group(2)] = ~v if m.group(1) == 'mvn' else v
        if re.search(r'\bbl\s', L[j]) and j != i: break
    return r
def tune_before(i, n=40):
    out = []
    for j in range(i - 1, max(0, i - n), -1):
        m = re.match(r'[0-9a-f]+\s+mov\s+r1, #(0x[0-9a-f]+|\d+)$', L[j].strip())
        if m and 'bl      #0x6f618' in L[j + 1]: out.append(int(m.group(1), 0))
    return out
for i, l in enumerate(L):
    m = re.search(r'\bbl\s+#0x(104b540|104a298|104cdb4)\b', l)
    if not m: continue
    print('%08x in %08x  %s  %s' % (A[i], fn_start(i), m.group(1), regs_before(i)))
