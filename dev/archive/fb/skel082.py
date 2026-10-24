import re, sys
L = [l.rstrip('\n') for l in open(r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb\band082.txt')]
A = [int(l[:8], 16) for l in L]
idx = {a: i for i, a in enumerate(A)}
for h in sys.argv[1:]:
    i = idx[int(h, 16)]
    print('== %s' % h)
    j = i
    while True:
        l = L[j]; s = l[10:].strip()
        keep = (re.search(r'\bbl\s', s) or re.search(r'mov\s+r1, #', s) or re.search(r'mov\s+r[0-3], #0x[0-9a-f]+$', s)
                or 'b5f5' in s or re.search(r'\bcmp\b', s) or 'str     r0, [r1, #8]' in s or re.search(r'\bb\s+#', s) or 'pop' in s)
        if keep: print('  ' + l[:8] + '  ' + s)
        j += 1
        if j > i and (re.search(r'\bpush\s+\{.*lr\}', L[j][10:]) ): break
