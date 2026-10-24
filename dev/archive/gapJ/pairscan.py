# pairscan.py: in a jdis.py listing, every call (bl / b / blx) whose r1 / r2 were set by an immediate within the 8 lines
# before it (stopping at an earlier call) to one of the wanted (status, n) pairs. Usage: pairscan.py listing...
import sys, re
want = {(1, 8), (1, 0x11), (1, 0x12), (1, 0x14), (1, 0x15), (1, 0xf), (10, 0x8e)}
for fn in sys.argv[1:]:
    L = open(fn).read().splitlines()
    for i, l in enumerate(L):
        m = re.search(r'\s(bl|b|blx)\s+(#0x[0-9a-f]+|r\d+|ip|lr)\s*$', l)
        if not m: continue
        r1 = r2 = None
        for j in range(i - 1, max(-1, i - 9), -1):
            if re.search(r'\s(bl|blx|b|bx)\s', L[j]): break
            mm = re.search(r'\smovw?\s+(r1|r2), #(0x[0-9a-f]+|\d+)\s*$', L[j])
            if mm:
                v = int(mm.group(2), 0)
                if mm.group(1) == 'r1' and r1 is None: r1 = v
                if mm.group(1) == 'r2' and r2 is None: r2 = v
        if (r1, r2) in want:
            print(fn[-14:], l.strip(), 'r1=%#x r2=%#x' % (r1, r2))
