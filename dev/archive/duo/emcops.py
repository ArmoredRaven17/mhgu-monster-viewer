# emcops.py op [op ...]: the EMC interpreter's block for each op (0x83xxx..0x86xxx): from its `strb r0, [sp, #0x1ff]` head
# to its `mov r2, #op ; b 0x854dc` (or its own end), plus the mode-0 handler it branches to (the value)
import sys, re
sys.path.insert(0, r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\duo')
import wd
L = wd.dis(0x82f00, 0x86400)
idx = {int(l[:8], 16): i for i, l in enumerate(L)}
def block(op):
    hits = [i for i, l in enumerate(L) if re.search(r'mov\s+r2, #%#x$' % op, l) and i + 1 < len(L) and '#0x854dc' in L[i + 1]]
    out = []
    for i in hits:
        j = i
        while j > 0 and 'strb      r0, [sp, #0x1ff]' not in L[j]: j -= 1
        out.append('\n'.join(L[j - 1:i + 2]))
        for l in L[j - 1:i]:
            m = re.search(r'b(eq|ne)?\s+#(0x[0-9a-f]+)', l)
            if m and int(m.group(2), 16) not in (0x854dc,) and int(m.group(2), 16) > int(L[i][:8], 16):
                t = int(m.group(2), 16)
                if t in idx:
                    k = idx[t]; e = k
                    while e < len(L) and not re.search(r'\bb\s+#0x854dc|b\s+#0x85', L[e]) and e - k < 60: e += 1
                    out.append('  -> handler %#x:\n' % t + '\n'.join('     ' + x for x in L[k:e + 1]))
    return out
for a in sys.argv[1:]:
    op = int(a, 16)
    print('==== op %#x' % op)
    for b in block(op): print(b); print('--')
